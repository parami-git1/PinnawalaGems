const LOCAL_VARIANTS = {
  '/images/home-ceylon-ivory-hero-mobile-v1.webp': [[480, '/images/perf-home-ceylon-ivory-hero-mobile-480-v1.webp'], [900, '/images/home-ceylon-ivory-hero-mobile-v1.webp']],
  '/gem.png': [[300, '/images/perf-gem-300-v1.webp']],
  '/logo.png': [[160, '/images/perf-logo-160-v1.webp'], [320, '/images/perf-logo-320-v1.webp']],
  '/assistant.png': [[224, '/images/perf-assistant-224-v1.webp'], [408, '/images/perf-assistant-408-v1.webp']],
  '/image_27d308.png': [[192, '/images/perf-admin-brand-192-v1.webp']],
  '/workshop-hero.png': [[640, '/images/perf-workshop-hero-640-v1.webp'], [1280, '/images/perf-workshop-hero-1280-v1.webp'], [1774, '/images/perf-workshop-hero-1774-v1.webp']],
  '/contact-hero-v2.png': [[640, '/images/perf-contact-hero-640-v1.webp'], [1280, '/images/perf-contact-hero-1280-v1.webp'], [1774, '/images/perf-contact-hero-1774-v1.webp']],
};

export function imageDelivery(value, { width = 800, sizes = '100vw' } = {}) {
  const original = typeof value === 'string' ? value.trim() : '';
  if (!original) return { src: '', original };
  const local = LOCAL_VARIANTS[original];
  if (local) {
    const variants = local.filter(([size], index) => size <= width || index === 0);
    const selected = variants.at(-1);
    return { src: selected[1], srcSet: variants.length > 1 ? variants.map(([size, url]) => `${url} ${size}w`).join(', ') : undefined, sizes, original };
  }
  try {
    const parsed = new URL(original);
    if (parsed.hostname !== 'res.cloudinary.com' || parsed.protocol !== 'https:' || !parsed.pathname.includes('/image/upload/') || parsed.pathname.includes('/s--')) return { src: original, original };
    const [prefix, tail] = original.split('/image/upload/');
    const suffix = tail.replace(/^f_auto,q_auto,c_limit,w_\d+\//, '');
    // Preserve signed URLs and custom crop/effect pipelines exactly as supplied.
    if (!/^(?:v\d+\/)?[^/]+(?:\/|\.)/.test(suffix) || /^[a-z]{1,4}_[^/]+\//i.test(suffix)) return { src: original, original };
    const url = (pixels) => `${prefix}/image/upload/f_auto,q_auto,c_limit,w_${pixels}/${suffix}`;
    const widths = [...new Set([240, 360, 480, 640, 800, 1200, 1600, width].filter((pixels) => pixels <= width))].sort((a, b) => a - b);
    return { src: url(width), srcSet: widths.map((pixels) => `${url(pixels)} ${pixels}w`).join(', '), sizes, original };
  } catch { return { src: original, original }; }
}

export const IMAGE_PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f4f3ef"/><g stroke="#c7b898" fill="none" stroke-width="1.2" opacity=".65"><path d="M82 80h36l16 20-34 30-34-30 16-20ZM66 100h68M82 80l18 50 18-50M82 80l18 20 18-20"/></g></svg>')}`;
export const IMAGE_UNAVAILABLE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="200" viewBox="0 0 240 200"><rect width="240" height="200" fill="#f4f3ef"/><g stroke="#baa982" fill="none" stroke-width="1.2"><path d="M102 62h36l16 20-34 30-34-30 16-20ZM86 82h68M102 62l18 50 18-50"/></g><text x="120" y="145" text-anchor="middle" fill="#737b85" font-family="Arial,sans-serif" font-size="11">Image unavailable</text></svg>')}`;
