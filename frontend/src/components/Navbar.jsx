import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = ({ toggleSidebar, showSidebarToggle = true }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
    closeMenu();
  };

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    ...(isAuthenticated 
      ? [{ action: 'logout', label: 'Logout', icon: '🚪' }]
      : [{ path: '/login', label: 'Login', icon: '🔐' }]
    ),
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar dynamics-bg-primary dynamics-shadow-md">
      <div className="navbar-container dynamics-container">
        <div className="navbar-left">
          {showSidebarToggle && (
            <button 
              className="sidebar-toggle"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <span className="toggle-bar"></span>
              <span className="toggle-bar"></span>
              <span className="toggle-bar"></span>
            </button>
          )}
          <Link to="/" className="navbar-brand" onClick={closeMenu}>
            <span className="brand-icon">📊</span>
            <span className="brand-text dynamics-text-xl dynamics-font-semibold">Vendor Information System</span>
          </Link>
        </div>

        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <ul className="navbar-nav dynamics-flex dynamics-gap-4">
            {navItems.map((item, index) => (
              <li key={item.path || item.action || index} className="nav-item">
                {item.action === 'logout' ? (
                  <button
                    className="nav-link dynamics-btn dynamics-btn-outline logout-btn"
                    onClick={handleLogout}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-text">{item.label}</span>
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    className={`nav-link dynamics-btn dynamics-btn-outline ${
                      location.pathname === item.path ? 'active' : ''
                    }`}
                    onClick={closeMenu}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-text">{item.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <button
          className={`navbar-toggle ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle navigation"
        >
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;