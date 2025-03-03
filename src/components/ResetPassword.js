import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import './Login.css';
import { toast } from 'react-hot-toast';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [validToken, setValidToken] = useState(false);

    useEffect(() => {
        // Check if we have a hash in the URL (from the reset email)
        const hash = window.location.hash;
        
        // The hash should contain type=recovery and access_token
        if (hash && hash.includes('type=recovery') && hash.includes('access_token=')) {
            setValidToken(true);
            console.log('Valid recovery token found');
        } else {
            setError('Invalid or expired password reset link. Please request a new password reset link.');
            console.error('Invalid reset token:', hash);
        }
    }, []);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        
        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            
            // Update the user's password
            const { error } = await supabase.auth.updateUser({
                password: password
            });
            
            if (error) throw error;
            
            setSuccess(true);
            toast.success('Password has been reset successfully');
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            console.error('Error resetting password:', error);
            setError(error.message);
            toast.error('Failed to reset password: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Reset Your Password</h2>
                
                {error ? (
                    <div className="error-message">
                        <p>{error}</p>
                        <button 
                            className="back-to-login-btn"
                            onClick={() => navigate('/login')}
                            style={{ marginTop: '15px' }}
                        >
                            Back to Login
                        </button>
                    </div>
                ) : success ? (
                    <div className="auth-success">
                        <p>Your password has been reset successfully!</p>
                        <p>You will be redirected to the login page shortly...</p>
                    </div>
                ) : !validToken ? (
                    <div className="loading-message">
                        <p>Validating your reset link...</p>
                    </div>
                ) : (
                    <form onSubmit={handleResetPassword}>
                        <div className="form-group">
                            <label htmlFor="password">New Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength="6"
                            />
                            <small className="form-hint">Password must be at least 6 characters long</small>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength="6"
                            />
                        </div>
                        
                        <button 
                            type="submit" 
                            className="login-submit-btn"
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