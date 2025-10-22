import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';

const passwordPolicy = {
  minLength: 8,
  regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/,
  message:
    'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
};

const ChangePassword = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [validations, setValidations] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
    different: false,
    match: false
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const updateValidation = (oldPwd, newPwd, confirmPwd) => {
    setValidations({
      length: newPwd.length >= passwordPolicy.minLength,
      upper: /[A-Z]/.test(newPwd),
      lower: /[a-z]/.test(newPwd),
      number: /\d/.test(newPwd),
      special: /[@$!%*?&]/.test(newPwd),
      different: newPwd && oldPwd && newPwd !== oldPwd,
      match: newPwd && confirmPwd && newPwd === confirmPwd
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    updateValidation(updated.oldPassword, updated.newPassword, updated.confirmPassword);
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Client-side validations
    if (!passwordPolicy.regex.test(formData.newPassword)) {
      return setError(passwordPolicy.message);
    }
    if (formData.newPassword === formData.oldPassword) {
      return setError('New password must be different from old password.');
    }
    if (formData.newPassword !== formData.confirmPassword) {
      return setError('New password and confirm password do not match.');
    }

    try {
      setLoading(true);
      const payload = {
        BusinessEmail: user?.BusinessEmail,
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword
      };

      const response = await userAPI.changePassword(payload);
      if (response?.success) {
        setMessage('Password changed successfully.');
        setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError(response?.error || 'Failed to change password');
      }
    } catch (err) {
      setError(err?.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dynamics-container" style={{ padding: '1rem' }}>
      <div className="dynamics-card dynamics-shadow-lg" style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="dynamics-card-header">
          <h2 className="dynamics-text-xl dynamics-font-semibold">Change Password</h2>
          <p className="dynamics-text-secondary">Update your account password securely</p>
        </div>

        <div className="dynamics-card-body">
          <form onSubmit={handleSubmit} className="dynamics-form">
            <div className="dynamics-form-group">
              <label htmlFor="oldPassword" className="dynamics-label">Current Password</label>
              <input
                type="password"
                id="oldPassword"
                name="oldPassword"
                value={formData.oldPassword}
                onChange={handleChange}
                required
                className="dynamics-input"
                placeholder="Enter current password"
              />
            </div>

            <div className="dynamics-form-group">
              <label htmlFor="newPassword" className="dynamics-label">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
                className="dynamics-input"
                placeholder="Enter new password"
              />
              <div className="dynamics-text-xs dynamics-mt-2">
                <p>Password requirements:</p>
                <ul className="dynamics-list dynamics-mt-1">
                  <li style={{ color: validations.length ? 'green' : 'inherit' }}>At least 8 characters</li>
                  <li style={{ color: validations.upper ? 'green' : 'inherit' }}>Contains uppercase letter</li>
                  <li style={{ color: validations.lower ? 'green' : 'inherit' }}>Contains lowercase letter</li>
                  <li style={{ color: validations.number ? 'green' : 'inherit' }}>Contains number</li>
                  <li style={{ color: validations.special ? 'green' : 'inherit' }}>Contains special character (@$!%*?&)</li>
                  <li style={{ color: validations.different ? 'green' : 'inherit' }}>Different from current password</li>
                </ul>
              </div>
            </div>

            <div className="dynamics-form-group">
              <label htmlFor="confirmPassword" className="dynamics-label">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="dynamics-input"
                placeholder="Re-enter new password"
              />
              <p className="dynamics-text-xs dynamics-mt-1" style={{ color: validations.match ? 'green' : 'inherit' }}>
                {validations.match ? 'Passwords match' : 'Passwords must match'}
              </p>
            </div>

            <button
              type="submit"
              className="dynamics-btn dynamics-btn-primary"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Updating...' : 'Change Password'}
            </button>
          </form>

          {error && (
            <div className="dynamics-bg-error dynamics-text-inverse dynamics-rounded-md dynamics-p-3 dynamics-mt-4">
              {error}
            </div>
          )}
          {message && (
            <div className="dynamics-bg-success dynamics-text-inverse dynamics-rounded-md dynamics-p-3 dynamics-mt-4">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;