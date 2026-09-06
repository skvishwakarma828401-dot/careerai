import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, ArrowRight, Check, AlertCircle, Loader2 } from 'lucide-react';
import { APP_NAME } from '../utils/constants';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = location.state?.from?.pathname || '/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await login({
      email: formData.email,
      password: formData.password,
    });

    setLoading(false);

    if (res.success) {
      setSuccess(true);
      const redirectPath = location.state?.from?.pathname || '/dashboard';
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 500);
    } else {
      setError(res.error || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        {/* Auth Header */}
        <div className="auth-header text-center">
          <Link to="/" className="auth-brand-logo">
            <div className="brand-logo-icon">
              <Sparkles size={22} className="text-primary" />
            </div>
            <span className="brand-title">{APP_NAME}</span>
          </Link>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to resume your technical preparation</p>
        </div>

        {/* Security / Auth Status Pill */}
        <div className="auth-notice-box">
          <Sparkles size={16} className="text-primary" />
          <span>Secure Session: JWT via HTTP-only Cookie</span>
        </div>

        {error && (
          <div className="auth-alert error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="auth-alert success">
            <Check size={16} />
            <span>Login successful! Opening dashboard...</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                name="email"
                placeholder="developer@example.com"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label" htmlFor="password">Password</label>
            </div>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin-icon" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Switch to Register */}
        <div className="auth-footer text-center">
          <p>
            Don't have an account yet?{' '}
            <Link to="/register" className="auth-link">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
