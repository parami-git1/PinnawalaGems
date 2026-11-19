const COLLECTION_BANNER = '/images/collection-sapphire-editorial-v1.webp';

export const CATEGORY_BANNER_ASSETS = Object.freeze({
  'blue sapphire': '/images/category-blue-sapphire-banner-v2-1600.webp',
  'yellow sapphire': '/images/category-yellow-sapphire-banner-v2-1600.webp',
  'orange sapphire': '/images/category-orange-sapphire-banner-v2-1600.webp',
  ruby: '/images/category-ruby-banner-v2-1600.webp',
  'pink sapphire': '/images/category-pink-sapphire-banner-v2-1600.webp',
});

// These earlier category covers predate the coordinated banner set.
const LEGACY_COVERS = Object.freeze({
  'yellow sapphire': 'https://res.cloudinary.com/dbqkzxsp/image/upload/v1787233559/pinnawala_gems/gbcw5dpjvbofrr5wygcf.jpg',
  'orange sapphire': 'https://res.cloudinary.com/dbqkzxsp/image/upload/v1783933782/pinnawala_gems/onpxwigphvna2wkuxzpr.jpg',
  'pink sapphire': 'https://res.cloudinary.com/dbqkzxsp/image/upload/v1783930875/pinnawala_gems/wdofvwsnwrwquo5eaokt.jpg',
});

function categoryKey(category) {
  for (const value of [category?.title, category?.slug, category?.name]) {
    if (typeof value !== 'string') continue;
    const normalized = value.trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ');
    if (Object.hasOwn(CATEGORY_BANNER_ASSETS, normalized)) return normalized;
  }
  return '';
}

export function getDefaultCategoryBanner(category) {
  return CATEGORY_BANNER_ASSETS[categoryKey(category)] || COLLECTION_BANNER;
}

export function getCategoryBanner(category) {
  const cover = typeof category?.coverImage === 'string' ? category.coverImage.trim() : '';
  const key = categoryKey(category);
  return cover && cover !== LEGACY_COVERS[key] ? cover : getDefaultCategoryBanner(category);
}
