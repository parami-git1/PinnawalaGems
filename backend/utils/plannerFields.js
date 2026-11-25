const LEGACY_NOTE_COLORS = new Set(['slate', 'blue', 'amber', 'green', 'rose']);

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

module.exports = { validPlannerColor, validPlannerDay };
