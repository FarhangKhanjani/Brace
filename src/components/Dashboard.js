import React, { useState, useEffect } from 'react';
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

const API_URL = config.API_URL;

function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [showOrderForm, setShowOrderForm] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [activeTab, setActiveTab] = useState('orders');

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

    // Add these new handler functions
    const handleOrderEdit = async (updatedOrder) => {
        try {
            // Refresh orders after edit
            const ordersResponse = await axios.get(`${API_URL}/orders/${user.id}`);
            if (ordersResponse.data && ordersResponse.data.orders) {
                setOrders(ordersResponse.data.orders);
                // Update selected order if it's the one that was edited
                if (selectedOrder && selectedOrder.id === updatedOrder.id) {
                    setSelectedOrder(updatedOrder);
                }
            }
            
            // Show success message
            toast.success("Order updated successfully!");
        } catch (error) {
            console.error("Error refreshing orders after edit:", error);
            toast.error("Failed to refresh orders after edit");
        }
    };
    
    const handleOrderClose = async (closedOrder) => {
        try {
            // Refresh orders after closing
            const ordersResponse = await axios.get(`${API_URL}/orders/${user.id}`);
            if (ordersResponse.data && ordersResponse.data.orders) {
                setOrders(ordersResponse.data.orders);
                // Clear selected order if it was closed
                if (selectedOrder && selectedOrder.id === closedOrder.order_id) {
                    setSelectedOrder(null);
                }
            }
            
            // Show success message
            toast.success(`Order closed with ${parseFloat(closedOrder.profit_loss).toFixed(2)}% P/L`);
            
            // Switch to history tab
            setActiveTab('history');
        } catch (error) {
            console.error("Error refreshing orders after closing:", error);
            toast.error("Failed to refresh orders after closing");
        }
    };

    // If no user yet, show minimal content
    if (!user) {
        return <div className="dashboard">Connecting to your account...</div>;
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Welcome, {user?.user_metadata?.full_name || 'Trader'}</h1>
                <div className="dashboard-actions">
                    <button 
                        className="profile-btn" 
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
            </div>

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
                        <div className="orders-list">
                            <h2>Your Orders</h2>
                            <div className="orders-grid">
                                {orders.length > 0 ? (
                                    orders.map((order) => (
                                        <OrderCard 
                                            key={order.id} 
                                            order={order} 
                                            onClick={handleOrderClick}
                                        />
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
        </div>
    );
}

const OrderCard = ({ order, onClick }) => {
    // Extract date from ISO string
    const date = new Date(order.created_at).toLocaleString();
    
    // Add fallback for position_type if it doesn't exist in older orders
    const positionType = order.position_type || 'long'; // Default to 'long' if undefined
    
    return (
        <div className={`order-card ${positionType === 'short' ? 'short' : 'long'}`} onClick={() => onClick(order)}>
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