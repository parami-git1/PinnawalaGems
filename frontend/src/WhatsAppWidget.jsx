import { useEffect, useId, useRef, useState } from 'react';
import { BUSINESS, withBusinessDetails } from './businessDetails';
import './WhatsAppWidget.css';
import ResponsiveImage from './ResponsiveImage';
import { websiteWhatsAppUrl } from './whatsappLinks';

function ChatIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M20 11.6a8 8 0 0 1-11.8 7L4 20l1.3-4.1A8 8 0 1 1 20 11.6Z" /><path d="M8.4 7.7c-.9 1.9 2 5.7 4.5 6.7 1.2.5 2-.3 2.3-1.1l-2-1-.9.8c-1.2-.6-2-1.4-2.6-2.6l.7-.9-1-1.9Z" strokeLinejoin="round" /></svg>;
}

function WhatsAppWidget({ contactData = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [assistantReady, setAssistantReady] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const [phoneViewport, setPhoneViewport] = useState(() => window.matchMedia('(max-width: 599px)').matches);
  const [footerVisible, setFooterVisible] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const widgetRef = useRef(null);
  const triggerRef = useRef(null);
  const closeRef = useRef(null);
  const visibleRef = useRef(false);
  const dialogId = useId();
  const whatsappNumber = withBusinessDetails(contactData).whatsappNumber;

  useEffect(() => {
    const updateVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  useEffect(() => {
    const phone = window.matchMedia('(max-width: 599px)');
    const updateViewport = () => setPhoneViewport(phone.matches);
    phone.addEventListener('change', updateViewport);
    const footer = document.querySelector('.pg-footer');
    const observer = footer && 'IntersectionObserver' in window
      ? new IntersectionObserver(([entry]) => setFooterVisible(entry.isIntersecting), { threshold: 0 })
      : null;
    if (observer) observer.observe(footer);
    return () => { observer?.disconnect(); phone.removeEventListener('change', updateViewport); };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // A small return buffer prevents repeated entrances near the scroll boundary.
      const nextVisible = window.scrollY > (visibleRef.current ? 220 : 300);
      if (nextVisible === visibleRef.current) return;
      visibleRef.current = nextVisible;
      if (nextVisible) setHasEntered(true);
      setShowWidget(nextVisible);
      if (!nextVisible) setIsOpen(false);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    closeRef.current?.focus({ preventScroll: true });
    const handleOutsidePointer = (event) => {
      if (!widgetRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      triggerRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener('pointerdown', handleOutsidePointer);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const closeChat = () => {
    setIsOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  };
  // Start loading only after the first scroll, then keep the decoded image mounted.
  // The whole widget enters together instead of revealing a late-loading portrait.
  // The footer already provides a WhatsApp link. On phones, make room for its
  // contact details without dismissing an open conversation or a focused control.
  const hiddenForFooter = phoneViewport && footerVisible && !isOpen && !hasFocus;
  const isVisible = showWidget && assistantReady && !hiddenForFooter;
  if (!hasEntered || !whatsappNumber) return null;

  return <div ref={widgetRef} className={`pg-whatsapp${isVisible ? ' is-visible' : ''}${isOpen ? ' is-open' : ''}${hiddenForFooter ? ' is-footer-muted' : ''}`} data-page-visible={pageVisible} inert={!isVisible} aria-hidden={!isVisible} onFocusCapture={() => setHasFocus(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false); }}>
    {isOpen && <div id={dialogId} role="dialog" aria-labelledby={`${dialogId}-title`} className="pg-whatsapp__dialog">
      <div className="pg-whatsapp__header"><div><p className="pg-whatsapp__brand">{BUSINESS.name}</p><h2 id={`${dialogId}-title`}>A little guidance?</h2></div><button ref={closeRef} type="button" onClick={closeChat} aria-label="Close WhatsApp chat" className="pg-whatsapp__close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /></svg></button></div>
      <p className="pg-whatsapp__description">Tell us what you have in mind. We can help with gemstone details, choosing a stone, or planning a visit.</p>
      <a href={websiteWhatsAppUrl({ number: whatsappNumber, pathname: "/", origin: window.location.origin })} target="_blank" rel="noopener noreferrer" onClick={closeChat} className="pg-whatsapp__link"><span><ChatIcon />Chat on WhatsApp</span><span aria-hidden="true">↗</span></a>
      <p className="pg-whatsapp__hint">Opens WhatsApp in a new tab.</p>
    </div>}
    {!isOpen && <span className="pg-whatsapp__caption" aria-hidden="true"><strong>Ayubowan.</strong><span>Let us help you find your gem.</span></span>}
    <button ref={triggerRef} type="button" aria-label={isOpen ? 'Close WhatsApp assistance' : 'Open WhatsApp assistance'} aria-haspopup="dialog" aria-expanded={isOpen} aria-controls={isOpen ? dialogId : undefined} onClick={() => setIsOpen((current) => !current)} className="pg-whatsapp__trigger">
      <ResponsiveImage src="/assistant.png" alt="" width="408" height="612" maxWidth={408} sizes="(max-width:599px) 88px,112px" loading="eager" fetchPriority="low" fade={false} preservePrevious onReady={() => setAssistantReady(true)} className="pg-whatsapp__assistant" />
      <span className="pg-whatsapp__badge" aria-hidden="true"><ChatIcon /></span>
    </button>
  </div>;
}

export default WhatsAppWidget;
