import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { apiRequest } from '../api';
import { invalidatePublicResources } from '../resourceCache';
import { AdminIcon, AdminImage, AdminModal } from './AdminUI';
import { BULK_GEM_LIMIT, bulkRemainingIds, bulkRowReference, parseBulkGemIds } from './bulkGemIds';
import './BulkSoldGems.css';

const records = value => Array.isArray(value) ? value : [];
const scopeName = scope => scope === 'stock' ? 'Private stock' : 'Website collection';
const endpoint = '/admin/bulk-gems';

function validRows(value) {
  return Array.isArray(value) && value.every(row => row && typeof row === 'object' && typeof row._id === 'string' && row._id.length > 0);
}

function checkedPreview(value, scope) {
  if (!value || !validRows(value.matched) || !validRows(value.alreadyRemoved)
    || !Array.isArray(value.unknownIds) || !Array.isArray(value.ambiguousIds) || !Array.isArray(value.duplicateIds)
    || value.scope !== scope || typeof value.canRemove !== 'boolean' || typeof value.canRestore !== 'boolean'
    || (value.reviewToken !== null && typeof value.reviewToken !== 'string') || (value.restoreToken !== null && typeof value.restoreToken !== 'string')) throw new Error('The server returned an incomplete preview. Check the backend update and try again; nothing has been removed by this preview.');
  return value;
}

function checkedRemoval(value) {
  if (!value || !['removed', 'alreadyRemoved', 'changed', 'failed'].every(key => validRows(value[key]))
    || (value.restoreToken !== null && typeof value.restoreToken !== 'string')) throw new Error('The removal result could not be verified. Review these IDs again to check their current status.');
  return value;
}

function checkedRestoration(value) {
  if (!value || !['restored', 'alreadyRestored', 'changed', 'failed'].every(key => validRows(value[key]))) throw new Error('The restore result could not be verified. Keep this window open and retry Undo to check this batch.');
  return value;
}

function IdNotice({ title, ids, tone = 'warning' }) {
  if (!records(ids).length) return null;
  return <div className={`bulk-gems-id-notice is-${tone}`}><strong>{title}</strong><div>{ids.map((id, index) => <code key={`${bulkRowReference(id)}-${index}`}>{bulkRowReference(id)}</code>)}</div></div>;
}

function GemRows({ items, title, status }) {
  if (!items.length) return null;
  return <section className="bulk-gems-row-section" aria-label={title}><h3>{title}<span>{items.length}</span></h3><ul className="bulk-gems-rows">{items.map((item, index) => <li key={item._id || `${bulkRowReference(item)}-${index}`}><AdminImage src={item.image} alt="" /><div><strong>{item.title || 'Gemstone'}</strong><code>{bulkRowReference(item)}</code>{(item.message || item.reason) && <small>{String(item.message || item.reason)}</small>}</div><span>{status || `${item.quantity ?? '—'} ${Number(item.quantity) === 1 ? 'piece' : 'pieces'}`}</span></li>)}</ul></section>;
}

export default function BulkSoldGems({ scope: initialScope = 'catalog', onClose, onCompleted }) {
  const [scope, setScope] = useState(initialScope === 'stock' ? 'stock' : 'catalog');
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [restoreResult, setRestoreResult] = useState(null);
  const [undo, setUndo] = useState(null);
  const [checked, setChecked] = useState(false);
  const [restoreChecked, setRestoreChecked] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const active = useRef(null);
  const action = useRef(false);
  const mounted = useRef(true);
  const inputRef = useRef(null);
  const inputId = useId();
  const parsed = useMemo(() => parseBulkGemIds(input), [input]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; active.current?.abort(); }; }, []);

  const notify = target => {
    if (target === 'catalog') invalidatePublicResources('/inventory/stones');
    try { Promise.resolve(onCompleted?.()).catch(() => {}); } catch { /* A refresh error does not reverse a confirmed operation. */ }
  };
  const request = async (kind, operation) => {
    if (action.current) return;
    action.current = true; setBusy(kind); setError('');
    const controller = new AbortController(); active.current = controller;
    try { await operation(controller.signal); }
    catch (problem) {
      if (mounted.current && !controller.signal.aborted) {
        setError(problem.message || 'The request could not finish. Your ID list is still here.');
        if (kind !== 'preview') setUncertain(true);
      }
    } finally {
      action.current = false; active.current = null;
      if (mounted.current) setBusy('');
    }
  };
  const changeInput = value => { setInput(value); setPreview(null); setResult(null); setRestoreResult(null); setChecked(false); setRestoreChecked(false); setError(''); setUncertain(false); };
  const getPreview = (value = input) => {
    const ids = parseBulkGemIds(value);
    if (ids.error) { setError(ids.error); inputRef.current?.focus(); return; }
    setChecked(false); setRestoreChecked(false); setResult(null); setRestoreResult(null); setUncertain(false);
    return request('preview', async signal => {
      const data = checkedPreview(await apiRequest(`${endpoint}/preview`, { method: 'POST', body: JSON.stringify({ scope, ids: ids.ids }), signal }), scope);
      if (mounted.current && !signal.aborted) setPreview(data);
    });
  };
  const remove = () => {
    if (!checked || !preview?.canRemove || !preview.reviewToken || preview.unknownIds.length || preview.ambiguousIds.length || !preview.matched.length) return;
    return request('remove', async signal => {
      const data = checkedRemoval(await apiRequest(`${endpoint}/remove`, { method: 'POST', body: JSON.stringify({ scope, reviewToken: preview.reviewToken }), signal }, { timeout: 60000 }));
      if (!mounted.current || signal.aborted) return;
      setResult(data); setRestoreResult(null); setUncertain(false); setChecked(false);
      if (data.restoreToken) setUndo({ token: data.restoreToken, scope, count: data.removed.length + data.alreadyRemoved.length });
      notify(scope);
    });
  };
  const restore = (target = undo) => {
    if (!target?.token) return;
    return request('restore', async signal => {
      const data = checkedRestoration(await apiRequest(`${endpoint}/restore`, { method: 'POST', body: JSON.stringify({ scope: target.scope, restoreToken: target.token }), signal }, { timeout: 60000 }));
      if (!mounted.current || signal.aborted) return;
      setRestoreResult(data); setUncertain(false); setPreview(null); setChecked(false);
      if (!data.failed.length) setUndo(null);
      notify(target.scope);
    });
  };
  const restoreReviewed = () => {
    if (!restoreChecked || !preview?.canRestore || !preview.restoreToken || preview.unknownIds.length || preview.ambiguousIds.length) return;
    const target = { token: preview.restoreToken, scope, count: preview.alreadyRemoved.length };
    setUndo(target);
    return restore(target);
  };
  const reviewRemaining = () => {
    const ids = bulkRemainingIds(result);
    changeInput(ids.join('\n'));
    getPreview(ids.join('\n'));
  };
  const unresolved = records(preview?.unknownIds).length + records(preview?.ambiguousIds).length;
  const canRemove = Boolean(preview?.canRemove && preview.reviewToken && preview.matched.length && !unresolved && checked && !busy);
  const duplicateIds = [...new Set([...parsed.duplicates, ...records(preview?.duplicateIds)])];
  const remaining = bulkRemainingIds(result);
  return <AdminModal title="Remove sold gems" description="Check a list of gemstone IDs, then remove the sold pieces together." onClose={onClose} busy={Boolean(busy)}>
    <div className="bulk-gems">
      <div className="bulk-gems-intro"><span><AdminIcon name="archive" /></span><div><strong>A checked batch, with a way back</strong><p>Removed gems leave the active collection or stock list. Their records and photographs are kept, and this batch can be restored with Undo.</p></div></div>
      <form className="bulk-gems-entry" onSubmit={event => { event.preventDefault(); getPreview(); }}>
        <label className="bulk-gems-scope"><span>Remove from</span><select aria-label="Gemstone list" value={scope} disabled={Boolean(busy)} onChange={event => { setScope(event.target.value); setPreview(null); setResult(null); setRestoreResult(null); setChecked(false); setRestoreChecked(false); setError(''); setUncertain(false); }}><option value="catalog">Website collection</option><option value="stock">Private stock</option></select></label>
        <label htmlFor={inputId}>Gem IDs<span>Up to {BULK_GEM_LIMIT} different IDs</span></label>
        <textarea id={inputId} ref={inputRef} aria-label="Sold gemstone IDs" value={input} onChange={event => changeInput(event.target.value)} rows={5} disabled={Boolean(busy)} spellCheck={false} autoCapitalize="none" placeholder={'Paste one Gem ID per line\nblue-sapphire-…\nruby-…'} aria-describedby={`${inputId}-help`} />
        <div className="bulk-gems-entry-footer"><p id={`${inputId}-help`}>Use exact Gem IDs or record IDs. Lines, spaces, commas and semicolons all work.</p><span>{input.trim() ? parsed.ids.length : 0} IDs</span></div>
        <button type="submit" className="admin-button is-primary" disabled={Boolean(busy) || !input.trim() || Boolean(parsed.error)}>{busy === 'preview' ? <span className="admin-spinner" /> : <AdminIcon name="search" />}{busy === 'preview' ? 'Checking IDs…' : 'Preview this batch'}</button>
        {input.trim() && parsed.error && <p className="bulk-gems-inline-error" role="status">{parsed.error}</p>}
      </form>
      {error && <div className="bulk-gems-error" role="alert"><AdminIcon name="bell" /><div><strong>{uncertain ? 'Check the result before starting another batch' : 'This request needs attention'}</strong><p>{error}</p>{uncertain && <p>A connection failure does not prove that nothing changed. Preview these IDs again after an interrupted removal, or retry Undo after an interrupted restore. The server checks existing results before making further changes.</p>}</div></div>}
      {duplicateIds.length > 0 && <IdNotice title="Repeated IDs count once" ids={duplicateIds} tone="info" />}
      {preview && !result && !restoreResult && <div className="bulk-gems-review">
        <header><div><p>Review before removing</p><h3>{scopeName(scope)}</h3></div><span>{preview.matched.length} ready</span></header>
        <IdNotice title="Not found in this list — correct or remove these IDs" ids={preview.unknownIds} />
        <IdNotice title="More than one match — use the exact record ID instead" ids={preview.ambiguousIds} />
        <GemRows title="Already removed" items={preview.alreadyRemoved} status="Skipped" />
        {preview.canRestore && preview.restoreToken && preview.alreadyRemoved.length > 0 && !unresolved && <div className="bulk-gems-confirm bulk-gems-recover"><label><input type="checkbox" checked={restoreChecked} disabled={Boolean(busy)} onChange={event => setRestoreChecked(event.target.checked)} /><span>I checked these removed gem IDs and want to restore them.</span></label><button type="button" className="admin-button" disabled={Boolean(busy) || !restoreChecked} onClick={restoreReviewed}><AdminIcon name="refresh" />Restore removed gems</button><small>This recovery option also works when a previous removal response was interrupted or its window was closed. Only unchanged removed records are restored.</small></div>}
        <GemRows title="Gems to remove" items={preview.matched} />
        {unresolved > 0 && <p className="bulk-gems-review-help">Nothing can be removed until every unknown or ambiguous ID is corrected. Your matching gems remain unchanged.</p>}
        {!preview.matched.length && !unresolved && <p className="bulk-gems-review-help">There are no active gems to remove in this batch.</p>}
        {preview.matched.length > 0 && !unresolved && <div className="bulk-gems-confirm"><label><input type="checkbox" checked={checked} disabled={Boolean(busy)} onChange={event => setChecked(event.target.checked)} /><span>I checked these gem IDs and want to remove these sold gems.</span></label><button type="button" className="admin-button bulk-gems-remove" disabled={!canRemove} onClick={remove}>{busy === 'remove' ? <span className="admin-spinner" /> : <AdminIcon name="archive" />}{busy === 'remove' ? 'Removing checked gems…' : `Remove ${preview.matched.length} sold ${preview.matched.length === 1 ? 'gem' : 'gems'}`}</button><small>The server checks this preview again before changing records. If anything changed, that gem is left for another review.</small></div>}
        {uncertain && <button type="button" className="admin-button" disabled={Boolean(busy)} onClick={() => getPreview()}>Check these IDs again</button>}
      </div>}
      {result && !restoreResult && <section className="bulk-gems-results" aria-label="Batch removal results"><header><span><AdminIcon name={result.failed.length || result.changed.length ? 'bell' : 'check'} /></span><div><h3>{result.failed.length || result.changed.length ? 'Batch checked, with items to review' : 'Your batch is complete'}</h3><p>{result.removed.length} removed · {result.alreadyRemoved.length} already removed · {result.changed.length} changed · {result.failed.length} could not finish</p></div></header><GemRows title="Removed from the active list" items={result.removed} status="Removed" /><GemRows title="Previously removed" items={result.alreadyRemoved} status="Skipped" /><GemRows title="Changed since the preview" items={result.changed} status="Review needed" /><GemRows title="Could not be completed" items={result.failed} status="Try again" />{remaining.length > 0 && <button type="button" className="admin-button" disabled={Boolean(busy)} onClick={reviewRemaining}><AdminIcon name="refresh" />Review remaining IDs</button>}</section>}
      {restoreResult && <section className="bulk-gems-results" aria-label="Batch restore results"><header><span><AdminIcon name="refresh" /></span><div><h3>Undo result</h3><p>{restoreResult.restored.length} restored · {restoreResult.alreadyRestored.length} already active · {restoreResult.changed.length} changed · {restoreResult.failed.length} could not finish</p></div></header><GemRows title="Restored to the active list" items={restoreResult.restored} status="Restored" /><GemRows title="Already active" items={restoreResult.alreadyRestored} status="Skipped" /><GemRows title="Changed after removal" items={restoreResult.changed} status="Left unchanged" /><GemRows title="Restore could not finish" items={restoreResult.failed} status="Retry Undo" /></section>}
      {undo && <div className="bulk-gems-undo"><div><strong>Undo this removal</strong><p>{scopeName(undo.scope)} · up to {undo.count} gems. This Undo link lasts 24 hours. You can also preview the original IDs again to find unchanged removed gems.</p></div><button type="button" className="admin-button" disabled={Boolean(busy)} onClick={() => restore()}>{busy === 'restore' ? <span className="admin-spinner" /> : <AdminIcon name="refresh" />}{busy === 'restore' ? 'Restoring…' : 'Undo last removal'}</button></div>}
      <footer className="bulk-gems-footer"><span>No photographs are permanently deleted by this action.</span><button type="button" className="admin-button" disabled={Boolean(busy)} onClick={onClose}>{result || restoreResult ? 'Done' : 'Cancel'}</button></footer>
    </div>
  </AdminModal>;
}
