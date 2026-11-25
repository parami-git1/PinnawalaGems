import { useState, useEffect, useId, useRef } from 'react';
import { useRemoteResource } from './hooks/useRemoteResource';
import './WorkshopDialog.css';
import './WorkshopHero.css';
import ResponsiveImage from './ResponsiveImage';
import { safeWorkshopLocationUrl, workshopContactLinks, workshopDateTimeLabel, workshopEventLabel } from './workshopContent';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function WorkshopIcon({ name }) {
  const paths = { calendar: 'M5 5h14v16H5V5Zm3-3v6m8-6v6M5 11h14m-10 4h2m2 0h2', location: 'M12 22s8-7 8-13a8 8 0 1 0-16 0c0 6 8 13 8 13Zm3-13a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z', phone: 'm7 3 3 5-2 2c1 3 3 5 6 6l2-2 5 3c-1 4-3 5-7 3C7 17 3 13 2 7c0-3 2-4 5-4Z', chat: 'M21 11a9 9 0 0 1-13 8l-6 2 2-6a9 9 0 1 1 17-4Zm-13-1h8m-8 4h5' };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

function WorkshopContacts({ event, compact = false }) {
  const links = workshopContactLinks(event);
  if (!links.call && !links.whatsapp) return null;
  return <div className={`pg-workshop-contacts${compact ? ' is-compact' : ''}`}>
    {links.call && <a href={links.call} aria-label={`Call ${event.phoneNumber}`}><WorkshopIcon name="phone" /><span>Call{!compact && <small>{event.phoneNumber}</small>}</span></a>}
    {links.whatsapp && <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${event.whatsappNumber}`}><WorkshopIcon name="chat" /><span>WhatsApp{!compact && <small>{event.whatsappNumber}</small>}</span></a>}
  </div>;
}

function WorkshopMetadata({ event, compact = false }) {
  const eventLabel = workshopEventLabel(event);
  const location = compact ? event.locationName || event.locationAddress : [event.locationName, event.locationAddress].filter(Boolean).join(' · ');
  const map = safeWorkshopLocationUrl(event.locationUrl);
  if (!eventLabel && !location && (!map || compact)) return null;
  return <div className={`pg-workshop-metadata${compact ? ' is-compact' : ''}`}>
    {eventLabel && <p><WorkshopIcon name="calendar" /><span>{eventLabel}</span></p>}
    {location && <p><WorkshopIcon name="location" /><span>{location}</span></p>}
    {!compact && map && <a href={map} target="_blank" rel="noopener noreferrer"><WorkshopIcon name="location" />Open location map</a>}
  </div>;
}

const ImagePlaceholder = ({ src, alt }) => {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#101b38] shadow-[0_24px_60px_rgba(5,12,32,.22)] group">
      {src ? (
        <ResponsiveImage
          src={src}
          alt={alt}
          maxWidth={1000}
          sizes="(max-width:599px) 90vw,48vw"
          width="800" height="600"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          fallback="/images/lapidary-craft.webp"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_center,_rgba(201,162,39,.16),_transparent_46%)] text-slate-400" aria-label={`${alt} image placeholder`}>
          <span className="text-5xl font-serif italic text-[#D9B64A]/60" aria-hidden="true">P</span>
          <span className="text-[10px] uppercase tracking-[0.28em] text-[#D9B64A]/70">Pinnawala Atelier</span>
        </div>
      )}
    </div>
  );
};

function WorkshopDetails({ event, onClose }) {
  const dialog = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    const focused = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    return () => { element.close(); document.body.style.overflow = overflow; focused?.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={dialog} className="pg-workshop-dialog" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <header><span>Pinnawala Gems atelier</span><button type="button" onClick={onClose} aria-label="Close details">×</button></header>
    <article><div className="pg-workshop-dialog__photo"><ImagePlaceholder src={event.image} alt={event.title} /></div><div className="pg-workshop-dialog__copy"><p className="pg-workshop-dialog__eyebrow">{event.eyebrow}</p><span className="pg-workshop-dialog__rule" /><h2 id={titleId}>{event.title}</h2><WorkshopMetadata event={event} /><p className="pg-workshop-dialog__description">{event.description}</p><WorkshopContacts event={event} /><p className="pg-workshop-dialog__signature">The art behind every stone.</p></div></article>
  </dialog>;
}

function Workshop() {
  const pageRef = useRef(null);
  const workshopTrackRef = useRef(null);
  const resource = useRemoteResource('workshop');
  const sections = Array.isArray(resource.data) ? resource.data : [];
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo('.workshop-header', { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out' });
  }, { scope: pageRef });
  const displayEvents = sections.map((section) => ({
    ...section,
    eyebrow: workshopEventLabel(section) ? 'PINNAWALA GEMS · WORKSHOP' : `WORKSHOP STORY${workshopDateTimeLabel(section.publishAt || section.createdAt) ? ` · ${workshopDateTimeLabel(section.publishAt || section.createdAt).split(',')[0]}` : ''}`,
    title: section.title || 'Pinnawala Gems workshop',
    description: section.description || '', image: section.imageUrl || section.image,
  }));
  const currentIndex = Math.min(activeEventIndex, Math.max(0, displayEvents.length - 1));
  const { retry: retryWorkshops, refreshing, recovering, status: resourceStatus, error: resourceError, nextRetryAt } = resource;
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== 'visible' || navigator.onLine === false || refreshing || recovering || resourceStatus === 'loading') return;
      if (resourceStatus === 'error' && (resourceError?.transient === false || nextRetryAt > Date.now())) return;
      retryWorkshops();
    };
    const timer = window.setInterval(refresh, 30000);
    return () => window.clearInterval(timer);
  }, [retryWorkshops, refreshing, recovering, resourceStatus, resourceError, nextRetryAt]);

  useEffect(() => {
    const track = workshopTrackRef.current;
    if (!track) return undefined;
    const cards = [...track.querySelectorAll('.workshop-event')];
    const measure = () => {
      const height = Math.ceil(Math.max(0, ...cards.map((card) => card.offsetHeight)));
      track.style.setProperty('--workshop-cards-height', `${height + 4}px`);
    };
    // Cards are absolutely positioned, so their content cannot size the track.
    // Keep every story visible through font loading, resizing and CMS updates.
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    cards.forEach((card) => observer?.observe(card));
    window.addEventListener('resize', measure);
    measure();
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, [resource.data]);

  return (
    <div ref={pageRef} className="relative min-h-screen overflow-hidden bg-[#F7F5F0] font-inter text-[#101936]">
      <section className="pg-workshop-hero" aria-labelledby="pg-workshop-hero-title">
        <ResponsiveImage
          className="pg-workshop-hero__background"
          src="/images/workshop-gem-inspection-v4-1920.webp"
          width="1920" height="1280" maxWidth={1920}
          sizes="(max-width:1023px) 1100px, 82vw"
          loading="eager" fetchPriority="high"
          alt="Hands inspecting a diamond ring with a jeweller's loupe"
        />
        <div className="pg-workshop-hero__veil" aria-hidden="true" />
        <span className="pg-workshop-hero__frame" aria-hidden="true" />
        <div className="pg-workshop-hero__layout">
          <div className="workshop-header pg-workshop-hero__copy">
            <p className="pg-workshop-hero__eyebrow"><span aria-hidden="true" />Pinnawala Gems / Workshops</p>
            <h1 id="pg-workshop-hero-title">Learn the art<br /><em>behind the stone.</em></h1>
            <p className="pg-workshop-hero__description">Discover the craft behind Ceylon's gemstones through masterclasses, artisan courses and exhibitions.</p>
            <a className="pg-workshop-hero__link" href="#main-content">Explore workshops<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" aria-hidden="true"><path d="m7 7 10 10M7 17h10V7" /></svg></a>
          </div>
        </div>
      </section>

      {/* ── Workshop Sections ────────────────────────────────────────────── */}
      <main id="main-content" className="pg-workshop-archive relative z-10 mx-auto w-full max-w-7xl px-6 py-20 md:px-12 md:py-28">
        <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h2 className="font-[Cormorant_Garamond,serif] text-5xl leading-none text-[#0B1330] md:text-6xl">Workshops & stories.</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-slate-500 md:text-right">Stories, skills, and shared knowledge from the people who bring each stone to life.</p>
        </div>

        {resource.status === 'error' && <div className="pg-workshop-status" role="status"><p>We could not refresh the workshop posts. Please try again.</p><button type="button" onClick={resource.retry}>Try again</button></div>}
        {!displayEvents.length && <div className="pg-workshop-empty" role="status"><WorkshopIcon name="calendar" /><h3>{resource.status === 'loading' ? 'Preparing our workshop stories…' : resource.status === 'error' ? 'Workshop stories are temporarily unavailable' : 'Our next chapter is taking shape.'}</h3><p>{resource.status === 'loading' ? 'Your stories will appear here shortly.' : 'Speak with our team about upcoming sessions and learning experiences.'}</p>{resource.status !== 'loading' && <a href="/contact">Contact our team</a>}</div>}
        {displayEvents.length > 0 && <div className="relative -mx-1 px-1 md:px-12">
        <div ref={workshopTrackRef} className="workshop-track relative h-[610px] overflow-hidden sm:h-[640px] md:h-[680px]">
          {displayEvents.map((event, idx) => (
            <article
              key={event._id || `${event.title}-${idx}`}
              data-direction={idx % 2 === 0 ? 'left' : 'right'}
              style={{
                transform: `translateX(calc(-50% ${idx < currentIndex ? '- clamp(210px, 25vw, 330px)' : idx > currentIndex ? '+ clamp(210px, 25vw, 330px)' : ''})) scale(${idx === currentIndex ? 1 : .72})`,
                opacity: Math.abs(idx - currentIndex) > 1 ? 0 : idx === currentIndex ? 1 : .58,
                zIndex: idx === currentIndex ? 30 : 20 - Math.abs(idx - currentIndex),
                pointerEvents: Math.abs(idx - currentIndex) > 1 ? 'none' : 'auto',
              }}
              className="workshop-event group absolute left-1/2 top-0 flex w-[min(86vw,580px)] flex-col overflow-hidden rounded-[2rem] border border-[#dfe4ee] bg-[#0B1330] text-left shadow-[0_18px_42px_rgba(11,19,48,.14)] transition-all duration-700 ease-[cubic-bezier(.16,1,.3,1)] focus:outline-none focus:ring-2 focus:ring-[#c9a227] focus:ring-offset-4 hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(11,19,48,.22)]"
            >
              <button type="button" className="pg-workshop-card-open" tabIndex={Math.abs(idx - currentIndex) > 1 ? -1 : 0} onClick={() => setSelectedEvent(event)} aria-label={`View details for ${event.title}`} />
              <div className="workshop-event-image relative h-[245px] shrink-0 overflow-hidden md:h-[285px]">
                <ImagePlaceholder src={event.image} alt={event.title} />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B1330]/55 via-transparent to-transparent" />
                <span className="absolute bottom-5 left-6 rounded-full border border-white/25 bg-[#0B1330]/55 px-3 py-1.5 text-[8px] font-semibold uppercase tracking-[.22em] text-white backdrop-blur-md">View story</span>
              </div>
              <div className="workshop-event-copy relative flex flex-1 flex-col px-7 py-8 text-white md:px-10 md:py-9">
                <span className="mb-5 text-[9px] font-semibold uppercase tracking-[.28em] text-[#D9B64A]">{event.eyebrow}</span>
                <span className="mb-5 h-px w-10 bg-[#C9A227]" />
                <h3 className="font-[Cormorant_Garamond,serif] text-4xl leading-none md:text-5xl">{event.title}</h3>
                <WorkshopMetadata event={event} compact />
                <p className="mt-5 max-w-md text-sm font-light leading-7 text-slate-300">{event.description}</p>
                <div inert={Math.abs(idx - currentIndex) > 1 || undefined}><WorkshopContacts event={event} compact /></div>
                <div className="mt-auto flex items-center justify-between gap-3 pt-8 text-[9px] font-semibold uppercase tracking-[.25em] text-white/50">
                  <span className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-[#D9B64A]" /> Pinnawala Gems atelier</span>
                  <span className="text-[#D9B64A] transition-transform duration-300 group-hover:translate-x-1">Read more →</span>
                </div>


              </div>
            </article>
          ))}
        </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      <button type="button" onClick={() => setActiveEventIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0} className="absolute left-0 top-1/2 z-40 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#dfe4ee] bg-white text-lg text-[#0B1330] shadow-[0_8px_20px_rgba(11,19,48,.12)] transition-all hover:-translate-x-1 hover:border-[#c9a227] hover:text-[#806512] disabled:cursor-not-allowed disabled:opacity-35" aria-label="Previous workshop">←</button>
      <button type="button" onClick={() => setActiveEventIndex(Math.min(displayEvents.length - 1, currentIndex + 1))} disabled={currentIndex >= displayEvents.length - 1} className="absolute right-0 top-1/2 z-40 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#0B1330] bg-[#0B1330] text-lg text-white shadow-[0_8px_20px_rgba(11,19,48,.14)] transition-all hover:translate-x-1 hover:border-[#c9a227] hover:bg-[#162452] disabled:cursor-not-allowed disabled:opacity-35" aria-label="Next workshop">→</button>
        </div>}
      </main>

      {selectedEvent && <WorkshopDetails event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </div>
  );
}

export default Workshop;
