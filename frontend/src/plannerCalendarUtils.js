export const appointmentTypes = ['Viewing', 'Consultation', 'Purchase', 'Workshop', 'Other'];
export const noteCategories = ['General', 'Customer', 'Gem', 'Follow-up', 'Task'];

export const APPOINTMENT_COLORS = {
  Viewing: '#3565BC',
  Consultation: '#8060B0',
  Purchase: '#21806D',
  Workshop: '#BA741F',
  Other: '#66758B',
};
export const NOTE_CATEGORY_COLORS = {
  General: '#66758B',
  Customer: '#3565BC',
  Gem: '#8060B0',
  'Follow-up': '#BA741F',
  Task: '#21806D',
};
export const LEGACY_COLORS = { slate: '#66758B', blue: '#3565BC', amber: '#BA741F', green: '#21806D', rose: '#B34F70' };

export function colorHex(value, fallback = '#66758B') {
  if (typeof value === 'string' && /^#[a-f\d]{6}$/i.test(value)) return value.toUpperCase();
  return typeof value === 'string' && Object.hasOwn(LEGACY_COLORS, value) ? LEGACY_COLORS[value]
    : typeof fallback === 'string' && /^#[a-f\d]{6}$/i.test(fallback) ? fallback.toUpperCase() : '#66758B';
}

export const getAppointmentColor = (record) => colorHex(record?.color, Object.hasOwn(APPOINTMENT_COLORS, record?.type || '') ? APPOINTMENT_COLORS[record.type] : APPOINTMENT_COLORS.Other);
export const getNoteColor = (record) => colorHex(record?.color, Object.hasOwn(NOTE_CATEGORY_COLORS, record?.category || '') ? NOTE_CATEGORY_COLORS[record.category] : NOTE_CATEGORY_COLORS.General);

// Date-only planner fields are calendar dates, not browser-local timestamps.
export function validDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : '';
}

export function dayKey(value) {
  if (!value) return '';
  const exact = validDateKey(value);
  if (exact) return exact;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = (name) => parts.find((item) => item.type === name)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export const noteDayKey = (note) => dayKey(note?.noteDate) || dayKey(note?.reminderAt);
export const todayKey = () => dayKey(new Date());
export const readableDate = (key, options = {}) => validDateKey(key)
  ? new Date(`${key}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', ...options })
  : 'Choose a day';

export function addDays(key, delta) {
  if (!validDateKey(key)) return '';
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

export function colorStyles(color) {
  const hex = colorHex(color);
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
  const mix = (weight, target) => `rgb(${channels.map((channel) => Math.round(channel * weight + target * (1 - weight))).join(' ')})`;
  // Even a white custom swatch needs a readable foreground on its pale wash.
  return { '--event-color': hex, '--event-wash': mix(0.1, 255), '--event-ink': mix(0.4, 0) };
}
