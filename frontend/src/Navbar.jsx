import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BUSINESS } from './businessDetails';
import './Navbar.css';
import ResponsiveImage from './ResponsiveImage';
import { warmPageHero } from './pageHeroWarmup';

const COLLECTION_ITEMS = [
  { title: 'Blue Sapphire', to: '/collections/blue-sapphire' },
  { title: 'Ruby', to: '/collections/ruby' },
  { title: 'Yellow Sapphire', to: '/collections/yellow-sapphire' },
  { title: 'Orange Sapphire', to: '/collections/orange-sapphire' },
  { title: 'Pink Sapphire', to: '/collections/pink-sapphire' },
];

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/catalog', label: 'Collection' },
  { to: '/workshop', label: 'Workshop' },
  { to: '/feedback', label: 'Feedback' },
  { to: '/contact', label: 'Contact' },
];

function Chevron({ open = false }) {
  return (
    <svg className={`pg-nav__chevron${open ? ' is-open' : ''}`} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Navbar({ adminSlot = null, categories = null }) {
  const warmDestination = (event) => {
    const link = event.target.closest('a[href]');
    if (link && link.origin === window.location.origin) warmPageHero(link.pathname);
  };
  const { pathname } = useLocation();
  const [menuState, setMenuState] = useState({ pathname, mobile: false, collection: false, desktop: false });
  const navRef = useRef(null);
  const mobileToggleRef = useRef(null);
  const mobilePanelRef = useRef(null);
  const collectionRef = useRef(null);
  const collectionToggleRef = useRef(null);
  // A new route always starts with closed menus, including browser back/forward.
  const mobileOpen = menuState.pathname === pathname && menuState.mobile;
  const mobileCollectionOpen = menuState.pathname === pathname && menuState.collection;
  const desktopCollectionOpen = menuState.pathname === pathname && menuState.desktop;
  const collectionActive = pathname === '/catalog' || pathname === '/collection' || pathname.startsWith('/category/') || pathname.startsWith('/collections/');
  const loadedCategories = Array.isArray(categories) ? categories.filter((category) => category && typeof category.title === 'string' && category.title.trim()) : [];
  const collectionItems = loadedCategories.length ? loadedCategories.map((category) => ({
    title: category.title.trim(),
    to: `/collections/${category.slug || category.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
  })) : COLLECTION_ITEMS;

  const updateMenu = (changes) => setMenuState((previous) => ({
    ...(previous.pathname === pathname ? previous : { pathname, mobile: false, collection: false, desktop: false }),
    ...changes,
  }));

  const closeMenus = () => updateMenu({ mobile: false, collection: false, desktop: false });

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    const frame = window.requestAnimationFrame(() => mobilePanelRef.current?.querySelector('a')?.focus({ preventScroll: true }));

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setMenuState((previous) => ({ ...previous, mobile: false, collection: false }));
        mobileToggleRef.current?.focus({ preventScroll: true });
      }
      if (event.key === 'Tab') {
        const focusable = [...(navRef.current?.querySelectorAll('a[href], button:not([disabled]):not([tabindex="-1"])') || [])]
          .filter((element) => element.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!navRef.current?.contains(document.activeElement)) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    const desktopQuery = window.matchMedia('(min-width: 900px)');
    const handleResize = (event) => {
      if (event.matches) {
        setMenuState((previous) => ({ ...previous, mobile: false, collection: false }));
        const destination = navRef.current?.querySelector('.pg-nav__desktop [aria-current="page"]') || navRef.current?.querySelector('.pg-nav__brand');
        destination?.focus({ preventScroll: true });
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    desktopQuery.addEventListener('change', handleResize);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = originalOverflow;
      document.documentElement.style.overscrollBehavior = originalOverscroll;
      document.removeEventListener('keydown', handleKeyDown);
      desktopQuery.removeEventListener('change', handleResize);
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!desktopCollectionOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!collectionRef.current?.contains(event.target)) setMenuState((previous) => ({ ...previous, desktop: false }));
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuState((previous) => ({ ...previous, desktop: false }));
        collectionToggleRef.current?.focus({ preventScroll: true });
      }
    };
    const desktopQuery = window.matchMedia('(min-width: 900px)');
    const handleResize = (event) => {
      if (!event.matches) setMenuState((previous) => ({ ...previous, desktop: false }));
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    desktopQuery.addEventListener('change', handleResize);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      desktopQuery.removeEventListener('change', handleResize);
    };
  }, [desktopCollectionOpen]);

  return (
    <nav ref={navRef} className="pg-nav" aria-label="Main navigation" onPointerOver={warmDestination} onFocusCapture={warmDestination}>
      <div className="pg-nav__inner">
        <Link to="/" onClick={closeMenus} className="pg-nav__brand" aria-label={`${BUSINESS.name} home`}>
          <ResponsiveImage src="/logo.png" alt="" width="78" height="54" maxWidth={320} sizes="78px" loading="eager" fetchPriority="high" />
          <span className="pg-nav__wordmark">
            <span>Pinnawala Gems<span className="pg-nav__brand-dot">.</span></span>
          </span>
        </Link>

        <div className="pg-nav__desktop">
          {NAV_LINKS.map(({ to, label }) => {
            const active = pathname === to || (to !== '/' && pathname.startsWith(to));
            if (label === 'Collection') return (
              <div
                key={to}
                ref={collectionRef}
                className="pg-nav__collection"
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) updateMenu({ desktop: false });
                }}
              >
                <div className={`pg-nav__collection-trigger${collectionActive ? ' is-active' : ''}`}>
                  <Link to={to} onClick={closeMenus} className="pg-nav__link" aria-current={collectionActive ? 'page' : undefined}>Collection</Link>
                  <button
                    ref={collectionToggleRef}
                    type="button"
                    className="pg-nav__collection-toggle"
                    aria-label="Browse gemstone categories"
                    aria-expanded={desktopCollectionOpen}
                    aria-controls="pg-desktop-collection"
                    onClick={() => updateMenu({ desktop: !desktopCollectionOpen })}
                  ><Chevron open={desktopCollectionOpen} /></button>
                </div>
                {desktopCollectionOpen && (
                  <div className="pg-nav__dropdown" id="pg-desktop-collection">
                    <p className="pg-nav__dropdown-label">A world of colour</p>
                    {collectionItems.map((item) => (
                      <Link key={item.to} to={item.to} onClick={closeMenus} aria-current={pathname === item.to ? 'page' : undefined}>
                        <span>{item.title}</span><Arrow />
                      </Link>
                    ))}
                    <Link to="/catalog" onClick={closeMenus} className="pg-nav__view-all">View the full collection <Arrow /></Link>
                  </div>
                )}
              </div>
            );
            return <Link key={to} to={to} onClick={closeMenus} className={`pg-nav__link${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>{label}</Link>;
          })}
        </div>

        <div className="pg-nav__actions">
          <Link className="pg-nav__visit" to="/contact" onClick={closeMenus}>Book a visit <Arrow /></Link>
          {adminSlot && <div className="pg-nav__admin">{adminSlot}</div>}
          <button
            ref={mobileToggleRef}
            type="button"
            className="pg-nav__mobile-toggle"
            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={mobileOpen}
            aria-controls="pg-mobile-navigation"
            onClick={() => updateMenu({ mobile: !mobileOpen, collection: false })}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {mobileOpen ? <path d="m6 6 12 12M6 18 18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && <button type="button" className="pg-nav__mobile-backdrop" tabIndex={-1} aria-label="Close navigation overlay" onClick={closeMenus} />}
      {mobileOpen && (
        <div ref={mobilePanelRef} className="pg-nav__mobile" id="pg-mobile-navigation">
          <p className="pg-nav__mobile-eyebrow">Discover Pinnawala</p>
          {NAV_LINKS.map(({ to, label }) => {
            if (label === 'Collection') return (
              <div key={to} className="pg-nav__mobile-collection">
                <div className="pg-nav__mobile-collection-row">
                  <Link to={to} onClick={closeMenus} className={`pg-nav__mobile-link${collectionActive ? ' is-active' : ''}`} aria-current={collectionActive ? 'page' : undefined}><span>Collection</span></Link>
                  <button
                    type="button"
                    className="pg-nav__mobile-collection-toggle"
                    aria-label={mobileCollectionOpen ? 'Hide gemstone categories' : 'Show gemstone categories'}
                    aria-expanded={mobileCollectionOpen}
                    aria-controls="pg-mobile-collection"
                    onClick={() => updateMenu({ collection: !mobileCollectionOpen })}
                  ><Chevron open={mobileCollectionOpen} /></button>
                </div>
                {mobileCollectionOpen && (
                  <div className="pg-nav__mobile-categories" id="pg-mobile-collection">
                    <Link to="/catalog" onClick={closeMenus} className="pg-nav__mobile-view-all">View all gemstones <Arrow /></Link>
                    {collectionItems.map((item) => <Link key={item.to} to={item.to} onClick={closeMenus} aria-current={pathname === item.to ? 'page' : undefined}>{item.title}</Link>)}
                  </div>
                )}
              </div>
            );
            const active = pathname === to || (to !== '/' && pathname.startsWith(to));
            return <Link key={to} to={to} onClick={closeMenus} className={`pg-nav__mobile-link${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}><span>{label}</span><Arrow /></Link>;
          })}
          <Link className="pg-nav__mobile-visit" to="/contact" onClick={closeMenus}>Plan your visit <Arrow /></Link>
          <p className="pg-nav__mobile-note">Fine gemstones. A personal experience.</p>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
