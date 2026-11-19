export const CONTACT_HERO = '/images/perf-contact-hero-1774-v1.webp';
export const CONTACT_SRCSET = '/images/perf-contact-hero-640-v1.webp 640w, /images/perf-contact-hero-1280-v1.webp 1280w, /images/perf-contact-hero-1774-v1.webp 1774w';
export const CONTACT_SIZES = '(max-width:599px) 1100px,100vw';
export const FEEDBACK_STARTER = '/images/feedback-atelier-starter-v1.webp';
export const FEEDBACK_SRCSET = '/images/feedback-atelier-starter-640-v1.webp 640w, /images/feedback-atelier-starter-v1.webp 1000w, /images/feedback-atelier-starter-1536-v1.webp 1536w';
export const FEEDBACK_SIZES = '(max-width:1023px) 100vw,45vw';

const warmed = new Set();

// Request just the intended destination's visual; other routes stay untouched.
export function warmPageHero(pathname, priority = 'low') {
  const config = pathname === '/contact' ? [CONTACT_HERO, CONTACT_SRCSET, CONTACT_SIZES]
    : pathname === '/feedback' ? [FEEDBACK_STARTER, FEEDBACK_SRCSET, FEEDBACK_SIZES] : null;
  if (!config || warmed.has(pathname)) return;
  warmed.add(pathname);
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = config[0];
  link.imageSrcset = config[1];
  link.imageSizes = config[2];
  link.fetchPriority = priority;
  document.head.appendChild(link);
}
