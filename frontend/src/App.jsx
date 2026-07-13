import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function App() {
  const [categories, setCategories] = useState([]);
  const [stones, setStones] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const isAdmin = !!localStorage.getItem('token'); 

  const [showCatForm, setShowCatForm] = useState(false);
  const [isEditCat, setIsEditCat] = useState(false);
  const [editCatId, setEditCatId] = useState(null);
  const [catFormData, setCatFormData] = useState({ title: '', description: '', mainImage: '' });
  const [isUploading, setIsUploading] = useState(false);

  // Filters
  const [searchId, setSearchId] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchColor, setSearchColor] = useState('');
  const [searchShape, setSearchShape] = useState('');
  const [minWeight, setMinWeight] = useState('');
  const [maxWeight, setMaxWeight] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [filterCert, setFilterCert] = useState(false);

  const [showFilters, setShowFilters] = useState(false);

  const fetchCategories = () => {
    fetch('https://pinnawalagems.onrender.com/api/inventory/categories')
      .then(res => res.json())
      .then(data => { 
        setCategories(Array.isArray(data) ? data : []); 
        setLoading(false); 
      })
      .catch(err => { console.log(err); setLoading(false); });
  };

  useEffect(() => { fetchCategories(); }, []);

  useEffect(() => {
    const isFilterActive = searchId || searchType || searchColor || searchShape || minWeight || maxWeight || minPrice || maxPrice || filterCert;
    if (isFilterActive) {
      setIsSearching(true);
      setLoading(true);
      let url = `https://pinnawalagems.onrender.com/api/inventory/stones?page=1&limit=50`;
      if (searchId) url += `&stoneId=${searchId}`;
      if (searchType) url += `&gemType=${searchType}`;
      if (searchColor) url += `&color=${searchColor}`;
      if (searchShape) url += `&shape=${searchShape}`;
      if (minWeight) url += `&minWeight=${minWeight}`;
      if (maxWeight) url += `&maxWeight=${maxWeight}`;
      if (minPrice) url += `&minPrice=${minPrice}`;
      if (maxPrice) url += `&maxPrice=${maxPrice}`;
      if (filterCert) url += `&hasCertificate=true`;

      fetch(url).then(res => res.json()).then(data => { setStones(data.stones || []); setLoading(false); }).catch(err => console.log(err));
    } else {
      setIsSearching(false);
    }
  }, [searchId, searchType, searchColor, searchShape, minWeight, maxWeight, minPrice, maxPrice, filterCert]);

  const handleResetFilters = () => {
    setSearchId(''); setSearchType(''); setSearchColor(''); setSearchShape('');
    setMinWeight(''); setMaxWeight(''); setMinPrice(''); setMaxPrice('');
    setFilterCert(false); setIsSearching(false);
  };

  const handleCatImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('image', file);
    setIsUploading(true);
    try {
      const response = await fetch('https://pinnawalagems.onrender.com/api/upload', { method: 'POST', body: uploadData });
      if (response.ok) {
        const data = await response.json();
        setCatFormData(prev => ({ ...prev, mainImage: data.imageUrl }));
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
        mainImage: catFormData.mainImage
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
        setCatFormData({ title: '', description: '', mainImage: '' });
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
      mainImage: category.mainImage || category.image || '' 
    });
    setEditCatId(category._id);
    setIsEditCat(true);
    setShowCatForm(true);
    window.scrollTo({ top: 300, behavior: 'smooth' }); 
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-blue-950">
      
      {/* ---------------- NAVIGATION BAR ---------------- */}
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md text-blue-950 py-4 px-6 border-b border-blue-100 shadow-sm flex flex-col items-center">
        <div className="flex flex-col items-center mb-4">
          <img src="/image_27d308.png" alt="Pinnawala Gems Logo" className="h-14 md:h-16 w-auto object-contain mb-2" />
          <h1 className="text-lg md:text-xl font-serif tracking-[0.2em] uppercase font-bold text-center text-blue-950">Pinnawala Gems</h1>
        </div>
        
        <div className="flex gap-6 md:gap-10 items-center flex-wrap justify-center relative">
          <Link to="/" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Home</Link>
          
          {/* 🔹 COLLECTION DROPDOWN 🔹 */}
          <div className="relative group h-full flex items-center cursor-pointer">
            <Link to="/catalog" className="text-[10px] md:text-xs font-bold tracking-[0.15em] text-blue-600 transition-colors uppercase py-2">Collection</Link>
            
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-[450px] bg-white border border-blue-50 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-6 rounded-b-md before:content-[''] before:absolute before:-top-4 before:left-0 before:w-full before:h-4">
              <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-4 pb-2 border-b border-slate-100">Browse by Gem Type</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {categories.map(cat => (
                  <Link key={cat._id} to={`/category/${cat._id}`} className="flex items-center gap-3 p-2 hover:bg-blue-50 transition-colors rounded-sm group/item">
                    <img src={cat.mainImage || cat.image} alt={cat.title} className="w-8 h-8 object-cover rounded-full border border-blue-100 shadow-sm group-hover/item:scale-110 transition-transform bg-white" />
                    <span className="text-[9px] font-bold uppercase text-blue-900 tracking-wider">{cat.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

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

      <main className="p-8 max-w-[1400px] mx-auto pt-44">
        
        {/* ---------------- 🔹 FILTER TOGGLE BUTTON ---------------- */}
        <div className="flex justify-center mb-6">
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="bg-white border border-blue-200 text-blue-900 px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-2"
          >
            {showFilters ? '✖ Hide Filters' : '🔍 Advanced Filters'}
          </button>
        </div>

        {/* ---------------- GLOBAL FILTER PANEL ---------------- */}
        {showFilters && (
          <div className="bg-white border border-blue-100 shadow-sm p-6 mb-12 rounded-sm mx-auto transition-all max-w-6xl">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest text-blue-900 flex items-center gap-2">🔍 Search Collection</h3>
              <button onClick={handleResetFilters} className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-red-500 hover:text-red-700 transition-colors">RESET ALL</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div><label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Gem ID</label><input type="text" value={searchId} onChange={(e) => setSearchId(e.target.value)} placeholder="e.g. GEM-102" className="w-full bg-slate-50 border border-slate-200 p-3 mt-1 text-xs focus:outline-none focus:border-blue-950 uppercase" /></div>
              <div><label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Gem Type</label><input type="text" value={searchType} onChange={(e) => setSearchType(e.target.value)} placeholder="e.g. Blue Sapphire" className="w-full bg-slate-50 border border-slate-200 p-3 mt-1 text-xs focus:outline-none focus:border-blue-950 uppercase" /></div>
              <div><label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Color</label><input type="text" value={searchColor} onChange={(e) => setSearchColor(e.target.value)} placeholder="e.g. Pink, Royal Blue" className="w-full bg-slate-50 border border-slate-200 p-3 mt-1 text-xs focus:outline-none focus:border-blue-950 uppercase" /></div>
              <div><label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Shape</label><input type="text" value={searchShape} onChange={(e) => setSearchShape(e.target.value)} placeholder="e.g. Oval, Cushion" className="w-full bg-slate-50 border border-slate-200 p-3 mt-1 text-xs focus:outline-none focus:border-blue-950 uppercase" /></div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Weight (ct)</label>
                <div className="flex gap-2 mt-1">
                  <input type="number" step="0.01" placeholder="Min" value={minWeight} onChange={(e) => setMinWeight(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 p-3 text-xs focus:outline-none focus:border-blue-950" />
                  <input type="number" step="0.01" placeholder="Max" value={maxWeight} onChange={(e) => setMaxWeight(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 p-3 text-xs focus:outline-none focus:border-blue-950" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Price (Rs.)</label>
                <div className="flex gap-2 mt-1">
                  <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 p-3 text-xs focus:outline-none focus:border-blue-950" />
                  <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 p-3 text-xs focus:outline-none focus:border-blue-950" />
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={filterCert} onChange={(e) => setFilterCert(e.target.checked)} className="w-5 h-5 accent-blue-950" />
                <span className="text-xs font-bold uppercase tracking-widest text-blue-900">Show Certified Only</span>
              </label>
            </div>
          </div>
        )}

        {/* ---------------- ADMIN ADD/EDIT GEM TYPE FORM ---------------- */}
        {isAdmin && (
          <div className="mb-10 text-center">
            {!showCatForm && (
              <button onClick={() => { setIsEditCat(false); setCatFormData({ title: '', description: '', mainImage: '' }); setShowCatForm(true); }} className="bg-blue-950 text-white px-8 py-3 text-xs font-bold tracking-widest uppercase hover:bg-blue-800 transition-colors shadow-md">
                + Add Gem Type
              </button>
            )}
            
            {showCatForm && (
              <div className="bg-white p-8 max-w-2xl mx-auto border border-blue-100 shadow-xl mt-6 text-left">
                <h2 className="text-xl font-serif text-blue-950 mb-6 uppercase font-bold">{isEditCat ? 'Edit Gem Type' : 'Add New Gem Type'}</h2>
                <form onSubmit={handleCatSubmit} className="flex flex-col gap-4">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 -mb-2">Gem Type Name</label>
                  <input type="text" placeholder="e.g. Pink Sapphire" value={catFormData.title} onChange={(e) => setCatFormData(prev => ({ ...prev, title: e.target.value }))} className="w-full bg-slate-50 border border-blue-200 p-3 focus:outline-none focus:border-blue-950" required />
                  
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 -mb-2 mt-2">Category Description (Optional)</label>
                  <textarea placeholder="Write a short description..." value={catFormData.description} onChange={(e) => setCatFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full bg-slate-50 border border-blue-200 p-3 h-24 focus:outline-none focus:border-blue-950"></textarea>

                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 -mb-2 mt-2">Main Category Image</label>
                  <input type="file" onChange={handleCatImageUpload} className="w-full text-sm text-slate-500" />
                  
                  {isUploading && <p className="text-xs text-blue-600 font-bold uppercase mt-2 tracking-widest">Uploading Image... ⏳</p>}
                  {catFormData.mainImage && !isUploading && (
                    <div className="mt-4 border border-slate-200 p-2 bg-slate-50 inline-block">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-2">Image Preview</p>
                      <img src={catFormData.mainImage} alt="Preview" className="h-32 object-contain bg-white" />
                    </div>
                  )}
                  
                  <div className="flex gap-4 mt-6 border-t border-slate-100 pt-6">
                    <button type="button" onClick={() => setShowCatForm(false)} className="w-1/2 bg-slate-200 py-3 font-bold uppercase text-xs tracking-widest hover:bg-slate-300">Cancel</button>
                    <button type="submit" disabled={isUploading || !catFormData.mainImage} className="w-1/2 bg-blue-950 text-white py-3 font-bold uppercase text-xs tracking-widest hover:bg-blue-800 disabled:bg-slate-400">Save Category</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ---------------- DISPLAY AREA ---------------- */}
        {loading ? (
           <p className="text-center text-blue-900 font-serif tracking-widest py-12 animate-pulse uppercase">Loading...</p>
        ) : isSearching ? (
          stones.length === 0 ? (
            <p className="text-center text-slate-400 font-serif tracking-widest py-12 uppercase">No stones match your search criteria.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {stones.map(stone => (
                <div key={stone._id} className="bg-white border border-slate-100 p-4 shadow-sm hover:shadow-xl transition-all flex flex-col relative group rounded-sm">
                  {stone.isFeatured && <span className="absolute top-2 left-2 bg-amber-400 text-amber-950 text-[8px] px-2 py-1 uppercase font-bold tracking-widest z-10 shadow-sm">★ Featured</span>}
                  
                  <Link to={`/gem/${stone._id}`} className="relative h-36 bg-slate-50 flex items-center justify-center mb-4 overflow-hidden rounded-sm">
                    <img src={stone.image} alt={stone.title} className="max-h-full object-contain group-hover:scale-110 transition-transform duration-700" />
                    {stone.hasCertificate && <div className="absolute bottom-2 right-2 bg-white text-green-600 px-2 py-1 text-[8px] font-bold tracking-widest border border-green-200 shadow-sm flex items-center gap-1"><span>✓</span> CERT</div>}
                  </Link>

                  <h4 className="text-sm font-serif font-bold text-blue-950 uppercase mb-1 line-clamp-1" title={stone.title}>{stone.title}</h4>
                  {stone.stoneId && <p className="text-[8px] text-slate-400 font-bold tracking-widest uppercase mb-2">ID: {stone.stoneId}</p>}
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    <span className="text-blue-800 text-[8px] font-bold tracking-wider uppercase border border-blue-100 px-1 py-0.5">{stone.shape}</span>
                    <span className="text-blue-800 text-[8px] font-bold tracking-wider uppercase border border-blue-100 px-1 py-0.5">{stone.weight} ct</span>
                  </div>
                  
                  <div className="mt-auto border-t border-slate-100 pt-3 text-center">
                    <Link to={`/gem/${stone._id}`} className="text-blue-700 hover:text-blue-900 text-[9px] font-bold uppercase tracking-widest transition-colors">View Details ➔</Link>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          categories.length === 0 ? (
            <p className="text-center text-slate-400 font-serif tracking-widest py-12 uppercase border border-dashed border-slate-300">No Gem Types Added Yet. Please add a new category.</p>
          ) : (
            /* 🔹 එක පේළියට Columns 4 ක් එන්න හදපු Grid එක 🔹 */
            <div className="max-w-6xl mx-auto">
              <h2 className="text-lg font-serif font-bold text-blue-950 uppercase text-center mb-8 tracking-[0.2em] border-b border-slate-200 pb-4">Our Gem Categories</h2>
              
              {/* මෙතන lg:grid-cols-4 දැම්මම එක පේළියට 4 ගාණේ ලස්සනට පෙළගැස්වෙනවා */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {categories.map(category => (
                  <div key={category._id} className="bg-white border border-blue-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between p-4 group rounded-sm">
                    <Link to={`/category/${category._id}`} className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full border border-blue-100 overflow-hidden bg-white shadow-sm flex-shrink-0">
                        <img src={category.mainImage || category.image} alt={category.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div>
                        <h3 className="text-xs font-serif font-bold text-blue-950 uppercase tracking-wider">{category.title}</h3>
                        <p className="text-[8px] text-blue-600 font-bold uppercase tracking-widest mt-1">View Collection ➔</p>
                      </div>
                    </Link>
                    
                    {isAdmin && (
                      <div className="flex flex-col gap-2 ml-4 border-l border-slate-100 pl-4">
                        <button onClick={(e) => { e.preventDefault(); openEditCategory(category); }} className="text-amber-500 hover:text-amber-600 text-[9px] uppercase font-bold tracking-widest">Edit</button>
                        <button onClick={(e) => { e.preventDefault(); handleDeleteCategory(category._id); }} className="text-red-500 hover:text-red-600 text-[9px] uppercase font-bold tracking-widest">Delete</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}

export default App;