import { useEffect, useRef, useState } from 'react';
import { AdminField, AdminIcon } from './AdminUI';
import { GEM_MEDIA_LIMITS, IMAGE_TYPES, VIDEO_TYPES, mediaUrls } from '../mediaPolicy';
import './GemMediaEditor.css';
import { apiUrl } from '../api';

function uploadFile(file, onProgress, requestRef) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    requestRef.current = xhr;
    xhr.open('POST', apiUrl('/media/upload'));
    xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('adminToken')}`);
    xhr.timeout = 120000;
    xhr.upload.onprogress = (event) => { if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 100)); };
    xhr.onload = () => {
      let data;
      try { data = JSON.parse(xhr.responseText); } catch { data = {}; }
      if (xhr.status === 401) { localStorage.removeItem('adminToken'); window.location.assign('/admin-login'); }
      if (xhr.status < 200 || xhr.status >= 300) { reject(new Error(data.message || 'Upload failed. Please try again.')); return; }
      if (!data.url) { reject(new Error('The upload returned no media URL. Please try again.')); return; }
      resolve(data);
    };
    xhr.onerror = () => reject(new Error('Connection interrupted. Retry this file when you are connected.'));
    xhr.ontimeout = () => reject(new Error('The upload took too long. Please retry this file.'));
    xhr.onabort = () => reject(new Error('Upload cancelled.'));
    const body = new FormData(); body.append('file', file); xhr.send(body);
  });
}

export default function GemMediaEditor({ form, setForm, onBusyChange, disabled }) {
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState('');
  const imageInput = useRef(null);
  const videoInput = useRef(null);
  const request = useRef(null);
  const running = useRef(false);
  const mounted = useRef(true);
  const imageUrls = mediaUrls([form.image, ...mediaUrls(form.additionalImages)]);
  const videos = mediaUrls(form.videos);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; request.current?.abort(); }; }, []);

  const updateRow = (id, values) => { if (mounted.current) setQueue((current) => current.map((row) => row.id === id ? { ...row, ...values } : row)); };
  const upload = async (files, kind, retryId) => {
    if (running.current || disabled || !files.length) return;
    setError('');
    const limit = kind === 'image' ? GEM_MEDIA_LIMITS.images : GEM_MEDIA_LIMITS.videos;
    const existingCount = kind === 'image' ? imageUrls.length : videos.length;
    if (existingCount + files.length > limit) { setError(`You can add up to ${limit} ${kind === 'image' ? 'photos, including the cover' : 'videos'} per gemstone. Remove an item before adding more.`); return; }
    for (const file of files) {
      const types = kind === 'image' ? IMAGE_TYPES : VIDEO_TYPES;
      const bytes = kind === 'image' ? GEM_MEDIA_LIMITS.imageBytes : GEM_MEDIA_LIMITS.videoBytes;
      if (!types.includes(file.type)) { setError(`${file.name}: choose ${kind === 'image' ? 'a JPG, PNG or WebP image' : 'an MP4 or WebM video'}.`); return; }
      if (!file.size || file.size > bytes) { setError(`${file.name}: ${kind === 'image' ? 'photos must be 8 MB or smaller' : 'videos must be 50 MB or smaller'}. Empty files cannot be uploaded.`); return; }
    }
    const rows = files.map((file) => ({ id: retryId || crypto.randomUUID(), file, kind, status: 'waiting', progress: 0, error: '' }));
    setQueue((current) => retryId ? current.map((row) => row.id === retryId ? rows[0] : row) : [...current, ...rows]);
    running.current = true; onBusyChange(true);
    try {
      for (const row of rows) {
        if (!mounted.current) break;
        updateRow(row.id, { status: 'uploading' });
        try {
          const result = await uploadFile(row.file, (progress) => updateRow(row.id, { progress, status: progress === 100 ? 'processing' : 'uploading' }), request);
          if (result.resourceType && result.resourceType !== kind) throw new Error('The uploaded file did not match the selected media type.');
          if (!mounted.current) break;
          setForm((current) => {
            if (kind === 'video') return { ...current, videos: mediaUrls([...mediaUrls(current.videos), result.url]) };
            if (!current.image) return { ...current, image: result.url };
            return { ...current, additionalImages: mediaUrls([...mediaUrls(current.additionalImages), result.url]) };
          });
          updateRow(row.id, { status: 'complete', progress: 100 });
        } catch (problem) { updateRow(row.id, { status: 'failed', error: problem.message }); }
      }
    } finally { running.current = false; request.current = null; if (mounted.current) onBusyChange(false); }
  };
  const choose = (event, kind) => { const files = Array.from(event.target.files || []); event.target.value = ''; upload(files, kind); };
  const drop = (event, kind) => { event.preventDefault(); setDragging(''); if (!disabled) upload(Array.from(event.dataTransfer.files || []), kind); };
  const setImages = (images) => setForm((current) => ({ ...current, image: images[0] || '', additionalImages: images.slice(1) }));
  const cover = (url) => setImages([url, ...imageUrls.filter((item) => item !== url)]);
  const remove = (url, kind) => kind === 'image' ? setImages(imageUrls.filter((item) => item !== url)) : setForm((current) => ({ ...current, videos: mediaUrls(current.videos).filter((item) => item !== url) }));
  const status = (row) => ({ waiting: 'Waiting', uploading: `Uploading ${row.progress}%`, processing: 'Processing…', complete: 'Ready', failed: 'Upload failed' }[row.status]);

  return <div className="gem-media-editor admin-span-full">
    <div className="gem-media-editor__zones">
      {[['image', 'Photos', `${imageUrls.length} / ${GEM_MEDIA_LIMITS.images}`, 'JPG, PNG or WebP · Up to 8 MB each', imageInput, 'Choose photos'], ['video', 'Videos · optional', `${videos.length} / ${GEM_MEDIA_LIMITS.videos}`, 'MP4 or WebM · Up to 50 MB each', videoInput, 'Choose videos']].map(([kind, title, count, hint, ref, label]) => <div key={kind} className={`gem-media-editor__drop${dragging === kind ? ' is-dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(kind); }} onDragLeave={() => setDragging('')} onDrop={(event) => drop(event, kind)}>
        <div className="gem-media-editor__drop-heading"><span className="gem-media-editor__drop-icon"><AdminIcon name={kind === 'image' ? 'image' : 'eye'} size={22} /></span><span><strong>{title}</strong><small>{hint}</small></span><b>{count}</b></div>
        <input ref={ref} type="file" accept={(kind === 'image' ? IMAGE_TYPES : VIDEO_TYPES).join(',')} multiple hidden onChange={(event) => choose(event, kind)} aria-label={`Upload gemstone ${kind === 'image' ? 'photos' : 'videos'}`} disabled={disabled} />
        <button type="button" className="admin-button is-small" onClick={() => ref.current?.click()} disabled={disabled}><AdminIcon name="upload" size={16} />{label}</button><p>or drop files here</p>
      </div>)}
    </div>
    {error && <p role="alert" className="gem-media-editor__error"><AdminIcon name="bell" size={16} />{error}</p>}
    {imageUrls.length > 0 && <div className="gem-media-editor__collection"><div className="gem-media-editor__label"><h4>Photo gallery</h4><span>The cover appears in the collection.</span></div><div className="gem-media-editor__photos">{imageUrls.map((url, index) => <figure key={url} className="gem-media-editor__photo"><div><img src={url} alt={`Gemstone photo ${index + 1}`} loading="lazy" />{index === 0 && <span className="gem-media-editor__cover"><AdminIcon name="check" size={12} />Cover</span>}</div><figcaption><button type="button" disabled={disabled || index === 0} onClick={() => cover(url)}>{index === 0 ? 'Collection cover' : 'Make cover'}</button><button type="button" className="gem-media-editor__remove" disabled={disabled} onClick={() => remove(url, 'image')} aria-label={`Remove photo ${index + 1}`}><AdminIcon name="trash" size={15} /></button></figcaption></figure>)}</div></div>}
    {videos.length > 0 && <div className="gem-media-editor__collection"><div className="gem-media-editor__label"><h4>Gemstone videos</h4><span>Customers choose when to play.</span></div><div className="gem-media-editor__videos">{videos.map((url, index) => <figure className="gem-media-editor__video" key={url}><video src={url} poster={form.image || undefined} controls playsInline preload="metadata" aria-label={`Gemstone video ${index + 1}`} /><figcaption><span>Video {index + 1}</span><button type="button" disabled={disabled} className="gem-media-editor__remove" onClick={() => remove(url, 'video')} aria-label={`Remove video ${index + 1}`}><AdminIcon name="trash" size={15} /></button></figcaption></figure>)}</div></div>}
    {queue.length > 0 && <div className="gem-media-editor__queue" role="region" aria-label="Media upload status"><div className="gem-media-editor__queue-title"><h4>Uploads</h4>{!disabled && queue.every((row) => row.status === 'complete') && <button type="button" onClick={() => setQueue([])}>Clear completed</button>}</div><ul>{queue.map((row) => <li key={row.id} className={`is-${row.status}`}><AdminIcon name={row.status === 'complete' ? 'check' : row.kind === 'image' ? 'image' : 'eye'} size={17} /><div><strong>{row.file.name}</strong><span>{row.error || `${(row.file.size / 1024 / 1024).toFixed(1)} MB · ${status(row)}`}</span>{['uploading', 'processing'].includes(row.status) && <progress value={row.progress} max="100" aria-label={`Uploading ${row.file.name}`} />}</div>{row.status === 'failed' ? <button type="button" className="admin-button is-small" disabled={disabled} onClick={() => upload([row.file], row.kind, row.id)}><AdminIcon name="refresh" size={14} />Retry</button> : <span className="gem-media-editor__status" aria-live={['complete', 'failed'].includes(row.status) ? 'polite' : 'off'}>{status(row)}</span>}</li>)}</ul></div>}
    <details className="gem-media-editor__links"><summary>Use existing image links</summary><p>For photographs already hosted online. Upload files above to add media from your device.</p><div className="admin-form-grid"><AdminField label="Cover image URL" className="admin-span-full"><input value={form.image || ''} onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))} placeholder="https://…" disabled={disabled} /></AdminField><AdminField label="Additional image URLs" hint="One image URL per line. The gallery allows 10 photos including the cover." className="admin-span-full"><textarea value={Array.isArray(form.additionalImages) ? form.additionalImages.join('\n') : form.additionalImages || ''} onChange={(event) => setForm((current) => ({ ...current, additionalImages: event.target.value }))} rows={3} disabled={disabled} /></AdminField></div></details>
  </div>;
}
