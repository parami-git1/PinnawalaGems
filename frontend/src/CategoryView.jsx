import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

function CategoryView() {
  const { categoryId } = useParams();
  const [categoryTitle, setCategoryTitle] = useState('Gem Collection');
  const [stones, setStones] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const isAdmin = !!localStorage.getItem('token');

  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editStoneId, setEditStoneId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCert, setIsUploadingCert] = useState(false); 
  
  // 🔹 Origin සහ Additional Images අලුතින් එකතු කර ඇත
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

  // 🔹 Hover Animation සඳහා States
  const [hoveredStoneId, setHoveredStoneId] = useState(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  // Hover කළාම පින්තූර මාරු වෙන Logic එක
  useEffect(() => {
    let interval;
    if (hoveredStoneId) {
      interval = setInterval(() => {
        setCurrentImgIndex(prev => prev + 1);
      }, 1000); // තත්පරෙන් තත්පරේට පින්තූරය මාරු වෙයි
    } else {
      setCurrentImgIndex(0);
    }
    return () => clearInterval(interval);
  }, [hoveredStoneId]);
  
  const fetchCategoryAndStones = async (page = 1) => {
    try {
      const catRes = await fetch('https://pinnawalagems.onrender.com/api/inventory/categories');
      const catData = await catRes.json();
      const currentCat = catData.find(c => c._id === categoryId);
      if (currentCat) setCategoryTitle(currentCat.title);

      let url = `https://pinnawalagems.onrender.com/api/inventory/categories/${categoryId}/stones?page=${page}&limit=12`;
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

  // 🔹 අමතර පින්තූර Upload කරන Function එක
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
    setFormData(prev => ({
      ...prev,
      additionalImages: prev.additionalImages.filter((_, index) => index !== indexToRemove)
    }));
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
      
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md text-blue-950 py-5 px-6 border-b border-blue-100 shadow-sm flex flex-col items-center">
        <div className="flex flex-col items-center mb-5"><img src="/image_27d308.png" alt="Logo" className="h-16 md:h-20 mb-3" /><h1 className="text-xl md:text-2xl font-serif tracking-[0.2em] uppercase font-bold text-center">Pinnawala Gems</h1></div>
        <div className="flex gap-5 md:gap-8 items-center flex-wrap justify-center">
          <Link to="/" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Home</Link>
          <Link to="/catalog" className="text-[10px] md:text-xs font-bold tracking-[0.15em] text-blue-600 transition-colors uppercase">Collection</Link>
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

      <main className="p-8 max-w-7xl mx-auto pt-48">
        
        <div className="text-center mb-10">
          <h2 className="text-xs md:text-sm text-blue-800 tracking-[0.4em] uppercase mb-4 font-bold">Premium Selection</h2>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-blue-950 mb-4 tracking-wide uppercase">{categoryTitle}</h1>
          <div className="w-16 h-1 bg-blue-300 mx-auto mb-8"></div>
        </div>

        <div className="flex justify-center mb-6">
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="bg-white border border-blue-200 text-blue-900 px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-2"
          >
            {showFilters ? '✖ Hide Filters' : '🔍 Advanced Filters'}
          </button>
        </div>

        {showFilters && (
          <div className="bg-white border border-blue-100 shadow-sm p-6 mb-12 rounded-sm max-w-5xl mx-auto transition-all">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-widest text-blue-900">🔍 Filter Collection</h3>
              <button onClick={handleResetFilters} className="text-[10px] uppercase tracking-widest font-bold text-red-500 hover:text-red-700 transition-colors">Reset All</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <div><label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Gem ID</label><input type="text" value={searchId} onChange={(e) => setSearchId(e.target.value)} placeholder="e.g. GEM-102" className="w-full bg-slate-50 border border-slate-200 p-2 mt-1 text-xs uppercase focus:border-blue-950" /></div>
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

        {isAdmin && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-10">
            {!showForm && (
              <button onClick={openAddForm} className="bg-blue-950 text-white px-8 py-3 text-xs font-bold tracking-widest uppercase hover:bg-blue-800 shadow-md">
                + Add New Stone to {categoryTitle}
              </button>
            )}
            
            {!showForm && stones.length > 0 && (
              <button onClick={handleDeleteAllStones} className="bg-red-50 text-red-600 border border-red-200 px-8 py-3 text-xs font-bold tracking-widest uppercase hover:bg-red-600 hover:text-white shadow-sm transition-colors">
                🗑️ Delete All Stones
              </button>
            )}
          </div>
        )}

        {showForm && (
          <div className="bg-white p-8 md:p-12 w-full max-w-3xl mx-auto border border-blue-100 shadow-xl rounded-sm mb-16">
            <h2 className="text-2xl font-serif text-blue-950 mb-8 text-center tracking-widest uppercase font-bold">{isEditMode ? 'Edit Stone Details' : 'Add Stone Details'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2"><label className="text-xs text-blue-800 uppercase font-semibold">Gem Title *</label><input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full border p-3 mt-2" /></div>
              
              {/* 🔹 Origin එක අලුතින් එක් කළා */}
              <div className="md:col-span-2"><label className="text-xs text-blue-800 uppercase font-semibold">Origin (Optional)</label><input type="text" name="origin" value={formData.origin} onChange={handleChange} placeholder="e.g. Ceylon" className="w-full border p-3 mt-2 bg-slate-50" /></div>

              <div><label className="text-xs text-blue-800 uppercase font-semibold">Shape *</label><input type="text" name="shape" value={formData.shape} onChange={handleChange} required className="w-full border p-3 mt-2" /></div>
              <div><label className="text-xs text-blue-800 uppercase font-semibold">Color *</label><input type="text" name="color" value={formData.color} onChange={handleChange} required className="w-full border p-3 mt-2" /></div>
              <div><label className="text-xs text-blue-800 uppercase font-semibold">Weight (ct) *</label><input type="number" step="0.01" name="weight" value={formData.weight} onChange={handleChange} required className="w-full border p-3 mt-2" /></div>
              <div><label className="text-xs text-blue-800 uppercase font-semibold">Price (Rs.) - Optional</label><input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} className="w-full border p-3 mt-2" /></div>
              
              <div className="md:col-span-2"><label className="flex items-center gap-3"><input type="checkbox" name="hasCertificate" checked={formData.hasCertificate} onChange={handleChange} className="w-5 h-5" /><span className="text-xs text-blue-800 uppercase font-bold">Has Certificate?</span></label></div>
              
              {formData.hasCertificate && (
                <div className="md:col-span-2 bg-blue-50/50 border p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="text-xs text-blue-800 uppercase font-semibold">Cert Number (Optional)</label><input type="text" name="certificateDetails" value={formData.certificateDetails} onChange={handleChange} className="w-full border p-3 mt-2 bg-white" /></div>
                  <div>
                    <label className="text-xs text-blue-800 uppercase font-semibold">Cert Image (Optional)</label><input type="file" onChange={handleCertUpload} className="mt-2 text-xs" />
                    {formData.certificateImage && !isUploadingCert && <p className="text-xs text-green-600 mt-2 font-bold uppercase">✅ Uploaded</p>}
                  </div>
                </div>
              )}
              
              <div className="md:col-span-2">
                <label className="text-xs text-blue-800 uppercase font-semibold">Description (Optional)</label>
                <textarea name="description" value={formData.description} onChange={handleChange} className="w-full border p-3 mt-2 h-24"></textarea>
              </div>
              
              <div className="md:col-span-2 border-2 border-dashed border-blue-200 p-6 text-center">
                <label className="text-xs text-blue-800 uppercase font-semibold block mb-4">Upload Main Stone Image *</label>
                <input type="file" onChange={handleImageUpload} className="text-sm mx-auto block" required={!isEditMode && !formData.image} />
                {formData.image && !isUploading && <img src={formData.image} alt="Preview" className="h-32 mx-auto object-cover mt-4 border p-1" />}
              </div>

              {/* 🔹 Additional Images අලුතින් එක් කළා */}
              <div className="md:col-span-2 border border-slate-200 p-6 bg-slate-50">
                <label className="text-xs text-blue-800 uppercase font-semibold block mb-2">Upload Additional Images (Optional)</label>
                <p className="text-[10px] text-slate-500 mb-4">You can select multiple images to show different angles of the gem.</p>
                <input type="file" multiple onChange={handleAdditionalImagesUpload} className="text-sm block" />
                
                {formData.additionalImages && formData.additionalImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {formData.additionalImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={img} alt={`Additional ${idx}`} className="h-16 w-16 object-cover border border-slate-300" />
                        <button type="button" onClick={() => removeAdditionalImage(idx)} className="absolute -top-2 -right-2 bg-red-600 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✖</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="md:col-span-2 flex gap-4 mt-4">
                <button type="button" onClick={() => setShowForm(false)} className="w-1/3 bg-slate-200 font-bold py-4 uppercase">Cancel</button>
                <button type="submit" disabled={isUploading || isUploadingCert} className="w-2/3 bg-blue-950 text-white font-bold py-4 uppercase">Save Stone</button>
              </div>
            </form>
          </div>
        )}

        {/* ---------------- STONES GRID VIEW ---------------- */}
        {stones.length === 0 ? (
          <p className="text-center text-slate-400 font-serif tracking-widest py-12">No stones match your search criteria.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {stones.map(stone => {
              // 🔹 මේ ගලට අදාළ ඔක්කොම පින්තූර එකතු කරලා Array එකක් හදාගන්නවා 
              const allImages = [stone.image, ...(stone.additionalImages || [])];
              
              // 🔹 Hover කරලා තියෙන ගල නම්, Index එකට අදාළ පින්තූරය ගන්නවා. නැත්නම් මුල් පින්තූරය විතරයි.
              const displayImage = hoveredStoneId === stone._id ? allImages[currentImgIndex % allImages.length] : stone.image;

              return (
                <div key={stone._id} className="bg-white border border-slate-100 p-5 shadow-sm hover:shadow-xl transition-all flex flex-col relative group">
                  
                  {stone.isFeatured && <span className="absolute top-2 left-2 bg-amber-400 text-amber-950 text-[9px] px-2 py-1 uppercase font-bold tracking-widest z-10 shadow-sm">★ Featured</span>}
                  
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditForm(stone)} className="bg-amber-500 hover:bg-amber-600 text-white text-[8px] px-2 py-1 uppercase font-bold shadow-md">Edit</button>
                      <button onClick={() => handleToggleFeature(stone._id)} className="bg-blue-600 hover:bg-blue-700 text-white text-[8px] px-2 py-1 uppercase font-bold shadow-md">{stone.isFeatured ? 'Unfeature' : 'Feature'}</button>
                      <button onClick={() => handleDeleteStone(stone._id)} className="bg-red-600 hover:bg-red-700 text-white text-[8px] px-2 py-1 uppercase font-bold shadow-md">Delete</button>
                    </div>
                  )}
                  
                  <Link to={`/gem/${stone._id}`} 
                    className="relative h-48 bg-slate-50 flex items-center justify-center mb-4 overflow-hidden"
                    onMouseEnter={() => setHoveredStoneId(stone._id)}
                    onMouseLeave={() => setHoveredStoneId(null)}
                  >
                    <img src={displayImage} alt={stone.title} className="max-h-full object-contain group-hover:scale-110 transition-transform duration-700" />
                    {stone.hasCertificate && <div className="absolute bottom-2 right-2 bg-white text-green-600 px-2 py-1 text-[8px] font-bold tracking-widest border border-green-200 shadow-sm flex items-center gap-1"><span>✓</span> CERTIFIED</div>}
                  </Link>

                  <h4 className="text-lg font-serif font-bold text-blue-950 uppercase mb-1 line-clamp-1" title={stone.title}>{stone.title}</h4>
                  
                  {stone.stoneId && <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mb-1">ID: {stone.stoneId}</p>}
                  
                  {/* 🔹 Origin එක අලුතින් එක් කළා */}
                  {stone.origin && <p className="text-[9px] text-blue-600 font-bold tracking-widest uppercase mb-3">🌍 Origin: {stone.origin}</p>}
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="text-blue-800 text-[9px] font-bold uppercase border border-blue-100 px-2 py-1">{stone.shape}</span>
                    <span className="text-blue-800 text-[9px] font-bold uppercase border border-blue-100 px-2 py-1">{stone.weight} ct</span>
                    {stone.price && <span className="text-green-800 bg-green-50 text-[9px] font-bold uppercase border border-green-200 px-2 py-1">Rs. {stone.price}</span>}
                  </div>
                  
                  <div className="mt-auto border-t border-slate-100 pt-4 text-center">
                    <Link to={`/gem/${stone._id}`} className="text-blue-700 hover:text-blue-900 text-xs font-bold uppercase tracking-widest transition-colors">View Details ➔</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ---------------- PAGINATION ---------------- */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-16 gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 text-xs font-bold transition-colors ${currentPage === i + 1 ? 'bg-blue-950 text-white' : 'bg-white border text-slate-600'}`}>{i + 1}</button>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

export default CategoryView;