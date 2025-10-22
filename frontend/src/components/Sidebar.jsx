import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { id: 'pending-orders', label: 'Pending Orders', path: '/pending-orders', icon: '🕒' },
    { id: 'purchase-order-draft', label: 'Purchase Order Draft', path: '/purchase-order-draft', icon: '📝' },
    { id: 'change-password', label: 'Change Password', path: '/change-password', icon: '🔑' },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <button className="toggle-button" onClick={toggleSidebar} aria-label="Toggle Sidebar">
        ☰
      </button>
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map(item => (
            <li key={item.id} className={location.pathname === item.path ? 'active' : ''}>
              <Link to={item.path}>
                <span className="icon" aria-hidden="true">{item.icon}</span>
                <span className="label">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;