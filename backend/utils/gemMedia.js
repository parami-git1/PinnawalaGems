const cloudinary = require('cloudinary').v2;

const MEDIA_LIMITS = Object.freeze({ maxImages: 10, maxVideos: 2, imageBytes: 8 * 1024 * 1024, videoBytes: 50 * 1024 * 1024 });
const MEDIA_TYPES = Object.freeze({ 'image/jpeg': 'image', 'image/png': 'image', 'image/webp': 'image', 'video/mp4': 'video', 'video/webm': 'video' });

function mediaError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function mediaUrl(value, label, allowRelative = false) {
  if (typeof value !== 'string') throw mediaError(`${label} must be an image or video URL.`);
  const clean = value.trim();
  if (!clean || clean.length > 2048) throw mediaError(`${label} must be a valid URL.`);
  if (allowRelative && /^\/(?!\/)/.test(clean)) return clean;
  try {
    const parsed = new URL(clean);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error();
  } catch { throw mediaError(`${label} must start with https:// or http://.`); }
  return clean;
}

function urlList(value, label, allowRelative = false) {
  if (!Array.isArray(value)) throw mediaError(`${label} must be a list of URLs.`);
  return [...new Set(value.map((url) => mediaUrl(url, label, allowRelative)))];
}

// Normalize only submitted media fields so older partial edits keep their media.
function normalizeGemMedia(body, existing = {}) {
  const result = {};
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);
  if (has('image')) result.image = mediaUrl(body.image, 'Cover image', true);
  if (has('additionalImages')) result.additionalImages = urlList(body.additionalImages, 'Additional images', true);
  if (has('videos')) {
    result.videos = urlList(body.videos, 'Videos');
    if (result.videos.length > MEDIA_LIMITS.maxVideos) throw mediaError('Add up to 2 videos per gemstone.');
    if (result.videos.some((url) => !/\.(mp4|webm)$/i.test(new URL(url).pathname))) throw mediaError('Gemstone videos must be MP4 or WebM files.');
  }
  if (has('image') || has('additionalImages')) {
    const cover = result.image ?? existing.image;
    const additional = result.additionalImages ?? existing.additionalImages ?? [];
    const unique = [...new Set([cover, ...additional].filter(Boolean))];
    if (unique.length > MEDIA_LIMITS.maxImages) throw mediaError('Add up to 10 images per gemstone, including the cover.');
    if (has('additionalImages')) result.additionalImages = result.additionalImages.filter((url) => url !== cover);
  }
  return result;
}

function matchesSignature(header, mimetype) {
  if (mimetype === 'image/jpeg') return header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  if (mimetype === 'image/png') return header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimetype === 'image/webp') return header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP';
  if (mimetype === 'video/mp4') return header.length >= 12 && header.toString('ascii', 4, 8) === 'ftyp';
  if (mimetype === 'video/webm') return header.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  return false;
}

async function deleteVideoMedia(videos = []) {
  for (const video of new Set(videos)) {
    let parsed;
    try { parsed = new URL(video); } catch { continue; }
    const cloudName = cloudinary.config().cloud_name;
    if (parsed.hostname !== 'res.cloudinary.com' || (cloudName && parsed.pathname.split('/')[1] !== cloudName)) continue;
    const match = parsed.pathname.match(/\/video\/upload\/(?:v\d+\/)?(pinnawala_gems\/[^?]+)\.[^./]+$/);
    if (match) await cloudinary.uploader.destroy(decodeURIComponent(match[1]), { resource_type: 'video', invalidate: true });
  }
}

module.exports = { MEDIA_LIMITS, MEDIA_TYPES, mediaError, normalizeGemMedia, matchesSignature, deleteVideoMedia };
