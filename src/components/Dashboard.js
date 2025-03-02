import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../supabase';
import './Dashboard.css';
import OrderForm from './OrderForm';
import ProfileUpdate from './ProfileUpdate';
import OrderTracker from './OrderTracker';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [showOrderForm, setShowOrderForm] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Get user and orders
    useEffect(() => {
        // Check if user is authenticated
        supabase.auth.getUser().then(({ data, error }) => {
            if (error || !data.user) {
                navigate('/login');
                return;
            }
            
            // Set basic user info
            setUser(data.user);
            
            // Get orders for this user
            axios.get(`${API_URL}/orders/${data.user.id}`)
                .then(response => {
                    if (response.data && response.data.orders) {
                        setOrders(response.data.orders);
                    }
                })
                .catch(err => {
                    console.error("Error fetching orders:", err);
                });
        });
    }, [navigate]);

    // Create Order button handler
    const handleCreateOrderClick = () => {
        setShowOrderForm(true);
        setError(null);
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
                // Refresh orders
                const ordersResponse = await axios.get(`${API_URL}/orders/${user.id}`);
                if (ordersResponse.data && ordersResponse.data.orders) {
                    setOrders(ordersResponse.data.orders);
                }
                
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

    // Update the Dashboard component to include an onDelete handler
    const handleOrderDelete = async (orderId) => {
        try {
            // Refresh orders after deletion
            const ordersResponse = await axios.get(`${API_URL}/orders/${user.id}`);
            if (ordersResponse.data && ordersResponse.data.orders) {
                setOrders(ordersResponse.data.orders);
                // Clear selected order if it was the one deleted
                if (selectedOrder && selectedOrder.id === orderId) {
                    setSelectedOrder(null);
                }
            }
            
            // Show success message
            setMessage("Order deleted successfully!");
            
            // Clear message after 3 seconds
            setTimeout(() => setMessage(""), 3000);
        } catch (error) {
            console.error("Error refreshing orders after deletion:", error);
            setError("Failed to refresh orders after deletion");
        }
    };

    // If no user yet, show minimal content
    if (!user) {
        return <div className="dashboard">Connecting to your account...</div>;
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Welcome, {user.email}</h1>
                <div className="dashboard-actions">
                    <button 
                        className="create-order-btn"
                        onClick={handleCreateOrderClick}
                    >
                        Create Order
                    </button>
                    <button 
                        className="profile-btn"
                        onClick={() => setShowProfileModal(true)}
                    >
                        Update Profile
                    </button>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            {showOrderForm && (
                <div className="order-form-overlay">
                    <div className="order-form-container">
                        <h2>Create New Order</h2>
                        <OrderForm 
                            onSubmit={handleOrderSubmit}
                            user={user}
                        />
                        <button 
                            className="cancel-btn"
                            onClick={() => setShowOrderForm(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {showProfileModal && (
                <ProfileUpdate 
                    user={user} 
                    onClose={() => setShowProfileModal(false)} 
                />
            )}

            <div className="orders-section">
                <h2>Your Orders</h2>
                <div className="orders-grid">
                    {orders.length > 0 ? (
                        orders.map((order) => (
                            <div 
                                key={order.id} 
                                className={`order-card ${selectedOrder?.id === order.id ? 'selected' : ''}`}
                                onClick={() => handleOrderClick(order)}
                            >
                                <div className="order-header">
                                    <h3>{order.symbol}</h3>
                                    <span className={`status-badge ${order.status}`}>{order.status}</span>
                                </div>
                                <div className="order-details">
                                    <div className="detail-row">
                                        <span className="detail-label">Entry Price:</span>
                                        <span className="detail-value">${parseFloat(order.entry_price).toFixed(2)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Stop Loss:</span>
                                        <span className="detail-value">${parseFloat(order.stop_loss).toFixed(2)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Take Profit:</span>
                                        <span className="detail-value">${parseFloat(order.take_profit).toFixed(2)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Created:</span>
                                        <span className="detail-value">{new Date(order.created_at).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No orders yet. Create your first order!</p>
                    )}
                </div>
            </div>

            {selectedOrder && (
                <div className="tracker-section">
                    <h2>Order Tracker</h2>
                    <OrderTracker 
                        order={selectedOrder} 
                        onDelete={handleOrderDelete} 
                    />
                </div>
            )}
        </div>
    );
}

export default Dashboard; 