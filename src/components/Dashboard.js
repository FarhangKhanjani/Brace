import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../supabase';
import './Dashboard.css';
import OrderForm from './OrderForm';
import ProfileUpdate from './ProfileUpdate';
import OrderTracker from './OrderTracker';
import OrderHistory from './OrderHistory';
import { toast } from 'react-toastify';
import config from '../config';
import ProfileSection from './ProfileSection';
import BlogSection from './BlogSection';

const API_URL = config.API_URL;

const Dashboard = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderForm, setShowOrderForm] = useState(false);
    const [showOrderTracker, setShowOrderTracker] = useState(false);
    const [user, setUser] = useState(null);
    const [userLoaded, setUserLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('orders');
    const [showProfileModal, setShowProfileModal] = useState(false);

    useEffect(() => {
        // Get the current user
        const getCurrentUser = async () => {
            try {
                const { data, error } = await supabase.auth.getUser();
                
                if (error) {
                    throw error;
                }
                
                if (data && data.user) {
                    setUser(data.user);
                }
            } catch (error) {
                console.error('Error getting user:', error);
                toast.error('Failed to get user information');
            } finally {
                setUserLoaded(true);
            }
        };
        
        getCurrentUser();
    }, []);

    useEffect(() => {
        // Only fetch orders if we have a user
        if (user) {
            fetchOrders();
        }
    }, [user]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            
            // Fetch orders from your API or database
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
                
            if (error) {
                throw error;
            }
            
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    // Handle order submission
    const handleOrderSubmit = async (orderData) => {
        if (!user) return;
        
        try {
            setError(null);
            
            // Log the complete order data with user ID
            const completeOrderData = {
                ...orderData,
                user_id: user.id
            };
            
            console.log("Complete order data:", completeOrderData);
            
            // First ensure user exists in database
            await axios.post(`${API_URL}/ensure-user`, {
                id: user.id,
                email: user.email
            });
            
            // Then create the order with the user_id explicitly included
            const response = await axios.post(`${API_URL}/orders`, completeOrderData);
            
            console.log("Order creation response:", response.data);
            
            if (response.data) {
                // Fetch all orders again to ensure we have the latest data
                fetchOrders();
                
                setShowOrderForm(false);
                setMessage("Order created successfully!");
                
                // Clear message after 3 seconds
                setTimeout(() => setMessage(""), 3000);
            }
        } catch (error) {
            console.error("Order submission error:", error.response?.data || error);
            setError(error.response?.data?.detail || "Failed to create order. Please try again.");
        }
    };

    const handleOrderClick = (order) => {
        setSelectedOrder(order);
    };

    const handleOrderDelete = async (orderId) => {
        if (!user) return;
        
        try {
            await axios.delete(`${API_URL}/orders/${orderId}`);
            
            // Fetch all orders again to ensure we have the latest data
            fetchOrders();
            
            // Clear selected order if it was the one deleted
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder(null);
            }
            
            // Show success message
            toast.success("Order deleted successfully");
        } catch (error) {
            console.error("Error deleting order:", error);
            toast.error("Failed to delete order");
        }
    };

    const handleOrderEdit = async (updatedOrder) => {
        if (!user) return;
        
        try {
            await axios.put(`${API_URL}/orders/${updatedOrder.id}`, updatedOrder);
            
            // Fetch all orders again to ensure we have the latest data
            fetchOrders();
            
            // Update selected order if it's the one that was edited
            if (selectedOrder && selectedOrder.id === updatedOrder.id) {
                setSelectedOrder(updatedOrder);
            }
            
            // Show success message
            toast.success("Order updated successfully");
        } catch (error) {
            console.error("Error updating order:", error);
            toast.error("Failed to update order");
        }
    };

    const handleOrderClose = async (closedOrder) => {
        if (!user) return;
        
        try {
            // Fetch all orders again to ensure we have the latest data
            fetchOrders();
            
            // Clear selected order if it was closed
            if (selectedOrder && selectedOrder.id === closedOrder.order_id) {
                setSelectedOrder(null);
            }
            
            // Show success message
            toast.success("Order closed successfully");
        } catch (error) {
            console.error("Error handling closed order:", error);
            toast.error("Failed to process closed order");
        }
    };

    // If user data is still loading, show a loading indicator
    if (!userLoaded) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    // If no user is found after loading, handle this case
    if (!user) {
        return (
            <div className="dashboard-error">
                <h2>Authentication Error</h2>
                <p>Unable to load user data. Please try logging in again.</p>
                <button onClick={() => window.location.href = '/login'}>
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>Welcome, {user ? user.email.split('@')[0] : 'Trader'}</h1>
                <div className="header-actions">
                    <button 
                        className="update-profile-btn" 
                        onClick={() => setShowProfileModal(true)}
                    >
                        Update Profile
                    </button>
                    <button 
                        className="add-order-btn" 
                        onClick={() => setShowOrderForm(true)}
                    >
                        Add New Order
                    </button>
                </div>
            </header>
            
            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}
            
            <div className="dashboard-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    Active Orders
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    Order History
                </button>
            </div>
            
            <div className="tab-content">
                {activeTab === 'orders' && (
                    <div className="orders-container">
                        <div className="orders-section">
                            <h2>Your Orders</h2>
                            {loading ? (
                                <div className="loading-indicator">Loading orders...</div>
                            ) : (
                                <div className="orders-grid">
                                    {orders.length > 0 ? (
                                        orders.map((order) => (
                                            <OrderCard 
                                                key={order.id} 
                                                order={order} 
                                                onClick={handleOrderClick}
                                                isSelected={selectedOrder && selectedOrder.id === order.id}
                                            />
                                        ))
                                    ) : (
                                        <p>No orders yet. Create your first order!</p>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {selectedOrder && (
                            <div className="tracker-section">
                                <h2>Order Tracker</h2>
                                <OrderTracker 
                                    order={selectedOrder} 
                                    onDelete={handleOrderDelete}
                                    onEdit={handleOrderEdit}
                                    onClose={handleOrderClose}
                                />
                            </div>
                        )}
                    </div>
                )}
                
                {activeTab === 'history' && (
                    <div className="history-container">
                        {user && <OrderHistory userId={user.id} />}
                    </div>
                )}
            </div>

            {showOrderForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <OrderForm 
                            onSubmit={handleOrderSubmit} 
                            user={user} 
                            onCancel={() => setShowOrderForm(false)}
                        />
                    </div>
                </div>
            )}

            {showProfileModal && (
                <ProfileUpdate 
                    user={user} 
                    onClose={() => setShowProfileModal(false)} 
                />
            )}

            <div className="profile-blog-container">
                <ProfileSection userId={user.id} />
                <BlogSection userId={user.id} isCurrentUser={true} />
            </div>
        </div>
    );
};

const OrderCard = ({ order, onClick, isSelected }) => {
    // Extract date from ISO string
    const date = new Date(order.created_at).toLocaleString();
    
    // Add fallback for position_type if it doesn't exist in older orders
    const positionType = order.position_type || 'long'; // Default to 'long' if undefined
    
    return (
        <div 
            className={`order-card ${positionType === 'short' ? 'short' : 'long'} ${isSelected ? 'selected' : ''}`} 
            onClick={() => onClick(order)}
        >
            <div className="order-header">
                <div className="order-symbol">{order.symbol}</div>
                <div className={`order-position-type ${positionType}`}>
                    {positionType.toUpperCase()}
                </div>
                <div className="order-status">{order.status.toUpperCase()}</div>
            </div>
            <div className="order-details">
                <div className="detail-row">
                    <span className="detail-label">Entry Price:</span>
                    <span className="detail-value">{parseFloat(order.entry_price).toFixed(2)}</span>
                </div>
                <div className="detail-row">
                    <span className="detail-label">Stop Loss:</span>
                    <span className="detail-value">{parseFloat(order.stop_loss).toFixed(2)}</span>
                </div>
                <div className="detail-row">
                    <span className="detail-label">Take Profit:</span>
                    <span className="detail-value">{parseFloat(order.take_profit).toFixed(2)}</span>
                </div>
                <div className="detail-row created-at">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">{date}</span>
                </div>
            </div>
        </div>
    );
};

export default Dashboard; 