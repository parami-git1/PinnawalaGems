import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import GemDetails from './GemDetails.jsx'
import Login from './Login.jsx'
import Home from './Home.jsx' 
import Workshop from './Workshop.jsx'
import Feedback from './Feedback.jsx' 
import './index.css'
import Contact from './Contact.jsx'
import CategoryView from './CategoryView.jsx'
import AdminInventory from './AdminInventory.jsx'; // උඩින් දාන්න

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/admin-login" element={<Login />} />
        <Route path="/" element={<Home />} /> 
        <Route path="/catalog" element={<App />} /> 
        <Route path="/workshop" element={<Workshop />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/category/:categoryId" element={<CategoryView />} />
        <Route path="/admin/inventory" element={<AdminInventory />} />
        
        {/* 🔹 GemDetails එකට තියෙන්න ඕනේ මේ එක Route එක විතරයි */}
        <Route path="/gem/:stoneId" element={<GemDetails />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)