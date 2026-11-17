const express = require('express');
const multer = require('multer');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const cloudinary = require('cloudinary').v2;
const requireAdmin = require('../middleware/adminAuth');
const { MEDIA_LIMITS, MEDIA_TYPES, mediaError, matchesSignature } = require('../utils/gemMedia');

const router = express.Router();
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, done) => done(null, req.mediaTempDir),
    filename: (_req, _file, done) => done(null, randomUUID()),
  }),
  // Multer 2.2 emits its limit event at the boundary; check the exact limit below.
  limits: { fileSize: MEDIA_LIMITS.videoBytes + 1, files: 1, fields: 0, parts: 2 },
  fileFilter: (_req, file, done) => done(MEDIA_TYPES[file.mimetype] ? null : mediaError('Choose a JPEG, PNG, WebP, MP4 or WebM file.'), Boolean(MEDIA_TYPES[file.mimetype])),
}).single('file');

router.post('/upload', requireAdmin, async (req, res) => {
  let temporaryDirectory;
  const cleanup = async () => {
    if (temporaryDirectory) await fs.rm(temporaryDirectory, { recursive: true, force: true }).catch(() => {});
  };
  try {
    temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'pinnawala-gem-'));
    req.mediaTempDir = temporaryDirectory;
    res.once('close', cleanup);
    await new Promise((resolve, reject) => upload(req, res, (error) => error ? reject(error) : resolve()));
    if (!req.file || !req.file.size) throw mediaError('Choose a photo or video to upload.');
    const resourceType = MEDIA_TYPES[req.file.mimetype];
    const limit = resourceType === 'image' ? MEDIA_LIMITS.imageBytes : MEDIA_LIMITS.videoBytes;
    if (req.file.size > limit) throw mediaError(resourceType === 'image' ? 'Each photo must be 8 MB or smaller.' : 'Each video must be 50 MB or smaller.', 413);
    const handle = await fs.open(req.file.path, 'r');
    const header = Buffer.alloc(32);
    let bytesRead;
    try { ({ bytesRead } = await handle.read(header, 0, header.length, 0)); } finally { await handle.close(); }
    if (!matchesSignature(header.subarray(0, bytesRead), req.file.mimetype)) throw mediaError('This file does not match its photo or video format. Export it as JPEG, PNG, WebP, MP4 or WebM and try again.');
    let uploaded;
    try {
      uploaded = await cloudinary.uploader.upload(req.file.path, { resource_type: resourceType, folder: 'pinnawala_gems', timeout: 120000 });
    } catch { throw mediaError('The media upload could not be completed. Please try this file again.', 502); }
    if (!uploaded?.secure_url) throw mediaError('The media upload did not return a URL. Please try again.', 502);
    await cleanup();
    res.status(201).json({ url: uploaded.secure_url, resourceType, bytes: req.file.size, publicId: uploaded.public_id, width: uploaded.width, height: uploaded.height, ...(resourceType === 'video' ? { duration: uploaded.duration } : {}) });
  } catch (error) {
    await cleanup();
    if (res.destroyed) return;
    if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'Each video must be 50 MB or smaller; each photo must be 8 MB or smaller.' });
    if (error instanceof multer.MulterError) return res.status(400).json({ message: 'Upload one file per request. Select multiple files in the gallery to upload them in sequence.' });
    res.status(error.status || 500).json({ message: error.status ? error.message : 'Unable to prepare the upload. Please try again.' });
  } finally { res.removeListener('close', cleanup); await cleanup(); }
});

module.exports = router;
