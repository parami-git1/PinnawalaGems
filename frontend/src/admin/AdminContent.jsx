import { useRef, useState } from 'react';
import { AdminEmptyState, AdminField, AdminIcon, AdminImage } from './AdminUI';
import './AdminContent.css';

const EMPTY_WORKSHOP = { title: '', description: '', imageUrl: '' };
const dateLabel = (value) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Colombo' }).format(new Date(value));
};

function ContentStatus({ value, onDismiss }) {
  if (!value) return null;
  return <div className={`admin-status ${value.type === 'error' ? 'is-error' : ''}`} role={value.type === 'error' ? 'alert' : 'status'}><AdminIcon name={value.type === 'error' ? 'bell' : 'check'} /><p>{value.message}</p><button type="button" onClick={onDismiss} aria-label="Dismiss message"><AdminIcon name="close" /></button></div>;
}

export { default as WebsiteSettings } from './WebsiteSettings';

export function FeedbackPanel({ feedback, onApprove, onDelete, loading = false }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState('');
  const [status, setStatus] = useState(null);
  const action = useRef(false);
  const items = Array.isArray(feedback) ? feedback : [];
  const pending = items.filter((item) => !item.isApproved).length;
  const visible = items.filter((item) => (filter === 'all' || Boolean(item.isApproved) === (filter === 'approved')) && `${item.name || ''} ${item.review || ''}`.toLowerCase().includes(search.toLowerCase()));
  const run = async (item, type) => {
    if (action.current || loading) return;
    if (type === 'delete' && !window.confirm(`Delete the review from ${item.name || 'this customer'}? This cannot be undone.`)) return;
    action.current = true; setBusy(`${type}-${item._id}`); setStatus(null);
    try { await (type === 'approve' ? onApprove(item._id) : onDelete(item._id)); setStatus({ type: 'success', message: type === 'approve' ? 'Review approved for the public website.' : 'Review deleted.' }); }
    catch (error) { setStatus({ type: 'error', message: error.message || `The review could not be ${type === 'approve' ? 'approved' : 'deleted'}. Please try again.` }); }
    finally { action.current = false; setBusy(''); }
  };
  return <div className="admin-content-module"><ContentStatus value={status} onDismiss={() => setStatus(null)} /><div className="admin-toolbar"><div className="admin-subnav admin-content-review-tabs" aria-label="Review status">{[['all', 'All reviews', items.length], ['pending', 'Pending', pending], ['approved', 'Approved', items.length - pending]].map(([id, label, count]) => <button type="button" key={id} className={filter === id ? 'is-active' : ''} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}<span className="admin-content-count">{count}</span></button>)}</div><div className="admin-search"><AdminIcon name="search" /><input aria-label="Search reviews" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer or review…" /></div></div>{loading && !items.length ? <div className="admin-panel admin-loading" role="status"><span className="admin-spinner" />Loading reviews…</div> : visible.length ? <div className="admin-review-list" aria-busy={Boolean(busy)}>{visible.map((item) => { const rating = Math.min(5, Math.max(0, Number(item.rating) || 0)); const date = dateLabel(item.createdAt); return <article className="admin-panel admin-review-card" key={item._id}><header className="admin-review-header"><div className="admin-review-person"><span className="admin-avatar" aria-hidden="true">{String(item.name || 'C').trim().slice(0, 1).toUpperCase()}</span><div><strong>{item.name || 'Customer'}</strong>{date && <small>{date}</small>}</div></div><span className={`admin-badge ${item.isApproved ? 'is-success' : 'is-warning'}`}>{item.isApproved ? 'Approved' : 'Pending approval'}</span></header><div className="admin-review-stars" aria-label={`${rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map((star) => <AdminIcon name="star" key={star} fill={star <= rating ? 'currentColor' : 'none'} className={star > rating ? 'is-empty' : ''} />)}</div><blockquote>{item.review}</blockquote><footer className="admin-review-footer">{!item.isApproved && <span className="admin-content-review-visibility">Awaiting approval for the public website</span>}{!item.isApproved && <button type="button" className="admin-button is-primary is-small" disabled={Boolean(busy) || loading} onClick={() => run(item, 'approve')}><AdminIcon name="check" />{busy === `approve-${item._id}` ? 'Approving…' : 'Approve review'}</button>}<button type="button" className="admin-button is-danger is-small" disabled={Boolean(busy) || loading} onClick={() => run(item, 'delete')}><AdminIcon name="trash" />{busy === `delete-${item._id}` ? 'Deleting…' : 'Delete'}</button></footer></article>; })}</div> : <div className="admin-panel"><AdminEmptyState icon="star" title={search || filter !== 'all' ? 'No matching reviews' : 'No reviews yet'} description={search || filter !== 'all' ? 'Try another search or choose a different status.' : 'Customer reviews will appear here for you to review and approve.'} action={(search || filter !== 'all') ? <button type="button" className="admin-button" onClick={() => { setSearch(''); setFilter('all'); }}>Clear filters</button> : undefined} /></div>}</div>;
}

export function WorkshopPanel({ workshop, onSave, onDelete, loading = false }) {
  const [form, setForm] = useState({ ...EMPTY_WORKSHOP });
  const [busy, setBusy] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(null);
  const action = useRef(false);
  const editor = useRef(null);
  const title = useRef(null);
  const isEditing = Boolean(form._id);
  const items = Array.isArray(workshop) ? workshop : [];
  const visible = items.filter((item) => `${item.title || ''} ${item.description || ''}`.toLowerCase().includes(search.toLowerCase()));
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const edit = (item) => { setForm({ ...EMPTY_WORKSHOP, ...item }); setStatus(null); editor.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); title.current?.focus({ preventScroll: true }); };
  const save = async (event) => {
    event.preventDefault();
    if (action.current || loading) return;
    if (!form.title.trim() || !form.description.trim() || !form.imageUrl.trim()) { setStatus({ type: 'error', message: 'Add a title, description and image URL before publishing.' }); return; }
    action.current = true; setBusy('save'); setStatus(null);
    try { await onSave({ ...form }); setForm({ ...EMPTY_WORKSHOP }); setStatus({ type: 'success', message: isEditing ? 'Workshop post updated.' : 'Workshop post published.' }); }
    catch (error) { setStatus({ type: 'error', message: error.message || 'The post could not be saved. Your draft is still here.' }); }
    finally { action.current = false; setBusy(''); }
  };
  const remove = async (item) => {
    if (action.current || loading || !window.confirm(`Delete “${item.title || 'this workshop post'}”? This cannot be undone.`)) return;
    action.current = true; setBusy(`delete-${item._id}`); setStatus(null);
    try { await onDelete(item._id); if (form._id === item._id) setForm({ ...EMPTY_WORKSHOP }); setStatus({ type: 'success', message: 'Workshop post deleted.' }); }
    catch (error) { setStatus({ type: 'error', message: error.message || 'The post could not be deleted. Please try again.' }); }
    finally { action.current = false; setBusy(''); }
  };
  return <div className="admin-content-module"><ContentStatus value={status} onDismiss={() => setStatus(null)} /><div className="admin-editor-layout"><form className="admin-panel admin-content-workshop-editor" ref={editor} onSubmit={save} aria-label={isEditing ? 'Edit workshop post' : 'New workshop post'} aria-busy={Boolean(busy)}><header className="admin-panel-header"><div><h2>{isEditing ? 'Edit workshop post' : 'New workshop post'}</h2><p>{isEditing ? 'Update the details of this workshop post.' : 'Share a workshop image and story on your website.'}</p></div><AdminIcon name="image" /></header><fieldset className="admin-panel-body admin-content-fieldset admin-content-workshop-fields" disabled={Boolean(busy) || loading}><AdminField label="Post title" required><input name="title" ref={title} value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Give your post a clear title" /></AdminField><AdminField label="Image URL" required hint="Use the image address for this workshop post."><input name="imageUrl" value={form.imageUrl} inputMode="url" onChange={(event) => update('imageUrl', event.target.value)} placeholder="https://…" /></AdminField>{form.imageUrl && <div className="admin-content-workshop-preview"><AdminImage src={form.imageUrl} alt="Workshop image preview" /></div>}<AdminField label="Description" required><textarea name="description" value={form.description} rows={5} onChange={(event) => update('description', event.target.value)} placeholder="Describe the workshop and the work behind it." /></AdminField><div className="admin-form-actions">{isEditing && <button type="button" className="admin-button" onClick={() => { setForm({ ...EMPTY_WORKSHOP }); setStatus(null); }}>Cancel edit</button>}<button className="admin-button is-primary">{busy === 'save' ? <span className="admin-spinner" /> : <AdminIcon name="check" />}{busy === 'save' ? 'Saving…' : isEditing ? 'Update post' : 'Publish post'}</button></div></fieldset></form><section className="admin-content-workshop-records"><div className="admin-toolbar"><div className="admin-content-records-heading"><h2>Workshop posts <span className="admin-content-count">{items.length}</span></h2><p>Manage the posts shown on your workshop page.</p></div><div className="admin-search"><AdminIcon name="search" /><input aria-label="Search workshop posts" placeholder="Search posts…" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>{loading && !items.length ? <div className="admin-panel admin-loading" role="status"><span className="admin-spinner" />Loading posts…</div> : visible.length ? <div className="admin-workshop-list">{visible.map((item) => <article className={`admin-panel admin-workshop-card ${form._id === item._id ? 'is-editing' : ''}`} key={item._id}><AdminImage src={item.imageUrl} alt="" /><div><h3>{item.title}</h3><p>{item.description}</p><div className="admin-table-actions"><button type="button" className="admin-button is-small" disabled={Boolean(busy) || loading} onClick={() => edit(item)}><AdminIcon name="edit" />Edit post</button><button type="button" className="admin-button is-danger is-small" disabled={Boolean(busy) || loading} onClick={() => remove(item)}><AdminIcon name="trash" />{busy === `delete-${item._id}` ? 'Deleting…' : 'Delete'}</button>{form._id === item._id && <span className="admin-badge">Editing</span>}</div></div></article>)}</div> : <div className="admin-panel"><AdminEmptyState icon="image" title={search ? 'No matching posts' : 'No workshop posts yet'} description={search ? 'Try another title or description.' : 'Create your first post using the form alongside.'} action={search ? <button type="button" className="admin-button" onClick={() => setSearch('')}>Clear search</button> : undefined} /></div>}</section></div></div>;
}
