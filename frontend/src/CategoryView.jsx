import { useMemo, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { useRemoteResource } from './hooks/useRemoteResource';
import CollectionBanner from './CollectionBanner';
import './CollectionPolish.css';

const EMPTY_FILTERS = { search: '', shape: '', cut: '', origin: '', color: '', certificate: '', min: '', max: '' };
const PAGE_SIZE = 30;
const clean = (value) => String(value ?? '').trim();
const slugify = (value) => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '-');
const categoryIdOf = (gem) => clean(gem.categoryId?._id || gem.categoryId || gem.category?._id);
const certified = (gem) => Boolean(gem.hasCertificate || clean(gem.certificateDetails) || clean(gem.certificateImage));
const weightLabel = (value) => clean(value) ? `${clean(value).replace(/\s*(?:cts?\.?|carats?)\s*$/i, '').trim()} ct` : '';

function Icon({ type = 'arrow', ...props }) {
  const paths = {
    arrow: 'M5 12h14m-6-6 6 6-6 6',
    diagonal: 'M6 18 18 6M6 6h12v12',
    search: 'm20 20-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
    filter: 'M4 7h16M4 17h16M8 4v6m8 4v6',
    close: 'm6 6 12 12M6 18 18 6',
    gem: 'm7 4-5 6 10 11 10-11-5-6H7Zm-5 6h20M7 4l5 17 5-17M7 4l5 6 5-6',
    check: 'm5 12 4 4L19 6',
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[type]} /></svg>;
}

function GemImage({ src, title = '', className = '', thumbnail = false }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <span className={`collection-image-fallback ${className}`}><Icon type="gem" />{!thumbnail && <span>Image unavailable</span>}</span>;
  return <img className={className} src={src} alt={title} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}

function FilterSelect({ label, value, onChange, options, placeholder }) {
  return <label className="collection-filter-field"><span>{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}><option value="">{placeholder}</option>{options.map((option) => typeof option === 'string' ? <option key={option} value={option}>{option}</option> : <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function GemCard({ gem, category }) {
  return <article className="gem-product-card">
    <Link to={`/gem/${gem._id}`} className="gem-product-link">
      <div className="gem-product-photo">
        <span className="gem-product-reference">{clean(gem.stoneId)}</span>
        <GemImage key={gem.image} src={gem.image} title={clean(gem.title) || 'Gemstone'} />
        <span className="gem-product-photo__bottom">
          {certified(gem) ? <span className="gem-product-certificate"><Icon type="check" /> Certified</span> : <span />}
          <span className="gem-product-arrow"><Icon type="diagonal" /></span>
        </span>
      </div>
      <div className="gem-product-copy">
        <div className="gem-product-kicker"><span>{category?.title || gem.category?.title || 'The gemstone collection'}</span>{clean(gem.weight) && <span className="gem-product-weight">{weightLabel(gem.weight)}</span>}</div>
        <h3>{clean(gem.title) || 'Untitled gemstone'}</h3>
        <p className="gem-product-meta">{[clean(gem.shape), clean(gem.origin), !gem.shape && !gem.origin ? clean(gem.color) : ''].filter(Boolean).join(' · ')}</p>
        <div className="gem-product-detail"><span>View details</span><Icon /></div>
      </div>
    </Link>
  </article>;
}

export default function CategoryView() {
  const { categorySlug, categoryId } = useParams();
  const { categoriesResource } = useOutletContext();
  const stonesResource = useRemoteResource('inventory/stones?limit=500');
  const categories = useMemo(() => Array.isArray(categoriesResource.data) ? categoriesResource.data : [], [categoriesResource.data]);
  const stones = useMemo(() => Array.isArray(stonesResource.data?.stones) ? stonesResource.data.stones : [], [stonesResource.data]);
  const [localCategory, setLocalCategory] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortOrder, setSortOrder] = useState('featured');
  const [isFiltersOpen, setIsFiltersOpen] = useState(() => window.matchMedia('(min-width: 600px)').matches);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [pagination, setPagination] = useState({ key: '', page: 1 });
  const routeKey = `${categorySlug || ''}/${categoryId || ''}`;
  const routeCategory = categoryId || (categorySlug ? categories.find((category) => slugify(category.title) === categorySlug.toLowerCase())?._id || 'unknown' : 'all');
  const selectedCategory = localCategory?.routeKey === routeKey ? localCategory.id : routeCategory;
  const activeCategory = categories.find((category) => category._id === selectedCategory);
  const allCategories = selectedCategory === 'all';
  const isLoading = stonesResource.status === 'loading' || categoriesResource.status === 'loading';
  const hasError = stonesResource.status === 'error' || categoriesResource.status === 'error';
  const unknownCategory = !allCategories && !activeCategory && !isLoading && !hasError;

  const categoryCounts = useMemo(() => stones.reduce((counts, gem) => {
    const id = categoryIdOf(gem);
    counts[id] = (counts[id] || 0) + 1;
    return counts;
  }, {}), [stones]);
  const categoryStones = useMemo(() => allCategories ? stones : stones.filter((gem) => categoryIdOf(gem) === selectedCategory), [stones, allCategories, selectedCategory]);
  const filterOptions = useMemo(() => {
    const values = (key) => [...new Map(stones.map((gem) => clean(gem[key])).filter(Boolean).map((value) => [value.toLowerCase(), value])).values()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return { shapes: values('shape'), cuts: values('cut'), origins: values('origin'), colors: values('color') };
  }, [stones]);

  const displayedStones = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const min = Number.parseFloat(filters.min);
    const max = Number.parseFloat(filters.max);
    return categoryStones.filter((gem) => {
      const categoryName = categories.find((category) => category._id === categoryIdOf(gem))?.title;
      const searchable = [gem.title, gem.stoneId, categoryName, gem.category?.title, gem.shape, gem.cut, gem.origin, gem.color].filter(Boolean).join(' ').toLowerCase();
      const weight = Number.parseFloat(gem.weight);
      return (!query || searchable.includes(query))
        && ['shape', 'cut', 'origin', 'color'].every((key) => !filters[key] || clean(gem[key]).toLowerCase() === filters[key].toLowerCase())
        && (!filters.certificate || (filters.certificate === 'certified' ? certified(gem) : !certified(gem)))
        && (!filters.min || (Number.isFinite(min) && Number.isFinite(weight) && weight >= min))
        && (!filters.max || (Number.isFinite(max) && Number.isFinite(weight) && weight <= max));
    }).sort((a, b) => {
      if (sortOrder === 'weight-low') return (Number.parseFloat(a.weight) || 0) - (Number.parseFloat(b.weight) || 0);
      if (sortOrder === 'weight-high') return (Number.parseFloat(b.weight) || 0) - (Number.parseFloat(a.weight) || 0);
      if (sortOrder === 'name') return clean(a.title).localeCompare(clean(b.title));
      const featuredDifference = Number(Boolean(b.isFeatured || b.isTopGem)) - Number(Boolean(a.isFeatured || a.isTopGem));
      const position = (gem) => Number.isFinite(Number(gem.homePagePosition)) && gem.homePagePosition !== null && gem.homePagePosition !== '' ? Number(gem.homePagePosition) : 999;
      return featuredDifference || position(a) - position(b);
    });
  }, [categoryStones, categories, filters, sortOrder]);

  const selectionKey = JSON.stringify([routeKey, selectedCategory, filters, sortOrder]);
  const totalPages = Math.max(1, Math.ceil(displayedStones.length / PAGE_SIZE));
  const currentPage = pagination.key === selectionKey ? Math.min(pagination.page, totalPages) : 1;
  const visibleStones = displayedStones.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const filterLabels = { search: 'Search', shape: 'Shape', cut: 'Cut', origin: 'Origin', color: 'Colour', certificate: 'Certification', min: 'Min carats', max: 'Max carats' };
  const activeFilters = Object.entries(filters).filter(([, value]) => value !== '');
  const resetPage = () => setPagination({ key: '', page: 1 });
  const setFilter = (key, value) => { setFilters((previous) => ({ ...previous, [key]: value })); resetPage(); };
  const clearFilters = () => { setFilters(EMPTY_FILTERS); setSortOrder('featured'); resetPage(); };
  const chooseCategory = (id) => { setLocalCategory({ routeKey, id }); resetPage(); };
  const changeSort = (value) => { setSortOrder(value); resetPage(); };
  const changePage = (page) => {
    setPagination({ key: selectionKey, page });
    document.getElementById('collection-edit')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  };
  const retry = () => { if (stonesResource.status === 'error') stonesResource.retry(); if (categoriesResource.status === 'error') categoriesResource.retry(); };
  const invalidWeightRange = filters.min !== '' && filters.max !== '' && Number.parseFloat(filters.min) > Number.parseFloat(filters.max);

  return (
    <main id="main-content" className="collection-polish">
      <div className="collection-shell">
        <nav className="collection-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link><span aria-hidden="true">/</span>
          <span aria-current="page">{allCategories ? 'Collection' : activeCategory?.title || 'Collection'}</span>
        </nav>
        <CollectionBanner key={selectedCategory} category={activeCategory || {}} all={allCategories} />

        <div className="collection-below-banner" id="collection-edit">
          <button type="button" className="collection-categories-toggle" onClick={() => setIsCategoriesOpen((open) => !open)} aria-expanded={isCategoriesOpen} aria-controls="collection-categories">
            <Icon type="gem" /><span>Gem categories</span><span aria-hidden="true">{isCategoriesOpen ? '−' : '+'}</span>
          </button>
          <aside id="collection-categories" className={`gem-category-panel${isCategoriesOpen ? ' is-open' : ''}`} aria-label="Gemstone categories">
            <h2>Gem categories</h2>
            <div className="collection-category-list">
              <button type="button" className={`gem-category-option${allCategories ? ' is-active' : ''}`} onClick={() => chooseCategory('all')} aria-label="All gemstones" aria-pressed={allCategories}>
                <span className="gem-category-photo gem-category-photo--all"><Icon type="gem" /></span>
                <span className="gem-category-name">All gemstones</span>
                <span className="gem-category-count" aria-hidden="true">{isLoading ? '—' : stones.length}</span>
              </button>
              {categories.map((category) => (
                <button key={category._id} type="button" className={`gem-category-option${selectedCategory === category._id ? ' is-active' : ''}`} onClick={() => chooseCategory(category._id)} aria-label={category.title} aria-pressed={selectedCategory === category._id}>
                  <span className="gem-category-photo"><GemImage key={category.mainImage || category.image} src={category.mainImage || category.image} thumbnail /></span>
                  <span className="gem-category-name">{category.title}</span>
                  <span className="gem-category-count" aria-hidden="true">{categoryCounts[category._id] || 0}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="collection-catalog" aria-label="Gemstone collection">
            <div className="collection-aligned-controls">
              <label className="collection-search">
                <Icon type="search" /><span className="sr-only">Search collection</span>
                <input type="search" value={filters.search} onChange={(event) => setFilter('search', event.target.value)} placeholder="Search gemstones…" />
              </label>
              <div className="collection-controls__right">
                <span className="collection-result-count" role="status" aria-live="polite">
                  {isLoading ? 'Loading…' : hasError ? 'Unavailable' : <><strong>{displayedStones.length}</strong> {displayedStones.length === 1 ? 'gemstone' : 'gemstones'}</>}
                </span>
                <label className="collection-sort"><span className="sr-only">Sort collection</span>
                  <select aria-label="Sort collection" value={sortOrder} onChange={(event) => changeSort(event.target.value)}>
                    <option value="featured">Featured</option><option value="name">Name A–Z</option>
                    <option value="weight-low">Weight: Low–High</option><option value="weight-high">Weight: High–Low</option>
                  </select>
                </label>
                <button type="button" className={`collection-refine-toggle${isFiltersOpen ? ' is-active' : ''}`} onClick={() => setIsFiltersOpen((open) => !open)} aria-label="Refine selection" aria-expanded={isFiltersOpen} aria-controls="collection-filters">
                  <Icon type="filter" /><span>Filters{activeFilters.length > 0 ? ` (${activeFilters.length})` : ''}</span>
                </button>
                <button type="button" className="collection-clear" onClick={clearFilters}>Clear all</button>
              </div>
            </div>

            {isFiltersOpen && (
              <div id="collection-filters" className="collection-filter-panel" aria-label="Refine collection">
                <div className="collection-filter-fields">
                  <FilterSelect label="Shape" value={filters.shape} onChange={(value) => setFilter('shape', value)} options={filterOptions.shapes} placeholder="All shapes" />
                  <FilterSelect label="Cut" value={filters.cut} onChange={(value) => setFilter('cut', value)} options={filterOptions.cuts} placeholder="All cuts" />
                  <FilterSelect label="Origin" value={filters.origin} onChange={(value) => setFilter('origin', value)} options={filterOptions.origins} placeholder="All origins" />
                  {filterOptions.colors.length > 0 && <FilterSelect label="Colour" value={filters.color} onChange={(value) => setFilter('color', value)} options={filterOptions.colors} placeholder="All colours" />}
                  <fieldset className="collection-filter-field collection-weight">
                    <legend>Carat weight</legend>
                    <div><input aria-label="Minimum carat weight" type="number" inputMode="decimal" min="0" step="any" value={filters.min} onChange={(event) => setFilter('min', event.target.value)} placeholder="Min" /><span aria-hidden="true">–</span><input aria-label="Maximum carat weight" type="number" inputMode="decimal" min="0" step="any" value={filters.max} onChange={(event) => setFilter('max', event.target.value)} placeholder="Max" /></div>
                    {invalidWeightRange && <p role="alert" className="collection-weight-error">Minimum must be below maximum.</p>}
                  </fieldset>
                  <FilterSelect label="Certification" value={filters.certificate} onChange={(value) => setFilter('certificate', value)} options={[{ value: 'certified', label: 'Certified only' }, { value: 'uncertified', label: 'Without certificate' }]} placeholder="Any certification" />
                </div>
              </div>
            )}

            <div className="collection-results">
              {activeFilters.length > 0 && <div className="collection-active-filters" aria-label="Active refinements">
                {activeFilters.map(([key, value]) => <button key={key} type="button" onClick={() => setFilter(key, '')} aria-label={`Remove ${filterLabels[key]} filter`}>{filterLabels[key]}: {key === 'certificate' ? value === 'certified' ? 'Certified' : 'Without certificate' : value}<Icon type="close" /></button>)}
              </div>}
              {isLoading ? (
                <div className="gem-product-grid collection-loading" aria-busy="true" aria-label="Loading collection">
                  {Array.from({ length: 10 }, (_, index) => <div className="collection-skeleton" key={index}><div /><span /><span /></div>)}
                </div>
              ) : hasError ? (
                <div className="collection-empty" role="alert"><Icon type="gem" /><h2>Collection unavailable</h2><p>We couldn’t load the gemstones. Please try again.</p><button type="button" className="collection-button" onClick={retry}>Try again <Icon /></button></div>
              ) : displayedStones.length === 0 ? (
                <div className="collection-empty">
                  <Icon type="gem" /><h2>{unknownCategory ? 'This collection couldn’t be found.' : 'No gemstones found'}</h2>
                  <p>{activeFilters.length > 0 ? 'Try another filter or reset your selection.' : 'Explore another category or contact us about a gemstone.'}</p>
                  {activeFilters.length > 0 ? <button type="button" className="collection-button" onClick={clearFilters}>Reset refinements <Icon /></button> : <button type="button" className="collection-button" onClick={() => chooseCategory('all')}>Explore all gemstones <Icon /></button>}
                  <Link to="/contact">Contact us <Icon type="diagonal" /></Link>
                </div>
              ) : (
                <>
                  <div className="gem-product-grid">{visibleStones.map((gem) => <GemCard key={gem._id} gem={gem} category={categories.find((category) => category._id === categoryIdOf(gem))} />)}</div>
                  <div className="collection-pagination">
                    <span>Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, displayedStones.length)} of {displayedStones.length}</span>
                    {totalPages > 1 && <nav aria-label="Collection pages">
                      <button type="button" onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page"><Icon className="collection-arrow-back" /></button>
                      <span>{currentPage} <i>/</i> {totalPages}</span>
                      <button type="button" onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next page"><Icon /></button>
                    </nav>}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
