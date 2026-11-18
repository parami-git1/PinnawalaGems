import { useState, useEffect, useId, useRef } from 'react';
import { useRemoteResource } from './hooks/useRemoteResource';
import './WorkshopDialog.css';
import './WorkshopHero.css';
import ResponsiveImage from './ResponsiveImage';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const workshopEvents = [
  {
    eyebrow: 'AUGUST 2025 · MASTERCLASS',
    title: 'Gemology Masterclass',
    description: 'An intimate seminar where industry experts shared the discipline of identifying raw sapphires, evaluating clarity, and understanding market value.',
  },
  {
    eyebrow: 'DECEMBER 2025 · COURSE',
    title: 'Artisan Training Camp',
    description: 'A hands-on course dedicated to preserving traditional Sri Lankan gem-cutting techniques and guiding the next generation of master craftsmen.',
  },
];

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
    <article><div className="pg-workshop-dialog__photo"><ImagePlaceholder src={event.image} alt={event.title} /></div><div className="pg-workshop-dialog__copy"><p className="pg-workshop-dialog__eyebrow">{event.eyebrow}</p><span className="pg-workshop-dialog__rule" /><h2 id={titleId}>{event.title}</h2><p className="pg-workshop-dialog__description">{event.description}</p><p className="pg-workshop-dialog__signature">The art behind every stone.</p></div></article>
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
  const displayEvents = [
    ...workshopEvents.map((event, index) => ({
      ...event,
      title: sections[index]?.title || event.title,
      description: sections[index]?.description || event.description,
      image: sections[index]?.imageUrl || sections[index]?.image,
    })),
    ...sections.slice(workshopEvents.length).map((section) => ({
      eyebrow: 'WORKSHOP ARCHIVE · FEATURED',
      title: section.title || 'Pinnawala Gems workshop',
      description: section.description || 'A considered learning experience from the Pinnawala Gems atelier.',
      image: section.imageUrl || section.image,
    })),
  ];

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
            <a className="pg-workshop-hero__link" href="#main-content">Explore the archive<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" aria-hidden="true"><path d="m7 7 10 10M7 17h10V7" /></svg></a>
            <div className="pg-workshop-hero__disciplines" aria-label="Workshop disciplines"><span>Gemology</span><i aria-hidden="true" /><span>Lapidary</span><i aria-hidden="true" /><span>Masterclasses</span></div>
          </div>
        </div>
      </section>

      {/* ── Workshop Sections ────────────────────────────────────────────── */}
      <main id="main-content" className="relative z-10 mx-auto w-full max-w-7xl px-6 py-20 md:px-12 md:py-28">
        <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.35em] text-[#B8901F]">Past sessions & showcases</p>
            <h2 className="mt-3 font-[Cormorant_Garamond,serif] text-5xl leading-none text-[#0B1330] md:text-6xl">The workshop archive.</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-slate-500 md:text-right">Stories, skills, and shared knowledge from the people who bring each stone to life.</p>
        </div>

        {resource.status === 'error' && <div className="pg-workshop-status" role="status"><p>We could not refresh the workshop archive. Your stories are still available below.</p><button type="button" onClick={resource.retry}>Try again</button></div>}
        <div className="relative -mx-1 px-1 md:px-12">
        <div ref={workshopTrackRef} className="workshop-track relative h-[610px] overflow-hidden sm:h-[640px] md:h-[680px]">
          {displayEvents.map((event, idx) => (
            <article
              key={`${event.title}-${idx}`}
              data-direction={idx % 2 === 0 ? 'left' : 'right'}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedEvent(event)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedEvent(event); } }}
              style={{
                transform: `translateX(calc(-50% ${idx < activeEventIndex ? '- clamp(210px, 25vw, 330px)' : idx > activeEventIndex ? '+ clamp(210px, 25vw, 330px)' : ''})) scale(${idx === activeEventIndex ? 1 : .72})`,
                opacity: Math.abs(idx - activeEventIndex) > 1 ? 0 : idx === activeEventIndex ? 1 : .58,
                zIndex: idx === activeEventIndex ? 30 : 20 - Math.abs(idx - activeEventIndex),
                pointerEvents: Math.abs(idx - activeEventIndex) > 1 ? 'none' : 'auto',
              }}
              className="workshop-event group absolute left-1/2 top-0 flex w-[min(86vw,580px)] flex-col overflow-hidden rounded-[2rem] border border-[#dfe4ee] bg-[#0B1330] text-left shadow-[0_18px_42px_rgba(11,19,48,.14)] transition-all duration-700 ease-[cubic-bezier(.16,1,.3,1)] focus:outline-none focus:ring-2 focus:ring-[#c9a227] focus:ring-offset-4 hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(11,19,48,.22)]"
            >
              <div className="workshop-event-image relative h-[245px] shrink-0 overflow-hidden md:h-[285px]">
                <ImagePlaceholder src={event.image} alt={event.title} />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B1330]/55 via-transparent to-transparent" />
                <span className="absolute bottom-5 left-6 rounded-full border border-white/25 bg-[#0B1330]/55 px-3 py-1.5 text-[8px] font-semibold uppercase tracking-[.22em] text-white backdrop-blur-md">View story</span>
              </div>
              <div className="workshop-event-copy relative flex flex-1 flex-col px-7 py-8 text-white md:px-10 md:py-9">
                <span className="mb-5 text-[9px] font-semibold uppercase tracking-[.28em] text-[#D9B64A]">{event.eyebrow}</span>
                <span className="mb-5 h-px w-10 bg-[#C9A227]" />
                <h3 className="font-[Cormorant_Garamond,serif] text-4xl leading-none md:text-5xl">{event.title}</h3>
                <p className="mt-5 max-w-md text-sm font-light leading-7 text-slate-300">{event.description}</p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-8 text-[9px] font-semibold uppercase tracking-[.25em] text-white/50">
                  <span className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-[#D9B64A]" /> Pinnawala Gems atelier</span>
                  <span className="text-[#D9B64A] transition-transform duration-300 group-hover:translate-x-1">Read more →</span>
                </div>


              </div>
            </article>
          ))}
        </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      <button type="button" onClick={() => setActiveEventIndex((index) => Math.max(0, index - 1))} disabled={activeEventIndex === 0} className="absolute left-0 top-1/2 z-40 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#dfe4ee] bg-white text-lg text-[#0B1330] shadow-[0_8px_20px_rgba(11,19,48,.12)] transition-all hover:-translate-x-1 hover:border-[#c9a227] hover:text-[#806512] disabled:cursor-not-allowed disabled:opacity-35" aria-label="Previous workshop">←</button>
      <button type="button" onClick={() => setActiveEventIndex((index) => Math.min(displayEvents.length - 1, index + 1))} disabled={activeEventIndex >= displayEvents.length - 1} className="absolute right-0 top-1/2 z-40 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#0B1330] bg-[#0B1330] text-lg text-white shadow-[0_8px_20px_rgba(11,19,48,.14)] transition-all hover:translate-x-1 hover:border-[#c9a227] hover:bg-[#162452] disabled:cursor-not-allowed disabled:opacity-35" aria-label="Next workshop">→</button>
        </div>
      </main>

      {selectedEvent && <WorkshopDetails event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </div>
  );
}

export default Workshop;
