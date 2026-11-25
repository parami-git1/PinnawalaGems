import assert from 'node:assert/strict';
import test from 'node:test';
import { gemDetailUrl, gemInquiryMessage, gemWhatsAppUrl } from '../src/gemInquiry.js';
const gem = { _id: '507f1f77bcf86cd799439011', stoneId: 'blue-sapphire-507f1f77bcf86cd799439011', title: 'Royal Blue Sapphire', weight: '2.45 ct', color: 'Blue', shape: 'Oval', cut: 'Mixed', origin: 'Sri Lanka', hasCertificate: true };
test('gem inquiry carries readable details and one canonical item deep link', () => {
  const text = gemInquiryMessage(gem, 'https://pinnawala-gems.vercel.app/catalog?search=blue');
  assert.match(text, /Royal Blue Sapphire/); assert.match(text, /Gem ID: blue-sapphire/);
  assert.match(text, /Weight: 2.45 ct/); assert(!text.includes('ct ct'));
  assert.match(text, /Colour: Blue/); assert.match(text, /Cut: Mixed/);
  assert(text.includes('https://pinnawala-gems.vercel.app/gem/507f1f77bcf86cd799439011'));
  assert(!text.includes('?search='));
});
test('WhatsApp URL round-trips multiline Unicode details and the complete item link', () => {
  const item = { ...gem, title: 'Sapphire & Ruby / විශේෂ' };
  const url = new URL(gemWhatsAppUrl(item, '+94 77 830 7334', 'https://gems.example.test'));
  assert.equal(url.origin + url.pathname, 'https://wa.me/94778307334');
  assert.equal(url.searchParams.get('text'), gemInquiryMessage(item, 'https://gems.example.test'));
  assert(url.searchParams.get('text').includes('https://gems.example.test/gem/' + gem._id));
});
test('link creation cannot inject paths, credentials, protocols or arbitrary WhatsApp recipients', () => {
  assert.equal(gemDetailUrl({ _id: '../admin' }), '');
  assert.equal(gemDetailUrl(gem, 'javascript:bad'), 'https://pinnawala-gems.vercel.app/gem/' + gem._id);
  assert.equal(gemDetailUrl(gem, 'https://name:password@foreign.test'), 'https://pinnawala-gems.vercel.app/gem/' + gem._id);
  assert.equal(new URL(gemWhatsAppUrl(gem, 'bad?recipient=123')).pathname, '/94778307334');
  assert(!gemInquiryMessage({ ...gem, weight: '', color: undefined }).includes('undefined'));
});
