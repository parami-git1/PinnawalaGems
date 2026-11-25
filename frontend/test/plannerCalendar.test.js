import assert from 'node:assert/strict';
import test from 'node:test';
import { addDays, colorHex, colorStyles, dayKey, getAppointmentColor, getNoteColor, noteDayKey, validDateKey } from '../src/plannerCalendarUtils.js';

test('calendar days remain literal dates and reject rollover dates', () => {
  assert.equal(dayKey('2026-11-25'), '2026-11-25');
  assert.equal(validDateKey('2028-02-29'), '2028-02-29');
  for (const value of ['2026-02-29', '2026-02-30', '2026-13-01', '2026-04-31']) {
    assert.equal(validDateKey(value), '');
    assert.equal(dayKey(value), '');
  }
});

test('timestamps use Sri Lanka day boundaries regardless of browser timezone', () => {
  assert.equal(dayKey('2026-11-24T18:29:59.999Z'), '2026-11-24');
  assert.equal(dayKey('2026-11-24T18:30:00.000Z'), '2026-11-25');
  assert.equal(dayKey('2026-11-25T18:30:00.000Z'), '2026-11-26');
});

test('note calendar dates are independent of reminders and created timestamps', () => {
  assert.equal(noteDayKey({ noteDate: '2026-11-26', reminderAt: '2026-11-27T04:30:00Z' }), '2026-11-26');
  assert.equal(noteDayKey({ reminderAt: '2026-11-25T19:00:00Z' }), '2026-11-26');
  assert.equal(noteDayKey({ createdAt: '2026-11-25T09:00:00Z' }), '');
  assert.equal(noteDayKey({ noteDate: '', reminderAt: null }), '');
});

test('keyboard date arithmetic crosses month, leap day and year boundaries', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2027-01-01', -1), '2026-12-31');
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(addDays('2028-02-29', 1), '2028-03-01');
  assert.equal(addDays('2026-02-30', 1), '');
});

test('category defaults, arbitrary hex colours and legacy note colours coexist', () => {
  assert.notEqual(getAppointmentColor({ type: 'Viewing' }), getAppointmentColor({ type: 'Workshop' }));
  assert.notEqual(getNoteColor({ category: 'Task' }), getNoteColor({ category: 'General' }));
  assert.equal(getAppointmentColor({ type: 'Viewing', color: '#fE42a9' }), '#FE42A9');
  assert.equal(getNoteColor({ category: 'Task', color: 'rose' }), '#B34F70');
  assert.equal(getAppointmentColor({ type: 'Workshop', color: '' }), '#BA741F');
});

test('malformed colours and inherited property names never become CSS values', () => {
  for (const value of ['__proto__', 'constructor', 'toString', 'red', '#fff', '#000000;background:red', 'url(https://invalid.test)']) {
    assert.equal(colorHex(value), '#66758B');
    assert.equal(colorStyles(value)['--event-color'], '#66758B');
  }
  assert.equal(getAppointmentColor({ type: '__proto__' }), '#66758B');
  assert.equal(getNoteColor({ category: 'constructor' }), '#66758B');
});

test('even white custom accents retain a dark readable foreground', () => {
  const style = colorStyles('#ffffff');
  assert.equal(style['--event-color'], '#FFFFFF');
  assert.equal(style['--event-wash'], 'rgb(255 255 255)');
  assert.equal(style['--event-ink'], 'rgb(102 102 102)');
});
