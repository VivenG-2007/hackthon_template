# AI Storage Service - Python FastAPI

This is a Python FastAPI implementation of the AI Storage Service, converted from the original Node.js/Express version.

## Features

- **AI Chat API**: Multiple AI provider support (OpenAI, Azure OpenAI, Groq, Mock)
- **Conversation Persistence**: MongoDB-based conversation storage
- **Caching**: Redis-based response caching
- **Authentication**: JWT-based auth with RS256 verification
- **Rate Limiting**: Configurable rate limits per endpoint
- **File Storage**: Azure Blob Storage integration

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
- `AI_PROVIDER`: Choose from `mock`, `openai`, `azure-openai`, `groq`
- `AI_API_KEY`: Your AI provider API key
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string
- `JWT_PUBLIC_KEY_BASE64`: Base64-encoded public key for JWT verification

## Running

Development:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 5002
```

Production:
```bash
uvicorn main:app --host 0.0.0.0 --port 5002 --workers 4
```

## API Endpoints

### Health & Metrics
- `GET /health` - Service health check
- `GET /ready` - Readiness check with dependency status
- `GET /metrics` - Service metrics and memory usage

### AI Endpoints (Authentication Required)
- `POST /api/ai/chat` - Conversational AI with persistence
- `POST /api/ai/generate` - Single-shot generation (no persistence)
- `POST /api/ai/analyze` - Structured analysis with instructions

## Architecture

- **FastAPI**: Modern async web framework
- **Motor**: Async MongoDB driver
- **Redis-py**: Async Redis client
- **HTTPX**: Async HTTP client for AI provider APIs
- **Pydantic**: Data validation and settings management
- **python-jose**: JWT handling
- **SlowAPI**: Rate limiting
- **Loguru**: Structured logging

## AI Providers

The service supports multiple AI providers through a pluggable interface:

- **mock**: Zero-dependency mock provider for testing
- **openai**: OpenAI API
- **azure-openai**: Azure OpenAI Service
- **groq**: Groq API (OpenAI-compatible)

Add new providers by creating a module in `services/ai_providers/` and registering in `provider_factory.py`.
