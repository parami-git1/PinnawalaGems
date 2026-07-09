import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function AdminInventory() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stones, setStones] = useState([]);
  
  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editStoneId, setEditStoneId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '', shape: '', weight: '', color: '', price: '', description: '',
    hasCertificate: false, image: '', quantity: 1
  });

  const [showCatForm, setShowCatForm] = useState(false);
  const [catFormData, setCatFormData] = useState({ title: '', description: '', mainImage: '' });
  const [isUploadingCat, setIsUploadingCat] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = () => {
    fetch('http://localhost:5000/api/stock/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const uniqueCategories = data.filter((cat, index, self) =>
            index === self.findIndex((c) => (
              c.title.toLowerCase().trim() === cat.title.toLowerCase().trim()
            ))
          );
          setCategories(uniqueCategories);
        } else {
          setCategories([]);
        }
      })
      .catch(err => console.log(err));
  };

  useEffect(() => {
    if (selectedCategory) {
      fetchStones();
    } else {
      setStones([]);
    }
  }, [selectedCategory]);

  const fetchStones = () => {
    fetch(`http://localhost:5000/api/stock/categories/${selectedCategory}/stones`)
      .then(res => res.json())
      .then(data => setStones(data.stones || []))
      .catch(err => console.log(err));
  };

  const handleCatImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadData = new FormData(); uploadData.append('image', file);
    setIsUploadingCat(true);
    try {
      const response = await fetch('http://localhost:5000/api/upload', { method: 'POST', body: uploadData });
      if (response.ok) { 
        const data = await response.json(); 
        setCatFormData({ ...catFormData, mainImage: data.imageUrl }); 
      }
    } catch (error) { console.log(error); } finally { setIsUploadingCat(false); }
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    if (!catFormData.title || !catFormData.mainImage) {
      alert("Gem Type Name and Image are strictly required!");
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/stock/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(catFormData)
      });
      if (response.ok) {
        const newCat = await response.json();
        alert("New Gem Type Added to Inventory!");
        setShowCatForm(false);
        setCatFormData({ title: '', description: '', mainImage: '' });
        fetchCategories();
        setSelectedCategory(newCat._id); 
      }
    } catch (error) { console.log(error); }
  };

  // 🔹 Category එක මකා දැමීමේ Function එක
  const handleDeleteCategory = async () => {
    if (window.confirm("WARNING: Are you sure you want to delete this entire Gem Type? ALL the stock items inside this category will also be permanently deleted!")) {
      try {
        const response = await fetch(`http://localhost:5000/api/stock/categories/${selectedCategory}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.ok) {
          alert("Gem Type and all related stock items have been deleted!");
          setSelectedCategory(''); // Dropdown එක Reset කරනවා
          setStones([]); // ගල් ටික Clear කරනවා
          fetchCategories(); // අලුත් Categories ටික ගන්නවා
        }
      } catch (err) {
        console.log(err);
      }
    }
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
      const response = await fetch('http://localhost:5000/api/upload', { method: 'POST', body: uploadData });
      if (response.ok) { 
        const data = await response.json(); 
        setFormData({ ...formData, image: data.imageUrl }); 
      }
    } catch (error) { console.log(error); } finally { setIsUploading(false); }
  };

  const openAddForm = () => {
    setIsEditMode(false);
    setFormData({ title: '', shape: '', weight: '', color: '', price: '', description: '', hasCertificate: false, image: '', quantity: 1 });
    setShowForm(true);
  };

  const openEditForm = (stone) => {
    setIsEditMode(true);
    setEditStoneId(stone._id);
    setFormData({
      title: stone.title, shape: stone.shape || '', weight: stone.weight || '', color: stone.color || '', 
      price: stone.price || '', description: stone.description || '', hasCertificate: stone.hasCertificate, 
      image: stone.image, quantity: stone.quantity || 1
    });
    setShowForm(true);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.image) {
      alert("Title and Image are strictly required!");
      return;
    }
    const payload = { ...formData, categoryId: selectedCategory, quantity: formData.quantity || 1 };
    const url = isEditMode ? `http://localhost:5000/api/stock/stones/${editStoneId}` : 'http://localhost:5000/api/stock/stones';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        alert(isEditMode ? "Stock Record Updated!" : "New Stock Record Added!");
        setShowForm(false);
        fetchStones();
      }
    } catch (error) { console.log(error); }
  };

  const handleDelete = async (stoneId) => {
    if(window.confirm("Delete this from business inventory?")) {
       await fetch(`http://localhost:5000/api/stock/stones/${stoneId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
       setStones(stones.filter(s => s._id !== stoneId));
    }
  };

  const selectedCatObj = categories.find(c => c._id === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-blue-950 p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-center mb-8 bg-white p-6 shadow-sm border">
          <h1 className="text-2xl font-bold uppercase tracking-widest text-blue-900">📦 Business Inventory</h1>
          <Link to="/catalog" className="bg-slate-200 px-6 py-2 font-bold text-xs uppercase hover:bg-slate-300">Back to Live Site</Link>
        </div>

        <div className="bg-white p-6 shadow-sm border mb-8">
          <div className="flex justify-between items-center mb-4">
            <label className="text-xs font-bold uppercase text-slate-500 block">Select or Add Stock Gem Type</label>
            {!showCatForm && (
              <button onClick={() => setShowCatForm(true)} className="bg-blue-950 text-white px-4 py-2 text-[10px] font-bold uppercase hover:bg-blue-800">
                + Add New Gem Type
              </button>
            )}
          </div>

          {!showCatForm ? (
            <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setShowForm(false); }} className="w-full border p-3 bg-slate-50 outline-none cursor-pointer">
              <option value="">-- Choose Category --</option>
              {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.title}</option>)}
            </select>
          ) : (
            <form onSubmit={handleCatSubmit} className="bg-slate-50 border p-6 mt-2 border-dashed border-blue-200">
              <h3 className="text-sm font-bold uppercase mb-4 text-blue-900">Add New Gem Type to Inventory</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500">Gem Type Name *</label>
                  <input type="text" placeholder="e.g. Pink Sapphire" value={catFormData.title} onChange={(e) => setCatFormData({...catFormData, title: e.target.value})} className="w-full border p-2 text-sm" required />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500">Image *</label>
                  <input type="file" onChange={handleCatImageUpload} className="w-full text-sm" required/>
                  {isUploadingCat && <span className="text-[10px] text-blue-500">Uploading...</span>}
                </div>
                <div className="md:col-span-2">
                   <label className="text-[10px] font-bold uppercase text-slate-500">Description (Optional)</label>
                   <textarea placeholder="Category description..." value={catFormData.description} onChange={(e) => setCatFormData({...catFormData, description: e.target.value})} className="w-full border p-2 text-sm h-12"></textarea>
                </div>
                <div className="md:col-span-2 flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowCatForm(false)} className="bg-slate-300 px-6 py-2 text-xs font-bold uppercase hover:bg-slate-400 transition-colors">Cancel</button>
                  <button type="submit" disabled={isUploadingCat || !catFormData.mainImage} className="bg-blue-950 text-white px-6 py-2 text-xs font-bold uppercase hover:bg-blue-800 disabled:bg-slate-400 transition-colors">Save Category</button>
                </div>
              </div>
            </form>
          )}
        </div>

        {selectedCategory && selectedCatObj && (
          <div className="bg-white shadow-sm border overflow-hidden">
            
            <div className="bg-slate-50 p-6 flex flex-col md:flex-row items-center gap-6 border-b">
              <img src={selectedCatObj.mainImage || selectedCatObj.image} alt={selectedCatObj.title} className="w-24 h-24 md:w-32 md:h-32 object-cover border border-slate-200 shadow-sm rounded-sm bg-white p-1" />
              <div className="text-center md:text-left flex-1">
                <h2 className="text-2xl font-serif font-bold uppercase text-blue-950">{selectedCatObj.title}</h2>
                <p className="text-xs text-slate-500 mt-2 max-w-lg">{selectedCatObj.description || 'No description provided for this category.'}</p>
              </div>
              <div className="mt-4 md:mt-0 flex gap-2 flex-col md:flex-row">
                <button onClick={openAddForm} className="bg-blue-950 text-white px-6 py-3 text-[10px] font-bold uppercase hover:bg-blue-800 shadow-md transition-colors">
                  + Add Stock to {selectedCatObj.title}
                </button>
                {/* 🔹 අලුතින් දැම්ම Delete Category බොත්තම */}
                <button onClick={handleDeleteCategory} className="bg-red-50 text-red-600 border border-red-200 px-6 py-3 text-[10px] font-bold uppercase hover:bg-red-600 hover:text-white shadow-sm transition-colors">
                  Delete Category
                </button>
              </div>
            </div>

            <div className="p-6">
              {showForm && (
                <form onSubmit={handleSubmit} className="bg-white border p-6 mb-10 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-sm border-blue-100">
                  <div className="md:col-span-3 pb-2 border-b border-blue-100 mb-2"><h3 className="font-bold uppercase text-blue-900">{isEditMode ? 'Edit Gem Stock' : 'Add New Stock Record'}</h3></div>
                  
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Gem Title *</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full border p-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500">Quantity (Stock) *</label>
                    <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="0" required className="w-full border p-2 text-sm font-bold text-blue-700 bg-blue-50" />
                  </div>

                  <div><label className="text-[10px] font-bold uppercase">Color (Optional)</label><input type="text" name="color" value={formData.color} onChange={handleChange} className="w-full border p-2 text-sm" /></div>
                  <div><label className="text-[10px] font-bold uppercase">Shape (Optional)</label><input type="text" name="shape" value={formData.shape} onChange={handleChange} className="w-full border p-2 text-sm" /></div>
                  <div><label className="text-[10px] font-bold uppercase">Weight (ct) (Optional)</label><input type="number" step="0.01" name="weight" value={formData.weight} onChange={handleChange} className="w-full border p-2 text-sm" /></div>
                  <div><label className="text-[10px] font-bold uppercase">Price (Rs.) (Optional)</label><input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full border p-2 text-sm" /></div>
                  
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="hasCertificate" checked={formData.hasCertificate} onChange={handleChange} className="w-5 h-5 accent-blue-900" />
                      <span className="text-xs font-bold uppercase text-blue-900">Has Certificate</span>
                    </label>
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Description (Optional)</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} className="w-full border p-2 text-sm h-16"></textarea>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold uppercase text-slate-500">Image *</label>
                    <input type="file" onChange={handleImageUpload} className="w-full text-sm" />
                    {isUploading && <span className="text-[10px] text-blue-500">Uploading...</span>}
                  </div>
                  <div className="flex items-end">{formData.image && <img src={formData.image} alt="preview" className="h-12 border bg-slate-50 p-1" />}</div>

                  <div className="md:col-span-3 flex gap-2 mt-4 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setShowForm(false)} className="bg-slate-300 px-6 py-2 text-xs font-bold uppercase hover:bg-slate-400 transition-colors">Cancel</button>
                    <button type="submit" disabled={isUploading || !formData.image} className="bg-blue-950 text-white px-8 py-2 text-xs font-bold uppercase hover:bg-blue-800 disabled:bg-slate-400 transition-colors">Save Record</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
                {stones.length === 0 ? (
                  <p className="col-span-full text-center text-sm text-slate-400 py-8 border border-dashed border-slate-300">No stock found in this category.</p>
                ) : (
                  stones.map(stone => (
                    <div key={stone._id} className="bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col relative rounded-sm overflow-hidden">
                      <div className="h-48 bg-slate-50 flex items-center justify-center p-4 border-b border-slate-100 relative group">
                        <img src={stone.image} alt={stone.title} className="max-h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-500" />
                        {stone.hasCertificate && <div className="absolute top-2 right-2 bg-white text-green-600 px-2 py-1 text-[8px] font-bold tracking-widest border border-green-200 shadow-sm">✓ CERT</div>}
                      </div>
                      
                      <div className="p-5 flex flex-col flex-1">
                        <h4 className="text-lg font-serif font-bold text-blue-950 mb-1 leading-tight uppercase line-clamp-1" title={stone.title}>{stone.title}</h4>
                        <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mb-4">ID: {stone.stoneId}</p>
                        
                        <div className="mb-4">
                          <span className={`px-3 py-1 font-bold text-xs tracking-widest uppercase rounded-full inline-block ${stone.quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {stone.quantity || 0} IN STOCK
                          </span>
                        </div>
                        
                        <div className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-5">
                          Price: {stone.price ? <span className="text-green-700">Rs. {stone.price}</span> : 'Not Set'}
                        </div>
                        
                        <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
                          <button onClick={() => openEditForm(stone)} className="w-1/2 bg-amber-500 hover:bg-amber-600 text-white py-2 text-[10px] font-bold tracking-widest uppercase shadow-sm transition-colors">Edit</button>
                          <button onClick={() => handleDelete(stone._id)} className="w-1/2 bg-red-600 hover:bg-red-700 text-white py-2 text-[10px] font-bold tracking-widest uppercase shadow-sm transition-colors">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminInventory;