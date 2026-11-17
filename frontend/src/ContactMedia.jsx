import { useState } from 'react';
import ResponsiveImage from './ResponsiveImage';
import './ContactMedia.css';

function safeVideo(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value, window.location.origin);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (/\.(mp4|webm)$/i.test(url.pathname)) return { type: 'video', src: url.href };
    if (['www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com', 'youtube-nocookie.com'].includes(url.hostname) && /^\/embed\/[\w-]+$/.test(url.pathname)) return { type: 'embed', src: url.href };
    if (url.hostname === 'player.vimeo.com' && /^\/video\/\d+$/.test(url.pathname)) return { type: 'embed', src: url.href };
  } catch { /* Invalid CMS media remains absent. */ }
  return null;
}

export default function ContactMedia({ photos, video }) {
  const [open, setOpen] = useState(false);
  const images = Array.isArray(photos) ? photos.filter((image) => typeof image === 'string' && image.trim()).slice(0, 30) : [];
  const film = safeVideo(video);
  if (!images.length && !film) return null;
  return <details className="pg-contact-media" onToggle={(event) => setOpen(event.currentTarget.open)}><summary>Photographs &amp; film<span aria-hidden="true">+</span></summary>{open && <div className="pg-contact-media__body">{images.length > 0 && <div className="pg-contact-media__photos">{images.map((src, index) => <ResponsiveImage key={`${src}-${index}`} src={src} alt={`Pinnawala Gems photograph ${index + 1}`} width="600" height="450" maxWidth={900} sizes="(max-width:599px) 88vw,44vw" />)}</div>}{film && <div className="pg-contact-media__video">{film.type === 'video' ? <video src={film.src} controls playsInline preload="metadata" aria-label="Pinnawala Gems film" /> : <iframe src={film.src} title="Pinnawala Gems film" loading="lazy" allow="fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}</div>}</div>}</details>;
}
