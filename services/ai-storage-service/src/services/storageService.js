const { v4: uuid } = require('uuid');
const path = require('path');
const { getContainerClient } = require('../config/azureBlob');
const FileAsset = require('../models/FileAsset');
const env = require('../config/env');

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-150);
}

// Streams the buffer straight to Blob Storage (uploadData here is fine for the
// multer-memory buffer we receive; for very large files switch multer to disk
// storage + client.uploadStream so nothing large sits fully in process memory).
async function uploadFile({ ownerId, buffer, originalName, mimeType }) {
  const client = getContainerClient();
  if (!client) {
    const err = new Error('Azure Blob Storage not configured');
    err.status = 503;
    throw err;
  }
  const safeName = sanitizeFilename(originalName || 'upload');
  const blobName = `${ownerId}/${uuid()}${path.extname(safeName)}`;
  const blockBlobClient = client.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: mimeType },
  });

  const asset = await FileAsset.create({
    ownerId,
    blobName,
    originalName: safeName,
    mimeType,
    sizeBytes: buffer.length,
    container: env.azure.container,
  });

  return asset;
}

async function getDownloadStream({ ownerId, id }) {
  const asset = await FileAsset.findOne({ _id: id, ownerId });
  if (!asset) return null;
  const client = getContainerClient();
  if (!client) {
    const err = new Error('Azure Blob Storage not configured');
    err.status = 503;
    throw err;
  }
  const blockBlobClient = client.getBlockBlobClient(asset.blobName);
  const download = await blockBlobClient.download();
  return { asset, stream: download.readableStreamBody };
}

async function deleteFile({ ownerId, id }) {
  const asset = await FileAsset.findOne({ _id: id, ownerId });
  if (!asset) return false;
  const client = getContainerClient();
  if (client) {
    const blockBlobClient = client.getBlockBlobClient(asset.blobName);
    await blockBlobClient.deleteIfExists();
  }
  await asset.deleteOne();
  return true;
}

module.exports = { uploadFile, getDownloadStream, deleteFile };
