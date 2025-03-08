import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';
import { IoMdClose } from 'react-icons/io';
import './ProfileForm.css';

const ProfileForm = ({ onClose, onProfileUpdated, isEmbedded = false }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        full_name: '',
        nickname: '',
        birth_date: '',
        gender: ''
    });

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                setLoading(true);
                
                const { data: { user } } = await supabase.auth.getUser();
                
                if (!user) {
                    throw new Error('User not authenticated');
                }
                
                // Fetch user profile from the users table
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                
                if (error) {
                    throw error;
                }
                
                if (data) {
                    setProfile({
                        full_name: data.full_name || '',
                        nickname: data.nickname || '',
                        birth_date: data.birth_date || '',
                        gender: data.gender || ''
                    });
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
                toast.error('Failed to load profile information');
            } finally {
                setLoading(false);
            }
        };
        
        fetchUserProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setSaving(true);
            
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                throw new Error('User not authenticated');
            }
            
            // Update the user profile in the database
            const { error } = await supabase
                .from('users')
                .update({
                    full_name: profile.full_name,
                    nickname: profile.nickname,
                    birth_date: profile.birth_date || null,
                    gender: profile.gender,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);
            
            if (error) {
                throw error;
            }
            
            toast.success('Profile updated successfully!');
            
            // Notify parent component if callback provided
            if (onProfileUpdated) {
                onProfileUpdated(profile);
            }
            
            // Close the form if callback provided
            if (onClose) {
                onClose();
            }
            
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`profile-form-container ${isEmbedded ? 'embedded' : ''}`}>
            {!isEmbedded && (
                <div className="form-header">
                    <h2>Edit Profile</h2>
                    <button className="close-btn" onClick={onClose}>
                        <IoMdClose />
                    </button>
                </div>
            )}
            
            {loading ? (
                <div className="loading-message">Loading your profile information...</div>
            ) : (
                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-group">
                        <label htmlFor="nickname">Nickname (visible to others)</label>
                        <input
                            type="text"
                            id="nickname"
                            name="nickname"
                            value={profile.nickname}
                            onChange={handleChange}
                            placeholder="Your public display name"
                            className="form-input"
                        />
                        <small className="form-help-text">This will be shown next to your trades in the community section</small>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="full_name">Full Name (private)</label>
                        <input
                            type="text"
                            id="full_name"
                            name="full_name"
                            value={profile.full_name}
                            onChange={handleChange}
                            placeholder="Your full name"
                            className="form-input"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="birth_date">Birth Date (private)</label>
                        <input
                            type="date"
                            id="birth_date"
                            name="birth_date"
                            value={profile.birth_date}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="gender">Gender (private)</label>
                        <select
                            id="gender"
                            name="gender"
                            value={profile.gender}
                            onChange={handleChange}
                            className="form-input"
                        >
                            <option value="">Prefer not to say</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="non-binary">Non-binary</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div className="form-actions">
                        <button 
                            type="button" 
                            className="cancel-btn" 
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="save-btn" 
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ProfileForm; 