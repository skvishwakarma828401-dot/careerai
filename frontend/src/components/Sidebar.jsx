import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  GitCompare,
  Bot,
  Video, 
  Compass,
  Map,
  BarChart2, 
  TrendingUp,
  Settings, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  LogOut,
  X
} from 'lucide-react';
import { APP_NAME } from '../utils/constants';

const iconMap = {
  LayoutDashboard,
  FileText,
  Briefcase,
  GitCompare,
  Bot,
  Video, 
  Compass,
  Map,
  BarChart2, 
  TrendingUp,
  Settings, 
};

const navigationItems = [
  { label: 'Overview', path: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Resume Intelligence', path: '/dashboard/resume', icon: 'FileText', badge: 'AI' },
  { label: 'Job Intelligence', path: '/dashboard/jobs', icon: 'Briefcase', badge: 'Active' },
  { label: 'Resume Matcher', path: '/dashboard/match', icon: 'GitCompare', badge: 'Semantic' },
  { label: 'AI Assistant (RAG)', path: '/dashboard/assistant', icon: 'Bot', badge: 'RAG' },
  { label: 'AI Mock Interviews', path: '/dashboard/interview', icon: 'Video', badge: 'Live' },
  { label: 'AI Career Mentor', path: '/dashboard/mentor', icon: 'Compass', badge: 'Memory' },
  { label: 'Learning Roadmaps', path: '/dashboard/roadmaps', icon: 'Map', badge: '4-Wk' },
  { label: 'Skill Gap Matrix', path: '/dashboard/skills', icon: 'BarChart2', badge: 'Matrix' },
  { label: 'Career Analytics', path: '/dashboard/analytics', icon: 'TrendingUp', badge: 'Live' },
];

const Sidebar = ({ isCollapsed, toggleSidebar, mobileOpen, closeMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
    <aside className={`dashboard-sidebar sidebar-container ${isCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <Link to="/" className="sidebar-brand" onClick={closeMobile}>
          <div className="brand-logo-icon">
            <Sparkles size={20} className="text-primary" />
          </div>
          {!isCollapsed && (
            <div className="brand-text">
              <span className="brand-title">{APP_NAME}</span>
              <span className="brand-subtitle">Console</span>
            </div>
          )}
        </Link>

        {/* Mobile close button / Desktop collapse button */}
        <button 
          className="sidebar-collapse-btn desktop-only" 
          onClick={toggleSidebar}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {mobileOpen && (
          <button 
            className="sidebar-collapse-btn mobile-only" 
            onClick={closeMobile}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation Group */}
      <div className="sidebar-nav-container">
        {!isCollapsed && <div className="sidebar-section-label">INTELLIGENCE PLATFORM</div>}
        <nav className="sidebar-nav">
          {navigationItems.map((item) => {
            const IconComponent = iconMap[item.icon] || LayoutDashboard;
            const isRootDashboard = item.path === '/dashboard';
            
            return (
              <NavLink
                key={item.label}
                to={item.path}
                end={isRootDashboard}
                onClick={closeMobile}
                className={({ isActive }) => 
                  `sidebar-nav-item ${isActive ? 'active' : ''}`
                }
                title={isCollapsed ? item.label : undefined}
              >
                <div className="nav-icon-wrapper">
                  <IconComponent size={19} />
                </div>
                {!isCollapsed && (
                  <span className="nav-label-text">{item.label}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span className="nav-badge-pill badge-active">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Authenticated User Info */}
      <div className="sidebar-footer">
        <div className="user-profile-preview">
          <div className="user-avatar-chip">
            {getInitials(user?.name)}
          </div>
          {!isCollapsed && (
            <div className="user-info-text">
              <span className="user-name">{user?.name || 'Developer'}</span>
              <span className="user-role">{user?.profile?.targetRole || user?.role || 'student'}</span>
            </div>
          )}
        </div>
        
        {!isCollapsed && (
          <button 
            onClick={handleLogout} 
            className="sidebar-exit-btn" 
            title="Sign Out of CareerAI"
            aria-label="Sign Out"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
