import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';

// Pages
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';

// Security Gate Wrapper
import ProtectedRoute from './components/ProtectedRoute';

// CSS System Imports
import './index.css';
import './styles/components.css';

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Guest-only auth route */}
            <Route path="/auth" element={<Auth />} />

            {/* Secure workspaces protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/teams" 
              element={
                <ProtectedRoute>
                  <Teams />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/tasks" 
              element={
                <ProtectedRoute>
                  <Tasks />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />

            {/* Catch all fallback redirects to secure dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
