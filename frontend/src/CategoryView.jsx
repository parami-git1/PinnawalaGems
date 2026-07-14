import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

function CategoryView() {
  const { categoryId } = useParams();
  const [categoryTitle, setCategoryTitle] = useState('Gem Collection');
  const [currentCategory, setCurrentCategory] = useState(null); 
  const [stones, setStones] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const isAdmin = !!localStorage.getItem('token');

  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editStoneId, setEditStoneId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false); 
  
  const [formData, setFormData] = useState({
    title: '', shape: '', weight: '', color: '', price: '', description: '', origin: '',
    hasCertificate: false, certificateDetails: '', certificateImage: '', image: '', additionalImages: [], isFeatured: false
  });

  const [searchId, setSearchId] = useState('');
  const [searchColor, setSearchColor] = useState('');
  const [searchShape, setSearchShape] = useState('');
  const [minWeight, setMinWeight] = useState('');
  const [maxWeight, setMaxWeight] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [filterCert, setFilterCert] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [hoveredStoneId, setHoveredStoneId] = useState(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  useEffect(() => {
    let interval;
    if (hoveredStoneId) {
      interval = setInterval(() => {
        setCurrentImgIndex(prev => prev + 1);
      }, 1000); 
    } else {
      setCurrentImgIndex(0);
    }
    return () => clearInterval(interval);
  }, [hoveredStoneId]);
  
  const fetchCategoryAndStones = async (page = 1) => {
    try {
      const catRes = await fetch('https://pinnawalagems.onrender.com/api/inventory/categories');
      const catData = await catRes.json();
      setCategories(catData);

      const currentCat = catData.find(c => c._id === categoryId);
      if (currentCat) {
        setCategoryTitle(currentCat.title);
        setCurrentCategory(currentCat);
      }

      let url = `https://pinnawalagems.onrender.com/api/inventory/categories/${categoryId}/stones?page=${page}&limit=15`; 
      if (searchId) url += `&stoneId=${searchId}`;
      if (searchColor) url += `&color=${searchColor}`;
      if (searchShape) url += `&shape=${searchShape}`;
      if (minWeight) url += `&minWeight=${minWeight}`;
      if (maxWeight) url += `&maxWeight=${maxWeight}`;
      if (minPrice) url += `&minPrice=${minPrice}`;
      if (maxPrice) url += `&maxPrice=${maxPrice}`;
      if (filterCert) url += `&hasCertificate=true`;

      const stoneRes = await fetch(url);
      const data = await stoneRes.json();
      setStones(data.stones || []);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage || 1);
    } catch (err) { console.log(err); }
  };

  useEffect(() => { fetchCategoryAndStones(currentPage); }, [categoryId, currentPage, searchId, searchColor, searchShape, minWeight, maxWeight, minPrice, maxPrice, filterCert]);

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingCover(true);
    const uploadData = new FormData(); 
    uploadData.append('image', file);
    try {
      const response = await fetch('https://pinnawalagems.onrender.com/api/upload', { method: 'POST', body: uploadData });
      if (response.ok) { 
        const data = await response.json(); 
        
        const updateRes = await fetch(`https://pinnawalagems.onrender.com/api/inventory/categories/${categoryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ coverImage: data.imageUrl })
        });

        if (updateRes.ok) {
          const updatedCat = await updateRes.json();
          setCurrentCategory(updatedCat);
          alert("Cover Photo Updated Successfully! 🖼️");
        }
      }
    } catch (error) { console.log(error); } finally { setIsUploadingCover(false); }
  };

  const handleResetFilters = () => {
    setSearchId(''); setSearchColor(''); setSearchShape(''); setMinWeight(''); setMaxWeight(''); setMinPrice(''); setMaxPrice(''); setFilterCert(false); setCurrentPage(1);
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadData = new FormData(); uploadData.append('image', file);
    setIsUploading(true);
    try {
      const response = await fetch('https://pinnawalagems.onrender.com/api/upload', { method: 'POST', body: uploadData });
      if (response.ok) { const data = await response.json(); setFormData({ ...formData, image: data.imageUrl }); }
    } catch (error) { console.log(error); } finally { setIsUploading(false); }
  };

  const handleAdditionalImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setIsUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const uploadData = new FormData(); uploadData.append('image', file);
        const response = await fetch('https://pinnawalagems.onrender.com/api/upload', { method: 'POST', body: uploadData });
        if (response.ok) {
          const data = await response.json();
          uploadedUrls.push(data.imageUrl);
        }
      }
      setFormData(prev => ({ ...prev, additionalImages: [...(prev.additionalImages || []), ...uploadedUrls] }));
    } catch (error) { console.log(error); } finally { setIsUploading(false); }
  };

  const removeAdditionalImage = (indexToRemove) => {
    setFormData(prev => ({ ...prev, additionalImages: prev.additionalImages.filter((_, index) => index !== indexToRemove) }));
  };

  const handleCertUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadData = new FormData(); uploadData.append('image', file);
    setIsUploadingCert(true);
    try {
      const response = await fetch('https://pinnawalagems.onrender.com/api/upload', { method: 'POST', body: uploadData });
      if (response.ok) { const data = await response.json(); setFormData({ ...formData, certificateImage: data.imageUrl }); }
    } catch (error) { console.log(error); } finally { setIsUploadingCert(false); }
  };

  const openAddForm = () => {
    setIsEditMode(false);
    setFormData({ title: '', shape: '', weight: '', color: '', price: '', description: '', origin: '', hasCertificate: false, certificateDetails: '', certificateImage: '', image: '', additionalImages: [], isFeatured: false });
    setShowForm(true);
  };

  const openEditForm = (stone) => {
    setIsEditMode(true);
    setEditStoneId(stone._id);
    setFormData({
      title: stone.title, shape: stone.shape, weight: stone.weight, color: stone.color, price: stone.price || '', description: stone.description || '', origin: stone.origin || '',
      hasCertificate: stone.hasCertificate, certificateDetails: stone.certificateDetails || '', certificateImage: stone.certificateImage || '', image: stone.image, additionalImages: stone.additionalImages || [], isFeatured: stone.isFeatured
    });
    setShowForm(true);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.hasCertificate && !formData.certificateDetails && !formData.certificateImage) {
      alert("Please provide either a Certificate Number OR upload a Certificate Image.");
      return;
    }
    const payload = { ...formData, categoryId };
    if (!payload.price) delete payload.price;

    const url = isEditMode ? `https://pinnawalagems.onrender.com/api/inventory/stones/${editStoneId}` : 'https://pinnawalagems.onrender.com/api/inventory/stones';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        alert(isEditMode ? "Stone details updated! 💎" : "New stone added! 💎");
        setShowForm(false);
        fetchCategoryAndStones(currentPage); 
      } else {
        alert("Error saving stone. Check backend requirements.");
      }
    } catch (error) { console.log(error); }
  };

  const handleDeleteStone = async (stoneId) => {
    if(window.confirm("Are you sure you want to delete this stone?")) {
       await fetch(`https://pinnawalagems.onrender.com/api/inventory/stones/${stoneId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
       fetchCategoryAndStones(currentPage);
    }
  };

  const handleDeleteAllStones = async () => {
    if (window.confirm("🚨 WARNING: Are you ABSOLUTELY SURE you want to delete ALL stones in this category? This action cannot be undone!")) {
       try {
         const response = await fetch(`https://pinnawalagems.onrender.com/api/inventory/categories/${categoryId}/stones`, {
           method: 'DELETE',
           headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
         });
         if (response.ok) {
           alert("All stones have been deleted successfully! 🗑️");
           fetchCategoryAndStones(1);
         }
       } catch (error) {
         console.log(error);
       }
    }
  };

  const handleToggleFeature = async (stoneId) => {
    try {
      await fetch(`https://pinnawalagems.onrender.com/api/inventory/stones/${stoneId}/feature`, { method: 'PUT', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      fetchCategoryAndStones(currentPage);
    } catch (error) { console.log(error); }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-blue-950">
      
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md text-blue-950 py-4 px-6 border-b border-blue-100 shadow-sm flex flex-col items-center">
        <div className="flex flex-col items-center mb-4">
          <img src="/image_27d308.png" alt="Pinnawala Gems Logo" className="h-14 md:h-16 w-auto object-contain mb-2" />
          <h1 className="text-lg md:text-xl font-serif tracking-[0.2em] uppercase font-bold text-center text-blue-950">Pinnawala Gems</h1>
        </div>
        
        <div className="flex gap-6 md:gap-10 items-center flex-wrap justify-center relative">
          <Link to="/" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Home</Link>
          
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

      <main className="max-w-[1500px] mx-auto px-6 py-12 pt-48 flex flex-col md:flex-row gap-8">
        
        <aside className="w-full md:w-1/4 lg:w-1/5 hidden md:block border-r border-slate-200 pr-6">
           <h3 className="text-xs font-bold uppercase tracking-widest text-blue-900 mb-6 pb-3 border-b border-blue-100">Gem Categories</h3>
           <div className="flex flex-col gap-2">
             {categories.map(cat => (
               <Link key={cat._id} to={`/category/${cat._id}`} className={`flex items-center gap-3 p-2.5 transition-all rounded-sm ${categoryId === cat._id ? 'bg-blue-50 border-l-4 border-blue-600 shadow-sm' : 'hover:bg-white hover:shadow-sm'}`}>
                 <img src={cat.mainImage || cat.image} alt={cat.title} className="w-8 h-8 object-cover rounded-full border border-blue-100 bg-white" />
                 <span className={`text-[10px] font-bold uppercase tracking-wider ${categoryId === cat._id ? 'text-blue-950' : 'text-slate-500'}`}>{cat.title}</span>
               </Link>
             ))}
           </div>
        </aside>

        <div className="flex-1">
          
          <div className="relative mb-10 p-8 md:p-12 rounded-sm overflow-hidden bg-slate-100 border border-blue-50 shadow-sm min-h-[250px] md:min-h-[320px] flex items-center">
            
            {currentCategory && currentCategory.coverImage && (
              <>
                <img 
                  src={currentCategory.coverImage} 
                  alt="Category Cover" 
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
                />
                <div className="absolute inset-0 bg-white/40 pointer-events-none"></div>
              </>
            )}
            
            <div className="relative z-10 w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              
              {/* 🔹 මෙතන Box එකයි අකුරුයි ගාණට පොඩි කළා 🔹 */}
              <div className="bg-white/70 backdrop-blur-md p-4 md:px-6 md:py-4 rounded-sm shadow-sm border border-white/50 inline-block">
                <h2 className="text-[9px] md:text-[10px] text-blue-800 tracking-[0.3em] uppercase mb-1 font-bold">Premium Selection</h2>
                <h1 className="text-2xl md:text-4xl font-serif font-bold text-blue-950 uppercase">{categoryTitle}</h1>
              </div>
              
              {isAdmin && (
                <label className="cursor-pointer bg-white/90 backdrop-blur-sm border border-blue-200 text-blue-900 px-5 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-md flex items-center gap-2">
                  {isUploadingCover ? '⏳ Uploading...' : '🖼️ Add/Change Cover'}
                  <input type="file" className="hidden" onChange={handleCoverUpload} disabled={isUploadingCover} accept="image/*" />
                </label>
              )}
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-4 items-center">
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className="bg-white border border-blue-200 text-blue-900 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-2"
            >
              {showFilters ? '✖ Hide Filters' : '🔍 Advanced Filters'}
            </button>
            
            {isAdmin && (
              <div className="flex items-center gap-4">
                {!showForm && (
                  <button onClick={openAddForm} className="bg-blue-950 text-white px-6 py-2.5 text-[10px] font-bold tracking-widest uppercase hover:bg-blue-800 shadow-sm">
                    + Add Stone
                  </button>
                )}
                {!showForm && stones.length > 0 && (
                  <button onClick={handleDeleteAllStones} className="bg-red-50 text-red-600 border border-red-200 px-6 py-2.5 text-[10px] font-bold tracking-widest uppercase hover:bg-red-600 hover:text-white shadow-sm transition-colors">
                    🗑️ Delete All
                  </button>
                )}
              </div>
            )}
          </div>

          {showFilters && (
            <div className="bg-white border border-blue-100 shadow-sm p-6 mb-10 rounded-sm transition-all">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-900">🔍 Filter Collection</h3>
                <button onClick={handleResetFilters} className="text-[10px] uppercase tracking-widest font-bold text-red-500 hover:text-red-700 transition-colors">Reset All</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <div><label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Gem ID</label><input type="text" value={searchId} onChange={(e) => setSearchId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 mt-1 text-xs uppercase focus:border-blue-950" /></div>
                <div><label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Color</label><input type="text" value={searchColor} onChange={(e) => setSearchColor(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 mt-1 text-xs uppercase focus:border-blue-950" /></div>
                <div><label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Shape</label><input type="text" value={searchShape} onChange={(e) => setSearchShape(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 mt-1 text-xs uppercase focus:border-blue-950" /></div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Weight (ct)</label>
                  <div className="flex gap-2 mt-1">
                    <input type="number" value={minWeight} onChange={(e) => setMinWeight(e.target.value)} placeholder="Min" className="w-1/2 bg-slate-50 border border-slate-200 p-2 text-xs focus:border-blue-950" />
                    <input type="number" value={maxWeight} onChange={(e) => setMaxWeight(e.target.value)} placeholder="Max" className="w-1/2 bg-slate-50 border border-slate-200 p-2 text-xs focus:border-blue-950" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Price (Rs.)</label>
                  <div className="flex gap-2 mt-1">
                    <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min" className="w-1/2 bg-slate-50 border border-slate-200 p-2 text-xs focus:border-blue-950" />
                    <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max" className="w-1/2 bg-slate-50 border border-slate-200 p-2 text-xs focus:border-blue-950" />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={filterCert} onChange={(e) => setFilterCert(e.target.checked)} className="w-4 h-4 accent-blue-950" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Show Certified Only</span>
                </label>
              </div>
            </div>
          )}

          {showForm && (
            <div className="bg-white p-8 w-full border border-blue-100 shadow-xl rounded-sm mb-10">
              <h2 className="text-xl font-serif text-blue-950 mb-6 tracking-widest uppercase font-bold">{isEditMode ? 'Edit Stone Details' : 'Add Stone Details'}</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="text-[10px] text-slate-500 uppercase font-bold">Gem Title *</label><input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full border p-2 mt-1 text-sm" /></div>
                <div className="md:col-span-2"><label className="text-[10px] text-slate-500 uppercase font-bold">Origin (Optional)</label><input type="text" name="origin" value={formData.origin} onChange={handleChange} placeholder="e.g. Ceylon" className="w-full border p-2 mt-1 text-sm bg-slate-50" /></div>
                <div><label className="text-[10px] text-slate-500 uppercase font-bold">Shape *</label><input type="text" name="shape" value={formData.shape} onChange={handleChange} required className="w-full border p-2 mt-1 text-sm" /></div>
                <div><label className="text-[10px] text-slate-500 uppercase font-bold">Color *</label><input type="text" name="color" value={formData.color} onChange={handleChange} required className="w-full border p-2 mt-1 text-sm" /></div>
                <div><label className="text-[10px] text-slate-500 uppercase font-bold">Weight (ct) *</label><input type="number" step="0.01" name="weight" value={formData.weight} onChange={handleChange} required className="w-full border p-2 mt-1 text-sm" /></div>
                <div><label className="text-[10px] text-slate-500 uppercase font-bold">Price (Rs.) - Optional</label><input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} className="w-full border p-2 mt-1 text-sm" /></div>
                <div className="md:col-span-2 mt-2"><label className="flex items-center gap-2"><input type="checkbox" name="hasCertificate" checked={formData.hasCertificate} onChange={handleChange} className="w-4 h-4" /><span className="text-[10px] text-blue-900 uppercase font-bold">Has Certificate?</span></label></div>
                {formData.hasCertificate && (
                  <div className="md:col-span-2 bg-blue-50 border p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="text-[10px] text-slate-500 uppercase font-bold">Cert Number (Optional)</label><input type="text" name="certificateDetails" value={formData.certificateDetails} onChange={handleChange} className="w-full border p-2 mt-1 text-sm bg-white" /></div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-bold">Cert Image (Optional)</label><input type="file" onChange={handleCertUpload} className="mt-1 text-xs w-full" />
                      {formData.certificateImage && !isUploadingCert && <p className="text-[10px] text-green-600 mt-1 font-bold uppercase">✅ Uploaded</p>}
                    </div>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="text-[10px] text-slate-500 uppercase font-bold">Description (Optional)</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} className="w-full border p-2 mt-1 text-sm h-20"></textarea>
                </div>
                <div className="md:col-span-2 border border-dashed border-blue-200 p-4 text-center">
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-2">Upload Main Image *</label>
                  <input type="file" onChange={handleImageUpload} className="text-xs mx-auto block" required={!isEditMode && !formData.image} />
                  {formData.image && !isUploading && <img src={formData.image} alt="Preview" className="h-20 mx-auto object-cover mt-2 border p-1" />}
                </div>
                <div className="md:col-span-2 border border-slate-200 p-4 bg-slate-50">
                  <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Additional Images (Optional)</label>
                  <input type="file" multiple onChange={handleAdditionalImagesUpload} className="text-xs block" />
                  {formData.additionalImages && formData.additionalImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.additionalImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img src={img} alt={`Add ${idx}`} className="h-12 w-12 object-cover border border-slate-300" />
                          <button type="button" onClick={() => removeAdditionalImage(idx)} className="absolute -top-2 -right-2 bg-red-600 text-white w-4 h-4 rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✖</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="md:col-span-2 flex gap-3 mt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="w-1/3 bg-slate-200 font-bold py-3 text-[10px] uppercase">Cancel</button>
                  <button type="submit" disabled={isUploading || isUploadingCert} className="w-2/3 bg-blue-950 text-white font-bold py-3 text-[10px] uppercase">Save Stone</button>
                </div>
              </form>
            </div>
          )}

          {stones.length === 0 ? (
            <p className="text-center text-slate-400 font-serif tracking-widest py-12 border border-dashed border-slate-200">No stones match your search criteria.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {stones.map(stone => {
                const allImages = [stone.image, ...(stone.additionalImages || [])].filter(Boolean);
                const displayImage = hoveredStoneId === stone._id ? allImages[currentImgIndex % allImages.length] : stone.image;

                return (
                  <div key={stone._id} className="bg-white border border-slate-100 p-4 shadow-sm hover:shadow-xl transition-all flex flex-col relative group rounded-sm">
                    {stone.isFeatured && <span className="absolute top-2 left-2 bg-amber-400 text-amber-950 text-[8px] px-2 py-1 uppercase font-bold tracking-widest z-10 shadow-sm">★ Featured</span>}
                    {isAdmin && (
                      <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditForm(stone)} className="bg-amber-500 hover:bg-amber-600 text-white text-[8px] px-1.5 py-1 uppercase font-bold shadow-md">Edit</button>
                        <button onClick={() => handleDeleteStone(stone._id)} className="bg-red-600 hover:bg-red-700 text-white text-[8px] px-1.5 py-1 uppercase font-bold shadow-md">Del</button>
                      </div>
                    )}
                    <Link to={`/gem/${stone._id}`} 
                      className="relative h-36 bg-slate-50 flex items-center justify-center mb-3 overflow-hidden rounded-sm"
                      onMouseEnter={() => setHoveredStoneId(stone._id)}
                      onMouseLeave={() => setHoveredStoneId(null)}
                    >
                      <img src={displayImage} alt={stone.title} className="max-h-full object-contain group-hover:scale-110 transition-transform duration-700" />
                      {stone.hasCertificate && <div className="absolute bottom-1 right-1 bg-white text-green-600 px-1.5 py-0.5 text-[7px] font-bold tracking-widest border border-green-200 shadow-sm flex items-center gap-1"><span>✓</span> CERT</div>}
                    </Link>

                    <h4 className="text-sm font-serif font-bold text-blue-950 uppercase mb-0.5 line-clamp-1" title={stone.title}>{stone.title}</h4>
                    {stone.stoneId && <p className="text-[8px] text-slate-400 font-bold tracking-widest uppercase mb-1">ID: {stone.stoneId}</p>}
                    
                    {/* 🔹 Origin සහ Price ආයේ දැම්මා 🔹 */}
                    {stone.origin && <p className="text-[8px] text-blue-600 font-bold tracking-widest uppercase mb-1.5">🌍 Origin: {stone.origin}</p>}
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="text-blue-800 text-[8px] font-bold uppercase border border-blue-100 px-1 py-0.5">{stone.shape}</span>
                      <span className="text-blue-800 text-[8px] font-bold uppercase border border-blue-100 px-1 py-0.5">{stone.weight} ct</span>
                      {stone.price && <span className="text-green-800 bg-green-50 text-[8px] font-bold uppercase border border-green-200 px-1 py-0.5">Rs. {stone.price}</span>}
                    </div>
                    
                    <div className="mt-auto border-t border-slate-100 pt-2 text-center">
                      <Link to={`/gem/${stone._id}`} className="text-blue-700 hover:text-blue-900 text-[9px] font-bold uppercase tracking-widest transition-colors">View Details ➔</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center mt-12 gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 text-xs font-bold transition-colors shadow-sm ${currentPage === i + 1 ? 'bg-blue-950 text-white' : 'bg-white border text-slate-600 hover:bg-slate-50'}`}>{i + 1}</button>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default CategoryView;