import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminEmptyState, AdminField, AdminIcon } from './AdminUI';
import AdminImageField from './AdminImageField';
import { withBusinessDetails } from '../businessDetails';
import { isAuthoritativeSetting } from './settingsPolicy';
import { ADMIN_PORTAL_PATH } from '../adminPaths';

const list = (value) => Array.isArray(value) ? value : [];
function Section({ icon, title, description, children }) {
  return <section className="admin-form-section"><div className="admin-form-section-heading"><AdminIcon name={icon} /><div><h3>{title}</h3>{description && <p>{description}</p>}</div></div>{children}</section>;
}

function MediaList({ label, description, items, onChange, disabled, uploading, onBusyChange }) {
  const [rowKeys, setRowKeys] = useState(() => items.map(() => crypto.randomUUID()));
  if (rowKeys.length !== items.length) setRowKeys((current) => items.map((_, index) => current[index] || crypto.randomUUID()));
  const add = () => { setRowKeys((current) => [...current, crypto.randomUUID()]); onChange([...items, '']); };
  const remove = (index) => { setRowKeys((current) => current.filter((_, row) => row !== index)); onChange(items.filter((_, row) => row !== index)); };
  return <div className="admin-content-media-list"><div className="admin-content-list-heading"><div><h4>{label}</h4><p>{description}</p></div><button type="button" className="admin-button is-small" disabled={disabled || uploading} onClick={add}><AdminIcon name="plus" />Add image</button></div>{items.length ? <div className="admin-media-stack">{items.map((item, index) => <div className="admin-content-media-upload-row" key={rowKeys[index]}><AdminImageField label={`${label}: image ${index + 1}`} value={typeof item === 'string' ? item : ''} onChange={(value) => onChange(items.map((current, row) => row === index ? value : current))} disabled={disabled || uploading} onBusyChange={(busy) => onBusyChange(`${label}-${rowKeys[index]}`, busy)} /><button type="button" className="admin-icon-button is-danger" aria-label={`Remove ${label.toLowerCase()} image ${index + 1}`} disabled={disabled || uploading} onClick={() => remove(index)}><AdminIcon name="trash" /></button></div>)}</div> : <p className="admin-content-inline-empty">No images added.</p>}</div>;
}

export default function WebsiteSettings({ settings, onChange, onSave, dirtyPages = {}, loadingPages = {}, readyPages = {}, failedPages = {}, onRetry }) {
  const [page, setPage] = useState('home');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  const uploadKeys = useRef(new Set());
  const action = useRef(false);
  const data = withBusinessDetails(settings?.[page] || {}, page);
  const loading = Boolean(loadingPages[page]);
  const unavailable = !readyPages[page] && Boolean(failedPages[page]);
  const disabled = loading || unavailable || saving;
  const imageBusy = (key, busy) => { if (busy) uploadKeys.current.add(key); else uploadKeys.current.delete(key); setUploading(uploadKeys.current.size > 0); };
  const update = (field, value) => { if (!isAuthoritativeSetting(page, field)) onChange(page, field, value); setStatus(null); };
  const field = (name, label, options = {}) => {
    const readOnly = isAuthoritativeSetting(page, name);
    const hint = readOnly ? 'Verified business detail · read-only' : options.hint;
    return <AdminField key={name} label={label} hint={hint} className={options.full ? 'admin-span-full' : ''}>{options.multiline ? <textarea name={name} value={data[name] ?? ''} rows={options.rows || 3} readOnly={readOnly} onChange={(event) => update(name, event.target.value)} /> : <input name={name} value={data[name] ?? ''} type={options.type || 'text'} inputMode={options.inputMode} readOnly={readOnly} onChange={(event) => update(name, event.target.value)} placeholder={options.placeholder} />}</AdminField>;
  };
  const save = async (event) => {
    event.preventDefault();
    if (action.current || disabled || uploadKeys.current.size) return;
    action.current = true; setSaving(true); setStatus(null);
    try { await onSave(page); setStatus({ type: 'success', message: 'Page content saved. Verified business details remain protected.' }); }
    catch (error) { setStatus({ type: 'error', message: error.message || 'Unable to save. Your changes are still here.' }); }
    finally { action.current = false; setSaving(false); }
  };
  return <div className="admin-content-module">
    <div className="admin-subnav" aria-label="Website settings pages">{[['home', 'Homepage', 'home'], ['contact', 'Contact page', 'phone']].map(([id, label, icon]) => <button type="button" key={id} className={page === id ? 'is-active' : ''} aria-pressed={page === id} onClick={() => { setPage(id); setStatus(null); }} disabled={saving || uploading}><AdminIcon name={icon} />{label}{dirtyPages[id] && <span className="admin-content-unsaved-dot" aria-label="Unsaved changes" />}</button>)}</div>
    {status && <div className={`admin-status ${status.type === 'error' ? 'is-error' : ''}`} role={status.type === 'error' ? 'alert' : 'status'}><AdminIcon name={status.type === 'error' ? 'bell' : 'check'} /><p>{status.message}</p><button type="button" onClick={() => setStatus(null)} aria-label="Dismiss message"><AdminIcon name="close" /></button></div>}
    {unavailable ? <section className="admin-panel"><AdminEmptyState icon="refresh" title="This page could not be loaded" description={failedPages[page]} action={<button type="button" className="admin-button" onClick={onRetry}>Try again</button>} /></section> : <div className="admin-settings-layout">
      <aside className="admin-settings-guide"><AdminIcon name={page === 'home' ? 'home' : 'phone'} size={24} /><h3>{page === 'home' ? 'Homepage content' : 'Contact information'}</h3><p>Update the page content, imagery and social links shown to customers.</p><small>Verified business contact details are managed centrally and shown read-only.</small><a href={page === 'home' ? '/' : '/contact'} target="_blank" rel="noreferrer" className="admin-button is-small admin-content-preview-link">View page<AdminIcon name="external" /></a></aside>
      <form className="admin-settings-form" onSubmit={save} aria-label={page === 'home' ? 'Homepage settings' : 'Contact page settings'} aria-busy={disabled || uploading}><section className="admin-panel"><header className="admin-panel-header"><div><h2>{page === 'home' ? 'Homepage settings' : 'Contact page settings'}</h2><p>{loading ? 'Loading this page…' : 'Save editable content below. Verified contacts are protected.'}</p></div><span className="admin-badge">{dirtyPages[page] ? 'Unsaved changes' : 'Page content'}</span></header>
        <fieldset className="admin-panel-body admin-content-fieldset" disabled={disabled}>{page === 'home' ? <>
          <Section icon="note" title="Introduction"><div className="admin-form-grid">{field('heroTitle', 'Hero heading', { full: true })}{field('brandIntro', 'Brand introduction', { multiline: true, full: true })}</div></Section>
          <Section icon="phone" title="Verified contact details" description="These confirmed details are protected from older page records."><div className="admin-form-grid">{field('address', 'Address', { full: true })}{field('contactNumber', 'Contact number', { type: 'tel' })}{field('inquiryEmail', 'Enquiry email', { type: 'email' })}{field('whatsappNumber', 'WhatsApp number', { type: 'tel' })}{field('googleMapsLink', 'Google Maps link', { inputMode: 'url' })}</div></Section>
          <Section icon="image" title="Homepage imagery"><div className="admin-form-grid"><AdminImageField className="admin-span-full" label="Side promotion image" name="sideAdImage" value={data.sideAdImage || ''} onChange={(value) => update('sideAdImage', value)} disabled={disabled} onBusyChange={(busy) => imageBusy('sideAdImage', busy)} /><AdminImageField className="admin-span-full" label="Bottom promotion image" name="bottomAdImage" value={data.bottomAdImage || ''} onChange={(value) => update('bottomAdImage', value)} disabled={disabled} onBusyChange={(busy) => imageBusy('bottomAdImage', busy)} /></div><MediaList key="home-customer-photos" label="Customer photos" description="Images are shown in the order listed." items={list(data.customerPhotos)} onChange={(value) => update('customerPhotos', value)} disabled={disabled} uploading={uploading} onBusyChange={imageBusy} /></Section>
          <Section icon="gem" title="Homepage gemstones" description="Choose Homepage top gem and a homepage position in Gem inventory. This keeps the homepage connected to current inventory."><Link to={`${ADMIN_PORTAL_PATH}?view=inventory`} className="admin-button is-small"><AdminIcon name="gem" />Manage homepage gemstones<AdminIcon name="arrow" /></Link></Section>
          <Section icon="bell" title="Announcement banner"><label className="admin-checkbox"><input name="showEvent" type="checkbox" checked={Boolean(data.showEvent)} onChange={(event) => update('showEvent', event.target.checked)} /><span><strong>Show announcement banner</strong><small>Display the announcement and optional link.</small></span></label><div className="admin-form-grid admin-content-spaced">{field('eventText', 'Announcement text', { multiline: true, full: true })}{field('eventLink', 'Announcement link', { full: true, inputMode: 'url' })}</div></Section>
        </> : <>
          <Section icon="phone" title="Verified business details" description="These contact values are read-only. Opening hours remain editable."><div className="admin-form-grid">{field('address', 'Address', { full: true, multiline: true, rows: 2 })}{field('landlineNumber', 'Primary landline', { type: 'tel' })}{field('landlineNumber2', 'Secondary landline', { type: 'tel' })}{field('mobileNumber', 'Primary mobile', { type: 'tel' })}{field('mobileNumber2', 'Secondary mobile', { type: 'tel' })}{field('email', 'Email address', { type: 'email' })}{field('openingHours', 'Opening hours')}{field('googleMapsLink', 'Google Maps embed link', { full: true, inputMode: 'url' })}</div></Section>
          <Section icon="link" title="Social profiles"><div className="admin-form-grid">{field('facebookLink', 'Facebook profile URL', { full: true, inputMode: 'url' })}{field('instagramLink', 'Instagram profile URL', { full: true, inputMode: 'url' })}{field('tiktokLink', 'TikTok profile URL', { full: true, inputMode: 'url' })}</div></Section>
          <Section icon="image" title="Contact page media"><div className="admin-form-grid">{field('contactVideo', 'Contact video URL', { full: true, inputMode: 'url', hint: 'Optional direct MP4 or WebM video URL.' })}</div><MediaList key="contact-photos" label="Contact photos" description="These photographs appear on the Contact page." items={list(data.contactImages)} onChange={(value) => update('contactImages', value)} disabled={disabled} uploading={uploading} onBusyChange={imageBusy} /></Section>
        </>}</fieldset><footer className="admin-form-actions"><span className="admin-content-save-hint">{loading ? 'Loading page content…' : uploading ? 'Wait for image uploads to finish before saving.' : dirtyPages[page] ? 'You have unsaved changes.' : 'Save applies editable page content.'}</span><button className="admin-button is-primary" disabled={disabled || uploading}>{saving ? <span className="admin-spinner" /> : <AdminIcon name="check" />}{saving ? 'Saving…' : `Save ${page === 'home' ? 'homepage' : 'contact page'}`}</button></footer>
      </section></form>
    </div>}
  </div>;
}
