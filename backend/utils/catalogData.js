const mongoose = require('mongoose');

function invalid(message) { const error = new Error(message); error.status = 400; return error; }
function pick(body, fields) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalid('Provide a JSON object.');
  return Object.fromEntries(fields.filter((field) => Object.hasOwn(body, field)).map((field) => [field, body[field]]));
}
function string(value, label, { required = false, max = 1000 } = {}) {
  if (typeof value !== 'string') throw invalid(`${label} must be text.`);
  const result = value.trim();
  if ((required && !result) || result.length > max) throw invalid(`${label} must be ${required ? 'nonempty and ' : ''}${max} characters or fewer.`);
  return result;
}
function number(value, label, { optional = false, integer = false } = {}) {
  if (optional && (value === '' || value == null)) return null;
  if (!['string', 'number'].includes(typeof value) || value === '' || !Number.isFinite(Number(value)) || Number(value) < 0 || (integer && !Number.isInteger(Number(value)))) throw invalid(`${label} must be a nonnegative ${integer ? 'whole number' : 'number'}.`);
  return Number(value);
}
function url(value, label, { optional = false, relative = true } = {}) {
  const clean = string(value, label, { max: 2048 });
  if (optional && !clean) return '';
  if (relative && /^\/(?![\/\\])/.test(clean) && !clean.includes('\\')) return clean;
  try { const parsed = new URL(clean); if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error(); }
  catch { throw invalid(`${label} must be a valid http(s) URL${relative ? ' or local image path' : ''}.`); }
  return clean;
}
function objectId(value, label = 'Reference') {
  if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value)) throw invalid(`${label} is invalid.`);
  return value;
}
function bool(value, label) { if (typeof value !== 'boolean') throw invalid(`${label} must be true or false.`); return value; }
function carats(value) {
  if (value == null || value === '') return null;
  const clean = typeof value === 'number' ? String(value) : string(value, 'Weight', { max: 40 });
  if (!/^\d+(?:\.\d+)?(?:\s*(?:ct|cts|carat|carats))?$/i.test(clean)) throw invalid('Weight must be a nonnegative carat number, optionally followed by ct.');
  return number(Number.parseFloat(clean), 'Weight');
}
function generatedReference(category, id, stock = false) {
  const prefix = String(category.title).toLowerCase().replace(/[^a-z\d]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'gem';
  return `${prefix}${stock ? '-stock' : ''}-${String(id)}`;
}
const STOCK_STATUSES = ['Available', 'Reserved', 'Sold'];
const STOCK_TREATMENTS = ['Unspecified', 'Unheated', 'Heated', 'Other'];
const STONE_FIELDS = ['categoryId', 'title', 'image', 'description', 'weight', 'color', 'shape', 'cut', 'price', 'quantity', 'includedInStock', 'hasCertificate', 'certificateDetails', 'certificateImage', 'isFeatured', 'origin', 'additionalImages', 'videos', 'isTopGem', 'homePagePosition'];
function stonePayload(body, { stock = false, existing } = {}) {
  const fields = stock ? [...STONE_FIELDS.filter((key) => !['additionalImages', 'videos', 'isFeatured', 'isTopGem', 'homePagePosition'].includes(key)), 'stockStatus', 'treatment'] : STONE_FIELDS;
  const payload = pick(body, fields);
  if (Object.hasOwn(body, 'stoneId') && existing && body.stoneId !== existing.stoneId) throw invalid('Reference IDs are assigned at creation and cannot be changed.');
  if ('categoryId' in payload) payload.categoryId = objectId(payload.categoryId, 'Category');
  for (const key of ['title', 'description', 'color', 'shape', 'cut', 'origin', 'certificateDetails']) if (key in payload) payload[key] = string(payload[key], key, { required: key === 'title', max: key === 'description' || key === 'certificateDetails' ? 10000 : 200 });
  if ('image' in payload) payload.image = url(payload.image, 'Image');
  if ('certificateImage' in payload) payload.certificateImage = url(payload.certificateImage, 'Certificate image', { optional: true });
  if ('quantity' in payload) payload.quantity = number(payload.quantity, 'Quantity', { integer: true });
  if ('price' in payload) payload.price = number(payload.price, 'Price', { optional: true });
  if ('homePagePosition' in payload) payload.homePagePosition = number(payload.homePagePosition, 'Homepage position', { integer: true });
  if ('weight' in payload) { const numeric = carats(payload.weight); payload.weight = stock ? numeric : numeric == null ? '' : String(payload.weight).trim(); if (!stock) payload.caratWeight = numeric; }
  for (const key of ['hasCertificate', 'isFeatured', 'isTopGem', 'includedInStock']) if (key in payload) payload[key] = bool(payload[key], key);
  for (const [key, options] of [['stockStatus', STOCK_STATUSES], ['treatment', STOCK_TREATMENTS]]) if (key in payload) {
    payload[key] = string(payload[key], key, { required: true, max: 30 });
    if (!options.includes(payload[key])) throw invalid(`Choose a valid ${key === 'stockStatus' ? 'stock status' : 'treatment'}.`);
  }
  return payload;
}
function categoryPayload(body) {
  const payload = pick(body, ['title', 'description', 'mainImage', 'coverImage']);
  for (const key of ['title', 'description']) if (key in payload) payload[key] = string(payload[key], key, { required: key === 'title', max: key === 'title' ? 150 : 10000 });
  for (const key of ['mainImage', 'coverImage']) if (key in payload) payload[key] = url(payload[key], key, { optional: key === 'coverImage' });
  return payload;
}
function routeError(res, error) {
  if (error.name === 'CastError') return res.status(400).json({ message: 'The supplied reference is invalid.' });
  if (error.name === 'ValidationError' || error.status === 400) return res.status(400).json({ message: error.message });
  if (error.code === 11000) return res.status(409).json({ message: 'This reference already exists. Please reload and try again.' });
  return res.status(500).json({ message: 'Unable to complete this request. Please try again.' });
}
const escapeRegex = (term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function queryText(value, label) { if (typeof value !== 'string' || value.length > 100) throw invalid(`${label} must be text of 100 characters or fewer.`); return value.trim(); }
function pagination(query, defaultLimit = 12) {
  const parse = (value, fallback, label) => { if (value == null) return fallback; if (typeof value !== 'string' || !/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) throw invalid(`${label} must be a positive whole number.`); return Number(value); };
  const page = parse(query.page, 1, 'Page');
  const limit = Math.min(parse(query.limit, defaultLimit, 'Limit'), 200);
  if (page > 1000000) throw invalid('Page is too large.');
  return { page, limit };
}
function catalogMatch(query, categoryId, { stock = false } = {}) {
  const match = {};
  const category = categoryId || query.categoryId;
  if (category) match.categoryId = new mongoose.Types.ObjectId(objectId(category, 'Category'));
  for (const [name, field] of [['stoneId','stoneId'], ['gemType','title']]) if (query[name]) match[field] = { $regex: escapeRegex(queryText(query[name], name)), $options: 'i' };
  for (const name of ['color', 'shape', 'cut', 'origin']) if (query[name]) match[name] = { $regex: `^${escapeRegex(queryText(query[name], name))}$`, $options: 'i' };
  if (query.search) { const term = escapeRegex(queryText(query.search, 'Search')); match.$or = ['title','stoneId','color','shape','origin'].map((field) => ({ [field]: { $regex: term, $options: 'i' } })); }
  if (query.hasCertificate != null && query.hasCertificate !== '') { if (!['true','false'].includes(query.hasCertificate)) throw invalid('Certificate filter must be true or false.'); match.hasCertificate = query.hasCertificate === 'true'; }
  for (const [field, minKey, maxKey] of [[stock ? 'weight' : '__caratWeight','minWeight','maxWeight'], ['price','minPrice','maxPrice']]) {
    const min = query[minKey] == null || query[minKey] === '' ? null : number(query[minKey], minKey);
    const max = query[maxKey] == null || query[maxKey] === '' ? null : number(query[maxKey], maxKey);
    if (min != null && max != null && min > max) throw invalid(`${minKey} cannot exceed ${maxKey}.`);
    if (min != null || max != null) match[field] = { ...(min != null ? { $gte: min } : {}), ...(max != null ? { $lte: max } : {}) };
  }
  return match;
}
function numericWeightExpression() {
  return { $ifNull: ['$caratWeight', { $let: { vars: { parsed: { $regexFind: { input: { $convert: { input: '$weight', to: 'string', onError: '', onNull: '' } }, regex: /^\s*(\d+(?:\.\d+)?)/ } } }, in: { $convert: { input: { $arrayElemAt: ['$$parsed.captures', 0] }, to: 'double', onError: null, onNull: null } } } }] };
}
const SORTS = { featured: { isFeatured: -1, createdAt: -1, _id: -1 }, newest: { createdAt: -1, _id: -1 }, name: { title: 1, _id: 1 }, 'weight-low': { __caratMissing: 1, __caratWeight: 1, _id: 1 }, 'weight-high': { __caratMissing: 1, __caratWeight: -1, _id: 1 }, 'price-low': { price: 1, _id: 1 }, 'price-high': { price: -1, _id: 1 } };
async function catalogPage(Model, query, categoryId) {
  const { page, limit } = pagination(query);
  const aliases = { 'weight-asc':'weight-low', 'weight-desc':'weight-high', 'price-asc':'price-low', 'price-desc':'price-high' };
  const sortKey = aliases[query.sort] || query.sort || 'featured';
  if (!SORTS[sortKey]) throw invalid('Choose a supported sort order.');
  const match = catalogMatch(query, categoryId);
  const result = await Model.aggregate([
    { $set: { __caratWeight: numericWeightExpression() } },
    { $set: { __caratMissing: { $cond: [{ $eq: ['$__caratWeight', null] }, 1, 0] } } },
    { $facet: {
      stones: [{ $match: match }, { $sort: SORTS[sortKey] }, { $skip: (page - 1) * limit }, { $limit: limit }, { $unset: ['__caratWeight', '__caratMissing'] }],
      metadata: [{ $match: match }, { $count: 'total' }],
      categoryCounts: [{ $group: { _id: '$categoryId', count: { $sum: 1 } } }],
      filterOptions: [{ $group: { _id: null, shapes: { $addToSet: '$shape' }, cuts: { $addToSet: '$cut' }, origins: { $addToSet: '$origin' }, colors: { $addToSet: '$color' } } }],
    } },
  ]).option({ maxTimeMS: 5000 });
  const data = result[0] || {};
  const total = data.metadata?.[0]?.total || 0;
  return { stones: data.stones || [], total, totalPages: Math.ceil(total / limit), currentPage: page, limit, categoryCounts: (data.categoryCounts || []).map((row) => ({ categoryId: String(row._id), count: row.count })), filterOptions: Object.fromEntries(['shapes','cuts','origins','colors'].map((key) => [key, (data.filterOptions?.[0]?.[key] || []).filter((value) => typeof value === 'string' && value.trim()).sort((a,b) => a.localeCompare(b)).slice(0, 500)])) };
}
module.exports = { invalid, pick, string, number, url, objectId, bool, carats, generatedReference, stonePayload, categoryPayload, routeError, escapeRegex, pagination, catalogMatch, numericWeightExpression, catalogPage, STOCK_STATUSES, STOCK_TREATMENTS };
