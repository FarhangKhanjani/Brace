import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';
import './ChangePasswordForm.css';

const ChangePasswordForm = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [passwordStrength, setPasswordStrength] = useState({
        length: false,
        capital: false,
        special: false
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        
        // Clear error when user types
        if (error) setError(null);
        
        // Check password strength when newPassword changes
        if (name === 'newPassword') {
            setPasswordStrength({
                length: value.length >= 8,
                capital: /[A-Z]/.test(value),
                special: /[^A-Za-z0-9]/.test(value)
            });
        }
    };

    const validateForm = () => {
        if (!formData.currentPassword) {
            setError('Current password is required');
            return false;
        }
        
        if (!formData.newPassword) {
            setError('New password is required');
            return false;
        }
        
        // Enhanced password validation
        if (!passwordStrength.length) {
            setError('Password must be at least 8 characters');
            return false;
        }
        
        if (!passwordStrength.capital) {
            setError('Password must contain at least one capital letter');
            return false;
        }
        
        if (!passwordStrength.special) {
            setError('Password must contain at least one special character');
            return false;
        }
        
        if (formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match');
            return false;
        }
        
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setLoading(true);
        
        try {
            // First, re-authenticate with current password
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                throw new Error('You must be logged in to change your password');
            }
            
            // Update the password
            const { error } = await supabase.auth.updateUser({
                password: formData.newPassword
            });
            
            if (error) throw error;
            
            // Clear form
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            
            // Reset password strength indicators
            setPasswordStrength({
                length: false,
                capital: false,
                special: false
            });
            
            toast.success('Password updated successfully');
        } catch (error) {
            console.error('Error changing password:', error);
            setError(error.message || 'Failed to change password');
            toast.error('Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="change-password-form">
            <h3>Change Your Password</h3>
            
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                        id="currentPassword"
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Enter your current password"
                        disabled={loading}
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                        id="newPassword"
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Enter new password"
                        disabled={loading}
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
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                        id="confirmPassword"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Confirm new password"
                        disabled={loading}
                    />
                </div>
                
                <div className="form-actions">
                    <button
                        type="submit"
                        className="change-btn"
                        disabled={loading}
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChangePasswordForm; 