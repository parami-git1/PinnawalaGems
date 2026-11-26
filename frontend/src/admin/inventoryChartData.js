const text = value => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
const normalized = value => text(value).replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
const finite = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const NEUTRALS = ['#647b96', '#758b84', '#8c7f9b', '#8f8268', '#6f8791'];
export const CHART_METRICS = ['records', 'pieces', 'carats', 'value'];

function namedColour(value) {
  const name = normalized(value);
  if (/padparadscha|salmon|peach|orange.?pink/.test(name)) return '#df8b74';
  if (/\b(?:pink|rose)\b/.test(name)) return '#ca7198';
  if (/\b(?:red|crimson)\b/.test(name)) return '#b83f5e';
  if (/\b(?:yellow|gold|golden)\b|citrine/.test(name)) return '#c6a23e';
  if (/emerald|\bgreen\b|peridot|tsavorite/.test(name)) return '#359576';
  if (/\b(?:violet|purple)\b|amethyst|iolite/.test(name)) return '#8b6bb5';
  if (/\bteal\b|turquoise|paraiba/.test(name)) return '#379da6';
  if (/aquamarine|sky.?blue|light.?blue/.test(name)) return '#61a9ca';
  if (/\borange\b|spessart|sunstone/.test(name)) return '#d28b48';
  if (/\bblue\b|tanzanite/.test(name)) return '#416ac4';
  if (/\bwhite\b|colou?rless|diamond|moonstone/.test(name)) return '#a0acbd';
  if (/\bblack\b|onyx/.test(name)) return '#4b566d';
  if (/\bbrown\b|smoky/.test(name)) return '#9a7b63';
  if (/ruby|garnet/.test(name)) return '#b83f5e';
  if (/sapphire/.test(name)) return '#416ac4';
  return null;
}

// A known gemstone/category name takes priority. Generic categories use their
// dominant recorded colour. Only fixed palette values or validated hex enter CSS.
export function gemstoneChartColour(categoryName, recordedColours = []) {
  const name = normalized(categoryName);
  const specificName = /\b(?:pink|rose|yellow|gold|golden|green|purple|violet|teal|red|crimson|blue|orange|black|white|brown)\b|padparadscha|salmon|peach|ruby|garnet|emerald|peridot|tsavorite|citrine|amethyst|iolite|turquoise|paraiba|aquamarine|sky.?blue|light.?blue|spessart|sunstone|diamond|moonstone|onyx|smoky/;
  if (specificName.test(name)) return namedColour(name);
  for (const value of recordedColours) {
    const colour = normalized(value);
    if (/^#[a-f\d]{6}$/.test(colour)) return colour;
    if (/^#[a-f\d]{3}$/.test(colour)) return `#${[...colour.slice(1)].map(char => char + char).join('')}`;
    const known = namedColour(colour);
    if (known) return known;
  }
  if (/sapphire|tanzanite/.test(name)) return namedColour(name);
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return NEUTRALS[hash % NEUTRALS.length];
}

export function chartRows(rows, { source = 'stock', availability = 'available' } = {}) {
  const chosenSource = source === 'showcase' ? 'showcase' : 'stock';
  return (Array.isArray(rows) ? rows : []).filter(row => row && row.source === chosenSource && !row.original?.archivedAt
    && (chosenSource === 'showcase' || row.includedInStock !== false && (availability === 'all' || row.quantityKnown && row.quantity > 0 && row.status === 'available')));
}

function emptyTotals() {
  return { records: 0, pieces: 0, recordedCarats: 0, recordedValue: 0, quantityKnownRecords: 0, caratKnownRecords: 0, valueKnownRecords: 0, unknownQuantityRecords: 0, unweighedPieces: 0, unpricedPieces: 0, certifiedRecords: 0 };
}

function count(target, row) {
  target.records++;
  if (row.hasCertificate) target.certifiedRecords++;
  const quantityKnown = row.quantityKnown && finite(row.quantity) && Number.isInteger(row.quantity);
  if (!quantityKnown) { target.unknownQuantityRecords++; return; }
  target.quantityKnownRecords++;
  target.pieces += row.quantity;
  if (finite(row.weight) || row.quantity === 0) { target.caratKnownRecords++; target.recordedCarats += (row.weight || 0) * row.quantity; }
  else target.unweighedPieces += row.quantity;
  if (finite(row.price) || row.quantity === 0) { target.valueKnownRecords++; target.recordedValue += (row.price || 0) * row.quantity; }
  else target.unpricedPieces += row.quantity;
}

export function chartMetricValue(totals, metric) {
  if (!totals.records) return 0;
  if (metric === 'pieces') return totals.quantityKnownRecords ? totals.pieces : null;
  if (metric === 'carats') return totals.caratKnownRecords ? totals.recordedCarats : null;
  if (metric === 'value') return totals.valueKnownRecords ? totals.recordedValue : null;
  return totals.records;
}

export function buildInventoryChartData(rows, options = {}) {
  const source = options.source === 'showcase' ? 'showcase' : 'stock';
  const metric = CHART_METRICS.includes(options.metric) ? options.metric : source === 'showcase' ? 'records' : 'pieces';
  const selected = chartRows(rows, { source, availability: options.availability });
  const groups = new Map();
  const totals = emptyTotals();
  for (const row of selected) {
    const key = text(row.categoryKey) || `${source}:uncategorised`;
    const group = groups.get(key) || { key, label: text(row.categoryName) || 'Uncategorised', ...emptyTotals(), colours: new Map() };
    count(group, row); count(totals, row);
    const colour = text(row.color);
    if (colour) group.colours.set(colour, (group.colours.get(colour) || 0) + (row.quantityKnown && row.quantity > 0 ? row.quantity : 1));
    groups.set(key, group);
  }
  const total = chartMetricValue(totals, metric);
  const categories = [...groups.values()].map(group => {
    const recordedColours = [...group.colours].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([colour]) => colour);
    const category = { ...group };
    delete category.colours;
    return { ...category, colour: gemstoneChartColour(group.label, recordedColours), value: chartMetricValue(group, metric) };
  }).sort((a, b) => (b.value ?? -1) - (a.value ?? -1) || a.label.localeCompare(b.label));
  let offset = 0;
  for (const category of categories) {
    category.share = total > 0 && category.value > 0 ? category.value / total * 100 : 0;
    category.offset = offset;
    offset += category.share;
  }
  return { source, metric, categories, totals, total, maximum: Math.max(0, ...categories.map(category => category.value || 0)) };
}
