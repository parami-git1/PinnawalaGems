import { useEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useRemoteResource } from './hooks/useRemoteResource';
import ResponsiveImage from './ResponsiveImage';
import HomeLoading from './HomeLoading';
import GemShowcase from './GemShowcase';
import CustomerGallery from './CustomerGallery';
import { BUSINESS, withBusinessDetails } from './businessDetails';
import { getDefaultCategoryBanner } from './categoryBannerAssets';
import { HOME_HERO_PREVIEW, HOME_MOBILE_PREVIEW } from './homeHeroPreview';
import './Home.css';
import './HomeRefinements.css';
import './HeroRefinement.css';
import './HomeFinal.css';

const HERO_IMAGE = '/images/home-ceylon-ivory-hero-v1.webp';
const HERO_MOBILE = '/images/home-ceylon-ivory-hero-mobile-v1.webp';
let initialHomeRevealed = false;

function isDefaultHeroImage(source) {
  if (typeof source !== 'string' || !source.trim()) return true;
  try {
    const url = new URL(source, window.location.origin);
    return url.origin === window.location.origin && [HERO_IMAGE, HERO_MOBILE, '/images/home-gem-trio.webp', '/images/home-gem-trio-mobile.webp'].includes(url.pathname);
  } catch { return false; }
}
const DEFAULT_CATEGORIES = [
  { title: 'Blue Sapphire', description: 'The unmistakable blue of Ceylon.', tone: 'sapphire' },
  { title: 'Ruby', description: 'A captivating world of crimson.', tone: 'ruby' },
  { title: 'Pink Sapphire', description: 'Soft colour. Extraordinary character.', tone: 'spinel' },
  { title: 'Yellow Sapphire', description: 'A little light from the heart of Ceylon.', tone: 'yellow' },
];

function Arrow({ diagonal = false, ...props }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" {...props}>
    <path d={diagonal ? 'M5 19 19 5M5 5h14v14' : 'M4 12h15m-6-6 6 6-6 6'} strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

function Facet({ className = '', ...props }) {
  return <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" className={className} {...props}>
    <path d="M27 16h46l20 26-43 44L7 42Z" fill="currentColor" fillOpacity=".09" />
    <g stroke="currentColor" strokeWidth=".85" strokeLinejoin="round">
      <path d="M27 16h46l20 26-43 44L7 42Zm0 0 9 26L50 16l14 26 9-26M7 42h86M36 42l14 44 14-44" />
      <path d="m27 16 23 70 23-70M7 42l43-26 43 26" opacity=".45" />
    </g>
  </svg>;
}

function safeWebUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

function categorySlug(category) {
  return category.slug || category.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function Image({ src, alt, className = '', ...props }) {
  return <ResponsiveImage src={src} alt={alt} className={className} sizes="(max-width: 599px) 90vw, (max-width: 1023px) 46vw, 600px" {...props} />;
}

// A single observer reveals newly loaded content once, without scroll handlers.
// Content stays readable if motion is disabled or an animation API is unavailable.
function useScrollReveals(scope) {
  useEffect(() => {
    const root = scope.current;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!root || !('IntersectionObserver' in window) || motion.matches) return;
    const observed = new WeakSet();
    const animations = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;
        observer.unobserve(target);
        if (motion.matches || typeof target.animate !== 'function') return;
        const animation = target.animate([
          { opacity: 0, transform: 'translate3d(0, 24px, 0)' },
          { opacity: 1, transform: 'translate3d(0, 0, 0)' },
        ], { duration: 650, delay: Math.min(Number(target.dataset.delay) || 0, 160), easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards' });
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      });
    }, { threshold: 0.06 });
    const observeNew = () => root.querySelectorAll('[data-reveal]').forEach((element) => {
      if (observed.has(element)) return;
      observed.add(element);
      observer.observe(element);
    });
    observeNew();
    const mutations = new MutationObserver(observeNew);
    mutations.observe(root, { childList: true, subtree: true });
    const reduceMotion = () => { if (motion.matches) animations.forEach((animation) => animation.cancel()); };
    motion.addEventListener('change', reduceMotion);
    return () => {
      observer.disconnect(); mutations.disconnect();
      animations.forEach((animation) => animation.cancel());
      motion.removeEventListener('change', reduceMotion);
    };
  }, [scope]);
}

function SectionIntro({ number, label, title, children, link, to = '/catalog', showEyebrow = true }) {
  return <div className="pg-section-intro" data-reveal>
    <div>{showEyebrow && <p className="pg-eyebrow"><span>{number}</span>{label}</p>}<h2>{title}</h2>{children && <p className="pg-section-description">{children}</p>}</div>
    {link && <Link className="pg-text-link" to={to}>{link}<Arrow /></Link>}
  </div>;
}

function CategoryCard({ category, index }) {
  const fallback = getDefaultCategoryBanner(category);
  const source = category.mainImage || category.image || category.coverImage || fallback;
  return <div data-reveal data-delay={index * 45}>
    <Link className={`pg-category pg-category--${category.tone || 'sapphire'}`} to={`/collections/${categorySlug(category)}`}>
      <div className={`pg-category-visual${source === fallback ? ' pg-category-visual--local' : ''}`}><span className="pg-category-number">0{index + 1}</span>
        <ResponsiveImage src={source} fallback={fallback} alt={category.title} width="640" height="720" maxWidth={640} sizes="(max-width: 599px) 44vw, 23vw" />
        <span className="pg-category-explore"><Arrow diagonal /></span>
      </div>
      <div className="pg-category-caption"><h3>{category.title}</h3><p>{category.description || 'Explore the collection'}</p></div>
    </Link>
  </div>;
}

function GemCard({ gem, index }) {
  const title = gem.title || 'Natural gemstone';
  const secondary = Array.isArray(gem.additionalImages) ? gem.additionalImages.find(Boolean) : null;
  const facts = [['Carat weight', gem.weight ? `${gem.weight}${/ct|carat/i.test(String(gem.weight)) ? '' : ' ct'}` : null], ['Shape', gem.shape], ['Origin', gem.origin], ['Cut', gem.cut]].filter(([, value]) => value);
  return <article className="pg-gem-card" data-reveal data-delay={(index % 4) * 40}>
    <Link to={`/gem/${gem._id}`} className="pg-gem-link">
      <div className="pg-gem-visual"><div className="pg-gem-label"><span>{String(index + 1).padStart(2, '0')}</span></div>
        <Image src={gem.image} alt={title} width="600" height="600" className="pg-gem-primary" />
        {secondary && <Image src={secondary} alt={`${title}, alternate view`} width="400" height="400" maxWidth={600} className="pg-gem-alternate" fade={false} fallback={gem.image || '/gem.png'} />}
      </div>
      <div className="pg-gem-meta">
        <p>{gem.origin || 'From our collection'}{gem.hasCertificate && <span className="pg-gem-certified">Certificate available <span aria-hidden="true">✓</span></span>}</p>
        <h3>{title}</h3>
        {facts.length > 0 && <dl className="pg-gem-facts">{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
        <span className="pg-gem-detail-link">View gemstone<Arrow /></span>
      </div>
    </Link>
  </article>;
}

function FeaturedCollection({ resource }) {
  const track = useRef(null);
  const [position, setPosition] = useState({ start: true, end: false });
  const gems = Array.isArray(resource.data) ? resource.data.filter((gem) => gem && typeof gem === 'object' && gem._id).slice(0, 10) : [];
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const update = () => {
      const start = element.scrollLeft < 4;
      const end = element.scrollLeft + element.clientWidth >= element.scrollWidth - 4;
      setPosition((current) => current.start === start && current.end === end ? current : { start, end });
    };
    update();
    element.addEventListener('scroll', update, { passive: true });
    const resize = new ResizeObserver(update); resize.observe(element);
    return () => { element.removeEventListener('scroll', update); resize.disconnect(); };
  }, [resource.status, gems.length]);
  const move = (direction) => track.current?.scrollBy({ left: direction * track.current.clientWidth * 0.8, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });

  return <section className="pg-featured pg-section" aria-labelledby="pg-featured-title"><div className="pg-container">
    <SectionIntro showEyebrow={false} title={<span id="pg-featured-title">Rare by nature.<br /><em>Remarkable by choice.</em></span>} link="Explore all gemstones">Handpicked gems, chosen for colour and character.</SectionIntro>
    {resource.status === 'loading' && !gems.length ? <div className="pg-gem-skeletons" role="status" aria-label="Loading featured gemstones">{[0, 1, 2, 3].map((item) => <div className="pg-gem-skeleton" key={item}><div /><span /><span /></div>)}</div> : gems.length ? <>
      <div id="pg-gem-track" className={`pg-gem-track${gems.length === 1 ? ' pg-gem-track--single' : ''}`} ref={track} tabIndex={0} role="region" aria-label="Featured gemstones; swipe or use the arrow controls">{gems.map((gem, index) => <GemCard key={gem._id} gem={gem} index={index} />)}</div>
      {gems.length > 1 && <div className="pg-track-footer"><div className="pg-track-controls"><button type="button" onClick={() => move(-1)} disabled={position.start} aria-label="Previous gemstones" aria-controls="pg-gem-track"><Arrow /></button><button type="button" onClick={() => move(1)} disabled={position.end} aria-label="Next gemstones" aria-controls="pg-gem-track"><Arrow /></button></div></div>}
    </> : <div className="pg-collection-empty" data-reveal><img src="/gem.png" alt="Illustration of a blue sapphire" width="200" height="200" /><div><h3>Your next discovery awaits.</h3><p>{resource.status === 'error' ? 'Our selection is taking a little longer to load. Explore the collection or speak with our team to find your stone.' : 'Let us help you find a gemstone with the colour and character you have in mind.'}</p><div className="pg-empty-actions"><Link className="pg-text-link" to="/catalog">Browse the collection<Arrow /></Link>{resource.status === 'error' && <button type="button" className="pg-retry" onClick={resource.retry}>Try again</button>}</div></div></div>}
  </div></section>;
}

function CraftComparison() {
  const [value, setValue] = useState(50);
  return <figure className="pg-comparison"><div className="pg-comparison-images">
    <Image src="/images/rough-stone.webp" alt="A pink gemstone in its natural rough form" width="800" height="534" />
    <div className="pg-comparison-cut" style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}><Image src="/images/cut-stone.webp" alt="A faceted pink gemstone showing the art of cutting" width="800" height="534" /></div>
    <div className="pg-comparison-rule" style={{ left: `${value}%` }}><span aria-hidden="true">↔</span></div>
    <span className="pg-comparison-label pg-comparison-label--left">The cut</span><span className="pg-comparison-label pg-comparison-label--right">The rough</span>
    <input type="range" min="0" max="100" value={value} onChange={(event) => setValue(Number(event.target.value))} aria-label="Compare rough and cut gemstones" aria-valuetext={`${value}% cut gemstone revealed`} />
  </div></figure>;
}

function FilmDialog({ src, onClose }) {
  const dialog = useRef(null);
  const video = safeWebUrl(src);
  useEffect(() => {
    const element = dialog.current;
    const focused = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; element.showModal();
    return () => { element.close(); document.body.style.overflow = overflow; focused?.focus(); };
  }, []);
  return <dialog ref={dialog} className="pg-film-dialog" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} aria-labelledby="pg-film-title"><div><h2 id="pg-film-title">Inside Pinnawala Gems</h2><button type="button" onClick={onClose} aria-label="Close film">×</button></div>{video && (/\.(mp4|webm)(\?|$)/i.test(video) ? <video src={video} controls autoPlay playsInline /> : <iframe src={video} title="Pinnawala Gems film" allow="autoplay; fullscreen" allowFullScreen />)}</dialog>;
}

function PosterDialog({ event, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    const focused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      focused?.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={dialog} className="pg-poster-dialog" aria-labelledby="pg-poster-title" onCancel={(e) => { e.preventDefault(); onClose(); }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="pg-poster-dialog-header"><h2 id="pg-poster-title">{event.title || 'From Pinnawala Gems'}</h2><button type="button" aria-label="Close announcement" onClick={onClose}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button></div>
    <ResponsiveImage src={event.image} maxWidth={1400} sizes="90vw" loading="eager" alt={event.title || 'Pinnawala Gems announcement poster'} />
    {event.description && <p>{event.description}</p>}
    <Link to="/contact" onClick={onClose} className="pg-text-link">Ask about this announcement<Arrow diagonal /></Link>
  </dialog>;
}

export default function Home() {
  const { home, categoriesResource } = useOutletContext();
  const homeData = withBusinessDetails(home.data);
  const gemsResource = useRemoteResource('inventory/top-gems');
  const eventsResource = useRemoteResource('event-ads');
  const root = useRef(null);
  const [showFilm, setShowFilm] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [failedHeroImage, setFailedHeroImage] = useState('');
  const [heroReady, setHeroReady] = useState(false);
  const [showLoader, setShowLoader] = useState(() => !initialHomeRevealed);
  const [deadlineReached, setDeadlineReached] = useState(false);
  useScrollReveals(root);
  const loadedCategories = Array.isArray(categoriesResource.data) ? categoriesResource.data.filter((category) => category && typeof category.title === 'string' && category.title.trim()) : [];
  const categories = loadedCategories.length ? [...loadedCategories].sort((a, b) => (b.gemCount ?? b.count ?? 0) - (a.gemCount ?? a.count ?? 0)).slice(0, 4) : DEFAULT_CATEGORIES;
  const events = Array.isArray(eventsResource.data) ? eventsResource.data.filter((event) => event && typeof event === 'object') : [];
  const photos = Array.isArray(homeData.customerPhotos) ? homeData.customerPhotos.filter(Boolean) : [];
  const heroTitle = typeof homeData.heroTitle === 'string' && homeData.heroTitle.trim() ? homeData.heroTitle.trim() : 'Unearth the true brilliance of Ceylon.';
  const words = heroTitle.split(/\s+/);
  const lastWord = words.pop();
  const eventLink = safeWebUrl(homeData.eventLink);
  const whatsapp = BUSINESS.whatsapp;
  const customHeroImage = isDefaultHeroImage(homeData.heroImage) ? '' : homeData.heroImage.trim();
  const useDefaultHero = !customHeroImage || customHeroImage === failedHeroImage;
  const readyToReveal = heroReady || deadlineReached;
  useEffect(() => {
    if (!showLoader) return undefined;
    const deadline = window.setTimeout(() => setDeadlineReached(true), 6000);
    return () => window.clearTimeout(deadline);
  }, [showLoader]);
  useEffect(() => {
    if (!readyToReveal || !showLoader) return undefined;
    initialHomeRevealed = true;
    const reveal = window.setTimeout(() => setShowLoader(false), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180);
    return () => window.clearTimeout(reveal);
  }, [readyToReveal, showLoader]);
  const loadingMessage = heroReady ? 'Ready to explore' : 'Bringing the details into focus';

  return <>{showLoader && <HomeLoading leaving={readyToReveal} message={loadingMessage} />}<main id="main-content" className="pg-home" ref={root}>
    <section className={`pg-hero${useDefaultHero ? ' pg-hero--ivory' : ''}`} aria-labelledby="pg-hero-title">
      <div className="pg-hero-picture" style={{ '--pg-hero-preview': `url("${HOME_HERO_PREVIEW}")`, '--pg-hero-mobile-preview': `url("${HOME_MOBILE_PREVIEW}")` }}><ResponsiveImage src={useDefaultHero ? HERO_IMAGE : customHeroImage} mobileSrc={useDefaultHero ? HERO_MOBILE : undefined} fallback={useDefaultHero ? HERO_IMAGE : undefined} width="1774" height="887" maxWidth={1800} sizes="100vw" alt={useDefaultHero ? 'Ceylon gemstones on ivory silk with Sigiriya and a white Sri Lankan stupa in the misty background' : 'Pinnawala Gems featured collection'} fetchPriority="high" loading="eager" preservePrevious onReady={() => setHeroReady(true)} onError={() => { if (!useDefaultHero) setFailedHeroImage(customHeroImage); }} /></div>
      <div className="pg-hero-shade" />
      <div className="pg-container pg-hero-inner"><div className="pg-hero-copy">
        <p className="pg-eyebrow pg-hero-enter">{BUSINESS.name}</p>
        <h1 id="pg-hero-title" className="pg-hero-enter">{words.join(' ')}{' '}<em>{lastWord}</em></h1>
        <p className="pg-hero-description pg-hero-enter">{BUSINESS.tagline}</p>
        <div className="pg-hero-actions pg-hero-enter"><Link to="/catalog" className="pg-button pg-button--gold">Discover the collection<Arrow /></Link></div>
        {safeWebUrl(homeData.heroVideo) && <button type="button" className="pg-film-button" onClick={() => setShowFilm(true)}><span aria-hidden="true">▷</span> Watch our story</button>}
      </div><div className="pg-hero-footer"><a href="#collections" className="pg-scroll-link"><span>Scroll to discover</span><Arrow /></a></div></div>
    </section>

    {homeData.showEvent && homeData.eventText && <aside className="pg-announcement pg-container"><span className="pg-caption-dot" /><p>{homeData.eventText}</p>{eventLink && <a href={eventLink} target="_blank" rel="noopener noreferrer" className="pg-text-link">Learn more<Arrow diagonal /></a>}</aside>}

    <section id="collections" className="pg-section pg-categories" aria-labelledby="pg-categories-title"><div className="pg-container"><SectionIntro showEyebrow={false} title={<span id="pg-categories-title">The colours of Ceylon.<br /><em>Find your kind of brilliance.</em></span>} link="View the collection" /><div className="pg-category-grid" aria-busy={categoriesResource.status === 'loading'}>{categories.map((category, index) => <CategoryCard key={category._id || category.title} category={category} index={index} />)}</div></div></section>

    <FeaturedCollection resource={gemsResource} />

    <GemShowcase preload={heroReady} />

    <section className="pg-craft pg-section" aria-labelledby="pg-craft-title">
      <div className="pg-container">
        <SectionIntro showEyebrow={false} title={<span id="pg-craft-title">{homeData.featureTitle || <>From the earth.<br /><em>Into the extraordinary.</em></>}</span>} link="Inside our workshop" to="/workshop">{homeData.featureDescription || 'A patient eye. A considered cut. Discover the care that turns a raw crystal into something remarkable.'}</SectionIntro>
        <div className="pg-craft-grid">
          <div className="pg-craft-visual" data-reveal><CraftComparison /></div>
        </div>
      </div>
    </section>

    <section className="pg-origin pg-section" aria-labelledby="pg-origin-title"><div className="pg-container pg-origin-layout">
      <div className="pg-origin-copy" data-reveal><h2 id="pg-origin-title">Rooted in Sri Lanka.<br /><em>Chosen with care.</em></h2><p>{BUSINESS.name} is based in {BUSINESS.location}. {BUSINESS.license}</p><p>Visit us on Main Street or speak with our team about your next gemstone.</p><Link to="/contact" className="pg-button pg-button--navy">Visit us in Eheliyagoda<Arrow /></Link></div>
      <figure className="pg-origin-art" data-reveal><Image src="/images/ceylon-landscape.webp" fallback="/images/ceylon-landscape.webp" alt="An editorial view of lush Sri Lankan hills and a sapphire on an atelier workbench" width="1440" height="614" /><span className="pg-origin-corner" aria-hidden="true"><Facet /></span></figure>
    </div></section>

    {photos.length > 0 && <CustomerGallery photos={photos} />}

    {events.length > 0 && <section id="latest-stories" className="pg-section pg-events" aria-labelledby="pg-events-title"><div className="pg-container"><SectionIntro showEyebrow={false} title={<span id="pg-events-title">News, encounters<br /><em>and new discoveries.</em></span>}>Our latest announcements, exhibition posters and moments worth sharing.</SectionIntro><div className="pg-event-grid">{events.map((event, index) => <article className={`pg-event${event.layoutType === 'horizontal' ? ' pg-event--horizontal' : ''}`} key={event._id || index} data-reveal data-delay={(index % 3) * 50}>
      <button type="button" className="pg-event-poster" onClick={() => setSelectedPost(event)} disabled={!event.image} aria-label={`View full announcement: ${event.title || 'Pinnawala Gems'}`}>{event.image ? <Image src={event.image} alt={event.title || 'Pinnawala Gems announcement'} width="600" height="800" /> : <Facet />}<span className="pg-event-number">JOURNAL / {String(index + 1).padStart(2, '0')}</span><span className="pg-event-open"><Arrow diagonal /></span></button>
      <div className="pg-event-copy"><p className="pg-eyebrow">Events & announcements</p><h3>{event.title || 'From Pinnawala Gems'}</h3>{event.description && <p className="pg-event-description">{event.description}</p>}<button type="button" className="pg-text-link" onClick={() => setSelectedPost(event)} disabled={!event.image}>View announcement<Arrow diagonal /></button></div>
    </article>)}</div></div></section>}

    {(homeData.topAdImage || homeData.sideAdImage || homeData.bottomAdImage) && <section className="pg-promotions pg-container" aria-label="Latest offers">{[homeData.topAdImage, homeData.sideAdImage, homeData.bottomAdImage].filter(Boolean).map((src, index) => <Image src={src} alt="An announcement from Pinnawala Gems" key={`${src}-${index}`} />)}</section>}

    <section className="pg-visit" aria-labelledby="pg-visit-title">
      <div className="pg-container pg-visit-inner" data-reveal>
        <p className="pg-eyebrow">Visit {BUSINESS.name}</p>
        <h2 id="pg-visit-title">Some things are best <em>seen in person.</em></h2>
        <p>Find your colour. Ask a question. Begin a conversation.</p>
        <div className="pg-visit-actions">
          <Link className="pg-button pg-button--gold" to="/contact">Plan your visit<Arrow /></Link>
          <a className="pg-text-link" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">Speak with our team<Arrow diagonal /></a>
        </div>
        <span className="pg-visit-location">{BUSINESS.address}</span>
      </div>
    </section>
    {showFilm && <FilmDialog src={homeData.heroVideo} onClose={() => setShowFilm(false)} />}
    {selectedPost && <PosterDialog event={selectedPost} onClose={() => setSelectedPost(null)} />}
  </main></>;
}
