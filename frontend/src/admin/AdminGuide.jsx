import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ADMIN_PORTAL_PATH } from '../adminPaths';
import { AdminIcon } from './AdminUI';
import GuideIllustration from './AdminGuideIllustration';
import { GUIDE_DESTINATIONS, GUIDE_TOPICS, guideDestinationHref, searchGuideTopics } from './adminGuideContent';
import './AdminGuide.css';

const topicHref = id => `${ADMIN_PORTAL_PATH}?view=guide&topic=${encodeURIComponent(id)}`;

function WorkspaceLink({ destination, className = '', children }) {
  return <Link className={className} to={guideDestinationHref(ADMIN_PORTAL_PATH, destination)} onClick={event => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) window.scrollTo({ top: 0, behavior: 'instant' }); }}><AdminIcon name="external" size={16} />{children || GUIDE_DESTINATIONS[destination].label}</Link>;
}

export default function AdminGuide() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const topic = GUIDE_TOPICS.find(item => item.id === params.get('topic')) || GUIDE_TOPICS[0];
  const results = useMemo(() => searchGuideTopics(query), [query]);
  const groups = useMemo(() => [...new Set(results.map(item => item.group))], [results]);
  const heading = useRef(null);
  const picker = useRef(null);
  const previousTopic = useRef(topic.id);
  const currentIndex = GUIDE_TOPICS.indexOf(topic);
  const previous = GUIDE_TOPICS[currentIndex - 1];
  const next = GUIDE_TOPICS[currentIndex + 1];
  const estimatedMinutes = Math.max(2, Math.ceil([topic.intro, ...topic.blocks.flatMap(item => item.steps)].join(' ').split(/\s+/).length / 180));
  const scrollToArticle = () => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  useEffect(() => {
    if (previousTopic.current !== topic.id) {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
      previousTopic.current = topic.id;
    }
  }, [topic.id]);
  const chooseTopic = id => {
    setQuery('');
    setParams(previousParams => {
      const nextParams = new URLSearchParams(previousParams);
      nextParams.set('view', 'guide'); nextParams.set('topic', id); nextParams.delete('section');
      return nextParams;
    });
    if (id === topic.id) scrollToArticle();
  };
  const backToTopics = () => {
    const target = picker.current?.getClientRects().length ? picker.current : document.getElementById('admin-guide-search');
    target?.focus({ preventScroll: true });
    document.getElementById('admin-guide-topics')?.scrollIntoView({ block: 'start', behavior: 'instant' });
  };

  return <div className="admin-guide">
    <section className="admin-guide-welcome" aria-labelledby="admin-guide-welcome-title">
      <div className="admin-guide-welcome-copy"><span className="admin-guide-kicker"><AdminIcon name="book" size={16} />THE WORKSPACE HANDBOOK</span><h2 id="admin-guide-welcome-title">Your workspace,<br /><em>clearly explained.</em></h2><p>Find the right tool, follow the steps and get back to your work. Every guide includes a direct shortcut to its workspace.</p><div className="admin-guide-welcome-actions"><button type="button" onClick={() => chooseTopic('getting-started')}><AdminIcon name="book" size={17} />Start with the essentials</button><span>{GUIDE_TOPICS.length} practical topics</span></div></div>
      <GuideIllustration kind="workspace" className="admin-guide-welcome-art" />
    </section>

    <div className="admin-guide-quicklinks" aria-label="Frequently used workspaces">
      {[['inventory', 'gem', 'Gem inventory', 'Public gemstones & galleries'], ['calendar', 'calendar', 'Calendar', 'Appointments, notes & reminders'], ['workshop', 'image', 'Workshop posts', 'Stories, events & publication']].map(([destination, icon, title, description]) => <WorkspaceLink key={destination} destination={destination} className="admin-guide-quicklink"><span className="admin-guide-quicklink-icon"><AdminIcon name={icon} size={21} /></span><span><strong>{title}</strong><small>{description}</small></span></WorkspaceLink>)}
    </div>

    <div className="admin-guide-layout">
      <aside id="admin-guide-topics" className={`admin-guide-sidebar${query.trim() ? ' has-search' : ''}`} aria-label="Guide contents">
        <div className="admin-guide-sidebar-heading"><span>FIND A TOPIC</span><AdminIcon name="book" size={18} /></div>
        <label className="admin-guide-search" htmlFor="admin-guide-search"><AdminIcon name="search" size={18} /><span className="sr-only">Search the guide</span><input id="admin-guide-search" type="search" value={query} onChange={event => setQuery(event.target.value)} maxLength={100} placeholder="Try certificates or reminders" /></label>
        <p className="admin-guide-result-count" role="status">{query.trim() ? `${results.length} ${results.length === 1 ? 'topic' : 'topics'} found` : 'Choose what you want to do'}</p>
        <label className="admin-guide-topic-picker"><span>Choose a topic</span><select ref={picker} value={topic.id} onChange={event => chooseTopic(event.target.value)}>{GUIDE_TOPICS.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <nav className="admin-guide-topic-groups" aria-label="Guide topics">{groups.map(group => <div key={group}><h3>{group}</h3>{results.filter(item => item.group === group).map(item => <Link key={item.id} to={topicHref(item.id)} aria-current={topic.id === item.id ? 'page' : undefined} onClick={() => { setQuery(''); if (topic.id === item.id) scrollToArticle(); }}><AdminIcon name={item.icon} size={17} /><span>{item.title}</span></Link>)}</div>)}</nav>
        {!results.length && <div className="admin-guide-no-results"><AdminIcon name="search" size={25} /><strong>No matching topics</strong><p>Try a shorter task or another keyword.</p><button type="button" onClick={() => setQuery('')}>Clear search</button></div>}
      </aside>

      <article className="admin-guide-article" aria-labelledby={`admin-guide-topic-${topic.id}`}>
        <header className="admin-guide-article-heading"><div className="admin-guide-article-meta"><span>{topic.group}</span><span>About {estimatedMinutes} min read</span></div><div className="admin-guide-title-row"><span className="admin-guide-topic-icon"><AdminIcon name={topic.icon} size={23} /></span><h2 ref={heading} tabIndex={-1} id={`admin-guide-topic-${topic.id}`}>{topic.title}</h2></div><p>{topic.intro}</p><div className="admin-guide-destinations" aria-label="Open this workspace">{topic.destinations.map(destination => <WorkspaceLink key={destination} destination={destination} />)}</div></header>
        <figure className="admin-guide-topic-visual"><GuideIllustration kind={topic.illustration} /><figcaption>Illustrated workflow · examples only</figcaption></figure>
        <div className="admin-guide-instructions">{topic.blocks.map((item, index) => <section key={item.title} aria-labelledby={`admin-guide-${topic.id}-step-${index}`}><h3 id={`admin-guide-${topic.id}-step-${index}`}>{item.title}</h3><ol>{item.steps.map(step => <li key={step}>{step}</li>)}</ol></section>)}
          {topic.facts && <section className="admin-guide-reference"><h3>Useful details</h3><dl>{topic.facts.map(([label, description]) => <div key={label}><dt>{label}</dt><dd>{description}</dd></div>)}</dl></section>}
          <aside className="admin-guide-note" aria-label="Keep in mind"><AdminIcon name="shield" size={22} /><div><strong>Keep in mind</strong><p>{topic.note}</p></div></aside>
          <section className="admin-guide-related" aria-labelledby={`admin-guide-related-${topic.id}`}><h3 id={`admin-guide-related-${topic.id}`}>Related guides</h3><div>{topic.related.map(id => { const related = GUIDE_TOPICS.find(item => item.id === id); return <Link key={id} to={topicHref(id)} onClick={() => setQuery('')}><AdminIcon name={related.icon} size={18} /><span>{related.title}</span></Link>; })}</div></section>
        </div>
        <footer className="admin-guide-pagination">{previous ? <Link to={topicHref(previous.id)} onClick={() => setQuery('')}><small>Previous topic</small><strong>{previous.title}</strong></Link> : <span />}<button type="button" onClick={backToTopics}>Back to topics</button>{next ? <Link to={topicHref(next.id)} onClick={() => setQuery('')}><small>Next topic</small><strong>{next.title}</strong></Link> : <span />}</footer>
      </article>
    </div>
  </div>;
}
