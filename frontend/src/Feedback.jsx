import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [formData, setFormData] = useState({ name: '', review: '', rating: 5 });
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
          <Link to="/feedback" className="text-[10px] md:text-xs font-bold tracking-[0.15em] text-blue-600 transition-colors uppercase">Feedback</Link>
          <Link to="/contact" className="text-[10px] md:text-xs font-bold tracking-[0.15em] hover:text-blue-600 transition-colors uppercase">Contact</Link>
        </div>
      </nav>

      {/* pt-48 added to push content below the new taller navbar */}
      <main className="max-w-6xl mx-auto pt-48 pb-24 px-6 md:px-12">
        
        <div className="text-center mb-16">
          <h2 className="text-xs md:text-sm text-blue-800 tracking-[0.4em] uppercase mb-4 font-bold">Client Testimonials</h2>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-blue-950 mb-6 tracking-wide">What Our Clients Say</h1>
          <div className="w-16 h-1 bg-blue-300 mx-auto mb-8"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          <div className="bg-white p-8 border border-blue-100 shadow-xl rounded-sm lg:col-span-1">
            <h2 className="text-xl font-serif text-blue-950 mb-6 tracking-wide font-bold uppercase">Share Your Thoughts</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Your Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-slate-50 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950 text-sm" />
              </div>
              <div>
                <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Rating</label>
                <select name="rating" value={formData.rating} onChange={handleChange} className="w-full bg-slate-50 text-blue-950 border border-blue-200 p-3 mt-2 focus:outline-none focus:border-blue-950 text-sm">
                  <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                  <option value="4">⭐⭐⭐⭐ (4/5)</option>
                  <option value="3">⭐⭐⭐ (3/5)</option>
                  <option value="2">⭐⭐ (2/5)</option>
                  <option value="1">⭐ (1/5)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-blue-800 uppercase tracking-[0.2em] font-semibold">Your Thoughts</label>
                <textarea name="review" value={formData.review} onChange={handleChange} required className="w-full bg-slate-50 border border-blue-200 p-3 mt-2 h-32 focus:outline-none focus:border-blue-950 text-sm"></textarea>
              </div>
              <button type="submit" className="w-full bg-blue-950 text-white font-bold py-4 tracking-[0.2em] uppercase hover:bg-blue-900 transition-colors shadow-lg text-xs">
                Submit Feedback
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayFeedbacks.length === 0 ? (
              <p className="text-slate-500 font-serif text-lg tracking-widest col-span-full text-center py-10">
                {isAdmin ? "No reviews in the system yet." : "No reviews shared yet. Be the first to share your experience!"}
              </p>
            ) : (
              displayFeedbacks.map((fb) => (
                <div key={fb._id} className={`bg-white p-6 border ${fb.isApproved ? 'border-blue-50' : 'border-amber-400 bg-amber-50/30'} shadow-md rounded-sm flex flex-col justify-between hover:shadow-lg transition-shadow relative`}>
                  
                  {isAdmin && !fb.isApproved && (
                    <span className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm border border-amber-200">
                      Pending Approval
                    </span>
                  )}

                  <div>
                    <div className="text-amber-500 mb-3 text-sm">
                      {"★".repeat(fb.rating)}{"☆".repeat(5 - fb.rating)}
                    </div>
                    <p className="text-slate-600 text-sm font-light italic leading-relaxed mt-4">
                      "{fb.review}"
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-4 mt-6 flex justify-between items-center">
                    <h4 className="font-serif font-bold text-blue-950 text-sm tracking-wide">{fb.name}</h4>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {isAdmin && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                      {!fb.isApproved && (
                        <button 
                          onClick={() => handleApprove(fb._id)}
                          className="flex-1 bg-green-500 text-white text-[10px] uppercase font-bold tracking-widest py-2 rounded-sm hover:bg-green-600 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(fb._id)}
                        className="flex-1 bg-red-500 text-white text-[10px] uppercase font-bold tracking-widest py-2 rounded-sm hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}

                </div>
              ))
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default Feedback;