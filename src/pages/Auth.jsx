import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Layout, Mail, Lock, User, ArrowRight } from 'lucide-react';
import '../styles/auth.css';

const Auth = () => {
  const { login, register, token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [errors, setErrors] = useState({});

  // Redirect if already logged in
  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  const validateEmail = (emailStr) => {
    return /\S+@\S+\.\S+/.test(emailStr);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!isLogin && !userName.trim()) {
      nextErrors.userName = 'Username is required for registration.';
    }

    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!validateEmail(email)) {
      nextErrors.email = 'Please provide a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters long.';
    }

    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      showToast('Please correct the highlighted fields.', 'warning');
      return;
    }

    setLoading(true);

    if (isLogin) {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      }
    } else {
      const success = await register(userName, email, password);
      if (success) {
        // Toggle to login tab upon successful registration
        setIsLogin(true);
        setPassword('');
        setErrors({});
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-background-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div className="auth-card glass-card">
        <div className="auth-header">
          <div className="auth-brand">
            <div className="auth-logo-icon">WP</div>
            <span className="auth-logo-text">WorkPulse</span>
          </div>
          <h2 className="auth-title">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="auth-subtitle">
            {isLogin
              ? 'Enter your credentials to access your workspace'
              : 'Sign up to start organizing tasks and teams'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  className={`input-field icon-padding ${errors.userName ? 'field-invalid' : ''}`}
                  placeholder="e.g. soumen"
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value);
                    setErrors((prev) => ({ ...prev, userName: '' }));
                  }}
                  disabled={loading}
                  aria-invalid={Boolean(errors.userName)}
                  aria-describedby={errors.userName ? 'username-error' : undefined}
                  required
                />
              </div>
              {errors.userName && (
                <span id="username-error" className="field-error-text">{errors.userName}</span>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                className={`input-field icon-padding ${errors.email ? 'field-invalid' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, email: '' }));
                }}
                disabled={loading}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                required
              />
            </div>
            {errors.email && (
              <span id="email-error" className="field-error-text">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                className={`input-field icon-padding ${errors.password ? 'field-invalid' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: '' }));
                }}
                disabled={loading}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
                required
              />
            </div>
            {errors.password && (
              <span id="password-error" className="field-error-text">{errors.password}</span>
            )}
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
            {loading ? (
              <span className="loading-spinner"></span>
            ) : (
              <>
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="auth-toggle">
          <p>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              type="button"
              className="auth-toggle-btn"
              onClick={() => {
                setIsLogin(!isLogin);
                setEmail('');
                setPassword('');
                setUserName('');
                setErrors({});
              }}
              disabled={loading}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
