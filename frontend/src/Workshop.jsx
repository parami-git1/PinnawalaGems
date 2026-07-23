import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Workshop() {
  const [sections, setSections] = useState([]);
  const [isAdmin] = useState(!!localStorage.getItem('token'));
  
  // Modals & Form State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editSectionId, setEditSectionId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    layoutType: 'left-text' // left-text or right-text
  });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchWorkshopSections();
  }, []);

  const fetchWorkshopSections = async () => {
    try {
      const res = await fetch('https://pinnawalagems.onrender.com/api/workshop');
      const data = await res.json();
      if (Array.isArray(data)) setSections(data);
    } catch (err) { console.log(err); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('image', file);
    setIsUploading(true);
    try {
      const res = await fetch('https://pinnawalagems.onrender.com/api/upload', { method: 'POST', body: uploadData });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, image: data.imageUrl }));
      }
    } catch (err) { alert('Image upload failed'); } 
    finally { setIsUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.image) {
      return alert("Title and Image are required!");
    }

    const url = isEditing 
      ? `https://pinnawalagems.onrender.com/api/workshop/${editSectionId}` 
      : 'https://pinnawalagems.onrender.com/api/workshop';
    
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert(isEditing ? "Workshop Section Updated! 🛠️" : "Workshop Section Added! 🛠️");
        setShowModal(false);
        setIsEditing(false);
        setEditSectionId(null);
        setFormData({ title: '', description: '', image: '', layoutType: 'left-text' });
        fetchWorkshopSections();
      } else {
        alert("Failed to save workshop section.");
      }
    } catch (err) { console.log(err); }
  };

  const handleEdit = (section) => {
    setFormData({
      title: section.title || '',
      description: section.description || '',
      image: section.image || '',
      layoutType: section.layoutType || 'left-text'
    });
    setEditSectionId(section._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this workshop section?")) {
      try {
        const res = await fetch(`https://pinnawalagems.onrender.com/api/workshop/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          fetchWorkshopSections();
        }
      } catch (err) { console.log(err); }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-blue-950">
      
      {/* ---------------- NAVIGATION BAR ---------------- */}
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md text-blue-950 py-4 px-6 border-b border-blue-100 shadow-sm flex flex-col items-center">
        <div className="flex flex-col items-center mb-4">
          <img src="/image_27d308.png" alt="Pinnawala Gems Logo" className="h-14 md:h-16 w-auto object-contain mb-2" />
          <h1 className="text-lg md:text-xl font-serif tracking-[0.2em] uppercase font-bold text-center text-blue-950">Pinnawala Gems</h1>
        </div>
        
        <div className="flex gap-6 md:gap-10 items-center flex-wrap justify-center relative">
          <Link to="/" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Home</Link>
          <Link to="/catalog" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase py-2">Collection</Link>
          <Link to="/workshop" className="text-[10px] md:text-xs font-bold tracking-[0.15em] text-blue-600 transition-colors uppercase text-blue-600">Workshop</Link>
          <Link to="/feedback" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Feedback</Link>
          <Link to="/contact" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Contact</Link>
          
          {isAdmin && (
            <button 
              onClick={() => { 
                setIsEditing(false); 
                setEditSectionId(null); 
                setFormData({ title: '', description: '', image: '', layoutType: 'left-text' }); 
                setShowModal(true); 
              }} 
              className="bg-blue-950 text-white text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase px-4 py-2 rounded-sm shadow-md hover:bg-blue-800 transition-colors"
            >
              + Add New Section
            </button>
          )}
        </div>
      </nav>

      {/* ---------------- MAIN WORKSHOP CONTENT ---------------- */}
      <main className="flex-1 w-full max-w-6xl mx-auto pt-48 px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-xs text-blue-600 font-bold tracking-[0.3em] uppercase mb-2">Craftsmanship</h2>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-blue-950">Our Gem Cutting & Polishing Workshop</h1>
          <div className="w-16 h-1 bg-blue-300 mx-auto mt-4"></div>
        </div>

        {sections.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-slate-200">
            <p className="text-slate-500 text-sm font-semibold">No workshop sections added yet.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {sections.map((section) => (
              <div key={section._id} className="bg-white rounded-lg shadow-md border border-slate-200 p-6 md:p-8 relative group">
                
                {/* 🔹 ADMIN EDIT & DELETE BUTTONS (CLEARLY VISIBLE AT TOP RIGHT) 🔹 */}
                {isAdmin && (
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-sm p-1.5 rounded shadow-sm border border-slate-200">
                    <button 
                      onClick={() => handleEdit(section)} 
                      className="bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded hover:bg-amber-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(section._id)} 
                      className="bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-6 md:pt-0">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-serif font-bold text-blue-950">{section.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{section.description}</p>
                  </div>
                  <div className="w-full h-64 md:h-72 bg-slate-100 rounded-md overflow-hidden shadow-sm flex items-center justify-center">
                    <img src={section.image} alt={section.title} className="w-full h-full object-cover" />
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>

      {/* ---------------- ADD / EDIT MODAL ---------------- */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden p-6">
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h2 className="text-sm font-bold text-blue-950 uppercase tracking-widest">
                {isEditing ? 'Edit Workshop Section' : 'Add New Workshop Section'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-red-500 font-bold hover:text-red-700 text-sm">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">Section Title</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                  placeholder="e.g. Precision Gem Cutting" 
                  className="w-full border border-slate-300 p-2.5 text-xs rounded-sm focus:outline-none" 
                  required 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  placeholder="Write details about the workshop process..." 
                  rows="4" 
                  className="w-full border border-slate-300 p-2.5 text-xs rounded-sm focus:outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">Workshop Image</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="w-full text-xs text-slate-500" 
                />
                {isUploading && <p className="text-[10px] text-blue-600 font-bold mt-1">Uploading image... ⏳</p>}
                {formData.image && <img src={formData.image} alt="Preview" className="h-20 mt-2 object-cover border rounded-sm" />}
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="w-1/2 bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-widest py-3 rounded-sm hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isUploading || !formData.title || !formData.image} 
                  className="w-1/2 bg-blue-950 text-white font-bold text-[10px] uppercase tracking-widest py-3 rounded-sm hover:bg-blue-900 disabled:bg-slate-400"
                >
                  {isEditing ? 'Update Section' : 'Publish Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Workshop;