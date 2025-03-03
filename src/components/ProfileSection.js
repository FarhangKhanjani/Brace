import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import './ProfileSection.css';
import { toast } from 'react-hot-toast';

const ProfileSection = ({ userId }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [description, setDescription] = useState('');
    const [error, setError] = useState(null);
    
    useEffect(() => {
        if (userId) {
            fetchProfile();
        }
    }, [userId]);
    
    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // First check if the profile exists
            const { data: existingProfile, error: checkError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
                
            if (checkError && checkError.code !== 'PGRST116') {
                // PGRST116 is the error code for "no rows returned"
                throw checkError;
            }
            
            if (!existingProfile) {
                // Profile doesn't exist, create it
                console.log('Creating new profile for user:', userId);
                const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert([{ id: userId, description: '' }])
                    .select()
                    .single();
                    
                if (createError) {
                    throw createError;
                }
                
                setProfile(newProfile || { id: userId, description: '' });
                setDescription('');
            } else {
                // Profile exists
                setProfile(existingProfile);
                setDescription(existingProfile.description || '');
            }
        } catch (error) {
            console.error('Error fetching/creating profile:', error);
            setError(error.message);
            toast.error('Failed to load profile information');
            
            // Set a default profile to prevent null errors
            setProfile({ id: userId, description: '' });
            setDescription('');
        } finally {
            setLoading(false);
        }
    };
    
    const updateDescription = async () => {
        try {
            setError(null);
            
            const { error } = await supabase
                .from('profiles')
                .update({ description })
                .eq('id', userId);
                
            if (error) {
                throw error;
            }
            
            setProfile({ ...profile, description });
            setEditing(false);
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            setError(error.message);
            toast.error('Failed to update profile');
        }
    };
    
    if (loading) {
        return <div className="profile-loading">Loading profile...</div>;
    }
    
    // Ensure profile is not null before rendering
    const safeProfile = profile || { description: '' };
    
    return (
        <div className="profile-section">
            <div className="profile-header">
                <h2>About Me</h2>
                {!editing && (
                    <button 
                        className="edit-profile-btn"
                        onClick={() => setEditing(true)}
                    >
                        Edit
                    </button>
                )}
            </div>
            
            {error && (
                <div className="profile-error">
                    Error: {error}
                </div>
            )}
            
            {editing ? (
                <div className="profile-edit">
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Tell others about yourself..."
                        rows={6}
                    />
                    <div className="profile-actions">
                        <button 
                            className="save-btn"
                            onClick={updateDescription}
                        >
                            Save
                        </button>
                        <button 
                            className="cancel-btn"
                            onClick={() => {
                                setEditing(false);
                                setDescription(safeProfile.description || '');
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="profile-description">
                    {safeProfile.description ? (
                        <p>{safeProfile.description}</p>
                    ) : (
                        <p className="no-description">
                            No description yet. Click 'Edit' to add information about yourself.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProfileSection; 