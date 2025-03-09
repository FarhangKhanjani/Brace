import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';
import './ResetPassword.css';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hashKey, setHashKey] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract hash parameters when component mounts
  useEffect(() => {
    const queryParams = new URLSearchParams(location.hash.substring(1)); // Remove the # character
    const type = queryParams.get('type');
    const accessToken = queryParams.get('access_token');
    
    if (type === 'recovery' && accessToken) {
      setHashKey(accessToken);
    } else {
      setError('Invalid or expired password reset link');
    }
  }, [location]);
  
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) throw error;
      
      toast.success('Password has been reset successfully!');
      
      // Redirect to login page
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      console.error('Error resetting password:', error);
      setError(error.message || 'Failed to reset password');
      toast.error('Password reset failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <h2>Reset Your Password</h2>
        <p className="reset-instructions">
          Please enter your new password below to reset your account.
        </p>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {!hashKey ? (
          <div className="invalid-link-message">
            <p>This password reset link is invalid or has expired.</p>
            <p>Please request a new password reset link from the login page.</p>
            <button 
              className="reset-password-button"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="reset-password-form">
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                required
                minLength="8"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
                minLength="8"
              />
            </div>
            
            <button 
              type="submit" 
              className="reset-password-button"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword; 