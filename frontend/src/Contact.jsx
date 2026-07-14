import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaPhoneAlt, FaMobileAlt, FaEnvelope, FaClock, FaFacebookF, FaInstagram, FaTiktok } from 'react-icons/fa';

function Contact() {
  const [contactInfo, setContactInfo] = useState({
    address: '',
    landlineNumber: '',
    landlineNumber2: '', 
    mobileNumber: '',
    mobileNumber2: '', 
    email: '',
    openingHours: '',
    facebookLink: '', 
    instagramLink: '', 
    tiktokLink: '', 
    contactImages: [], 
    contactVideo: '', 
    googleMapsLink: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const isAdmin = !!localStorage.getItem('token');

  useEffect(() => {
    fetch('https://pinnawalagems.onrender.com/api/contact')
      .then(res => res.json())
      .then(data => {
        if(data) setContactInfo({
          ...data,
          landlineNumber2: data.landlineNumber2 || '',
          mobileNumber2: data.mobileNumber2 || '',
          facebookLink: data.facebookLink || '',
          instagramLink: data.instagramLink || '',
          tiktokLink: data.tiktokLink || '',
          contactImages: data.contactImages || (data.contactImage ? [data.contactImage] : []), 
          contactVideo: data.contactVideo || ''
        });
      })
      .catch(err => console.log("Error fetching contact info:", err));
  }, []);

  // 🔹 Slider Effect
  useEffect(() => {
    let interval;
    if (!isEditing && contactInfo.contactImages && contactInfo.contactImages.length > 1 && !contactInfo.contactVideo) {
      interval = setInterval(() => {
        setCurrentImgIndex(prev => (prev + 1) % contactInfo.contactImages.length);
      }, 4000); 
    }
    return () => clearInterval(interval);
  }, [isEditing, contactInfo.contactImages, contactInfo.contactVideo]);

  const handleChange = (e) => {
    setContactInfo({ ...contactInfo, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const response = await fetch('https://pinnawalagems.onrender.com/api/contact', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(contactInfo)
      });
      if(response.ok) {
        alert("Contact page updated successfully! ✨");
        setIsEditing(false);
      }
    } catch (error) {
      console.log("Error updating contact info:", error);
    }
  };

  const handleImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setIsUploadingImages(true);
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
      setContactInfo(prev => ({ ...prev, contactImages: [...(prev.contactImages || []), ...uploadedUrls] }));
    } catch (error) { console.log(error); } finally { setIsUploadingImages(false); }
  };

  const removeImage = (indexToRemove) => {
    setContactInfo(prev => ({ ...prev, contactImages: prev.contactImages.filter((_, index) => index !== indexToRemove) }));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-blue-950">
      
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md text-blue-950 py-5 px-6 border-b border-blue-100 shadow-sm flex flex-col items-center">
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
        <div className="flex gap-5 md:gap-8 items-center flex-wrap justify-center">
          <Link to="/" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Home</Link>
          <Link to="/catalog" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Collection</Link>
          <Link to="/workshop" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Workshop</Link>
          <Link to="/feedback" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Feedback</Link>
          <Link to="/contact" className="text-[10px] md:text-xs font-bold tracking-[0.15em] text-blue-600 transition-colors uppercase">Contact Us</Link>
          
          {isAdmin && (
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              className="bg-blue-950 text-white px-4 py-2 text-[10px] font-bold tracking-wider uppercase hover:bg-blue-800 transition-colors shadow-md ml-2"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Contact'}
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto pt-48 pb-24 px-6 md:px-12">
        
        <div className="text-center mb-10">
          <h2 className="text-xs md:text-sm text-blue-800 tracking-[0.4em] uppercase mb-4 font-bold">Get In Touch</h2>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-blue-950 mb-6 tracking-wide">Contact Us</h1>
          <div className="w-16 h-1 bg-blue-300 mx-auto mb-8"></div>
        </div>

        {isEditing ? (
          <div className="bg-white p-8 md:p-12 w-full border border-blue-100 shadow-xl rounded-sm mb-16">
            <h2 className="text-2xl font-serif text-blue-950 mb-8 text-center tracking-widest uppercase font-bold">Edit Contact Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 🔹 Advertisement Details */}
              <div className="md:col-span-2 border border-blue-100 p-6 bg-blue-50/30">
                <h3 className="text-sm font-bold uppercase tracking-widest text-blue-900 mb-4">Advertisement Area (Top Banner)</h3>
                
                <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Video URL (Optional - Replaces Images)</label>
                <input type="text" name="contactVideo" value={contactInfo.contactVideo} onChange={handleChange} placeholder="e.g. YouTube Embed URL (https://www.youtube.com/embed/...)" className="w-full bg-white border border-blue-200 p-3 mt-2 mb-4 focus:outline-none focus:border-blue-950" />
                
                <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold block mb-2">Or Upload Ad Images (Slider)</label>
                <input type="file" multiple onChange={handleImagesUpload} className="w-full text-sm text-slate-500 mb-4" />
                {isUploadingImages && <p className="text-xs text-blue-600 font-bold mb-2">Uploading...</p>}
                
                {contactInfo.contactImages && contactInfo.contactImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {contactInfo.contactImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={img} alt={`Ad ${idx}`} className="h-16 w-16 object-cover border border-slate-300" />
                        <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-600 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✖</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 🔹 Other Details */}
              <div className="md:col-span-2 mt-4">
                <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Address</label>
                <input type="text" name="address" value={contactInfo.address} onChange={handleChange} className="w-full bg-slate-50 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950" />
              </div>
              
              <div>
                <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Landline Number 1</label>
                <input type="text" name="landlineNumber" value={contactInfo.landlineNumber} onChange={handleChange} className="w-full bg-slate-50 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-[0.2em] font-semibold">Landline Number 2 (Optional)</label>
                <input type="text" name="landlineNumber2" value={contactInfo.landlineNumber2} onChange={handleChange} className="w-full bg-slate-50 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950" />
              </div>

              <div>
                <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Mobile Number 1</label>
                <input type="text" name="mobileNumber" value={contactInfo.mobileNumber} onChange={handleChange} className="w-full bg-slate-50 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950" />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-[0.2em] font-semibold">Mobile Number 2 (Optional)</label>
                <input type="text" name="mobileNumber2" value={contactInfo.mobileNumber2} onChange={handleChange} className="w-full bg-slate-50 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950" />
              </div>

              <div>
                <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Email</label>
                <input type="text" name="email" value={contactInfo.email} onChange={handleChange} className="w-full bg-slate-50 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950" />
              </div>
              <div>
                <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Opening Hours</label>
                <input type="text" name="openingHours" value={contactInfo.openingHours} onChange={handleChange} className="w-full bg-slate-50 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950" />
              </div>

              {/* 🔹 Social Media Links */}
              <div className="md:col-span-2 border-t border-slate-100 pt-6 mt-2">
                <h3 className="text-sm font-bold uppercase tracking-widest text-blue-900 mb-4">Social Media Links (Optional)</h3>
              </div>
              <div>
                <label className="text-xs text-blue-600 uppercase tracking-[0.2em] font-semibold">Facebook URL</label>
                <input type="text" name="facebookLink" value={contactInfo.facebookLink} onChange={handleChange} placeholder="https://facebook.com/..." className="w-full bg-slate-50 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950" />
              </div>
              <div>
                <label className="text-xs text-pink-600 uppercase tracking-[0.2em] font-semibold">Instagram URL</label>
                <input type="text" name="instagramLink" value={contactInfo.instagramLink} onChange={handleChange} placeholder="https://instagram.com/..." className="w-full bg-slate-50 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-800 uppercase tracking-[0.2em] font-semibold">TikTok URL</label>
                <input type="text" name="tiktokLink" value={contactInfo.tiktokLink} onChange={handleChange} placeholder="https://tiktok.com/..." className="w-full bg-slate-50 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950" />
              </div>

              <div className="md:col-span-2 border-t border-slate-100 pt-6 mt-2">
                <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Google Maps Embed Link</label>
                <input type="text" name="googleMapsLink" value={contactInfo.googleMapsLink} onChange={handleChange} className="w-full bg-slate-50 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950" />
              </div>
            </div>
            <button onClick={handleSave} disabled={isUploadingImages} className="w-full bg-blue-950 text-white font-bold py-4 mt-8 tracking-[0.2em] uppercase hover:bg-blue-900 transition-colors shadow-lg disabled:bg-slate-400">
              Save Changes
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* ---------------- 🔹 TOP ADVERTISEMENT AREA (Horizontal) - HEIGHT INCREASED 🔹 ---------------- */}
            <div className="w-full h-[400px] md:h-[600px] bg-slate-100 rounded-sm shadow-xl border border-blue-100 overflow-hidden relative group">
              {contactInfo.contactVideo ? (
                <iframe 
                  src={contactInfo.contactVideo} 
                  title="Advertisement Video"
                  className="w-full h-full object-cover"
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              ) : contactInfo.contactImages && contactInfo.contactImages.length > 0 ? (
                <>
                  <img 
                    src={contactInfo.contactImages[currentImgIndex]} 
                    alt="Contact Advertisement" 
                    className="w-full h-full object-cover transition-opacity duration-1000"
                  />
                  {/* Slider Indicators */}
                  {contactInfo.contactImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {contactInfo.contactImages.map((_, idx) => (
                        <div key={idx} className={`h-2 rounded-full transition-all duration-300 ${currentImgIndex === idx ? 'w-6 bg-white' : 'w-2 bg-white/50'}`} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No Advertisement Available</p>
                </div>
              )}
            </div>

            {/* ---------------- 🔹 BOTTOM CONTACT DETAILS (Horizontal Grid) 🔹 ---------------- */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              
              {/* Location Card */}
              <div className="bg-white p-8 border border-blue-50 shadow-md hover:shadow-xl transition-shadow rounded-sm flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <FaMapMarkerAlt className="text-2xl text-blue-800" />
                </div>
                <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-blue-800 mb-3">Our Location</h3>
                <p className="text-slate-600 font-serif text-base leading-relaxed">{contactInfo.address}</p>
              </div>

              {/* Phones Card */}
              <div className="bg-white p-8 border border-blue-50 shadow-md hover:shadow-xl transition-shadow rounded-sm flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <FaPhoneAlt className="text-2xl text-blue-800" />
                </div>
                <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-blue-800 mb-3">Phone Numbers</h3>
                <p className="text-slate-600 font-serif text-base">{contactInfo.landlineNumber}</p>
                {contactInfo.landlineNumber2 && <p className="text-slate-600 font-serif text-base mt-1">{contactInfo.landlineNumber2}</p>}
                <div className="w-10 h-px bg-slate-200 my-3"></div>
                <p className="text-slate-600 font-serif text-base">{contactInfo.mobileNumber}</p>
                {contactInfo.mobileNumber2 && <p className="text-slate-600 font-serif text-base mt-1">{contactInfo.mobileNumber2}</p>}
              </div>

              {/* Email & Hours Card */}
              <div className="bg-white p-8 border border-blue-50 shadow-md hover:shadow-xl transition-shadow rounded-sm flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <FaEnvelope className="text-2xl text-blue-800" />
                </div>
                <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-blue-800 mb-3">Email Address</h3>
                <p className="text-slate-600 font-serif text-sm break-all">{contactInfo.email}</p>
                
                <div className="w-full border-t border-slate-100 my-6"></div>
                
                <div className="flex flex-col items-center">
                  <FaClock className="text-xl text-blue-800 mb-2" />
                  <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-blue-800 mb-2">Opening Hours</h3>
                  <p className="text-slate-600 font-serif text-sm">{contactInfo.openingHours}</p>
                </div>
              </div>

              {/* Social Media Card */}
              <div className="bg-white p-8 border border-blue-50 shadow-md hover:shadow-xl transition-shadow rounded-sm flex flex-col items-center text-center justify-center">
                <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-blue-800 mb-6">Connect With Us</h3>
                
                {(contactInfo.facebookLink || contactInfo.instagramLink || contactInfo.tiktokLink) ? (
                  <div className="flex items-center gap-4">
                    {contactInfo.facebookLink && (
                      <a href={contactInfo.facebookLink} target="_blank" rel="noopener noreferrer" className="bg-blue-50 p-4 rounded-full text-blue-900 hover:bg-[#1877F2] hover:text-white transition-all transform hover:scale-110 shadow-sm">
                        <FaFacebookF className="text-2xl" />
                      </a>
                    )}
                    {contactInfo.instagramLink && (
                      <a href={contactInfo.instagramLink} target="_blank" rel="noopener noreferrer" className="bg-blue-50 p-4 rounded-full text-blue-900 hover:bg-[#E4405F] hover:text-white transition-all transform hover:scale-110 shadow-sm">
                        <FaInstagram className="text-2xl" />
                      </a>
                    )}
                    {contactInfo.tiktokLink && (
                      <a href={contactInfo.tiktokLink} target="_blank" rel="noopener noreferrer" className="bg-blue-50 p-4 rounded-full text-blue-900 hover:bg-black hover:text-white transition-all transform hover:scale-110 shadow-sm">
                        <FaTiktok className="text-2xl" />
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400 font-serif text-sm">No social media links available.</p>
                )}
              </div>

            </div>

            {/* ---------------- 🔹 GOOGLE MAPS 🔹 ---------------- */}
            <div className="bg-white p-2 border border-blue-100 shadow-xl rounded-sm h-[400px] w-full overflow-hidden mt-12">
              <iframe 
                src={contactInfo.googleMapsLink}
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Pinnawala Gems Location"
              ></iframe>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

export default Contact;