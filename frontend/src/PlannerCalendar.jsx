import { useId, useMemo, useRef, useState } from 'react';
import './PlannerCalendar.css';
import { addDays, APPOINTMENT_COLORS, appointmentTypes, colorStyles, dayKey, getAppointmentColor, getNoteColor, noteDayKey, readableDate, todayKey, validDateKey } from './plannerCalendarUtils';

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const records = (value) => Array.isArray(value) ? value : [];

function CalendarIcon({ name = 'calendar' }) {
  const paths = {
    calendar: 'M5 5h14v16H5V5Zm3-3v6m8-6v6M5 11h14m-10 4h2m2 0h2',
    previous: 'm14 6-6 6 6 6',
    next: 'm10 6 6 6-6 6',
    plus: 'M12 5v14M5 12h14',
    note: 'M5 3h14v18H5V3Zm4 5h6m-6 4h6m-6 4h4',
    clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2',
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

function monthDays(month) {
  const first = `${month}-01`;
  const offset = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7;
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function monthOffset(month, delta) {
  const date = new Date(`${month}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + delta);
  return date.toISOString().slice(0, 7);
}

export default function PlannerCalendar({ appointments = [], notes = [], selectedDate, onSelectDate, onEditAppointment, onEditNote, onAddAppointment, onAddNote, loading = false, errors = [] }) {
  const today = todayKey();
  const selected = validDateKey(selectedDate) || today;
  const [month, setMonth] = useState(() => selected.slice(0, 7));
  const titleId = useId();
  const detailsId = useId();
  const dayButtons = useRef(new Map());
  const days = monthDays(month);
  const monthLabel = new Date(`${month}-01T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', month: 'long', year: 'numeric' });
  const dayItems = useMemo(() => {
    const grouped = new Map();
    const add = (key, item) => { if (key) grouped.set(key, [...(grouped.get(key) || []), item]); };
    records(appointments).forEach((appointment) => add(dayKey(appointment.date), { kind: 'appointment', record: appointment, color: getAppointmentColor(appointment) }));
    records(notes).filter((note) => !note.isArchived).forEach((note) => add(noteDayKey(note), { kind: 'note', record: note, color: getNoteColor(note) }));
    for (const items of grouped.values()) items.sort((a, b) => a.kind.localeCompare(b.kind) || String(a.record.time || '').localeCompare(String(b.record.time || '')));
    return grouped;
  }, [appointments, notes]);
  const selectedItems = dayItems.get(selected) || [];
  const selectedAppointments = selectedItems.filter((item) => item.kind === 'appointment');
  const selectedNotes = selectedItems.filter((item) => item.kind === 'note');
  const scheduledAppointments = [...dayItems].filter(([key]) => key.startsWith(month)).reduce((total, [, items]) => total + items.filter((item) => item.kind === 'appointment').length, 0);
  const scheduledNotes = [...dayItems].filter(([key]) => key.startsWith(month)).reduce((total, [, items]) => total + items.filter((item) => item.kind === 'note').length, 0);
  const undatedNotes = records(notes).filter((note) => !note.isArchived && !noteDayKey(note)).length;
  const focusDay = (key) => window.requestAnimationFrame(() => dayButtons.current.get(key)?.focus());
  const chooseDay = (key, focus = false) => { onSelectDate?.(key); if (!key.startsWith(month)) setMonth(key.slice(0, 7)); if (focus) focusDay(key); };
  const dayKeyDown = (event, key) => {
    const weekday = (new Date(`${key}T12:00:00Z`).getUTCDay() + 6) % 7;
    const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -weekday, End: 6 - weekday };
    if (Object.hasOwn(offsets, event.key)) { event.preventDefault(); chooseDay(addDays(key, offsets[event.key]), true); }
    else if (event.key === 'PageUp' || event.key === 'PageDown') { event.preventDefault(); const target = `${monthOffset(key.slice(0, 7), event.key === 'PageUp' ? -1 : 1)}-01`; chooseDay(target, true); }
  };
  const hasError = records(errors).length > 0;

  return <section className="planner-calendar" aria-labelledby={titleId} aria-busy={loading}>
    <div className="planner-calendar-toolbar">
      <div className="planner-calendar-title"><span><CalendarIcon /></span><div><h3 id={titleId} aria-live="polite">{monthLabel}</h3><p>{scheduledAppointments} appointment{scheduledAppointments === 1 ? '' : 's'}<span aria-hidden="true"> · </span>{scheduledNotes} note{scheduledNotes === 1 ? '' : 's'}</p></div></div>
      <div className="planner-calendar-navigation"><button type="button" className="planner-calendar-today" onClick={() => { setMonth(today.slice(0, 7)); onSelectDate?.(today); }}>Today</button><button type="button" aria-label="Previous month" onClick={() => setMonth(monthOffset(month, -1))}><CalendarIcon name="previous" /></button><button type="button" aria-label="Next month" onClick={() => setMonth(monthOffset(month, 1))}><CalendarIcon name="next" /></button></div>
    </div>

    <div className="planner-calendar-legend" aria-label="Default appointment category colours">{appointmentTypes.map((type) => <span key={type} style={colorStyles(APPOINTMENT_COLORS[type])}><i aria-hidden="true" />{type}</span>)}<span className="planner-calendar-note-key"><CalendarIcon name="note" />Notes</span></div>
    <p className="planner-calendar-guidance">Choose a day to see its appointments and notes. All times are in Sri Lanka.</p>
    {loading && <p className="planner-calendar-sync" role="status">Refreshing your calendar…</p>}
    {hasError && <p className="planner-calendar-warning" role="status">Some planner details could not refresh. Check the message above before relying on this calendar.</p>}

    <table className="planner-calendar-month" aria-label={`${monthLabel} appointments and notes`}>
      <thead><tr>{weekdays.map((day) => <th scope="col" key={day}>{day}</th>)}</tr></thead>
      <tbody>{Array.from({ length: 6 }, (_, week) => <tr key={week}>{days.slice(week * 7, week * 7 + 7).map((key) => {
        const items = dayItems.get(key) || [];
        const appointmentCount = items.filter((item) => item.kind === 'appointment').length;
        const noteCount = items.length - appointmentCount;
        const isSelected = key === selected;
        const outside = !key.startsWith(month);
        return <td key={key}><button type="button" ref={(node) => { if (node) dayButtons.current.set(key, node); else dayButtons.current.delete(key); }} className={`planner-calendar-day${outside ? ' is-outside' : ''}${isSelected ? ' is-selected' : ''}${key === today ? ' is-today' : ''}`} tabIndex={isSelected || (!selected.startsWith(month) && key === `${month}-01`) ? 0 : -1} aria-label={`${readableDate(key, { year: 'numeric' })}, ${appointmentCount} appointment${appointmentCount === 1 ? '' : 's'}, ${noteCount} note${noteCount === 1 ? '' : 's'}`} aria-pressed={isSelected} aria-current={key === today ? 'date' : undefined} aria-controls={detailsId} onClick={() => chooseDay(key)} onKeyDown={(event) => dayKeyDown(event, key)}>
          <span className="planner-calendar-day-number">{Number(key.slice(8))}</span>
          <span className="planner-calendar-day-events" aria-hidden="true">{items.slice(0, 2).map((item) => <span key={`${item.kind}-${item.record._id}`} className={`planner-calendar-event${item.kind === 'note' ? ' is-note' : ''}${['Cancelled', 'No-show'].includes(item.record.status) ? ' is-inactive' : ''}`} style={colorStyles(item.color)}><i />{item.kind === 'note' ? <CalendarIcon name="note" /> : null}<span>{item.kind === 'appointment' ? `${item.record.time || ''} ${item.record.customerName}` : item.record.title}</span></span>)}{items.length > 2 && <span className="planner-calendar-more">+{items.length - 2} more</span>}</span>
          {items.length > 0 && <span className="planner-calendar-mobile-events" aria-hidden="true"><span>{items.slice(0, 4).map((item) => <i key={`${item.kind}-${item.record._id}`} className={item.kind === 'note' ? 'is-note' : ''} style={colorStyles(item.color)} />)}</span><small>{items.length}</small></span>}
        </button></td>;
      })}</tr>)}</tbody>
    </table>

    <div className="planner-calendar-details" id={detailsId}>
      <div className="planner-calendar-selected-heading"><div><p>Selected day</p><h4>{readableDate(selected, { year: 'numeric' })}</h4></div><span>{selectedItems.length} item{selectedItems.length === 1 ? '' : 's'}</span></div>
      <div className="planner-calendar-day-columns">
        <section className="planner-calendar-agenda" aria-label="Selected day appointments"><div className="planner-calendar-agenda-heading"><h5><CalendarIcon />Appointments <span>{selectedAppointments.length}</span></h5>{onAddAppointment && <button type="button" aria-label="Add appointment for selected day" onClick={() => onAddAppointment(selected)}><CalendarIcon name="plus" />Add</button>}</div>
          {!selectedAppointments.length && <div className="planner-calendar-day-empty"><CalendarIcon /><p>{loading ? 'Loading appointments…' : hasError ? 'Appointments may be unavailable.' : 'No appointments for this day.'}</p>{!loading && !hasError && <small>A clear day for your next booking.</small>}</div>}
          {selectedAppointments.map(({ record, color }) => <article className={`planner-calendar-agenda-card${['Cancelled', 'No-show'].includes(record.status) ? ' is-inactive' : ''}`} key={record._id} style={colorStyles(color)}><div className="planner-calendar-agenda-meta"><strong><CalendarIcon name="clock" />{record.time || 'Time not set'}</strong><span>{record.durationMinutes || 60} min</span></div><h6>{record.customerName}</h6><p className="planner-calendar-card-category">{record.type} <span>· {record.status}</span></p>{record.purpose && <p className="planner-calendar-card-body">{record.purpose}</p>}{(record.phone || record.email) && <p className="planner-calendar-card-contact">{record.phone || record.email}</p>}{onEditAppointment && <button type="button" onClick={() => onEditAppointment(record)}>View / edit appointment</button>}</article>)}
        </section>
        <section className="planner-calendar-agenda" aria-label="Selected day notes"><div className="planner-calendar-agenda-heading"><h5><CalendarIcon name="note" />Notes <span>{selectedNotes.length}</span></h5>{onAddNote && <button type="button" aria-label="Add note for selected day" onClick={() => onAddNote(selected)}><CalendarIcon name="plus" />Add</button>}</div>
          {!selectedNotes.length && <div className="planner-calendar-day-empty"><CalendarIcon name="note" /><p>{loading ? 'Loading notes…' : hasError ? 'Notes may be unavailable.' : 'No notes for this day.'}</p>{!loading && !hasError && <small>Keep the details alongside your schedule.</small>}</div>}
          {selectedNotes.map(({ record, color }) => <article className="planner-calendar-agenda-card is-note" key={record._id} style={colorStyles(color)}><div className="planner-calendar-agenda-meta"><strong>{record.category}</strong>{record.isPinned && <span>Pinned</span>}</div><h6>{record.title}</h6><p className="planner-calendar-card-body">{record.content}</p>{record.customerName && <p className="planner-calendar-card-contact">{record.customerName}</p>}{record.reminderAt && <p className="planner-calendar-card-reminder"><CalendarIcon name="clock" />Reminder {new Date(record.reminderAt).toLocaleString('en-GB', { timeZone: 'Asia/Colombo', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>}{onEditNote && <button type="button" onClick={() => onEditNote(record)}>View / edit note</button>}</article>)}
        </section>
      </div>
      {undatedNotes > 0 && <p className="planner-calendar-undated">{undatedNotes} undated note{undatedNotes === 1 ? '' : 's'} in your notes list. Add a note date or reminder to include {undatedNotes === 1 ? 'it' : 'them'} in the calendar.</p>}
    </div>
  </section>;
}
