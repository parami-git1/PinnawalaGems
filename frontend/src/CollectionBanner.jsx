import { useRef, useState } from 'react';
import ResponsiveImage from './ResponsiveImage';
import { CATEGORY_BANNER_ASSETS, getCategoryBanner, getDefaultCategoryBanner } from './categoryBannerAssets';
import './CollectionBanner.css';

function BannerImage({ source, curated, onFailure }) {
  const [state, setState] = useState('loading');
  const [retry, setRetry] = useState(0);
  const pendingDecode = useRef(0);
  const reveal = (event) => {
    // Keep the native request high priority, but do not expose progressive image
    // painting. Decode this exact, fully downloaded candidate before fading it in.
    const image = event.currentTarget;
    const selected = image.currentSrc;
    const revision = ++pendingDecode.current;
    const complete = () => {
      if (revision === pendingDecode.current && image.isConnected && image.currentSrc === selected && image.complete && image.naturalWidth) setState('ready');
    };
    if (typeof image.decode === 'function') image.decode().then(complete, complete);
    else complete();
  };
  const fail = () => {
    pendingDecode.current += 1;
    setState('error');
    onFailure?.();
  };
  return <>
    <ResponsiveImage className={`gem-collection-banner__cover${curated ? ' gem-collection-banner__cover--curated' : ''}`} src={source} alt="" aria-hidden="true" fetchPriority="high" loading="eager" maxWidth={1600} sizes={curated ? '(max-width:1023px) 100vw,760px' : '100vw'} width={curated ? 1600 : 1536} height={curated ? 533 : 1024} fade={false} retryKey={retry} data-banner-state={state} onLoad={reveal} onError={fail} />
    {state === 'error' && !onFailure && <button className="gem-collection-banner__retry" type="button" onClick={() => { setState('loading'); setRetry((value) => value + 1); }}>Image unavailable · Retry</button>}
  </>;
}

function BannerArtwork({ cover, fallback }) {
  const [failed, setFailed] = useState(false);
  const source = failed ? fallback : cover;
  const curated = Object.values(CATEGORY_BANNER_ASSETS).includes(source);
  return <BannerImage key={source} source={source} curated={curated} onFailure={source !== fallback ? () => setFailed(true) : undefined} />;
}

export default function CollectionBanner({ category = {}, all, pending = false }) {
  const categoryCover = all ? '/images/collection-sapphire-editorial-v1.webp' : getCategoryBanner(category);
  const defaultCover = all ? '/images/collection-sapphire-editorial-v1.webp' : getDefaultCategoryBanner(category);
  const curated = Object.values(CATEGORY_BANNER_ASSETS).includes(categoryCover);
  return <header className={`gem-collection-banner${all ? ' gem-collection-banner--all' : ''}${curated ? ' gem-collection-banner--curated' : ''}`} aria-labelledby="gem-collection-title">
    {!pending && <BannerArtwork key={categoryCover} cover={categoryCover} fallback={defaultCover} />}
    <div className="gem-collection-banner__veil" />
    <div className="gem-collection-banner__copy">
      <p className="collection-eyebrow">Pinnawala Gems</p>
      <h1 id="gem-collection-title">{all ? 'The collection' : category.title || 'The collection'}</h1>
    </div>
    <span className="gem-collection-banner__signature">Ceylon · Sri Lanka</span>
  </header>;
}
