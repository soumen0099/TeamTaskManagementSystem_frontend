import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="loader-container">
        <div className="glass-loader">
          <div className="loader-ring"></div>
          <p className="loader-text">Loading secure session...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default ProtectedRoute;
