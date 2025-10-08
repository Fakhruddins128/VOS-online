import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { generalAPI } from '../services/api';
import './Home.css';

const Home = () => {
  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkDatabaseConnection();
  }, []);

  const checkDatabaseConnection = async () => {
    try {
      const response = await generalAPI.testConnection();
      setDbStatus(response);
    } catch (error) {
      setDbStatus({ success: false, message: 'Connection failed' });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      title: 'Database Integration',
      description: 'Full MSSQL Server integration with real-time data',
      icon: '🗄️',
      link: '#',
      color: '#dc2626'
    },
    {
      title: 'RESTful API',
      description: 'Complete REST API with Express.js backend',
      icon: '🔗',
      link: '#',
      color: '#7c3aed'
    }
  ];

  const stats = [
    { label: 'Frontend', value: 'React.js', icon: '⚛️' },
    { label: 'Backend', value: 'Node.js', icon: '🟢' },
    { label: 'Database', value: 'MSSQL', icon: '🗄️' },
    { label: 'Status', value: loading ? 'Checking...' : (dbStatus?.success ? 'Online' : 'Offline'), icon: loading ? '⏳' : (dbStatus?.success ? '✅' : '❌') }
  ];

  return (
    <div className="home dynamics-bg-canvas">
      <div className="dynamics-container">
        {/* Hero Section */}
        <section className="hero dynamics-p-8">
          <div className="hero-content">
            <h1 className="hero-title dynamics-text-4xl dynamics-font-bold dynamics-mb-4">
              Welcome to <span className="gradient-text dynamics-text-primary">VOS</span>
            </h1>
            <p className="hero-subtitle dynamics-text-lg dynamics-text-secondary dynamics-mb-6">
              Vendor Operations System - A modern full-stack application built with React, Node.js, and MSSQL Server
            </p>
            <div className="hero-actions dynamics-flex dynamics-gap-4 dynamics-mb-8">
              <Link to="/login" className="dynamics-btn dynamics-btn-primary">
                Get Started
              </Link>
              <button 
                onClick={checkDatabaseConnection}
                className="dynamics-btn dynamics-btn-secondary"
                disabled={loading}
              >
                {loading ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-card dynamics-card dynamics-shadow-lg">
              <div className="dynamics-card-header">
                <h3 className="dynamics-text-lg dynamics-font-semibold">System Status</h3>
              </div>
              <div className="dynamics-card-body">
                <div className="status-indicator dynamics-flex dynamics-items-center dynamics-gap-2">
                  <span className={`status-dot ${dbStatus?.success ? 'online' : 'offline'}`}></span>
                  <span className="status-text dynamics-text-sm">
                    {loading ? 'Checking connection...' : dbStatus?.message || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="stats dynamics-p-8 dynamics-bg-secondary">
          <div className="dynamics-text-center dynamics-mb-8">
            <h2 className="section-title dynamics-text-3xl dynamics-font-bold dynamics-mb-4">Technology Stack</h2>
          </div>
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card dynamics-card dynamics-shadow-card">
                <div className="dynamics-card-body dynamics-text-center">
                  <div className="stat-icon dynamics-text-3xl dynamics-mb-3">{stat.icon}</div>
                  <div className="stat-content">
                    <div className="stat-label dynamics-text-sm dynamics-text-secondary dynamics-mb-1">{stat.label}</div>
                    <div className="stat-value dynamics-text-lg dynamics-font-semibold">{stat.value}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="features dynamics-p-8">
          <div className="section-header dynamics-text-center dynamics-mb-8">
            <h2 className="section-title dynamics-text-3xl dynamics-font-bold dynamics-mb-4">Key Features</h2>
            <p className="section-subtitle dynamics-text-lg dynamics-text-secondary">
              Discover what makes VOS a powerful solution for vendor operations
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card dynamics-card dynamics-shadow-card">
                <div className="dynamics-card-body dynamics-text-center">
                  <div className="feature-icon dynamics-text-4xl dynamics-mb-4" style={{ color: feature.color }}>
                    {feature.icon}
                  </div>
                  <h3 className="feature-title dynamics-text-xl dynamics-font-semibold dynamics-mb-3">{feature.title}</h3>
                  <p className="feature-description dynamics-text-secondary dynamics-mb-4">{feature.description}</p>
                  {feature.link !== '#' && (
                    <Link to={feature.link} className="feature-link dynamics-btn dynamics-btn-outline">
                      Learn More →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Database Status */}
        <section className="db-status">
          <div className="status-card">
            <h3 className="status-title">Database Connection</h3>
            {loading ? (
              <div className="status-loading">
                <div className="spinner"></div>
                <span>Checking connection...</span>
              </div>
            ) : (
              <div className={`status-indicator ${dbStatus?.success ? 'success' : 'error'}`}>
                <div className="status-icon">
                  {dbStatus?.success ? '✅' : '❌'}
                </div>
                <div className="status-text">
                  <div className="status-message">{dbStatus?.message}</div>
                  <button 
                    className="status-refresh" 
                    onClick={checkDatabaseConnection}
                    disabled={loading}
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;