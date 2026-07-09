import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        navigate('/');
      } else {
        alert("Invalid Username or Password!");
      }
    } catch (err) {
      console.error("Login Error:", err);
      alert("Server error, please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-blue-100">
        <h2 className="text-3xl font-bold text-primary mb-8 text-center">Admin Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="text" 
            placeholder="Username" 
            onChange={(e) => setUsername(e.target.value)} 
            className="w-full border-2 p-3 rounded-lg focus:outline-none focus:border-primary" 
          />
          <input 
            type="password" 
            placeholder="Password" 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full border-2 p-3 rounded-lg focus:outline-none focus:border-primary" 
          />
          <button type="submit" className="w-full bg-primary text-secondary py-3 rounded-lg font-bold hover:bg-blue-900 transition">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;