import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import './CommunityTrades.css';
import { toast } from 'react-hot-toast';

const CommunityTrades = () => {
    const [activeOrders, setActiveOrders] = useState([]);
    const [completedTrades, setCompletedTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('active'); // 'active' or 'completed'
    
    useEffect(() => {
        if (viewMode === 'active') {
            fetchPublicActiveOrders();
        } else {
            fetchCompletedTrades();
        }
    }, [viewMode]);
    
    // Fetch active public orders (your current logic)
    const fetchPublicActiveOrders = async () => {
        try {
            setLoading(true);
            
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                throw new Error('User not authenticated');
            }
            
            console.log("Current user ID:", user.id); // Debug current user
            
            // Fetch community trades - orders shared by other users
            const { data, error } = await supabase
                .from('orders')
                .select('*, profiles(username)')
                .eq('is_public', true)
                //.neq('user_id', user.id) // Temporarily comment this to see ALL orders
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            console.log("All public orders:", data); // Debug all retrieved orders
            
            // Add price data to each order
            const ordersWithPrices = await addPricesToOrders(data);
            console.log("Orders with prices:", ordersWithPrices); // Debug final data
            setActiveOrders(ordersWithPrices);
        } catch (err) {
            console.error('Error fetching community trades:', err);
            setError(err.message);
            toast.error('Failed to load community trades');
        } finally {
            setLoading(false);
        }
    };
    
    // Fetch completed trades from order_history
    const fetchCompletedTrades = async () => {
        try {
            setLoading(true);
            
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                throw new Error('User not authenticated');
            }
            
            // Fetch successful trades from order_history
            const { data, error } = await supabase
                .from('order_history')
                .select(`
                    id,
                    symbol,
                    position_type,
                    entry_price,
                    close_price,
                    profit_loss,
                    closed_at,
                    market_type,
                    stop_loss,
                    take_profit,
                    is_public,
                    profiles:user_id(username)
                `)
                .eq('is_public', true)
                .neq('user_id', user.id)
                .order('closed_at', { ascending: false })
                .limit(20); // Show 20 most recent trades
                
            if (error) throw error;
            
            setCompletedTrades(data);
        } catch (err) {
            console.error('Error fetching completed trades:', err);
            setError(err.message);
            toast.error('Failed to load completed trades');
        } finally {
            setLoading(false);
        }
    };
    
    // Improved addPricesToOrders function
    const addPricesToOrders = async (orders) => {
        try {
            if (!orders || orders.length === 0) {
                console.log("No orders to process");
                return [];
            }

            // Get current prices for all symbols
            const { data: prices, error } = await supabase
                .from('prices')
                .select('*');
                
            if (error) {
                console.error("Error fetching prices:", error);
                throw error;
            }
            
            console.log("Fetched prices:", prices); // Debug prices
            
            // Create a map of prices by symbol
            const priceMap = {};
            if (prices && prices.length > 0) {
                prices.forEach(price => {
                    if (price && price.symbol) {
                        priceMap[price.symbol] = price.current_price;
                    }
                });
            }
            
            console.log("Price map:", priceMap); // Debug price map
            
            // Add current price to each order
            return orders.map(order => {
                if (!order) return null;
                
                let symbol;
                try {
                    symbol = order.market_type === 'crypto' 
                        ? `crypto_${order.symbol.replace('USDT', '')}`
                        : `forex_${order.symbol}`;
                } catch (e) {
                    console.error("Error parsing symbol:", e, order);
                    symbol = '';
                }
                
                const currentPrice = priceMap[symbol] || null;
                
                return {
                    ...order,
                    current_price: currentPrice
                };
            }).filter(Boolean); // Remove any null entries
        } catch (err) {
            console.error("Error in addPricesToOrders:", err);
            return orders; // Return original orders on error
        }
    };
    
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
    
    // Calculate profit/loss percentage
    const calculateProfitLoss = (order) => {
        if (!order.current_price) return 0;
        
        const entryPrice = parseFloat(order.entry_price);
        const currentPrice = parseFloat(order.current_price);
        
        if (order.position_type === 'LONG') {
            return ((currentPrice - entryPrice) / entryPrice) * 100;
        } else {
            return ((entryPrice - currentPrice) / entryPrice) * 100;
        }
    };
    
    return (
        <div className="community-trades-container">
            <h2>Community Trades</h2>
            
            <div className="view-mode-selector">
                <button 
                    className={`view-mode-btn ${viewMode === 'active' ? 'active' : ''}`}
                    onClick={() => setViewMode('active')}
                >
                    Active Orders
                </button>
                <button 
                    className={`view-mode-btn ${viewMode === 'completed' ? 'active' : ''}`}
                    onClick={() => setViewMode('completed')}
                >
                    Completed Trades
                </button>
            </div>
            
            {loading ? (
                <div className="loading-indicator">Loading community trades...</div>
            ) : error ? (
                <div className="error-message">{error}</div>
            ) : viewMode === 'active' ? (
                activeOrders.length === 0 ? (
                    <div className="no-orders">No active public orders available</div>
                ) : (
                    <div className="orders-grid">
                        {activeOrders.map(order => {
                            const profitLoss = calculateProfitLoss(order);
                            const isProfitable = profitLoss > 0;
                            
                            return (
                                <div className="order-card" key={order.id}>
                                    <div className="order-header">
                                        <h3>{order.symbol}</h3>
                                        <span className={`position-tag ${order.position_type === 'LONG' ? 'long' : 'short'}`}>
                                            {order.position_type}
                                        </span>
                                    </div>
                                    
                                    <div className="order-details">
                                        <div className="detail-row">
                                            <span className="detail-label">Trader:</span>
                                            <span className="detail-value">{order.profiles?.username || 'Anonymous'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Entry Price:</span>
                                            <span className="detail-value">${parseFloat(order.entry_price).toFixed(2)}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Current Price:</span>
                                            <span className="detail-value">${parseFloat(order.current_price || order.entry_price).toFixed(2)}</span>
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
                                            <span className="detail-value">{formatDate(order.created_at)}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Profit/Loss:</span>
                                            <span className={`detail-value ${isProfitable ? 'profit' : 'loss'}`}>
                                                {profitLoss.toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                completedTrades.length === 0 ? (
                    <div className="no-orders">No completed public trades available</div>
                ) : (
                    <div className="orders-grid">
                        {completedTrades.map(trade => (
                            <div className="order-card" key={trade.id}>
                                <div className="order-header">
                                    <h3>{trade.symbol}</h3>
                                    <span className={`position-tag ${trade.position_type === 'LONG' ? 'long' : 'short'}`}>
                                        {trade.position_type}
                                    </span>
                                </div>
                                
                                <div className="order-details">
                                    <div className="detail-row">
                                        <span className="detail-label">Trader:</span>
                                        <span className="detail-value">{trade.profiles?.username || 'Anonymous'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Entry Price:</span>
                                        <span className="detail-value">{parseFloat(trade.entry_price).toFixed(2)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Exit Price:</span>
                                        <span className="detail-value">{parseFloat(trade.close_price).toFixed(2)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Stop Loss:</span>
                                        <span className="detail-value">{parseFloat(trade.stop_loss).toFixed(2)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Take Profit:</span>
                                        <span className="detail-value">{parseFloat(trade.take_profit).toFixed(2)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Closed At:</span>
                                        <span className="detail-value">{formatDate(trade.closed_at)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="detail-label">Profit/Loss:</span>
                                        <span className={`detail-value ${parseFloat(trade.profit_loss) > 0 ? 'profit' : 'loss'}`}>
                                            {parseFloat(trade.profit_loss).toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
            
            <button className="refresh-btn" onClick={viewMode === 'active' ? fetchPublicActiveOrders : fetchCompletedTrades}>
                Refresh Community Trades
            </button>
        </div>
    );
};

export default CommunityTrades; 