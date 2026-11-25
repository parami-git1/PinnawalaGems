import { useEffect, useRef, useState } from 'react';
import { AdminEmptyState, AdminField, AdminIcon, AdminImage } from './AdminUI';
import './AdminContent.css';
import AdminImageField from './AdminImageField';
import { isDateKey, normalizeWorkshopPhone, safeWorkshopLocationUrl, sriLankaInput, sriLankaInstant, workshopContactLinks, workshopDateTimeLabel, workshopEventLabel, workshopPublication } from '../workshopContent';

const EMPTY_WORKSHOP = { title: '', description: '', imageUrl: '', publicationStatus: 'published', publishAt: '', eventDate: '', eventTime: '', locationName: '', locationAddress: '', locationUrl: '', phoneNumber: '', whatsappNumber: '' };
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
  const [uploading, setUploading] = useState(false);
  const [imageSession, setImageSession] = useState(0);
  const uploadBusy = useRef(false);
  const [search, setSearch] = useState('');
  const [publicationFilter, setPublicationFilter] = useState('all');
  const [expanded, setExpanded] = useState({ event: false, location: false, contacts: false });
  const [now, setNow] = useState(() => Date.now());
  const [status, setStatus] = useState(null);
  const action = useRef(false);
  const editor = useRef(null);
  const title = useRef(null);
  const originalPost = useRef(null);
  const isEditing = Boolean(form._id);
  const items = Array.isArray(workshop) ? workshop : [];
  const visible = items.filter((item) => (publicationFilter === 'all' || workshopPublication(item, now) === publicationFilter) && [item.title, item.description, item.locationName, item.locationAddress, item.phoneNumber, item.whatsappNumber].some((value) => String(value || '').toLowerCase().includes(search.trim().toLowerCase())));
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') setNow(Date.now()); };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const reset = () => { setForm({ ...EMPTY_WORKSHOP }); originalPost.current = null; setExpanded({ event: false, location: false, contacts: false }); setImageSession((current) => current + 1); };
  const edit = (item) => {
    originalPost.current = item;
    const editable = Object.fromEntries(Object.keys(EMPTY_WORKSHOP).map((field) => [field, item[field] ?? EMPTY_WORKSHOP[field]]));
    setForm({ ...editable, _id: item._id, publishAt: sriLankaInput(item.publishAt) });
    setExpanded({ event: Boolean(item.eventDate || item.eventTime), location: Boolean(item.locationName || item.locationAddress || item.locationUrl), contacts: Boolean(item.phoneNumber || item.whatsappNumber) });
    setImageSession((current) => current + 1); setStatus(null);
    editor.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); title.current?.focus({ preventScroll: true });
  };
  const invalid = (message, field, section) => {
    setStatus({ type: 'error', message });
    if (section) setExpanded((current) => ({ ...current, [section]: true }));
    window.requestAnimationFrame(() => editor.current?.querySelector(`[name="${field}"]`)?.focus());
  };
  const publicationAction = form.publicationStatus === 'scheduled' ? 'Schedule post' : form.publicationStatus === 'draft' ? 'Save draft' : isEditing ? 'Update post' : 'Publish post';
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (action.current || loading || uploadBusy.current) return;
    const submittedAt = new Date().getTime();
    if (!form.title.trim() || !form.description.trim() || !form.imageUrl.trim()) { setStatus({ type: 'error', message: 'Add a title, description and an image before publishing.' }); return; }
    const payload = Object.fromEntries(Object.keys(EMPTY_WORKSHOP).map((field) => [field, form[field]]));
    if (isEditing) payload._id = form._id;
    payload.publishAt = null;
    if (form.publicationStatus === 'scheduled') {
      const original = originalPost.current;
      const unchanged = original?.publicationStatus === 'scheduled' && form.publishAt === sriLankaInput(original.publishAt);
      payload.publishAt = unchanged ? original.publishAt : sriLankaInstant(form.publishAt);
      if (!payload.publishAt) { invalid('Choose a valid publication date and time in Sri Lanka time.', 'publishAt'); return; }
      if (new Date(payload.publishAt).getTime() <= submittedAt && !unchanged) { invalid('Choose a future publication time, or select Publish now.', 'publishAt'); return; }
    }
    if (form.eventDate && !isDateKey(form.eventDate)) { invalid('Choose a valid event date.', 'eventDate', 'event'); return; }
    if (form.eventTime && (!form.eventDate || !/^([01]\d|2[0-3]):[0-5]\d$/.test(form.eventTime))) { invalid('Add an event date before setting its time.', 'eventDate', 'event'); return; }
    if (form.locationUrl.trim() && !safeWorkshopLocationUrl(form.locationUrl)) { invalid('Use a full http(s) map URL without a username or password.', 'locationUrl', 'location'); return; }
    for (const field of ['phoneNumber', 'whatsappNumber']) {
      payload[field] = normalizeWorkshopPhone(form[field]);
      if (form[field].trim() && !payload[field]) { invalid(`Enter a valid ${field === 'phoneNumber' ? 'call' : 'WhatsApp'} number, such as +94 77 830 7334.`, field, 'contacts'); return; }
    }
    action.current = true; setBusy('save'); setStatus(null);
    try {
      await onSave(payload); reset(); setNow(new Date().getTime());
      setStatus({ type: 'success', message: payload.publicationStatus === 'scheduled' ? new Date(payload.publishAt).getTime() <= submittedAt ? 'Workshop post updated. Its scheduled publication time has already arrived.' : `Workshop post scheduled for ${workshopDateTimeLabel(payload.publishAt)} (Sri Lanka time).` : payload.publicationStatus === 'draft' ? 'Workshop draft saved. It is not visible on the public website.' : isEditing ? 'Workshop post updated.' : 'Workshop post published.' });
    }
    catch (error) { setStatus({ type: 'error', message: error.message || 'The post could not be saved. Your draft is still here.' }); }
    finally { action.current = false; setBusy(''); }
  };
  const remove = async (item) => {
    if (action.current || loading || uploadBusy.current || !window.confirm(`Delete “${item.title || 'this workshop post'}”? This cannot be undone.`)) return;
    action.current = true; setBusy(`delete-${item._id}`); setStatus(null);
    try { await onDelete(item._id); if (form._id === item._id) reset(); setStatus({ type: 'success', message: 'Workshop post deleted.' }); }
    catch (error) { setStatus({ type: 'error', message: error.message || 'The post could not be deleted. Please try again.' }); }
    finally { action.current = false; setBusy(''); }
  };
  const toggleDetails = (section, open) => setExpanded((current) => current[section] === open ? current : { ...current, [section]: open });
  return <div className="admin-content-module admin-workshop-module"><ContentStatus value={status} onDismiss={() => setStatus(null)} /><div className="admin-editor-layout">
    <form className="admin-panel admin-content-workshop-editor" ref={editor} onSubmit={handleSubmit} aria-label={isEditing ? 'Edit workshop post' : 'New workshop post'} aria-busy={Boolean(busy) || uploading}>
      <header className="admin-panel-header"><div><h2>{isEditing ? 'Edit workshop post' : 'New workshop post'}</h2><p>{isEditing ? 'Update the story, event details or publishing schedule.' : 'Prepare a story now and choose when it goes live.'}</p></div><AdminIcon name="image" /></header>
      <fieldset className="admin-panel-body admin-content-fieldset admin-content-workshop-fields" disabled={Boolean(busy) || loading}>
        <AdminField label="Post title" required><input name="title" ref={title} value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Give your post a clear title" /></AdminField>
        <AdminImageField key={imageSession} label="Workshop image" name="imageUrl" value={form.imageUrl} required hint="Upload a photograph or use an existing image link." onChange={(value) => update('imageUrl', value)} disabled={Boolean(busy) || loading} onBusyChange={(value) => { uploadBusy.current = value; setUploading(value); }} />
        <AdminField label="Description" required><textarea name="description" value={form.description} rows={5} onChange={(event) => update('description', event.target.value)} placeholder="Describe the workshop and the work behind it." /></AdminField>
        <section className="admin-workshop-publishing" aria-labelledby="workshop-publishing-title"><div className="admin-workshop-section-title"><AdminIcon name="calendar" /><h3 id="workshop-publishing-title">Publishing</h3><span>Sri Lanka time</span></div>
          <AdminField label="Publication mode"><select name="publicationStatus" value={form.publicationStatus} onChange={(event) => update('publicationStatus', event.target.value)}><option value="published">Publish now</option><option value="scheduled">Schedule publication</option><option value="draft">Save as draft</option></select></AdminField>
          {form.publicationStatus === 'scheduled' && <AdminField label="Publish date and time" required hint="Sri Lanka (UTC+05:30). The post stays private until this time."><input type="datetime-local" name="publishAt" value={form.publishAt} onChange={(event) => update('publishAt', event.target.value)} required /></AdminField>}
          <p>{form.publicationStatus === 'scheduled' ? 'Publication happens automatically when the scheduled time arrives. The event date below can be different.' : form.publicationStatus === 'draft' ? 'This post is saved privately. Publish or schedule it whenever you are ready.' : 'This post will be visible on the workshop page after saving.'}</p>
        </section>
        <details className="admin-workshop-options" open={expanded.event} onToggle={(event) => toggleDetails('event', event.currentTarget.open)}><summary><AdminIcon name="clock" /><span>Event details<small>Optional date and time for the workshop</small></span></summary><div className="admin-workshop-options-body admin-workshop-pair"><AdminField label="Event date"><input name="eventDate" type="date" value={form.eventDate} onChange={(event) => update('eventDate', event.target.value)} /></AdminField><AdminField label="Event time" hint="Sri Lanka time (UTC+05:30)"><input name="eventTime" type="time" value={form.eventTime} onChange={(event) => update('eventTime', event.target.value)} /></AdminField></div></details>
        <details className="admin-workshop-options" open={expanded.location} onToggle={(event) => toggleDetails('location', event.currentTarget.open)}><summary><AdminIcon name="pin" /><span>Location<small>Add a venue, address or map link</small></span></summary><div className="admin-workshop-options-body"><AdminField label="Venue / location"><input name="locationName" value={form.locationName} onChange={(event) => update('locationName', event.target.value)} placeholder="e.g. Pinnawala Gems atelier" maxLength={200} /></AdminField><AdminField label="Address"><input name="locationAddress" value={form.locationAddress} onChange={(event) => update('locationAddress', event.target.value)} placeholder="Street address or meeting point" maxLength={500} /></AdminField><AdminField label="Location map URL" hint="Optional full link from Google Maps or another map service."><input name="locationUrl" inputMode="url" value={form.locationUrl} onChange={(event) => update('locationUrl', event.target.value)} placeholder="https://maps.app.goo.gl/…" /></AdminField></div></details>
        <details className="admin-workshop-options" open={expanded.contacts} onToggle={(event) => toggleDetails('contacts', event.currentTarget.open)}><summary><AdminIcon name="phone" /><span>Contact options<small>Separate call and WhatsApp numbers</small></span></summary><div className="admin-workshop-options-body"><AdminField label="Call number" hint="Opens the visitor’s phone app. Use +country code or a Sri Lankan 0-prefixed number."><input name="phoneNumber" type="tel" inputMode="tel" value={form.phoneNumber} onChange={(event) => update('phoneNumber', event.target.value)} placeholder="e.g. 076 925 4499" /></AdminField><AdminField label="WhatsApp number" hint="Opens a WhatsApp conversation with this number."><input name="whatsappNumber" type="tel" inputMode="tel" value={form.whatsappNumber} onChange={(event) => update('whatsappNumber', event.target.value)} placeholder="e.g. +94 77 830 7334" /></AdminField></div></details>
        {uploading && <p className="admin-content-save-hint" role="status">Wait for the image upload to finish before saving.</p>}
        <div className="admin-form-actions">{isEditing && <button type="button" className="admin-button" disabled={uploading} onClick={() => { reset(); setStatus(null); }}>Cancel edit</button>}<button className="admin-button is-primary" disabled={uploading}>{busy === 'save' ? <span className="admin-spinner" /> : <AdminIcon name={form.publicationStatus === 'scheduled' ? 'calendar' : 'check'} />}{busy === 'save' ? 'Saving…' : publicationAction}</button></div>
      </fieldset>
    </form>
    <section className="admin-content-workshop-records"><div className="admin-toolbar"><div className="admin-content-records-heading"><h2>Workshop posts <span className="admin-content-count">{items.length}</span></h2><p>Published stories, scheduled posts and private drafts.</p></div><div className="admin-search"><AdminIcon name="search" /><input aria-label="Search workshop posts" placeholder="Search posts…" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>
      <div className="admin-workshop-list-toolbar"><label><span>Show posts</span><select aria-label="Filter workshop publication" value={publicationFilter} onChange={(event) => setPublicationFilter(event.target.value)}><option value="all">All posts</option><option value="published">Published</option><option value="scheduled">Scheduled</option><option value="draft">Drafts</option></select></label><p>{visible.length} of {items.length} posts · Sri Lanka time</p></div>
      {loading && !items.length ? <div className="admin-panel admin-loading" role="status"><span className="admin-spinner" />Loading posts…</div> : visible.length ? <div className="admin-workshop-list">{visible.map((item) => {
        const publication = workshopPublication(item, now);
        const links = workshopContactLinks(item);
        const locationUrl = safeWorkshopLocationUrl(item.locationUrl);
        return <article className={`admin-panel admin-workshop-card ${form._id === item._id ? 'is-editing' : ''}`} key={item._id}><AdminImage src={item.imageUrl} alt="" /><div><div className="admin-workshop-publication"><span className={`admin-badge ${publication === 'published' ? 'is-success' : publication === 'scheduled' ? 'is-warning' : ''}`}>{publication === 'published' ? 'Published' : publication === 'scheduled' ? 'Scheduled' : 'Draft'}</span>{item.publishAt && <small>{publication === 'scheduled' ? 'Publishes ' : 'Published '}{workshopDateTimeLabel(item.publishAt)}</small>}</div><h3>{item.title}</h3><p>{item.description}</p><div className="admin-workshop-record-details">{workshopEventLabel(item) && <span><AdminIcon name="calendar" />{workshopEventLabel(item)}</span>}{(item.locationName || item.locationAddress) && <span><AdminIcon name="pin" />{[item.locationName, item.locationAddress].filter(Boolean).join(' · ')}</span>}</div>{(links.call || links.whatsapp || locationUrl) && <div className="admin-workshop-contact-preview">{links.call && <a href={links.call}><AdminIcon name="phone" />Call</a>}{links.whatsapp && <a href={links.whatsapp} target="_blank" rel="noopener noreferrer"><AdminIcon name="phone" />WhatsApp</a>}{locationUrl && <a href={locationUrl} target="_blank" rel="noopener noreferrer"><AdminIcon name="pin" />Map</a>}</div>}<div className="admin-table-actions"><button type="button" className="admin-button is-small" disabled={Boolean(busy) || loading || uploading} onClick={() => edit(item)}><AdminIcon name="edit" />Edit post</button><button type="button" className="admin-button is-danger is-small" disabled={Boolean(busy) || loading || uploading} onClick={() => remove(item)}><AdminIcon name="trash" />{busy === `delete-${item._id}` ? 'Deleting…' : 'Delete'}</button>{form._id === item._id && <span className="admin-badge">Editing</span>}</div></div></article>;
      })}</div> : <div className="admin-panel"><AdminEmptyState icon="image" title={search || publicationFilter !== 'all' ? 'No matching posts' : 'No workshop posts yet'} description={search || publicationFilter !== 'all' ? 'Try another search or publication status.' : 'Create your first post using the form alongside.'} action={search || publicationFilter !== 'all' ? <button type="button" className="admin-button" onClick={() => { setSearch(''); setPublicationFilter('all'); }}>Clear filters</button> : undefined} /></div>}
    </section>
  </div></div>;
}
