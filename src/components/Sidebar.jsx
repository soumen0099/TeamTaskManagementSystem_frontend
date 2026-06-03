import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, CheckSquare, User, LogOut } from 'lucide-react';
import '../styles/sidebar.css';

const Sidebar = () => {
  const { logout, user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">WP</div>
        <span className="logo-text">WorkPulse</span>
      </div>

      <nav className="sidebar-menu">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/teams" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Users size={20} />
          <span>Teams</span>
        </NavLink>

        <NavLink 
          to="/tasks" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <CheckSquare size={20} />
          <span>Tasks</span>
        </NavLink>

        <NavLink 
          to="/profile" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <User size={20} />
          <span>Profile</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user">
            <div className="user-avatar-mini">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt={`${user.userName} avatar`} className="user-avatar-mini-image" />
              ) : (
                user.userName ? user.userName.substring(0, 2).toUpperCase() : 'U'
              )}
            </div>
            <div className="user-info-mini">
              <p className="user-name-mini">{user.userName}</p>
              <p className="user-role-mini">{user.role || 'Member'}</p>
            </div>
          </div>
        )}
        <button className="sidebar-logout-btn" onClick={logout}>
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
