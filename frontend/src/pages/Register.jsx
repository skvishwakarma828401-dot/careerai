import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, User, ArrowRight, Check, AlertCircle, Loader2 } from 'lucide-react';
import { APP_NAME } from '../utils/constants';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    targetRole: 'Full Stack Developer',
    experienceLevel: 'beginner',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please complete all required fields.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      targetRole: formData.targetRole,
      experienceLevel: formData.experienceLevel,
    });

    setLoading(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
    } else {
      setError(res.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card auth-card-lg">
        {/* Auth Header */}
        <div className="auth-header text-center">
          <Link to="/" className="auth-brand-logo">
            <div className="brand-logo-icon">
              <Sparkles size={22} className="text-primary" />
            </div>
            <span className="brand-title">{APP_NAME}</span>
          </Link>
          <h2 className="auth-title">Create Your Free Account</h2>
          <p className="auth-subtitle">Accelerate your career preparation with precision</p>
        </div>

        {/* Security / Auth Status Pill */}
        <div className="auth-notice-box">
          <Sparkles size={16} className="text-primary" />
          <span>Automated Session: Password hashed with bcrypt + JWT Cookie</span>
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
            <span>Account created successfully! Launching dashboard...</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Alex Rivera"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="alex@university.edu"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Create Password (min 6 characters)</label>
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
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="role">Current Status</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-select"
              >
                <option value="student">Student</option>
                <option value="fresher">Fresher / Recent Grad</option>
                <option value="developer">Software Engineer</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="targetRole">Target Job Role</label>
              <select
                id="targetRole"
                name="targetRole"
                value={formData.targetRole}
                onChange={handleChange}
                className="form-select"
              >
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="Backend Engineer">Backend Engineer</option>
                <option value="Frontend Engineer">Frontend Engineer</option>
                <option value="AI / ML Engineer">AI / ML Engineer</option>
                <option value="DevOps / Cloud">DevOps / Cloud Engineer</option>
              </select>
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
                <span>Creating your account...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Switch to Login */}
        <div className="auth-footer text-center">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
