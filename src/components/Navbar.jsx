import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, LogOut } from 'lucide-react';
import '../styles/navbar.css';

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();
  
  // Format current date beautifully
  const getFormattedDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h1 className="navbar-title">{title}</h1>
      </div>

      <div className="navbar-right">
        <div className="navbar-date">
          <Calendar size={16} />
          <span>{getFormattedDate()}</span>
        </div>
        
        {user && (
          <>
            <button className="navbar-logout-btn" onClick={logout} aria-label="Log out">
              <LogOut size={16} />
              <span>Log Out</span>
            </button>

            <div className="navbar-profile-badge">
              <span className="navbar-username">{user.userName}</span>
              <div className="navbar-avatar">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={`${user.userName} avatar`} className="navbar-avatar-image" />
                ) : (
                  <span>{user.userName ? user.userName.substring(0, 2).toUpperCase() : 'U'}</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
