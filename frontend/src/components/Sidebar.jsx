import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user } = useAuth?.() || { user: null };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { id: 'pending-orders', label: 'Pending Orders', path: '/pending-orders', icon: '🕒' },
    { id: 'purchase-order-draft', label: 'Purchase Order Draft', path: '/purchase-order-draft', icon: '📝' },
    { id: 'change-password', label: 'Change Password', path: '/change-password', icon: '🔑' },
  ];

  const getAvatarText = () => {
    const name = user?.VendorName || user?.ContactPerson || '';
    const email = user?.BusinessEmail || '';
    const source = name || email;
    return source ? source.charAt(0).toUpperCase() : 'V';
  };

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={toggleSidebar}
          role="button"
          aria-label="Close sidebar overlay"
        />
      )}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`} aria-label="Sidebar Navigation">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-icon" aria-hidden="true"></span>
            <span className="brand-text"> Vendor Enterprise Solution  </span>
           
          </div>
          <button className="sidebar-close" onClick={toggleSidebar} aria-label="Close Sidebar">
            ✕
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Primary">
          <ul className="nav-menu">
            {menuItems.map((item) => (
              <li key={item.id} className="nav-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={toggleSidebar}
                >
                  <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                  <span className="nav-text">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info" aria-label="User Info">
            <div className="user-avatar" aria-hidden="true">{getAvatarText()}</div>
            <div className="user-details">
              <div className="user-name">VES Version 1.0.0 </div>
              <div className="user-role">Team IT</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;