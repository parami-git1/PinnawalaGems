import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaPhoneAlt, FaMobileAlt, FaEnvelope, FaClock } from 'react-icons/fa';

function Contact() {
  const [contactInfo, setContactInfo] = useState({
    address: '',
    landlineNumber: '',
    mobileNumber: '',
    email: '',
    openingHours: '',
    contactImage: '',
    googleMapsLink: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const isAdmin = !!localStorage.getItem('token');

  useEffect(() => {
    fetch('https://pinnawalagems.onrender.com/api/contact')
      .then(res => res.json())
      .then(data => {
        if(data) setContactInfo(data);
      })
      .catch(err => console.log("Error fetching contact info:", err));
  }, []);

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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-blue-950">
      
      {/* 🔹 New Centered Navigation Bar */}
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
          <Link to="/contact" className="text-[10px] md:text-xs font-bold tracking-[0.15em] text-blue-600 transition-colors uppercase">Contact</Link>
          
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

      {/* pt-48 added to push content below the new taller navbar */}
      <main className="max-w-6xl mx-auto pt-48 pb-24 px-6 md:px-12">
        
        <div className="text-center mb-12">
          <h2 className="text-xs md:text-sm text-blue-800 tracking-[0.4em] uppercase mb-4 font-bold">Get In Touch</h2>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-blue-950 mb-6 tracking-wide">Contact Us</h1>
          <div className="w-16 h-1 bg-blue-300 mx-auto mb-8"></div>
        </div>

        {isEditing ? (
          <div className="bg-white p-8 md:p-12 w-full border border-blue-100 shadow-xl rounded-sm mb-16">
            <h2 className="text-2xl font-serif text-blue-950 mb-8 text-center tracking-widest uppercase font-bold">Edit Contact Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Address</label>
                <input type="text" name="address" value={contactInfo.address} onChange={handleChange} className="w-full bg-slate-50 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950" />
              </div>
              <div>
                <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Email</label>
                <input type="text" name="email" value={contactInfo.email} onChange={handleChange} className="w-full bg-slate-50 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950" />
              </div>
              <div>
                <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Landline Number</label>
                <input type="text" name="landlineNumber" value={contactInfo.landlineNumber} onChange={handleChange} className="w-full bg-slate-50 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950" />
              </div>
              <div>
                <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Mobile Number</label>
                <input type="text" name="mobileNumber" value={contactInfo.mobileNumber} onChange={handleChange} className="w-full bg-slate-50 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950" />
              </div>
              <div>
                <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Opening Hours</label>
                <input type="text" name="openingHours" value={contactInfo.openingHours} onChange={handleChange} className="w-full bg-slate-50 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950" />
              </div>
              <div>
                <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Contact Page Image URL</label>
                <input type="text" name="contactImage" value={contactInfo.contactImage} onChange={handleChange} className="w-full bg-slate-50 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Google Maps Embed Link</label>
                <input type="text" name="googleMapsLink" value={contactInfo.googleMapsLink} onChange={handleChange} className="w-full bg-slate-50 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950" />
              </div>
            </div>
            <button onClick={handleSave} className="w-full bg-blue-950 text-white font-bold py-4 mt-8 tracking-[0.2em] uppercase hover:bg-blue-900 transition-colors shadow-lg">
              Save Changes
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
              
              <div className="overflow-hidden rounded-sm shadow-xl border border-blue-100">
                <img 
                  src={contactInfo.contactImage || "https://images.unsplash.com/photo-1582647617478-f79a95782782?auto=format&fit=crop&q=80&w=800"} 
                  alt="Contact Us" 
                  className="w-full h-full object-cover min-h-[400px]"
                />
              </div>

              <div className="bg-white p-10 border border-blue-100 shadow-xl rounded-sm flex flex-col justify-center space-y-8">
                
                <div className="flex items-start gap-5">
                  <FaMapMarkerAlt className="text-2xl text-blue-800 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-blue-800 mb-2">Our Location</h3>
                    <p className="text-slate-600 font-serif text-lg leading-relaxed">{contactInfo.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <FaPhoneAlt className="text-2xl text-blue-800 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-blue-800 mb-2">Landline Number</h3>
                    <p className="text-slate-600 font-serif text-lg">{contactInfo.landlineNumber}</p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <FaMobileAlt className="text-2xl text-blue-800 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-blue-800 mb-2">Mobile Number</h3>
                    <p className="text-slate-600 font-serif text-lg">{contactInfo.mobileNumber}</p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <FaEnvelope className="text-2xl text-blue-800 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-blue-800 mb-2">Email Address</h3>
                    <p className="text-slate-600 font-serif text-lg break-all">{contactInfo.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-5 border-t border-slate-100 pt-6 mt-4">
                  <FaClock className="text-2xl text-blue-800 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-blue-800 mb-2">Opening Hours</h3>
                    <p className="text-slate-600 font-serif text-lg">{contactInfo.openingHours}</p>
                  </div>
                </div>

              </div>
            </div>

            <div className="bg-white p-2 border border-blue-100 shadow-xl rounded-sm h-[450px] w-full overflow-hidden">
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