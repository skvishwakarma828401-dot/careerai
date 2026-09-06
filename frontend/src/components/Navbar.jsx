import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import StatusBadge from './StatusBadge';
import { 
  Sparkles, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  ArrowRight, 
  LayoutDashboard,
  LogIn,
  UserPlus,
  LogOut,
  User
} from 'lucide-react';
import { APP_NAME } from '../utils/constants';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isCurrent = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand">
          <div className="brand-logo-icon">
            <Sparkles size={20} className="text-primary" />
          </div>
          <div className="brand-text">
            <span className="brand-title">{APP_NAME}</span>
            <span className="brand-badge">BETA</span>
          </div>
        </Link>

        {/* Live System Health Badge */}
        <div className="navbar-health-wrapper">
          <StatusBadge />
        </div>

        {/* Desktop Nav Links */}
        <nav className="navbar-nav desktop-only">
          <Link to="/" className={`nav-link ${isCurrent('/') ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/dashboard" className={`nav-link ${isCurrent('/dashboard') ? 'active' : ''}`}>
            Dashboard
          </Link>
        </nav>

        {/* Action Controls */}
        <div className="navbar-actions desktop-only">
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme} 
            aria-label="Toggle Theme"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isAuthenticated ? (
            <div className="navbar-user-group">
              <Link to="/dashboard" className="navbar-user-chip">
                <div className="user-avatar-sm">{getInitials(user?.name)}</div>
                <span className="user-name-sm">{user?.name?.split(' ')[0] || 'User'}</span>
              </Link>
              <button 
                onClick={handleLogout} 
                className="btn btn-ghost btn-sm"
                title="Sign Out"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                <LogIn size={15} />
                <span>Sign In</span>
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <span>Get Started</span>
                <ArrowRight size={15} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="mobile-toggle-wrapper mobile-only">
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme} 
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button 
            className="menu-toggle-btn" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-links">
              <Link 
                to="/" 
                className={`mobile-nav-link ${isCurrent('/') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/dashboard" 
                className={`mobile-nav-link ${isCurrent('/dashboard') ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>

              {isAuthenticated ? (
                <>
                  <div className="mobile-user-info">
                    <User size={16} className="text-primary" />
                    <span>{user?.name} ({user?.email})</span>
                  </div>
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="btn btn-outline btn-block"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LogIn size={18} />
                    <span>Sign In</span>
                  </Link>
                  <Link 
                    to="/register" 
                    className="btn btn-primary btn-block"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <UserPlus size={18} />
                    <span>Get Started Free</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
