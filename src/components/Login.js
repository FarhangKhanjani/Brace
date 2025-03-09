import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import './Login.css';
import { toast } from 'react-hot-toast';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [resetMode, setResetMode] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            setError(null);
            
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            
            if (error) throw error;
            
            navigate('/dashboard');
        } catch (error) {
            console.error('Error logging in:', error);
            setError(error.message);
            toast.error('Login failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        
        if (!email) {
            setError('Please enter your email address');
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            
            if (error) throw error;
            
            setResetSent(true);
            toast.success('Password reset instructions sent to your email');
        } catch (error) {
            console.error('Error sending reset email:', error);
            setError(error.message);
            toast.error('Failed to send reset email: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/dashboard'
                }
            });

            if (error) throw error;
            // User will be redirected to Google
        } catch (error) {
            console.error('Error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        
        if (!email) {
            toast.error('Please enter your email address');
            return;
        }
        
        try {
            setLoading(true);
            
            // Request password reset email from Supabase
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            
            if (error) throw error;
            
            toast.success('Password reset link sent to your email');
            
        } catch (error) {
            console.error('Error sending reset email:', error);
            toast.error(error.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                {resetMode ? (
                    <>
                        <h2>Reset Password</h2>
                        {resetSent ? (
                            <div className="auth-success">
                                <p>Check your email. Password reset instructions have been sent to your email.</p>
                                <button 
                                    className="back-to-login-btn"
                                    onClick={() => {
                                        setResetMode(false);
                                        setResetSent(false);
                                    }}
                                >
                                    Back to Login
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handlePasswordReset}>
                                {error && <div className="error-message">{error}</div>}
                                
                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                
                                <button 
                                    type="submit" 
                                    className="login-submit-btn"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending...' : 'Send Reset Instructions'}
                                </button>
                                
                                <div className="auth-options">
                                    <button
                                        type="button"
                                        className="text-btn"
                                        onClick={() => setResetMode(false)}
                                    >
                                        Back to Login
                                    </button>
                                </div>
                            </form>
                        )}
                    </>
                ) : (
                    <>
                        <h2>Login to CryptoCap</h2>
                        {error && <div className="error-message">{error}</div>}
                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group password-group">
                                <label htmlFor="password">Password</label>
                                <div className="password-input-container">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <span 
                                        className="password-toggle" 
                                        onClick={togglePasswordVisibility}
                                    >
                                        {showPassword ? 
                                            <i className="eye-icon">👁️</i> : 
                                            <i className="eye-icon">👁️‍🗨️</i>
                                        }
                                    </span>
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                className="login-submit-btn" 
                                disabled={loading}
                            >
                                {loading ? 'Logging in...' : 'Login with Email'}
                            </button>
                        </form>

                        <div className="divider">
                            <span>OR</span>
                        </div>

                        <button 
                            onClick={handleGoogleLogin}
                            className="google-login-btn"
                            disabled={loading}
                        >
                            <svg className="google-logo" viewBox="0 0 24 24" width="20" height="20">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            {loading ? 'Loading...' : 'Continue with Google'}
                        </button>

                        <div className="auth-options">
                            <button
                                type="button"
                                className="text-btn"
                                onClick={() => setResetMode(true)}
                            >
                                Forgot Password?
                            </button>
                            
                            <Link to="/signup" className="signup-link">
                                Don't have an account? Sign Up
                            </Link>
                        </div>

                        <div className="forgot-password">
                            <button 
                                className="forgot-password-link" 
                                onClick={handleForgotPassword}
                                disabled={loading}
                            >
                                Forgot your password?
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Login; 