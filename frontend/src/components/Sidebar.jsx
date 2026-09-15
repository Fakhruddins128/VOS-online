import React from 'react';
import { NavLink } from 'react-router-dom';
import Icon from './Icon';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: 'grid' },
    { id: 'pending-orders', label: 'Pending Orders', path: '/pending-orders', icon: 'clipboardList' },
    { id: 'purchase-order-draft', label: 'Purchase Order Draft', path: '/purchase-order-draft', icon: 'fileText' },
    { id: 'change-password', label: 'Change Password', path: '/change-password', icon: 'key' },
  ];

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
            <Icon name="x" size={20} />
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
                  <span className="nav-icon" aria-hidden="true"><Icon name={item.icon} size={18} /></span>
                  <span className="nav-text">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info" aria-label="User Info">
            {/* <div className="user-avatar" aria-hidden="true">{getAvatarText()}</div> */}
            <div className="user-details">
              <div className="user-name">VES Version 1.0.0 </div>
              <div className="user-role">Team IT copyright 2025</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;