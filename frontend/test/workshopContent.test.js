import assert from 'node:assert/strict';
import test from 'node:test';
import { isDateKey, sriLankaInstant, sriLankaInput, normalizeWorkshopPhone, safeWorkshopLocationUrl, workshopContactLinks, workshopPublication, workshopEventLabel } from '../src/workshopContent.js';

test('workshop schedules round-trip Sri Lanka midnight without the browser timezone', () => {
  assert.equal(sriLankaInstant('2026-11-26T00:00'), '2026-11-25T18:30:00.000Z');
  assert.equal(sriLankaInput('2026-11-25T18:30:00.000Z'), '2026-11-26T00:00');
  assert.equal(sriLankaInput('2026-11-25T04:30:00Z'), '2026-11-25T10:00');
});
test('impossible dates and times cannot silently roll into a valid scheduled instant', () => {
  assert(isDateKey('2028-02-29'));
  for (const value of ['2026-02-29', '2026-13-01', '2026-04-31']) assert.equal(isDateKey(value), false);
  for (const value of ['2026-02-30T10:00', '2026-11-25T24:00', '2026-11-25T10:60', '', 'invalid']) assert.equal(sriLankaInstant(value), '');
});
test('local and international numbers produce safe call and WhatsApp actions', () => {
  assert.equal(normalizeWorkshopPhone('077 830 7334'), '+94778307334');
  assert.equal(normalizeWorkshopPhone('0094 (77) 830-7334'), '+94778307334');
  assert.equal(normalizeWorkshopPhone('+1 (212) 555-0199'), '+12125550199');
  const links = workshopContactLinks({ title: 'Sapphire cutting', phoneNumber: '0769254499', whatsappNumber: '+94778307334' });
  assert.equal(links.call, 'tel:+94769254499');
  const chat = new URL(links.whatsapp);
  assert.equal(chat.origin + chat.pathname, 'https://wa.me/94778307334');
  assert.match(chat.searchParams.get('text'), /Workshop: Sapphire cutting/);
  assert.match(chat.searchParams.get('text'), /confirm availability, fees and how to book/);
});
test('malformed contact numbers cannot become external URL or tel actions', () => {
  for (const value of ['javascript:alert(1)', '+94++778307334', '0778307334?message=bad', '123', '+0123456789', 'wa.me/94778307334']) assert.equal(normalizeWorkshopPhone(value), '');
  assert.deepEqual(workshopContactLinks({ phoneNumber: 'bad', whatsappNumber: 'javascript:bad' }), { call: '', whatsapp: '' });
});
test('location links allow full web links and reject injected or credential-bearing URLs', () => {
  assert.equal(safeWorkshopLocationUrl('https://maps.app.goo.gl/example'), 'https://maps.app.goo.gl/example');
  for (const value of ['javascript:alert(1)', '//maps.google.com', '/maps', 'https://name:secret@example.test/map', 'https://example.test/\\evil', 'https://example.test/\nmap']) assert.equal(safeWorkshopLocationUrl(value), '');
});
test('legacy posts stay published while drafts and future schedules stay separate', () => {
  const now = Date.parse('2026-11-25T09:00:00Z');
  assert.equal(workshopPublication({}, now), 'published');
  assert.equal(workshopPublication({ publicationStatus: 'draft' }, now), 'draft');
  assert.equal(workshopPublication({ publicationStatus: 'scheduled', publishAt: '2026-11-25T09:00:00Z' }, now), 'published');
  assert.equal(workshopPublication({ publicationStatus: 'scheduled', publishAt: '2026-11-25T09:00:01Z' }, now), 'scheduled');
  assert.equal(workshopPublication({ publicationStatus: 'scheduled', publishAt: 'invalid' }, now), 'scheduled');
});
test('event dates remain independent from publishing and optional time is explicit', () => {
  assert.equal(workshopEventLabel({ eventDate: '2026-12-01', eventTime: '14:30', publishAt: '2026-11-25T09:00:00Z' }), '1 Dec 2026 · 14:30 (Sri Lanka)');
  assert.equal(workshopEventLabel({ eventDate: '2026-12-01' }), '1 Dec 2026');
  assert.equal(workshopEventLabel({ eventDate: '2026-02-30', eventTime: '10:00' }), '');
});
