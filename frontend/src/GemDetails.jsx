import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaWhatsapp } from 'react-icons/fa';
import { MdEmail, MdVerified } from 'react-icons/md';
import './GemDetailsPolish.css';
import GemMediaGallery from './GemMediaGallery';
import { BUSINESS, withBusinessDetails } from './businessDetails';
import { API_BASE } from './hooks/useRemoteResource';

function GemDetails() {
  /* ── All existing state — untouched ─────────────────────────────────── */
  const { stoneId } = useParams();
  const [gem, setGem] = useState(null);
  const [contactInfo, setContactInfo] = useState(() => withBusinessDetails());
  const [loading, setLoading] = useState(true);
  const [loadedStoneId, setLoadedStoneId] = useState(null);

  /* ── All existing fetches — untouched ───────────────────────────────── */
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/inventory/stones/${stoneId}`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error("Stone not found");
        return res.json();
      })
      .then(data => { if (!controller.signal.aborted) { setGem(data); setLoadedStoneId(stoneId); setLoading(false); } })
      .catch(() => { if (!controller.signal.aborted) { setGem(null); setLoadedStoneId(stoneId); setLoading(false); } });

    fetch(`${API_BASE}/home`, { signal: controller.signal })
      .then(res  => res.json())
      .then(data => {
        if (!controller.signal.aborted) setContactInfo(withBusinessDetails(data));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [stoneId]);

  /* ── All existing handlers — untouched ──────────────────────────────── */
  const handleWhatsAppInquiry = () => {
    const message = `Hello ${BUSINESS.name}, I'm interested in the ${gem.title} (Reference ID: ${gem.stoneId || gem._id}). Could you provide more details?`;
    window.open(`https://wa.me/${contactInfo.whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  const handleEmailInquiry = () => {
    const subject = `Inquiry regarding ${gem.title}`;
    const body    = `Hello,\n\nI am interested in the ${gem.title} (Reference ID: ${gem.stoneId || gem._id}) from your collection. Please send me more information.\n\nThank you.`;
    window.location.href = `mailto:${contactInfo.inquiryEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  /* ── Loading / not found ─────────────────────────────────────────────── */
  if (loading || loadedStoneId !== stoneId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="font-playfair text-blue-950/40 text-2xl tracking-widest uppercase animate-pulse">
          Loading…
        </p>
      </div>
    );
  }

  if (!gem) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-blue-950">
        <h2 className="font-playfair text-3xl mb-5 tracking-tight">Gemstone Not Found</h2>
        <Link to="/catalog" className="font-inter text-sm font-semibold tracking-[0.2em] uppercase
                                       border-b border-blue-950 pb-0.5
                                       hover:text-amber-500 hover:border-amber-500 transition-colors duration-300">
          Return to Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="gem-detail-polish min-h-screen bg-white font-inter text-blue-950 flex flex-col">

      <main className="gem-detail-main flex-1 max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-16 sm:pb-20 w-full">
        <div className="mb-6 flex justify-start">
          <Link
            to="/catalog"
            className="gem-detail-back inline-flex items-center gap-2 rounded-full border border-blue-950/20 bg-blue-950 px-5 py-3 text-xs font-bold uppercase tracking-[0.22em] text-white shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-900 hover:text-white hover:shadow-[0_18px_35px_rgba(15,23,42,0.18)]"
          >
            <span className="text-base leading-none">←</span>
            Back to Catalog
          </Link>
        </div>
        <div className="gem-detail-card flex flex-col lg:flex-row overflow-hidden rounded-[30px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">

          <GemMediaGallery key={gem._id || stoneId} gem={gem} />

          {/* ── RIGHT: Gem details ──────────────────────────────────────── */}
          <div className="gem-detail-copy w-full lg:w-[45%] p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col bg-white/90 lg:rounded-r-[30px]">

            {/* Title & ID */}
            <div className="gem-detail-title mb-6 rounded-2xl bg-gradient-to-r from-blue-50 to-amber-50 p-4 ring-1 ring-blue-100">
              <h1 className="font-playfair text-3xl md:text-4xl font-bold text-blue-950 leading-tight tracking-tight mb-2">
                {gem.title}
              </h1>
              <div className="flex items-center gap-2">
                <span className="w-6 h-px bg-slate-300" />
                <p className="font-inter text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Ref: {gem.stoneId || gem._id}
                </p>
              </div>
            </div>

            {/* Description */}
            {gem.description && (
              <p className="gem-detail-description font-inter text-slate-600 text-base leading-8 font-light mb-8 rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3">
                {gem.description}
              </p>
            )}

            {/* Specs grid */}
            <div className="gem-detail-specs grid grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 mb-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
              {[
                gem.weight && ['Weight', `${gem.weight} ct`],
                gem.shape  && ['Shape',  gem.shape],
                gem.cut    && ['Cut',    gem.cut],
                gem.color  && ['Color',  gem.color],
                gem.origin && ['Origin', gem.origin],
                gem.price  && ['Price',  `Rs. ${gem.price}`],
              ].filter(Boolean).map(([label, value]) => (
                <div key={label}>
                  <span className="font-inter text-[9px] uppercase tracking-[0.2em] font-bold text-slate-400 block mb-1">
                    {label}
                  </span>
                  <span className={`font-inter text-base font-bold uppercase ${label === 'Price' ? 'text-green-700' : 'text-blue-950'}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Certificate */}
            {(gem.hasCertificate || gem.certificateDetails) && (
              <div className="gem-detail-certificate mb-8 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-blue-50 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <MdVerified className="text-green-600 text-lg" />
                  <span className="font-inter font-bold text-[11px] uppercase tracking-[0.18em] text-blue-900">
                    Certified Gemstone
                  </span>
                </div>
                {gem.certificateDetails && (
                  <p className="font-inter text-sm text-slate-600 mb-3">
                    Cert No: <span className="font-bold text-blue-950">{gem.certificateDetails}</span>
                  </p>
                )}
                {gem.certificateImage && (
                  <div className="border border-slate-200 p-2 bg-white inline-block mt-1">
                    <p className="font-inter text-[9px] uppercase tracking-[0.15em] font-bold text-slate-400 mb-1.5 text-center">
                      Certificate Preview
                    </p>
                    <a href={gem.certificateImage} target="_blank" rel="noopener noreferrer">
                      <img src={gem.certificateImage} alt="Certificate" className="h-28 object-contain hover:opacity-80 transition-opacity duration-300" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* CTAs */}
            <div className="gem-detail-actions mt-auto flex flex-col gap-3 pt-6 border-t border-slate-200">
              <button
                onClick={handleWhatsAppInquiry}
                className="w-full rounded-2xl bg-[#25D366] text-white font-inter font-bold py-4 px-5
                           tracking-[0.15em] uppercase hover:bg-[#1ebe57] transition-all duration-300
                           flex items-center justify-center gap-3 shadow-[0_18px_35px_rgba(37,211,102,0.28)] hover:-translate-y-0.5"
              >
                <FaWhatsapp className="text-xl" />
                Inquire via WhatsApp
              </button>
              <button
                onClick={handleEmailInquiry}
                className="w-full rounded-2xl bg-blue-950 text-white font-inter font-bold py-4 px-5
                           tracking-[0.15em] uppercase hover:bg-blue-900 transition-all duration-300
                           flex items-center justify-center gap-3 shadow-[0_18px_35px_rgba(23,37,84,0.28)] hover:-translate-y-0.5"
              >
                <MdEmail className="text-xl" />
                Inquire via Email
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default GemDetails;
