import React, { useState } from 'react';
import axios from 'axios';
import './ProfileUpdate.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const ProfileUpdate = ({ user, onClose }) => {
    const [formData, setFormData] = useState({
        email: user?.email || '',
        full_name: user?.user_metadata?.full_name || '',
        birth_date: user?.birth_date || '',
        nickname: user?.nickname || '',
        gender: user?.gender || 'male'
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!user) {
        return <div>Loading user data...</div>;
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            console.log("Updating profile for user:", user.id);
            console.log("Profile data:", formData);
            
            // First ensure user exists in database
            await axios.post(`${API_URL}/ensure-user`, {
                id: user.id,
                email: user.email
            });
            
            // Then update profile
            const response = await axios.put(`${API_URL}/update-profile/${user.id}`, {
                ...formData,
                user_id: user.id
            });
            
            console.log("Profile update response:", response.data);
            
            if (response.data) {
                onClose();
            }
        } catch (error) {
            console.error("Profile update error:", error);
            setError("Failed to update profile. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="profile-update-overlay">
            <div className="profile-update-container">
                <h2>Update Profile</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled
                        />
                    </div>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <div className="button-group">
                        <button 
                            type="button" 
                            className="cancel-btn"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="submit-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Updating...' : 'Update Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileUpdate; 