const ZONE = 'Asia/Colombo';

export function isDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function sriLankaInstant(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return '';
  const [date, time] = value.split('T');
  if (!isDateKey(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return '';
  return new Date(`${value}:00+05:30`).toISOString();
}

export function sriLankaInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const part = type => parts.find(item => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
}

export function workshopDateTimeLabel(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('en-GB', { timeZone: ZONE, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date) : '';
}

export function normalizeWorkshopPhone(value) {
  if (typeof value !== 'string') return '';
  const clean = value.trim();
  if (!clean || clean.length > 60 || !/^[+\d\s()-]+$/.test(clean)) return '';
  let digits = clean.replace(/[\s()-]/g, '');
  if (digits.startsWith('00')) digits = '+' + digits.slice(2);
  else if (/^0\d{9}$/.test(digits)) digits = '+94' + digits.slice(1);
  else if (!digits.startsWith('+')) digits = '+' + digits;
  return /^\+[1-9]\d{7,14}$/.test(digits) ? digits : '';
}

export function safeWorkshopLocationUrl(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 2048 || /[\\\u0000-\u001f\u007f]/.test(value)) return '';
  try {
    const url = new URL(value.trim());
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

export function workshopContactLinks(post) {
  const phone = normalizeWorkshopPhone(post?.phoneNumber);
  const whatsapp = normalizeWorkshopPhone(post?.whatsappNumber);
  return { call: phone ? `tel:${phone}` : '', whatsapp: whatsapp ? `https://wa.me/${whatsapp.slice(1)}` : '' };
}

export function workshopPublication(post, now = Date.now()) {
  if (post?.publicationStatus === 'draft') return 'draft';
  if (post?.publicationStatus === 'scheduled') {
    const time = post.publishAt ? new Date(post.publishAt).getTime() : NaN;
    return Number.isFinite(time) && time <= now ? 'published' : 'scheduled';
  }
  return 'published';
}

export function workshopEventLabel(post) {
  if (!isDateKey(post?.eventDate)) return '';
  const date = new Date(`${post.eventDate}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(post?.eventTime || '') ? `${date} · ${post.eventTime} (Sri Lanka)` : date;
}
