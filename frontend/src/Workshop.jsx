import { useState, useEffect, useRef } from 'react';
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
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#101b38] shadow-[0_24px_60px_rgba(5,12,32,.22)] group">
      {src && !hasError ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setHasError(true)}
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

function Workshop() {
  const pageRef = useRef(null);
  const workshopTrackRef = useRef(null);
  const [sections, setSections] = useState([]);
  const isAdmin = false;
  const [showModal,     setShowModal]     = useState(false);
  const [isEditing,     setIsEditing]     = useState(false);
  const [editSectionId, setEditSectionId] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', imageUrl: '', layoutType: 'left-text' });
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingSections, setIsLoadingSections] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeEventIndex, setActiveEventIndex] = useState(0);

  useEffect(() => {
    fetchWorkshopSections();
  }, []);

  useGSAP(() => {
    gsap.fromTo('.workshop-header',
      { autoAlpha: 0, y: 32 },
      { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out' }
    );

    gsap.utils.toArray('.workshop-event').forEach((event) => {
      const image = event.querySelector('.workshop-event-image');
      const copy = event.querySelector('.workshop-event-copy');

      gsap.fromTo(image,
        { autoAlpha: 0, x: event.dataset.direction === 'left' ? -48 : 48 },
        {
          autoAlpha: 1,
          x: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: event, start: 'top 82%', once: true },
        }
      );
      gsap.fromTo(copy,
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          delay: 0.16,
          ease: 'power3.out',
          scrollTrigger: { trigger: event, start: 'top 82%', once: true },
        }
      );
    });
  }, { scope: pageRef });

  /* ── All existing handlers — untouched ──────────────────────────────── */
  const fetchWorkshopSections = async () => {
    setIsLoadingSections(true);
    try {
      const res  = await fetch('https://pinnawalagems.onrender.com/api/workshop');
      const data = await res.json();
      if (Array.isArray(data)) setSections(data);
    } catch (err) { console.log(err); }
    finally { setIsLoadingSections(false); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('image', file);
    setIsUploading(true);
    try {
      const res = await fetch('https://pinnawalagems.onrender.com/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }, body: uploadData });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, imageUrl: data.imageUrl }));
      }
    } catch (err) { alert('Image upload failed'); }
    finally { setIsUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.imageUrl) return alert("Title and Image are required!");
    const url    = isEditing ? `https://pinnawalagems.onrender.com/api/workshop/${editSectionId}` : 'https://pinnawalagems.onrender.com/api/workshop';
    const method = isEditing ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert(isEditing ? "Workshop Section Updated! 🛠️" : "Workshop Section Added! 🛠️");
        setShowModal(false);
        setIsEditing(false);
        setEditSectionId(null);
        setFormData({ title: '', description: '', imageUrl: '', layoutType: 'left-text' });
        fetchWorkshopSections();
      } else { alert("Failed to save workshop section."); }
    } catch (err) { console.log(err); }
  };

  const handleEdit = (section) => {
    setFormData({ title: section.title || '', description: section.description || '', imageUrl: section.imageUrl || '', layoutType: section.layoutType || 'left-text' });
    setEditSectionId(section._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this workshop section?")) {
      try {
        const res = await fetch(`https://pinnawalagems.onrender.com/api/workshop/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        if (res.ok) fetchWorkshopSections();
      } catch (err) { console.log(err); }
    }
  };

  const labelCls = 'block font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 mb-1.5';
  const inputCls = 'w-full bg-white border border-slate-200 text-blue-950 font-inter text-sm p-3 focus:outline-none focus:border-blue-950 transition-colors duration-300';
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
      <section className="relative isolate min-h-[520px] overflow-hidden bg-[#08132F]">
        <img
          src="/workshop-hero.png"
          alt="A master craftsman shaping a sapphire in the atelier"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#08132F] via-[#08132F]/85 to-[#08132F]/15" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#08132F]/70 via-transparent to-[#08132F]/20" />

        <div className="workshop-header relative mx-auto flex min-h-[520px] max-w-7xl items-end px-6 pb-16 pt-32 md:px-12 md:pb-20">
          <div className="max-w-2xl">
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-[.42em] text-[#D9B64A]">
              Pinnawala Gems · The atelier journal
            </p>
            <h1 className="font-[Cormorant_Garamond,serif] text-6xl leading-[.9] text-white md:text-8xl">
              Learn the art<br /><em className="text-[#D9B64A]">behind the stone.</em>
            </h1>
            <p className="mt-7 max-w-lg text-sm font-light leading-7 text-slate-200 md:text-base">
              A living archive of our gemology masterclasses, artisan courses, and exhibitions—where Ceylonese craft meets considered education.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-[9px] font-semibold uppercase tracking-[.25em] text-white/70">
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">Masterclasses</span>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">Exhibitions</span>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">Artisan courses</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Workshop Sections ────────────────────────────────────────────── */}
      <main className="relative z-10 mx-auto w-full max-w-7xl px-6 py-20 md:px-12 md:py-28">
        <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.35em] text-[#B8901F]">Past sessions & showcases</p>
            <h2 className="mt-3 font-[Cormorant_Garamond,serif] text-5xl leading-none text-[#0B1330] md:text-6xl">The workshop archive.</h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-slate-500 md:text-right">Stories, skills, and shared knowledge from the people who bring each stone to life.</p>
        </div>

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

                {isAdmin && sections[idx] && (
                  <div className="absolute right-6 top-6 flex gap-2 opacity-60 transition-opacity duration-300 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleEdit(sections[idx])} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.15em] text-white backdrop-blur-sm hover:bg-white/20">Edit</button>
                    <button onClick={() => handleDelete(sections[idx]._id)} className="rounded-full border border-red-300/30 bg-red-500/10 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.15em] text-red-200 hover:bg-red-500/20">Delete</button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      <button type="button" onClick={() => setActiveEventIndex((index) => Math.max(0, index - 1))} disabled={activeEventIndex === 0} className="absolute left-0 top-1/2 z-40 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#dfe4ee] bg-white text-lg text-[#0B1330] shadow-[0_8px_20px_rgba(11,19,48,.12)] transition-all hover:-translate-x-1 hover:border-[#c9a227] hover:text-[#806512] disabled:cursor-not-allowed disabled:opacity-35" aria-label="Previous workshop">←</button>
      <button type="button" onClick={() => setActiveEventIndex((index) => Math.min(displayEvents.length - 1, index + 1))} disabled={activeEventIndex >= displayEvents.length - 1} className="absolute right-0 top-1/2 z-40 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#0B1330] bg-[#0B1330] text-lg text-white shadow-[0_8px_20px_rgba(11,19,48,.14)] transition-all hover:translate-x-1 hover:border-[#c9a227] hover:bg-[#162452] disabled:cursor-not-allowed disabled:opacity-35" aria-label="Next workshop">→</button>
        </div>
      </main>

      {selectedEvent && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#08132F]/75 p-4 backdrop-blur-md" onClick={() => setSelectedEvent(null)}>
          <article className="relative grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/20 bg-[#F7F5F0] shadow-[0_35px_100px_rgba(5,12,32,.4)] md:grid-cols-[.95fr_1.05fr]" onClick={(e) => e.stopPropagation()}>
            <div className="relative min-h-[280px] bg-[#0B1330] md:min-h-[480px]">
              <ImagePlaceholder src={selectedEvent.image} alt={selectedEvent.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1330]/55 via-transparent to-transparent" />
            </div>
            <div className="flex flex-col justify-center px-7 py-10 md:px-12 md:py-14">
              <button type="button" onClick={() => setSelectedEvent(null)} className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-[#dfe4ee] bg-white text-lg text-[#0B1330] transition-colors hover:border-[#c9a227] hover:text-[#806512]" aria-label="Close details">×</button>
              <p className="text-[9px] font-semibold uppercase tracking-[.3em] text-[#b8901f]">{selectedEvent.eyebrow}</p>
              <span className="my-5 h-px w-12 bg-[#c9a227]" />
              <h2 className="font-[Cormorant_Garamond,serif] text-5xl leading-[.95] text-[#0B1330]">{selectedEvent.title}</h2>
              <p className="mt-6 text-sm leading-7 text-slate-600">{selectedEvent.description}</p>
              <div className="mt-8 flex items-center gap-3 border-t border-[#e3e0d8] pt-5 text-[9px] font-semibold uppercase tracking-[.22em] text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-[#c9a227]" /> Pinnawala Gems atelier</div>
            </div>
          </article>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-[#F7F5F0] shadow-[0_30px_90px_rgba(11,19,48,.35)]">

            <div className="flex items-center justify-between bg-[#0B1330] px-6 py-5">
              <h2 className="font-[Cormorant_Garamond,serif] text-2xl text-white">
                {isEditing ? 'Edit Workshop Section' : 'Add New Workshop Section'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-white/60 hover:text-white text-sm transition-colors duration-200">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className={labelCls}>Section Title</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Precision Gem Cutting" className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the workshop process…" rows="4" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Workshop Image</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs text-slate-500 w-full" />
                {isUploading && <p className="font-inter text-[10px] text-blue-600 font-semibold mt-1">Uploading…</p>}
                {formData.imageUrl && <img src={formData.imageUrl} alt="Preview" className="h-20 mt-2 object-cover border border-slate-200" />}
              </div>
              <div className="flex gap-3 border-t border-[#E8E3D3] pt-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="w-1/2 bg-slate-100 text-slate-700 font-inter font-bold text-[10px] uppercase
                             tracking-[0.18em] py-3 hover:bg-white transition-colors duration-200">
                  Cancel
                </button>
                <button type="submit" disabled={isUploading || !formData.title || !formData.imageUrl}
                  className="w-1/2 bg-[#0B1330] text-white font-inter font-bold text-[10px] uppercase
                             tracking-[0.18em] py-3 hover:bg-[#162452] disabled:bg-slate-300
                             transition-colors duration-200">
                  {isEditing ? 'Update Section' : 'Publish Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Workshop;
