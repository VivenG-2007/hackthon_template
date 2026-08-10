# Complete Step-by-Step Deployment Guide

This guide provides an end-to-end walkthrough for local development and deploying the **Hackathon Platform Template** (1 Next.js Frontend + 3 Express Backend Microservices) across **Vercel** and **Azure App Service**.

---

## 1. Key Matrix & Security Architecture

This platform uses **RS256 (asymmetric JWT signing)**.
* **`auth-service`** holds the **Private Key** (signs tokens) and the **Public Key** (verifies refresh tokens).
* **`main-service`**, **`ai-storage-service`**, and **`frontend`** hold **ONLY** the **Public Key** (verify access tokens locally without network hops).

| Target Service | `JWT_PRIVATE_KEY_BASE64` | `JWT_PUBLIC_KEY_BASE64` | Role |
|---|:---:|:---:|---|
| **`services/auth-service`** |  **YES** |  **YES** | Signs new tokens, verifies refresh tokens |
| **`services/main-service`** | ❌ NO |  **YES** | Verifies access tokens, proxies AI calls |
| **`services/ai-storage-service`** | ❌ NO |  **YES** | Verifies access tokens, runs AI/Blob ops |
| **`frontend`** | ❌ NO |  **YES** | Edge middleware session validation |

---

## 2. Prerequisites & Key Generation

1. Clone the repository and install all dependencies across workspace subfolders:
   ```bash
   git clone <your-repo-url>
   cd hackathon-platform
   npm run install:all
   ```

2. Generate a fresh RS256 RSA keypair:
   ```bash
   npm run generate-keys
   ```
   *Copy both base64 key strings printed in the terminal for the next steps.*

---

## 3. Local Development (Docker & Without Docker)

### Option A: With Docker Compose
```bash
npm run docker:up
```
* Starts MongoDB 7, Redis 7, `auth-service` (:5000), `main-service` (:5001), `ai-storage-service` (:5002), and `frontend` (:3000).

### Option B: Without Docker (Concurrent Node Processes)
Ensure MongoDB (port 27017) and Redis (port 6379) are running, then run:
```bash
npm run dev
```

---

## 4. Azure Production Deployment (3 Backend Microservices)

### Step 4.1: Provision Azure App Services
Run the following Azure CLI commands to create 3 independent Linux Node 18 App Services:

```bash
# Create Resource Group
az group create --name hackathon-rg --location eastus

# 1. Create auth-service App Service
az appservice plan create --name plan-auth --resource-group hackathon-rg --sku B1 --is-linux
az webapp create --name my-auth-service --resource-group hackathon-rg --plan plan-auth --runtime "NODE:18-lts"

# 2. Create main-service App Service
az appservice plan create --name plan-main --resource-group hackathon-rg --sku B1 --is-linux
az webapp create --name my-main-service --resource-group hackathon-rg --plan plan-main --runtime "NODE:18-lts"

# 3. Create ai-storage-service App Service
az appservice plan create --name plan-ai --resource-group hackathon-rg --sku B1 --is-linux
az webapp create --name my-ai-service --resource-group hackathon-rg --plan plan-ai --runtime "NODE:18-lts"
```

### Step 4.2: Configure Environment Settings

```bash
# Configure auth-service
az webapp config appsettings set --name my-auth-service --resource-group hackathon-rg \
  --settings JWT_PRIVATE_KEY_BASE64="<YOUR_PRIVATE_KEY_BASE64>" \
             JWT_PUBLIC_KEY_BASE64="<YOUR_PUBLIC_KEY_BASE64>" \
             MONGODB_URI="<YOUR_MONGODB_ATLAS_URI>" \
             CORS_ORIGINS="https://your-app.vercel.app"

# Configure main-service
az webapp config appsettings set --name my-main-service --resource-group hackathon-rg \
  --settings JWT_PUBLIC_KEY_BASE64="<YOUR_PUBLIC_KEY_BASE64>" \
             REDIS_URL="<YOUR_REDIS_URI>" \
             SUPABASE_URL="<YOUR_SUPABASE_URL>" \
             SUPABASE_SERVICE_ROLE_KEY="<YOUR_SUPABASE_KEY>" \
             AI_STORAGE_SERVICE_URL="https://my-ai-service.azurewebsites.net" \
             CORS_ORIGINS="https://your-app.vercel.app"

# Configure ai-storage-service
az webapp config appsettings set --name my-ai-service --resource-group hackathon-rg \
  --settings JWT_PUBLIC_KEY_BASE64="<YOUR_PUBLIC_KEY_BASE64>" \
             MONGODB_URI="<YOUR_MONGODB_ATLAS_URI>" \
             REDIS_URL="<YOUR_REDIS_URI>" \
             AZURE_STORAGE_CONNECTION_STRING="<YOUR_AZURE_BLOB_CONN_STR>" \
             AI_PROVIDER="openai" \
             AI_API_KEY="<YOUR_OPENAI_KEY>"
```

### Step 4.3: Configure Automated GitHub Actions CI/CD

Add these secrets to your GitHub repository (**Settings > Secrets and variables > Actions**):
* `AZURE_TENANT_ID`
* `AZURE_SUBSCRIPTION_ID`
* `AUTH_SERVICE_AZURE_CLIENT_ID` & `AUTH_SERVICE_AZURE_APP_NAME` (`my-auth-service`)
* `MAIN_SERVICE_AZURE_CLIENT_ID` & `MAIN_SERVICE_AZURE_APP_NAME` (`my-main-service`)
* `AI_STORAGE_SERVICE_AZURE_CLIENT_ID` & `AI_STORAGE_SERVICE_AZURE_APP_NAME` (`my-ai-service`)

> On every `git push` to `main`, GitHub Actions will check path triggers and automatically deploy changed services.

---

## 5. Vercel Production Deployment (Frontend)

1. Log into **Vercel** and select **Add New > Project**.
2. Import your GitHub repository.
3. In **Build and Output Settings**:
   * Set **Root Directory** to `frontend`.
4. In **Environment Variables**, add:
   * `NEXT_PUBLIC_AUTH_API_URL` = `https://my-auth-service.azurewebsites.net`
   * `NEXT_PUBLIC_MAIN_API_URL` = `https://my-main-service.azurewebsites.net`
   * `JWT_PUBLIC_KEY_BASE64` = `<YOUR_PUBLIC_KEY_BASE64>`
   * `JWT_ISSUER` = `hackathon-auth-service`
   * `JWT_AUDIENCE` = `hackathon-platform`
5. Click **Deploy**.

---

## 6. Load Testing & Benchmarking

To verify performance under load, run autocannon load tests from your laptop against your deployed Azure environment:

```bash
npm install
TARGET_URL=https://my-main-service.azurewebsites.net npm run loadtest:main
```

---

## 7. Troubleshooting Matrix

| Symptom | Cause | Solution |
|---|---|---|
| `401 Unauthorized` on all requests | Mismatched RSA public key | Ensure `JWT_PUBLIC_KEY_BASE64` matches `auth-service`'s private key across all services. |
| CORS Error in browser console | Frontend domain missing in backend CORS allowlist | Add Vercel URL to `CORS_ORIGINS` on `auth-service` and `main-service`. |
| `MODULE_NOT_FOUND autocannon` | Root dependencies not installed | Run `npm install` in the root project folder. |
