import { useEffect, useId, useRef, useState } from 'react';
import ResponsiveImage from './ResponsiveImage';
import MediaWatermark from './MediaWatermark';
import './CertificateViewer.css';

function ViewerIcon({ name }) {
  const paths = { close: 'm6 6 12 12M6 18 18 6', plus: 'M5 12h14M12 5v14', minus: 'M5 12h14', expand: 'M8 3H3v5M16 3h5v5M8 21H3v-5m13 5h5v-5' };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

function CertificateDialog({ src, title, reference, onClose }) {
  const dialog = useRef(null);
  const viewport = useRef(null);
  const headingId = useId();
  const [zoom, setZoom] = useState(1);
  const [natural, setNatural] = useState({ width: 707, height: 1000 });
  const [space, setSpace] = useState({ width: 600, height: 600 });
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  const ratio = natural.width / natural.height;
  const fitWidth = Math.max(1, Math.min(space.width, space.height * ratio));

  useEffect(() => {
    const element = dialog.current;
    const focused = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      if (focused?.isConnected) focused.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const node = viewport.current;
    const update = () => setSpace({ width: Math.max(1, node.clientWidth - 40), height: Math.max(1, node.clientHeight - 40) });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const changeZoom = (value) => setZoom(Math.min(3, Math.max(1, Math.round(value * 4) / 4)));
  const fit = () => { setZoom(1); viewport.current?.scrollTo({ top: 0, left: 0 }); };
  const onKeyDown = (event) => {
    if (event.key === '+' || event.key === '=') { event.preventDefault(); changeZoom(zoom + .25); }
    if (event.key === '-') { event.preventDefault(); changeZoom(zoom - .25); }
    if (event.key === '0') { event.preventDefault(); fit(); }
  };

  return <dialog ref={dialog} className="pg-certificate-dialog" aria-labelledby={headingId} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={onKeyDown}>
    <header className="pg-certificate-dialog__header">
      <div><p>Gemstone certificate</p><h2 id={headingId}>{title}</h2>{reference && <span>{reference}</span>}</div>
      <button type="button" onClick={onClose} aria-label="Close certificate preview"><ViewerIcon name="close" /></button>
    </header>
    <div className="pg-certificate-dialog__toolbar" role="group" aria-label="Certificate viewing controls">
      <button type="button" onClick={fit} className="pg-certificate-fit"><ViewerIcon name="expand" />Fit to view</button>
      <div><button type="button" onClick={() => changeZoom(zoom - .25)} disabled={zoom <= 1} aria-label="Zoom out certificate"><ViewerIcon name="minus" /></button><output aria-label="Certificate zoom">{Math.round(zoom * 100)}%</output><button type="button" onClick={() => changeZoom(zoom + .25)} disabled={zoom >= 3} aria-label="Zoom in certificate"><ViewerIcon name="plus" /></button></div>
    </div>
    <div ref={viewport} className="pg-certificate-viewport" tabIndex={0} role="region" aria-label="Certificate image. Zoom in to inspect details and scroll to move around.">
      <div className="pg-certificate-canvas">
        <div className="pg-certificate-sheet" style={{ width: fitWidth * zoom, height: fitWidth / ratio * zoom }}>
          <ResponsiveImage key={attempt} retryKey={attempt} src={src} alt={`Gemstone certificate for ${title}`} maxWidth={2400} sizes="(max-width:599px) 1200px,1800px" width={natural.width} height={natural.height} loading="eager" fade={false} draggable="false"
            onLoad={(event) => { const image = event?.currentTarget || viewport.current?.querySelector('.pg-certificate-sheet > img'); if (image?.naturalWidth && image.naturalHeight) setNatural({ width: image.naturalWidth, height: image.naturalHeight }); }}
            onReady={({ failed }) => setStatus(failed ? 'error' : 'ready')} onError={() => setStatus('error')} />
          {status === 'ready' && <MediaWatermark certificate />}
        </div>
      </div>
      {status === 'loading' && <div className="pg-certificate-status" role="status">Loading certificate…</div>}
      {status === 'error' && <div className="pg-certificate-status pg-certificate-status--error" role="status"><p>The certificate image could not load.</p><button type="button" onClick={() => { setStatus('loading'); setAttempt((value) => value + 1); }}>Try again</button></div>}
    </div>
    <p className="pg-certificate-dialog__hint">Use + and − to inspect the certificate. Scroll to move around when zoomed.</p>
  </dialog>;
}

export default function CertificateViewer({ src, title, reference }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="pg-certificate-preview" aria-label="Enlarge gemstone certificate" aria-haspopup="dialog" onClick={() => setOpen(true)}>
      <span className="pg-certificate-preview__image"><ResponsiveImage src={src} alt={`Certificate preview for ${title}`} width="240" height="160" maxWidth={400} sizes="180px" /><MediaWatermark certificate /></span>
      <span className="pg-certificate-preview__label"><span>View certificate</span><ViewerIcon name="expand" /></span>
    </button>
    {open && <CertificateDialog src={src} title={title} reference={reference} onClose={() => setOpen(false)} />}
  </>;
}
