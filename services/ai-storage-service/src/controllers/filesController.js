const { uploadFile, getDownloadStream, deleteFile } = require('../services/storageService');
const FileAsset = require('../models/FileAsset');

async function upload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file provided (field name: "file")', code: 'NO_FILE', requestId: req.id } });
    }
    const asset = await uploadFile({
      ownerId: req.user.id,
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    });
    return res.status(201).json({ file: asset });
  } catch (err) {
    return next(err);
  }
}

async function download(req, res, next) {
  try {
    const result = await getDownloadStream({ ownerId: req.user.id, id: req.params.id });
    if (!result) return res.status(404).json({ error: { message: 'File not found', code: 'NOT_FOUND', requestId: req.id } });
    res.setHeader('content-type', result.asset.mimeType);
    res.setHeader('content-disposition', `attachment; filename="${result.asset.originalName}"`);
    // Stream straight through — never buffer the whole file in memory.
    return result.stream.pipe(res);
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const ok = await deleteFile({ ownerId: req.user.id, id: req.params.id });
    if (!ok) return res.status(404).json({ error: { message: 'File not found', code: 'NOT_FOUND', requestId: req.id } });
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

async function list(req, res, next) {
  try {
    const files = await FileAsset.find({ ownerId: req.user.id }).sort({ createdAt: -1 }).limit(100);
    return res.status(200).json({ files });
  } catch (err) {
    return next(err);
  }
}

module.exports = { upload, download, remove, list };
