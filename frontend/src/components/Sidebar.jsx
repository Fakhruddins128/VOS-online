import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import jafferjeesLogo from '../assets/jafferjees-text.png';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();

  const menuItems = [
    // {
    //   id: 'home',
    //   label: 'Home',
    //   path: '/',
    //   icon: '🏠'
    // },
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: '📊'
    },
    {
      id: 'pending-orders',
      label: 'Pending Orders',
      path: '/pending-orders',
      icon: '📋'
    },
    {
      id: 'purchase-order-draft',
      label: 'Purchase Order Draft',
      path: '/purchase-order-draft',
      icon: '📝'
    },
   // {
   //   id: 'login',
   //   label: 'Login',
   //   path: '/login',
    //  icon: '🔐'
  //  }
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={toggleSidebar}
        />
      )}
      
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-icon"><img src={jafferjeesLogo} alt="Jafferjees Text" width="200px"  /></span>
            {/* <span className="brand-text">JPL</span> */}
          </div>
          <button 
            className="sidebar-close"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <ul className="nav-menu">
            {menuItems.map((item) => (
              <li key={item.id} className="nav-item">
                <Link
                  to={item.path}
                  className={`nav-link ${
                    location.pathname === item.path ? 'active' : ''
                  }`}
                  onClick={toggleSidebar}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          {/* <div className="user-info">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <div className="user-name">User</div>
              <div className="user-role">Administrator</div>
            </div>
          </div> */}
          <p>Jafferjees Private Limited</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;