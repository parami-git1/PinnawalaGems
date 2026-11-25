const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Stone = require('../models/Stone');
const StockStone = require('../models/StockStone');
const { invalid } = require('./catalogData');
const ISSUER = 'pinnawala-gems-bulk-review';
const AUDIENCE = 'pinnawala-gems-bulk-actions';
const ID = /^[a-f\d]{24}$/i;
const BATCH = /^[a-f\d-]{36}$/i;

function scopeModel(scope) {
  if (scope === 'catalog') return Stone;
  if (scope === 'stock') return StockStone;
  throw invalid('Choose Website showcase or Private stock.');
}
function parseIds(input) {
  if (typeof input !== 'string' && !Array.isArray(input)) throw invalid('Paste gemstone IDs as text or a list of IDs.');
  if (typeof input === 'string' && input.length > 30000 || Array.isArray(input) && input.length > 500) throw invalid('Use at most 100 unique IDs per batch.');
  const lines = Array.isArray(input) ? input : [input];
  if (lines.some(value => typeof value !== 'string')) throw invalid('Every gemstone ID must be text.');
  const tokens = lines.flatMap(value => value.split(/[\s,;]+/)).filter(Boolean);
  if (!tokens.length || tokens.length > 500) throw invalid('Enter between 1 and 100 unique gemstone IDs.');
  const ids = [], duplicates = new Set(), seen = new Set();
  for (let token of tokens) {
    if (token.length > 160 || [...token].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) throw invalid('Each gemstone ID must be 160 characters or fewer without control characters.');
    if (ID.test(token)) token = token.toLowerCase();
    if (seen.has(token)) duplicates.add(token); else { seen.add(token); ids.push(token); }
  }
  if (ids.length > 100) throw invalid('Use at most 100 unique gemstone IDs per batch.');
  return { ids, duplicateIds: [...duplicates] };
}
function recordView(record) {
  return { _id: String(record._id), stoneId: record.stoneId || '', title: record.title || 'Untitled gemstone', image: record.image || '', quantity: record.quantity ?? 0 };
}
function snapshot(record) {
  return { id: String(record._id), version: record.__v ?? null, versionExists: Object.hasOwn(record, '__v'), updatedAt: record.updatedAt ? new Date(record.updatedAt).toISOString() : null };
}
function restoreSnapshot(record) {
  return { ...snapshot(record), archiveBatchId: record.archiveBatchId, archivedAt: new Date(record.archivedAt).toISOString() };
}
function versionQuery(entry) {
  return { __v: entry.version === null && !entry.versionExists ? { $exists: false } : entry.version, updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : null };
}
function sameVersion(entry, record) {
  return entry.version === (record.__v ?? null) && entry.versionExists === Object.hasOwn(record, '__v') && entry.updatedAt === (record.updatedAt ? new Date(record.updatedAt).toISOString() : null);
}
function sign(kind, scope, entries, owner, extra = {}) {
  return jwt.sign({ kind, scope, entries, ...extra }, process.env.JWT_SECRET, { algorithm: 'HS256', issuer: ISSUER, audience: AUDIENCE, subject: owner, expiresIn: kind === 'review' ? '10m' : '24h' });
}
function readToken(value, kind, scope, owner) {
  if (typeof value !== 'string' || !value || value.length > 65000) throw invalid('This review is missing or invalid. Preview the IDs again.');
  let payload;
  try { payload = jwt.verify(value, process.env.JWT_SECRET, { algorithms: ['HS256'], issuer: ISSUER, audience: AUDIENCE, subject: owner }); }
  catch { throw invalid('This review expired or is invalid. Preview the IDs again.'); }
  if (payload.kind !== kind || payload.scope !== scope || !Array.isArray(payload.entries) || !payload.entries.length || payload.entries.length > 100 || kind === 'review' && !BATCH.test(payload.batchId)) throw invalid('This review does not match the selected inventory. Preview the IDs again.');
  for (const entry of payload.entries) {
    if (!entry || !ID.test(entry.id) || typeof entry.versionExists !== 'boolean' || entry.version !== null && (!Number.isSafeInteger(entry.version) || entry.version < 0) || entry.updatedAt !== null && (!Number.isFinite(new Date(entry.updatedAt).getTime()))) throw invalid('This review is invalid. Preview the IDs again.');
    if (kind === 'restore' && (!BATCH.test(entry.archiveBatchId) || !Number.isFinite(new Date(entry.archivedAt).getTime()))) throw invalid('This restore review is invalid. Preview the IDs again.');
  }
  return payload;
}
const load = (Model, id) => Model.findById(id).lean().maxTimeMS(5000);
const update = (Model, query, fields) => Model.findOneAndUpdate(query, { $set: fields, $inc: { __v: 1 } }, { new: true, runValidators: true }).lean().maxTimeMS(5000);

async function preview(scope, input, owner) {
  const Model = scopeModel(scope);
  const parsed = parseIds(input);
  const objectIds = parsed.ids.filter(id => ID.test(id)).map(id => new mongoose.Types.ObjectId(id));
  const records = await Model.find({ $or: [{ stoneId: { $in: parsed.ids } }, ...(objectIds.length ? [{ _id: { $in: objectIds } }] : [])] }).lean().maxTimeMS(5000);
  const result = { scope, matched: [], unknownIds: [], ambiguousIds: [], duplicateIds: parsed.duplicateIds, alreadyRemoved: [], reviewToken: null, restoreToken: null, canRemove: false, canRestore: false };
  const selected = new Map();
  for (const id of parsed.ids) {
    const matches = records.filter(record => record.stoneId === id || String(record._id).toLowerCase() === id);
    if (!matches.length) result.unknownIds.push(id);
    else if (matches.length > 1) result.ambiguousIds.push(id);
    else if (selected.has(String(matches[0]._id))) { if (!result.duplicateIds.includes(id)) result.duplicateIds.push(id); }
    else selected.set(String(matches[0]._id), matches[0]);
  }
  const active = [], archived = [];
  for (const record of selected.values()) {
    if (record.archivedAt) { result.alreadyRemoved.push(recordView(record)); if (record.archivedReason === 'sold' && BATCH.test(record.archiveBatchId)) archived.push(restoreSnapshot(record)); }
    else { result.matched.push(recordView(record)); active.push(snapshot(record)); }
  }
  if (!result.unknownIds.length && !result.ambiguousIds.length) {
    if (active.length) { result.reviewToken = sign('review', scope, active, owner, { batchId: crypto.randomUUID() }); result.canRemove = true; }
    if (archived.length) { result.restoreToken = sign('restore', scope, archived, owner); result.canRestore = true; }
  }
  return result;
}

async function remove(scope, token, owner) {
  const Model = scopeModel(scope), review = readToken(token, 'review', scope, owner);
  const result = { scope, removed: [], alreadyRemoved: [], changed: [], failed: [], restoreToken: null };
  const undo = [];
  const archivedAt = new Date();
  for (const entry of review.entries) {
    let record;
    try {
      record = await load(Model, entry.id);
      if (!record) { result.changed.push({ _id: entry.id, reason: 'This gemstone no longer exists.' }); continue; }
      if (record.archivedAt) {
        result.alreadyRemoved.push(recordView(record));
        const expectedVersion = entry.version === null ? 1 : entry.version + 1;
        if (record.archiveBatchId === review.batchId && record.__v === expectedVersion) undo.push(restoreSnapshot(record));
        continue;
      }
      if (!sameVersion(entry, record)) { result.changed.push({ ...recordView(record), reason: 'This gemstone changed after your preview. Review it again.' }); continue; }
      const changed = await update(Model, { _id: entry.id, archivedAt: null, ...versionQuery(entry) }, { archivedAt, archivedReason: 'sold', archiveBatchId: review.batchId });
      if (!changed) { result.changed.push({ ...recordView(record), reason: 'This gemstone changed while the batch was being processed. Review it again.' }); continue; }
      result.removed.push(recordView(changed)); undo.push(restoreSnapshot(changed));
    } catch { result.failed.push({ ...(record ? recordView(record) : { _id: entry.id }), reason: 'This item could not be processed. Retry the reviewed batch safely.' }); }
  }
  if (undo.length) result.restoreToken = sign('restore', scope, undo, owner);
  return result;
}

async function restore(scope, token, owner) {
  const Model = scopeModel(scope), review = readToken(token, 'restore', scope, owner);
  const result = { scope, restored: [], alreadyRestored: [], changed: [], failed: [] };
  for (const entry of review.entries) {
    let record;
    try {
      record = await load(Model, entry.id);
      if (!record) { result.changed.push({ _id: entry.id, reason: 'This gemstone no longer exists.' }); continue; }
      if (!record.archivedAt) { result.alreadyRestored.push(recordView(record)); continue; }
      if (!sameVersion(entry, record) || record.archiveBatchId !== entry.archiveBatchId || new Date(record.archivedAt).toISOString() !== entry.archivedAt) { result.changed.push({ ...recordView(record), reason: 'This removed gemstone changed after the restore review. Preview its ID again.' }); continue; }
      const changed = await update(Model, { _id: entry.id, archivedAt: new Date(entry.archivedAt), archiveBatchId: entry.archiveBatchId, ...versionQuery(entry) }, { archivedAt: null, archivedReason: '', archiveBatchId: '' });
      if (!changed) { result.changed.push({ ...recordView(record), reason: 'This gemstone changed while restoring. Preview its ID again.' }); continue; }
      result.restored.push(recordView(changed));
    } catch { result.failed.push({ ...(record ? recordView(record) : { _id: entry.id }), reason: 'This item could not be restored. Retry safely.' }); }
  }
  return result;
}
module.exports = { parseIds, preview, remove, restore };
