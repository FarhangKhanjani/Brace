import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../supabase';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/forex-crypto';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [showOrderForm, setShowOrderForm] = useState(false);
    const [showProfileForm, setShowProfileForm] = useState(false);
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState('');
    const [profileData, setProfileData] = useState({
        email: '',
        full_name: '',
        birth_date: '',
        nickname: '',
        gender: 'male'
    });
    const [orderData, setOrderData] = useState({
        symbol: '',
        entry_price: '',
        stop_loss: '',
        take_profit: ''
    });

    const fetchOrders = React.useCallback(async () => {
        try {
            if (user) {
                const response = await axios.get(`${API_URL}/orders/${user.id}`);
                if (response.data && response.data.orders) {
                    setOrders(response.data.orders);
                }
            }
        } catch (err) {
            setError('Failed to fetch orders: ' + err.message);
        }
    }, [user]);

    useEffect(() => {
        const getUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                console.log('Auth user:', user);
                setUser(user);
                
                if (user) {
                    const { data: profile, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('email', user.email)
                        .single();
                    
                    console.log('Fetched profile:', profile);

                    if (error && error.code !== 'PGRST116') {
                        throw error;
                    }

                    if (profile) {
                        setProfileData({
                            email: user.email,
                            full_name: profile.full_name || '',
                            birth_date: profile.birth_date || '',
                            nickname: profile.nickname || '',
                            gender: profile.gender || 'male'
                        });
                    } else {
                        // Initialize with default values if no profile exists
                        setProfileData({
                            email: user.email,
                            full_name: '',
                            birth_date: '',
                            nickname: '',
                            gender: 'male'
                        });
                    }

                    // Fetch orders
                    fetchOrders();
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                setError('Failed to load user data');
            }
        };

        getUser();
    }, [fetchOrders]);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log('Updating profile with:', profileData);

            // First check if profile exists
            const { data: existingProfile, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('email', user.email)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }

            const profileUpdate = {
                email: user.email,
                full_name: profileData.full_name,
                birth_date: profileData.birth_date,
                nickname: profileData.nickname,
                gender: profileData.gender,
                updated_at: new Date().toISOString()
            };

            let result;
            if (!existingProfile) {
                result = await supabase
                    .from('users')
                    .insert([{ 
                        ...profileUpdate, 
                        created_at: new Date().toISOString() 
                    }])
                    .select()
                    .single();
            } else {
                result = await supabase
                    .from('users')
                    .update(profileUpdate)
                    .eq('email', user.email)
                    .select()
                    .single();
            }

            const { data, error } = result;

            if (error) {
                throw error;
            }

            // Update local state with the new data
            if (data) {
                setProfileData(prev => ({
                    ...prev,
                    ...data
                }));
                setUser(prev => ({
                    ...prev,
                    user_metadata: {
                        ...prev.user_metadata,
                        full_name: data.full_name
                    }
                }));
            }

            // Close the form and show success message
            setShowProfileForm(false);
            
            // Create a temporary success message div
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.textContent = 'Profile Updated Successfully!';
            document.body.appendChild(successMessage);

            // Remove the message after 3 seconds
            setTimeout(() => {
                successMessage.remove();
            }, 3000);

        } catch (error) {
            console.error('Error updating profile:', error);
            setError('Failed to update profile: ' + error.message);
        }
    };

    const handleCreateOrder = async (e) => {
        e.preventDefault();
        try {
            setError('');
            console.log('Creating order with:', {
                user_id: user.id,
                symbol: orderData.symbol,
                entry_price: orderData.entry_price,
                stop_loss: orderData.stop_loss,
                take_profit: orderData.take_profit
            });

            const response = await axios.post(`${API_URL}/orders`, {
                user_id: user.id,
                symbol: orderData.symbol,
                entry_price: Number(orderData.entry_price),
                stop_loss: Number(orderData.stop_loss),
                take_profit: Number(orderData.take_profit)
            });

            console.log('Order creation response:', response);

            if (response.data) {
                setShowOrderForm(false);
                setOrderData({
                    symbol: '',
                    entry_price: '',
                    stop_loss: '',
                    take_profit: ''
                });

                // Refresh orders list
                await fetchOrders();

                // Show success message
                const successMessage = document.createElement('div');
                successMessage.className = 'success-message';
                successMessage.textContent = 'Order Created Successfully!';
                document.body.appendChild(successMessage);
                setTimeout(() => successMessage.remove(), 3000);
            }
        } catch (error) {
            console.error('Error creating order:', error);
            const errorMessage = error.response?.data?.detail || error.message || 'Failed to create order';
            setError(errorMessage);
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Welcome, {profileData.full_name || user?.email}</h1>
                <div className="dashboard-actions">
                    <button 
                        onClick={() => setShowProfileForm(true)} 
                        className="profile-btn"
                    >
                        Update Profile
                    </button>
                    <button 
                        onClick={() => setShowOrderForm(true)} 
                        className="create-order-btn"
                    >
                        Create New Order
                    </button>
                </div>
            </div>

            {/* Add Orders Display */}
            <div className="orders-section">
                <h3>Your Orders</h3>
                {error && <div className="error-message">{error}</div>}
                <div className="orders-grid">
                    {orders.map((order) => (
                        <div key={order.id} className="order-card">
                            <div className="order-header">
                                <h4>{order.symbol}</h4>
                                <span className={`status status-${order.status.toLowerCase()}`}>
                                    {order.status}
                                </span>
                            </div>
                            <div className="order-details">
                                <div className="price-info">
                                    <p>Entry Price: ${order.entry_price}</p>
                                    <p className="stop-loss">Stop Loss: ${order.stop_loss}</p>
                                    <p className="take-profit">Take Profit: ${order.take_profit}</p>
                                </div>
                                <div className="order-date">
                                    Created: {new Date(order.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Profile Form Modal */}
            {showProfileForm && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <h2>Update Profile</h2>
                        <form onSubmit={handleProfileSubmit}>
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={profileData.email}
                                    disabled
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="full_name">Full Name</label>
                                <input
                                    id="full_name"
                                    type="text"
                                    value={profileData.full_name || ''}
                                    onChange={(e) => setProfileData({
                                        ...profileData,
                                        full_name: e.target.value
                                    })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="birth_date">Birth Date</label>
                                <input
                                    id="birth_date"
                                    type="date"
                                    value={profileData.birth_date || ''}
                                    onChange={(e) => setProfileData({
                                        ...profileData,
                                        birth_date: e.target.value
                                    })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="nickname">Nickname</label>
                                <input
                                    id="nickname"
                                    type="text"
                                    value={profileData.nickname || ''}
                                    onChange={(e) => setProfileData({
                                        ...profileData,
                                        nickname: e.target.value
                                    })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="gender">Gender</label>
                                <select
                                    id="gender"
                                    value={profileData.gender || 'male'}
                                    onChange={(e) => setProfileData({
                                        ...profileData,
                                        gender: e.target.value
                                    })}
                                    required
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="form-buttons">
                                <button type="submit" className="submit-btn">
                                    Save Profile
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setShowProfileForm(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showOrderForm && (
                <div className="order-form-overlay">
                    <div className="order-form-container">
                        <h2>Create New Order</h2>
                        <form onSubmit={handleCreateOrder}>
                            <div className="form-group">
                                <label htmlFor="symbol">Symbol</label>
                                <input
                                    id="symbol"
                                    type="text"
                                    value={orderData.symbol}
                                    onChange={(e) => setOrderData({
                                        ...orderData,
                                        symbol: e.target.value.toUpperCase()
                                    })}
                                    placeholder="BTC"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="entry_price">Entry Price</label>
                                <input
                                    id="entry_price"
                                    type="number"
                                    value={orderData.entry_price}
                                    onChange={(e) => setOrderData({
                                        ...orderData,
                                        entry_price: e.target.value
                                    })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="stop_loss">Stop Loss</label>
                                <input
                                    id="stop_loss"
                                    type="number"
                                    value={orderData.stop_loss}
                                    onChange={(e) => setOrderData({
                                        ...orderData,
                                        stop_loss: e.target.value
                                    })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="take_profit">Take Profit</label>
                                <input
                                    id="take_profit"
                                    type="number"
                                    value={orderData.take_profit}
                                    onChange={(e) => setOrderData({
                                        ...orderData,
                                        take_profit: e.target.value
                                    })}
                                    required
                                />
                            </div>
                            <div className="form-buttons">
                                <button type="submit" className="submit-btn">
                                    Create Order
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setShowOrderForm(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard; 