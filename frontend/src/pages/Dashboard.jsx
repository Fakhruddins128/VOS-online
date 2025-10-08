import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>Welcome to Your Dashboard</h1>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </header>

        <div className="user-welcome">
          <h2>Hello, {user.VendorName || user.ContactPerson}!</h2>
          <p>Welcome back to your VOS dashboard.</p>
        </div>

        <div className="dashboard-content">
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3>Profile Information</h3>
              <div className="user-info">
                <p><strong>Company Name:</strong>  {user.VendorName}</p>
                <p><strong>Business Email:</strong> {user.BusinessEmail}</p>
                <p><strong>Contact Person:</strong> {user.ContactPerson}</p>
              </div>
            </div>

            <div className="dashboard-card">
              <h3>Quick Actions</h3>
              <div className="quick-actions">
                {/* <button className="action-btn">Update Profile</button>
                <button className="action-btn">View Reports</button>
                <button className="action-btn">Settings</button> */}
                <p><strong>Comming Soon</strong>  </p>
              </div>
            </div>

            <div className="dashboard-card">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                <p>No recent activity to display.</p>
              </div>
            </div>

            {/* <div className="dashboard-card">
              <h3>System Status</h3>
              <div className="status-info">
                <div className="status-item">
                  <span className="status-indicator active"></span>
                  <span>Database: Connected</span>
                </div>
                <div className="status-item">
                  <span className="status-indicator active"></span>
                  <span>API: Online</span>
                </div>
                <div className="status-item">
                  <span className="status-indicator active"></span>
                  <span>Services: Running</span>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;