import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    BusinessEmail: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Login successful!');
        login(data.data);
        setFormData({ BusinessEmail: '', password: '' });
        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } else {
        setMessage(data.error || 'Login failed');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setMessage('');
    navigate('/login');
  };

  return (
    <div className="login-container dynamics-bg-canvas dynamics-flex dynamics-items-center dynamics-justify-center">
      <div className="login-card dynamics-card dynamics-shadow-xl">
        <div className="dynamics-card-header dynamics-text-center">
          <h2 className="dynamics-text-2xl dynamics-font-bold dynamics-mb-2">Welcome Back</h2>
          <p className="dynamics-text-secondary">Sign in to your VOS account</p>
        </div>
        
        <div className="dynamics-card-body">
          <form onSubmit={handleSubmit} className="login-form">
            <div className="dynamics-form-group">
              <label htmlFor="BusinessEmail" className="dynamics-label">Business Email</label>
              <input
                type="email"
                id="BusinessEmail"
                name="BusinessEmail"
                value={formData.BusinessEmail}
                onChange={handleChange}
                required
                placeholder="Enter your business email"
                className="dynamics-input"
              />
            </div>
            
            <div className="dynamics-form-group">
              <label htmlFor="password" className="dynamics-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                className="dynamics-input"
              />
            </div>
            
            <button 
              type="submit" 
              className="dynamics-btn dynamics-btn-primary"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
        
        {message && (
          <div className={`message dynamics-p-4 dynamics-rounded-md dynamics-mb-4 ${
            message.includes('successful') ? 'dynamics-bg-success dynamics-text-inverse' : 'dynamics-bg-error dynamics-text-inverse'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;