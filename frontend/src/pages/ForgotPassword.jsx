import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../components/Login.css'; // Reusing Login styles

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/users/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ BusinessEmail: email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSuccess(true);
        if (data.dev) {
          setMessage(data.message || 'New password generated. Check server logs for the password.');
        } else {
          setMessage(data.message || 'New password sent to your email.');
        }
        // Optional: Redirect after a delay
        // setTimeout(() => navigate('/login'), 5000);
      } else {
        setMessage(data.error || 'Failed to reset password.');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      console.error('Forgot password error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container dynamics-bg-canvas dynamics-flex dynamics-items-center dynamics-justify-center">
      <div className="login-card dynamics-card dynamics-shadow-xl">
        <div className="dynamics-card-header dynamics-text-center">
          <h2 className="dynamics-text-2xl dynamics-font-bold dynamics-mb-2">Forgot Password</h2>
          <p className="dynamics-text-secondary">Enter your email to receive a new password</p>
        </div>
        
        <div className="dynamics-card-body">
          {message && (
            <div
              className={`message ${isSuccess ? 'success' : 'error'} dynamics-p-4 dynamics-rounded-md dynamics-mb-4 ${isSuccess ? 'dynamics-bg-success dynamics-text-inverse' : 'dynamics-bg-error dynamics-text-inverse'}`}
              role="alert"
            >
              {message}
            </div>
          )}
          
          {!isSuccess && (
            <form onSubmit={handleSubmit} className="login-form">
              <div className="dynamics-form-group">
                <label htmlFor="email" className="dynamics-label">Business Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="dynamics-input dynamics-w-full"
                  required
                  placeholder="Enter your registered email"
                />
              </div>

              <button 
                type="submit" 
                className="dynamics-btn dynamics-btn-primary dynamics-w-full dynamics-mt-4"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="dynamics-text-center dynamics-mt-4">
            <Link to="/login" className="dynamics-text-primary hover:dynamics-underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
