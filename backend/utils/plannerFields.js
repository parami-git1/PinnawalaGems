const LEGACY_NOTE_COLORS = new Set(['slate', 'blue', 'amber', 'green', 'rose']);
const { invalid, pick, string, bool, number, objectId } = require('./catalogData');
const APPOINTMENT_FIELDS = ['customerName', 'email', 'phone', 'date', 'time', 'durationMinutes', 'type', 'color', 'status', 'purpose', 'stoneId', 'internalNotes'];
const NOTE_FIELDS = ['title', 'content', 'category', 'tags', 'color', 'isPinned', 'isArchived', 'reminderAt', 'noteDate', 'customerName', 'appointmentId'];
const APPOINTMENT_STATUSES = ['Requested', 'Confirmed', 'Completed', 'Cancelled', 'No-show'];
const NOTE_CATEGORIES = ['General', 'Customer', 'Gem', 'Follow-up', 'Task'];

// Only a CSS hex color is accepted for new custom colors. Do not store arbitrary
// CSS text: the planner uses this value as a presentation accent in the browser.
function validPlannerColor(value, allowLegacy = false) {
  return value == null || value === '' || (typeof value === 'string' && (/^#[\da-f]{6}$/i.test(value) || (allowLegacy && LEGACY_NOTE_COLORS.has(value))));
}

// A note's calendar day is not an instant. Store the literal YYYY-MM-DD to avoid
// moving it to another day when the browser or database host uses another zone.
function validPlannerDay(value) {
  if (value == null || value === '') return true;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validPlannerInstant(value, dateOnly = false) {
  if (typeof value !== 'string' || !value || !validPlannerDay(value.slice(0, 10))) return false;
  if (dateOnly && /^\d{4}-\d{2}-\d{2}$/.test(value)) return true;
  return /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(value) && Number.isFinite(new Date(value).getTime());
}

function plannerPayload(body, kind) {
  const payload = pick(body, kind === 'appointment' ? APPOINTMENT_FIELDS : NOTE_FIELDS);
  for (const [key, value] of Object.entries(payload)) {
    if (['date', 'reminderAt'].includes(key)) {
      if (key === 'reminderAt' && (value === null || value === '')) payload[key] = null;
      else if (!validPlannerInstant(value, key === 'date')) throw invalid(`Choose a valid ${key === 'date' ? 'appointment date' : 'reminder timestamp with timezone'}.`);
    } else if (key === 'time') {
      if (typeof value !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) throw invalid('Choose a valid appointment time in HH:mm format.');
    } else if (key === 'noteDate') {
      if (!validPlannerDay(value)) throw invalid('Choose a valid calendar date in YYYY-MM-DD format.');
    } else if (key === 'durationMinutes') {
      payload[key] = number(value, 'Duration', { integer: true });
      if (payload[key] < 15) throw invalid('Duration must be at least 15 minutes.');
    } else if (['isPinned', 'isArchived'].includes(key)) payload[key] = bool(value, key);
    else if (['stoneId', 'appointmentId'].includes(key)) payload[key] = value === null || value === '' ? null : objectId(value, 'Linked record');
    else if (key === 'tags') {
      if (!Array.isArray(value)) throw invalid('Tags must be a list of text values.');
      payload[key] = value.map(tag => string(tag, 'Tag', { max: 100000 })).filter(Boolean);
    } else {
      // The existing 100 kB JSON limit bounds note content. Do not impose a
      // shorter new content limit that could prevent editing older notes.
      payload[key] = value === null && !['title', 'content', 'customerName'].includes(key) ? '' : string(value, key, { required: ['title', 'content'].includes(key) || kind === 'appointment' && key === 'customerName', max: 100000 });
    }
  }
  return payload;
}

function plannerQuery(query, kind) {
  const result = {};
  if (query.search != null && query.search !== '') {
    const search = string(query.search, 'Search', { max: 100 });
    if (search) result.$or = (kind === 'appointment' ? ['customerName', 'email', 'phone', 'purpose'] : ['title', 'content', 'tags', 'customerName']).map(field => ({ [field]: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }));
  }
  const filter = kind === 'appointment' ? 'status' : 'category';
  if (query[filter] != null && query[filter] !== '') {
    if (!(kind === 'appointment' ? APPOINTMENT_STATUSES : NOTE_CATEGORIES).includes(query[filter])) throw invalid(`Choose a valid ${filter}.`);
    result[filter] = query[filter];
  }
  if (kind === 'note' && query.archived != null) {
    if (!['true', 'false'].includes(query.archived)) throw invalid('Archived must be true or false.');
    result.isArchived = query.archived === 'true';
  }
  if (kind === 'appointment') {
    for (const key of ['from', 'to']) if (query[key] != null && query[key] !== '' && (typeof query[key] !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(query[key]) || !validPlannerDay(query[key]))) throw invalid('Choose a valid date filter in YYYY-MM-DD format.');
    if (query.from && query.to && query.from > query.to) throw invalid('The start date must not be after the end date.');
    if (query.from || query.to) result.date = { ...(query.from ? { $gte: new Date(`${query.from}T00:00:00.000+05:30`) } : {}), ...(query.to ? { $lte: new Date(`${query.to}T23:59:59.999+05:30`) } : {}) };
  }
  return result;
}

module.exports = { validPlannerColor, validPlannerDay, plannerPayload, plannerQuery };
