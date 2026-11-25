import { Link } from 'react-router-dom';
import './Footer.css';
import './PublicPhoneNavigation.css';
import { BUSINESS, withBusinessDetails } from './businessDetails';
import ResponsiveImage from './ResponsiveImage';

function Arrow({ up = false }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <path d={up ? 'M12 19V5m-6 6 6-6 6 6' : 'M6 18 18 6M6 6h12v12'} strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

export default function Footer({ contactData = {} }) {
  const contact = withBusinessDetails(contactData);
  const address = contact.address;
  const phone = contact.contactNumber;
  const telephone = BUSINESS.phone;
  const email = contact.inquiryEmail;
  const whatsapp = contact.whatsappNumber;
  const mapsLink = contact.googleMapsLink;

  const backToTop = () => window.scrollTo({
    top: 0,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  });

  return <footer className="pg-footer" aria-label="Site footer">
    <div className="pg-footer__inner">
      <div className="pg-footer__main">
        <div className="pg-footer__brand-column">
          <Link to="/" className="pg-footer__brand" aria-label={`${BUSINESS.name} home`}>
            <span className="pg-footer__logo"><ResponsiveImage src="/logo.png" width="48" height="36" maxWidth={160} sizes="48px" alt="" /></span>
            <span className="pg-footer__brand-name">{BUSINESS.name}<span>{BUSINESS.shipping}</span></span>
          </Link>
          <p className="pg-footer__description"><span className="pg-footer__tagline">{BUSINESS.tagline}</span><br />{BUSINESS.license}</p>
          <div className="pg-footer__origin"><span aria-hidden="true" />{BUSINESS.location}</div>
        </div>

        <div className="pg-footer__contact">
          <h2>Get in touch</h2>
          <address>
            {mapsLink ? <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="pg-footer__address">{address}<Arrow /></a> : <p className="pg-footer__address">{address}</p>}
            {telephone && <a href={`tel:${telephone}`}>{phone}</a>}
            <a href={`tel:${BUSINESS.secondaryPhone}`}>{BUSINESS.secondaryPhone}</a>
            <a className="pg-footer__email" href={`mailto:${email}`}>{email}</a>
          </address>
          {whatsapp && <a className="pg-footer__whatsapp" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" aria-hidden="true"><path d="M20 11.6a8 8 0 0 1-11.8 7L4 20l1.3-4.1A8 8 0 1 1 20 11.6Z" /><path d="M8.4 7.7c-.9 1.9 2 5.7 4.5 6.7 1.2.5 2-.3 2.3-1.1l-2-1-.9.8c-1.2-.6-2-1.4-2.6-2.6l.7-.9-1-1.9Z" strokeLinejoin="round" /></svg><span>Chat on WhatsApp</span><Arrow /></a>}
        </div>
      </div>

      <div className="pg-footer__bottom">
        <p>© {new Date().getFullYear()} {BUSINESS.name}. All rights reserved.</p>
        <button type="button" onClick={backToTop}>Back to top<Arrow up /></button>
      </div>
    </div>
  </footer>;
}
