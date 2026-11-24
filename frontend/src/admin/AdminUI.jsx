import { cloneElement, isValidElement, useContext, useId, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ResponsiveImage from '../ResponsiveImage';
import { AdminAccessLockContext } from '../adminAccessContext';

const ICONS = {
  grid: 'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z',
  gem: 'm7 4-5 6 10 11 10-11-5-6H7Zm-5 6h20M7 4l5 17 5-17M7 4l5 6 5-6',
  box: 'm3 7 9-5 9 5v10l-9 5-9-5V7Zm0 0 9 5 9-5M12 12v10M7.5 4.5l9 5',
  layers: 'm12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5',
  calendar: 'M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2ZM7 3v4M17 3v4M3 10h18M7 14h2m3 0h2m3 0h1M7 17h2m3 0h2',
  note: 'M5 3h10l4 4v14H5V3Zm10 0v5h4M8 12h8M8 16h6',
  settings: 'm9 3-1 3-3 1-2 3 2 2-1 3 3 2 3-1 2 2 3-1 1-3 3-1 1-3-2-2 1-3-3-2-3 1-2-2H9Zm6 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  star: 'm12 3 2.8 5.7 6.3.9-4.55 4.4 1.08 6.3L12 17.3l-5.63 3 1.08-6.3L2.9 9.6l6.3-.9L12 3Z',
  image: 'M3 3h18v18H3V3Zm0 13 6-6 6 6 3-3 3 3M16 7h.01',
  search: 'm21 21-5.2-5.2M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  plus: 'M12 5v14M5 12h14',
  edit: 'M12 4H5v16h15v-7M15 3l6 6M9 15l2-5 8-8 4 4-8 8-6 1Z',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
  close: 'm6 6 12 12M6 18 18 6',
  check: 'm5 12 4 4L19 6',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  refresh: 'M20 7a9 9 0 0 0-15-2L2 8m0-5v5h5M4 17a9 9 0 0 0 15 2l3-3m0 5v-5h-5',
  upload: 'M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6',
  filter: 'M4 7h16M4 17h16M8 4v6m8 4v6',
  'chevron-left': 'm15 5-7 7 7 7',
  'chevron-right': 'm9 5 7 7-7 7',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2',
  pin: 'm9 3 12 12-3 1-4-4-5 2-5-5 2-5-3-1ZM3 21l5-5',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4',
  archive: 'M3 3h18v5H3V3Zm2 5v13h14V8M9 12h6',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  'eye-off': 'M3 3l18 18M10 5h2c6 0 10 7 10 7s-1 2-3 4M6 6c-3 2-4 6-4 6s4 7 10 7c2 0 4-.8 5-2M9 9a4 4 0 0 0 6 6',
  external: 'M14 3h7v7M21 3 10 14M10 3H3v18h18v-7',
  user: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21a8 8 0 0 1 16 0',
  shield: 'm12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Zm-4 9 3 3 5-6',
  logout: 'M9 3H3v18h6M9 12h12m-5-5 5 5-5 5',
  mail: 'M3 5h18v14H3V5Zm0 0 9 8 9-8',
  phone: 'm7 3 3 5-2 2c1 3 3 5 6 6l2-2 5 3c-1 4-3 5-7 3C7 17 3 13 2 7c0-3 2-4 5-4Z',
  link: 'm10 14 4-4M8 16l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0M16 8l2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  chart: 'M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7',
  home: 'm2 10 10-8 10 8M5 8v13h14V8M9 21v-8h6v8',
  menu: 'M4 6h16M4 12h16M4 18h16',
};

export function AdminIcon({ name = 'gem', size = 20, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={ICONS[name] || ICONS.gem} /></svg>;
}

export function AdminModal({ title, description, children, onClose, busy = false, size = 'lg' }) {
  const dialog = useRef(null);
  const returnFocus = useRef(null);
  const resumeFocus = useRef(null);
  const accessLocked = useContext(AdminAccessLockContext);
  const titleId = useId();
  const descriptionId = useId();
  useLayoutEffect(() => {
    const node = dialog.current;
    if (accessLocked) { if (node.open) node.close(); return undefined; }
    if (!returnFocus.current) returnFocus.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const editingField = resumeFocus.current;
    node.showModal();
    if (editingField?.isConnected) editingField.focus({ preventScroll: true });
    return () => { node.close(); document.body.style.overflow = previousOverflow; returnFocus.current?.focus({ preventScroll: true }); };
  }, [accessLocked]);
  const containFocus = (event) => {
    if (event.key !== 'Tab') return;
    const items = [...dialog.current.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled):not([type="hidden"]),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter((node) => node.getClientRects().length && !node.closest('fieldset:disabled'));
    if (!items.length) { event.preventDefault(); dialog.current.focus(); return; }
    const first = items[0]; const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  return createPortal(<dialog ref={dialog} className={`admin-app admin-modal admin-modal--${size}`} hidden={accessLocked} inert={accessLocked} aria-hidden={accessLocked || undefined} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} aria-busy={busy} onFocusCapture={(event) => { resumeFocus.current = event.target; }} onKeyDown={containFocus} onCancel={(event) => { event.preventDefault(); if (!busy && !accessLocked) onClose(); }} onClick={(event) => { if (event.target === dialog.current && !busy && !accessLocked) { const box = dialog.current.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose(); } }}><header className="admin-modal-header"><div><h2 id={titleId}>{title}</h2>{description && <p id={descriptionId}>{description}</p>}</div><button type="button" className="admin-icon-button" onClick={onClose} disabled={busy || accessLocked} aria-label="Close dialog"><AdminIcon name="close" /></button></header><div className="admin-modal-body">{children}</div></dialog>, document.body);
}

export function AdminEmptyState({ icon = 'box', title = 'Nothing here yet', description, action, children }) {
  return <div className="admin-empty"><span className="admin-empty-icon"><AdminIcon name={icon} size={25} /></span><h3>{title}</h3>{description && <p>{description}</p>}{action}{children}</div>;
}

export function AdminField({ label, hint, required = false, id, error, children, className = '' }) {
  const generatedId = useId();
  const fieldId = id || (isValidElement(children) ? children.props.id : null) || generatedId;
  const description = [hint ? `${fieldId}-hint` : '', error ? `${fieldId}-error` : '', isValidElement(children) ? children.props['aria-describedby'] : ''].filter(Boolean).join(' ');
  return <div className={`admin-field ${className}`}><label htmlFor={fieldId}>{label}{required && <span className="admin-required" aria-hidden="true"> *</span>}</label>{isValidElement(children) ? cloneElement(children, { id: fieldId, required: children.props.required ?? required, 'aria-describedby': description || undefined, 'aria-invalid': error ? true : undefined }) : children}{hint && <small id={`${fieldId}-hint`}>{hint}</small>}{error && <p className="admin-field-error" id={`${fieldId}-error`}>{error}</p>}</div>;
}

export function AdminImage({ src, alt = '', className = '' }) {
  return src ? <ResponsiveImage src={src} alt={alt} className={className} maxWidth={320} sizes="160px" width="160" height="160" /> : <span className={`admin-image-placeholder ${className}`}><AdminIcon name="gem" /></span>;
}
