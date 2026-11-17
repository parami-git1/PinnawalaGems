import { useState } from 'react';

export default function CollectionBanner({ category, all }) {
  const [coverFailed, setCoverFailed] = useState(false);
  const categoryCover = !all && category.coverImage;
  return <header className={`gem-collection-banner${all ? ' gem-collection-banner--all' : ''}`} aria-labelledby="gem-collection-title">
    <img className="gem-collection-banner__cover" src={categoryCover && !coverFailed ? categoryCover : '/images/collection-sapphire-editorial-v1.webp'} alt="" fetchPriority="high" width="1536" height="1024" onError={() => setCoverFailed(true)} />
    <div className="gem-collection-banner__veil" />
    <div className="gem-collection-banner__copy">
      <p className="collection-eyebrow">Pinnawala Gems</p>
      <h1 id="gem-collection-title">{all ? 'The collection' : category.title || 'The collection'}</h1>
    </div>
    <span className="gem-collection-banner__signature">Ceylon · Sri Lanka</span>
  </header>;
}
