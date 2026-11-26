import { BUSINESS } from './businessDetails.js';

const SITE_ORIGIN = 'https://pinnawala-gems.vercel.app';
const PUBLIC_PATH = /^\/(?:catalog|collection|contact|feedback|workshop)?$|^\/(?:collections|category|gem)\/[a-z\d_-]{1,200}$/i;

export const inquiryLine = value => typeof value === 'string' || typeof value === 'number' ? String(value).replace(/\s+/g, ' ').trim().slice(0, 300) : '';

export function whatsappNumber(value) {
  if (typeof value !== 'string' || value.length > 60 || !/^\+?[\d\s()-]+$/.test(value.trim())) return '';
  let digits = value.trim().replace(/[\s()-]/g, '').replace(/^\+/, '');
  if (value.trim().startsWith('+') && digits.startsWith('0')) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  else if (/^0\d{9}$/.test(digits)) digits = '94' + digits.slice(1);
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : '';
}

function publicPath(value) {
  const path = typeof value === 'string' ? value.split(/[?#]/, 1)[0] : '/';
  return PUBLIC_PATH.test(path) ? path : '/';
}

export function publicPageUrl(pathname = '/', origin = SITE_ORIGIN) {
  let base = SITE_ORIGIN;
  try {
    const url = new URL(origin);
    if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) base = url.origin;
  } catch { /* Use the real public website when the origin is not a web URL. */ }
  return base + publicPath(pathname);
}

export function whatsappChatUrl(number, message) {
  const recipient = whatsappNumber(number);
  const body = typeof message === 'string' ? message.trim() : '';
  return recipient && body ? `https://wa.me/${recipient}?text=${encodeURIComponent(body)}` : '';
}

export function websiteInquiryMessage({ pathname = '/', intent, origin } = {}) {
  const path = publicPath(pathname);
  let topic;
  if (intent === 'visit') topic = ["I'd like to plan a visit to your Eheliyagoda showroom.", 'Could you confirm your opening hours and appointment availability?'];
  else if (path.startsWith('/gem/')) topic = ["I'm interested in the gemstone on this page.", 'Could you confirm its availability and share its specifications?'];
  else if (/^\/(?:catalog|collection|collections|category)(?:\/|$)/.test(path)) topic = ["I'm browsing your gemstone collection.", 'Could you help me find an available stone that suits my preferred colour, shape and carat weight?'];
  else if (path === '/workshop') topic = ["I'd like to learn more about your workshops and gemstone training.", 'Could you share upcoming sessions, availability and booking details?'];
  else if (path === '/feedback') topic = ['I have a question about my experience with Pinnawala Gems.', 'Could your team help me?'];
  else if (path === '/contact') topic = ["I'd like to speak with your team about a gemstone or arrange a visit.", 'Could you advise the best time to contact you?'];
  else topic = ["I'm exploring your gemstones and would appreciate some guidance.", 'Could you help me choose a stone and explain the next steps?'];
  return [`Hello ${BUSINESS.name},`, '', ...topic, '', 'Website page:', publicPageUrl(intent === 'visit' ? '/contact' : path, origin)].join('\n');
}

export function websiteWhatsAppUrl({ number = BUSINESS.whatsapp, ...context } = {}) {
  return whatsappChatUrl(number, websiteInquiryMessage(context));
}
