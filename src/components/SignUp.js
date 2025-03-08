import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';
import './SignUp.css';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    capital: false,
    special: false
  });
  const navigate = useNavigate();

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    
    // Check password strength
    setPasswordStrength({
      length: value.length >= 8,
      capital: /[A-Z]/.test(value),
      special: /[^A-Za-z0-9]/.test(value)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    
    // Validate form
    if (!email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    if (!passwordStrength.length) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (!passwordStrength.capital) {
      setError('Password must contain at least one capital letter');
      return;
    }
    
    if (!passwordStrength.special) {
      setError('Password must contain at least one special character');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast.success('Account created! Please check your email to confirm your registration.');
      navigate('/login');
    } catch (error) {
      console.error('Error signing up:', error.message);
      setError(error.message);
      toast.error('Signup failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h2>Create Your Account</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              disabled={loading}
              required
            />
            
            <div className="password-requirements">
              <h4>Password Requirements:</h4>
              <ul>
                <li className={passwordStrength.length ? 'met' : ''}>
                  At least 8 characters
                </li>
                <li className={passwordStrength.capital ? 'met' : ''}>
                  At least 1 capital letter
                </li>
                <li className={passwordStrength.special ? 'met' : ''}>
                  At least 1 special character
                </li>
              </ul>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="signup-submit-btn" 
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="login-link">
          Already have an account? <Link to="/login">Login here</Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp; 