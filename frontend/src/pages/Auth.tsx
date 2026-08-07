import React, { useState } from 'react';
import { useStore } from '../store/useStore';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const login = useStore((state) => state.login);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    age: '',
    gender: '',
    location: ''
  });

  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const endpoint = isLogin ? 'http://127.0.0.1:8000/login' : 'http://127.0.0.1:8000/signup';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : { 
            username: formData.username || formData.email.split('@')[0], 
            email: formData.email, 
            password: formData.password,
            age: formData.age,
            gender: formData.gender,
            location: formData.location
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      // Successful login/signup
      localStorage.setItem('token', data.access_token);
      
      // Initialize the store
      await login(data.access_token, {
        username: data.username,
        email: formData.email,
        age: formData.age,
        gender: formData.gender,
        location: formData.location
      });
      
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden font-sans">
      {/* Abstract chart background lines */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,800 Q400,600 600,700 T1200,400 T1920,200" fill="none" stroke="#2563eb" strokeWidth="2" />
          <path d="M0,900 Q300,700 800,800 T1500,500 T1920,400" fill="none" stroke="#9ca3af" strokeWidth="1" />
        </svg>
      </div>

      <div className="flex w-full max-w-7xl mx-auto items-center p-8 z-10">
        {/* Left side text */}
        <div className="flex-1 pr-12 hidden md:block">
          <h1 className="text-6xl font-extrabold text-white leading-tight mb-4 tracking-tight">
            Welcome<br/>Back
          </h1>
          <p className="text-gray-300 text-lg max-w-md leading-relaxed">
            The future of finance, at your fingertips. Elevate every trade with our suite of professional tools.
          </p>
        </div>

        {/* Right side form */}
        <div className="w-full max-w-md bg-[#0d111a]/80 backdrop-blur-md border border-gray-800 rounded-xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">
            {isLogin ? 'Sign in' : 'Create Account'}
          </h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
                <input type="text" name="username" required onChange={handleChange} placeholder="Enter your username" className="w-full bg-[#161b26] border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-accent transition-colors" />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                {isLogin ? 'Email' : 'Email'}
              </label>
              <input type="email" name="email" required onChange={handleChange} placeholder="Enter your email" className="w-full bg-[#161b26] border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-accent transition-colors" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <input type="password" name="password" required onChange={handleChange} placeholder="••••••••" className="w-full bg-[#161b26] border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-accent transition-colors" />
            </div>

            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Age</label>
                    <input type="number" name="age" onChange={handleChange} className="w-full bg-[#161b26] border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-accent transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Gender</label>
                    <select name="gender" onChange={handleChange} className="w-full bg-[#161b26] border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-accent transition-colors">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Location</label>
                  <input type="text" name="location" onChange={handleChange} className="w-full bg-[#161b26] border border-gray-700 rounded-md p-3 text-white focus:outline-none focus:border-accent transition-colors" />
                </div>
              </>
            )}

            <button type="submit" className="w-full bg-orangeBtn hover:bg-orange-700 text-white font-bold py-3.5 rounded-md mt-4 transition-colors shadow-lg uppercase text-sm tracking-wider">
              {isLogin ? 'SIGN IN NOW' : 'CREATE ACCOUNT NOW'}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-800 pt-6">
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="w-full bg-transparent border border-gray-700 hover:border-gray-500 text-gray-300 font-medium py-3 rounded-md transition-colors text-sm"
            >
              {isLogin ? 'Create new account' : 'Back to Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>

  );
};

export default Auth;
