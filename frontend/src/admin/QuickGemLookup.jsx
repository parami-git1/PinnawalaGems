import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AdminIcon, AdminImage, AdminModal } from './AdminUI';
import { gemLookupKey, lookupGems, lookupPublicUrl } from './gemLookup';
import './QuickGemLookup.css';

const sourceName = source => source === 'stock' ? 'Private stock' : 'Website showcase';
const number = value => new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(value);
const amount = value => value == null ? 'Not recorded' : `Rs. ${number(value)}`;
const recorded = value => value === '' || value == null ? 'Not recorded' : value;
const media = value => (Array.isArray(value) ? value : []).map(item => typeof item === 'string' ? item : item?.url).filter(value => typeof value === 'string' && (/^https?:\/\//i.test(value) || /^\/(?!\/)/.test(value)));
const availability = row => !row.quantityKnown ? 'Quantity unknown' : row.quantity === 0 ? 'Zero quantity' : row.status === 'reserved' ? 'Reserved' : row.status === 'sold' ? 'Sold' : row.includedInStock ? 'Available' : 'Excluded from stock totals';

function RecordInspector({ row, loading, onClose, onEditStone, onDeleteStone }) {
  const [selectedPhoto, setSelectedPhoto] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [copyState, setCopyState] = useState('');
  const mutation = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const photos = [...new Set([row?.image, ...media(row?.original?.additionalImages)].filter(Boolean))];
  const activePhoto = photos.includes(selectedPhoto) ? selectedPhoto : photos[0] || '';
  const videos = media(row?.original?.videos);
  const publicUrl = lookupPublicUrl(row);
  const deleteRecord = async () => {
    if (!row || !onDeleteStone || mutation.current || loading) return;
    mutation.current = true; setDeleting(true); setError('');
    try {
      const deleted = await onDeleteStone(row.original, row.source);
      if (mounted.current && deleted === true) onClose();
    } catch (problem) {
      if (mounted.current) setError(problem?.message || 'This gemstone could not be deleted. Its details are still here; try again.');
    } finally {
      mutation.current = false;
      if (mounted.current) setDeleting(false);
    }
  };
  const copyReference = async () => {
    if (!row) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Copy unavailable');
      await navigator.clipboard.writeText(row.reference || row.id);
      if (mounted.current) setCopyState('Gem ID copied.');
    } catch { if (mounted.current) setCopyState('Select the Gem ID below to copy it manually.'); }
  };
  return <AdminModal title="Gemstone record" description="Inspect the exact record and choose the next action." onClose={onClose} busy={deleting}>
    {!row ? <div className="quick-gem-missing" role="status"><AdminIcon name={loading ? 'refresh' : 'archive'} /><h3>{loading ? 'Refreshing this record…' : 'This record is no longer in the active list'}</h3><p>{loading ? 'The latest details will appear when the stock refresh finishes.' : 'It may have been removed or archived. Close this view and search again to check the current records.'}</p><button type="button" className="admin-button" disabled={deleting} onClick={onClose}>Close record</button></div> : <div className="quick-gem-record">
      <div className="quick-gem-record-heading"><div><span className={`quick-gem-source is-${row.source}`}>{sourceName(row.source)}</span><h3>{row.title}</h3><p>{row.categoryName}</p></div><span className={`quick-gem-availability is-${row.status}`}>{availability(row)}</span></div>
      <div className="quick-gem-reference"><div><span>Gem ID</span><code>{row.reference || row.id || 'Reference not recorded'}</code>{row.reference && row.id && <small>Record ID: {row.id}</small>}</div><button type="button" className="admin-button is-small" onClick={copyReference} disabled={deleting || (!row.reference && !row.id)}><AdminIcon name="note" size={15} />Copy Gem ID</button></div>
      {copyState && <p className="quick-gem-notice" role="status">{copyState}</p>}
      {loading && <p className="quick-gem-notice" role="status">Private stock is refreshing or unavailable. Viewing the last loaded details; editing and deletion resume after a successful refresh.</p>}
      <div className="quick-gem-record-grid"><div className="quick-gem-media"><div className="quick-gem-photo"><AdminImage src={activePhoto} alt={row.title} /></div>{photos.length > 1 && <div className="quick-gem-thumbnails" aria-label="Record photographs">{photos.map((photo, index) => <button key={photo} type="button" className={photo === activePhoto ? 'is-active' : ''} aria-label={`View record photo ${index + 1}`} aria-pressed={photo === activePhoto} onClick={() => setSelectedPhoto(photo)} disabled={deleting}><AdminImage src={photo} alt="" /></button>)}</div>}{videos.map((video, index) => <video key={video} src={video} controls preload="none" aria-label={`Gemstone video ${index + 1}`} />)}</div>
        <dl className="quick-gem-specs">{[
          ['Quantity', row.quantityKnown ? `${number(row.quantity)} ${row.quantity === 1 ? 'piece' : 'pieces'}` : 'Not recorded'],
          ['Weight per piece', row.weight == null ? 'Not recorded' : `${number(row.weight)} ct`],
          ['Colour', recorded(row.color)], ['Shape', recorded(row.shape)], ['Cut', recorded(row.cut)], ['Origin', recorded(row.origin)],
          ['Treatment', recorded(row.treatment)], ['Price per piece', amount(row.price)],
          ['Stock counting', row.includedInStock ? 'Included' : 'Excluded'], ['Certificate', row.hasCertificate ? 'Available' : 'Not marked'],
          ...(row.source === 'showcase' ? [['Homepage', row.isTopGem ? 'Marked for homepage' : 'Not marked'], ['Featured', row.isFeatured ? 'Featured selection' : 'Standard listing']] : []),
        ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      </div>
      {row.original?.description && <section className="quick-gem-description"><h4>Description</h4><p>{row.original.description}</p></section>}
      {(row.original?.certificateDetails || row.original?.certificateImage) && <section className="quick-gem-certificate"><h4><AdminIcon name="shield" size={16} />Certification record</h4>{row.original.certificateDetails && <p>{row.original.certificateDetails}</p>}{row.original.certificateImage && <details><summary>View certificate photograph</summary><div><AdminImage src={row.original.certificateImage} alt={`${row.title} certificate`} /></div></details>}</section>}
      {error && <p className="quick-gem-error" role="alert">{error}</p>}
      <footer className="quick-gem-record-actions"><div>{publicUrl && <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="admin-button"><AdminIcon name="external" size={16} />View website item</a>}{onDeleteStone && <button type="button" className="admin-button is-danger" disabled={deleting || loading || !row.id} onClick={deleteRecord}><AdminIcon name="trash" size={16} />{deleting ? 'Deleting…' : 'Delete gemstone'}</button>}</div>{onEditStone && <button type="button" className="admin-button is-primary" disabled={deleting || loading || !row.id} onClick={() => { onClose(); onEditStone(row.original, row.source); }}><AdminIcon name="edit" size={16} />Edit gemstone</button>}</footer>
      {onDeleteStone && <p className="quick-gem-delete-note">Delete permanently removes this record after confirmation. Use Remove sold gems in inventory for reversible sold-item removal.</p>}
    </div>}
  </AdminModal>;
}

export default function QuickGemLookup({ rows = [], stockLoading = false, stockError = '', onRetryStock, onEditStone, onDeleteStone, onCreateStone }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const searchRef = useRef(null);
  const titleId = useId();
  const hintId = useId();
  const lookup = useMemo(() => lookupGems(rows, query), [rows, query]);
  const selectedRow = useMemo(() => rows.find(row => gemLookupKey(row) === selected), [rows, selected]);
  const privateIncomplete = Boolean(stockLoading || stockError);
  const open = row => setSelected(gemLookupKey(row));
  const submit = event => {
    event.preventDefault(); setSubmitted(true);
    if (lookup.exact.length === 1 && !privateIncomplete) open(lookup.exact[0]);
  };
  const resultMessage = lookup.exact.length > 1 ? `This exact ID appears in ${lookup.total} records. Choose the correct list below.`
    : lookup.exact.length === 1 ? privateIncomplete ? 'An exact match is shown. Private stock is incomplete, so choose the record explicitly.' : 'Exact Gem ID found. Press Enter or open the record below.'
      : lookup.kind === 'suggested' ? `${lookup.total} possible ${lookup.total === 1 ? 'match' : 'matches'}. Select a record or enter its exact Gem ID.`
        : lookup.kind === 'missing' ? 'No matching active record. Check the Gem ID and try again.'
          : lookup.kind === 'incomplete' ? 'Enter the complete Gem ID, or at least two characters to find candidates.'
            : 'Search both private stock and website records, including reserved, sold and excluded pieces in the active lists.';
  return <section className="admin-panel quick-gem-lookup" aria-labelledby={titleId}>
    <header className="quick-gem-heading"><div><span><AdminIcon name="search" size={18} /></span><div><h2 id={titleId}>Quick Gem ID lookup</h2><p>Open a record directly while speaking with a customer.</p></div></div>{onCreateStone && <div className="quick-gem-add"><button type="button" className="admin-button is-small" onClick={() => onCreateStone('showcase')}><AdminIcon name="plus" size={15} />Add website gemstone</button><button type="button" className="admin-button is-small" onClick={() => onCreateStone('stock')}><AdminIcon name="plus" size={15} />Add stock stone</button></div>}</header>
    <form className="quick-gem-search-form" onSubmit={submit} aria-label="Find a gemstone by ID"><label><span className="sr-only">Gem ID or record ID</span><AdminIcon name="gem" size={18} /><input ref={searchRef} aria-label="Gem ID or record ID" aria-describedby={hintId} value={query} onChange={event => { setQuery(event.target.value); setSubmitted(false); }} maxLength={200} autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="Enter a Gem ID or database record ID" />{query && <button type="button" className="quick-gem-clear" aria-label="Clear Gem ID search" onClick={() => { setQuery(''); setSubmitted(false); searchRef.current?.focus(); }}><AdminIcon name="close" size={15} /></button>}</label><button type="submit" className="admin-button is-primary" disabled={!query.trim()}><AdminIcon name="search" size={16} />Open Gem ID</button></form>
    <p className={`quick-gem-search-note${submitted && lookup.kind === 'missing' ? ' is-missing' : ''}`} id={hintId} role="status">{resultMessage}</p>
    {privateIncomplete && <div className="quick-gem-partial" role="status"><AdminIcon name={stockLoading ? 'refresh' : 'bell'} size={16} /><p>{stockLoading ? 'Private stock is refreshing. Current results may be incomplete.' : 'Private stock could not be refreshed. Website records and any previously loaded stock remain searchable.'}</p>{stockError && onRetryStock && <button type="button" onClick={onRetryStock}>Retry stock</button>}</div>}
    {lookup.candidates.length > 0 && <ul className="quick-gem-results" aria-label="Gem ID matches">{lookup.candidates.map(row => <li key={gemLookupKey(row)}><button type="button" onClick={() => open(row)} aria-label={`Open ${row.reference || row.title} in ${sourceName(row.source)}`}><span className="quick-gem-result-photo"><AdminImage src={row.image} alt="" /></span><span className="quick-gem-result-copy"><code>{row.reference || row.id}</code><strong>{row.title}</strong><small>{row.categoryName}{row.weight != null ? ` · ${number(row.weight)} ct` : ''}</small></span><span className="quick-gem-result-end"><span className={`quick-gem-source is-${row.source}`}>{sourceName(row.source)}</span><small>{availability(row)}</small><AdminIcon name="eye" size={17} /></span></button></li>)}</ul>}
    {lookup.truncated && <p className="quick-gem-truncated">Showing {lookup.candidates.length} of {lookup.total} matches. Enter more of the ID to narrow the list.</p>}
    {selected && <RecordInspector key={selected} row={selectedRow} loading={selected.startsWith('stock:') && privateIncomplete} onClose={() => setSelected('')} onEditStone={onEditStone} onDeleteStone={onDeleteStone} />}
  </section>;
}
