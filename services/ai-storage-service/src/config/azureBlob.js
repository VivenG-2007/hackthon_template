const { BlobServiceClient } = require('@azure/storage-blob');
const env = require('./env');
const logger = require('./logger');

let containerClient = null;

function getContainerClient() {
  if (!env.azure.connectionString) {
    logger.warn('Azure Blob not configured — AZURE_STORAGE_CONNECTION_STRING missing');
    return null;
  }
  if (!containerClient) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(env.azure.connectionString);
    containerClient = blobServiceClient.getContainerClient(env.azure.container);
  }
  return containerClient;
}

async function ensureContainer() {
  const client = getContainerClient();
  if (!client) return;
  await client.createIfNotExists(); // private by default — access files only via signed/service-mediated URLs
  logger.info(`Azure Blob container ready: ${env.azure.container}`);
}

module.exports = { getContainerClient, ensureContainer };
