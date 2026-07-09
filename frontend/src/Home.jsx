import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Home() {
  const [homeData, setHomeData] = useState({
    heroTitle: 'CEYLON SAPPHIRES',
    brandIntro: 'Discover the world’s finest natural gemstones, ethically sourced and masterfully cut in Sri Lanka.',
    address: 'Pinnawala, Sri Lanka',
    contactNumber: '+94 77 123 4567',
    whatsappNumber: '94776599740',
    inquiryEmail: 'paramividarshanamuthumali@gmail.com',
    googleMapsLink: '',
    heroImage: '' // Admin අලුතින් දාන ෆොටෝ එක save වෙන්න
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const isAdmin = !!localStorage.getItem('token');

  useEffect(() => {
    fetch('http://localhost:5000/api/home')
      .then(res => res.json())
      .then(data => {
        if(data && data.heroTitle) setHomeData(data); 
      })
      .catch(err => console.log("Error fetching home data:", err));
  }, []);

  const handleChange = (e) => {
    setHomeData({ ...homeData, [e.target.name]: e.target.value });
  };

  // PC එකෙන් අලුත් Hero Image එක Upload කරන Function එක
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('image', file);
    setIsUploading(true);

    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: uploadData,
      });
      
      if (response.ok) {
        const data = await response.json();
        setHomeData({ ...homeData, heroImage: data.imageUrl });
      }
    } catch (error) {
      console.log("Error uploading image:", error);
      alert("Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/home', {
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

  // Admin ෆොටෝ එකක් දාලා නැත්නම්, අපි කලින් දාපු ලස්සන default ෆොටෝ එක පෙන්නනවා (Fallback Image)
  const bgImage = homeData.heroImage || "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?q=80&w=2074&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
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
          <Link to="/" className="text-[10px] md:text-xs font-bold tracking-[0.15em] text-blue-600 transition-colors uppercase">Home</Link>
          <Link to="/catalog" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Collection</Link>
          <Link to="/workshop" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Workshop</Link>
          <Link to="/feedback" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Feedback</Link>
          <Link to="/contact" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Contact</Link>
          
          {/* Admin Button */}
          {isAdmin && (
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              className="bg-blue-950 text-white px-4 py-2 text-[10px] font-bold tracking-wider uppercase hover:bg-blue-800 transition-colors shadow-md ml-2"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Content'}
            </button>
          )}
        </div>
      </nav>

      {/* Main Hero Section (pt-48 added to clear the taller navbar) */}
      <main className="relative w-full min-h-screen flex items-center justify-center pt-48 pb-20">
        
        {/* Dynamic Background Image එක මෙතනින් තමයි යන්නේ */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0" style={{ backgroundImage: `url('${bgImage}')` }}>
          <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/80 to-slate-50"></div>
        </div>

        <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center justify-center mt-10">
          {isEditing ? (
            <div className="bg-white/95 backdrop-blur-xl p-8 md:p-12 w-full max-w-2xl border border-blue-100 shadow-2xl rounded-sm">
              <h2 className="text-2xl font-serif text-blue-950 mb-8 text-center tracking-widest uppercase font-bold">Edit Premium Content</h2>
              
              <div className="space-y-6">
                {/* Hero Image Upload Section */}
                <div className="border-2 border-dashed border-blue-200 p-6 bg-slate-50 text-center mb-6">
                  <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold block mb-4">Upload New Background Image</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-800 hover:file:bg-blue-100 mx-auto block"
                  />
                  {isUploading && <p className="text-xs text-blue-600 mt-3 tracking-widest font-bold">UPLOADING... ⏳</p>}
                  
                  {homeData.heroImage && !isUploading && (
                    <div className="mt-4">
                      <p className="text-[10px] text-green-600 uppercase tracking-widest font-bold mb-2">Selected Image:</p>
                      <img src={homeData.heroImage} alt="Hero Preview" className="h-24 mx-auto object-cover rounded-sm border border-slate-200 shadow-sm" />
                    </div>
                  )}
                  {!homeData.heroImage && !isUploading && (
                     <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-4">Currently using default luxury background.</p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Main Hero Title:</label>
                  <input type="text" name="heroTitle" value={homeData.heroTitle} onChange={handleChange} className="w-full bg-slate-50 text-blue-950 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Brand Introduction:</label>
                  <textarea name="brandIntro" value={homeData.brandIntro} onChange={handleChange} className="w-full bg-slate-50 text-blue-950 border border-blue-200 p-3 mt-2 h-32 focus:outline-none focus:border-blue-950 transition-colors"></textarea>
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
                  disabled={isUploading}
                  className="w-full bg-blue-950 text-white font-bold py-4 mt-8 tracking-[0.2em] uppercase hover:bg-blue-900 transition-colors shadow-lg disabled:bg-slate-400"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center w-full mt-10">
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
    </div>
  );
}

export default Home;