import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function CategoryView() {
  const [categories, setCategories] = useState([]);
  const [stones, setStones] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all'); // Default to 'all' gems view
  const [isAdmin] = useState(!!localStorage.getItem('token'));

  // Modals State
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [showAddStoneModal, setShowAddStoneModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // New Category State
  const [newCat, setNewCat] = useState({ title: '', image: '', coverImage: '' });
  
  // New Stone State
  const [newStone, setNewStone] = useState({
    categoryId: '', title: '', weight: '', shape: '', cut: '', origin: '', 
    certificateDetails: '', image: '', additionalImages: []
  });

  useEffect(() => {
    fetchCategories();
    fetchStones();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('https://pinnawalagems.onrender.com/api/inventory/categories');
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
    } catch (err) { console.log(err); }
  };

  const fetchStones = async () => {
    try {
      const res = await fetch('https://pinnawalagems.onrender.com/api/inventory/stones?limit=500');
      const data = await res.json();
      if (data.stones) setStones(data.stones);
    } catch (err) { console.log(err); }
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('image', file);
    setIsUploading(true);
    
    try {
      const res = await fetch('https://pinnawalagems.onrender.com/api/upload', { method: 'POST', body: uploadData });
      if (res.ok) {
        const data = await res.json();
        if (type === 'catIcon') setNewCat({ ...newCat, image: data.imageUrl });
        if (type === 'catCover') setNewCat({ ...newCat, coverImage: data.imageUrl });
        if (type === 'stoneMain') setNewStone({ ...newStone, image: data.imageUrl });
      }
    } catch (err) { alert('Upload failed!'); } 
    finally { setIsUploading(false); }
  };

  const handleAddCategory = async () => {
    if (!newCat.title || !newCat.image) return alert("Title and Icon are required!");
    try {
      const res = await fetch('https://pinnawalagems.onrender.com/api/inventory/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(newCat)
      });
      if (res.ok) {
        fetchCategories();
        setShowAddCatModal(false);
        setNewCat({ title: '', image: '', coverImage: '' });
      }
    } catch (err) { console.log(err); }
  };

  const handleAddStone = async () => {
    if (!newStone.categoryId || !newStone.title || !newStone.image) {
      return alert("Category, Title, and Image are required!");
    }
    try {
      const res = await fetch('https://pinnawalagems.onrender.com/api/inventory/stones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ ...newStone, isTopGem: false, homePagePosition: 1 })
      });
      if (res.ok) {
        fetchStones();
        setShowAddStoneModal(false);
        setNewStone({ categoryId: '', title: '', weight: '', shape: '', cut: '', origin: '', certificateDetails: '', image: '', additionalImages: [] });
      }
    } catch (err) { console.log(err); }
  };

  const deleteStone = async (id) => {
    if(window.confirm("Are you sure you want to delete this gem?")) {
      try {
        await fetch(`https://pinnawalagems.onrender.com/api/inventory/stones/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        fetchStones();
      } catch(err) { console.log(err); }
    }
  };

  // Active Category info for Cover Banner
  const activeCategoryObj = selectedCategory === 'all' 
    ? { title: 'All Gem Types', coverImage: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=2000&auto=format&fit=crop' } 
    : categories.find(c => c._id === selectedCategory) || {};

  // Filtered Stones
  const displayedStones = selectedCategory === 'all' 
    ? stones 
    : stones.filter(s => s.categoryId === selectedCategory || s.category?._id === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden">
      
      {/* ---------------- 🔹 NAVIGATION BAR 🔹 ---------------- */}
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md text-blue-950 py-2.5 px-6 border-b border-blue-100 shadow-sm flex flex-col items-center">
        <div className="flex flex-col items-center mb-1">
          <img src="/image_27d308.png" alt="Pinnawala Gems Logo" className="h-8 md:h-10 w-auto object-contain mix-blend-multiply transform scale-[1.2] mt-1 mb-1" />
          <h1 className="text-base md:text-lg font-serif tracking-[0.2em] uppercase font-bold text-center">Pinnawala Gems</h1>
        </div>
        <div className="flex gap-4 md:gap-7 items-center flex-wrap justify-center">
          <Link to="/" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Home</Link>
          <Link to="/catalog" className="text-[10px] md:text-xs font-bold tracking-[0.15em] text-blue-600 transition-colors uppercase">Collection</Link>
          <Link to="/workshop" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Workshop</Link>
          <Link to="/feedback" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Feedback</Link>
          <Link to="/contact" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Contact Us</Link>
        </div>
      </nav>

      {/* ---------------- 🔹 COLLECTION PAGE LAYOUT (SIDEBAR + CONTENT) 🔹 ---------------- */}
      <main className="flex-1 flex w-full max-w-[1400px] mx-auto pt-28 px-4 md:px-8 gap-6 pb-20">
        
        {/* LEFT SIDEBAR (GEM CATEGORIES + ALL GEMS) */}
        <aside className="hidden md:flex flex-col w-64 flex-shrink-0 border-r border-slate-200 pr-4">
          <div className="flex items-center justify-between mb-6 pl-2">
            <h3 className="text-[11px] font-bold text-blue-950 uppercase tracking-[0.2em]">Gem Categories</h3>
            {isAdmin && (
              <button onClick={() => setShowAddCatModal(true)} className="text-[10px] bg-blue-950 text-white px-2 py-1 rounded hover:bg-blue-900 font-bold uppercase tracking-wider">
                + Add
              </button>
            )}
          </div>
          
          <ul className="space-y-1">
            {/* 'ALL GEMS' Default Item */}
            <li 
              onClick={() => setSelectedCategory('all')}
              className={`flex items-center gap-4 px-3 py-2.5 cursor-pointer transition-all ${selectedCategory === 'all' ? 'border-l-[3px] border-blue-600 bg-blue-50/50' : 'border-l-[3px] border-transparent hover:bg-slate-100'}`}
            >
              <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-xs shadow-sm">💎</div>
              <span className={`text-[11px] uppercase tracking-wider font-bold ${selectedCategory === 'all' ? 'text-blue-900' : 'text-slate-600'}`}>All Gem Types</span>
            </li>

            {/* Dynamic Categories */}
            {categories.map(cat => (
              <li 
                key={cat._id} 
                onClick={() => setSelectedCategory(cat._id)}
                className={`flex items-center gap-4 px-3 py-2.5 cursor-pointer transition-all ${selectedCategory === cat._id ? 'border-l-[3px] border-blue-600 bg-blue-50/50' : 'border-l-[3px] border-transparent hover:bg-slate-100'}`}
              >
                <img src={cat.image} alt={cat.title} className="w-6 h-6 rounded-full object-cover shadow-sm bg-white border border-slate-200" />
                <span className={`text-[11px] uppercase tracking-wider font-bold ${selectedCategory === cat._id ? 'text-blue-900' : 'text-slate-600'}`}>{cat.title}</span>
              </li>
            ))}
          </ul>
        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <section className="flex-1 flex flex-col min-w-0">
          
          {/* Cover Photo Banner */}
          <div 
            className="w-full h-40 md:h-[220px] rounded-sm bg-slate-200 relative bg-cover bg-center shadow-sm flex items-center px-6 md:px-12"
            style={{ backgroundImage: `url('${activeCategoryObj.coverImage || 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=2000&auto=format&fit=crop'}')` }}
          >
            <div className="absolute inset-0 bg-black/10 rounded-sm"></div>
            
            <div className="relative z-10 bg-white/85 backdrop-blur-sm px-6 py-4 border border-white/40 shadow-lg min-w-[200px]">
              <p className="text-[9px] font-bold text-blue-700 tracking-[0.25em] uppercase mb-1">Premium Selection</p>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-blue-950 uppercase tracking-widest">{activeCategoryObj.title}</h2>
            </div>
          </div>

          {/* Advanced Filters & Admin Add Button */}
          <div className="flex flex-wrap items-center justify-between mt-6 mb-6 gap-4">
            <button className="flex items-center gap-2 border border-blue-200 bg-white text-blue-900 text-[10px] font-bold uppercase tracking-widest px-4 py-2 hover:bg-blue-50 transition-colors rounded-sm shadow-sm">
              <span className="text-sm">🔍</span> Advanced Filters
            </button>

            {isAdmin && (
              <button 
                onClick={() => {
                  setNewStone({ ...newStone, categoryId: selectedCategory === 'all' ? '' : selectedCategory });
                  setShowAddStoneModal(true);
                }} 
                className="bg-blue-950 text-white text-[10px] font-bold uppercase tracking-widest px-5 py-2 rounded-sm shadow-md hover:bg-blue-900 transition-colors"
              >
                + Add Gem to Collection
              </button>
            )}
          </div>

          {/* Gemstones Grid */}
          {displayedStones.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs font-semibold mt-10">
              No gemstones available in this selection yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayedStones.map(gem => (
                <div key={gem._id} className="bg-white rounded-sm p-3 shadow-sm border border-slate-100 flex flex-col items-center text-center relative group hover:shadow-md transition-all">
                  <Link to={`/gem/${gem._id}`} className="w-full flex flex-col items-center">
                    <div className="w-full h-32 overflow-hidden bg-slate-50 flex items-center justify-center mb-3">
                      <img src={gem.image} alt={gem.title} className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wider absolute top-2 left-2 shadow-sm rounded-sm">Featured</span>
                    <h3 className="text-[11px] font-bold text-blue-950 uppercase tracking-wider line-clamp-1">{gem.title}</h3>
                    {gem.weight && <p className="text-[10px] text-slate-500 mt-1 font-semibold">{gem.weight} ct</p>}
                  </Link>

                  {isAdmin && (
                    <button onClick={() => deleteStone(gem._id)} className="absolute -top-2 -right-2 bg-red-600 text-white w-5 h-5 rounded-full text-[10px] shadow-md z-10 hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity">✖</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ---------------- 🔹 MODALS 🔹 ---------------- */}
      
      {/* Add Category Modal */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-sm font-bold text-blue-950 uppercase tracking-widest">Add New Category</h2>
              <button onClick={() => setShowAddCatModal(false)} className="text-red-500 font-bold hover:text-red-700">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">Category Name</label>
                <input type="text" value={newCat.title} onChange={(e) => setNewCat({...newCat, title: e.target.value})} placeholder="e.g. Pink Sapphire" className="w-full border border-slate-300 p-2 text-xs rounded-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">Small Icon (Sidebar)</label>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'catIcon')} className="text-[9px] w-full" />
                  {newCat.image && <img src={newCat.image} alt="icon" className="h-8 mt-2 object-contain" />}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">Cover Photo (Banner)</label>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'catCover')} className="text-[9px] w-full" />
                  {newCat.coverImage && <img src={newCat.coverImage} alt="cover" className="h-8 mt-2 object-cover" />}
                </div>
              </div>
              <button onClick={handleAddCategory} disabled={isUploading || !newCat.title || !newCat.image} className="w-full bg-blue-900 text-white font-bold text-[10px] uppercase tracking-widest py-3 mt-2 rounded-sm hover:bg-blue-800 disabled:bg-slate-400">
                {isUploading ? 'Uploading...' : 'Save Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Gem Stone Modal */}
      {showAddStoneModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl p-6 rounded-md shadow-2xl h-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h2 className="text-sm font-bold text-blue-950 uppercase tracking-widest">Add Gem to Collection</h2>
              <button onClick={() => setShowAddStoneModal(false)} className="text-red-500 font-bold hover:text-red-700">✕</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">Assign to Category</label>
                <select value={newStone.categoryId} onChange={(e) => setNewStone({...newStone, categoryId: e.target.value})} className="w-full border border-slate-300 p-2 text-xs rounded-sm bg-slate-50 font-bold">
                  <option value="">-- Select Category --</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">Gem Name / Title</label>
                <input type="text" value={newStone.title} onChange={(e) => setNewStone({...newStone, title: e.target.value})} placeholder="e.g. Royal Blue Sapphire" className="w-full border border-slate-300 p-2 text-xs rounded-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Weight (ct)</label>
                <input type="text" value={newStone.weight} onChange={(e) => setNewStone({...newStone, weight: e.target.value})} className="w-full border border-slate-300 p-2 text-xs rounded-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Shape</label>
                <input type="text" value={newStone.shape} onChange={(e) => setNewStone({...newStone, shape: e.target.value})} className="w-full border border-slate-300 p-2 text-xs rounded-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Cut</label>
                <input type="text" value={newStone.cut} onChange={(e) => setNewStone({...newStone, cut: e.target.value})} className="w-full border border-slate-300 p-2 text-xs rounded-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Origin</label>
                <input type="text" value={newStone.origin} onChange={(e) => setNewStone({...newStone, origin: e.target.value})} className="w-full border border-slate-300 p-2 text-xs rounded-sm" />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">Upload Main Gem Image</label>
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'stoneMain')} className="text-[10px] w-full" />
              {isUploading && <p className="text-[10px] text-blue-600 mt-1">Uploading...</p>}
              {newStone.image && <img src={newStone.image} alt="Preview" className="h-16 mt-2 object-contain border border-slate-200 rounded-sm p-1" />}
            </div>

            <button onClick={handleAddStone} disabled={isUploading || !newStone.categoryId || !newStone.title || !newStone.image} className="w-full bg-blue-900 text-white font-bold text-[11px] uppercase tracking-widest py-3 mt-4 rounded-sm hover:bg-blue-800 disabled:bg-slate-400">
              {isUploading ? 'Uploading...' : 'Save Gem to Catalog'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default CategoryView;