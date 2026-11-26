import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import './AdminPlanner.css';
import { API_ORIGIN, apiRequest } from './api';
import PlannerCalendar from './PlannerCalendar';
import { appointmentTypes, noteCategories, colorHex, colorStyles, getAppointmentColor, getNoteColor, dayKey, noteDayKey, todayKey } from './plannerCalendarUtils';

const API_URL = API_ORIGIN;
const API_HOST = (() => { try { return new URL(API_URL).host; } catch { return API_URL; } })();
const appointmentDefaults = { customerName: '', email: '', phone: '', date: '', time: '10:00', durationMinutes: 60, type: 'Viewing', color: '', status: 'Requested', purpose: '', internalNotes: '' };
const noteDefaults = { title: '', content: '', category: 'General', tags: '', color: '', isPinned: false, isArchived: false, noteDate: '', reminderAt: '', customerName: '' };
const appointmentStatuses = ['Requested', 'Confirmed', 'Completed', 'Cancelled', 'No-show'];
const emptyNotifications = { todayAppointments: [], dueNotes: [], upcomingNotes: [], counts: { todayAppointments: 0, dueNotes: 0, upcomingNotes: 0 } };
const array = (value) => Array.isArray(value) ? value : [];
const dateLabel = (value, options = {}) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Date not set' : date.toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo', day: 'numeric', month: 'short', year: 'numeric', ...options }); };
const reminderLabel = (value) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('en-GB', { timeZone: 'Asia/Colombo', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); };
function reminderInput(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value));
  const part = (type) => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
}

class PlannerApiError extends Error {
  constructor(message, status, path, code = '') {
    super(message);
    this.name = 'PlannerApiError';
    this.status = status;
    this.path = path;
    this.code = code;
  }
}

const endpoint = (error) => String(error?.path || '').split('?')[0];
const actionErrorMessage = (error) => error.status === 404
  ? `The connected backend (${API_HOST}) does not provide ${endpoint(error)} yet. Deploy the current backend, then try again. Your changes are still here.`
  : error.message || 'The request could not be completed. Your changes are still here; please try again.';

async function api(path, options = {}) {
  try {
    return await apiRequest(path, options);
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new PlannerApiError(error.message, error.status || 0, path, error.code || 'CONNECTION');
  }
}

async function apiList(path, options) {
  const data = await api(path, options);
  if (!Array.isArray(data)) throw new PlannerApiError('The connected backend returned an unexpected response. Check that the backend address and deployment are correct.', 200, path, 'INVALID_RESPONSE');
  return data;
}

function PlannerIcon({ name = 'calendar', ...props }) {
  const paths = {
    calendar: 'M5 4h14v17H5V4Zm3-2v5m8-5v5M5 10h14m-10 4h2m2 0h2m-6 3h2',
    note: 'M5 3h14v18H5V3Zm4 5h6m-6 4h6m-6 4h4',
    bell: 'M6 9a6 6 0 0 1 12 0v6l2 3H4l2-3V9Zm4 12h4',
    search: 'M16.5 10a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0ZM15 15l6 6',
    clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2',
    pin: 'm8 3 8 0-1 6 3 4H6l3-4-1-6Zm4 10v8',
    close: 'm6 6 12 12M6 18 18 6',
    arrow: 'M5 12h14m-6-6 6 6-6 6',
    check: 'm5 12 4 4L19 6',
    edit: 'M14 4H5v16h15v-9M16 3l5 5-9 9H7v-5l9-9Z',
    archive: 'M4 8h16v13H4V8Zm-1-5h18v5H3V3Zm6 9h6',
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name]} /></svg>;
}

function Input({ label, name, value, onChange, type = 'text', required = false, ...props }) {
  const id = useId();
  return <div className="admin-field planner-field"><label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label><input id={id} type={type} name={name} value={value ?? ''} onChange={onChange} required={required} {...props} /></div>;
}
function Textarea({ label, name, value, onChange, required = false, ...props }) {
  const id = useId();
  return <div className="admin-field planner-field"><label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label><textarea id={id} name={name} value={value ?? ''} onChange={onChange} required={required} rows="3" {...props} /></div>;
}
function Select({ label, name, value, onChange, options }) {
  const id = useId();
  return <div className="admin-field planner-field"><label htmlFor={id}>{label}</label><select id={id} name={name} value={value ?? ''} onChange={onChange}>{options.map((option) => { const structured = typeof option === 'object'; const optionValue = structured ? option.value : option; return <option key={optionValue} value={optionValue}>{structured ? option.label : option}</option>; })}</select></div>;
}
function CalendarColour({ value, defaultColor, onChange }) {
  const id = useId();
  const selected = colorHex(value, defaultColor);
  const automatic = !value || selected === defaultColor;
  const palette = ['#315fca', '#15806b', '#a56513', '#8656ba', '#c34d78', '#61718a'];
  return <div className="planner-colour-field" style={colorStyles(selected)}>
    <div className="planner-colour-heading"><span>Calendar colour</span><small>{automatic ? 'Category colour' : 'Custom colour'}</small></div>
    <div className="planner-colour-preview"><span aria-hidden="true" /><strong>{selected.toUpperCase()}</strong><label htmlFor={id}>Custom<input id={id} aria-label="Choose any calendar colour" type="color" value={selected} onChange={(event) => onChange(event.target.value)} /></label></div>
    <div className="planner-colour-options" aria-label="Calendar colour palette">{palette.map((color) => <button key={color} type="button" aria-label={`Use colour ${color}`} aria-pressed={selected.toLowerCase() === color.toLowerCase()} style={{ background: color }} onClick={() => onChange(color)}>{selected.toLowerCase() === color.toLowerCase() && <PlannerIcon name="check" />}</button>)}<button type="button" className="planner-colour-reset" onClick={() => onChange('')}>Use category colour</button></div>
  </div>;
}
function EmptyState({ type, title, children }) {
  return <div className="admin-empty planner-empty"><span><PlannerIcon name={type} /></span><h3>{title}</h3><p>{children}</p></div>;
}

function LoadError({ errors, onRetry }) {
  if (!errors.length) return null;
  const missing = errors.every(({ error }) => error.status === 404);
  const invalidResponse = errors.some(({ error }) => error.code === 'INVALID_RESPONSE');
  const title = missing
    ? errors.length > 1 ? 'Appointments and notes need a backend update' : `${errors[0].label} endpoint is unavailable`
    : invalidResponse ? 'Check the connected backend address' : `${errors[0].label} could not be loaded`;
  return <div className="planner-message is-error planner-load-error" role="alert">
    <PlannerIcon name="bell" />
    <div className="planner-load-error-details"><strong>{title}</strong><p>Connected API: <span>{API_HOST}</span></p>
      <ul>{errors.map(({ error }) => <li key={endpoint(error)}><code>{endpoint(error)}</code><span>{error.status ? `HTTP ${error.status}` : 'Connection failed'}</span></li>)}</ul>
      <p>{missing ? 'Deploy the current backend with these routes to the connected API, then try again.' : errors[0].error.message}</p>
      <p className="planner-load-error-draft">Your unsaved changes are still here.</p>
    </div>
    <button type="button" onClick={onRetry}>Try again</button>
  </div>;
}

export default function AdminPlanner() {
  const [view, setView] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [appointments, setAppointments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [notifications, setNotifications] = useState(emptyNotifications);
  const [notificationsError, setNotificationsError] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState(appointmentDefaults);
  const [noteForm, setNoteForm] = useState(noteDefaults);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [appointmentStatus, setAppointmentStatus] = useState('');
  const [noteSearch, setNoteSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [status, setStatus] = useState(null);
  const [loadErrors, setLoadErrors] = useState({ appointments: null, notes: null });
  const [pending, setPending] = useState({ appointments: true, notes: true, notifications: true });
  const [busy, setBusy] = useState('');
  const actionRef = useRef(false);
  const loadVersion = useRef(0);
  const notificationRef = useRef(null);
  const notificationButton = useRef(null);
  const appointmentFormRef = useRef(null);
  const noteFormRef = useRef(null);
  const latestLoad = useRef(null);
  const activeLoad = useRef(null);
  const notificationLoad = useRef(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const refreshNotifications = useCallback(async () => {
    notificationLoad.current?.abort();
    const controller = new AbortController();
    notificationLoad.current = controller;
    setPending((previous) => ({ ...previous, notifications: true }));
    try {
      const data = await api('/api/planner/notifications', { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (!data || !['todayAppointments', 'dueNotes', 'upcomingNotes'].every((key) => Array.isArray(data[key]))) throw new PlannerApiError('The reminder summary returned an unexpected response. Please refresh or check the backend deployment.', 200, '/api/planner/notifications', 'INVALID_RESPONSE');
      setNotifications({ todayAppointments: array(data?.todayAppointments), dueNotes: array(data?.dueNotes), upcomingNotes: array(data?.upcomingNotes), counts: data?.counts || emptyNotifications.counts });
      setNotificationsError(null);
      setLastRefreshed(new Date());
    } catch (error) {
      if (!controller.signal.aborted) setNotificationsError(error);
    } finally {
      if (!controller.signal.aborted) { notificationLoad.current = null; setPending((previous) => ({ ...previous, notifications: false })); }
    }
  }, []);

  const load = useCallback(async () => {
    activeLoad.current?.abort();
    const controller = new AbortController(); activeLoad.current = controller;
    const version = ++loadVersion.current;
    const current = () => version === loadVersion.current && !controller.signal.aborted;
    setPending((previous) => ({ ...previous, appointments: true, notes: true }));
    const definitions = [
      ['appointments', () => apiList('/api/appointments', { signal: controller.signal })],
      ['notes', () => apiList('/api/admin-notes', { signal: controller.signal })],
    ];
    const notificationRefresh = refreshNotifications();
    await Promise.allSettled(definitions.map(async ([key, fetcher]) => {
      try {
        const data = await fetcher();
        if (!current()) return;
        if (key === 'appointments') setAppointments(array(data));
        else if (key === 'notes') setNotes(array(data));
        setLoadErrors((previous) => ({ ...previous, [key]: null }));
      } catch (error) {
        if (current()) setLoadErrors((previous) => ({ ...previous, [key]: error }));
      } finally { if (current()) setPending((previous) => ({ ...previous, [key]: false })); }
    }));
    await notificationRefresh;
    if (current()) activeLoad.current = null;
  }, [refreshNotifications]);

  useEffect(() => { latestLoad.current = load; }, [load]);
  useEffect(() => { const timer = window.setTimeout(load, 0); return () => { window.clearTimeout(timer); loadVersion.current += 1; activeLoad.current?.abort(); notificationLoad.current?.abort(); }; }, [load]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible' && !notificationLoad.current && !actionRef.current) refreshNotifications(); };
    const timer = window.setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('focus', refresh); };
  }, [refreshNotifications]);
  useEffect(() => {
    const refresh = () => load();
    window.addEventListener('admin-refresh', refresh);
    return () => window.removeEventListener('admin-refresh', refresh);
  }, [load]);
  useEffect(() => {
    if (!showNotifications) return undefined;
    const outside = (event) => { if (!notificationRef.current?.contains(event.target)) setShowNotifications(false); };
    const key = (event) => { if (event.key === 'Escape') { setShowNotifications(false); notificationButton.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', key); };
  }, [showNotifications]);

  const filteredAppointments = useMemo(() => appointments.filter((item) => (!appointmentStatus || item.status === appointmentStatus) && [item.customerName, item.email, item.phone, item.purpose, item.type].some((value) => String(value || '').toLowerCase().includes(appointmentSearch.trim().toLowerCase()))), [appointments, appointmentSearch, appointmentStatus]);
  const filteredNotes = useMemo(() => notes.filter((item) => Boolean(item.isArchived) === showArchived && [item.title, item.content, item.customerName, ...array(item.tags)].some((value) => String(value || '').toLowerCase().includes(noteSearch.trim().toLowerCase()))), [notes, noteSearch, showArchived]);
  const calendarNotes = useMemo(() => notes.filter((note) => !note.isArchived), [notes]);
  const loading = view === 'calendar' ? pending.appointments || pending.notes : view === 'appointments' ? pending.appointments : pending.notes;
  const change = (setter) => (event) => { const { name, value, type, checked } = event.target; setter((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value })); };
  const changeCategory = (setter, name) => (event) => setter((current) => ({ ...current, [name]: event.target.value, color: '' }));
  const runAction = async (key, action, message) => {
    if (actionRef.current) return;
    actionRef.current = true;
    setBusy(key);
    setStatus(null);
    try { await action(); setStatus({ type: 'success', message }); await latestLoad.current(); }
    catch (error) { setStatus({ type: 'error', message: actionErrorMessage(error) }); }
    finally { actionRef.current = false; setBusy(''); }
  };
  const save = (event, type) => {
    event.preventDefault();
    if (type === 'appointment') {
      if (!appointmentForm.customerName.trim()) { setStatus({ type: 'error', message: 'Enter the customer’s name before saving the appointment.' }); appointmentFormRef.current?.querySelector('[name="customerName"]')?.focus(); return; }
      runAction('appointment', async () => {
        const path = editingAppointment ? `/api/appointments/${editingAppointment._id}` : '/api/appointments';
        const fields = ['customerName', 'email', 'phone', 'date', 'time', 'type', 'color', 'status', 'purpose', 'internalNotes'];
        const payload = Object.fromEntries(fields.map((field) => [field, appointmentForm[field]]));
        payload.durationMinutes = Number(appointmentForm.durationMinutes);
        await api(path, { method: editingAppointment ? 'PUT' : 'POST', body: JSON.stringify(payload) });
        setSelectedDate(appointmentForm.date);
        setAppointmentForm(appointmentDefaults); setEditingAppointment(null);
      }, 'Appointment saved.');
    } else {
      if (!noteForm.title.trim() || !noteForm.content.trim()) { setStatus({ type: 'error', message: 'Add a title and note before saving.' }); noteFormRef.current?.querySelector(`[name="${noteForm.title.trim() ? 'content' : 'title'}"]`)?.focus(); return; }
      runAction('note', async () => {
        const path = editingNote ? `/api/admin-notes/${editingNote._id}` : '/api/admin-notes';
        const fields = ['title', 'content', 'category', 'isPinned', 'isArchived', 'customerName', 'noteDate'];
        const payload = Object.fromEntries(fields.map((field) => [field, noteForm[field]]));
        payload.color = noteForm.color || getNoteColor(noteForm);
        payload.tags = String(noteForm.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
        payload.reminderAt = noteForm.reminderAt ? new Date(`${noteForm.reminderAt}+05:30`).toISOString() : null;
        await api(path, { method: editingNote ? 'PUT' : 'POST', body: JSON.stringify(payload) });
        const date = noteDayKey({ ...noteForm, reminderAt: payload.reminderAt });
        if (date) setSelectedDate(date);
        setNoteForm(noteDefaults); setEditingNote(null);
      }, 'Note saved.');
    }
  };
  const remove = (path, message, key) => { if (window.confirm(message)) runAction(key, () => api(path, { method: 'DELETE' }), 'Deleted successfully.'); };
  const updateAppointmentStatus = (appointment, nextStatus) => runAction(`appointment-${appointment._id}`, () => api(`/api/appointments/${appointment._id}`, { method: 'PUT', body: JSON.stringify({ status: nextStatus }) }), `Appointment marked ${nextStatus.toLowerCase()}.`);
  const editAppointment = (appointment) => {
    if (actionRef.current) return;
    setEditingAppointment(appointment);
    setAppointmentForm({ ...appointmentDefaults, ...appointment, date: dayKey(appointment.date) });
    setView('appointments');
    window.requestAnimationFrame(() => { appointmentFormRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); appointmentFormRef.current?.querySelector('input')?.focus({ preventScroll: true }); });
  };
  const editNote = (note) => {
    if (actionRef.current) return;
    setEditingNote(note);
    setNoteForm({ ...noteDefaults, ...note, tags: array(note.tags).join(', '), reminderAt: reminderInput(note.reminderAt) });
    setView('notes');
    window.requestAnimationFrame(() => { noteFormRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); noteFormRef.current?.querySelector('input')?.focus({ preventScroll: true }); });
  };
  const groupedAppointments = filteredAppointments.reduce((groups, appointment) => { const key = dateLabel(appointment.date, { weekday: 'long' }); groups[key] = [...(groups[key] || []), appointment]; return groups; }, {});
  const notificationCount = notifications.todayAppointments.length + notifications.dueNotes.length;
  const activeLoadError = loadErrors[view];
  const resourceLabels = { appointments: 'Appointments', notes: 'Notes' };
  const visibleLoadErrors = view === 'calendar' ? Object.entries(loadErrors).filter(([, error]) => error).map(([resource, error]) => ({ label: resourceLabels[resource], error })) : activeLoadError?.status === 404
    ? Object.entries(loadErrors).filter(([, error]) => error?.status === 404).map(([resource, error]) => ({ label: resourceLabels[resource], error }))
    : activeLoadError ? [{ label: resourceLabels[view], error: activeLoadError }] : [];
  const showAppointments = () => { setAppointmentSearch(''); setAppointmentStatus(''); setView('appointments'); setShowNotifications(false); };
  const addOnDate = (type, date) => {
    if (actionRef.current) return;
    setSelectedDate(date);
    if (type === 'appointment') { setAppointmentForm({ ...appointmentDefaults, date }); setEditingAppointment(null); setAppointmentSearch(''); setAppointmentStatus(''); setView('appointments'); }
    else { setNoteForm({ ...noteDefaults, noteDate: date }); setEditingNote(null); setNoteSearch(''); setShowArchived(false); setView('notes'); }
    window.requestAnimationFrame(() => {
      const form = type === 'appointment' ? appointmentFormRef.current : noteFormRef.current;
      form?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      form?.querySelector('input')?.focus({ preventScroll: true });
    });
  };

  return <div className="admin-planner">
    <div className="planner-workspace-bar">
      <div className="admin-subnav planner-tabs" role="tablist" aria-label="Planner views" onKeyDown={(event) => {
        if (actionRef.current) return;
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const tabs = [...event.currentTarget.querySelectorAll('[role="tab"]')];
        const index = tabs.indexOf(document.activeElement);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        tabs[next]?.focus(); tabs[next]?.click();
      }}>
        <button id="planner-tab-calendar" aria-controls="planner-calendar-panel" tabIndex={view === 'calendar' ? 0 : -1} disabled={Boolean(busy)} type="button" role="tab" aria-selected={view === 'calendar'} className={view === 'calendar' ? 'is-active' : ''} onClick={() => setView('calendar')}><PlannerIcon /><span>Calendar</span></button>
        <button id="planner-tab-appointments" aria-controls="planner-appointments-panel" tabIndex={view === 'appointments' ? 0 : -1} disabled={Boolean(busy)} type="button" role="tab" aria-selected={view === 'appointments'} className={view === 'appointments' ? 'is-active' : ''} onClick={() => setView('appointments')}><PlannerIcon name="clock" /><span>Appointments</span><small>{appointments.length}</small></button>
        <button id="planner-tab-notes" aria-controls="planner-notes-panel" tabIndex={view === 'notes' ? 0 : -1} disabled={Boolean(busy)} type="button" role="tab" aria-selected={view === 'notes'} className={view === 'notes' ? 'is-active' : ''} onClick={() => setView('notes')}><PlannerIcon name="note" /><span>Notes</span><small>{calendarNotes.length}</small></button>
      </div>
      <div className="planner-notifications" ref={notificationRef}>
        <button ref={notificationButton} type="button" className="admin-button is-secondary planner-notification-trigger" disabled={Boolean(busy)} onClick={() => setShowNotifications((open) => !open)} aria-expanded={showNotifications} aria-controls="planner-notifications"><PlannerIcon name="bell" />Notifications{notificationCount > 0 && <span>{notificationCount}</span>}</button>
        {showNotifications && <div id="planner-notifications" className="planner-notification-panel">
          <div className="planner-notification-heading"><div><h3>Today’s activity</h3><p>Appointments and reminders at a glance</p></div><button type="button" aria-label="Close notifications" onClick={() => setShowNotifications(false)}><PlannerIcon name="close" /></button></div>
          {notificationsError && <div className="planner-notification-error" role="alert"><p>Activity could not be refreshed. Displayed details may be out of date.</p><small>{API_HOST} · {notificationsError.status ? `HTTP ${notificationsError.status}` : 'Connection failed'} · {endpoint(notificationsError)}</small>{notificationsError.status === 404 && <p>Deploy the current backend to enable activity summaries.</p>}<button type="button" onClick={load}>Try again</button></div>}
          {!notificationCount && !notificationsError && <p className="planner-notification-empty" role="status">{pending.notifications ? 'Loading activity…' : 'You’re all caught up. Nothing needs attention today.'}</p>}
          {notifications.todayAppointments.map((appointment) => <button type="button" key={appointment._id} className="planner-notification-item" onClick={showAppointments}><span className="planner-notification-symbol"><PlannerIcon /></span><span><strong>{appointment.time} · {appointment.customerName}</strong><small>{appointment.type} · {appointment.status}</small></span><PlannerIcon name="arrow" /></button>)}
          {notifications.dueNotes.map((note) => <button type="button" key={note._id} className="planner-notification-item is-reminder" onClick={() => { setView('notes'); setShowArchived(false); setShowNotifications(false); setNoteSearch(note.title); }}><span className="planner-notification-symbol"><PlannerIcon name="note" /></span><span><strong>{note.title}</strong><small>{note.customerName || note.category} · Reminder due</small></span><PlannerIcon name="arrow" /></button>)}
          {notifications.upcomingNotes.length > 0 && <div className="planner-upcoming-label">Coming up</div>}
          {notifications.upcomingNotes.slice(0, 3).map((note) => <button type="button" key={note._id} className="planner-notification-item" onClick={() => { setShowNotifications(false); editNote(note); }}><span className="planner-notification-symbol"><PlannerIcon name="clock" /></span><span><strong>{note.title}</strong><small>{reminderLabel(note.reminderAt)}</small></span><PlannerIcon name="edit" /></button>)}
          <div className="planner-notification-footer"><span>{notificationsError ? 'Reminder summary unavailable' : `${notifications.upcomingNotes.length} reminder${notifications.upcomingNotes.length === 1 ? '' : 's'} in the next 7 days`}</span><button type="button" onClick={showAppointments}>View appointments</button></div>
        </div>}
      </div>
    </div>

    <div className="planner-context-bar"><span><PlannerIcon name="clock" />Sri Lanka · UTC+05:30</span><span className={`planner-sync-state${notificationsError ? ' is-error' : ''}`} role="status">{notificationsError ? 'Reminders could not refresh' : lastRefreshed ? `${notifications.dueNotes.length} due · Updates every 30 seconds` : 'Connecting reminders…'}</span><details className="planner-reminder-guide"><summary><PlannerIcon name="bell" />How reminders work</summary><div><strong>Your reminders, at the right time</strong><p>Choose a reminder date and time on a note. It appears in Notifications when that Sri Lanka time arrives. Upcoming reminders appear for the next 7 days.</p><p>This workspace refreshes reminders every 30 seconds while visible, and when you return to the tab. These are in-app reminders; email, SMS and background push notifications are not enabled.</p><p>Clear or reschedule a reminder, or archive its note, to remove it from the due list. The calendar date and reminder time can be different.</p></div></details></div>

    {status && <div className={`planner-message is-${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}><PlannerIcon name={status.type === 'error' ? 'bell' : 'check'} /><span>{status.message}</span><button type="button" onClick={() => setStatus(null)} aria-label="Dismiss planner notification"><PlannerIcon name="close" /></button></div>}
    <LoadError errors={visibleLoadErrors} onRetry={load} />

    {view === 'calendar' && <section id="planner-calendar-panel" role="tabpanel" aria-labelledby="planner-tab-calendar"><PlannerCalendar appointments={appointments} notes={calendarNotes} selectedDate={selectedDate} onSelectDate={setSelectedDate} onEditAppointment={editAppointment} onEditNote={editNote} onAddAppointment={(date) => addOnDate('appointment', date)} onAddNote={(date) => addOnDate('note', date)} loading={loading} errors={visibleLoadErrors} /></section>}

    {view === 'appointments' && <div id="planner-appointments-panel" role="tabpanel" aria-labelledby="planner-tab-appointments" className="planner-workspace-grid">
      <form ref={appointmentFormRef} className="admin-panel planner-editor" style={colorStyles(getAppointmentColor(appointmentForm))} onSubmit={(event) => save(event, 'appointment')} aria-label={editingAppointment ? 'Edit appointment' : 'New appointment'}>
        <div className="admin-panel-header planner-editor-heading"><span className="planner-editor-icon"><PlannerIcon /></span><div><h3>{editingAppointment ? 'Edit appointment' : 'New appointment'}</h3><p>{editingAppointment ? 'Update the visit details below.' : 'Organise a visit and keep the details together.'}</p></div></div>
        <fieldset disabled={Boolean(busy)} className="planner-editor-body">
          <Input label="Customer name" name="customerName" value={appointmentForm.customerName} onChange={change(setAppointmentForm)} autoComplete="name" required />
          <div className="planner-form-pair"><Input label="Email" name="email" value={appointmentForm.email} onChange={change(setAppointmentForm)} type="email" autoComplete="email" /><Input label="Phone" name="phone" value={appointmentForm.phone} onChange={change(setAppointmentForm)} type="tel" autoComplete="tel" /></div>
          <div className="planner-form-pair"><Input label="Date" name="date" value={appointmentForm.date} onChange={change(setAppointmentForm)} type="date" required /><Input label="Time" name="time" value={appointmentForm.time} onChange={change(setAppointmentForm)} type="time" required /></div>
          <p className="planner-field-help">Appointment and reminder times are in Sri Lanka (UTC+05:30).</p>
          <div className="planner-form-pair"><Input label="Duration (minutes)" name="durationMinutes" value={appointmentForm.durationMinutes} onChange={change(setAppointmentForm)} type="number" min="15" /><Select label="Appointment type" name="type" value={appointmentForm.type} onChange={changeCategory(setAppointmentForm, 'type')} options={appointmentTypes} /></div>
          <CalendarColour value={appointmentForm.color} defaultColor={getAppointmentColor({ type: appointmentForm.type })} onChange={(color) => setAppointmentForm((current) => ({ ...current, color }))} />
          <Select label="Status" name="status" value={appointmentForm.status} onChange={change(setAppointmentForm)} options={appointmentStatuses} />
          <Textarea label="Purpose / customer request" name="purpose" value={appointmentForm.purpose} onChange={change(setAppointmentForm)} placeholder="What would the customer like to explore?" />
          <Textarea label="Internal notes" name="internalNotes" value={appointmentForm.internalNotes} onChange={change(setAppointmentForm)} placeholder="Details for the team" />
          <div className="planner-form-actions"><button className="admin-button is-primary" type="submit" disabled={Boolean(busy)}>{busy === 'appointment' ? 'Saving…' : editingAppointment ? 'Update appointment' : 'Save appointment'}<PlannerIcon name="check" /></button>{editingAppointment && <button type="button" className="admin-button is-secondary" onClick={() => { setEditingAppointment(null); setAppointmentForm(appointmentDefaults); }}>Cancel</button>}</div>
        </fieldset>
      </form>

      <section className="planner-records" aria-labelledby="planner-appointment-list-title">
        <div className="planner-list-heading"><div><h3 id="planner-appointment-list-title">Appointment schedule</h3><p>{loading ? 'Updating schedule…' : `${filteredAppointments.length} appointment${filteredAppointments.length === 1 ? '' : 's'} in this view`}</p></div><span className="planner-section-icon"><PlannerIcon name="clock" /></span></div>
        <div className="planner-list-filters"><label className="planner-search"><PlannerIcon name="search" /><span className="sr-only">Search appointments</span><input value={appointmentSearch} onChange={(event) => setAppointmentSearch(event.target.value)} placeholder="Customer, phone or email" /></label><select value={appointmentStatus} onChange={(event) => setAppointmentStatus(event.target.value)} aria-label="Filter appointment status"><option value="">All statuses</option>{appointmentStatuses.map((item) => <option key={item}>{item}</option>)}</select></div>
        {loading && !appointments.length ? <div className="planner-loading" role="status">Loading appointments…</div> : <>
          {Object.entries(groupedAppointments).map(([day, dayAppointments]) => <section key={day} className="planner-day"><h4><span />{day}<small>{dayAppointments.length}</small></h4>{dayAppointments.map((appointment) => <article key={appointment._id} className="planner-appointment-card" style={colorStyles(getAppointmentColor(appointment))}>
            <div className="planner-appointment-top"><div className="planner-time-block"><strong>{appointment.time || '—'}</strong><span>{appointment.durationMinutes} min</span></div><div className="planner-customer"><h3>{appointment.customerName}</h3><p>{appointment.type}</p><span>{[appointment.phone, appointment.email].filter(Boolean).join(' · ') || 'No contact details'}</span></div><span className={`admin-badge planner-status is-${String(appointment.status || 'Requested').toLowerCase().replace(/\s+/g, '-')}`}>{appointment.status}</span></div>
            {appointment.purpose && <p className="planner-appointment-purpose">{appointment.purpose}</p>}
            {appointment.internalNotes && <p className="planner-internal-note"><strong>Team note</strong>{appointment.internalNotes}</p>}
            <div className="planner-record-actions"><button type="button" disabled={Boolean(busy) || appointment.status === 'Confirmed'} onClick={() => updateAppointmentStatus(appointment, 'Confirmed')}><PlannerIcon name="check" />Confirm</button><button type="button" disabled={Boolean(busy) || appointment.status === 'Completed'} onClick={() => updateAppointmentStatus(appointment, 'Completed')}>Complete</button><button type="button" disabled={Boolean(busy)} onClick={() => editAppointment(appointment)}><PlannerIcon name="edit" />Edit</button><button type="button" disabled={Boolean(busy)} className="is-danger" onClick={() => remove(`/api/appointments/${appointment._id}`, 'Delete this appointment?', `appointment-${appointment._id}`)}>Delete</button></div>
          </article>)}</section>)}
          {!filteredAppointments.length && !loadErrors.appointments && <EmptyState type="calendar" title="No appointments found">Create an appointment or adjust the search to find a visit.</EmptyState>}
        </>}
      </section>
    </div>}

    {view === 'notes' && <div id="planner-notes-panel" role="tabpanel" aria-labelledby="planner-tab-notes" className="planner-workspace-grid">
      <form ref={noteFormRef} className="admin-panel planner-editor" style={colorStyles(getNoteColor(noteForm))} onSubmit={(event) => save(event, 'note')} aria-label={editingNote ? 'Edit note' : 'New note'}>
        <div className="admin-panel-header planner-editor-heading"><span className="planner-editor-icon"><PlannerIcon name="note" /></span><div><h3>{editingNote ? 'Edit note' : 'New note'}</h3><p>Keep customer details and follow-ups within reach.</p></div></div>
        <fieldset disabled={Boolean(busy)} className="planner-editor-body">
          <Input label="Title" name="title" value={noteForm.title} onChange={change(setNoteForm)} required />
          <Textarea label="Note" name="content" value={noteForm.content} onChange={change(setNoteForm)} required placeholder="Write the details you want to remember" />
          <Select label="Category" name="category" value={noteForm.category} onChange={changeCategory(setNoteForm, 'category')} options={noteCategories} />
          <CalendarColour value={noteForm.color} defaultColor={getNoteColor({ category: noteForm.category })} onChange={(color) => setNoteForm((current) => ({ ...current, color }))} />
          <Input label="Calendar date" name="noteDate" value={noteForm.noteDate} onChange={change(setNoteForm)} type="date" />
          <p className="planner-field-help">Optional. Save this note against a day without setting a reminder.</p>
          <Input label="Customer name" name="customerName" value={noteForm.customerName} onChange={change(setNoteForm)} />
          <Input label="Tags (comma separated)" name="tags" value={noteForm.tags} onChange={change(setNoteForm)} placeholder="e.g. sapphire, follow-up" />
          <Input label="Reminder" name="reminderAt" value={noteForm.reminderAt} onChange={change(setNoteForm)} type="datetime-local" />
          <p className="planner-field-help">Sri Lanka time (UTC+05:30). Appears in Notifications when due; refreshes every 30 seconds while this workspace is visible.</p>
          <label className="planner-check"><input type="checkbox" name="isPinned" checked={Boolean(noteForm.isPinned)} onChange={change(setNoteForm)} /><span><PlannerIcon name="pin" />Pin this note</span></label>
          <div className="planner-form-actions"><button className="admin-button is-primary" type="submit" disabled={Boolean(busy)}>{busy === 'note' ? 'Saving…' : editingNote ? 'Update note' : 'Save note'}<PlannerIcon name="check" /></button>{editingNote && <button type="button" className="admin-button is-secondary" onClick={() => { setEditingNote(null); setNoteForm(noteDefaults); }}>Cancel</button>}</div>
        </fieldset>
      </form>

      <section className="planner-records" aria-labelledby="planner-note-list-title"><div className="planner-list-heading"><div><h3 id="planner-note-list-title">{showArchived ? 'Archived notes' : 'Team notes'}</h3><p>{loading ? 'Updating notes…' : `${filteredNotes.length} note${filteredNotes.length === 1 ? '' : 's'} in this view`}</p></div><span className="planner-section-icon"><PlannerIcon name="note" /></span></div>
        <div className="planner-list-filters planner-note-filters"><label className="planner-search"><PlannerIcon name="search" /><span className="sr-only">Search notes</span><input value={noteSearch} onChange={(event) => setNoteSearch(event.target.value)} placeholder="Notes, tags or customers" /></label><label className="planner-check planner-archive-toggle"><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} /><span>Archived</span></label></div>
        {loading && !notes.length ? <div className="planner-loading" role="status">Loading notes…</div> : <><div className="planner-notes-grid">{filteredNotes.map((note) => <article key={note._id} className="planner-note-card" style={colorStyles(getNoteColor(note))}>
          <div className="planner-note-heading"><span className="planner-note-category">{note.category}</span>{note.isPinned && <span className="planner-pinned"><PlannerIcon name="pin" />Pinned</span>}</div><h3>{note.title}</h3><p className="planner-note-content">{note.content}</p>
          {(note.customerName || note.reminderAt || note.noteDate) && <div className="planner-note-details">{note.customerName && <span>{note.customerName}</span>}{note.noteDate && <span><PlannerIcon name="calendar" />{dateLabel(`${note.noteDate}T12:00:00+05:30`)}</span>}{note.reminderAt && <span><PlannerIcon name="bell" />{reminderLabel(note.reminderAt)}</span>}</div>}
          {array(note.tags).length > 0 && <div className="planner-tags">{note.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}
          <div className="planner-record-actions"><button type="button" disabled={Boolean(busy)} onClick={() => editNote(note)}><PlannerIcon name="edit" />Edit</button><button type="button" disabled={Boolean(busy)} onClick={() => runAction(`note-${note._id}`, () => api(`/api/admin-notes/${note._id}`, { method: 'PUT', body: JSON.stringify({ isPinned: !note.isPinned }) }), note.isPinned ? 'Note unpinned.' : 'Note pinned.')}>{note.isPinned ? 'Unpin' : 'Pin'}</button><button type="button" disabled={Boolean(busy)} onClick={() => runAction(`note-${note._id}`, () => api(`/api/admin-notes/${note._id}`, { method: 'PUT', body: JSON.stringify({ isArchived: !note.isArchived }) }), note.isArchived ? 'Note restored.' : 'Note archived.')}><PlannerIcon name="archive" />{note.isArchived ? 'Restore' : 'Archive'}</button><button type="button" disabled={Boolean(busy)} className="is-danger" onClick={() => remove(`/api/admin-notes/${note._id}`, 'Delete this note?', `note-${note._id}`)}>Delete</button></div>
        </article>)}</div>{!filteredNotes.length && !loadErrors.notes && <EmptyState type="note" title={showArchived ? 'No archived notes' : 'Your notes, in one place'}>{showArchived ? 'Archived notes will appear here when you save them for later.' : 'Create a note to keep track of a customer, gemstone or follow-up.'}</EmptyState>}</>}
      </section>
    </div>}
  </div>;
}
