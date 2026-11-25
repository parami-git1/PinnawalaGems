import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import './AdminOperations.css';
import { apiRequest, fetchAllGemstones, fetchAllRecords } from './api';
import { GEM_MEDIA_LIMITS } from './mediaPolicy';
import { getCategoryBanner, getDefaultCategoryBanner } from './categoryBannerAssets';
import AdminImageField from './admin/AdminImageField';

const emptyCategory = { title: '', description: '', mainImage: '', coverImage: '' };
const emptyStockStone = { categoryId: '', title: '', image: '', quantity: 1, description: '', weight: '', color: '', shape: '', cut: '', origin: '', price: '', includedInStock: true, stockStatus: 'Available', treatment: 'Unspecified', hasCertificate: false, certificateImage: '', certificateDetails: '' };
const emptyAd = { title: '', image: '', layoutType: 'horizontal', description: '' };
const emptyLegacyGem = { title: '', description: '', category: '', primaryColor: '', mainImage: '', variations: [] };
const emptyVariation = { weight: '', designName: '', images: [] };
const tabs = [
  ['catalog', 'Categories & homepage', 'Organise the collection and choose which gemstones appear on your homepage.'],
  ['stock', 'Stock inventory', 'Manage stock categories, quantities and the details of each stone.'],
  ['ads', 'Event ads', 'Create and maintain the event advertisements shown on your website.'],
  ['legacy', 'Older gem catalog', 'Maintain entries and variations in your existing older catalog.'],
];

const api = apiRequest;
const OperationsUploads = createContext(null);

function OpsIcon({ name = 'gem', ...props }) {
  const paths = {
    gem: 'm3 8 4-5h10l4 5-9 13L3 8Zm0 0h18M7 3l5 18 5-18',
    search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
    plus: 'M12 5v14M5 12h14',
    upload: 'M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5',
    refresh: 'M20 7V3m0 4h-4M4 17v4m0-4h4M5 8a8 8 0 0 1 13-3l2 2M4 17l2 2a8 8 0 0 0 13-3',
    image: 'M3 3h18v18H3V3Zm0 13 5-5 4 4 3-3 6 6M8 7h.01',
    edit: 'm16 3 5 5-12 12H4v-5L16 3ZM13 6l5 5',
    trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
    check: 'm5 12 4 4L19 6',
    close: 'm6 6 12 12M6 18 18 6',
    arrow: 'M5 12h14m-5-5 5 5-5 5',
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.gem} /></svg>;
}

function Field({ label, name, value, onChange, required = false, type = 'text', id, help, ...props }) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  return <div className="admin-field ops-field"><label htmlFor={fieldId}>{label}{required && <span className="ops-required" aria-hidden="true"> *</span>}</label><input id={fieldId} type={type} name={name} value={value ?? ''} onChange={onChange} required={required} min={type === 'number' && ['quantity', 'weight', 'price'].includes(name) ? 0 : undefined} step={name === 'quantity' ? 1 : undefined} aria-describedby={help ? `${fieldId}-help` : undefined} {...props} />{help && <p id={`${fieldId}-help`} className="ops-help">{help}</p>}</div>;
}

function TextField({ label = 'Description', name = 'description', value, onChange, required = false, id, ...props }) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  return <div className="admin-field ops-field ops-span-full"><label htmlFor={fieldId}>{label}{required && <span className="ops-required" aria-hidden="true"> *</span>}</label><textarea id={fieldId} name={name} value={value ?? ''} onChange={onChange} rows={3} required={required} {...props} /></div>;
}

function VariationImageField({ images, onChange, disabled }) {
  const rows = Array.isArray(images) && images.length ? images : [''];
  const [photoKeys, setPhotoKeys] = useState(() => rows.map(() => crypto.randomUUID()));
  if (photoKeys.length !== rows.length) setPhotoKeys((current) => rows.map((_, index) => current[index] || crypto.randomUUID()));
  const addPhoto = () => { setPhotoKeys((current) => [...current, crypto.randomUUID()]); onChange([...rows, '']); };
  const removePhoto = (index) => { setPhotoKeys((current) => current.filter((_, row) => row !== index)); onChange(rows.filter((_, row) => row !== index)); };
  return <div className="ops-variation-upload-list"><div className="ops-variation-heading"><h4>Variation photographs</h4><span className="ops-help">{rows.filter(Boolean).length} / {GEM_MEDIA_LIMITS.images}</span></div>{rows.map((image, index) => <div className="ops-variation-upload-row" key={photoKeys[index]}><ImageField label={`Variation photo ${index + 1}`} value={image} onChange={(event) => onChange(rows.map((current, row) => row === index ? event.target.value : current))} disabled={disabled} />{rows.length > 1 && <button type="button" className="admin-button is-danger" disabled={disabled} onClick={() => removePhoto(index)}><OpsIcon name="trash" />Remove photo {index + 1}</button>}</div>)}<button type="button" className="admin-button is-secondary" disabled={disabled || rows.length >= GEM_MEDIA_LIMITS.images} onClick={addPhoto}><OpsIcon name="plus" />Add another photo</button><p className="ops-help">Optional. Upload photographs or paste a URL for each image. Up to {GEM_MEDIA_LIMITS.images} photos per variation.</p></div>;
}

function MediaThumb({ src, title = '', large = false }) {
  const [failed, setFailed] = useState(false);
  return <span className={`ops-media${large ? ' is-large' : ''}`}>{src && !failed ? <img src={src} alt={large ? `${title || 'Image'} preview` : ''} loading="lazy" onError={() => setFailed(true)} /> : <OpsIcon name="image" />}</span>;
}

function ImageField({ label, name, value, onChange, required = false, disabled = false, hint }) {
  const uploadKey = useId();
  const uploads = useContext(OperationsUploads);
  return <AdminImageField label={label.replace(/\s+URL$/i, '')} name={name} value={value} onChange={(url) => onChange({ target: { name, value: url, type: 'text' } })} required={required} disabled={disabled} hint={hint} onBusyChange={(active) => uploads?.track(uploadKey, active)} className="ops-image-field ops-span-full" />;
}

function CategoryBannerPreview({ category }) {
  const [failedSources, setFailedSources] = useState([]);
  const source = [getCategoryBanner(category), getDefaultCategoryBanner(category)].find((url) => url && !failedSources.includes(url));
  const uploaded = Boolean(source && typeof category.coverImage === 'string' && source === category.coverImage.trim());
  return <div className="ops-banner-preview">
    {source ? <img key={source} src={source} alt={`${category.title || 'Collection'} category banner preview`} loading="lazy" onError={() => setFailedSources((current) => [...current, source])} /> : <div className="ops-banner-placeholder"><OpsIcon name="image" /><span>Banner preview unavailable</span></div>}
    <span className={`ops-banner-source${uploaded ? ' is-uploaded' : ''}`}>{uploaded ? 'Uploaded' : 'Curated default'}</span>
  </div>;
}

function CategoryBannerField({ category, onChange, editing, busy }) {
  return <section className="ops-category-banner ops-span-full" aria-labelledby="ops-category-banner-heading">
    <div className="ops-banner-field-heading"><OpsIcon name="image" /><div><h4 id="ops-category-banner-heading">Category banner</h4><p>The wide image at the top of this collection's page.</p></div></div>
    <CategoryBannerPreview category={category} />
    <div id="ops-category-banner-upload" tabIndex={-1}><ImageField label="Banner image" name="coverImage" value={category.coverImage} onChange={onChange} disabled={busy} hint="Use a wide landscape image, ideally 3:1 (1800 × 600 px). Keep the gemstone on the right so the collection title stays clear." /></div>
    <div className="ops-banner-save"><p className="ops-help">{category.coverImage ? 'Save the category to apply this banner to your website.' : 'A curated banner appears until you add your own image.'}</p>{editing && <button type="submit" className="admin-button is-secondary" disabled={busy}><OpsIcon name="check" />Save category banner</button>}</div>
  </section>;
}

function Panel({ title, description, count, children, className = '', id }) {
  return <section className={`admin-panel ops-panel ${className}`} aria-labelledby={id}><header className="admin-panel-header ops-panel-header"><div><h3 id={id}>{title}</h3>{description && <p>{description}</p>}</div>{count !== undefined && <span className="admin-badge ops-count">{count}</span>}</header>{children}</section>;
}

function FormPanel({ title, description, label, id, busy, editing, children, onSubmit }) {
  const uploads = useContext(OperationsUploads);
  return <Panel title={title} description={description} id={id} className="ops-form-panel"><form aria-label={label} onSubmit={onSubmit}><fieldset disabled={busy && !uploads?.active} className="admin-panel-body ops-form-body">{editing && <p className="ops-editing"><OpsIcon name="edit" />Editing an existing record</p>}{children}</fieldset></form></Panel>;
}

function FormActions({ editing, onCancel, busy, label = 'Save changes' }) {
  return <div className="ops-form-actions ops-span-full"><button type="submit" className="admin-button is-primary" disabled={busy}><OpsIcon name={editing ? 'check' : 'plus'} />{busy ? 'Working…' : label}</button>{editing && <button type="button" className="admin-button is-secondary" disabled={busy} onClick={onCancel}>Cancel edit</button>}</div>;
}

function Empty({ title, detail }) {
  return <div className="admin-empty ops-empty"><span><OpsIcon /></span><h4>{title}</h4>{detail && <p>{detail}</p>}</div>;
}

function Records({ title, description, rows, columns, renderRow, emptyTitle, emptyDetail, searchLabel = 'Search records', searchValue, loading, tools }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? rows.filter((row) => String(searchValue ? searchValue(row) : [row.title, row.stoneId, row.description, row.category, row.primaryColor].filter(Boolean).join(' ')).toLowerCase().includes(term)) : rows;
  }, [rows, query, searchValue]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 8));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = filtered.slice((currentPage - 1) * 8, currentPage * 8);
  return <Panel title={title} description={description} count={rows.length} id={`ops-list-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}><div className="admin-toolbar ops-list-toolbar"><label className="ops-search"><span className="sr-only">{searchLabel}</span><OpsIcon name="search" /><input type="search" placeholder={searchLabel} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label>{tools}</div>{loading && rows.length === 0 ? <p className="ops-loading" role="status">Loading records…</p> : filtered.length ? <><div className="admin-table-wrap"><table className="admin-table ops-table"><caption className="sr-only">{title}</caption><thead><tr>{columns.map((column) => <th scope="col" key={column}>{column}</th>)}</tr></thead><tbody>{visibleRows.map(renderRow)}</tbody></table></div><div className="ops-pagination"><p>{(currentPage - 1) * 8 + 1}–{Math.min(currentPage * 8, filtered.length)} of {filtered.length} {query && 'matching '}records</p><div><button type="button" className="admin-button is-secondary" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}>Previous</button><span>Page {currentPage} of {totalPages}</span><button type="button" className="admin-button is-secondary" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages}>Next</button></div></div></> : <Empty title={query ? 'No matching records' : emptyTitle} detail={query ? 'Try a different name, category or reference.' : emptyDetail} />}</Panel>;
}

function RecordName({ record, image }) {
  return <div className="ops-record-name"><MediaThumb key={image || 'empty'} src={image} /><div><strong>{record.title || 'Untitled'}</strong>{record.stoneId && <span>{record.stoneId}</span>}</div></div>;
}

function RowActions({ onEdit, onDelete, busy, title }) {
  return <div className="ops-row-actions">{onEdit && <button type="button" className="admin-button is-secondary" onClick={onEdit} disabled={busy} aria-label={`Edit ${title}`}><OpsIcon name="edit" />Edit</button>}{onDelete && <button type="button" className="admin-button is-danger" onClick={onDelete} disabled={busy} aria-label={`Delete ${title}`}><OpsIcon name="trash" />Delete</button>}</div>;
}

function focusEditor(id) { window.requestAnimationFrame(() => document.getElementById(id)?.focus()); }
function changeSetter(setter) { return (event) => { const { name, value, type, checked } = event.target; setter((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value })); }; }
function categoryId(stone) { return typeof stone.categoryId === 'object' ? stone.categoryId?._id : stone.categoryId; }
function stockFormFor(stone) { return { ...emptyStockStone, ...Object.fromEntries(Object.keys(emptyStockStone).filter((key) => stone?.[key] != null).map((key) => [key, stone[key]])), categoryId: categoryId(stone || {}) || '', includedInStock: stone?.includedInStock !== false }; }

function AdminOperations({ initialSection = 'catalog', initialStockStone, onStockStoneOpened, onDataChanged }) {
  const [section, setSection] = useState(() => initialStockStone ? 'stock' : tabs.some(([id]) => id === initialSection) ? initialSection : 'catalog');
  const [categories, setCategories] = useState([]);
  const [stockCategories, setStockCategories] = useState([]);
  const [stockStones, setStockStones] = useState([]);
  const [stones, setStones] = useState([]);
  const [ads, setAds] = useState([]);
  const [legacyGems, setLegacyGems] = useState([]);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [stockCategoryForm, setStockCategoryForm] = useState(emptyCategory);
  const [stockStoneForm, setStockStoneForm] = useState(() => stockFormFor(initialStockStone));
  const [adForm, setAdForm] = useState(emptyAd);
  const [legacyForm, setLegacyForm] = useState(emptyLegacyGem);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingStockStone, setEditingStockStone] = useState(initialStockStone || null);
  const [editingAd, setEditingAd] = useState(null);
  const [editingLegacyGem, setEditingLegacyGem] = useState(null);
  const [status, setStatus] = useState(null);
  const [loadErrors, setLoadErrors] = useState([]);
  const [pending, setPending] = useState({ categories: true, stockCategories: true, stockStones: true, stones: true, ads: true, legacy: true });
  const [loaded, setLoaded] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editorSessions, setEditorSessions] = useState({ category: 0, stockCategory: 0, stockStone: 0, ad: 0, legacy: 0 });
  const busyRef = useRef(false);
  const uploadingRef = useRef(false);
  const uploadKeys = useRef(new Set());
  const initialStockConsumed = useRef(false);
  const mountedRef = useRef(true);
  const activeLoad = useRef(null);
  const loadVersion = useRef(0);
  const resetEditorSession = (key) => setEditorSessions((current) => ({ ...current, [key]: current[key] + 1 }));
  const selectEditor = (key, setter) => (record) => { setter(record); resetEditorSession(key); };
  const trackUpload = useCallback((key, active) => {
    if (active) uploadKeys.current.add(key); else uploadKeys.current.delete(key);
    uploadingRef.current = uploadKeys.current.size > 0;
    if (mountedRef.current) setUploading(uploadingRef.current);
  }, []);
  useEffect(() => {
    if (!initialStockStone || initialStockConsumed.current) return;
    initialStockConsumed.current = true;
    focusEditor('ops-stock-stone-title');
    onStockStoneOpened?.();
  }, [initialStockStone, onStockStoneOpened]);

  const load = useCallback(async () => {
    activeLoad.current?.abort();
    const controller = new AbortController(); activeLoad.current = controller;
    const version = ++loadVersion.current;
    const current = () => mountedRef.current && version === loadVersion.current && !controller.signal.aborted;
    const definitions = [
      ['categories', 'Gem categories', setCategories, () => api('/api/inventory/categories', { signal: controller.signal })],
      ['stockCategories', 'Stock categories', setStockCategories, () => api('/api/stock/categories', { signal: controller.signal })],
      ['stockStones', 'Stock stones', setStockStones, () => fetchAllRecords('/stock/stones', { signal: controller.signal })],
      ['stones', 'Homepage gemstones', setStones, () => fetchAllGemstones({ signal: controller.signal })],
      ['ads', 'Event advertisements', setAds, () => api('/api/event-ads', { signal: controller.signal })],
      ['legacy', 'Older catalog gems', setLegacyGems, () => api('/api/gems', { signal: controller.signal })],
    ];
    setRefreshing(true); setLoadErrors([]);
    setPending(Object.fromEntries(definitions.map(([key]) => [key, true])));
    await Promise.allSettled(definitions.map(async ([key, name, setter, fetcher]) => {
      try { const data = await fetcher(); if (current()) { setter(Array.isArray(data) ? data : []); setLoaded((previous) => ({ ...previous, [key]: true })); } }
      catch (error) { if (current()) setLoadErrors((previous) => [...previous, `${name}: ${error.message || 'Could not load records.'}`]); }
      finally { if (current()) setPending((previous) => ({ ...previous, [key]: false })); }
    }));
    if (current()) { setRefreshing(false); activeLoad.current = null; }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const timer = window.setTimeout(load, 0);
    const onRefresh = () => { if (!busyRef.current && !uploadingRef.current) load(); };
    window.addEventListener('admin-refresh', onRefresh);
    return () => { mountedRef.current = false; loadVersion.current += 1; activeLoad.current?.abort(); window.clearTimeout(timer); window.removeEventListener('admin-refresh', onRefresh); };
  }, [load]);

  const save = async (action, successMessage) => {
    if (busyRef.current || uploadingRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    setStatus(null);
    try {
      await action();
      if (mountedRef.current) { setStatus({ type: 'success', message: successMessage }); load(); }
      if (onDataChanged) Promise.resolve().then(onDataChanged).catch(() => {});
      return true;
    } catch (error) {
      if (mountedRef.current) setStatus({ type: 'error', message: error.message || 'Could not save changes. Please try again.' });
      return false;
    } finally { busyRef.current = false; if (mountedRef.current) setBusy(false); }
  };

  const confirmDelete = (message, action, successMessage) => { if (!busyRef.current && !uploadingRef.current && window.confirm(message)) save(action, successMessage); };
  const saveCategory = async (event) => {
    event.preventDefault();
    const saved = await save(() => api(editingCategory ? `/api/inventory/categories/${editingCategory._id}` : '/api/inventory/categories', { method: editingCategory ? 'PUT' : 'POST', body: JSON.stringify(categoryForm) }), 'Gem category saved.');
    if (saved) { setCategoryForm(emptyCategory); setEditingCategory(null); resetEditorSession('category'); }
  };
  const saveStockCategory = async (event) => {
    event.preventDefault();
    if (await save(() => api('/api/stock/categories', { method: 'POST', body: JSON.stringify(stockCategoryForm) }), 'Stock category created.')) { setStockCategoryForm(emptyCategory); resetEditorSession('stockCategory'); }
  };
  const saveStockStone = async (event) => {
    event.preventDefault();
    if (!Number.isInteger(Number(stockStoneForm.quantity)) || Number(stockStoneForm.quantity) < 0) { setStatus({ type: 'error', message: 'Quantity must be a whole number of zero or more.' }); return; }
    if (stockStoneForm.price !== '' && stockStoneForm.price != null && (!Number.isFinite(Number(stockStoneForm.price)) || Number(stockStoneForm.price) < 0)) { setStatus({ type: 'error', message: 'Price must be zero or more.' }); return; }
    if (stockStoneForm.weight !== '' && stockStoneForm.weight != null && (!Number.isFinite(Number(stockStoneForm.weight)) || Number(stockStoneForm.weight) < 0)) { setStatus({ type: 'error', message: 'Carat weight must be zero or more.' }); return; }
    const optionalNumber = (value) => value === '' || value === null || value === undefined ? null : Number(value);
    const payload = Object.fromEntries(Object.keys(emptyStockStone).map((key) => [key, stockStoneForm[key]]));
    payload.quantity = Number(stockStoneForm.quantity); payload.weight = optionalNumber(stockStoneForm.weight); payload.price = optionalNumber(stockStoneForm.price);
    if (await save(() => api(editingStockStone ? `/api/stock/stones/${editingStockStone._id}` : '/api/stock/stones', { method: editingStockStone ? 'PUT' : 'POST', body: JSON.stringify(payload) }), 'Stock stone saved.')) { setStockStoneForm(emptyStockStone); setEditingStockStone(null); resetEditorSession('stockStone'); }
  };
  const saveAd = async (event) => {
    event.preventDefault();
    if (await save(() => api(editingAd ? `/api/event-ads/${editingAd._id}` : '/api/event-ads', { method: editingAd ? 'PUT' : 'POST', body: JSON.stringify(adForm) }), 'Event advertisement saved.')) { setAdForm(emptyAd); setEditingAd(null); resetEditorSession('ad'); }
  };
  const saveLegacyGem = async (event) => {
    event.preventDefault();
    const variations = legacyForm.variations.filter((variation) => String(variation.weight ?? '').trim()).map((variation) => ({ ...variation, images: (variation.images || []).filter(Boolean) }));
    if (await save(() => api(editingLegacyGem ? `/api/gems/${editingLegacyGem._id}` : '/api/gems', { method: editingLegacyGem ? 'PUT' : 'POST', body: JSON.stringify({ ...legacyForm, variations }) }), 'Older catalog gem saved.')) { setLegacyForm(emptyLegacyGem); setEditingLegacyGem(null); resetEditorSession('legacy'); }
  };
  const toggleStone = (stone, field) => save(() => api(`/api/inventory/stones/${stone._id}`, { method: 'PUT', body: JSON.stringify({ [field]: !stone[field] }) }), `${field === 'isTopGem' ? 'Homepage gem' : 'Featured status'} updated.`);
  const disabled = busy || uploading;
  const sectionResources = { catalog: ['categories', 'stones'], stock: ['stockCategories', 'stockStones'], ads: ['ads'], legacy: ['legacy'] };
  const loading = sectionResources[section].some((key) => pending[key] && !loaded[key]);
  const activeTab = tabs.find(([id]) => id === section);

  return <OperationsUploads.Provider value={{ track: trackUpload, active: uploading }}><div className="admin-operations">
    <div className="ops-page-header"><div><p className="ops-kicker">Catalog management</p><h2>{activeTab[1]}</h2><p>{activeTab[2]}</p></div><button type="button" className="admin-button is-secondary" onClick={load} disabled={refreshing || disabled}><OpsIcon name="refresh" />{refreshing ? 'Refreshing…' : 'Refresh records'}</button></div>
    <nav className="admin-subnav ops-subnav" aria-label="Operations sections">{tabs.map(([id, label]) => <button type="button" key={id} onClick={() => setSection(id)} disabled={disabled} className={section === id ? 'is-active' : ''} aria-pressed={section === id}>{label}</button>)}</nav>
    {status && <div className={`ops-notice is-${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}><OpsIcon name={status.type === 'success' ? 'check' : 'close'} /><p>{status.message}</p><button type="button" onClick={() => setStatus(null)} aria-label="Dismiss message"><OpsIcon name="close" /></button></div>}
    {loadErrors.length > 0 && <div className="ops-notice is-error" role="alert"><div><strong>Some records could not be refreshed</strong><ul>{loadErrors.map((error) => <li key={error}>{error}</li>)}</ul></div><button type="button" className="admin-button is-secondary" onClick={load} disabled={loading || disabled}>Try again</button></div>}
    {(busy || uploading) && <p className="ops-working" role="status"><span />{uploading ? 'Uploading image…' : 'Saving changes…'}</p>}
    {section === 'catalog' && <CatalogOperations editorSession={editorSessions.category} categories={categories} categoryForm={categoryForm} setCategoryForm={setCategoryForm} editingCategory={editingCategory} setEditingCategory={selectEditor('category', setEditingCategory)} saveCategory={saveCategory} deleteCategory={(category) => confirmDelete(`Delete “${category.title}” and every related gem? This cannot be undone.`, () => api(`/api/inventory/categories/${category._id}`, { method: 'DELETE' }), 'Category deleted.')} stones={stones} toggleStone={toggleStone} busy={disabled} loading={loading} />}
    {section === 'stock' && <StockOperations editorSession={editorSessions.stockStone} categorySession={editorSessions.stockCategory} categories={stockCategories} categoryForm={stockCategoryForm} setCategoryForm={setStockCategoryForm} saveCategory={saveStockCategory} deleteCategory={(category) => confirmDelete(`Delete “${category.title}” and all its stock stones? This cannot be undone.`, () => api(`/api/stock/categories/${category._id}`, { method: 'DELETE' }), 'Stock category deleted.')} stoneForm={stockStoneForm} setStoneForm={setStockStoneForm} editingStone={editingStockStone} setEditingStone={selectEditor('stockStone', setEditingStockStone)} saveStone={saveStockStone} stones={stockStones} deleteStone={(stone) => confirmDelete(`Delete “${stone.title}”? This cannot be undone.`, () => api(`/api/stock/stones/${stone._id}`, { method: 'DELETE' }), 'Stock stone deleted.')} busy={disabled} loading={loading} />}
    {section === 'ads' && <AdsOperations editorSession={editorSessions.ad} ads={ads} form={adForm} setForm={setAdForm} editing={editingAd} setEditing={selectEditor('ad', setEditingAd)} save={saveAd} deleteAd={(ad) => confirmDelete(`Delete the “${ad.title}” advertisement? This cannot be undone.`, () => api(`/api/event-ads/${ad._id}`, { method: 'DELETE' }), 'Advertisement deleted.')} busy={disabled} loading={loading} />}
    {section === 'legacy' && <LegacyOperations editorSession={editorSessions.legacy} gems={legacyGems} form={legacyForm} setForm={setLegacyForm} editing={editingLegacyGem} setEditing={selectEditor('legacy', setEditingLegacyGem)} save={saveLegacyGem} deleteGem={(gem) => confirmDelete(`Delete “${gem.title}” from the older catalog? This cannot be undone.`, () => api(`/api/gems/${gem._id}`, { method: 'DELETE' }), 'Older catalog gem deleted.')} busy={disabled} loading={loading} />}
  </div></OperationsUploads.Provider>;
}

function CatalogOperations({ editorSession, categories, categoryForm, setCategoryForm, editingCategory, setEditingCategory, saveCategory, deleteCategory, stones, toggleStone, busy, loading }) {
  const [placement, setPlacement] = useState('all');
  const change = changeSetter(setCategoryForm);
  const visibleStones = placement === 'homepage' ? stones.filter((stone) => stone.isTopGem) : placement === 'featured' ? stones.filter((stone) => stone.isFeatured) : stones;
  const editCategory = (category, banner = false) => { setEditingCategory(category); setCategoryForm({ ...emptyCategory, ...category }); focusEditor(banner ? 'ops-category-banner-upload' : 'ops-gem-category-title'); };
  return <div className="ops-stack">
    <Panel title="Collection banners" description="Review every collection's wide banner. Choose Edit banner to upload a replacement, then save the category." count={categories.length} id="ops-collection-banners-heading" className="ops-banner-overview">
      {loading && categories.length === 0 ? <p className="ops-loading" role="status">Loading collection banners...</p> : categories.length ? <div className="ops-banner-grid">{categories.map((category) => <article className={`ops-banner-card${editingCategory?._id === category._id ? ' is-editing' : ''}`} key={category._id}>
        <CategoryBannerPreview category={category} />
        <div className="ops-banner-card-footer"><div><h4>{category.title || 'Untitled category'}</h4><p>{editingCategory?._id === category._id ? 'Editing in the form below' : 'Collection page banner'}</p></div><button type="button" className="admin-button is-secondary" disabled={busy} onClick={() => editCategory(category, true)} aria-label={`Edit banner for ${category.title || 'untitled category'}`}><OpsIcon name="edit" />Edit banner</button></div>
      </article>)}</div> : <Empty title="Your collection banners will appear here" detail="Create a gem category below to give it a wide collection banner." />}
    </Panel>
    <div className="ops-editor-layout"><FormPanel key={`${editingCategory?._id || 'new'}-${editorSession}`} title={editingCategory ? 'Edit gem category' : 'New gem category'} description="Set the name and imagery used to browse your collection." id="ops-category-editor-heading" label="Gem category details" busy={busy} editing={editingCategory} onSubmit={saveCategory}>
    <Field label="Category title" name="title" id="ops-gem-category-title" value={categoryForm.title} onChange={change} required autoComplete="off" />
    <CategoryBannerField category={categoryForm} onChange={change} editing={editingCategory} busy={busy} />
    <TextField value={categoryForm.description} onChange={change} />
    <div className="ops-category-thumbnail ops-span-full"><div><h4>Category thumbnail</h4><p className="ops-help">The smaller image used on category cards.</p></div><ImageField label="Thumbnail image" name="mainImage" value={categoryForm.mainImage} onChange={change} disabled={busy} required /></div>
    <FormActions editing={editingCategory} busy={busy} label={editingCategory ? 'Save category' : 'Create category'} onCancel={() => { setEditingCategory(null); setCategoryForm(emptyCategory); }} />
  </FormPanel><div className="ops-stack">
    <Records title="Gem categories" description="Deleting a category also removes its related gemstones." rows={categories} columns={['Category', 'Actions']} searchLabel="Search categories" loading={loading} emptyTitle="No gem categories yet" emptyDetail="Create a category using the form to organise your gemstones." renderRow={(category) => <tr key={category._id}><td><RecordName record={category} image={category.mainImage || category.image} />{category.description && <p className="ops-cell-description">{category.description}</p>}</td><td><RowActions title={category.title} busy={busy} onEdit={() => editCategory(category)} onDelete={() => deleteCategory(category)} /></td></tr>} />
    <Records title="Homepage & featured gems" description="Control gemstone visibility without changing inventory details." rows={visibleStones} columns={['Gemstone', 'Placement']} searchLabel="Search gemstones or references" loading={loading} emptyTitle={placement === 'all' ? 'No gemstones available' : 'No gems in this view'} emptyDetail={placement === 'all' ? 'Add gemstones in Gem Inventory, then manage their placement here.' : 'Choose All gemstones to update homepage and featured placements.'} tools={<label className="ops-filter"><span className="sr-only">Filter gemstone placement</span><select aria-label="Filter gemstone placement" value={placement} onChange={(event) => setPlacement(event.target.value)}><option value="all">All gemstones</option><option value="homepage">On homepage</option><option value="featured">Featured</option></select></label>} renderRow={(stone) => <tr key={stone._id}><td><RecordName record={stone} image={stone.image} /></td><td><div className="ops-placement"><button type="button" className={`admin-button ${stone.isTopGem ? 'is-selected' : 'is-secondary'}`} disabled={busy} aria-pressed={Boolean(stone.isTopGem)} onClick={() => toggleStone(stone, 'isTopGem')}>{stone.isTopGem && <OpsIcon name="check" />}{stone.isTopGem ? 'On homepage' : 'Add homepage'}</button><button type="button" className={`admin-button ${stone.isFeatured ? 'is-selected' : 'is-secondary'}`} disabled={busy} aria-pressed={Boolean(stone.isFeatured)} onClick={() => toggleStone(stone, 'isFeatured')}>{stone.isFeatured && <OpsIcon name="check" />}{stone.isFeatured ? 'Featured' : 'Feature'}</button></div></td></tr>} />
  </div></div></div>;
}

function StockOperations({ editorSession, categorySession, categories, categoryForm, setCategoryForm, saveCategory, deleteCategory, stoneForm, setStoneForm, editingStone, setEditingStone, saveStone, stones, deleteStone, busy, loading }) {
  const categoryChange = changeSetter(setCategoryForm);
  const stoneChange = changeSetter(setStoneForm);
  const categoryNames = new Map(categories.map((category) => [category._id, category.title]));
  return <div className="ops-stack"><div className="ops-stock-layout"><div className="ops-stack"><FormPanel key={`stock-category-${categorySession}`} title="New stock category" description="Group stock stones by gemstone type or collection." id="ops-stock-category-heading" label="Stock category details" busy={busy} onSubmit={saveCategory}>
    <Field label="Category title" name="title" id="ops-stock-category-title" value={categoryForm.title} onChange={categoryChange} required />
    <TextField value={categoryForm.description} onChange={categoryChange} />
    <ImageField label="Stock category image" name="mainImage" value={categoryForm.mainImage} onChange={categoryChange} disabled={busy} required />
    <FormActions busy={busy} label="Create stock category" />
  </FormPanel><Records title="Stock categories" description="Deleting a category also removes all of its stock stones." rows={categories} columns={['Category', 'Actions']} loading={loading} searchLabel="Search stock categories" emptyTitle="No stock categories yet" emptyDetail="Create a category before adding stock stones." renderRow={(category) => <tr key={category._id}><td><RecordName record={category} image={category.mainImage} /></td><td><RowActions title={category.title} busy={busy} onDelete={() => deleteCategory(category)} /></td></tr>} /></div>
  <FormPanel key={`${editingStone?._id || 'new'}-${editorSession}`} title={editingStone ? 'Edit stock stone' : 'New stock stone'} description="Keep identity, availability and gem specifications ready for customer enquiries." id="ops-stock-stone-heading" label="Stock stone details" editing={editingStone} busy={busy} onSubmit={saveStone}>
    <div className="ops-generated-reference" aria-label="Generated Gem ID"><span>Gem ID</span><strong>{editingStone?.stoneId || 'Generated when you save'}</strong><small>The server creates this permanent reference automatically.</small></div>
    <section className="ops-stock-form-section" aria-labelledby="ops-stock-identity"><div className="ops-stock-section-heading"><OpsIcon /><h4 id="ops-stock-identity">Gemstone identity</h4></div>
    <div className="admin-field ops-field"><label htmlFor="ops-stock-stone-category">Stock category<span className="ops-required" aria-hidden="true"> *</span></label><select id="ops-stock-stone-category" name="categoryId" value={stoneForm.categoryId} onChange={stoneChange} required><option value="">Select a stock category</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.title}</option>)}</select>{!categories.length && <p className="ops-help">Create a stock category first using the form alongside.</p>}</div>
    <Field label="Stone title" name="title" id="ops-stock-stone-title" value={stoneForm.title} onChange={stoneChange} required />
    <div className="admin-form-grid ops-form-grid">{[['weight', 'Weight per piece (ct)'], ['color', 'Colour'], ['shape', 'Shape'], ['cut', 'Cut'], ['origin', 'Origin']].map(([name, label]) => <Field key={name} label={label} name={name} value={stoneForm[name]} onChange={stoneChange} type={name === 'weight' ? 'number' : 'text'} step={name === 'weight' ? 'any' : undefined} />)}<div className="admin-field ops-field"><label htmlFor="ops-stock-treatment">Treatment</label><select id="ops-stock-treatment" name="treatment" value={stoneForm.treatment} onChange={stoneChange}>{['Unspecified', 'Unheated', 'Heated', 'Other'].map((treatment) => <option key={treatment}>{treatment}</option>)}</select></div></div>
    <TextField value={stoneForm.description} onChange={stoneChange} />
    </section>
    <section className="ops-stock-form-section" aria-labelledby="ops-stock-availability"><div className="ops-stock-section-heading"><OpsIcon name="check" /><h4 id="ops-stock-availability">Stock & availability</h4></div><div className="admin-form-grid ops-form-grid"><Field label="Quantity" name="quantity" value={stoneForm.quantity} onChange={stoneChange} type="number" required /><Field label="Price per piece (Rs.)" name="price" value={stoneForm.price} onChange={stoneChange} type="number" step="any" /><div className="admin-field ops-field ops-span-full"><label htmlFor="ops-stock-status">Stock status</label><select id="ops-stock-status" name="stockStatus" value={stoneForm.stockStatus} onChange={stoneChange}>{['Available', 'Reserved', 'Sold'].map((value) => <option key={value}>{value}</option>)}</select><p className="ops-help">Reserved and sold stones stay recorded separately from pieces ready to offer.</p></div></div><label className="ops-checkbox ops-stock-inclusion"><input type="checkbox" name="includedInStock" checked={stoneForm.includedInStock !== false} onChange={stoneChange} /><span>Include in stock totals<small>Turn off for reference-only or consignment records you want to exclude from stock calculations. This private stock form does not publish a stone to the website.</small></span></label></section>
    <section className="ops-stock-form-section" aria-labelledby="ops-stock-photographs"><div className="ops-stock-section-heading"><OpsIcon name="image" /><h4 id="ops-stock-photographs">Photograph</h4></div><ImageField label="Stock stone image" name="image" value={stoneForm.image} onChange={stoneChange} disabled={busy} required /></section>
    <section className="ops-stock-form-section" aria-labelledby="ops-stock-certificate"><div className="ops-stock-section-heading"><OpsIcon name="check" /><h4 id="ops-stock-certificate">Certification</h4></div>
    <label className="ops-checkbox"><input type="checkbox" name="hasCertificate" checked={Boolean(stoneForm.hasCertificate)} onChange={stoneChange} /><span>Has a certificate<small>Mark this item when certificate information is available.</small></span></label>
    <TextField label="Certificate details" name="certificateDetails" value={stoneForm.certificateDetails} onChange={stoneChange} placeholder="Laboratory, report number and relevant details" />
    <ImageField label="Stock certificate image" name="certificateImage" value={stoneForm.certificateImage} onChange={stoneChange} disabled={busy} hint="Optional. Add the certificate photograph from your device or an existing image link." />
    </section>
    <FormActions editing={editingStone} busy={busy} label={editingStone ? 'Save stock stone' : 'Create stock stone'} onCancel={() => { setEditingStone(null); setStoneForm(emptyStockStone); }} />
  </FormPanel></div>
  <Records title="Stock stones" description="Review quantities, availability and the details customers ask about." rows={stones} columns={['Stock item', 'Category', 'Quantity', 'Carats', 'Unit price (LKR)', 'Availability', 'Certificate', 'Actions']} searchLabel="Search stock by name, reference or category" searchValue={(stone) => [stone.title, stone.stoneId, stone.color, stone.shape, stone.cut, stone.origin, stone.treatment, categoryNames.get(categoryId(stone))].filter(Boolean).join(' ')} loading={loading} emptyTitle="No stock stones yet" emptyDetail="Add your first stock item using the form above." renderRow={(stone) => <tr key={stone._id}><td><RecordName record={stone} image={stone.image} />{stone.includedInStock === false && <span className="admin-badge">Excluded from stock totals</span>}</td><td>{categoryNames.get(categoryId(stone)) || 'Unassigned'}</td><td><span className="ops-number">{stone.quantity ?? 1}</span></td><td>{stone.weight ?? '—'}</td><td>{stone.price ?? '—'}</td><td><span className={`admin-badge ${Number(stone.quantity) > 0 && (!stone.stockStatus || stone.stockStatus === 'Available') ? 'is-success' : ''}`}>{Number(stone.quantity) <= 0 ? 'Out of stock' : stone.stockStatus || 'Available'}</span></td><td><span className={`admin-badge ${stone.hasCertificate ? 'is-success' : ''}`}>{stone.hasCertificate ? 'Available' : 'Not marked'}</span></td><td><RowActions title={stone.title} busy={busy} onEdit={() => { setEditingStone(stone); setStoneForm(stockFormFor(stone)); focusEditor('ops-stock-stone-title'); }} onDelete={() => deleteStone(stone)} /></td></tr>} />
  </div>;
}

function AdsOperations({ editorSession, ads, form, setForm, editing, setEditing, save, deleteAd, busy, loading }) {
  const change = changeSetter(setForm);
  return <div className="ops-editor-layout"><FormPanel key={`${editing?._id || 'new'}-${editorSession}`} title={editing ? 'Edit event advertisement' : 'New event advertisement'} description="Choose an image and layout for your event promotion." id="ops-ad-editor-heading" label="Event advertisement details" busy={busy} editing={editing} onSubmit={save}>
    <Field label="Advertisement title" name="title" id="ops-event-ad-title" value={form.title} onChange={change} required />
    <ImageField label="Advertisement image" name="image" value={form.image} onChange={change} disabled={busy} required />
    <div className="admin-field ops-field"><label htmlFor="ops-ad-layout">Display layout</label><select id="ops-ad-layout" name="layoutType" value={form.layoutType} onChange={change}><option value="horizontal">Horizontal</option><option value="vertical">Vertical</option></select><p className="ops-help">Match the layout to the orientation of your artwork.</p></div>
    <TextField value={form.description} onChange={change} />
    <FormActions editing={editing} busy={busy} label={editing ? 'Save advertisement' : 'Create advertisement'} onCancel={() => { setEditing(null); setForm(emptyAd); }} />
  </FormPanel><Records title="Event advertisements" description="Keep promotional content and artwork up to date." rows={ads} columns={['Advertisement', 'Layout', 'Actions']} searchLabel="Search advertisements" loading={loading} emptyTitle="No event advertisements yet" emptyDetail="Create your first promotion using the form alongside." renderRow={(ad) => <tr key={ad._id}><td><RecordName record={ad} image={ad.image} />{ad.description && <p className="ops-cell-description">{ad.description}</p>}</td><td><span className="admin-badge">{ad.layoutType === 'vertical' ? 'Vertical' : 'Horizontal'}</span></td><td><RowActions title={ad.title} busy={busy} onEdit={() => { setEditing(ad); setForm({ ...emptyAd, ...ad }); focusEditor('ops-event-ad-title'); }} onDelete={() => deleteAd(ad)} /></td></tr>} /></div>;
}

function LegacyOperations({ editorSession, gems, form, setForm, editing, setEditing, save, deleteGem, busy, loading }) {
  const change = changeSetter(setForm);
  const [variationKeys, setVariationKeys] = useState(() => form.variations.map(() => crypto.randomUUID()));
  if (variationKeys.length !== form.variations.length) setVariationKeys((current) => form.variations.map((_, index) => current[index] || crypto.randomUUID()));
  const updateVariation = (index, field, value) => setForm((current) => ({ ...current, variations: current.variations.map((variation, variationIndex) => variationIndex === index ? { ...variation, [field]: value } : variation) }));
  const addVariation = () => { setVariationKeys((current) => [...current, crypto.randomUUID()]); setForm((current) => ({ ...current, variations: [...current.variations, { ...emptyVariation, images: [] }] })); };
  const removeVariation = (index) => { setVariationKeys((current) => current.filter((_, row) => row !== index)); setForm((current) => ({ ...current, variations: current.variations.filter((_, variationIndex) => variationIndex !== index) })); };
  return <div className="ops-editor-layout"><FormPanel key={`${editing?._id || 'new'}-${editorSession}`} title={editing ? 'Edit older catalog gem' : 'Add older catalog gem'} description="For entries in the older catalog. Add new inventory in Gem Inventory." id="ops-legacy-editor-heading" label="Older catalog gem details" editing={editing} busy={busy} onSubmit={save}>
    <Field label="Gem title" name="title" id="ops-legacy-gem-title" value={form.title} onChange={change} required />
    <div className="admin-form-grid ops-form-grid"><Field label="Category" name="category" value={form.category} onChange={change} required /><Field label="Primary colour" name="primaryColor" value={form.primaryColor} onChange={change} required /></div>
    <TextField value={form.description} onChange={change} required />
    <ImageField label="Older catalog main image" name="mainImage" value={form.mainImage} onChange={change} disabled={busy} required />
    <div className="ops-variations"><div className="ops-variation-heading"><div><h4>Available variations</h4><p className="ops-help">Add a weight and optional design. Images are optional.</p></div><button type="button" className="admin-button is-secondary" disabled={busy} onClick={addVariation}><OpsIcon name="plus" />Add variation</button></div>
      {form.variations.map((variation, index) => <fieldset key={variationKeys[index]} className="ops-variation"><legend>Variation {index + 1}</legend><div className="admin-form-grid ops-form-grid"><Field label="Weight" name="weight" value={variation.weight} onChange={(event) => updateVariation(index, 'weight', event.target.value)} required /><Field label="Design / cut name" name="designName" value={variation.designName} onChange={(event) => updateVariation(index, 'designName', event.target.value)} /></div><VariationImageField images={variation.images} onChange={(images) => updateVariation(index, 'images', images)} disabled={busy} /><button type="button" className="admin-button is-danger" disabled={busy} onClick={() => removeVariation(index)}><OpsIcon name="trash" />Remove variation</button></fieldset>)}
      {form.variations.length === 0 && <p className="ops-variation-empty">No variations added. Add one when this gem has different weights or designs.</p>}
    </div><FormActions editing={editing} busy={busy} label={editing ? 'Save gem' : 'Create gem'} onCancel={() => { setEditing(null); setForm(emptyLegacyGem); }} />
  </FormPanel><Records title="Older catalog gems" description="Existing catalog entries and their available variations." rows={gems} columns={['Gemstone', 'Details', 'Actions']} searchLabel="Search older catalog" loading={loading} emptyTitle="No older catalog gems" emptyDetail="Entries from your older catalog will appear here." renderRow={(gem) => <tr key={gem._id}><td><RecordName record={gem} image={gem.mainImage} /></td><td><span>{[gem.category, gem.primaryColor].filter(Boolean).join(' · ') || '—'}</span><p className="ops-help">{gem.variations?.length || 0} variations</p></td><td><RowActions title={gem.title} busy={busy} onEdit={() => { setEditing(gem); setForm({ ...emptyLegacyGem, ...gem, variations: (gem.variations || []).map((variation) => ({ ...variation, weight: String(variation.weight ?? ''), images: Array.isArray(variation.images) ? variation.images : [] })) }); focusEditor('ops-legacy-gem-title'); }} onDelete={() => deleteGem(gem)} /></td></tr>} /></div>;
}

export default AdminOperations;
