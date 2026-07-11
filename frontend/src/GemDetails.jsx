import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaWhatsapp, FaChevronLeft, FaChevronRight } from 'react-icons/fa'; // 🔹 Arrows අලුතින් ගත්තා
import { MdEmail, MdVerified } from 'react-icons/md';

function GemDetails() {
  const { stoneId } = useParams();
  const [gem, setGem] = useState(null);
  
  const [contactInfo, setContactInfo] = useState({
    whatsappNumber: '94776599740', 
    inquiryEmail: 'paramividarshanamuthumali@gmail.com'
  });
  
  const [loading, setLoading] = useState(true);

  // 🔹 පින්තූර මාරු කරන්න හදපු State එක
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  useEffect(() => {
    fetch(`https://pinnawalagems.onrender.com/api/inventory/stones/${stoneId}`)
      .then(res => {
        if (!res.ok) throw new Error("Stone not found");
        return res.json();
      })
      .then(data => {
        setGem(data);
        setLoading(false);
      })
      .catch(err => {
        console.log("Error fetching gem details:", err);
        setLoading(false);
      });

    fetch('https://pinnawalagems.onrender.com/api/home')
      .then(res => res.json())
      .then(data => {
        if(data && data.whatsappNumber && data.inquiryEmail) {
          setContactInfo({ whatsappNumber: data.whatsappNumber, inquiryEmail: data.inquiryEmail });
        }
      })
      .catch(err => console.log("Error fetching contact details:", err));
  }, [stoneId]);

  const handleWhatsAppInquiry = () => {
    const message = `Hello Pinnawala Gems, I'm interested in the ${gem.title} (Reference ID: ${gem.stoneId}). Could you provide more details?`;
    const whatsappUrl = `https://wa.me/${contactInfo.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEmailInquiry = () => {
    const subject = `Inquiry regarding ${gem.title}`;
    const body = `Hello,\n\nI am interested in the ${gem.title} (Reference ID: ${gem.stoneId}) from your collection. Please send me more information.\n\nThank you.`;
    window.location.href = `mailto:${contactInfo.inquiryEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-blue-950 font-serif text-2xl tracking-widest uppercase animate-pulse">Loading Details...</p>
      </div>
    );
  }

  if (!gem) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-blue-950">
        <h2 className="text-3xl font-serif mb-4">Gemstone Not Found</h2>
        <Link to="/catalog" className="text-sm font-bold tracking-widest uppercase hover:text-blue-600 border-b border-blue-950 pb-1">Return to Collection</Link>
      </div>
    );
  }

  // 🔹 Main image එකයි additional images ටිකයි එකතු කරලා එක Array එකක් හදාගන්නවා
  const allImages = [gem.image, ...(gem.additionalImages || [])].filter(Boolean);

  // 🔹 පින්තූර ඊළඟ එකට හා කලින් එකට මාරු කරන Functions
  const nextImage = () => {
    setCurrentImgIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    setCurrentImgIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-blue-950">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md p-6 flex justify-between items-center px-6 md:px-12 border-b border-blue-100 shadow-sm sticky top-0 z-50">
        <div>
          <h1 className="text-xl md:text-2xl font-serif tracking-[0.2em] uppercase font-bold">Pinnawala Gems</h1>
        </div>
        <Link to="/catalog" className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase bg-slate-100 text-blue-950 px-5 py-2 border border-blue-200 hover:bg-blue-950 hover:text-white transition-all shadow-sm">
          Back to Catalog
        </Link>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="bg-white border border-blue-100 shadow-2xl rounded-sm overflow-hidden flex flex-col lg:flex-row">
          
          {/* 🔹 Image Container with Slider 🔹 */}
          <div className="w-full lg:w-1/2 bg-slate-100 relative p-8 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-blue-50 group">
            
            <img
              src={allImages[currentImgIndex] || "https://via.placeholder.com/600x600?text=No+Image"}
              alt={`${gem.title} - View ${currentImgIndex + 1}`}
              className="w-full max-h-[600px] object-contain drop-shadow-2xl transition-transform duration-700 ease-in-out"
            />

            {/* පින්තූර 1 කට වඩා තියෙනවා නම් විතරක් Arrows පෙන්නනවා */}
            {allImages.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-blue-950 p-4 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110"
                >
                  <FaChevronLeft className="text-xl" />
                </button>

                <button 
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-blue-950 p-4 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110"
                >
                  <FaChevronRight className="text-xl" />
                </button>

                {/* Dots Indicators */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {allImages.map((_, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setCurrentImgIndex(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${currentImgIndex === idx ? 'w-6 bg-blue-950' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          
          <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col bg-white">
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-blue-950 mb-4 leading-tight tracking-wide uppercase">
                {gem.title}
              </h1>
              <div className="flex items-center gap-2 mb-6">
                <span className="w-8 h-px bg-blue-300"></span>
                <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Reference ID: {gem.stoneId}</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-slate-600 text-base leading-relaxed font-light">{gem.description}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8 border-t border-b border-slate-100 py-6 mb-8">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Weight</span>
                <span className="text-lg font-bold text-blue-950">{gem.weight} ct</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Shape</span>
                <span className="text-lg font-bold text-blue-950 uppercase">{gem.shape}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Color</span>
                <span className="text-lg font-bold text-blue-950 uppercase">{gem.color}</span>
              </div>
              
              {/* 🔹 Origin එක මෙතන පෙන්නනවා (තියෙනවා නම් විතරක්) */}
              {gem.origin && (
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Origin</span>
                  <span className="text-lg font-bold text-blue-950 uppercase">{gem.origin}</span>
                </div>
              )}

              {gem.price && (
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 block mb-1">Price</span>
                  <span className="text-lg font-bold text-green-700">Rs. {gem.price}</span>
                </div>
              )}
            </div>

            {gem.hasCertificate && (
              <div className="mb-10 bg-blue-50/50 border border-blue-100 p-6 rounded-sm">
                <div className="flex items-center gap-2 text-blue-900 font-bold tracking-widest uppercase mb-4 text-sm">
                  <MdVerified className="text-xl text-green-600" /> 
                  Certified Gemstone
                </div>
                
                {gem.certificateDetails && (
                  <p className="text-sm font-bold text-slate-700 mb-4">Cert No: <span className="text-blue-950">{gem.certificateDetails}</span></p>
                )}
                
                {gem.certificateImage && (
                  <div className="mt-4 border border-slate-200 p-2 bg-white inline-block">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2 text-center">Certificate Preview</p>
                    <a href={gem.certificateImage} target="_blank" rel="noopener noreferrer">
                      <img src={gem.certificateImage} alt="Certificate" className="h-32 object-contain cursor-pointer hover:opacity-80 transition-opacity" />
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-4 mt-auto pt-6 border-t border-slate-100">
              <button 
                onClick={handleWhatsAppInquiry}
                className="w-full bg-[#25D366] text-white font-bold py-4 tracking-[0.15em] uppercase hover:bg-[#1ebe57] transition-colors shadow-lg flex items-center justify-center gap-3"
              >
                <FaWhatsapp className="text-2xl" /> Inquire via WhatsApp
              </button>
              
              <button 
                onClick={handleEmailInquiry}
                className="w-full bg-blue-950 text-white font-bold py-4 tracking-[0.15em] uppercase hover:bg-blue-800 transition-colors shadow-md flex items-center justify-center gap-3"
              >
                <MdEmail className="text-2xl" /> Inquire via Email
              </button>
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}

export default GemDetails;