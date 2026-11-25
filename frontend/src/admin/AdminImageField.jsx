import { useEffect, useId, useRef, useState } from 'react';
import { apiRequest } from '../api';
import { GEM_MEDIA_LIMITS, IMAGE_TYPES } from '../mediaPolicy';
import { AdminIcon } from './AdminUI';
import './AdminImageField.css';

function validImageUrl(value) {
  const clean = value.trim();
  if (!clean) return true;
  if (clean.length > 2048 || [...clean].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127 || character === '\\')) return false;
  if (/^\/(?!\/)/.test(clean)) return true;
  try { const url = new URL(clean); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password; } catch { return false; }
}

export default function AdminImageField({ label = 'Image', value = '', onChange, disabled = false, onBusyChange, required = false, hint, name, className = '' }) {
  const id = useId();
  const picker = useRef(null);
  const urlInput = useRef(null);
  const request = useRef(null);
  const lastFile = useRef(null);
  const running = useRef(false);
  const mounted = useRef(true);
  const busyCallback = useRef(onBusyChange);
  const changeCallback = useRef(onChange);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [failedPreview, setFailedPreview] = useState('');
  const [canRetry, setCanRetry] = useState(false);
  const source = typeof value === 'string' ? value : '';
  const safeSource = validImageUrl(source) ? source : '';
  const locked = disabled || uploading;

  useEffect(() => { busyCallback.current = onBusyChange; }, [onBusyChange]);
  useEffect(() => { changeCallback.current = onChange; }, [onChange]);
  useEffect(() => { urlInput.current?.setCustomValidity(validImageUrl(source) ? '' : 'Use a valid http(s) image URL or a local image path starting with /.'); }, [source]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current?.abort();
      if (running.current) busyCallback.current?.(false);
    };
  }, []);

  const upload = async (files) => {
    if (disabled || running.current || !files.length) return;
    setError('');
    lastFile.current = null;
    setCanRetry(false);
    if (files.length !== 1) { setError('Choose one image for this field.'); return; }
    const file = files[0];
    if (!IMAGE_TYPES.includes(file.type)) { setError('Choose a JPEG, PNG or WebP image.'); return; }
    if (!file.size || file.size > GEM_MEDIA_LIMITS.imageBytes) { setError('Choose a non-empty image of 8 MB or smaller.'); return; }
    const controller = new AbortController();
    request.current = controller;
    lastFile.current = file;
    setCanRetry(true);
    running.current = true;
    setUploading(true);
    busyCallback.current?.(true);
    try {
      const body = new FormData(); body.append('image', file);
      const data = await apiRequest('/api/upload', { method: 'POST', body, signal: controller.signal }, { timeout: 120000 });
      const url = data?.imageUrl || data?.url;
      if (typeof url !== 'string' || !url || !validImageUrl(url) || (data.resourceType && data.resourceType !== 'image')) throw new Error('The upload did not return a valid image. Please retry.');
      if (mounted.current && !controller.signal.aborted) { changeCallback.current(url); lastFile.current = null; setCanRetry(false); setError(''); }
    } catch (problem) {
      if (mounted.current) setError(controller.signal.aborted ? 'Upload cancelled. Choose an image or retry when ready.' : problem.message || 'The image could not be uploaded. Please retry.');
    } finally {
      request.current = null;
      running.current = false;
      if (mounted.current) { setUploading(false); busyCallback.current?.(false); }
    }
  };
  const choose = (event) => { const files = Array.from(event.target.files || []); event.target.value = ''; upload(files); };
  const updateUrl = (event) => {
    const next = event.target.value;
    event.target.setCustomValidity(validImageUrl(next) ? '' : 'Use a valid http(s) image URL or a local image path starting with /.');
    lastFile.current = null; setCanRetry(false); setError(''); onChange(next);
  };

  return <div className={`admin-image-field ${className}`} aria-busy={uploading}>
    <div className="admin-image-field__heading"><strong>{label}{required && <span aria-hidden="true"> *</span>}</strong>{hint && <p>{hint}</p>}</div>
    <div className={`admin-image-field__drop${dragging ? ' is-dragging' : ''}${locked ? ' is-disabled' : ''}`} onDragOver={(event) => { event.preventDefault(); if (!locked) setDragging(true); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); if (!locked) upload(Array.from(event.dataTransfer.files || [])); }}>
      <div className="admin-image-field__preview">{safeSource && failedPreview !== safeSource ? <img src={safeSource} alt={`${label} preview`} onError={() => setFailedPreview(safeSource)} /> : <AdminIcon name="image" size={27} />}</div>
      <div className="admin-image-field__drop-copy"><strong>{uploading ? 'Uploading image…' : 'Drag an image here'}</strong><p>JPEG, PNG or WebP · Up to 8 MB</p><button type="button" className="admin-button is-small" disabled={locked} onClick={() => picker.current?.click()}><AdminIcon name="upload" />Choose image</button></div>
      {source && !uploading && <button type="button" className="admin-icon-button is-danger admin-image-field__remove" aria-label={`Remove ${label.toLowerCase()}`} disabled={disabled} onClick={() => { lastFile.current = null; setCanRetry(false); setError(''); onChange(''); }}><AdminIcon name="trash" /></button>}
      <input ref={picker} type="file" accept={IMAGE_TYPES.join(',')} hidden aria-label={`Upload ${label.toLowerCase()}`} disabled={locked} onChange={choose} />
    </div>
    {uploading && <div className="admin-image-field__progress" role="status"><progress aria-label={`Uploading ${label.toLowerCase()}`} /><span>Uploading and preparing your image…</span><button type="button" onClick={() => request.current?.abort()}>Cancel</button></div>}
    <div className="admin-field admin-image-field__url"><label htmlFor={id}>{label.replace(/\s+URL$/i, '')} URL</label><input ref={urlInput} id={id} name={name} type="text" inputMode="url" autoComplete="off" value={source} required={required} disabled={locked} placeholder="https://… or upload an image above" onChange={updateUrl} aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`} /></div>
    <p id={`${id}-help`} className="admin-image-field__help">Upload from your device or paste an existing image link. Save the form to apply it.</p>
    {safeSource && failedPreview === safeSource && <p className="admin-image-field__help">The preview could not load. Check the image link before saving.</p>}
    {error && <div id={`${id}-error`} className="admin-image-field__error" role="alert"><AdminIcon name="bell" /><span>{error}</span>{canRetry && !uploading && <button type="button" disabled={disabled} onClick={() => upload([lastFile.current])}>Retry upload</button>}</div>}
  </div>;
}
