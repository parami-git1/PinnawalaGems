// Use the same responsive candidates as the hero image; do not preload other routes.
if (window.location.pathname === '/') {
  var pgHeroPreload = document.createElement('link');
  pgHeroPreload.rel = 'preload';
  pgHeroPreload.as = 'image';
  pgHeroPreload.fetchPriority = 'high';
  if (window.matchMedia('(max-width: 599px)').matches) {
    pgHeroPreload.href = '/images/home-ceylon-ivory-hero-mobile-v1.webp';
    pgHeroPreload.imageSrcset = '/images/perf-home-ceylon-ivory-hero-mobile-480-v1.webp 480w, /images/home-ceylon-ivory-hero-mobile-v1.webp 900w';
    pgHeroPreload.imageSizes = '100vw';
  } else {
    pgHeroPreload.href = '/images/home-ceylon-ivory-hero-v1.webp';
  }
  document.head.appendChild(pgHeroPreload);
}
