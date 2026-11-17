// Discover the existing default hero before the application bundle is evaluated.
// Other routes do not download homepage artwork.
if (window.location.pathname === '/') {
  var pgHeroPreload = document.createElement('link');
  pgHeroPreload.rel = 'preload';
  pgHeroPreload.as = 'image';
  pgHeroPreload.fetchPriority = 'high';
  pgHeroPreload.href = window.matchMedia('(max-width: 599px)').matches ? '/images/home-ceylon-ivory-hero-mobile-v1.webp' : '/images/home-ceylon-ivory-hero-v1.webp';
  document.head.appendChild(pgHeroPreload);
}
