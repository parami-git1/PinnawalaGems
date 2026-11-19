import { useState } from 'react';
import ResponsiveImage from './ResponsiveImage';
import { CATEGORY_BANNER_ASSETS, getCategoryBanner, getDefaultCategoryBanner } from './categoryBannerAssets';

export default function CollectionBanner({ category = {}, all }) {
  const [failedSource, setFailedSource] = useState('');
  const categoryCover = all ? '/images/collection-sapphire-editorial-v1.webp' : getCategoryBanner(category);
  const defaultCover = all ? '/images/collection-sapphire-editorial-v1.webp' : getDefaultCategoryBanner(category);
  const source = failedSource === categoryCover ? defaultCover : categoryCover;
  const curated = Object.values(CATEGORY_BANNER_ASSETS).includes(source);
  return <header className={`gem-collection-banner${all ? ' gem-collection-banner--all' : ''}${curated ? ' gem-collection-banner--curated' : ''}`} aria-labelledby="gem-collection-title">
    <ResponsiveImage className="gem-collection-banner__cover" src={source} alt="" fetchPriority="high" loading="eager" maxWidth={1600} sizes={curated ? '(max-width:1023px) 100vw,760px' : '100vw'} width={curated ? 1600 : 1536} height={curated ? 533 : 1024} onError={() => setFailedSource(categoryCover)} />
    <div className="gem-collection-banner__veil" />
    <div className="gem-collection-banner__copy">
      <p className="collection-eyebrow">Pinnawala Gems</p>
      <h1 id="gem-collection-title">{all ? 'The collection' : category.title || 'The collection'}</h1>
    </div>
    <span className="gem-collection-banner__signature">Ceylon · Sri Lanka</span>
  </header>;
}
