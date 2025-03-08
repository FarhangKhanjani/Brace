import React, { useState } from 'react';
import { IoMdClose } from 'react-icons/io';
import ProfileForm from './ProfileForm';
import ChangePasswordForm from './ChangePasswordForm';
import './Settings.css';

const Settings = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <div className="settings-overlay">
            <div className="settings-container">
                <div className="settings-header">
                    <h2>Settings</h2>
                    <button className="close-btn" onClick={onClose}>
                        <IoMdClose />
                    </button>
                </div>
                
                <div className="settings-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Profile
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
                        onClick={() => setActiveTab('password')}
                    >
                        Change Password
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
                        onClick={() => setActiveTab('preferences')}
                    >
                        Preferences
                    </button>
                </div>
                
                <div className="settings-content">
                    {activeTab === 'profile' && (
                        <ProfileForm onClose={() => {}} isEmbedded={true} onProfileUpdated={() => {}} />
                    )}
                    
                    {activeTab === 'password' && (
                        <ChangePasswordForm />
                    )}
                    
                    {activeTab === 'preferences' && (
                        <div className="preferences-section">
                            <h3>User Preferences</h3>
                            <p className="coming-soon">More preferences coming soon!</p>
                            
                            {/* Future preferences can be added here */}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings; 