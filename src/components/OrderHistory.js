import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './OrderHistory.css';
import config from '../config';

const API_URL = config.API_URL;

const OrderHistory = ({ userId }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalOrders: 0,
        profitableOrders: 0,
        averageProfitLoss: 0,
        totalProfitLoss: 0
    });
    
    useEffect(() => {
        const fetchOrderHistory = async () => {
            try {
                const response = await axios.get(`${API_URL}/order-history/${userId}`);
                if (response.data && response.data.history) {
                    setHistory(response.data.history);
                    calculateStats(response.data.history);
                }
                setLoading(false);
            } catch (err) {
                console.error("Error fetching order history:", err);
                setError("Failed to fetch order history");
                setLoading(false);
            }
        };
        
        if (userId) {
            fetchOrderHistory();
        }
    }, [userId]);
    
    const calculateStats = (orderHistory) => {
        if (!orderHistory.length) {
            setStats({
                totalOrders: 0,
                profitableOrders: 0,
                averageProfitLoss: 0,
                totalProfitLoss: 0
            });
            return;
        }
        
        const total = orderHistory.length;
        const profitable = orderHistory.filter(order => parseFloat(order.profit_loss) > 0).length;
        const totalPL = orderHistory.reduce((sum, order) => sum + parseFloat(order.profit_loss), 0);
        const avgPL = totalPL / total;
        
        setStats({
            totalOrders: total,
            profitableOrders: profitable,
            averageProfitLoss: avgPL.toFixed(2),
            totalProfitLoss: totalPL.toFixed(2)
        });
    };
    
    if (loading) return <div className="history-loading">Loading order history...</div>;
    if (error) return <div className="history-error">{error}</div>;
    
    return (
        <div className="order-history">
            <div className="history-header">
                <h2>Order History</h2>
                <div className="history-stats">
                    <div className="stat-item">
                        <span className="stat-label">Total Orders:</span>
                        <span className="stat-value">{stats.totalOrders}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Win Rate:</span>
                        <span className="stat-value">
                            {stats.totalOrders ? 
                                `${((stats.profitableOrders / stats.totalOrders) * 100).toFixed(1)}%` : 
                                '0%'
                            }
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Avg P/L:</span>
                        <span className={`stat-value ${parseFloat(stats.averageProfitLoss) >= 0 ? 'positive' : 'negative'}`}>
                            {parseFloat(stats.averageProfitLoss) >= 0 ? '+' : ''}{stats.averageProfitLoss}%
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Total P/L:</span>
                        <span className={`stat-value ${parseFloat(stats.totalProfitLoss) >= 0 ? 'positive' : 'negative'}`}>
                            {parseFloat(stats.totalProfitLoss) >= 0 ? '+' : ''}{stats.totalProfitLoss}%
                        </span>
                    </div>
                </div>
            </div>
            
            {history.length === 0 ? (
                <div className="no-history">No order history yet.</div>
            ) : (
                <div className="history-list">
                    {history.map(order => (
                        <div 
                            key={order.id} 
                            className={`history-item ${order.position_type || 'long'} ${parseFloat(order.profit_loss) >= 0 ? 'profitable' : 'loss'}`}
                        >
                            <div className="history-info">
                                <div className="history-symbol">{order.symbol}</div>
                                <div className={`history-position ${order.position_type || 'long'}`}>
                                    {(order.position_type || 'long').toUpperCase()}
                                </div>
                                <div className={`history-profit ${parseFloat(order.profit_loss) >= 0 ? 'positive' : 'negative'}`}>
                                    {parseFloat(order.profit_loss) >= 0 ? '+' : ''}{parseFloat(order.profit_loss).toFixed(2)}%
                                </div>
                            </div>
                            
                            <div className="history-prices">
                                <div className="price-row">
                                    <span className="price-label">Entry:</span>
                                    <span className="price-value">{parseFloat(order.entry_price).toFixed(2)}</span>
                                </div>
                                <div className="price-row">
                                    <span className="price-label">Close:</span>
                                    <span className="price-value">{parseFloat(order.close_price).toFixed(2)}</span>
                                </div>
                            </div>
                            
                            <div className="history-dates">
                                <div className="date-row">
                                    <span className="date-label">Opened:</span>
                                    <span className="date-value">{new Date(order.created_at).toLocaleString()}</span>
                                </div>
                                <div className="date-row">
                                    <span className="date-label">Closed:</span>
                                    <span className="date-value">{new Date(order.closed_at).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Helper function to calculate duration between two timestamps
const calculateDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMs = endDate - startDate;
    
    // Format duration
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
};

export default OrderHistory; 