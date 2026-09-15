import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from './Icon';
import './Navbar.css';

const Navbar = ({ toggleSidebar, showSidebarToggle = true }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
    closeMenu();
  };

  const navItems = isAuthenticated 
    ? [{ action: 'logout', label: 'Logout', icon: 'logOut' }]
    : [{ path: '/login', label: 'Login', icon: 'logIn' }];

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
          {/* <Link to="/" className="navbar-brand" onClick={closeMenu}>
            <span className="brand-icon">📊</span>
            <span className="brand-text dynamics-text-xl dynamics-font-semibold">Vendor Information System</span>
          </Link> */}
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
                    <Icon name={item.icon} size={20} className="nav-icon" />
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
                    <Icon name={item.icon} size={20} className="nav-icon" />
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