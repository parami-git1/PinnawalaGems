import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function App() {
  const [categories, setCategories] = useState([]);
  const [stones, setStones] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all'); // Default to 'all' gems view
  const [loading, setLoading] = useState(true);
  const isAdmin = !!localStorage.getItem('token'); 

  // Modals & Forms State
  const [showCatForm, setShowCatForm] = useState(false);
  const [isEditCat, setIsEditCat] = useState(false);
  const [editCatId, setEditCatId] = useState(null);
  const [catFormData, setCatFormData] = useState({ title: '', description: '', mainImage: '', coverImage: '' });
  const [isUploading, setIsUploading] = useState(false);

  // 🔹 "All Gems" Cover Photo State (Saved in localStorage so it persists)
  const [allGemsCover, setAllGemsCover] = useState(
    localStorage.getItem('allGemsCover') || 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=2000&auto=format&fit=crop'
  );
  const [showEditAllCoverModal, setShowEditAllCoverModal] = useState(false);
  const [tempAllCover, setTempAllCover] = useState(allGemsCover);

  // Advanced Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchColor, setSearchColor] = useState('');
  const [searchShape, setSearchShape] = useState('');
  const [minWeight, setMinWeight] = useState('');
  const [maxWeight, setMaxWeight] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [filterCert, setFilterCert] = useState(false);

  const fetchCategories = () => {
    fetch('https://pinnawalagems.onrender.com/api/inventory/categories')
      .then(res => res.json())
      .then(data => { 
        setCategories(Array.isArray(data) ? data : []); 
        setLoading(false); 
      })
      .catch(err => { console.log(err); setLoading(false); });
  };

  const fetchStones = () => {
    let url = `https://pinnawalagems.onrender.com/api/inventory/stones?page=1&limit=500`;
    if (searchId) url += `&stoneId=${searchId}`;
    if (searchType) url += `&gemType=${searchType}`;
    if (searchColor) url += `&color=${searchColor}`;
    if (searchShape) url += `&shape=${searchShape}`;
    if (minWeight) url += `&minWeight=${minWeight}`;
    if (maxWeight) url += `&maxWeight=${maxWeight}`;
    if (minPrice) url += `&minPrice=${minPrice}`;
    if (maxPrice) url += `&maxPrice=${maxPrice}`;
    if (filterCert) url += `&hasCertificate=true`;

    fetch(url)
      .then(res => res.json())
      .then(data => { setStones(data.stones || []); })
      .catch(err => console.log(err));
  };

  useEffect(() => { 
    fetchCategories(); 
    fetchStones();
  }, []);

  useEffect(() => {
    fetchStones();
  }, [searchId, searchType, searchColor, searchShape, minWeight, maxWeight, minPrice, maxPrice, filterCert]);

  const handleResetFilters = () => {
    setSearchId(''); setSearchType(''); setSearchColor(''); setSearchShape('');
    setMinWeight(''); setMaxWeight(''); setMinPrice(''); setMaxPrice('');
    setFilterCert(false);
  };

  const handleCatImageUpload = async (e, type = 'main') => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('image', file);
    setIsUploading(true);
    try {
      const response = await fetch('https://pinnawalagems.onrender.com/api/upload', { method: 'POST', body: uploadData });
      if (response.ok) {
        const data = await response.json();
        if (type === 'cover') {
          setCatFormData(prev => ({ ...prev, coverImage: data.imageUrl }));
        } else if (type === 'allGemsUpload') {
          setTempAllCover(data.imageUrl);
        } else {
          setCatFormData(prev => ({ ...prev, mainImage: data.imageUrl }));
        }
      }
    } catch (error) { console.log(error); } finally { setIsUploading(false); }
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    if (!catFormData.title || !catFormData.mainImage) {
      alert("Please provide the Gem Type Name and an Image!");
      return;
    }

    const payload = {
        title: catFormData.title,
        description: catFormData.description || '', 
        mainImage: catFormData.mainImage,
        coverImage: catFormData.coverImage || ''
    };

    const url = isEditCat ? `https://pinnawalagems.onrender.com/api/inventory/categories/${editCatId}` : 'https://pinnawalagems.onrender.com/api/inventory/categories';
    const method = isEditCat ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        alert(isEditCat ? "Gem Type Updated Successfully! 💎" : "New Gem Type Added Successfully! 💎");
        setShowCatForm(false);
        setCatFormData({ title: '', description: '', mainImage: '', coverImage: '' });
        setIsEditCat(false);
        fetchCategories(); 
      } else {
        const errData = await response.json();
        alert("Error saving: " + errData.message);
      }
    } catch (error) { console.log(error); }
  };

  const openEditCategory = (category) => {
    setCatFormData({ 
      title: category.title, 
      description: category.description || '', 
      mainImage: category.mainImage || category.image || '',
      coverImage: category.coverImage || ''
    });
    setEditCatId(category._id);
    setIsEditCat(true);
    setShowCatForm(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm("Are you sure you want to delete this Gem Type? WARNING: All stones inside this category will also be deleted!")) {
      try {
        const response = await fetch(`https://pinnawalagems.onrender.com/api/inventory/categories/${categoryId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) { fetchCategories(); }
      } catch (err) { console.log(err); }
    }
  };

  // Active Category info for Cover Banner
  const activeCategoryObj = selectedCategory === 'all' 
    ? { title: 'All Gem Types', coverImage: allGemsCover } 
    : categories.find(c => c._id === selectedCategory) || {};

  // Filtered Stones based on sidebar selection
  const displayedStones = selectedCategory === 'all' 
    ? stones 
    : stones.filter(s => s.categoryId === selectedCategory || s.category?._id === selectedCategory || s.gemType === activeCategoryObj.title);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-blue-950 flex flex-col">
      
      {/* ---------------- NAVIGATION BAR ---------------- */}
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md text-blue-950 py-4 px-6 border-b border-blue-100 shadow-sm flex flex-col items-center">
        <div className="flex flex-col items-center mb-4">
          <img src="/image_27d308.png" alt="Pinnawala Gems Logo" className="h-14 md:h-16 w-auto object-contain mb-2" />
          <h1 className="text-lg md:text-xl font-serif tracking-[0.2em] uppercase font-bold text-center text-blue-950">Pinnawala Gems</h1>
        </div>
        
        <div className="flex gap-6 md:gap-10 items-center flex-wrap justify-center relative">
          <Link to="/" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Home</Link>
          <Link to="/catalog" className="text-[10px] md:text-xs font-bold tracking-[0.15em] text-blue-600 transition-colors uppercase py-2">Collection</Link>
          <Link to="/workshop" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Workshop</Link>
          <Link to="/feedback" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Feedback</Link>
          <Link to="/contact" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Contact</Link>
          {isAdmin && (
            <Link to="/admin/inventory" className="text-[10px] md:text-xs font-bold tracking-[0.15em] text-red-600 hover:text-red-800 uppercase bg-red-50 px-3 py-1 rounded-sm">
              Inventory
            </Link>
          )}
        </div>
      </nav>

      {/* ---------------- MAIN COLLECTION LAYOUT (SIDEBAR + CONTENT) ---------------- */}
      <main className="flex-1 flex w-full max-w-[1400px] mx-auto pt-44 px-4 md:px-8 gap-6 pb-20">
        
        {/* LEFT SIDEBAR */}
        <aside className="hidden md:flex flex-col w-72 flex-shrink-0 border-r border-slate-200 pr-4">
          <div className="flex items-center justify-between mb-6 pl-2">
            <h3 className="text-[11px] font-bold text-blue-950 uppercase tracking-[0.2em]">Gem Categories</h3>
            {isAdmin && (
              <button onClick={() => { setIsEditCat(false); setCatFormData({ title: '', description: '', mainImage: '', coverImage: '' }); setShowCatForm(true); }} className="text-[10px] bg-blue-950 text-white px-2.5 py-1 rounded hover:bg-blue-900 font-bold uppercase tracking-wider">
                + Add Type
              </button>
            )}
          </div>
          
          <ul className="space-y-1.5">
            <li 
              onClick={() => setSelectedCategory('all')}
              className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-all rounded-sm group/all ${selectedCategory === 'all' ? 'border-l-[3px] border-blue-600 bg-blue-50/60 font-bold text-blue-900' : 'border-l-[3px] border-transparent hover:bg-slate-100 text-slate-600'}`}
            >
              <div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs shadow-sm flex-shrink-0">💎</div>
                <span className="text-[11px] uppercase tracking-wider truncate">All Gem Types</span>
              </div>

              {isAdmin && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setTempAllCover(allGemsCover); setShowEditAllCoverModal(true); }} 
                  className="text-amber-600 hover:text-amber-800 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-amber-50 rounded border border-amber-200 opacity-80 group-hover/all:opacity-100"
                >
                  Edit
                </button>
              )}
            </li>

            {categories.map(cat => (
              <li 
                key={cat._id} 
                onClick={() => setSelectedCategory(cat._id)}
                className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-all rounded-sm group/item ${selectedCategory === cat._id ? 'border-l-[3px] border-blue-600 bg-blue-50/60 font-bold text-blue-900' : 'border-l-[3px] border-transparent hover:bg-slate-100 text-slate-600'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">
                  <img src={cat.mainImage || cat.image} alt={cat.title} className="w-6 h-6 rounded-full object-cover shadow-sm bg-white border border-slate-200 flex-shrink-0" />
                  <span className="text-[11px] uppercase tracking-wider truncate">{cat.title}</span>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2 flex-shrink-0 opacity-80 group-hover/item:opacity-100">
                    <button onClick={(e) => { e.stopPropagation(); openEditCategory(cat); }} className="text-amber-600 hover:text-amber-800 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-amber-50 rounded border border-amber-200">Edit</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat._id); }} className="text-red-600 hover:text-red-800 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-red-50 rounded border border-red-200">Del</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <section className="flex-1 flex flex-col min-w-0">
          
          {/* 🔹 COVER PHOTO BANNER (TRANSPARENT TEXT WITH ARROW ON LEFT) 🔹 */}
          <div 
            className="w-full h-48 md:h-[280px] rounded-sm bg-slate-200 relative bg-cover bg-center shadow-sm flex items-end pb-8 px-6 md:px-12 mb-6"
            style={{ backgroundImage: `url('${activeCategoryObj.coverImage || activeCategoryObj.mainImage || activeCategoryObj.image || 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=2000&auto=format&fit=crop'}')` }}
          >
            <div className="absolute inset-0 bg-black/15 rounded-sm"></div>
            
            {/* Modern Clean Title Without Solid Box */}
            <div className="relative z-10 flex items-center gap-3 text-white drop-shadow-md">
              <span className="text-xl md:text-2xl font-bold">←</span>
              <h2 className="text-xl md:text-3xl font-serif font-bold uppercase tracking-wider">{activeCategoryObj.title}</h2>
            </div>
          </div>

          {/* Advanced Filters Toggle Button */}
          <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className="bg-white border border-blue-200 text-blue-900 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-2 rounded-sm"
            >
              {showFilters ? '✖ Hide Filters' : '🔍 Advanced Filters'}
            </button>
          </div>

          {/* ---------------- GLOBAL FILTER PANEL ---------------- */}
          {showFilters && (
            <div className="bg-white border border-blue-100 shadow-sm p-6 mb-8 rounded-sm transition-all">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-900">Search Collection</h3>
                <button onClick={handleResetFilters} className="text-[10px] uppercase tracking-widest font-bold text-red-500 hover:text-red-700 transition-colors">RESET ALL</button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div><label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Gem ID</label><input type="text" value={searchId} onChange={(e) => setSearchId(e.target.value)} placeholder="e.g. GEM-102" className="w-full bg-slate-50 border border-slate-200 p-2.5 mt-1 text-xs focus:outline-none uppercase" /></div>
                <div><label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Gem Type</label><input type="text" value={searchType} onChange={(e) => setSearchType(e.target.value)} placeholder="e.g. Blue Sapphire" className="w-full bg-slate-50 border border-slate-200 p-2.5 mt-1 text-xs focus:outline-none uppercase" /></div>
                <div><label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Color</label><input type="text" value={searchColor} onChange={(e) => setSearchColor(e.target.value)} placeholder="e.g. Pink" className="w-full bg-slate-50 border border-slate-200 p-2.5 mt-1 text-xs focus:outline-none uppercase" /></div>
                <div><label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Shape</label><input type="text" value={searchShape} onChange={(e) => setSearchShape(e.target.value)} placeholder="e.g. Oval" className="w-full bg-slate-50 border border-slate-200 p-2.5 mt-1 text-xs focus:outline-none uppercase" /></div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={filterCert} onChange={(e) => setFilterCert(e.target.checked)} className="w-4 h-4 accent-blue-950" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-blue-900">Show Certified Only</span>
                </label>
              </div>
            </div>
          )}

          {/* ---------------- EDIT "ALL GEMS" COVER PHOTO MODAL ---------------- */}
          {isAdmin && showEditAllCoverModal && (
            <div className="bg-white p-6 border border-blue-200 shadow-xl mb-8 rounded-sm">
              <h2 className="text-sm font-serif text-blue-950 mb-4 uppercase font-bold">Edit "All Gem Types" Cover Photo</h2>
              <div className="flex flex-col gap-3">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Upload New Cover Photo</label>
                <input type="file" accept="image/*" onChange={(e) => handleCatImageUpload(e, 'allGemsUpload')} className="w-full text-xs text-slate-500" />
                {tempAllCover && <img src={tempAllCover} alt="Preview" className="h-20 mt-2 object-cover border p-1" />}
                {isUploading && <p className="text-xs text-blue-600 font-bold uppercase mt-1">Uploading Image... ⏳</p>}
                
                <div className="flex gap-3 mt-4 pt-3 border-t border-slate-100">
                  <button type="button" onClick={() => setShowEditAllCoverModal(false)} className="w-1/2 bg-slate-200 py-2.5 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-300">Cancel</button>
                  <button type="button" onClick={() => { setAllGemsCover(tempAllCover); localStorage.setItem('allGemsCover', tempAllCover); setShowEditAllCoverModal(false); alert("All Gems Cover Photo Updated! 💎"); }} className="w-1/2 bg-blue-950 text-white py-2.5 font-bold uppercase text-[10px] tracking-widest hover:bg-blue-800">Save Cover Photo</button>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- ADMIN ADD/EDIT GEM TYPE FORM MODAL/PANEL ---------------- */}
          {isAdmin && showCatForm && (
            <div className="bg-white p-6 border border-blue-200 shadow-xl mb-8 rounded-sm">
              <h2 className="text-sm font-serif text-blue-950 mb-4 uppercase font-bold">{isEditCat ? 'Edit Gem Type' : 'Add New Gem Type'}</h2>
              <form onSubmit={handleCatSubmit} className="flex flex-col gap-3">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Gem Type Name</label>
                <input type="text" placeholder="e.g. Pink Sapphire" value={catFormData.title} onChange={(e) => setCatFormData(prev => ({ ...prev, title: e.target.value }))} className="w-full bg-slate-50 border border-blue-200 p-2.5 text-xs focus:outline-none" required />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Small Icon (Sidebar)</label>
                    <input type="file" onChange={(e) => handleCatImageUpload(e, 'main')} className="w-full text-xs text-slate-500" />
                    {catFormData.mainImage && <img src={catFormData.mainImage} alt="Icon" className="h-12 mt-2 object-contain border p-1 bg-white" />}
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Cover Photo (Banner)</label>
                    <input type="file" onChange={(e) => handleCatImageUpload(e, 'cover')} className="w-full text-xs text-slate-500" />
                    {catFormData.coverImage && <img src={catFormData.coverImage} alt="Cover" className="h-12 mt-2 object-cover border p-1" />}
                  </div>
                </div>

                {isUploading && <p className="text-xs text-blue-600 font-bold uppercase mt-1">Uploading Image... ⏳</p>}
                
                <div className="flex gap-3 mt-4 pt-3 border-t border-slate-100">
                  <button type="button" onClick={() => setShowCatForm(false)} className="w-1/2 bg-slate-200 py-2.5 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-300">Cancel</button>
                  <button type="submit" disabled={isUploading || !catFormData.mainImage} className="w-1/2 bg-blue-950 text-white py-2.5 font-bold uppercase text-[10px] tracking-widest hover:bg-blue-800 disabled:bg-slate-400">Save Category</button>
                </div>
              </form>
            </div>
          )}

          {/* ---------------- STONES DISPLAY GRID ---------------- */}
          {loading ? (
             <p className="text-center text-blue-900 font-serif tracking-widest py-12 animate-pulse uppercase text-xs">Loading Collection...</p>
          ) : displayedStones.length === 0 ? (
            <p className="text-center text-slate-400 font-serif tracking-widest py-12 uppercase text-xs border border-dashed border-slate-200">No gemstones available in this selection.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayedStones.map(stone => (
                <div key={stone._id} className="bg-white border border-slate-100 p-3 shadow-sm hover:shadow-lg transition-all flex flex-col relative group rounded-sm">
                  {stone.isFeatured && <span className="absolute top-2 left-2 bg-amber-400 text-amber-950 text-[8px] px-1.5 py-0.5 uppercase font-bold tracking-widest z-10 shadow-sm">★ Featured</span>}
                  
                  <Link to={`/gem/${stone._id}`} className="relative h-32 bg-slate-50 flex items-center justify-center mb-3 overflow-hidden rounded-sm">
                    <img src={stone.image} alt={stone.title} className="max-h-full object-contain group-hover:scale-105 transition-transform duration-500 mix-blend-multiply" />
                    {stone.hasCertificate && <div className="absolute bottom-1 right-1 bg-white text-green-600 px-1.5 py-0.5 text-[7px] font-bold tracking-widest border border-green-200 shadow-sm">CERT</div>}
                  </Link>

                  <h4 className="text-[11px] font-serif font-bold text-blue-950 uppercase mb-1 line-clamp-1" title={stone.title}>{stone.title}</h4>
                  {stone.stoneId && <p className="text-[8px] text-slate-400 font-bold tracking-widest uppercase mb-2">ID: {stone.stoneId}</p>}
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {stone.shape && <span className="text-blue-800 text-[8px] font-bold tracking-wider uppercase border border-blue-100 px-1 py-0.5">{stone.shape}</span>}
                    {stone.weight && <span className="text-blue-800 text-[8px] font-bold tracking-wider uppercase border border-blue-100 px-1 py-0.5">{stone.weight} ct</span>}
                  </div>
                  
                  <div className="mt-auto border-t border-slate-100 pt-2 text-center">
                    <Link to={`/gem/${stone._id}`} className="text-blue-700 hover:text-blue-900 text-[9px] font-bold uppercase tracking-widest transition-colors">View Details ➔</Link>
                  </div>
                </div>
              ))}
            </div>
          )}

        </section>
      </main>
    </div>
  );
}

export default App;