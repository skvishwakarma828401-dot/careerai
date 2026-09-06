import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatusBadge from '../components/StatusBadge';
import { useTheme } from '../context/ThemeContext';
import { 
  Sun, 
  Moon, 
  Bell, 
  Search, 
  Menu, 
  Sparkles,
  ChevronRight,
  X
} from 'lucide-react';
import { APP_NAME } from '../utils/constants';

const DashboardLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Extract simple breadcrumb name from pathname
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentSection = pathParts[pathParts.length - 1] || 'overview';
  const formattedSection = currentSection.charAt(0).toUpperCase() + currentSection.slice(1);

  return (
    <div className="dashboard-wrapper">
      {/* Mobile Backdrop Overlay */}
      <div 
        className={`sidebar-overlay ${mobileSidebarOpen ? 'active' : ''}`} 
        onClick={() => setMobileSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar Component */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
        mobileOpen={mobileSidebarOpen}
        closeMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className={`dashboard-main-area ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Top Header Bar */}
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <button 
              className="mobile-sidebar-toggle mobile-only" 
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              aria-label="Toggle Navigation"
            >
              {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="dashboard-breadcrumbs">
              <Link to="/dashboard" className="breadcrumb-root">Dashboard</Link>
              {pathParts.length > 1 && (
                <>
                  <ChevronRight size={14} className="breadcrumb-separator" />
                  <span className="breadcrumb-current">{formattedSection}</span>
                </>
              )}
            </div>
          </div>

          <div className="topbar-right">
            <div className="dashboard-search-box desktop-only">
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search tracks, topics, questions... (Ctrl+K)" 
                className="dashboard-search-input"
              />
            </div>

            <StatusBadge showDetails={true} />

            <button 
              className="topbar-icon-btn" 
              onClick={toggleTheme} 
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button className="topbar-icon-btn notification-btn" aria-label="Notifications" title="Notifications">
              <Bell size={18} />
              <span className="notification-dot"></span>
            </button>
          </div>
        </header>

        {/* Dynamic Nested Dashboard View */}
        <main className="dashboard-content-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
