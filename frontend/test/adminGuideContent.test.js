import test from 'node:test';
import assert from 'node:assert/strict';
import { GUIDE_DESTINATIONS, GUIDE_TOPICS, guideDestinationHref, searchGuideTopics } from '../src/admin/adminGuideContent.js';

test('every guide topic and related shortcut resolves without a missing article or workspace', () => {
  const ids = new Set(GUIDE_TOPICS.map(topic => topic.id));
  assert.equal(ids.size, GUIDE_TOPICS.length);
  for (const topic of GUIDE_TOPICS) {
    assert(topic.blocks.length && topic.blocks.every(block => block.steps.length));
    assert(topic.related.every(id => ids.has(id)), topic.id);
    for (const key of topic.destinations) assert(Object.hasOwn(GUIDE_DESTINATIONS, key), `${topic.id}: ${key}`);
  }
  const covered = new Set(GUIDE_TOPICS.flatMap(topic => topic.destinations));
  assert.deepEqual([...covered].sort(), Object.keys(GUIDE_DESTINATIONS).sort());
});

test('workspace shortcuts stay on the configured portal and preserve the intended subpanel', () => {
  for (const key of Object.keys(GUIDE_DESTINATIONS)) {
    const href = guideDestinationHref('/workspace/custom/owner', key);
    const url = new URL(href, 'https://example.test');
    assert.equal(url.origin, 'https://example.test');
    assert.equal(url.pathname, '/workspace/custom/owner');
    assert.equal(url.searchParams.get('view'), GUIDE_DESTINATIONS[key].view);
    assert.equal(url.searchParams.has('topic'), false);
  }
  assert.equal(guideDestinationHref('/workspace/custom', 'notes'), '/workspace/custom?view=planner&section=notes');
  assert.equal(guideDestinationHref('/workspace/custom', 'contact'), '/workspace/custom?view=settings&section=contact');
  assert.equal(guideDestinationHref('/workspace/custom', 'stock'), '/workspace/custom?view=operations&section=stock');
});

test('unknown destinations and malformed portal paths cannot create a guide navigation URL', () => {
  for (const key of ['https://example.test', 'constructor', '__proto__', '../inventory', '']) assert.throws(() => guideDestinationHref('/workspace/owner', key));
  for (const portal of ['//example.test', 'https://example.test/workspace/owner', '/workspace/owner?x=1', '/workspace/../public', '/workspace/owner#test', '/']) assert.throws(() => guideDestinationHref(portal, 'inventory'));
});

test('guide search finds instructions inside articles and treats punctuation as literal text', () => {
  assert.equal(searchGuideTopics('  ').length, GUIDE_TOPICS.length);
  assert(searchGuideTopics('certificate').some(topic => topic.id === 'media'));
  assert(searchGuideTopics('  reminder  timestamp ').some(topic => topic.id === 'notes'));
  assert(searchGuideTopics('24-hour').some(topic => topic.id === 'sold-gems'));
  assert.deepEqual(searchGuideTopics('.*'), []);
  assert.deepEqual(searchGuideTopics('a topic that does not exist 128473'), []);
});
