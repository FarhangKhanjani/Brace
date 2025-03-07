import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import './Dashboard.css';
import OrderForm from './OrderForm';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import ProfileForm from './ProfileForm';
import { FaPlus, FaUserEdit, FaSync } from 'react-icons/fa';
import Notifications from './Notifications';

const Dashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
  const [showOrderForm, setShowOrderForm] = useState(false);
    const [userName, setUserName] = useState('');
    const [error, setError] = useState(null);
    const [debugInfo, setDebugInfo] = useState('');
    const [editingOrder, setEditingOrder] = useState(null);
    const [editFormData, setEditFormData] = useState({
    stop_loss: '',
    take_profit: ''
  });
    const [orderPrices, setOrderPrices] = useState({});
    const [loadingPrices, setLoadingPrices] = useState(false);
    const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'history'
    const [orderHistory, setOrderHistory] = useState([]);
    const [showProfileForm, setShowProfileForm] = useState(false);

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
    };

    // Get user name and fetch orders on component mount
  useEffect(() => {
        const getUserInfo = async () => {
            try {
                const { data } = await supabase.auth.getUser();
                
                if (data && data.user) {
                    // Get the user's profile to check for nickname
                    const { data: profileData } = await supabase
                        .from('users')
                        .select('nickname')
                        .eq('id', data.user.id)
                        .single();
                    
                    // Use nickname if available, otherwise use email prefix
                    if (profileData && profileData.nickname) {
                        setUserName(profileData.nickname);
    } else {
                        const email = data.user.email || '';
                        setUserName(email.split('@')[0]);
                    }
                }
                
                await fetchOrders();
            } catch (error) {
                console.error('Error getting user info:', error);
                setError('Failed to load user information');
                setLoading(false);
            }
        };
        
        getUserInfo();
    }, []);

    // Fetch orders from the database
    const fetchOrders = async () => {
        try {
            setLoading(true);
            
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                throw new Error('User not authenticated');
            }
            
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
                
            if (error) {
                throw error;
            }
            
            setDebugInfo(`Orders fetched: ${data ? data.length : 0}`);
            setOrders(data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setError('Failed to load orders');
            setLoading(false);
        }
    };

    // Handle order creation
    const handleOrderCreated = (newOrder) => {
        setOrders([newOrder, ...orders]);
        setShowOrderForm(false);
        toast.success('Order created successfully');
    };

    // Handle order deletion
    const handleDeleteOrder = async (orderId) => {
        try {
            if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
                return;
            }

            // Show a loading toast
            const loadingToast = toast.loading('Deleting order...');

            // Delete from orders table 
            const { error: orderError } = await supabase
                .from('orders')
                .delete()
                .eq('id', orderId);
                
            if (orderError) {
                throw orderError;
            }
            
            // Also delete from order_history if it exists there
            const { error: historyError } = await supabase
                .from('order_history')
                .delete()
                .eq('order_id', orderId);
            
            // We don't throw here because it's okay if no history record exists
            if (historyError) {
                console.warn('Note: Could not delete from order_history:', historyError);
            }
            
            // Update UI after successful deletion
            setOrders(orders.filter(order => order.id !== orderId));
            
            // Dismiss loading toast and show success
            toast.dismiss(loadingToast);
            toast.success('Order deleted permanently');
            
        } catch (error) {
            console.error('Error deleting order:', error);
            toast.error('Failed to delete order: ' + error.message);
        }
    };

    // Add the handleEditOrder function
    const handleEditOrder = (order) => {
        setEditingOrder(order);
        setEditFormData({
            stop_loss: order.stop_loss,
            take_profit: order.take_profit
    });
  };

    // Add the handleSaveEdit function
    const handleSaveEdit = async () => {
        try {
            if (!editingOrder) return;
            
            // Parse values
            const numericStopLoss = parseFloat(editFormData.stop_loss);
            const numericTakeProfit = parseFloat(editFormData.take_profit);
            
            // Validate inputs based on position type
            if (editingOrder.position_type === 'LONG') {
                if (numericStopLoss >= parseFloat(editingOrder.entry_price)) {
                    toast.error('For LONG positions, Stop Loss must be lower than Entry Price');
                    return;
                }
                if (numericTakeProfit <= parseFloat(editingOrder.entry_price)) {
                    toast.error('For LONG positions, Take Profit must be higher than Entry Price');
                    return;
                }
            } else { // SHORT
                if (numericStopLoss <= parseFloat(editingOrder.entry_price)) {
                    toast.error('For SHORT positions, Stop Loss must be higher than Entry Price');
                    return;
                }
                if (numericTakeProfit >= parseFloat(editingOrder.entry_price)) {
                    toast.error('For SHORT positions, Take Profit must be lower than Entry Price');
                    return;
                }
            }
            
            // Update in database
            const { error } = await supabase
                .from('orders')
                .update({
                    stop_loss: numericStopLoss,
                    take_profit: numericTakeProfit,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingOrder.id);
                
            if (error) throw error;
            
            // Update local state
            setOrders(orders.map(order => 
                order.id === editingOrder.id 
                    ? { ...order, stop_loss: numericStopLoss, take_profit: numericTakeProfit }
                    : order
            ));
            
            toast.success('Order updated successfully!');
            setEditingOrder(null);
            
        } catch (error) {
            console.error('Error updating order:', error);
            toast.error(`Failed to update order: ${error.message}`);
        }
    };

    // Add these input change handlers
    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData({
            ...editFormData,
            [name]: value
        });
    };

    // Add this useEffect to fetch current prices
    useEffect(() => {
        const fetchCurrentPrices = async () => {
            if (!orders.length) return;
            
            setLoadingPrices(true);
            // Group symbols by market type
            const cryptoSymbols = [...new Set(orders
                .filter(order => order.market_type === 'crypto' || !order.market_type)
                .map(order => order.symbol))];
                
            const forexPairs = [...new Set(orders
                .filter(order => order.market_type === 'forex')
                .map(order => order.symbol))];
            
            const pricesObj = {};
            
            try {
                // Fetch crypto prices
                for (const symbol of cryptoSymbols) {
                    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
                    const data = await response.json();
                    
                    if (data.price) {
                        pricesObj[`crypto_${symbol}`] = parseFloat(data.price);
                    }
                }
                
                // Fetch forex prices
                const alphaVantageKey = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;
                for (const pair of forexPairs) {
                    const [fromCurrency, toCurrency] = pair.split('/');
                    const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${alphaVantageKey}`;
                    
                    const response = await fetch(url);
                    const data = await response.json();
                    
                    if (data['Realtime Currency Exchange Rate']) {
                        pricesObj[`forex_${pair}`] = parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate']);
                    }
                }
                
                setOrderPrices(pricesObj);
            } catch (error) {
                console.error('Error fetching prices:', error);
            } finally {
                setLoadingPrices(false);
            }
        };
        
        fetchCurrentPrices();
        
        // Set up a refresh interval (every 30 seconds)
        const interval = setInterval(fetchCurrentPrices, 30000);
        
        return () => clearInterval(interval);
    }, [orders]);

    // Update the calculateProfitLoss function to handle market types
    const calculateProfitLoss = (order) => {
        const marketType = order.market_type || 'crypto';
        const priceKey = `${marketType}_${order.symbol}`;
        
        if (!orderPrices[priceKey]) return null;
        
        const currentPrice = orderPrices[priceKey];
        const entryPrice = parseFloat(order.entry_price);
        let profitLossPercent;
        
        if (order.position_type === 'LONG') {
            profitLossPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
        } else { // SHORT
            profitLossPercent = ((entryPrice - currentPrice) / entryPrice) * 100;
        }
        
        return profitLossPercent.toFixed(2);
    };

    // Add the handleCloseOrder function
    const handleCloseOrder = async (order) => {
        try {
            if (!window.confirm('Are you sure you want to close this order? This will record the result in your order history.')) {
                return;
            }
            
            // Need current price to calculate final profit/loss
            if (!orderPrices[order.symbol]) {
                toast.error('Cannot close order: Current price data unavailable');
                return;
            }
            
            const currentPrice = orderPrices[order.symbol];
            const entryPrice = parseFloat(order.entry_price);
            let profitLossPercent;
            
            if (order.position_type === 'LONG') {
                profitLossPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
            } else { // SHORT
                profitLossPercent = ((entryPrice - currentPrice) / entryPrice) * 100;
            }
            
            // Show a loading toast
            const loadingToast = toast.loading('Closing order...');
            
            // First, add to order_history with explicit ID to avoid constraint violation
            const { error: historyError } = await supabase
                .from('order_history')
                .insert([
                    {
                        id: uuidv4(), // Generate our own UUID
                        order_id: order.id,
                        user_id: order.user_id,
                        symbol: order.symbol,
                        entry_price: order.entry_price,
                        stop_loss: order.stop_loss,
                        take_profit: order.take_profit,
                        position_type: order.position_type,
                        close_price: currentPrice,
                        profit_loss: profitLossPercent.toFixed(2),
                        close_reason: 'manual_close',
                        created_at: order.created_at,
                        closed_at: new Date().toISOString()
                    }
                ]);
            
            if (historyError) {
                throw historyError;
            }
            
            // Then, delete the original order
            const { error: deleteError } = await supabase
                .from('orders')
                .delete()
                .eq('id', order.id);
                
            if (deleteError) {
                throw deleteError;
            }
            
            // Dismiss loading toast and show success
            toast.dismiss(loadingToast);
            toast.success(`Order closed with ${profitLossPercent >= 0 ? 'profit' : 'loss'} of ${Math.abs(profitLossPercent).toFixed(2)}%`);
            
            // Refresh orders list
            fetchOrders();
            
        } catch (error) {
            console.error('Error closing order:', error);
            toast.error('Failed to close order: ' + error.message);
        }
    };

    // Add a function to fetch order history
    const fetchOrderHistory = async () => {
        try {
            setLoading(true);
            
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                throw new Error('User not authenticated');
            }
            
            const { data, error } = await supabase
                .from('order_history')
                .select('*')
                .eq('user_id', user.id)
                .order('closed_at', { ascending: false });
                
            if (error) {
                throw error;
            }
            
            return data || [];
        } catch (error) {
            console.error('Error fetching order history:', error);
            setError('Failed to load order history');
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Modify the component to handle tab switching
    useEffect(() => {
        if (activeTab === 'history') {
            const getHistory = async () => {
                const history = await fetchOrderHistory();
                setOrderHistory(history);
            };
            getHistory();
        } else {
            fetchOrders();
        }
    }, [activeTab]);

    // Add a function to handle profile updates
    const handleProfileUpdated = (updatedProfile) => {
        if (updatedProfile.nickname) {
            setUserName(updatedProfile.nickname);
        }
        // Refresh any other user data if needed
    };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
                <div className="welcome-message">
                    <h1>Welcome, {userName}!</h1>
                </div>
                <div className="dashboard-actions">
                    <Notifications />
                    <button 
                        className="action-button profile-button"
                        onClick={() => setShowProfileForm(true)}
                    >
                        <FaUserEdit /> Edit Profile
                    </button>
                    <button 
                        className="action-button refresh-button" 
                        onClick={fetchOrders}
                    >
                        <FaSync /> Refresh Orders
                    </button>
                </div>
            </div>
            
            {/* Debug info - only in development */}
            {process.env.NODE_ENV === 'development' && (
                <div className="debug-info">
                    <details>
                        <summary>Debug Info</summary>
                        <pre>{debugInfo}</pre>
                    </details>
                </div>
            )}
            
            {/* Tab Navigation */}
            <div className="dashboard-tabs">
                <button
                    className={`dashboard-tab ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    Active Orders
                </button>
                <button
                    className={`dashboard-tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    Order History
                </button>
            </div>
            
            {/* Action Buttons */}
            <div className="orders-header">
                <h2>Your Orders</h2>
                <button 
                    className="action-button add-order-button"
                    onClick={() => setShowOrderForm(true)}
                >
                    <FaPlus /> Add New Order
                </button>
            </div>
            
            {/* Content based on active tab */}
            {activeTab === 'orders' ? (
                <>
                    <h2 className="section-title">Your Orders</h2>
                    {loading ? (
                        <div className="loading-indicator">
                            Loading orders...
                        </div>
                    ) : error ? (
                        <div className="error-message">
                            {error}
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="no-orders">
                            <p>You don't have any orders yet. Click "Add New Order" to create one.</p>
                        </div>
                    ) : (
                        <div className="orders-grid">
                            {orders.map(order => {
                                const positionType = order.position_type || 'long';
                                
                                return (
                                    <div key={order.id} className="order-card">
                                        <div className="order-header">
                                            <h3>{order.symbol}</h3>
                                            <span className={`position-type ${order.position_type.toLowerCase()}`}>
                                                {order.position_type}
                                            </span>
                                        </div>
                                        
                                        {editingOrder && editingOrder.id === order.id ? (
                                            // Edit mode
                                            <div className="order-edit-form">
                <div className="form-group">
                                                    <label>Stop Loss ($)</label>
                  <input
                    type="number"
                    name="stop_loss"
                                                        value={editFormData.stop_loss}
                                                        onChange={handleEditInputChange}
                                                        step="0.01"
                  />
                </div>
                <div className="form-group">
                                                    <label>Take Profit ($)</label>
                  <input
                    type="number"
                    name="take_profit"
                                                        value={editFormData.take_profit}
                                                        onChange={handleEditInputChange}
                                                        step="0.01"
                  />
                </div>
                                                <div className="edit-actions">
                                                    <button 
                                                        className="save-btn" 
                                                        onClick={handleSaveEdit}
                                                    >
                                                        Save
                                                    </button>
                  <button 
                    className="cancel-btn"
                                                        onClick={() => setEditingOrder(null)}
                  >
                    Cancel
                  </button>
                </div>
                                            </div>
                                        ) : (
                                            // View mode
                                            <>
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
                                                        <span className="detail-value">
                                                            {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Current Price & Profit/Loss Display */}
                                                    {(() => {
                                                        const marketType = order.market_type || 'crypto';
                                                        const priceKey = `${marketType}_${order.symbol}`;
                                                        return orderPrices[priceKey] && (
                                                            <>
                                                                <div className="detail-row current-price">
                                                                    <span className="detail-label">Current Price:</span>
                                                                    <span className="detail-value">
                                                                        {marketType === 'forex' ? '' : '$'}
                                                                        {orderPrices[priceKey].toFixed(marketType === 'forex' ? 4 : 2)}
                                                                    </span>
                                                                </div>
                                                                
                                                                <div className="detail-row profit-loss">
                                                                    <span className="detail-label">Profit/Loss:</span>
                                                                    <span className={`detail-value ${parseFloat(calculateProfitLoss(order)) >= 0 ? 'positive' : 'negative'}`}>
                                                                        {parseFloat(calculateProfitLoss(order)) >= 0 ? '+' : ''}
                                                                        {calculateProfitLoss(order)}%
                                                                    </span>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                                
                                                <div className="order-actions">
                                                    <button 
                                                        className="edit-btn" 
                                                        onClick={() => handleEditOrder(order)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        className="close-btn" 
                                                        onClick={() => handleCloseOrder(order)}
                                                    >
                                                        Close Position
                                                    </button>
                                                    <button 
                                                        className="delete-btn" 
                                                        onClick={() => handleDeleteOrder(order.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            ) : (
                <>
                    <h2 className="section-title">Order History</h2>
                    <div className="order-history-container">
                        {loading ? (
                            <div className="loading-message">Loading order history...</div>
                        ) : orderHistory.length === 0 ? (
                            <div className="no-orders-message">No closed orders yet</div>
                        ) : (
                            <div className="history-grid">
                                {orderHistory.map(order => (
                                    <div 
                                        key={order.id} 
                                        className={`history-card ${parseFloat(order.profit_loss) >= 0 ? 'profit' : 'loss'}`}
                                    >
                                        <div className="history-header">
                                            <div className="history-symbol">{order.symbol}</div>
                                            <div className={`history-position ${order.position_type.toLowerCase()}`}>
                                                {order.position_type}
                                            </div>
                                        </div>
                                        
                                        <div className="history-result">
                                            <span className={`profit-loss-value ${parseFloat(order.profit_loss) >= 0 ? 'positive' : 'negative'}`}>
                                                {parseFloat(order.profit_loss) >= 0 ? '+' : ''}
                                                {parseFloat(order.profit_loss).toFixed(2)}%
                                            </span>
                                        </div>
                                        
                                        <div className="history-details">
                                            <div className="history-prices">
                                                <div className="price-row">
                                                    <span className="price-label">Entry:</span>
                                                    <span className="price-value">${parseFloat(order.entry_price).toFixed(2)}</span>
                                                </div>
                                                <div className="price-row">
                                                    <span className="price-label">Close:</span>
                                                    <span className="price-value">${parseFloat(order.close_price).toFixed(2)}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="history-dates">
                                                <div className="date-row">
                                                    <span className="date-label">Opened:</span>
                                                    <span className="date-value">{formatDate(order.created_at)}</span>
                                                </div>
                                                <div className="date-row">
                                                    <span className="date-label">Closed:</span>
                                                    <span className="date-value">{formatDate(order.closed_at)}</span>
                                                </div>
                                            </div>
            </div>
                                    </div>
                                ))}
          </div>
        )}
      </div>
                </>
            )}

            {showProfileForm && (
                <div className="modal-overlay">
                    <ProfileForm 
                        onClose={() => setShowProfileForm(false)}
                        onProfileUpdated={handleProfileUpdated}
                    />
                </div>
            )}

            {showOrderForm && (
                <div className="modal-overlay">
                    <OrderForm 
                        onClose={() => setShowOrderForm(false)}
                        onOrderCreated={(newOrder) => {
                            setShowOrderForm(false);
                            fetchOrders();
                        }}
                    />
                </div>
            )}
    </div>
  );
};

export default Dashboard; 