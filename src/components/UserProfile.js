import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import './UserProfile.css';
import ProfileSection from './ProfileSection';
import BlogSection from './BlogSection';
import { toast } from 'react-hot-toast';

const UserProfile = () => {
    const { userId } = useParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    
    useEffect(() => {
        // Get current user
        supabase.auth.getUser().then(({ data }) => {
            setCurrentUser(data?.user || null);
        });
        
        fetchUserProfile();
    }, [userId]);
    
    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
                
            if (error) {
                throw error;
            }
            
            setUser(data);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            toast.error('Failed to load user profile');
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) {
        return (
            <div className="user-profile-loading">
                <div className="loading-spinner"></div>
                <p>Loading user profile...</p>
            </div>
        );
    }
    
    if (!user) {
        return (
            <div className="user-not-found">
                <h2>User Not Found</h2>
                <p>The user you're looking for doesn't exist or has been removed.</p>
            </div>
        );
    }
    
    const isCurrentUser = currentUser && currentUser.id === userId;
    
    return (
        <div className="user-profile-container">
            <div className="user-profile-header">
                <h1>{user.username || 'User'}'s Profile</h1>
            </div>
            
            <div className="user-profile-content">
                <div className="user-about-section">
                    <ProfileSection userId={userId} />
                </div>
                
                <div className="user-blog-section">
                    <BlogSection userId={userId} isCurrentUser={isCurrentUser} />
                </div>
            </div>
        </div>
    );
};

export default UserProfile; 