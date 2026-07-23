import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [formData, setFormData] = useState({ name: '', review: '', rating: 5 });
  const [hoverRating, setHoverRating] = useState(0);
  const isAdmin = !!localStorage.getItem('token');

  const fetchFeedbacks = () => {
    fetch('https://pinnawalagems.onrender.com/api/feedback')
      .then(res => res.json())
      .then(data => setFeedbacks(data))
      .catch(err => console.log("Error fetching feedback:", err));
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://pinnawalagems.onrender.com/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if(response.ok) {
        alert("Thank you for your valuable feedback! ✨\nYour review has been submitted and will be published once approved by our team.");
        setFormData({ name: '', review: '', rating: 5 });
        fetchFeedbacks(); 
      }
    } catch (error) {
      console.log("Error submitting feedback:", error);
    }
  };

  const handleApprove = async (id) => {
    try {
      const response = await fetch(`https://pinnawalagems.onrender.com/api/feedback/${id}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if(response.ok) {
        fetchFeedbacks();
      }
    } catch (error) {
      console.log("Error approving feedback:", error);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this review?");
    if (isConfirmed) {
      try {
        const response = await fetch(`https://pinnawalagems.onrender.com/api/feedback/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if(response.ok) {
          fetchFeedbacks();
        }
      } catch (error) {
        console.log("Error deleting feedback:", error);
      }
    }
  };

  const displayFeedbacks = isAdmin ? feedbacks : feedbacks.filter(fb => fb.isApproved);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-blue-950 flex flex-col">
      
      {/* ---------------- NAVIGATION BAR ---------------- */}
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md text-blue-950 py-4 px-6 border-b border-blue-100 shadow-sm flex flex-col items-center">
        <div className="flex flex-col items-center mb-4">
          <img 
            src="/image_27d308.png" 
            alt="Pinnawala Gems Logo" 
            className="h-14 md:h-16 w-auto object-contain mb-2" 
          />
          <h1 className="text-lg md:text-xl font-serif tracking-[0.2em] uppercase font-bold text-center">
            Pinnawala Gems
          </h1>
        </div>
        <div className="flex gap-6 md:gap-10 items-center flex-wrap justify-center">
          <Link to="/" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Home</Link>
          <Link to="/catalog" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Collection</Link>
          <Link to="/workshop" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Workshop</Link>
          <Link to="/feedback" className="text-[10px] md:text-xs font-bold tracking-[0.15em] text-blue-600 transition-colors uppercase">Feedback</Link>
          <Link to="/contact" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Contact</Link>
        </div>
      </nav>

      {/* ---------------- MAIN CONTENT ---------------- */}
      <main className="flex-1 max-w-7xl mx-auto pt-44 pb-24 px-6 md:px-12 w-full">
        
        <div className="text-center mb-12">
          <h2 className="text-xs text-blue-600 font-bold tracking-[0.3em] uppercase mb-2">Testimonials</h2>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-blue-950">What Our Clients Say</h1>
          <div className="w-16 h-1 bg-blue-300 mx-auto mt-4"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Share Your Thoughts Form */}
          <div className="lg:col-span-5 bg-white p-8 rounded-xl shadow-md border border-slate-200">
            <h2 className="text-xl font-serif font-bold text-blue-950 mb-6 uppercase tracking-wider">Share Your Thoughts</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-2">Your Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                  placeholder="Enter your name"
                  className="w-full bg-slate-50 border border-slate-200 p-3 text-xs rounded-sm focus:outline-none focus:border-blue-950" 
                />
              </div>

              {/* 🔹 INTERACTIVE CLICKABLE STARS RATING 🔹 */}
              <div>
                <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-2">Rating</label>
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-3 rounded-sm">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-2xl cursor-pointer transition-colors ${
                        (hoverRating || formData.rating) >= star ? 'text-amber-400' : 'text-slate-300'
                      }`}
                      onClick={() => setFormData({ ...formData, rating: star })}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      ★
                    </span>
                  ))}
                  <span className="ml-3 text-xs font-bold text-slate-600">({formData.rating}/5)</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-2">Your Thoughts</label>
                <textarea 
                  name="review" 
                  value={formData.review} 
                  onChange={handleChange} 
                  required 
                  placeholder="Write your review here..." 
                  rows="4" 
                  className="w-full bg-slate-50 border border-slate-200 p-3 text-xs rounded-sm focus:outline-none focus:border-blue-950"
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-950 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-sm hover:bg-blue-900 transition-colors shadow-lg"
              >
                Submit Feedback
              </button>
            </form>
          </div>

          {/* Reviews List Section */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-xl font-serif font-bold text-blue-950 mb-6 uppercase tracking-wider">Client Reviews</h2>

            {displayFeedbacks.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 text-sm font-semibold">
                  {isAdmin ? "No reviews in the system yet." : "No reviews shared yet. Be the first to share your experience!"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
                {displayFeedbacks.map((fb) => (
                  <div key={fb._id} className={`bg-white p-6 rounded-xl shadow-sm border ${fb.isApproved ? 'border-slate-200' : 'border-amber-400 bg-amber-50/20'} relative group hover:shadow-md transition-shadow flex flex-col justify-between`}>
                    
                    {isAdmin && !fb.isApproved && (
                      <span className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm border border-amber-200">
                        Pending
                      </span>
                    )}

                    <div>
                      <div className="flex items-center gap-1 text-amber-400 text-sm mb-3">
                        {"★".repeat(fb.rating)}{"☆".repeat(5 - fb.rating)}
                        <span className="text-slate-400 text-[10px] ml-1">({fb.rating}/5)</span>
                      </div>
                      <p className="text-slate-600 text-xs font-light italic leading-relaxed">
                        "{fb.review}"
                      </p>
                    </div>

                    <div className="border-t border-slate-100 pt-4 mt-5 flex justify-between items-center">
                      <h4 className="font-serif font-bold text-blue-950 text-xs tracking-wide uppercase">{fb.name}</h4>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {isAdmin && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                        {!fb.isApproved && (
                          <button 
                            onClick={() => handleApprove(fb._id)}
                            className="flex-1 bg-green-600 text-white text-[10px] uppercase font-bold tracking-widest py-2 rounded-sm hover:bg-green-700 transition-colors shadow-sm"
                          >
                            Approve
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(fb._id)}
                          className="flex-1 bg-red-600 text-white text-[10px] uppercase font-bold tracking-widest py-2 rounded-sm hover:bg-red-700 transition-colors shadow-sm"
                        >
                          Delete
                        </button>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default Feedback;