export const GEM_MEDIA_LIMITS = Object.freeze({ images: 10, videos: 2, imageBytes: 8 * 1024 * 1024, videoBytes: 50 * 1024 * 1024 });
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const VIDEO_TYPES = ['video/mp4', 'video/webm'];

export function mediaUrls(value) {
  const values = Array.isArray(value) ? value : String(value || '').split(/\r?\n/);
  return [...new Set(values.filter((url) => typeof url === 'string').map((url) => url.trim()).filter(Boolean))];
}
