import { useEffect, useState } from 'react';
import {
  FaArrowRight,
  FaCalendarCheck,
  FaClock,
  FaComments,
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaTiktok,
  FaWhatsapp,
} from 'react-icons/fa';
import { BUSINESS, withBusinessDetails } from './businessDetails';
import { apiRequest } from './api';
import { websiteWhatsAppUrl } from './whatsappLinks';
import './ContactForm.css';
import './ContactPhone.css';
import ContactHeroImage from './ContactHeroImage';

/* ─── constants ────────────────────────────────────────────────────── */
const GOOGLE_MAPS_EMBED_URL = BUSINESS.mapsEmbedUrl;

/* ─── tiny gem-facet SVG decoration ────────────────────────────────── */
/* ─── shared input class ────────────────────────────────────────────── */
const inputCls =
  'w-full rounded-lg border border-[#E4E1D9] bg-[#FBFBFA] px-4 py-3 text-sm text-[#101936] outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-[#C9A227] focus:bg-white focus:ring-4 focus:ring-[#C9A227]/10';

/* ─── Contact page ──────────────────────────────────────────────────── */
function Contact() {
  const [contactInfo, setContactInfo] = useState(() => withBusinessDetails({
    openingHours: '',
    facebookLink: '',
    instagramLink: '',
    tiktokLink: '',
  }, 'contact'));

  const [form, setForm]   = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent]   = useState(false);
  const isEditing = false;

  /* fetch live contact data */
  useEffect(() => {
    const controller = new AbortController();
    apiRequest('contact', { signal: controller.signal }, { auth: false })
      .then((data) => {
        if (data && !controller.signal.aborted)
          setContactInfo(withBusinessDetails({
            ...data,
            facebookLink:     data.facebookLink     || '',
            instagramLink:    data.instagramLink    || '',
            tiktokLink:       data.tiktokLink       || '',
          }, 'contact'));
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const changeForm  = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submitForm  = (e) => {
    e.preventDefault();
    const body = `Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\n\n${form.message}`;
    window.location.href = `mailto:${contactInfo.email}?subject=${encodeURIComponent(
      form.subject || `New enquiry from ${BUSINESS.name} website`,
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  /* admin helpers (kept intact) */
  const handleChange = (e) => setContactInfo({ ...contactInfo, [e.target.name]: e.target.value });
  const handleSave   = async () => {
    try {
      await apiRequest('contact', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(contactInfo),
      });
      alert('Contact page updated successfully!');
    } catch (error) {
      console.log(error);
    }
  };

  const phone = BUSINESS.phoneDisplay;
  const whatsappUrl = websiteWhatsAppUrl({ pathname: "/contact", origin: window.location.origin });
  /* info cards data */
  const infoCards = [
    {
      icon: <FaMapMarkerAlt className="text-lg" />,
      label: 'Visit us',
      value: contactInfo.address,
      href: BUSINESS.mapsUrl,
    },
    {
      icon: <FaEnvelope className="text-lg" />,
      label: 'Email Us',
      value: contactInfo.email,
      href: `mailto:${contactInfo.email}`,
    },
    {
      icon: <FaPhoneAlt className="text-lg" />,
      label: 'Call us',
      value: phone,
      href: `tel:${BUSINESS.phone}`,
    },
    {
      icon: <FaWhatsapp className="text-lg" />,
      label: 'WhatsApp / secondary',
      value: BUSINESS.secondaryPhone,
      href: whatsappUrl,
    },
  ];

  /* social links — each entry: [href, icon, label, hoverBg, hoverText, hoverBorder] */
  const socials = [
    contactInfo.facebookLink  && [contactInfo.facebookLink,  <FaFacebookF />,  'Facebook',  '#1877F2', '#fff', '#1877F2'],
    contactInfo.instagramLink && [contactInfo.instagramLink, <FaInstagram />,  'Instagram', '#E1306C', '#fff', '#E1306C'],
    [whatsappUrl,                     <FaWhatsapp />,   'WhatsApp',  '#25D366', '#fff', '#25D366'],
    contactInfo.tiktokLink    && [contactInfo.tiktokLink,    <FaTiktok />,     'TikTok',    '#000000', '#fff', '#000000'],
  ].filter(Boolean);

  return (
    <div className="pg-contact min-h-screen overflow-hidden bg-[#F7F5F0] text-[#101936]">
      {/* ── keyframes ── */}
      <style>{`
        @keyframes pgReveal {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes pgFloat {
          0%,100% { transform: translateY(0)     rotate(0deg); }
          50%      { transform: translateY(-10px) rotate(2deg); }
        }
        .pg-reveal { animation: pgReveal .9s cubic-bezier(.16,1,.3,1) both; }
        .pg-float  { animation: pgFloat  8s ease-in-out infinite; }
        .pg-btn { position:relative; overflow:hidden; }
        .pg-btn::after {
          content:''; position:absolute; inset:0;
          transform:translateX(-120%);
          background:linear-gradient(105deg,transparent,rgba(255,255,255,.25),transparent);
          transition:transform .65s;
        }
        .pg-btn:hover::after { transform:translateX(120%); }
        @media(prefers-reduced-motion:reduce){
          .pg-reveal,.pg-float{animation:none!important}
          .pg-btn::after{display:none}
        }
      `}</style>

      {/* ════════════════════════════════════════════
          HERO BANNER — full quality gem photo + elegant ascending wave
      ════════════════════════════════════════════ */}
      <section data-contact-hero className="pg-contact-banner relative overflow-hidden" style={{ paddingBottom: 'var(--contact-wave-height, 130px)' }}>
        {/* ── FULL QUALITY background — no opacity reduction on the image itself ── */}
        <ContactHeroImage />

        {/* ── ONLY a top-to-bottom gradient so text is readable
              but the bottom of the image (gem) shows with ZERO dimming ── */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(8,19,47,0.72) 0%, rgba(8,19,47,0.45) 50%, rgba(8,19,47,0.0) 100%)',
          }}
        />

        {/* ── hero text ── */}
        <div className="pg-contact-banner-copy relative z-10 flex flex-col items-center justify-center px-6 pb-24 pt-32 text-center text-white md:pb-32 md:pt-44">
          <p className="pg-reveal mb-4 text-[10px] font-semibold uppercase tracking-[.45em] text-[#D9B64A]"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
            {BUSINESS.name} · Private appointments
          </p>

          <h1
            className="pg-reveal pg-contact-serif text-6xl leading-none md:text-7xl"
            style={{ animationDelay: '.1s', textShadow: '0 4px 24px rgba(0,0,0,0.6)' }}
          >
            Contact <em className="italic text-[#D9B64A]">us</em>
          </h1>

          {/* gold line divider */}
          <div className="pg-reveal mt-5 h-[2px] w-10 bg-[#C9A227]" style={{ animationDelay: '.18s' }} />

          <p
            className="pg-reveal mx-auto mt-5 max-w-lg text-sm font-light leading-7 text-slate-100 md:text-base"
            style={{ animationDelay: '.25s', textShadow: '0 2px 12px rgba(0,0,0,0.55)' }}
          >
            We are here to assist you with enquiries, custom orders,
            <br className="hidden sm:block" /> and any information about our gemstones and services.
          </p>
        </div>

        {/* ════════ SMOOTH ASCENDING WAVE — single clean cubic bezier ════════
            Rises steadily from bottom-left → top-right.
            One simple C-curve: no kinks, no weird bumps, just elegance.
        ════════════════════════════════════════════════════════════════ */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]" style={{ height: 'var(--contact-wave-height, 130px)' }}>
          <svg
            viewBox="0 0 1440 130"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="relative block h-full w-full"
          >
            {/* Single smooth cubic bezier: low-left (y=118) → high-right (y=8) */}
            <path
              d="M0,118 C360,130 900,20 1440,8 L1440,130 L0,130 Z"
              fill="#F7F5F0"
            />
          </svg>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          ADMIN EDIT PANEL
      ════════════════════════════════════════════ */}
      {isEditing && (
        <div className="mx-auto mt-16 max-w-5xl rounded-2xl border border-[#E8E3D3] bg-white p-8">
          <h2 className="pg-contact-serif text-3xl">Edit Contact Details</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {[
              'address','landlineNumber','landlineNumber2','mobileNumber',
              'mobileNumber2','email','openingHours','facebookLink','instagramLink','tiktokLink',
            ].map((field) => (
              <label key={field} className="text-xs font-semibold uppercase tracking-widest text-[#B8901F]">
                {field}
                <input
                  name={field}
                  value={contactInfo[field] || ''}
                  onChange={handleChange}
                  className={`${inputCls} mt-2`}
                />
              </label>
            ))}
          </div>
          <button
            onClick={handleSave}
            className="pg-btn mt-8 rounded-full bg-[#0B1330] px-8 py-3 text-xs font-semibold uppercase tracking-widest text-white"
          >
            Save changes
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════════ */}
      {!isEditing && (
        <main id="main-content" className="pg-contact-main relative mx-auto max-w-6xl px-5 pb-28 md:px-10">

          {/* ── two-column white card — sits on top of the wave ── */}
          <section className="pg-contact-panel pg-reveal relative z-10 -mt-16 overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_28px_80px_rgba(11,19,48,.16)] md:-mt-24 md:grid md:grid-cols-[.9fr_1.1fr]">

            {/* ── LEFT: Get in touch ── */}
            <div className="pg-contact-information relative overflow-hidden rounded-t-[2rem] bg-[#0B1330] px-7 py-10 md:rounded-[2rem_7rem_7rem_2rem] md:px-10 md:py-12">

              {/* soft orbital lines make the dark panel feel more organic */}
              <span className="pointer-events-none absolute -right-44 top-1/2 h-[32rem] w-[32rem] -translate-y-1/2 rounded-full border border-[#D9B64A]/10" />
              <span className="pointer-events-none absolute -right-24 top-1/2 h-[23rem] w-[23rem] -translate-y-1/2 rounded-full border border-[#D9B64A]/10" />
              <span className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-[#1D2D5A]/60 blur-3xl" />

              <div className="relative z-10">
                {/* eyebrow */}
                <p className="pg-contact-intro-eyebrow text-[9px] font-semibold uppercase tracking-[.35em] text-[#D9B64A]">
                  A considered conversation
                </p>

                {/* heading */}
                <h2 className="pg-contact-info-heading pg-contact-serif mt-3 text-4xl leading-none text-white md:text-5xl">
                  Get in<br />
                  <em className="text-[#D9B64A]">touch.</em>
                </h2>

                <p className="pg-contact-info-intro mt-5 max-w-xs text-sm leading-6 text-slate-400">
                  Whether you are searching for a meaningful gift or a stone to keep forever,
                  begin with a conversation.
                </p>

                {/* info cards */}
                <div className="pg-contact-methods mt-9 space-y-5">
                  {infoCards.map((item) => (
                    <div key={item.label} className="pg-contact-method group flex items-start gap-4">
                      {/* icon diamond */}
                      <span className="flex h-11 w-11 shrink-0 rotate-45 items-center justify-center rounded-xl bg-[#C9A227]/15 text-[#D9B64A] shadow-lg transition-all duration-300 group-hover:bg-[#C9A227] group-hover:text-[#0B1330]">
                        <span className="-rotate-45 transition-transform duration-300">{item.icon}</span>
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-semibold uppercase tracking-[.2em] text-slate-500">
                          {item.label}
                        </p>
                        {item.href ? (
                          <a
                            href={item.href}
                            target={item.href.startsWith('https://wa.me/') ? '_blank' : undefined}
                            rel={item.href.startsWith('https://wa.me/') ? 'noopener noreferrer' : undefined}
                            className="pg-contact-serif mt-1 block break-words text-lg text-white transition-colors hover:text-[#D9B64A]"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="pg-contact-serif mt-1 text-lg leading-6 text-white">
                            {item.value}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* social links */}
                {socials.length > 0 && (
                  <div className="pg-contact-socials mt-9 border-t border-white/10 pt-6">
                    <div className="flex gap-2">
                      {socials.map(([href, icon, label, hoverBg, hoverText, hoverBorder]) => (
                        <a
                          key={label}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={label}
                          className="social-icon group relative flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-[13px] text-slate-400 transition-all duration-300 hover:-translate-y-1"
                          style={{ '--hover-bg': hoverBg, '--hover-text': hoverText, '--hover-border': hoverBorder }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = hoverBg;
                            e.currentTarget.style.color = hoverText;
                            e.currentTarget.style.borderColor = hoverBorder;
                            e.currentTarget.style.boxShadow = `0 4px 14px ${hoverBg}55`;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = '';
                            e.currentTarget.style.color = '';
                            e.currentTarget.style.borderColor = '';
                            e.currentTarget.style.boxShadow = '';
                          }}
                        >
                          {icon}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: Send us a message ── */}
            <div className="pg-contact-message relative bg-white px-7 py-10 md:rounded-l-[4rem] md:px-10 md:py-12">
              {/* header */}
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="pg-contact-serif text-4xl leading-none text-[#0B1330] md:text-5xl">
                    Send us a <em className="text-[#B8901F]">message.</em>
                  </h2>
                </div>
              </div>

              {/* success state */}
              {sent ? (
                <div className="mt-12 rounded-xl border border-emerald-200 bg-emerald-50 p-7 text-center">
                  <p className="pg-contact-serif text-3xl text-[#0B1330]">
                    Thank you.
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Your email client is ready with your enquiry. We look forward to speaking with
                    you.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="mt-5 text-xs font-semibold uppercase tracking-widest text-[#B8901F]"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                /* form */
                <form onSubmit={submitForm} className="contact-enquiry-form mt-8 grid gap-4 sm:grid-cols-2">
                  {/* Name */}
                  <label className="text-[9px] font-semibold uppercase tracking-[.2em] text-slate-500">
                    Name
                    <input
                      required
                      name="name"
                      value={form.name}
                      onChange={changeForm}
                      placeholder="Your name"
                      className={`${inputCls} mt-2`}
                    />
                  </label>

                  {/* Company (decorative — maps to subject) */}
                  <label className="text-[9px] font-semibold uppercase tracking-[.2em] text-slate-500">
                    Subject
                    <input
                      name="subject"
                      value={form.subject}
                      onChange={changeForm}
                      placeholder="How can we help?"
                      className={`${inputCls} mt-2`}
                    />
                  </label>

                  {/* Phone */}
                  <label className="text-[9px] font-semibold uppercase tracking-[.2em] text-slate-500">
                    Phone
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={changeForm}
                      placeholder="+94 77 000 0000"
                      className={`${inputCls} mt-2`}
                    />
                  </label>

                  {/* Email */}
                  <label className="text-[9px] font-semibold uppercase tracking-[.2em] text-slate-500">
                    Email
                    <input
                      required
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={changeForm}
                      placeholder="you@example.com"
                      className={`${inputCls} mt-2`}
                    />
                  </label>

                  {/* Message */}
                  <label className="text-[9px] font-semibold uppercase tracking-[.2em] text-slate-500 sm:col-span-2">
                    Message
                    <textarea
                      required
                      name="message"
                      value={form.message}
                      onChange={changeForm}
                      placeholder="Tell us about the gem you are looking for…"
                      rows="4"
                      className={`${inputCls} mt-2 resize-none`}
                    />
                  </label>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="pg-btn group flex items-center justify-center gap-3 rounded-full bg-[#C9A227] px-7 py-3.5 text-xs font-semibold uppercase tracking-[.2em] text-[#0B1330] transition-all duration-300 hover:bg-[#0B1330] hover:text-white sm:col-span-2"
                  >
                    Send enquiry
                    <FaArrowRight className="transition-transform group-hover:translate-x-1" />
                  </button>
                </form>
              )}
            </div>
          </section>

          {/* ════════════════════════════════════════════
              QUICK-INFO STAT STRIP
          ════════════════════════════════════════════ */}
          <section className="pg-contact-practical mt-16 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              {
                icon: <FaClock />,
                title: 'Opening Hours',
                body: contactInfo.openingHours || 'Contact us for current opening hours.',
              },
              {
                icon: <FaCalendarCheck />,
                title: 'Visit Us',
                body: 'Call us to arrange your visit.',
              },
              {
                icon: <FaComments />,
                title: BUSINESS.shipping,
                body: 'Contact our team for shipping details.',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="group relative flex min-h-[142px] items-start gap-4 overflow-hidden rounded-2xl border border-[#E8E3D3] bg-white p-6 shadow-[0_10px_30px_rgba(11,19,48,.06)] transition-all duration-500 hover:-translate-y-2 hover:border-[#C9A227]/60 hover:shadow-[0_22px_42px_rgba(11,19,48,.14)]"
              >
                <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A227] to-transparent opacity-50 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0B1330] text-base text-[#D9B64A] shadow-[0_8px_18px_rgba(11,19,48,.16)] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#C9A227] group-hover:text-[#0B1330]">
                  {card.icon}
                </span>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[.25em] text-[#B8901F]">
                    {card.title}
                  </p>
                  <p className="pg-contact-serif mt-2 text-[1.18rem] leading-6 text-[#0B1330]">
                    {card.body}
                  </p>
                </div>
              </div>
            ))}
          </section>

          {/* ════════════════════════════════════════════
              MAP SECTION
          ════════════════════════════════════════════ */}
          <section className="pg-contact-map relative mt-20 md:mt-28">
            {/* section header */}
            <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[.35em] text-[#B8901F]">
                  Come and see us
                </p>
                <h2 className="pg-contact-serif mt-3 text-4xl text-[#0B1330] md:text-5xl">
                  Find us in <em className="text-[#B8901F]">Eheliyagoda.</em>
                </h2>
              </div>
              <a
                href={BUSINESS.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#B8901F] transition-colors hover:text-[#0B1330] sm:flex"
              >
                Open in maps <FaArrowRight />
              </a>
            </div>

            {/* map embed */}
            <div className="relative h-[300px] overflow-hidden rounded-2xl border-[6px] border-white bg-white shadow-[0_20px_60px_rgba(11,19,48,.12)] md:h-[400px]">
              <iframe
                src={contactInfo.googleMapsLink || GOOGLE_MAPS_EMBED_URL}
                title={`${BUSINESS.name} location`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen=""
                referrerPolicy="no-referrer-when-downgrade"
              />

              {/* floating address badge */}
              <div className="pointer-events-none absolute left-5 top-5 rounded-xl bg-[#0B1330]/95 px-5 py-4 text-white shadow-xl backdrop-blur-sm">
                <p className="text-[9px] font-semibold uppercase tracking-[.25em] text-[#D9B64A]">
                  {BUSINESS.name}
                </p>
                <p className="pg-contact-serif mt-1 max-w-[200px] text-lg leading-5">
                  {contactInfo.address}
                </p>
              </div>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

export default Contact;
