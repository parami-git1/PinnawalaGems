import { lazy, Suspense, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AdminOperations from './AdminOperations';
import AdminPlanner from './AdminPlanner';
import GemMediaEditor from './admin/GemMediaEditor';
import AdminImageField from './admin/AdminImageField';
import BulkSoldGems from './admin/BulkSoldGems';
import { FeedbackPanel, WebsiteSettings, WorkshopPanel } from './admin/AdminContent';
import { AdminEmptyState, AdminField, AdminIcon, AdminImage, AdminModal } from './admin/AdminUI';
import { GEM_MEDIA_LIMITS, mediaUrls } from './mediaPolicy';
import { apiRequest, fetchAllGemstones, fetchAllRecords } from './api';
import { editableSettings } from './admin/settingsPolicy';
import { ADMIN_LOGIN_PATH, ADMIN_PORTAL_PATH } from './adminPaths';
import { clearAdminSession } from './adminSession';
import './admin/Admin.css';
import { AdminAccessLockContext } from './adminAccessContext';

const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const AdminGuide = lazy(() => import('./admin/AdminGuide'));

const EMPTY_GEM = { title: '', categoryId: '', image: '', weight: '', color: '', shape: '', cut: '', price: '', quantity: 1, includedInStock: true, description: '', hasCertificate: false, certificateDetails: '', certificateImage: '', isFeatured: false, origin: '', additionalImages: [], videos: [], isTopGem: false, homePagePosition: 0 };
const EMPTY_FILTERS = { search: '', categoryId: '', color: '', shape: '', certificate: '', minWeight: '', maxWeight: '', minPrice: '', maxPrice: '' };
const VIEWS = [
  { id: 'analytics', label: 'Overview', icon: 'grid', group: 'Workspace', description: 'A clear view of your gemstone collection and the work that needs your attention.' },
  { id: 'inventory', label: 'Gem inventory', icon: 'gem', description: 'Manage gemstone details, availability and how each piece appears in the collection.' },
  { id: 'operations', label: 'Operations', icon: 'layers', description: 'Keep your categories, stock and collection content organised in one place.' },
  { id: 'planner', label: 'Appointments & notes', icon: 'calendar', description: 'Coordinate customer appointments and keep the important details close at hand.' },
  { id: 'settings', label: 'Website settings', icon: 'settings', group: 'Website', description: 'Manage your homepage and contact information with a consistent, considered presentation.' },
  { id: 'feedback', label: 'Customer reviews', icon: 'star', description: 'Review customer experiences and choose the feedback to share on your website.' },
  { id: 'workshop', label: 'Workshop posts', icon: 'image', description: 'Share the craft behind your collection through workshop images and stories.' },
  { id: 'guide', label: 'How to use', icon: 'book', group: 'Help & support', description: 'Practical guidance for every part of your workspace, with shortcuts to get things done.' },
];
const array = (value) => Array.isArray(value) ? value : [];
const categoryId = (stone) => typeof stone.categoryId === 'object' ? stone.categoryId?._id : stone.categoryId;
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const gemWeightLabel = (weight) => weight !== '' && weight != null ? `${weight}${/ct|carat/i.test(String(weight)) ? '' : ' ct'}` : '—';

const request = apiRequest;

function summarise(stones, categories) {
  const names = new Map(categories.map((item) => [item._id, item.title]));
  const weights = stones.map((stone) => Number.parseFloat(stone.weight)).filter(Number.isFinite);
  const groups = new Map();
  const colours = new Map();
  stones.forEach((stone) => {
    const key = categoryId(stone) || 'uncategorized';
    const group = groups.get(key) || { categoryId: key, name: names.get(key) || 'Uncategorized', stones: 0, quantity: 0, weights: [], prices: [] };
    group.stones += 1; group.quantity += number(stone.quantity);
    const weight = Number.parseFloat(stone.weight);
    if (Number.isFinite(weight)) group.weights.push(weight);
    if (stone.price !== '' && stone.price != null && Number.isFinite(Number(stone.price))) group.prices.push(Number(stone.price));
    groups.set(key, group);
    const color = stone.color || 'Unspecified'; colours.set(color, (colours.get(color) || 0) + 1);
  });
  const mean = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const categoryOverview = [...groups.values()].map((group) => ({ ...group, weights: undefined, prices: undefined, averageWeight: mean(group.weights), minWeight: group.weights.length ? Math.min(...group.weights) : 0, maxWeight: group.weights.length ? Math.max(...group.weights) : 0, averagePrice: mean(group.prices) }));
  return { totalStones: stones.length, totalQuantity: stones.reduce((sum, stone) => sum + number(stone.quantity), 0), totalBlueSapphires: stones.filter((stone) => /blue/i.test(stone.title || '')).length, avgCaratWeight: mean(weights), minCaratWeight: weights.length ? Math.min(...weights) : 0, maxCaratWeight: weights.length ? Math.max(...weights) : 0, categoryOverview, colorDistribution: [...colours].map(([name, value]) => ({ name, value })) };
}

function Notice({ value, onDismiss, focusRef }) {
  if (!value) return null;
  return <div ref={focusRef} tabIndex={focusRef ? -1 : undefined} className={`admin-status ${value.type === 'error' ? 'is-error' : ''}`} role={value.type === 'error' ? 'alert' : 'status'}><AdminIcon name={value.type === 'error' ? 'bell' : 'check'} /><p>{value.message}</p>{onDismiss && <button type="button" onClick={onDismiss} aria-label="Dismiss message"><AdminIcon name="close" /></button>}</div>;
}

function FormSection({ icon, title, description, children }) {
  return <section className="admin-form-section"><div className="admin-form-section-heading"><AdminIcon name={icon} /><div><h3>{title}</h3>{description && <p>{description}</p>}</div></div><div className="admin-form-grid">{children}</div></section>;
}

function GemEditor({ stone, categories, onClose, onSaved }) {
  const editing = Boolean(stone?._id);
  const [form, setForm] = useState(() => ({ ...EMPTY_GEM, ...stone, categoryId: stone ? categoryId(stone) || '' : '', additionalImages: mediaUrls(stone?.additionalImages), videos: mediaUrls(stone?.videos) }));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const errorNotice = useRef(null);
  useEffect(() => {
    if (!error) return;
    errorNotice.current?.focus({ preventScroll: true });
    errorNotice.current?.scrollIntoView({ block: 'nearest' });
  }, [error]);
  const guard = useRef(false);
  const uploadGuard = useRef(false);
  const activeUploads = useRef(new Set());
  const uploadBusy = useCallback((key, value) => {
    if (value) activeUploads.current.add(key); else activeUploads.current.delete(key);
    uploadGuard.current = activeUploads.current.size > 0;
    setUploading(uploadGuard.current);
  }, []);
  const update = (event) => { const { name, type, value, checked } = event.target; setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value })); };
  const input = (name, label, props = {}) => <AdminField key={name} label={label} required={Boolean(props.required)} hint={props.hint} className={props.full ? 'admin-span-full' : ''}><input name={name} value={form[name] ?? ''} onChange={update} type={props.type || 'text'} step={props.step} min={props.min} required={props.required} placeholder={props.placeholder} readOnly={props.readOnly} /></AdminField>;
  const busy = saving || uploading;
  const save = async (event) => {
    event.preventDefault(); if (guard.current || uploadGuard.current) return;
    guard.current = true; setSaving(true); setError('');
    try {
      const image = String(form.image || '').trim();
      const additionalImages = mediaUrls(form.additionalImages).filter((url) => url !== image);
      const videos = mediaUrls(form.videos);
      if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 0) throw new Error('Quantity must be a whole number of zero or more.');
      if (form.price !== '' && form.price != null && (!Number.isFinite(Number(form.price)) || Number(form.price) < 0)) throw new Error('Price must be zero or more.');
      if (!image) throw new Error('Add at least one photo and choose a cover image before saving.');
      if (additionalImages.length + 1 > GEM_MEDIA_LIMITS.images) throw new Error('Each gemstone can have up to 10 photos, including the cover.');
      if (videos.length > GEM_MEDIA_LIMITS.videos) throw new Error('Each gemstone can have up to 2 videos.');
      if ([image, ...additionalImages, ...videos].some((url) => !/^https?:\/\/|^\/(?!\/)/i.test(url))) throw new Error('Use a valid http(s) media URL or upload your files above.');
      const editable = Object.fromEntries(Object.keys(EMPTY_GEM).map((field) => [field, form[field]]));
      const payload = { ...editable, image, additionalImages, videos, quantity: Number(form.quantity), price: form.price === '' || form.price == null ? null : Number(form.price), homePagePosition: Number(form.homePagePosition || 0) };
      await request(editing ? `/api/inventory/stones/${stone._id}` : '/api/inventory/stones', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      onSaved(editing ? 'Gemstone changes saved.' : 'Gemstone added to the collection.');
    } catch (problem) { setError(problem.message); }
    finally { guard.current = false; setSaving(false); }
  };
  return <AdminModal title={editing ? 'Edit gemstone' : 'Add gemstone'} description="Keep each piece beautifully presented, with accurate details and clear availability." onClose={onClose} busy={busy}><form onSubmit={save} aria-label="Gemstone details">
    {error && <Notice value={{ type: 'error', message: error }} focusRef={errorNotice} onDismiss={() => setError('')} />}
    <fieldset disabled={saving} className="admin-plain-fieldset">
      <FormSection icon="gem" title="Gemstone details" description="Start with the essentials for your collection.">
        {input('title', 'Gem name', { required: true, placeholder: 'e.g. Ceylon blue sapphire' })}
        <AdminField label="Category" required><select name="categoryId" value={form.categoryId} onChange={update} required><option value="">Select a category</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.title}</option>)}</select></AdminField>
        <div className="admin-generated-reference"><span>Gem ID</span><strong>{stone?.stoneId || 'Assigned automatically when saved'}</strong><small>Permanent reference · managed by the system</small></div>{input('origin', 'Origin', { placeholder: 'e.g. Sri Lanka' })}
        <AdminField label="Description" className="admin-span-full"><textarea name="description" rows={3} value={form.description} onChange={update} placeholder="Describe the character and details of this gemstone." /></AdminField>
      </FormSection>
      <FormSection icon="layers" title="Specifications & availability">
        {input('weight', 'Weight per piece (ct)', { placeholder: 'e.g. 2.75' })}{input('color', 'Color')}{input('shape', 'Shape')}{input('cut', 'Cut')}{input('quantity', 'Quantity', { type: 'number', min: 0, step: '1', required: true })}{input('price', 'Price per piece (Rs.)', { type: 'number', min: 0, step: 'any' })}
        <label className="admin-checkbox admin-span-full"><input name="includedInStock" type="checkbox" checked={form.includedInStock !== false} onChange={update} /><span><strong>Include in owned stock totals</strong><small>Clear for reference or consignment pieces. This does not change website visibility.</small></span></label>
      </FormSection>
      <FormSection icon="image" title="Photos & videos" description="Build a clear view of the stone. Choose a cover photo and add optional videos to show its movement in the light.">
        <GemMediaEditor form={form} setForm={setForm} onBusyChange={(value) => uploadBusy('gallery', value)} disabled={busy} />
      </FormSection>
      <FormSection icon="shield" title="Certification">
        <label className="admin-checkbox admin-span-full"><input name="hasCertificate" type="checkbox" checked={Boolean(form.hasCertificate)} onChange={update} /><span><strong>Has certificate</strong><small>Display the certificate information with this gemstone.</small></span></label>
        <AdminImageField label="Certificate image" name="certificateImage" value={form.certificateImage} onChange={(value) => setForm((current) => ({ ...current, certificateImage: value }))} onBusyChange={(value) => uploadBusy('certificate', value)} disabled={busy} className="admin-span-full" hint="Drop the certificate photograph here, choose a file or paste its image URL." />
        <AdminField label="Certificate details" className="admin-span-full"><textarea name="certificateDetails" rows={2} value={form.certificateDetails} onChange={update} /></AdminField>
      </FormSection>
      <FormSection icon="eye" title="Website presentation">
        <label className="admin-checkbox"><input name="isFeatured" type="checkbox" checked={Boolean(form.isFeatured)} onChange={update} /><span><strong>Featured gemstone</strong><small>Include this piece in the featured selection.</small></span></label>
        <label className="admin-checkbox"><input name="isTopGem" type="checkbox" checked={Boolean(form.isTopGem)} onChange={update} /><span><strong>Homepage top gem</strong><small>Include this piece in the homepage selection.</small></span></label>
        {input('homePagePosition', 'Homepage position', { type: 'number', step: '1', hint: 'Keep your existing display order; 0 is supported.' })}
      </FormSection>
    </fieldset>
    <footer className="admin-form-actions"><button type="button" className="admin-button" onClick={onClose} disabled={busy}>Cancel</button><button type="submit" className="admin-button is-primary" disabled={busy}>{busy ? <span className="admin-spinner" /> : <AdminIcon name="check" />}{saving ? 'Saving gemstone...' : editing ? 'Save changes' : 'Create gemstone'}</button></footer>
  </form></AdminModal>;
}

function OverviewStockEditor({ stone, onClose, onSaved }) {
  const [busy, setBusy] = useState(false);
  return <AdminModal title={stone ? 'Edit private stock gemstone' : 'Add private stock gemstone'} description="Update private stock without leaving your overview. This does not publish a gemstone to the website." onClose={onClose} busy={busy}>
    <div className="admin-overview-stock-editor"><AdminOperations editorOnly initialSection="stock" initialStockStone={stone} onEditorBusyChange={setBusy} onEditorCancel={onClose} onEditorSaved={() => onSaved(stone ? 'Private stock changes saved.' : 'Private stock gemstone created.')} /></div>
  </AdminModal>;
}

function InventoryTable({ stones, categories, onEdit, onDelete, deleting }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState('default');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersId = useId();
  const advancedCount = Object.entries(filters).filter(([key, value]) => !['search', 'categoryId'].includes(key) && value !== '').length;
  const names = useMemo(() => new Map(categories.map((category) => [category._id, category.title])), [categories]);
  const filtered = useMemo(() => {
    const result = stones.filter((stone) => {
      const weight = Number.parseFloat(stone.weight); const price = stone.price == null || stone.price === '' ? NaN : Number(stone.price);
      return `${stone.title || ''} ${stone.stoneId || ''}`.toLowerCase().includes(filters.search.trim().toLowerCase()) && (!filters.categoryId || categoryId(stone) === filters.categoryId) && (!filters.color || String(stone.color || '').toLowerCase().includes(filters.color.toLowerCase())) && (!filters.shape || String(stone.shape || '').toLowerCase().includes(filters.shape.toLowerCase())) && (!filters.certificate || Boolean(stone.hasCertificate) === (filters.certificate === 'yes')) && (filters.minWeight === '' || weight >= Number(filters.minWeight)) && (filters.maxWeight === '' || weight <= Number(filters.maxWeight)) && (filters.minPrice === '' || price >= Number(filters.minPrice)) && (filters.maxPrice === '' || price <= Number(filters.maxPrice));
    });
    if (sort === 'name') result.sort((a, b) => String(a.title).localeCompare(String(b.title)));
    if (sort === 'weight') result.sort((a, b) => (Number.parseFloat(b.weight) || 0) - (Number.parseFloat(a.weight) || 0));
    if (sort === 'quantity') result.sort((a, b) => number(b.quantity) - number(a.quantity));
    return result;
  }, [stones, filters, sort]);
  const update = (name, value) => { setFilters((current) => ({ ...current, [name]: value })); setPage(1); };
  const active = Object.values(filters).some((value) => value !== '');
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * 20, currentPage * 20);
  return <>
    <div className="admin-toolbar"><div className="admin-search"><AdminIcon name="search" /><input aria-label="Search gemstones" placeholder="Search gem name or ID..." value={filters.search} onChange={(event) => update('search', event.target.value)} /></div><div className="admin-inventory-toolbar-end"><select aria-label="Filter by category" value={filters.categoryId} onChange={(event) => update('categoryId', event.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category._id} value={category._id}>{category.title}</option>)}</select><select aria-label="Sort gemstones" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="default">Default order</option><option value="name">Gem name: A to Z</option><option value="weight">Weight: high to low</option><option value="quantity">Quantity: high to low</option></select></div></div>
    <button type="button" className="admin-button admin-inventory-filter-toggle" aria-expanded={filtersOpen} aria-controls={filtersId} onClick={() => setFiltersOpen((open) => !open)}><AdminIcon name="filter" />{filtersOpen ? 'Hide filters' : 'More filters'}{advancedCount > 0 && <span className="admin-badge">{advancedCount} active</span>}</button>
    <div id={filtersId} className={`admin-filter-grid admin-inventory-advanced${filtersOpen ? ' is-open' : ''}`}>
      <AdminField label="Color"><input value={filters.color} placeholder="Any color" onChange={(event) => update('color', event.target.value)} /></AdminField>
      <AdminField label="Shape"><input value={filters.shape} placeholder="Any shape" onChange={(event) => update('shape', event.target.value)} /></AdminField>
      <AdminField label="Certificate"><select value={filters.certificate} onChange={(event) => update('certificate', event.target.value)}><option value="">Any certificate status</option><option value="yes">With certificate</option><option value="no">Without certificate</option></select></AdminField>
      {[['minWeight', 'Minimum weight', 'Min weight'], ['maxWeight', 'Maximum weight', 'Max weight'], ['minPrice', 'Minimum price', 'Min price'], ['maxPrice', 'Maximum price', 'Max price']].map(([name, label, placeholder]) => <AdminField key={name} label={label}><input type="number" step="any" value={filters[name]} placeholder={placeholder} onChange={(event) => update(name, event.target.value)} /></AdminField>)}
    </div>
    <div className="admin-filter-actions"><p><strong>{filtered.length}</strong> {filtered.length === 1 ? 'gemstone' : 'gemstones'}{active ? ` matching your filters · ${stones.length} total` : ' in your collection'}</p><button type="button" className="admin-button is-small" onClick={() => { setFilters(EMPTY_FILTERS); setPage(1); }} disabled={!active}>Clear filters<AdminIcon name="close" size={13} /></button></div>
    {visible.length > 0 && <div className="admin-inventory-cards" aria-label="Gem inventory cards">{visible.map((stone) => <article className="admin-inventory-card" key={stone._id}>
      <div className="admin-product-cell"><AdminImage src={stone.image} alt="" /><div><h2>{stone.title}</h2><small>{names.get(categoryId(stone)) || 'Uncategorized'}</small></div></div>
      <p className="admin-table-id">Gem ID: {stone.stoneId || 'Not recorded'}</p>
      <dl><div><dt>Weight per piece</dt><dd>{gemWeightLabel(stone.weight)}</dd></div><div><dt>Quantity</dt><dd>{number(stone.quantity)} {number(stone.quantity) === 1 ? 'piece' : 'pieces'}</dd></div><div><dt>Price per piece (Rs.)</dt><dd>{stone.price !== '' && stone.price != null ? number(stone.price).toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}</dd></div><div><dt>Shape</dt><dd>{stone.shape || '—'}</dd></div></dl>
      <div className="admin-presentation-badges">{stone.hasCertificate && <span className="admin-badge">Certified</span>}{stone.isFeatured && <span className="admin-badge is-warning">Featured</span>}{stone.isTopGem && <span className="admin-badge">Homepage</span>}</div>
      <div className="admin-inventory-card-actions"><button type="button" className="admin-button" onClick={() => onEdit(stone)} aria-label={`Edit ${stone.title}`}><AdminIcon name="edit" size={16} />Edit gemstone</button><button type="button" className="admin-button is-danger" onClick={() => onDelete(stone)} disabled={Boolean(deleting)} aria-label={`Delete ${stone.title}`}>{deleting === stone._id ? <span className="admin-spinner" /> : <AdminIcon name="trash" size={16} />}Delete</button></div>
    </article>)}</div>}
    <section className={`admin-panel admin-inventory-table-panel${visible.length ? ' has-records' : ''}`}>
      {visible.length ? <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Gem inventory table"><table className="admin-table" style={{ minWidth: 850 }}><thead><tr><th scope="col">Gemstone</th><th scope="col">Gem ID</th><th scope="col">Weight</th><th scope="col">Quantity</th><th scope="col">Price</th><th scope="col">Presentation</th><th scope="col">Actions</th></tr></thead><tbody>{visible.map((stone) => <tr key={stone._id}><td><div className="admin-product-cell"><AdminImage src={stone.image} alt="" /><div><strong>{stone.title}</strong><small>{names.get(categoryId(stone)) || 'Uncategorized'}{stone.shape ? ` / ${stone.shape}` : ''}</small></div></div></td><td><span className="admin-table-id">{stone.stoneId || '—'}</span></td><td>{gemWeightLabel(stone.weight)}</td><td><span className={`admin-badge ${number(stone.quantity) > 0 ? 'is-success' : ''}`}>{number(stone.quantity)} {number(stone.quantity) === 1 ? 'piece' : 'pieces'}</span></td><td>{stone.price !== '' && stone.price != null ? number(stone.price).toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}</td><td><div className="admin-presentation-badges">{stone.hasCertificate && <span className="admin-badge"><AdminIcon name="shield" />Certified</span>}{stone.isFeatured && <span className="admin-badge is-warning">Featured</span>}{stone.isTopGem && <span className="admin-badge">Homepage</span>}{!stone.hasCertificate && !stone.isFeatured && !stone.isTopGem && <span className="admin-table-id">Standard</span>}</div></td><td><div className="admin-table-actions"><button type="button" className="admin-icon-button" onClick={() => onEdit(stone)} aria-label={`Edit ${stone.title}`} title="Edit gemstone"><AdminIcon name="edit" /></button><button type="button" className="admin-icon-button is-danger" onClick={() => onDelete(stone)} disabled={Boolean(deleting)} aria-label={`Delete ${stone.title}`} title="Delete gemstone">{deleting === stone._id ? <span className="admin-spinner" /> : <AdminIcon name="trash" />}</button></div></td></tr>)}</tbody></table></div> : <AdminEmptyState icon="gem" title={active ? 'No gemstones match these filters' : 'Your collection starts here'} description={active ? 'Try a different search or clear the filters to see your collection.' : 'Add your first gemstone with its details, images and availability.'} action={active ? <button type="button" className="admin-button" onClick={() => { setFilters(EMPTY_FILTERS); setPage(1); }}>Reset search</button> : undefined} />}
      <footer className="admin-pagination"><span>{filtered.length ? `${(currentPage - 1) * 20 + 1}–${Math.min(currentPage * 20, filtered.length)} of ${filtered.length} gemstones` : '0 gemstones'}</span><div><button type="button" className="admin-icon-button" aria-label="Previous inventory page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><AdminIcon name="chevron-left" /></button><span>Page {currentPage} of {pages}</span><button type="button" className="admin-icon-button" aria-label="Next inventory page" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}><AdminIcon name="chevron-right" /></button></div></footer>
    </section>
  </>;
}

export default function AdminInventory() {
  const accessLocked = useContext(AdminAccessLockContext);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const current = VIEWS.find((view) => view.id === params.get('view')) || VIEWS[0];
  const [analytics, setAnalytics] = useState(null);
  const [stones, setStones] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stockStones, setStockStones] = useState([]);
  const [stockCategories, setStockCategories] = useState([]);
  const [stockModal, setStockModal] = useState(null);
  const operationsSection = ['catalog', 'stock', 'ads', 'legacy'].includes(params.get('section')) ? params.get('section') : 'catalog';
  const [feedback, setFeedback] = useState([]);
  const [workshop, setWorkshop] = useState([]);
  const [settings, setSettings] = useState({ home: {}, contact: {} });
  const [dirtyPages, setDirtyPages] = useState({});
  const [failures, setFailures] = useState({});
  const [ready, setReady] = useState({});
  const [pendingResources, setPendingResources] = useState({ analytics: true, inventory: true, categories: true, contact: true, home: true, feedback: true, workshop: true });
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState(null);
  const [modal, setModal] = useState(null);
  const [bulkSoldOpen, setBulkSoldOpen] = useState(false);
  const [deleting, setDeleting] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebar = useRef(null);
  const mobileToggle = useRef(null);
  const activeLoad = useRef(null);
  const loadVersion = useRef(0);
  const versions = useRef({});
  const deleteGuard = useRef(false);
  const settingsDirty = useRef({});
  const mounted = useRef(true);
  const loadAll = useCallback(async function loadWorkspace() {
    if (!mounted.current) return;
    activeLoad.current?.abort();
    const controller = new AbortController();
    activeLoad.current = controller;
    const generation = ++loadVersion.current;
    setRefreshing(true);
    const snapshot = { ...versions.current };
    const keys = ['analytics', 'inventory', 'categories', 'contact', 'home', 'feedback', 'workshop', 'stockStones', 'stockCategories'];
    const paths = ['/api/analytics/dashboard-stats', '', '/api/inventory/categories', '/api/contact', '/api/home', '/api/feedback', '/api/workshop/admin', '', '/api/stock/categories'];
    setPendingResources((previous) => ({ ...previous, ...Object.fromEntries(keys.map((key) => [key, true])) }));
    setFailures((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => !keys.includes(key))));
    const current = () => mounted.current && generation === loadVersion.current && !controller.signal.aborted;
    await Promise.allSettled(keys.map(async (key, index) => {
      try {
        const data = key === 'inventory' ? await fetchAllGemstones({ signal: controller.signal }) : key === 'stockStones' ? await fetchAllRecords('/stock/stones', { signal: controller.signal }) : await request(paths[index], { signal: controller.signal });
        if (!current() || snapshot[key] !== versions.current[key]) return;
        if (key === 'inventory') setStones(array(data));
        else if (key === 'categories') setCategories(array(data));
        else if (key === 'stockStones') setStockStones(array(data));
        else if (key === 'stockCategories') setStockCategories(array(data));
        else if (key === 'analytics') setAnalytics(data);
        else if (key === 'feedback') setFeedback(array(data));
        else if (key === 'workshop') setWorkshop(array(data));
        else if (!settingsDirty.current[key]) setSettings((previous) => ({ ...previous, [key]: data || {} }));
        setReady((previous) => ({ ...previous, [key]: true }));
      } catch (error) {
        if (current()) setFailures((previous) => ({ ...previous, [key]: error.message }));
      } finally {
        if (current()) setPendingResources((previous) => ({ ...previous, [key]: false }));
      }
    }));
    if (current()) { setRefreshing(false); activeLoad.current = null; }
  }, []);
  useEffect(() => { mounted.current = true; const timer = window.setTimeout(loadAll, 0); return () => { mounted.current = false; loadVersion.current += 1; activeLoad.current?.abort(); window.clearTimeout(timer); }; }, [loadAll]);
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sidebar.current?.querySelector('[aria-current="page"]')?.focus();
    const keydown = (event) => {
      if (event.key === 'Escape') { setMobileOpen(false); return; }
      if (event.key === 'Tab') { const items = [...sidebar.current.querySelectorAll('button:not(:disabled),a[href]')].filter((item) => item.getClientRects().length); const first = items[0]; const last = items.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } }
    };
    const resize = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
    document.addEventListener('keydown', keydown); window.addEventListener('resize', resize);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); window.removeEventListener('resize', resize); previous?.focus(); };
  }, [mobileOpen]);
  const go = (view, section) => { setParams((previous) => { const next = new URLSearchParams(previous); next.set('view', view); next.delete('topic'); next.delete('section'); if (typeof section === 'string') next.set('section', section); return next; }); setMobileOpen(false); window.scrollTo({ top: 0, behavior: 'instant' }); };
  const refresh = () => { loadAll(); window.dispatchEvent(new Event('admin-refresh')); };
  const signOut = () => { clearAdminSession(); navigate(ADMIN_LOGIN_PATH, { replace: true }); };
  const success = (message) => setNotice({ type: 'success', message });
  const invalidate = (...keys) => { keys.forEach((key) => { versions.current[key] = (versions.current[key] || 0) + 1; }); };
  const saved = (message) => { invalidate('inventory', 'analytics'); setModal(null); success(message); loadAll(); };
  const stockSaved = (message) => { invalidate('stockStones'); setStockModal(null); success(message); loadAll(); };
  const deleteFromOverview = async (stone, source) => {
    if (deleteGuard.current || !window.confirm(`Permanently delete ${stone.title} (${stone.stoneId || stone._id}) from ${source === 'stock' ? 'private stock' : 'the website collection'}? This cannot be undone. To remove a sold gem with Undo instead, use Remove sold gems.`)) return false;
    deleteGuard.current = true;
    try {
      await request(`/api/${source === 'stock' ? 'stock' : 'inventory'}/stones/${encodeURIComponent(stone._id)}`, { method: 'DELETE' });
      invalidate(source === 'stock' ? 'stockStones' : 'inventory', 'analytics');
      if (source === 'stock') setStockStones((items) => items.filter((item) => item._id !== stone._id));
      else setStones((items) => items.filter((item) => item._id !== stone._id));
      success('Gemstone permanently deleted.'); loadAll();
      return true;
    } finally { deleteGuard.current = false; }
  };
  const removeStone = async (stone) => {
    if (deleteGuard.current || !window.confirm(`Delete ${stone.title}? This cannot be undone.`)) return;
    deleteGuard.current = true; setDeleting(stone._id);
    try { await request(`/api/inventory/stones/${stone._id}`, { method: 'DELETE' }); invalidate('inventory', 'analytics'); setStones((items) => items.filter((item) => item._id !== stone._id)); success('Gemstone deleted.'); loadAll(); }
    catch (error) { setNotice({ type: 'error', message: error.message }); }
    finally { deleteGuard.current = false; setDeleting(''); }
  };
  const updateSettings = (type, field, value) => { invalidate(type); settingsDirty.current = { ...settingsDirty.current, [type]: true }; setDirtyPages(settingsDirty.current); setSettings((previous) => ({ ...previous, [type]: { ...previous[type], [field]: value } })); };
  const saveSettings = async (type) => {
    if (!ready[type]) throw new Error('These settings could not be loaded. Refresh the data before saving.');
    const saveVersion = versions.current[type];
    await request(`/api/${type}`, { method: 'PUT', body: JSON.stringify(editableSettings(type, settings[type])) });
    const unchanged = saveVersion === versions.current[type];
    invalidate(type);
    if (unchanged) { settingsDirty.current = { ...settingsDirty.current, [type]: false }; setDirtyPages(settingsDirty.current); }
  };
  const approveReview = async (id) => { await request(`/api/feedback/${id}/approve`, { method: 'PUT' }); invalidate('feedback'); setFeedback((items) => items.map((item) => item._id === id ? { ...item, isApproved: true } : item)); };
  const deleteReview = async (id) => { await request(`/api/feedback/${id}`, { method: 'DELETE' }); invalidate('feedback'); setFeedback((items) => items.filter((item) => item._id !== id)); };
  const saveWorkshop = async (post) => { const data = await request(post._id ? `/api/workshop/${post._id}` : '/api/workshop', { method: post._id ? 'PUT' : 'POST', body: JSON.stringify(post) }); invalidate('workshop'); const item = data.post || data; if (item._id) setWorkshop((items) => post._id ? items.map((old) => old._id === post._id ? item : old) : [item, ...items]); else loadAll(); };
  const deleteWorkshop = async (id) => { await request(`/api/workshop/${id}`, { method: 'DELETE' }); invalidate('workshop'); setWorkshop((items) => items.filter((item) => item._id !== id)); };
  const pending = feedback.filter((review) => !review.approved && !review.isApproved).length;
  const resources = ['settings', 'guide'].includes(current.id) ? [] : ['inventory', 'analytics'].includes(current.id) ? ['inventory', 'categories'] : [current.id];
  const loading = resources.some((key) => pendingResources[key] && !ready[key]);
  const blockedKey = resources.find((key) => failures[key] && !ready[key]);
  const blocked = blockedKey ? failures[blockedKey] : '';
  const refreshIssue = !blocked && resources.find((key) => failures[key]);

  return <div className="admin-app">
    {mobileOpen && <button type="button" className="admin-mobile-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close navigation" tabIndex={-1} />}
    <aside ref={sidebar} id="admin-sidebar" className={`admin-sidebar ${mobileOpen ? 'is-open' : ''}`} aria-label="Administration sidebar"><Link to={ADMIN_PORTAL_PATH} onClick={() => setMobileOpen(false)} className="admin-brand" aria-label="Pinnawala Gems admin overview"><span className="admin-brand-icon"><AdminIcon name="gem" size={25} /></span><span><strong>Pinnawala Gems</strong><small>ADMIN WORKSPACE</small></span></Link><nav aria-label="Admin navigation">{VIEWS.map((view) => <div key={view.id}>{view.group && <p className="admin-nav-section">{view.group}</p>}<button type="button" className="admin-nav-button" aria-label={view.label} aria-current={current.id === view.id ? 'page' : undefined} onClick={() => go(view.id)}><AdminIcon name={view.icon} /><span>{view.label}</span>{view.id === 'feedback' && pending > 0 && <span className="admin-nav-count" aria-label={`${pending} pending reviews`}>{pending}</span>}</button></div>)}</nav><div className="admin-sidebar-bottom"><Link to="/" target="_blank" rel="noreferrer" className="admin-sidebar-site"><AdminIcon name="external" size={17} />View website<AdminIcon name="arrow" /></Link><div className="admin-sidebar-account"><span className="admin-avatar">A</span><div><strong>Administrator</strong><small>Management access</small></div><button type="button" onClick={signOut} aria-label="Sign out" title="Sign out"><AdminIcon name="logout" size={17} /></button></div></div></aside>
    <main id={accessLocked ? undefined : "main-content"} tabIndex={-1} className="admin-main"><header className="admin-topbar"><div className="admin-topbar-leading"><button ref={mobileToggle} type="button" className="admin-icon-button admin-mobile-toggle" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen} aria-controls="admin-sidebar" onClick={() => setMobileOpen((open) => !open)}><AdminIcon name="menu" /></button><div className="admin-breadcrumb"><span>Workspace</span><AdminIcon name="chevron-right" /><strong>{current.label}</strong></div></div><div className="admin-topbar-actions"><span className="admin-workspace-badge"><AdminIcon name="shield" />Private workspace</span><span className="admin-topbar-divider" /><button type="button" className="admin-button is-small" onClick={refresh} disabled={refreshing} aria-label="Refresh data"><AdminIcon name="refresh" className={refreshing ? 'admin-is-spinning' : ''} />Refresh<span className="admin-desktop-label"> data</span></button><span className="admin-avatar" aria-label="Administrator">A</span></div></header>
      <div className="admin-content"><div className="admin-page-heading"><div><p className="admin-eyebrow">PINNAWALA GEMS / ADMINISTRATION</p><h1>{current.label}</h1><p>{current.description}</p></div>{current.id === 'inventory' && <div className="admin-heading-actions"><button type="button" className="admin-button" onClick={() => setBulkSoldOpen(true)} disabled={loading || Boolean(failures.inventory)}><AdminIcon name="archive" />Remove sold gems</button><button type="button" className="admin-button" onClick={() => go('operations')}><AdminIcon name="image" />Category banners</button><button type="button" className="admin-button is-primary" onClick={() => setModal({ stone: null })} disabled={loading || Boolean(failures.categories || failures.inventory)}><AdminIcon name="plus" />Add gemstone</button></div>}</div>
        <Notice value={notice} onDismiss={() => setNotice(null)} />
        {refreshIssue && <Notice value={{ type: 'error', message: `Unable to refresh this section. Your current data and edits are still shown. ${failures[refreshIssue]}` }} />}
        {loading && !['operations', 'planner'].includes(current.id) ? <div className="admin-panel admin-loading" role="status"><span className="admin-spinner" />Loading your workspace...</div> : blocked ? <section className="admin-panel"><AdminEmptyState icon="refresh" title="This section could not be loaded" description={blocked} action={<button type="button" className="admin-button" disabled={refreshing} onClick={refresh}>Try again</button>} /></section> : <>
          {current.id === 'analytics' && <Suspense fallback={<div className="admin-panel admin-loading" role="status"><span className="admin-spinner" />Loading your workspace...</div>}>
            <AdminDashboard analytics={analytics || summarise(stones, categories)} stones={stones} categories={categories}
              stockStones={stockStones} stockCategories={stockCategories}
              stockLoading={Boolean(pendingResources.stockStones || pendingResources.stockCategories)}
              stockError={failures.stockStones || failures.stockCategories || ''} onRetryStock={refresh}
              onEditStone={(record, source) => { if (source === 'stock') setStockModal({ stone: record }); else setModal({ stone: record }); }}
              onDeleteStone={deleteFromOverview} onCreateStone={(source) => { if (source === 'stock') setStockModal({ stone: null }); else setModal({ stone: null }); }}
              pendingReviews={pending} categoriesCount={categories.length}
              onNavigate={(view) => go(view, view === 'operations' ? 'stock' : undefined)} />
          </Suspense>}
          {current.id === 'inventory' && <InventoryTable stones={stones} categories={categories} onEdit={(stone) => setModal({ stone })} onDelete={removeStone} deleting={deleting} />}
          {current.id === 'operations' && <AdminOperations initialSection={operationsSection} onDataChanged={loadAll} />}
          {current.id === 'planner' && <AdminPlanner initialView={params.get('section')} />}
          {current.id === 'settings' && <WebsiteSettings initialPage={params.get('section')} settings={settings} dirtyPages={dirtyPages} onChange={updateSettings} onSave={saveSettings} loadingPages={pendingResources} readyPages={ready} failedPages={failures} onRetry={refresh} />}
          {current.id === 'feedback' && <FeedbackPanel feedback={feedback} onApprove={approveReview} onDelete={deleteReview} />}
          {current.id === 'workshop' && <WorkshopPanel workshop={workshop} onSave={saveWorkshop} onDelete={deleteWorkshop} />}
          {current.id === 'guide' && <Suspense fallback={<div className="admin-panel admin-loading" role="status"><span className="admin-spinner" />Opening the workspace guide...</div>}><AdminGuide /></Suspense>}
        </>}
        <footer className="admin-workspace-footer"><span>Pinnawala Gems</span><span>Collection & website management</span></footer>
      </div>
    </main>
    {modal && <GemEditor stone={modal.stone} categories={categories} onClose={() => setModal(null)} onSaved={saved} />}
    {stockModal && <OverviewStockEditor stone={stockModal.stone} onClose={() => setStockModal(null)} onSaved={stockSaved} />}
    {bulkSoldOpen && <BulkSoldGems scope="catalog" onClose={() => setBulkSoldOpen(false)} onCompleted={loadAll} />}
  </div>;
}
