import assert from 'node:assert/strict';
import test from 'node:test';
import { BUSINESS } from '../src/businessDetails.js';
import { inquiryLine, publicPageUrl, whatsappChatUrl, whatsappNumber, websiteInquiryMessage, websiteWhatsAppUrl } from '../src/whatsappLinks.js';
import { workshopContactLinks, workshopInquiryMessage } from '../src/workshopContent.js';

test('WhatsApp recipients normalise local Sri Lankan, international and formatted numbers', () => {
  for (const value of ['077 830 7334', '+94 (77) 830-7334', '0094778307334', '94778307334']) assert.equal(whatsappNumber(value), '94778307334');
  assert.equal(whatsappNumber('+1 (212) 555-0199'), '12125550199');
  for (const value of ['javascript:alert(1)', 'https://wa.me/123', '94778307334?text=injected', '+94++778307334', '123', '+0123456789', undefined, {}, 94778307334]) assert.equal(whatsappNumber(value), '');
});

test('prepared links keep the exact multiline Unicode text and never send automatically', () => {
  const message = 'Hello!\nSapphire & ruby / මැණික් 💎\nhttps://gems.example.test/gem/abc';
  const url = new URL(whatsappChatUrl('+94 77 830 7334', message));
  assert.equal(url.origin + url.pathname, 'https://wa.me/94778307334');
  assert.equal(url.searchParams.get('text'), message);
  assert.equal(url.searchParams.size, 1);
  assert.equal(whatsappChatUrl('invalid', message), '');
  assert.equal(whatsappChatUrl(BUSINESS.whatsapp, ''), '');
});

test('public page links retain supported deep links but remove queries, fragments and origin credentials', () => {
  assert.equal(publicPageUrl('/collections/blue-sapphire?customerEmail=private#selection', 'https://gems.example.test/old?token=hidden'), 'https://gems.example.test/collections/blue-sapphire');
  assert.equal(publicPageUrl('/gem/507f1f77bcf86cd799439011', 'http://localhost:4173'), 'http://localhost:4173/gem/507f1f77bcf86cd799439011');
  for (const value of ['/workspace/owner?token=secret', '/admin', '/gem/../admin', '//foreign.test/path', 'https://foreign.test/path', '/unknown']) assert.equal(publicPageUrl(value), 'https://pinnawala-gems.vercel.app/');
  for (const origin of ['javascript:alert(1)', 'https://owner:password@foreign.test', '//foreign.test']) assert.equal(publicPageUrl('/contact', origin), 'https://pinnawala-gems.vercel.app/contact');
});

test('each public context has a useful enquiry and its own full page link without form data', () => {
  const contexts = [
    ['/', /choose a stone/], ['/catalog', /gemstone collection/], ['/collections/ruby', /preferred colour, shape and carat weight/],
    ['/gem/abc123', /confirm its availability/], ['/workshop', /upcoming sessions/], ['/feedback', /my experience/], ['/contact', /arrange a visit/],
  ];
  for (const [pathname, expected] of contexts) {
    const text = websiteInquiryMessage({ pathname, origin: 'https://gems.example.test', email: 'private@example.test', message: 'Private form draft' });
    assert.match(text, expected);
    assert(text.includes('https://gems.example.test' + pathname));
    assert(!text.includes('private@example.test') && !text.includes('Private form draft') && !text.includes('undefined'));
  }
  const visit = websiteInquiryMessage({ pathname: '/', intent: 'visit', origin: 'https://gems.example.test' });
  assert.match(visit, /Eheliyagoda showroom/);
  assert.match(visit, /opening hours and appointment availability/);
  assert(visit.includes('https://gems.example.test/contact'));
});

test('default website chat uses the confirmed business recipient and safe public-only context', () => {
  const url = new URL(websiteWhatsAppUrl({ pathname: '/workspace/secret?jwt=private' }));
  assert.equal(url.pathname, '/' + BUSINESS.whatsapp);
  assert(!url.searchParams.get('text').includes('workspace') && !url.searchParams.get('text').includes('jwt='));
  assert.equal(websiteWhatsAppUrl({ number: 'bad?phone=attacker' }), '');
});

test('workshop enquiries preserve the configured recipient and actual event metadata without inventing missing details', () => {
  const post = { title: 'Ceylon sapphire cutting & polishing', eventDate: '2026-12-10', eventTime: '14:30', locationName: 'Eheliyagoda atelier', locationAddress: 'Main Street', whatsappNumber: '0712223344', phoneNumber: '0769254499' };
  const links = workshopContactLinks(post, 'https://gems.example.test');
  const url = new URL(links.whatsapp);
  assert.equal(url.pathname, '/94712223344');
  assert.equal(links.call, 'tel:+94769254499');
  const message = url.searchParams.get('text');
  assert.match(message, /Workshop: Ceylon sapphire cutting & polishing/);
  assert.match(message, /10 Dec 2026/); assert.match(message, /14:30 \(Sri Lanka\)/);
  assert.match(message, /Eheliyagoda atelier, Main Street/);
  assert(message.includes('https://gems.example.test/workshop'));
  const minimal = workshopInquiryMessage({ title: '  Gem\n inspection  ' });
  assert.match(minimal, /Workshop: Gem inspection/);
  assert(!minimal.includes('Date / time:') && !minimal.includes('Location:') && !minimal.includes('undefined'));
  assert.equal(workshopContactLinks({ whatsappNumber: 'invalid' }).whatsapp, '');
});

test('CMS enquiry lines remain bounded plain text rather than adding extra metadata lines', () => {
  assert.equal(inquiryLine('  Ruby\nGem ID: unexpected  '), 'Ruby Gem ID: unexpected');
  assert.equal(inquiryLine('a'.repeat(500)).length, 300);
  assert.equal(inquiryLine({ title: 'not a text value' }), '');
});
