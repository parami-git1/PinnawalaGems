const cloudinary = require('cloudinary').v2;

function cloudinaryAsset(value, resourceType = 'image') {
  let parsed;
  try { parsed = new URL(value); } catch { return null; }
  const cloud = cloudinary.config().cloud_name;
  if (!cloud || parsed.hostname !== 'res.cloudinary.com' || parsed.pathname.split('/')[1] !== cloud) return null;
  const marker = `/${resourceType}/upload/`;
  const start = parsed.pathname.indexOf(marker);
  if (start < 0) return null;
  const publicId = decodeURIComponent(parsed.pathname.slice(start + marker.length).replace(/^v\d+\//, '').replace(/\.[^/.]+$/, ''));
  // Only remove this application's own upload folder; never a foreign account/asset.
  return publicId.startsWith('pinnawala_gems/') ? publicId : null;
}
async function deleteAssets(urls, resourceType = 'image') {
  for (const value of new Set(urls.filter(Boolean))) {
    const publicId = cloudinaryAsset(value, resourceType);
    if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
  }
}
async function deleteStoneAssets(stone) {
  await deleteAssets([stone.image, stone.certificateImage, ...(stone.additionalImages || [])]);
  await deleteAssets(stone.videos || [], 'video');
}
module.exports = { cloudinaryAsset, deleteAssets, deleteStoneAssets };
