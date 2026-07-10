import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Workshop() {
  const [steps, setSteps] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', imageUrl: '' });
  const [isUploading, setIsUploading] = useState(false); // ෆොටෝ එක upload වෙනවා කියලා පෙන්නන්න
  
  const isAdmin = !!localStorage.getItem('token');

  const fetchSteps = () => {
    fetch('https://pinnawalagems.onrender.com/api/workshop')
      .then(res => res.json())
      .then(data => setSteps(data))
      .catch(err => console.log("Error fetching workshop steps:", err));
  };

  useEffect(() => {
    fetchSteps();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // PC එකෙන් ෆොටෝ එක අරන් Backend එකට යවන function එක
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('image', file);
    setIsUploading(true);

    try {
      const response = await fetch('https://pinnawalagems.onrender.com/api/upload', {
        method: 'POST',
        body: uploadData,
      });
      
      if (response.ok) {
        const data = await response.json();
        // Upload වුණාට පස්සේ එන ලින්ක් එක Database යවන්න ලෑස්ති කරනවා
        setFormData({ ...formData, imageUrl: data.imageUrl });
        alert("Image uploaded successfully! 📸");
      }
    } catch (error) {
      console.log("Error uploading image:", error);
      alert("Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://pinnawalagems.onrender.com/api/workshop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      if(response.ok) {
        alert("Workshop section added successfully! ✨");
        setShowForm(false);
        setFormData({ title: '', description: '', imageUrl: '' });
        fetchSteps(); 
      }
    } catch (error) {
      console.log("Error adding step:", error);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this section?");
    if (isConfirmed) {
      try {
        const response = await fetch(`https://pinnawalagems.onrender.com/api/workshop/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if(response.ok) {
          fetchSteps();
        }
      } catch (error) {
        console.log("Error deleting step:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-blue-950">
      
      {/* 🔹 New Centered Navigation Bar */}
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md text-blue-950 py-5 px-6 border-b border-blue-100 shadow-sm flex flex-col items-center">
        
        {/* Top Part: Logo & Name Centered */}
        <div className="flex flex-col items-center mb-5">
          <img 
            src="/image_27d308.png" 
            alt="Pinnawala Gems Logo" 
            className="h-16 md:h-20 w-auto object-contain mb-3" 
          />
          <h1 className="text-xl md:text-2xl font-serif tracking-[0.2em] uppercase font-bold text-center">
            Pinnawala Gems
          </h1>
        </div>
        
        {/* Bottom Part: Links Centered */}
        <div className="flex gap-5 md:gap-8 items-center flex-wrap justify-center">
          <Link to="/" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Home</Link>
          <Link to="/catalog" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Collection</Link>
          <Link to="/workshop" className="text-[10px] md:text-xs font-bold tracking-[0.15em] text-blue-600 transition-colors uppercase">Workshop</Link>
          <Link to="/feedback" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Feedback</Link>
          <Link to="/contact" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Contact</Link>
          
          {/* Admin Button */}
          {isAdmin && (
            <button 
              onClick={() => setShowForm(!showForm)} 
              className="bg-blue-950 text-white px-4 py-2 text-[10px] font-bold tracking-wider uppercase hover:bg-blue-800 transition-colors shadow-md ml-2"
            >
              {showForm ? 'Close Editor' : 'Add New Section'}
            </button>
          )}
        </div>
      </nav>

      {/* Main content - pt-48 added to clear the taller navbar */}
      <main className="w-full bg-slate-50 pt-48 pb-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-16">
            <h2 className="text-xs md:text-sm text-blue-800 tracking-[0.4em] uppercase mb-4 font-bold">The Art of Gem Cutting</h2>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-blue-950 mb-6 tracking-wide">Our Craftsmanship</h1>
            <div className="w-16 h-1 bg-blue-300 mx-auto mb-8"></div>
          </div>

          {showForm && (
            <div className="bg-white p-8 md:p-12 w-full max-w-3xl mx-auto border border-blue-100 shadow-xl rounded-sm mb-16">
              <h2 className="text-2xl font-serif text-blue-950 mb-8 text-center tracking-widest uppercase font-bold">Add Workshop Process</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Section Title</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full bg-slate-50 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} required className="w-full bg-slate-50 border border-blue-200 p-3 mt-2 h-32 focus:outline-none focus:border-blue-950 transition-colors"></textarea>
                </div>
                
                {/* Aluth PC Image Upload Section */}
                <div className="border-2 border-dashed border-blue-200 p-6 bg-slate-50 text-center">
                  <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold block mb-4">Upload Section Image</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-800 hover:file:bg-blue-100 mx-auto block"
                  />
                  
                  {isUploading && <p className="text-xs text-blue-600 mt-3 tracking-widest font-bold">UPLOADING... ⏳</p>}
                  
                  {formData.imageUrl && !isUploading && (
                    <div className="mt-4">
                      <p className="text-[10px] text-green-600 uppercase tracking-widest font-bold mb-2">Image Selected:</p>
                      <img src={formData.imageUrl} alt="Preview" className="h-24 mx-auto object-cover rounded-sm border border-slate-200" />
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={isUploading || !formData.imageUrl}
                  className="w-full bg-blue-950 text-white font-bold py-4 mt-4 tracking-[0.2em] uppercase hover:bg-blue-900 transition-colors shadow-lg disabled:bg-slate-400"
                >
                  Save Section
                </button>
              </form>
            </div>
          )}

          {steps.length === 0 && !showForm ? (
            <p className="text-center text-slate-500 font-serif text-xl tracking-widest">No workshop details added yet.</p>
          ) : (
            steps.map((step, index) => (
              <div key={step._id} className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16 bg-white p-8 border border-blue-50 shadow-md rounded-sm relative group">
                <div className={`${index % 2 === 0 ? 'order-2 md:order-1' : 'order-2 md:order-2'} space-y-6`}>
                  <h3 className="text-2xl font-serif font-bold text-blue-950 tracking-wide">{step.title}</h3>
                  <p className="text-slate-600 leading-relaxed font-light">{step.description}</p>
                </div>
                
                <div className={`${index % 2 === 0 ? 'order-1 md:order-2' : 'order-1 md:order-1'} overflow-hidden rounded-sm`}>
                  <img src={step.imageUrl || "https://via.placeholder.com/800x400?text=No+Image"} alt={step.title} className="w-full h-[300px] object-cover hover:scale-105 transition-transform duration-700 ease-in-out" />
                </div>

                {isAdmin && (
                  <button 
                    onClick={() => handleDelete(step._id)}
                    className="absolute top-4 right-4 bg-red-500/90 text-white px-4 py-2 text-[10px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 rounded-sm shadow-md"
                  >
                    Delete Section
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default Workshop;