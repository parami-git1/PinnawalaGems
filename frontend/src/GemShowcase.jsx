import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import './GemShowcase.css';
import ResponsiveImage from './ResponsiveImage';
import { GEM_STUDIO_ENVIRONMENT, GEM_STUDIO_MODEL } from './gemStudioAssets';

const GemScene = lazy(() => import('./GemScene'));

function GemPoster({ unavailable = false }) {
  return <div className="pg-gem-studio__poster" role="status">
    <ResponsiveImage src="/gem.png" width="300" height="300" maxWidth={300} sizes="300px" alt="A royal blue sapphire" />
    <p>{unavailable ? 'The Pinnawala signature sapphire' : 'Preparing your sapphire…'}</p>
  </div>;
}

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onUnavailable?.(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function useMotionPreference() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

export default function GemShowcase({ preload = false, onSettled }) {
  const viewer = useRef(null);
  const [near, setNear] = useState(() => preload || !('IntersectionObserver' in window));
  const [visible, setVisible] = useState(() => !('IntersectionObserver' in window));
  const [documentVisible, setDocumentVisible] = useState(() => !document.hidden);
  const [command, setCommand] = useState(null);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  // Home can start preparation after its hero is ready, even while the sapphire
  // is below the viewport. Keep rendering only until its first complete frame.
  const shouldPrepare = preload || near;
  const reduced = useMotionPreference();
  const autoRotate = !reduced;
  const finish = useCallback(() => { setReady(true); onSettled?.('ready'); }, [onSettled]);
  const fallback = useCallback(() => { setUnavailable(true); onSettled?.('unavailable'); }, [onSettled]);
  useEffect(() => {
    if (!shouldPrepare || !documentVisible || ready || unavailable) return undefined;
    const deadline = window.setTimeout(fallback, 8000);
    return () => window.clearTimeout(deadline);
  }, [shouldPrepare, documentVisible, ready, unavailable, fallback]);

  useEffect(() => {
    const element = viewer.current;
    if (!element) return;
    if (!('IntersectionObserver' in window)) return;
    const preload = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNear(true); preload.disconnect(); }
    }, { rootMargin: '350px 0px' });
    const visibility = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.03 });
    preload.observe(element); visibility.observe(element);
    const onVisibility = () => setDocumentVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      preload.disconnect(); visibility.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const handleKeys = (event) => {
    const turns = { ArrowLeft: [-0.24, 0], ArrowRight: [0.24, 0], ArrowUp: [0, -0.16], ArrowDown: [0, 0.16] };
    if (!turns[event.key] || event.target !== event.currentTarget) return;
    event.preventDefault();
    setCommand((current) => ({ azimuth: turns[event.key][0], polar: turns[event.key][1], serial: (current?.serial || 0) + 1 }));
  };

  return <>
    {shouldPrepare && <>
      <link rel="preload" as="fetch" href={GEM_STUDIO_MODEL} crossOrigin="anonymous" fetchPriority="low" />
      <link rel="preload" as="fetch" href={GEM_STUDIO_ENVIRONMENT} crossOrigin="anonymous" fetchPriority="low" />
    </>}
    <section className="pg-gem-studio" aria-labelledby="pg-gem-studio-title">
    <div className="pg-container">
      <header className="pg-gem-studio__heading" data-reveal>
        <p className="pg-eyebrow">The Pinnawala signature</p>
        <h2 id="pg-gem-studio-title">Every facet.<br className="pg-gem-studio__mobile-break" /> <em>A different perspective.</em></h2>
        <p>Turn it in the light to reveal every facet.</p>
      </header>
      <div className="pg-gem-studio__composition">
        <aside className="pg-gem-studio__note pg-gem-studio__note--left" aria-label="Gemstone detail">
          <span>01 / THE COLOUR</span><h3>A world within blue.</h3><p>Light and colour meet across a carefully cut surface.</p><i aria-hidden="true" />
        </aside>
        <div ref={viewer} className={`pg-gem-studio__viewer${ready ? ' is-ready' : ' is-preparing'}`} tabIndex={0} role="group" aria-busy={!ready && !unavailable} aria-label="Interactive three-dimensional sapphire; drag to rotate or use arrow keys" aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown" onKeyDown={handleKeys}>
          <span className="pg-gem-studio__shadow" aria-hidden="true" />
          {shouldPrepare ? <SceneBoundary onUnavailable={fallback}><Suspense fallback={null}><GemScene active={(visible || (preload && !ready)) && documentVisible} autoRotate={autoRotate} command={command} onReady={finish} /></Suspense></SceneBoundary> : null}
          {!ready && <GemPoster unavailable={unavailable} />}
        </div>
        <aside className="pg-gem-studio__note pg-gem-studio__note--right" aria-label="Signature detail">
          <span>02 / THE SIGNATURE</span><h3>Our mark. Your discovery.</h3><p>The Pinnawala Gems emblem, set over its top facet.</p><i aria-hidden="true" />
        </aside>
      </div>
    </div>
  </section></>;
}
