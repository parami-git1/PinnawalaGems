import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AdminEmptyState, AdminIcon } from './AdminUI';

const COLORS = ['#293e5e', '#a58d61', '#779297', '#8190a5', '#b1a28a', '#657c8b', '#c0c8d1', '#9caaa4'];
const numeric = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const integer = (value) => new Intl.NumberFormat('en-US').format(numeric(value));
const weight = (value) => numeric(value).toFixed(2);
const currency = (value) => value === null || value === undefined ? '—' : `Rs. ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(numeric(value))}`;

function Stat({ label, value, suffix, note, icon }) {
  return <article className="admin-stat"><div className="admin-stat-top"><p>{label}</p><span><AdminIcon name={icon} /></span></div><p className="admin-stat-value">{value}{suffix && <small>{suffix}</small>}</p><p className="admin-stat-note">{note}</p></article>;
}

export default function AdminDashboard({ analytics, pendingReviews, categoriesCount, onNavigate }) {
  const overview = Array.isArray(analytics.categoryOverview) ? analytics.categoryOverview : [];
  const categoryData = overview.length ? overview.filter((category) => numeric(category.stones) > 0).map((category) => ({ name: category.name || 'Uncategorized', value: numeric(category.stones), quantity: numeric(category.quantity) })) : (analytics.categoryDistribution || []).map((category) => ({ name: category.name || 'Uncategorized', value: numeric(category.value), quantity: numeric(category.quantity) }));
  return <div className="admin-dashboard">
    <div className="admin-stat-grid">
      <Stat label="Total gemstones" value={integer(analytics.totalStones)} note="Gemstone records in your catalog" icon="gem" />
      <Stat label="Available pieces" value={integer(analytics.totalQuantity)} note="Combined inventory quantity" icon="box" />
      <Stat label="Blue gemstones" value={integer(analytics.totalBlueSapphires)} note="Gemstone titles containing “blue”" icon="layers" />
      <Stat label="Average weight" value={weight(analytics.avgCaratWeight)} suffix="ct" note="Across numeric carat weights" icon="chart" />
      <Stat label="Carat range" value={`${weight(analytics.minCaratWeight)}–${weight(analytics.maxCaratWeight)}`} suffix="ct" note="Smallest to largest recorded weight" icon="filter" />
    </div>

    <div className="admin-dashboard-grid">
      <section className="admin-panel"><header className="admin-panel-header"><div><h2>Collection composition</h2><p>Gemstone records across your categories</p></div><span className="admin-badge">{categoryData.length} categories</span></header><div className="admin-panel-body">
        {categoryData.length ? <div className="admin-donut-layout"><div className="admin-chart" role="img" aria-label={`Gemstones by category: ${categoryData.map((item) => `${item.name} ${item.value}`).join(', ')}`}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="82%" paddingAngle={4} stroke="none">{categoryData.map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ border: '1px solid #e2e7ee', borderRadius: 8, fontSize: 11 }} /></PieChart></ResponsiveContainer></div><div className="admin-chart-legend">{categoryData.map((item, index) => <div key={item.name}><i style={{ background: COLORS[index % COLORS.length] }} /><span title={item.name}>{item.name}</span><strong>{integer(item.value)}</strong></div>)}</div></div> : <AdminEmptyState icon="chart" title="Your collection at a glance" description="Category insights will appear when gemstones are added to the inventory." />}
      </div></section>

      <section className="admin-panel"><header className="admin-panel-header"><div><h2>Stock by category</h2><p>Available pieces in each part of the collection</p></div><AdminIcon name="chart" size={17} /></header><div className="admin-panel-body">
        {categoryData.length ? <div className="admin-chart" role="img" aria-label={`Available pieces by category: ${categoryData.map((item) => `${item.name} ${item.quantity}`).join(', ')}`}><ResponsiveContainer width="100%" height="100%"><BarChart data={categoryData} margin={{ top: 12, right: 5, left: -22, bottom: 10 }}><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#edf0f4" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#8592a4' }} interval={0} angle={-18} textAnchor="end" height={55} /><YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 10, fill: '#9aa5b5' }} /><Tooltip cursor={{ fill: '#f6f8fb' }} contentStyle={{ border: '1px solid #e2e7ee', borderRadius: 8, fontSize: 11 }} /><Bar dataKey="quantity" name="Available pieces" fill="#344d70" radius={[4, 4, 0, 0]} maxBarSize={38} /></BarChart></ResponsiveContainer></div> : <AdminEmptyState icon="box" title="No stock data yet" description="Available quantities will be summarised here once your collection has records." />}
      </div></section>
    </div>

    <div className="admin-attention-grid">
      <button type="button" className="admin-attention" onClick={() => onNavigate('feedback')}><span><AdminIcon name="star" /></span><div><strong>{pendingReviews ? `${pendingReviews} ${pendingReviews === 1 ? 'review needs' : 'reviews need'} approval` : 'Customer reviews'}</strong><small>{pendingReviews ? 'Review and publish customer feedback' : 'Manage the voices behind your collection'}</small></div><AdminIcon name="chevron-right" /></button>
      <button type="button" className="admin-attention" onClick={() => onNavigate('operations')}><span><AdminIcon name="layers" /></span><div><strong>{categoriesCount} gemstone categories</strong><small>Organise collections, images and featured stones</small></div><AdminIcon name="chevron-right" /></button>
      <button type="button" className="admin-attention" onClick={() => onNavigate('planner')}><span><AdminIcon name="calendar" /></span><div><strong>Plan the next connection</strong><small>Appointments, reminders and personal notes</small></div><AdminIcon name="chevron-right" /></button>
    </div>

    <section className="admin-panel admin-section-gap"><header className="admin-panel-header"><div><h2>Category overview</h2><p>Inventory size, carat weights and average recorded prices</p></div><button type="button" className="admin-button is-small" onClick={() => onNavigate('inventory')}>View inventory<AdminIcon name="arrow" /></button></header>
      {overview.length ? <div className="admin-table-wrap"><table className="admin-table" style={{ minWidth: 720 }}><thead><tr><th scope="col">Category</th><th scope="col">Gemstones</th><th scope="col">Pieces</th><th scope="col">Average weight</th><th scope="col">Carat range</th><th scope="col">Average price</th></tr></thead><tbody>{overview.map((category) => <tr key={category.categoryId || category.name}><td><strong>{category.name}</strong></td><td>{integer(category.stones)}</td><td>{integer(category.quantity)}</td><td>{weight(category.averageWeight)} ct</td><td>{weight(category.minWeight)}–{weight(category.maxWeight)} ct</td><td>{currency(category.averagePrice)}</td></tr>)}</tbody></table></div> : <AdminEmptyState icon="layers" title="No category overview yet" description="Your category-level inventory details will be available here." />}
    </section>
  </div>;
}
