import { BUSINESS } from './businessDetails.js';

const line = value => typeof value === 'string' || typeof value === 'number' ? String(value).replace(/\s+/g, ' ').trim().slice(0, 300) : '';

export function gemDetailUrl(gem, origin = 'https://pinnawala-gems.vercel.app') {
  const id = line(gem?._id);
  if (!/^[a-z\d_-]{1,200}$/i.test(id)) return '';
  let base = 'https://pinnawala-gems.vercel.app';
  try {
    const parsed = new URL(origin);
    if (['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password) base = parsed.origin;
  } catch { /* Use the production origin when the supplied origin is invalid. */ }
  return `${base}/gem/${encodeURIComponent(id)}`;
}

export function gemInquiryMessage(gem, origin) {
  const title = line(gem?.title) || 'this gemstone';
  const reference = line(gem?.stoneId) || line(gem?._id);
  const weight = line(gem?.weight).replace(/\s*(?:cts?\.?|carats?)$/i, '').trim();
  const details = [
    `Gemstone: ${title}`, reference && `Gem ID: ${reference}`,
    weight && `Weight: ${weight} ct`,
    line(gem?.color) && `Colour: ${line(gem.color)}`,
    line(gem?.shape) && `Shape: ${line(gem.shape)}`,
    line(gem?.cut) && `Cut: ${line(gem.cut)}`,
    line(gem?.origin) && `Origin: ${line(gem.origin)}`,
    gem?.hasCertificate === true && 'Certificate: available',
  ].filter(Boolean);
  const url = gemDetailUrl(gem, origin);
  return [`Hello ${BUSINESS.name},`, "I'm interested in this gemstone.", '', ...details, ...(url ? ['', 'View this gemstone:', url] : []), '', 'Could you confirm availability and share more details?'].join('\n');
}

export function gemWhatsAppUrl(gem, number = BUSINESS.whatsapp, origin) {
  const digits = String(number || '').replace(/[+\s()-]/g, '');
  const recipient = /^[1-9]\d{7,14}$/.test(digits) ? digits : BUSINESS.whatsapp;
  return `https://wa.me/${recipient}?text=${encodeURIComponent(gemInquiryMessage(gem, origin))}`;
}
