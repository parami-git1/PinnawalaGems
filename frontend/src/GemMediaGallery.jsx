import { useEffect, useId, useMemo, useRef, useState } from 'react';
import './GemMediaGallery.css';
import ResponsiveImage from './ResponsiveImage';
import { imageDelivery } from './imageDelivery';
import MediaWatermark from './MediaWatermark';

const paths = {
  image: 'M3 4h18v16H3V4Zm0 11 5-5 5 5 3-3 5 5M16 8h.01',
  play: 'm9 6 10 6-10 6V6Z',
  left: 'm15 5-7 7 7 7',
  right: 'm9 5 7 7-7 7',
  expand: 'M8 3H3v5M3 3l7 7M16 3h5v5m0-5-7 7M8 21H3v-5m0 5 7-7m6 7h5v-5m0 5-7-7',
  close: 'm6 6 12 12M6 18 18 6',
};

function Icon({ name, ...props }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.image} /></svg>;
}

function mediaUrl(value) {
  const url = typeof value === 'string' ? value.trim() : typeof value?.url === 'string' ? value.url.trim() : null;
  return url && (/^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url)) ? url : null;
}

function MediaFrame({ item, title, poster, expanded = false }) {
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  const video = useRef(null);
  useEffect(() => {
    const node = video.current;
    return () => { node?.pause(); };
  }, [attempt]);
  const retry = () => { setStatus('loading'); setAttempt((value) => value + 1); };
  return <div className={`pg-gem-media__asset${item.type === 'video' ? ' is-video' : ''}${expanded ? ' is-expanded' : ''}`} aria-busy={status === 'loading'}>
    {item.type === 'video' ? <video key={attempt} ref={video} src={item.url} poster={poster ? imageDelivery(poster).src : undefined} controls playsInline preload="metadata" aria-label={`${title}, video ${item.number}`} onLoadedMetadata={() => setStatus('ready')} onError={() => setStatus('error')} /> : <ResponsiveImage key={attempt} retryKey={attempt} src={item.url} alt={`${title}, photograph ${item.number}`} loading="eager" maxWidth={expanded ? 2000 : 1200} sizes={expanded ? '90vw' : '(max-width:1023px) 90vw,52vw'} width="800" height="800" draggable="false" onReady={({failed}) => setStatus(failed ? 'error' : 'ready')} onError={() => setStatus('error')} />}
    {item.type === 'image' && status === 'ready' && <MediaWatermark />}
    {status === 'loading' && <span className="pg-gem-media__loading" role="status"><i />Loading {item.type === 'video' ? 'video' : 'photograph'}<span className="pg-gem-media__sr-only"> of {title}</span></span>}
    {status === 'error' && <div className="pg-gem-media__unavailable" role="status"><Icon name={item.type === 'video' ? 'play' : 'image'} /><strong>{item.type === 'video' ? 'Video' : 'Photograph'} unavailable</strong><p>Please try again or select another view.</p><button type="button" onClick={retry}>Try again</button></div>}
  </div>;
}

function Thumbnail({ item, selected, cover, title, onSelect }) {
  const src = item.type === 'video' ? cover : item.url;
  return <button type="button" className={`pg-gem-media__thumbnail${item.type === 'video' ? ' is-video' : ''}`} aria-label={`Show gemstone ${item.type === 'video' ? 'video' : 'photograph'} ${item.number}`} aria-pressed={selected} onClick={onSelect}>
    {src ? <ResponsiveImage src={src} alt="" maxWidth={160} sizes="76px" width="76" height="64" /> : <Icon name="image" />}
    {item.type === 'video' && <span className="pg-gem-media__thumbnail-play"><Icon name="play" /></span>}
    <span className="pg-gem-media__thumbnail-label">{item.type === 'video' ? `Video ${item.number}` : item.number === 1 ? 'Cover' : `Photo ${item.number}`}</span>
    <span className="pg-gem-media__sr-only"> of {title}</span>
  </button>;
}

function PhotoDialog({ item, title, count, onClose, onStep }) {
  const dialog = useRef(null);
  const labelId = useId();
  useEffect(() => {
    const element = dialog.current;
    const focused = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => { element.close(); document.body.style.overflow = overflow; focused?.focus({ preventScroll: true }); };
  }, []);
  const keyboard = (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); onStep(event.key === 'ArrowLeft' ? -1 : 1); }
  };
  return <dialog ref={dialog} className="pg-gem-media-dialog" aria-labelledby={labelId} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={keyboard}>
    <header><div><p id={labelId}>{title}</p><span>Photograph {item.number} of {count}</span></div><button type="button" onClick={onClose} aria-label="Close enlarged photograph"><Icon name="close" /></button></header>
    <div className="pg-gem-media-dialog__stage"><MediaFrame key={item.url} item={item} title={title} expanded />{count > 1 && <><button type="button" className="pg-gem-media-dialog__previous" aria-label="Previous enlarged photograph" onClick={() => onStep(-1)}><Icon name="left" /></button><button type="button" className="pg-gem-media-dialog__next" aria-label="Next enlarged photograph" onClick={() => onStep(1)}><Icon name="right" /></button></>}</div>
  </dialog>;
}

export default function GemMediaGallery({ gem }) {
  const media = useMemo(() => {
    const images = [...new Set([gem.image, ...(Array.isArray(gem.additionalImages) ? gem.additionalImages : [])].map(mediaUrl).filter(Boolean))];
    const videos = [...new Set((Array.isArray(gem.videos) ? gem.videos : []).map(mediaUrl).filter(Boolean))];
    return [...images.map((url, index) => ({ type: 'image', url, number: index + 1 })), ...videos.map((url, index) => ({ type: 'video', url, number: index + 1 }))];
  }, [gem]);
  const [selected, setSelected] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const touch = useRef(null);
  const thumbnails = useRef(null);
  const photos = media.filter((item) => item.type === 'image');
  const videoCount = media.length - photos.length;
  const item = media[Math.min(selected, media.length - 1)];
  const choose = (index) => setSelected((index + media.length) % media.length);
  const step = (direction) => choose(selected + direction);
  const stepPhoto = (direction) => setSelected((selected + direction + photos.length) % photos.length);
  useEffect(() => {
    const list = thumbnails.current;
    const active = list?.querySelector('[aria-pressed="true"]');
    if (!active) return;
    if (active.offsetLeft < list.scrollLeft) list.scrollTo({ left: active.offsetLeft });
    else if (active.offsetLeft + active.offsetWidth > list.scrollLeft + list.clientWidth) list.scrollTo({ left: active.offsetLeft + active.offsetWidth - list.clientWidth });
  }, [selected]);
  const onKey = (event) => {
    if (event.target !== event.currentTarget) return;
    if ((event.key === 'Enter' || event.key === ' ') && item.type === 'image') {
      event.preventDefault();
      setExpanded(true);
      return;
    }
    if (media.length < 2) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); step(event.key === 'ArrowLeft' ? -1 : 1); }
  };
  const onTouchStart = (event) => { touch.current = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null; };
  const onTouchEnd = (event) => {
    if (!touch.current || !event.changedTouches.length || item.type !== 'image') return;
    const deltaX = event.changedTouches[0].clientX - touch.current.x;
    const deltaY = event.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) step(deltaX > 0 ? -1 : 1);
  };
  return <section className="gem-detail-gallery pg-gem-media" aria-label={`${gem.title} photographs and videos`}>
    <header className="pg-gem-media__heading"><div><span>{photos.length} {photos.length === 1 ? 'photograph' : 'photographs'}{videoCount ? ` · ${videoCount} ${videoCount === 1 ? 'video' : 'videos'}` : ''}</span></div><span className="pg-gem-media__edition">PINNAWALA GEMS</span></header>
    {item ? <>
      <div className="pg-gem-media__stage" tabIndex={0} role="group" aria-label={`${gem.title} media viewer. Press Enter to enlarge the photograph, or use left and right arrow keys to browse.`} onClick={(event) => { if (item.type === 'image' && event.target.closest('.pg-gem-media__asset')) setExpanded(true); }} onKeyDown={onKey} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <MediaFrame key={`${item.type}-${item.url}`} item={item} title={gem.title} poster={photos[0]?.url} />
        {item.type === 'image' && <button type="button" className="pg-gem-media__expand" aria-label="Enlarge gemstone photograph" onClick={() => setExpanded(true)}><Icon name="expand" /></button>}
      </div>
      <div className="pg-gem-media__toolbar"><span aria-live="polite">{item.type === 'video' ? `Video ${item.number}` : `Photograph ${item.number}`}<i />{String(selected + 1).padStart(2, '0')} / {String(media.length).padStart(2, '0')}</span>{media.length > 1 && <div><button type="button" aria-label="Previous gemstone media" onClick={() => step(-1)}><Icon name="left" /></button><button type="button" aria-label="Next gemstone media" onClick={() => step(1)}><Icon name="right" /></button></div>}</div>
      {media.length > 1 && <div ref={thumbnails} className="pg-gem-media__thumbnails" aria-label="Choose a photograph or video">{media.map((entry, index) => <Thumbnail key={`${entry.type}-${entry.url}`} item={entry} selected={index === selected} cover={photos[0]?.url} title={gem.title} onSelect={() => choose(index)} />)}</div>}
      {expanded && item.type === 'image' && <PhotoDialog item={item} title={gem.title} count={photos.length} onClose={() => setExpanded(false)} onStep={stepPhoto} />}
    </> : <div className="pg-gem-media__empty"><Icon name="image" /><p>Photographs will be available soon.</p></div>}
  </section>;
}
