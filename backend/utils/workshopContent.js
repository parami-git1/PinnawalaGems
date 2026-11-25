const { invalid, pick, string, url } = require('./catalogData');
const { validPlannerDay } = require('./plannerFields');
const FIELDS = ['title', 'description', 'imageUrl', 'publicationStatus', 'publishAt', 'eventDate', 'eventTime', 'locationName', 'locationAddress', 'locationUrl', 'phoneNumber', 'whatsappNumber'];

function phoneNumber(value) {
  const clean = string(value, 'Contact number', { max: 60 });
  if (!clean) return '';
  if (!/^[+\d\s()-]+$/.test(clean)) throw invalid('Enter a valid international or Sri Lankan contact number.');
  let digits = clean.replace(/[\s()-]/g, '');
  if (digits.startsWith('00')) digits = '+' + digits.slice(2);
  else if (/^0\d{9}$/.test(digits)) digits = '+94' + digits.slice(1);
  else if (!digits.startsWith('+')) digits = '+' + digits;
  if (!/^\+[1-9]\d{7,14}$/.test(digits)) throw invalid('Enter a valid contact number with country code, or a Sri Lankan 0-prefixed number.');
  return digits;
}

function instant(value) {
  if (value === '' || value === null) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(value) || !validPlannerDay(value.slice(0, 10))) throw invalid('Publication time must be a valid ISO date and time with an explicit timezone.');
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw invalid('Choose a valid publication date and time.');
  return date;
}

function workshopPayload(body, existing, now = new Date()) {
  const payload = pick(body, FIELDS);
  for (const [key, max] of [['title', 200], ['description', 10000], ['locationName', 200], ['locationAddress', 500]]) {
    if (key in payload) payload[key] = string(payload[key], key, { required: key === 'title' || key === 'description', max });
  }
  for (const key of ['imageUrl', 'locationUrl']) if (key in payload && (typeof payload[key] !== 'string' || /[\\\u0000-\u001f\u007f]/.test(payload[key]))) throw invalid('Use a valid image or map URL without backslashes or control characters.');
  if ('imageUrl' in payload) payload.imageUrl = url(payload.imageUrl, 'Workshop image');
  if ('locationUrl' in payload) payload.locationUrl = url(payload.locationUrl, 'Location map URL', { optional: true, relative: false });
  for (const key of ['phoneNumber', 'whatsappNumber']) if (key in payload) payload[key] = phoneNumber(payload[key]);
  if ('publicationStatus' in payload && !['published', 'scheduled', 'draft'].includes(payload.publicationStatus)) throw invalid('Choose Publish now, Schedule publication or Draft.');
  if ('publishAt' in payload) payload.publishAt = instant(payload.publishAt);
  if ('eventDate' in payload) { payload.eventDate = string(payload.eventDate, 'Event date', { max: 10 }); if (!validPlannerDay(payload.eventDate)) throw invalid('Choose a valid event date in YYYY-MM-DD format.'); }
  if ('eventTime' in payload) { payload.eventTime = string(payload.eventTime, 'Event time', { max: 5 }); if (payload.eventTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(payload.eventTime)) throw invalid('Choose a valid event time in HH:mm format.'); }
  const previous = existing?.toObject ? existing.toObject() : existing || {};
  const next = { publicationStatus: 'published', eventDate: '', eventTime: '', ...previous, ...payload };
  if (next.eventTime && !next.eventDate) throw invalid('Add an event date before setting the workshop time.');
  if (next.publicationStatus === 'scheduled') {
    const time = next.publishAt ? new Date(next.publishAt).getTime() : NaN;
    if (!Number.isFinite(time)) throw invalid('Choose a publication date and time for a scheduled post.');
    const unchanged = previous.publicationStatus === 'scheduled' && time === new Date(previous.publishAt).getTime();
    if (!unchanged && time <= now.getTime()) throw invalid('Choose a future publication time, or publish the post now.');
  } else if ('publicationStatus' in payload || !existing) payload.publishAt = null;
  return payload;
}

function publicWorkshopQuery(now = new Date()) {
  return { $or: [{ publicationStatus: { $exists: false } }, { publicationStatus: 'published' }, { publicationStatus: 'scheduled', publishAt: { $ne: null, $lte: now } }] };
}
module.exports = { phoneNumber, workshopPayload, publicWorkshopQuery };
