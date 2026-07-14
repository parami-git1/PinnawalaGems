import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Home() {
  const [homeData, setHomeData] = useState({
    heroTitle: 'Welcome to Pinnawala Gems',
    brandIntro: 'Premium gemstones marketplace offering the finest quality stones.',
    address: 'Pinnawala, Sri Lanka',
    contactNumber: '+94 77 123 4567',
    whatsappNumber: '94776599740',
    inquiryEmail: 'paramividarshanamuthumali@gmail.com',
    googleMapsLink: '',
    heroImage: '', 
    heroVideo: '',
    topAdImage: '',
    sideAdImage: '',
    bottomAdImage: '',
    customerPhotos: [] // 🔹 අලුත් Customer Photos Array එක
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCustomers, setIsUploadingCustomers] = useState(false);
  const isAdmin = !!localStorage.getItem('token');

  useEffect(() => {
    fetch('https://pinnawalagems.onrender.com/api/home')
      .then(res => res.json())
      .then(data => {
        if(data && data.heroTitle) {
          setHomeData({
            ...data,
            heroVideo: data.heroVideo || '',
            topAdImage: data.topAdImage || '',
            sideAdImage: data.sideAdImage || '',
            bottomAdImage: data.bottomAdImage || '',
            customerPhotos: data.customerPhotos || []
          }); 
        }
      })
      .catch(err => console.log("Error fetching home data:", err));
  }, []);

  const handleChange = (e) => {
    setHomeData({ ...homeData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async (e, fieldName) => {
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
        setHomeData(prev => ({ ...prev, [fieldName]: data.imageUrl }));
      }
    } catch (error) {
      console.log("Error uploading image:", error);
      alert("Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  // 🔹 Customer Photos ගොඩක් එකපාර Upload කරන Function එක
  const handleCustomerPhotosUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setIsUploadingCustomers(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const uploadData = new FormData(); 
        uploadData.append('image', file);
        const response = await fetch('https://pinnawalagems.onrender.com/api/upload', { method: 'POST', body: uploadData });
        if (response.ok) {
          const data = await response.json();
          uploadedUrls.push(data.imageUrl);
        }
      }
      setHomeData(prev => ({ ...prev, customerPhotos: [...(prev.customerPhotos || []), ...uploadedUrls] }));
    } catch (error) { console.log(error); } finally { setIsUploadingCustomers(false); }
  };

  const removeAdImage = (fieldName) => {
    setHomeData(prev => ({ ...prev, [fieldName]: '' }));
  };

  const removeCustomerPhoto = (indexToRemove) => {
    setHomeData(prev => ({ ...prev, customerPhotos: prev.customerPhotos.filter((_, index) => index !== indexToRemove) }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch('https://pinnawalagems.onrender.com/api/home', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(homeData)
      });
      if(response.ok) {
        alert("Premium Home page updated successfully! 💎");
        setIsEditing(false);
      }
    } catch (error) {
      console.log("Error saving home data:", error);
    }
  };

  const bgImage = homeData.heroImage || "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?q=80&w=2074&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-x-hidden">
      
      {/* 🔹 CSS Animations for the Marquee (Slider) 🔹 */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 35s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* ---------------- 🔹 SLIM NAVIGATION BAR 🔹 ---------------- */}
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md text-blue-950 py-3 px-6 border-b border-blue-100 shadow-sm flex flex-col items-center">
        <div className="flex flex-col items-center mb-2">
          <img 
            src="/image_27d308.png" 
            alt="Pinnawala Gems Logo" 
            className="h-10 md:h-12 w-auto object-contain mix-blend-multiply transform scale-[1.5] mt-2 mb-3" 
          />
          <h1 className="text-lg md:text-xl font-serif tracking-[0.2em] uppercase font-bold text-center">
            Pinnawala Gems
          </h1>
        </div>
        
        <div className="flex gap-5 md:gap-8 items-center flex-wrap justify-center">
          <Link to="/" className="text-[10px] md:text-xs font-bold tracking-[0.15em] text-blue-600 transition-colors uppercase">Home</Link>
          <Link to="/catalog" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Collection</Link>
          <Link to="/workshop" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Workshop</Link>
          <Link to="/feedback" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Feedback</Link>
          <Link to="/contact" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Contact Us</Link>
          
          {isAdmin && (
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              className="bg-blue-950 text-white px-4 py-1.5 text-[10px] font-bold tracking-wider uppercase hover:bg-blue-800 transition-colors shadow-md ml-2 rounded-sm"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Content'}
            </button>
          )}
        </div>
      </nav>

      {/* ---------------- 🔹 ADVERTISEMENT SECTIONS (Public View) 🔹 ---------------- */}
      {homeData.topAdImage && !isEditing && (
        <div className="absolute top-[140px] md:top-[130px] left-0 w-full z-20 flex justify-center px-4">
          <img src={homeData.topAdImage} alt="Top Advertisement" className="max-h-20 md:max-h-28 w-auto max-w-full object-contain shadow-lg" />
        </div>
      )}

      {homeData.sideAdImage && !isEditing && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col justify-center">
          <img src={homeData.sideAdImage} alt="Side Advertisement" className="w-16 md:w-24 h-auto object-contain shadow-2xl rounded-l-md border-y border-l border-white/20" />
        </div>
      )}

      {homeData.bottomAdImage && !isEditing && (
        <div className="absolute bottom-10 left-0 w-full z-20 flex justify-center px-4">
          <img src={homeData.bottomAdImage} alt="Bottom Advertisement" className="max-h-20 md:max-h-28 w-auto max-w-full object-contain shadow-lg" />
        </div>
      )}

      {/* ---------------- 🔹 HERO SECTION (Image or Video) 🔹 ---------------- */}
      <main className="relative w-full min-h-screen flex items-center justify-center pt-32 pb-20">
        {homeData.heroVideo ? (
          <div className="absolute inset-0 z-0 overflow-hidden bg-slate-100">
            <iframe 
              src={homeData.heroVideo} 
              title="Background Video"
              className="absolute top-1/2 left-1/2 w-[150vw] h-[100vh] min-w-full min-h-full -translate-x-1/2 -translate-y-1/2 object-cover pointer-events-none opacity-80"
              frameBorder="0" 
              allow="autoplay; muted; loop; fullscreen"
            ></iframe>
            <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/70 to-slate-50"></div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0" style={{ backgroundImage: `url('${bgImage}')` }}>
            <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/80 to-slate-50"></div>
          </div>
        )}

        <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center justify-center mt-10">
          {isEditing ? (
            <div className="bg-white/95 backdrop-blur-xl p-8 md:p-12 w-full max-w-3xl border border-blue-100 shadow-2xl rounded-sm my-10 h-auto max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-serif text-blue-950 mb-8 text-center tracking-widest uppercase font-bold">Edit Premium Content</h2>
              
              <div className="space-y-6">
                
                {/* Image/Video Upload Area */}
                <div className="border-2 border-dashed border-blue-200 p-6 bg-slate-50 text-center mb-6">
                  <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold block mb-4">Upload New Background Image</label>
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'heroImage')} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-800 hover:file:bg-blue-100 mx-auto block" />
                  {isUploading && <p className="text-xs text-blue-600 mt-3 tracking-widest font-bold">UPLOADING... ⏳</p>}
                  
                  {homeData.heroImage && !isUploading && (
                    <div className="mt-4 mb-6 relative inline-block">
                      <p className="text-[10px] text-green-600 uppercase tracking-widest font-bold mb-2">Selected Image:</p>
                      <img src={homeData.heroImage} alt="Hero Preview" className="h-24 mx-auto object-cover rounded-sm border border-slate-200 shadow-sm" />
                    </div>
                  )}

                  <div className="w-full border-t border-slate-200 my-6 relative">
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-50 px-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">OR</span>
                  </div>

                  <div className="mt-6 text-left">
                    <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold block mb-2">Use YouTube Video Instead (Embed URL)</label>
                    <input type="text" name="heroVideo" value={homeData.heroVideo} onChange={handleChange} placeholder="e.g. https://www.youtube.com/embed/XXXXXX?autoplay=1&mute=1&loop=1" className="w-full bg-white text-blue-950 border border-blue-200 p-3 focus:outline-none focus:border-blue-950 transition-colors text-xs" />
                  </div>
                </div>

                {/* 🔹 NEW: CUSTOMER PHOTOS UPLOAD SECTION 🔹 */}
                <div className="border-2 border-dashed border-green-300 p-6 bg-green-50/30 text-center mb-6">
                  <h3 className="text-sm text-green-900 font-bold uppercase tracking-widest mb-4">Manage Customer Gallery</h3>
                  <label className="text-[10px] text-green-800 uppercase tracking-widest font-semibold block mb-2">Upload Multiple Photos (5+ Recommended)</label>
                  <input type="file" multiple accept="image/*" onChange={handleCustomerPhotosUpload} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-green-100 file:text-green-800 hover:file:bg-green-200 mx-auto block mb-4" />
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

                {/* 🔹 ADVERTISEMENTS UPLOAD SECTION 🔹 */}
                <div className="border-2 border-dashed border-slate-300 p-6 bg-slate-50 text-center mb-6">
                  <h3 className="text-sm text-blue-900 font-bold uppercase tracking-widest mb-4">Manage Advertisements (Optional)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border border-slate-200 p-3 bg-white">
                      <label className="text-[10px] text-blue-800 uppercase tracking-widest font-semibold block mb-2">Horizontal Ad 1</label>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'topAdImage')} className="text-[9px] w-full mb-2" />
                      {homeData.topAdImage && (
                        <div className="relative mt-2 inline-block">
                          <img src={homeData.topAdImage} alt="Horizontal Ad 1" className="h-12 object-contain border" />
                          <button onClick={() => removeAdImage('topAdImage')} className="absolute -top-2 -right-2 bg-red-600 text-white w-4 h-4 rounded-full text-[8px]">✖</button>
                        </div>
                      )}
                    </div>
                    <div className="border border-slate-200 p-3 bg-white">
                      <label className="text-[10px] text-blue-800 uppercase tracking-widest font-semibold block mb-2">Vertical Ad</label>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'sideAdImage')} className="text-[9px] w-full mb-2" />
                      {homeData.sideAdImage && (
                        <div className="relative mt-2 inline-block">
                          <img src={homeData.sideAdImage} alt="Vertical Ad" className="h-12 object-contain border" />
                          <button onClick={() => removeAdImage('sideAdImage')} className="absolute -top-2 -right-2 bg-red-600 text-white w-4 h-4 rounded-full text-[8px]">✖</button>
                        </div>
                      )}
                    </div>
                    <div className="border border-slate-200 p-3 bg-white">
                      <label className="text-[10px] text-blue-800 uppercase tracking-widest font-semibold block mb-2">Horizontal Ad 2</label>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'bottomAdImage')} className="text-[9px] w-full mb-2" />
                      {homeData.bottomAdImage && (
                        <div className="relative mt-2 inline-block">
                          <img src={homeData.bottomAdImage} alt="Horizontal Ad 2" className="h-12 object-contain border" />
                          <button onClick={() => removeAdImage('bottomAdImage')} className="absolute -top-2 -right-2 bg-red-600 text-white w-4 h-4 rounded-full text-[8px]">✖</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Main Hero Title:</label>
                  <input type="text" name="heroTitle" value={homeData.heroTitle} onChange={handleChange} className="w-full bg-slate-50 text-blue-950 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Brand Introduction:</label>
                  <textarea name="brandIntro" value={homeData.brandIntro} onChange={handleChange} className="w-full bg-slate-50 text-blue-950 border border-blue-200 p-3 mt-2 h-24 focus:outline-none focus:border-blue-950 transition-colors"></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Location Address:</label>
                    <input type="text" name="address" value={homeData.address} onChange={handleChange} className="w-full bg-slate-50 text-blue-950 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Contact Number:</label>
                    <input type="text" name="contactNumber" value={homeData.contactNumber} onChange={handleChange} className="w-full bg-slate-50 text-blue-950 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">WhatsApp Number:</label>
                    <input type="text" name="whatsappNumber" value={homeData.whatsappNumber} onChange={handleChange} className="w-full bg-slate-50 text-blue-950 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Inquiry Email:</label>
                    <input type="email" name="inquiryEmail" value={homeData.inquiryEmail} onChange={handleChange} className="w-full bg-slate-50 text-blue-950 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950 transition-colors" />
                  </div>
                </div>
                <button 
                  onClick={handleSave} 
                  disabled={isUploading || isUploadingCustomers}
                  className="w-full bg-blue-950 text-white font-bold py-4 mt-8 tracking-[0.2em] uppercase hover:bg-blue-900 transition-colors shadow-lg disabled:bg-slate-400"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center w-full mt-10 z-10">
              <h2 className="text-xs md:text-sm text-blue-800 tracking-[0.4em] uppercase mb-6 font-bold">Authentic Sri Lankan Gemstones</h2>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-blue-950 mb-8 drop-shadow-sm tracking-wide leading-tight">{homeData.heroTitle}</h1>
              <p className="text-base md:text-xl text-slate-700 mb-14 max-w-2xl mx-auto font-light leading-loose">{homeData.brandIntro}</p>
              <div className="flex justify-center">
                <Link to="/catalog" className="px-10 py-4 bg-blue-950 text-white uppercase tracking-[0.2em] text-sm hover:bg-blue-900 transition-all duration-300 shadow-xl font-semibold">
                  Explore Collection
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ---------------- 🔹 NEW: CUSTOMER PHOTOS SLIDER 🔹 ---------------- */}
      {!isEditing && homeData.customerPhotos && homeData.customerPhotos.length > 0 && (
        <section className="w-full bg-slate-50 py-16 overflow-hidden border-t border-slate-200 shadow-inner">
          <div className="text-center mb-10 px-6">
            <h2 className="text-sm md:text-base text-blue-800 tracking-[0.3em] uppercase mb-2 font-bold">Moments with Our Clientele</h2>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-blue-950">Trusted by Customers Worldwide</h1>
            <div className="w-16 h-1 bg-blue-300 mx-auto mt-4"></div>
          </div>

          <div className="relative w-full overflow-hidden flex bg-slate-50 py-4">
            {/* 🔹 Seamless Loop Animation Container 🔹 */}
            <div className="animate-marquee gap-6 px-3">
              {/* Array එක දෙපාරක් Render කරනවා හිස්තැන් නැතුව Loop වෙන්න */}
              {[...(homeData.customerPhotos), ...(homeData.customerPhotos)].map((photo, index) => (
                <div key={index} className="flex-shrink-0 w-64 md:w-72 h-44 md:h-52 bg-white rounded-xl shadow-md overflow-hidden border border-slate-100 hover:shadow-xl transition-shadow cursor-pointer">
                  <img src={photo} alt={`Happy Customer ${index}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------------- 🔹 SCROLL DOWN ADVERTISEMENTS SECTION 🔹 ---------------- */}
      {!isEditing && (homeData.topAdImage || homeData.sideAdImage || homeData.bottomAdImage) && (
        <section className="w-full bg-white py-16 px-6 flex flex-col items-center gap-16 border-t border-slate-100">
          
          {homeData.topAdImage && (
            <div className="w-full max-w-5xl">
              <img src={homeData.topAdImage} alt="Advertisement 1" className="w-full h-auto object-contain rounded-sm shadow-md border border-slate-100" />
            </div>
          )}

          {homeData.sideAdImage && (
            <div className="w-full max-w-md">
              <img src={homeData.sideAdImage} alt="Advertisement 2" className="w-full h-auto object-contain rounded-sm shadow-md border border-slate-100" />
            </div>
          )}

          {homeData.bottomAdImage && (
            <div className="w-full max-w-5xl">
              <img src={homeData.bottomAdImage} alt="Advertisement 3" className="w-full h-auto object-contain rounded-sm shadow-md border border-slate-100" />
            </div>
          )}

        </section>
      )}

    </div>
  );
}

export default Home;