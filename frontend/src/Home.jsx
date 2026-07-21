import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// 🔹 Hover Slideshow එකට සහ "See More" බටන් එකට හදපු Component එක 🔹
const TopGemCard = ({ gem, isAdmin, onRemove }) => {
  const [imgIdx, setImgIdx] = useState(0);
  const images = [gem.image, ...(gem.additionalImages || [])].filter(Boolean);
  const intervalRef = useRef(null);

  const handleMouseEnter = () => {
    if (images.length > 1) {
      intervalRef.current = setInterval(() => {
        setImgIdx((prev) => (prev + 1) % images.length);
      }, 1000); 
    }
  };

  const handleMouseLeave = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setImgIdx(0); 
  };

  return (
    <div className="bg-slate-50 rounded-md p-3 shadow-sm hover:shadow-lg transition-all border border-slate-100 flex flex-col items-center text-center relative group">
      <Link to={`/gem/${gem._id || gem.stoneId}`} className="w-full flex flex-col items-center">
        <div 
          className="w-full h-32 md:h-40 overflow-hidden rounded-sm mb-3 relative flex items-center justify-center bg-white"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <img 
            src={images[imgIdx]} 
            alt={gem.title || 'Premium Gem'} 
            className="max-h-full max-w-full object-contain transition-opacity duration-500 ease-in-out" 
          />
        </div>
        {gem.title && <h3 className="text-xs md:text-sm font-bold text-blue-950 uppercase tracking-wider line-clamp-1">{gem.title}</h3>}
        {gem.weight && <p className="text-[10px] md:text-xs text-slate-500 mt-1 font-semibold">{gem.weight} ct</p>}
        
        <span className="mt-3 text-[10px] font-bold uppercase tracking-widest text-blue-700 group-hover:text-blue-900 group-hover:underline transition-colors">
          See More ➔
        </span>
      </Link>

      {isAdmin && (
        <button onClick={() => onRemove(gem._id)} className="absolute -top-2 -right-2 bg-red-600 text-white w-5 h-5 rounded-full text-[10px] shadow-md z-10 hover:bg-red-700">✖</button>
      )}
    </div>
  );
};

function Home() {
  const [homeData, setHomeData] = useState({
    heroTitle: 'Welcome to Pinnawala Gems',
    brandIntro: 'Premium gemstones marketplace offering the finest quality stones.',
    address: 'Pinnawala, Sri Lanka',
    contactNumber: '+94 77 123 4567',
    whatsappNumber: '94776599740',
    inquiryEmail: 'paramividarshanamuthumali@gmail.com',
    heroImage: '', 
    heroVideo: '',
    sideAdImage: '',
    bottomAdImage: '',
    customerPhotos: [],
    featureImage: '',
    featureSubtitle: '',
    featureTitle: '',
    featureDescription: ''
  });
  
  const [topGems, setTopGems] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [eventAds, setEventAds] = useState([]); 
  
  const [isEditing, setIsEditing] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false); 
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCustomers, setIsUploadingCustomers] = useState(false);
  const [isUploadingGemImg, setIsUploadingGemImg] = useState(false);
  const [isUploadingEventImg, setIsUploadingEventImg] = useState(false);
  
  const [newTopGem, setNewTopGem] = useState({ 
    gemType: '', homePagePosition: '1', title: '', weight: '', 
    shape: '', cut: '', origin: '', certificateDetails: '', 
    image: '', additionalImages: [] 
  });

  const [newEventAd, setNewEventAd] = useState({
    title: '',
    image: '',
    layoutType: 'horizontal',
    description: ''
  });
  
  const isAdmin = !!localStorage.getItem('token');

  const fetchTopGems = () => {
    fetch('https://pinnawalagems.onrender.com/api/inventory/stones?limit=100')
      .then(res => res.json())
      .then(data => {
        const stones = data.stones || [];
        const filtered = stones.filter(s => s.isTopGem).sort((a, b) => a.homePagePosition - b.homePagePosition);
        setTopGems(filtered.slice(0, 10)); 
      }).catch(err => console.log(err));
  };

  const fetchEventAds = () => {
    fetch('https://pinnawalagems.onrender.com/api/event-ads')
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setEventAds(data);
      }).catch(err => console.log(err));
  };

  useEffect(() => {
    fetch('https://pinnawalagems.onrender.com/api/home')
      .then(res => res.json())
      .then(data => {
        if(data && data.heroTitle) setHomeData(data);
      }).catch(err => console.log(err));

    fetch('https://pinnawalagems.onrender.com/api/inventory/categories')
      .then(res => res.json())
      .then(data => setCategories(Array.isArray(data) ? data : [])).catch(err => console.log(err));

    fetchTopGems();
    fetchEventAds();
  }, []);

  const handleChange = (e) => setHomeData({ ...homeData, [e.target.name]: e.target.value });

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('image', file);
    setIsUploading(true);
    try {
      const response = await fetch('https://pinnawalagems.onrender.com/api/upload', { method: 'POST', body: uploadData });
      if (response.ok) {
        const data = await response.json();
        setHomeData(prev => ({ ...prev, [fieldName]: data.imageUrl }));
      }
    } catch (error) { console.log(error); } finally { setIsUploading(false); }
  };

  const handleCustomerPhotosUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setIsUploadingCustomers(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const uploadData = new FormData(); uploadData.append('image', file);
        const res = await fetch('https://pinnawalagems.onrender.com/api/upload', { method: 'POST', body: uploadData });
        if (res.ok) uploadedUrls.push((await res.json()).imageUrl);
      }
      setHomeData(prev => ({ ...prev, customerPhotos: [...(prev.customerPhotos || []), ...uploadedUrls] }));
    } catch (error) { console.log(error); } finally { setIsUploadingCustomers(false); }
  };

  const handleTopGemImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setIsUploadingGemImg(true);
    try {
      const urls = [];
      for (let i = 0; i < Math.min(files.length, 5); i++) {
        const uploadData = new FormData(); uploadData.append('image', files[i]);
        const res = await fetch('https://pinnawalagems.onrender.com/api/upload', { method: 'POST', body: uploadData });
        if (res.ok) urls.push((await res.json()).imageUrl);
      }
      if (urls.length > 0) {
        setNewTopGem(prev => ({ ...prev, image: urls[0], additionalImages: urls.slice(1) }));
      }
    } catch (error) { alert("Upload failed."); } finally { setIsUploadingGemImg(false); }
  };

  const handleEventAdImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('image', file);
    setIsUploadingEventImg(true);
    try {
      const res = await fetch('https://pinnawalagems.onrender.com/api/upload', { method: 'POST', body: uploadData });
      if (res.ok) {
        const data = await res.json();
        setNewEventAd(prev => ({ ...prev, image: data.imageUrl }));
      }
    } catch (error) { alert("Image upload failed"); } finally { setIsUploadingEventImg(false); }
  };

  const handleAddEventAd = async () => {
    if (!newEventAd.title || !newEventAd.image) {
      return alert("Event Name and Image are required!");
    }
    try {
      const res = await fetch('https://pinnawalagems.onrender.com/api/event-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(newEventAd)
      });
      if (res.ok) {
        alert("Event / Advertisement Added Successfully! 🎉");
        setNewEventAd({ title: '', image: '', layoutType: 'horizontal', description: '' });
        fetchEventAds();
      } else {
        alert("Failed to add event/ad");
      }
    } catch (err) { console.log(err); }
  };

  const handleDeleteEventAd = async (id) => {
    if (window.confirm("Are you sure you want to delete this Event/Ad?")) {
      try {
        const res = await fetch(`https://pinnawalagems.onrender.com/api/event-ads/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          fetchEventAds();
        }
      } catch (err) { console.log(err); }
    }
  };

  const handleAddTopGem = async () => {
    if (!newTopGem.gemType || !newTopGem.image) {
      return alert("Gem Type and at least 1 Image are mandatory!");
    }
    
    const selectedCategory = categories.find(cat => cat.title === newTopGem.gemType);
    if (!selectedCategory) return alert("Invalid Category Selected");

    const payload = {
      categoryId: selectedCategory._id,
      title: newTopGem.title || 'Premium Gemstone',
      image: newTopGem.image,
      additionalImages: newTopGem.additionalImages,
      weight: newTopGem.weight,
      shape: newTopGem.shape,
      cut: newTopGem.cut,
      origin: newTopGem.origin,
      hasCertificate: !!newTopGem.certificateDetails,
      certificateDetails: newTopGem.certificateDetails,
      isTopGem: true,
      homePagePosition: parseInt(newTopGem.homePagePosition) || 1
    };

    try {
      const response = await fetch('https://pinnawalagems.onrender.com/api/inventory/stones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        alert("Top Gem Added & Synced to Collection! 💎");
        setNewTopGem({ gemType: '', homePagePosition: '1', title: '', weight: '', shape: '', cut: '', origin: '', certificateDetails: '', image: '', additionalImages: [] });
        fetchTopGems();
      } else { 
        const errorData = await response.json();
        alert("Failed to add gem: " + (errorData.message || "Unknown error")); 
      }
    } catch (error) { console.log(error); }
  };

  const removeTopGem = async (id) => {
    if(window.confirm("Remove this from Home Page? (It will remain in the Catalog)")){
      try {
        await fetch(`https://pinnawalagems.onrender.com/api/inventory/stones/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ isTopGem: false })
        });
        fetchTopGems();
      } catch (error) { console.log(error); }
    }
  };

  const removeAdImage = (fieldName) => setHomeData(prev => ({ ...prev, [fieldName]: '' }));
  const removeCustomerPhoto = (index) => setHomeData(prev => ({ ...prev, customerPhotos: prev.customerPhotos.filter((_, i) => i !== index) }));

  const handleSave = async () => {
    try {
      const res = await fetch('https://pinnawalagems.onrender.com/api/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(homeData)
      });
      if(res.ok) { alert("Home page updated successfully!"); setIsEditing(false); }
    } catch (error) { console.log(error); }
  };

  const bgImage = homeData.heroImage || "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?q=80&w=2074&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-x-hidden">
      
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: flex; width: max-content; animation: marquee 35s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }

        @keyframes steady-shine {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 3px rgba(59,130,246,0.6)) brightness(1); }
          50% { transform: scale(1.12); filter: drop-shadow(0 0 12px rgba(96,165,250,1)) brightness(1.4); }
        }
        .animate-steady-shine { animation: steady-shine 2s ease-in-out infinite; }

        @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.4); } }
        .animate-red-dot { animation: pulse-dot 1.2s infinite; }
      `}</style>

      {/* ---------------- 🔹 SLIM NAVIGATION BAR 🔹 ---------------- */}
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md text-blue-950 py-3 px-6 border-b border-blue-100 shadow-sm flex flex-col items-center">
        <div className="flex flex-col items-center mb-2">
          <img src="/image_27d308.png" alt="Pinnawala Gems Logo" className="h-10 md:h-12 w-auto object-contain mix-blend-multiply transform scale-[1.5] mt-2 mb-3" />
          <h1 className="text-lg md:text-xl font-serif tracking-[0.2em] uppercase font-bold text-center">Pinnawala Gems</h1>
        </div>
        <div className="flex gap-5 md:gap-8 items-center flex-wrap justify-center">
          <Link to="/" className="text-[10px] md:text-xs font-bold tracking-[0.15em] text-blue-600 transition-colors uppercase">Home</Link>
          <Link to="/catalog" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Collection</Link>
          <Link to="/workshop" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Workshop</Link>
          <Link to="/feedback" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Feedback</Link>
          <Link to="/contact" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Contact Us</Link>
          {isAdmin && (
            <button onClick={() => setIsEditing(!isEditing)} className="bg-blue-950 text-white px-4 py-1.5 text-[10px] font-bold tracking-wider uppercase hover:bg-blue-800 transition-colors shadow-md ml-2 rounded-sm">
              {isEditing ? 'Cancel Edit' : 'Edit Content'}
            </button>
          )}
        </div>
      </nav>

      {/* ---------------- 1. HERO SECTION (WELCOME) ---------------- */}
      <main className="relative w-full min-h-screen flex items-center justify-center pt-32 pb-20">
        
        {/* 🔹 EVENTS & NEWS BADGE (EXACT ORIGINAL POSITION & SIZE) 🔹 */}
        <div className="absolute top-44 right-6 md:right-12 z-30">
          <button 
            onClick={() => setShowEventModal(true)}
            className="relative bg-white/90 backdrop-blur-md border border-blue-200 shadow-xl px-4 py-2.5 rounded-full flex items-center gap-2 hover:bg-blue-950 hover:text-white transition-all group cursor-pointer"
          >
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 rounded-full animate-red-dot border-2 border-white"></span>
            <span className="text-lg animate-steady-shine inline-block">💎</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-blue-950 group-hover:text-white">Events & News</span>
          </button>
        </div>

        {homeData.heroVideo ? (
          <div className="absolute inset-0 z-0 overflow-hidden bg-slate-100">
            <iframe src={homeData.heroVideo} title="Background Video" className="absolute top-1/2 left-1/2 w-[150vw] h-[100vh] min-w-full min-h-full -translate-x-1/2 -translate-y-1/2 object-cover pointer-events-none opacity-80" frameBorder="0" allow="autoplay; muted; loop; fullscreen"></iframe>
            <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/40 to-slate-50"></div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0" style={{ backgroundImage: `url('${bgImage}')` }}>
            <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/40 to-slate-50"></div>
          </div>
        )}

        <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center justify-center mt-10">
          {isEditing ? (
            <div className="bg-white/95 backdrop-blur-xl p-8 md:p-12 w-full max-w-5xl border border-blue-100 shadow-2xl rounded-sm my-10 h-auto max-h-[85vh] overflow-y-auto">
              <h2 className="text-2xl font-serif text-blue-950 mb-8 text-center tracking-widest uppercase font-bold">Edit Premium Content</h2>
              
              <div className="space-y-6">
                
                {/* 🔹 HERO IMAGE/VIDEO UPLOAD 🔹 */}
                <div className="border-2 border-dashed border-blue-200 p-6 bg-slate-50 text-center mb-6">
                  <h3 className="text-sm text-blue-900 font-bold uppercase tracking-widest mb-4">Main Background Cover</h3>
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'heroImage')} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-800 hover:file:bg-blue-100 mx-auto block mb-4" />
                  <input type="text" name="heroVideo" value={homeData.heroVideo} onChange={handleChange} placeholder="Or YouTube Embed URL..." className="w-full bg-white text-blue-950 border border-blue-200 p-3 focus:outline-none focus:border-blue-950 transition-colors text-xs" />
                </div>

                {/* 🔹 ADVANCED TOP 10 GEMS UPLOAD 🔹 */}
                <div className="border-2 border-dashed border-purple-400 p-6 bg-purple-50/50 mb-6 shadow-sm">
                  <h3 className="text-sm text-purple-900 font-bold uppercase tracking-widest mb-4 text-center">Manage Top 10 Gems (Syncs with Collection)</h3>
                  
                  <div className="bg-white p-6 border border-purple-200 rounded-sm shadow-md mb-6">
                    <h4 className="text-xs text-purple-800 uppercase font-bold mb-4 border-b border-purple-100 pb-2">Add a New Top Gem (Auto-ID Generated)</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="col-span-1 md:col-span-2">
                        <label className="text-[10px] text-purple-700 uppercase font-semibold block mb-1">Gem Type (Required)</label>
                        <select value={newTopGem.gemType} onChange={(e) => setNewTopGem({...newTopGem, gemType: e.target.value})} className="w-full bg-slate-50 border border-purple-200 p-2 text-xs focus:outline-none font-bold">
                          <option value="">Select Category...</option>
                          {categories.map(cat => (
                            <option key={cat._id} value={cat.title}>{cat.title}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-[10px] text-purple-700 uppercase font-semibold block mb-1">Display Position (1-10)</label>
                        <select value={newTopGem.homePagePosition} onChange={(e) => setNewTopGem({...newTopGem, homePagePosition: e.target.value})} className="w-full bg-slate-50 border border-purple-200 p-2 text-xs focus:outline-none font-bold">
                          {[1,2,3,4,5,6,7,8,9,10].map(num => (
                            <option key={num} value={num}>Position {num}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-purple-700 uppercase font-semibold block mb-1">Upload Images (Up to 5)</label>
                        <input type="file" multiple accept="image/*" onChange={handleTopGemImagesUpload} className="text-[10px] w-full mt-1" />
                        {isUploadingGemImg && <p className="text-[10px] text-purple-600 mt-1 font-bold">Uploading...</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="text-[10px] text-purple-700 uppercase font-semibold block mb-1">Gem Name</label>
                        <input type="text" value={newTopGem.title} onChange={(e) => setNewTopGem({...newTopGem, title: e.target.value})} placeholder="e.g. Royal Blue Sapphire" className="w-full bg-slate-50 border border-purple-200 p-2 text-xs" />
                      </div>
                      <div>
                        <label className="text-[10px] text-purple-700 uppercase font-semibold block mb-1">Weight (ct)</label>
                        <input type="text" value={newTopGem.weight} onChange={(e) => setNewTopGem({...newTopGem, weight: e.target.value})} placeholder="e.g. 5.2" className="w-full bg-slate-50 border border-purple-200 p-2 text-xs" />
                      </div>
                      <div>
                        <label className="text-[10px] text-purple-700 uppercase font-semibold block mb-1">Shape</label>
                        <input type="text" value={newTopGem.shape} onChange={(e) => setNewTopGem({...newTopGem, shape: e.target.value})} placeholder="e.g. Oval" className="w-full bg-slate-50 border border-purple-200 p-2 text-xs" />
                      </div>
                      <div>
                        <label className="text-[10px] text-purple-700 uppercase font-semibold block mb-1">Cut</label>
                        <input type="text" value={newTopGem.cut} onChange={(e) => setNewTopGem({...newTopGem, cut: e.target.value})} placeholder="e.g. Brilliant" className="w-full bg-slate-50 border border-purple-200 p-2 text-xs" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="text-[10px] text-purple-700 uppercase font-semibold block mb-1">Origin</label>
                        <input type="text" value={newTopGem.origin} onChange={(e) => setNewTopGem({...newTopGem, origin: e.target.value})} placeholder="e.g. Ceylon (Sri Lanka)" className="w-full bg-slate-50 border border-purple-200 p-2 text-xs" />
                      </div>
                      <div>
                        <label className="text-[10px] text-purple-700 uppercase font-semibold block mb-1">Certificate Number</label>
                        <input type="text" value={newTopGem.certificateDetails} onChange={(e) => setNewTopGem({...newTopGem, certificateDetails: e.target.value})} placeholder="e.g. GIA-123456" className="w-full bg-slate-50 border border-purple-200 p-2 text-xs" />
                      </div>
                      <button onClick={handleAddTopGem} disabled={isUploadingGemImg || !newTopGem.gemType || !newTopGem.image} className="bg-purple-900 text-white w-full py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-purple-800 disabled:bg-slate-400">
                        + Add & Sync to Catalog
                      </button>
                    </div>
                  </div>

                  {topGems.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {topGems.map((gem, idx) => (
                        <TopGemCard key={idx} gem={gem} isAdmin={true} onRemove={removeTopGem} />
                      ))}
                    </div>
                  )}
                </div>

                {/* 🔹 HIGHLIGHT FEATURE SECTION UPLOAD 🔹 */}
                <div className="border-2 border-dashed border-amber-300 p-6 bg-amber-50/30 mb-6">
                  <h3 className="text-sm text-amber-900 font-bold uppercase tracking-widest mb-4 text-center">Manage Feature Section (Our Legacy)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs text-amber-800 uppercase tracking-[0.2em] font-semibold block mb-2">Feature Image (Left Side)</label>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'featureImage')} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 w-full block mb-2" />
                      {homeData.featureImage && <img src={homeData.featureImage} alt="Feature Preview" className="h-24 object-cover rounded-sm border border-slate-200 shadow-sm" />}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-amber-800 uppercase tracking-[0.2em] font-semibold">Small Subtitle:</label>
                        <input type="text" name="featureSubtitle" value={homeData.featureSubtitle} onChange={handleChange} className="w-full bg-white text-blue-950 border border-amber-200 p-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-amber-800 uppercase tracking-[0.2em] font-semibold">Main Title:</label>
                        <input type="text" name="featureTitle" value={homeData.featureTitle} onChange={handleChange} className="w-full bg-white text-blue-950 border border-amber-200 p-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-amber-800 uppercase tracking-[0.2em] font-semibold">Description Text:</label>
                        <textarea name="featureDescription" value={homeData.featureDescription} onChange={handleChange} rows="4" className="w-full bg-white text-blue-950 border border-amber-200 p-2 text-sm"></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 🔹 CUSTOMER PHOTOS UPLOAD 🔹 */}
                <div className="border-2 border-dashed border-green-300 p-6 bg-green-50/30 text-center mb-6">
                  <h3 className="text-sm text-green-900 font-bold uppercase tracking-widest mb-4">Manage Customer Gallery Slider</h3>
                  <input type="file" multiple accept="image/*" onChange={handleCustomerPhotosUpload} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-green-100 file:text-green-800 mx-auto block mb-4" />
                  {isUploadingCustomers && <p className="text-xs text-green-600 font-bold mb-2">Uploading Photos... ⏳</p>}
                  {homeData.customerPhotos && homeData.customerPhotos.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-4 justify-center">
                      {homeData.customerPhotos.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img src={img} alt={`Customer ${idx}`} className="h-16 w-16 object-cover border border-slate-300 rounded-sm" />
                          <button onClick={() => removeCustomerPhoto(idx)} className="absolute -top-2 -right-2 bg-red-600 text-white w-5 h-5 rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">✖</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 🔹 ADVERTISEMENTS UPLOAD 🔹 */}
                <div className="border-2 border-dashed border-slate-300 p-6 bg-slate-50 text-center mb-6">
                  <h3 className="text-sm text-blue-900 font-bold uppercase tracking-widest mb-4">Manage Advertisements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
                    <div className="border border-slate-200 p-3 bg-white">
                      <label className="text-[10px] text-blue-800 uppercase tracking-widest font-semibold block mb-2">Vertical Ad (Side)</label>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'sideAdImage')} className="text-[9px] w-full mb-2" />
                      {homeData.sideAdImage && (
                        <div className="relative mt-2 inline-block">
                          <img src={homeData.sideAdImage} alt="Ad 2" className="h-12 object-contain border" />
                          <button onClick={() => removeAdImage('sideAdImage')} className="absolute -top-2 -right-2 bg-red-600 text-white w-4 h-4 rounded-full text-[8px]">✖</button>
                        </div>
                      )}
                    </div>
                    <div className="border border-slate-200 p-3 bg-white">
                      <label className="text-[10px] text-blue-800 uppercase tracking-widest font-semibold block mb-2">Horizontal Ad (Bottom)</label>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'bottomAdImage')} className="text-[9px] w-full mb-2" />
                      {homeData.bottomAdImage && (
                        <div className="relative mt-2 inline-block">
                          <img src={homeData.bottomAdImage} alt="Ad 3" className="h-12 object-contain border" />
                          <button onClick={() => removeAdImage('bottomAdImage')} className="absolute -top-2 -right-2 bg-red-600 text-white w-4 h-4 rounded-full text-[8px]">✖</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Main Hero Title:</label>
                  <input type="text" name="heroTitle" value={homeData.heroTitle} onChange={handleChange} className="w-full bg-white text-blue-950 border border-blue-200 p-3 mt-2 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Brand Introduction:</label>
                  <textarea name="brandIntro" value={homeData.brandIntro} onChange={handleChange} className="w-full bg-white text-blue-950 border border-blue-200 p-3 mt-2 h-24 focus:outline-none"></textarea>
                </div>
                
                <button onClick={handleSave} disabled={isUploading || isUploadingCustomers || isUploadingGemImg} className="w-full bg-blue-950 text-white font-bold py-4 mt-8 tracking-[0.2em] uppercase hover:bg-blue-900 transition-colors shadow-lg disabled:bg-slate-400">
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center w-full mt-10 z-10">
              <h2 className="text-xs md:text-sm text-blue-800 tracking-[0.4em] uppercase mb-6 font-bold">Authentic Sri Lankan Gemstones</h2>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-blue-950 mb-8 drop-shadow-sm tracking-wide leading-tight">{homeData.heroTitle}</h1>
              <p className="text-base md:text-xl text-slate-800 font-semibold mb-14 max-w-2xl mx-auto font-light leading-loose">{homeData.brandIntro}</p>
              <div className="flex justify-center">
                <Link to="/catalog" className="px-10 py-4 bg-blue-950 text-white uppercase tracking-[0.2em] text-sm hover:bg-blue-900 transition-all duration-300 shadow-xl font-semibold">
                  Explore Collection
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ---------------- 2. CUSTOMER PHOTOS SLIDER (MOMENTS WITH OUR CLIENTELE) ---------------- */}
      {!isEditing && homeData.customerPhotos && homeData.customerPhotos.length > 0 && (
        <section className="w-full bg-white py-16 overflow-hidden border-t border-slate-100 shadow-inner">
          <div className="text-center mb-10 px-6">
            <h2 className="text-sm md:text-base text-blue-800 tracking-[0.3em] uppercase mb-2 font-bold">Moments with Our Clientele</h2>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-blue-950">Trusted by Customers Worldwide</h1>
            <div className="w-16 h-1 bg-blue-300 mx-auto mt-4"></div>
          </div>
          <div className="relative w-full overflow-hidden flex bg-white py-4">
            <div className="animate-marquee gap-6 px-3">
              {[...(homeData.customerPhotos), ...(homeData.customerPhotos)].map((photo, index) => (
                <div key={index} className="flex-shrink-0 w-64 md:w-72 h-44 md:h-52 bg-slate-50 rounded-xl shadow-md overflow-hidden border border-slate-200 hover:shadow-xl transition-shadow cursor-pointer">
                  <img src={photo} alt={`Happy Customer ${index}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------- 3. SPLIT FEATURE SECTION (OUR LEGACY) ---------------- */}
      {!isEditing && (
        <section className="w-full bg-slate-50 py-24 px-6 md:px-12 flex items-center justify-center border-t border-slate-200">
          <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="relative group overflow-hidden rounded-sm shadow-2xl">
              <img src={homeData.featureImage || 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=800&auto=format&fit=crop'} alt="Feature Section" className="w-full h-[400px] md:h-[500px] object-cover transform group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 border-4 border-white/20 m-4 pointer-events-none hidden md:block"></div>
            </div>
            <div className="flex flex-col justify-center space-y-6">
              <h3 className="text-xs md:text-sm text-blue-600 font-bold tracking-[0.3em] uppercase">{homeData.featureSubtitle || 'Our Legacy'}</h3>
              <h2 className="text-4xl md:text-5xl font-serif text-blue-950 font-bold leading-tight">{homeData.featureTitle || 'Crafted to Perfection'}</h2>
              <div className="w-16 h-1 bg-blue-300"></div>
              <p className="text-slate-600 leading-loose text-base md:text-lg font-light text-justify">{homeData.featureDescription || 'Discover the finest collection of authentic Sri Lankan gemstones. Each piece is carefully selected and masterfully crafted.'}</p>
              <div className="pt-4">
                 <Link to="/workshop" className="inline-block border-b-2 border-blue-950 pb-1 text-sm font-bold uppercase tracking-[0.15em] text-blue-950 hover:text-blue-600 transition-colors">Discover Our Process ➝</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ---------------- 4. TOP 10 GEMS SHOWCASE (FEATURED COLLECTION) ---------------- */}
      {!isEditing && topGems.length > 0 && (
        <section className="w-full bg-white py-20 px-6 flex flex-col items-center border-t border-slate-100">
          <div className="text-center mb-12">
            <h2 className="text-xs md:text-sm text-blue-600 font-bold tracking-[0.3em] uppercase mb-2">Featured Collection</h2>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-blue-950">Top Premium Gemstones</h1>
            <div className="w-16 h-1 bg-blue-300 mx-auto mt-4"></div>
          </div>
          
          <div className="w-full max-w-6xl grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {topGems.map((gem, idx) => (
              <TopGemCard key={idx} gem={gem} isAdmin={false} />
            ))}
          </div>
        </section>
      )}

      {/* ---------------- 5. SCROLL DOWN ADVERTISEMENTS ---------------- */}
      {!isEditing && (homeData.sideAdImage || homeData.bottomAdImage) && (
        <section className="w-full bg-slate-50 py-16 px-6 flex flex-col items-center gap-16 border-t border-slate-200">
          {homeData.sideAdImage && (
            <div className="w-full max-w-md"><img src={homeData.sideAdImage} alt="Ad 2" className="w-full h-auto object-contain rounded-sm shadow-md border border-slate-200" /></div>
          )}
          {homeData.bottomAdImage && (
            <div className="w-full max-w-5xl"><img src={homeData.bottomAdImage} alt="Ad 3" className="w-full h-auto object-contain rounded-sm shadow-md border border-slate-200" /></div>
          )}
        </section>
      )}

      {/* ---------------- 🔹 EVENTS & ADS POPUP MODAL ---------------- */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-blue-950 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-serif font-bold tracking-widest uppercase">Exhibitions & Special Events</h2>
                <p className="text-[10px] text-blue-200 tracking-wider">Latest updates and announcements</p>
              </div>
              <button onClick={() => setShowEventModal(false)} className="bg-red-600 text-white w-8 h-8 rounded-full font-bold hover:bg-red-700 transition-colors flex items-center justify-center">✕</button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
              
              {/* If Admin, show Add Event Form inside Modal */}
              {isAdmin && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg shadow-sm mb-6">
                  <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3">Admin Panel: Post New Event / Ad</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <input type="text" placeholder="Event Name / Title" value={newEventAd.title} onChange={(e) => setNewEventAd({...newEventAd, title: e.target.value})} className="bg-white border border-blue-200 p-2 text-xs rounded" />
                    <select value={newEventAd.layoutType} onChange={(e) => setNewEventAd({...newEventAd, layoutType: e.target.value})} className="bg-white border border-blue-200 p-2 text-xs rounded font-bold">
                      <option value="horizontal">Horizontal Layout</option>
                      <option value="vertical">Vertical Layout</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <input type="file" accept="image/*" onChange={handleEventAdImageUpload} className="text-xs w-full" />
                      {isUploadingEventImg && <span className="text-[10px] text-blue-600 font-bold">Uploading image...</span>}
                      {newEventAd.image && <img src={newEventAd.image} alt="Preview" className="h-12 mt-1 object-contain border" />}
                    </div>
                    <textarea placeholder="Description (Optional)" value={newEventAd.description} onChange={(e) => setNewEventAd({...newEventAd, description: e.target.value})} rows="2" className="bg-white border border-blue-200 p-2 text-xs rounded"></textarea>
                  </div>
                  <button onClick={handleAddEventAd} disabled={!newEventAd.title || !newEventAd.image} className="bg-blue-950 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded hover:bg-blue-900 disabled:bg-slate-400">
                    + Publish Event
                  </button>
                </div>
              )}

              {/* Display Events & Ads List */}
              {eventAds.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p className="text-sm font-semibold">No active exhibitions or events right now.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {eventAds.map((ad) => (
                    <div key={ad._id} className="bg-white p-5 rounded-xl shadow-md border border-slate-200 flex flex-col items-center">
                      <div className="w-full bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center mb-4 p-2">
                        <img src={ad.image} alt={ad.title} className="max-h-[400px] w-auto object-contain rounded" />
                      </div>
                      
                      <div className="w-full text-center">
                        <h3 className="text-xl font-serif font-bold text-blue-950 mb-2">{ad.title}</h3>
                        {ad.description && <p className="text-slate-600 text-sm leading-relaxed max-w-2xl mx-auto">{ad.description}</p>}
                        
                        {isAdmin && (
                          <button onClick={() => handleDeleteEventAd(ad._id)} className="mt-4 bg-red-600 text-white text-[10px] uppercase font-bold tracking-wider px-4 py-1.5 rounded hover:bg-red-700">
                            Delete Event
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Home;