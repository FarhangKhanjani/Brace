import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './OrderTracker.css';
import config from '../config';

const API_URL = config.API_URL;

// Mapping of common crypto symbols to logos
const cryptoLogos = {
    BTC: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    ETH: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    USDT: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    BNB: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
    XRP: 'https://cryptologos.cc/logos/xrp-xrp-logo.png',
    ADA: 'https://cryptologos.cc/logos/cardano-ada-logo.png',
    SOL: 'https://cryptologos.cc/logos/solana-sol-logo.png',
    DOGE: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png',
    DOT: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png',
    // Add more as needed
};

const OrderTracker = ({ order, onDelete }) => {
    const [currentPrice, setCurrentPrice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [profitPercent, setProfitPercent] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    
    // Fetch current price at regular intervals
    useEffect(() => {
        if (!order || !order.symbol) return;
        
        const fetchCurrentPrice = async () => {
            try {
                const response = await axios.get(`${API_URL}/current-price/${order.symbol}`);
                setCurrentPrice(response.data.price);
                
                // Calculate profit percentage
                const entryPrice = parseFloat(order.entry_price);
                const price = parseFloat(response.data.price);
                const percent = ((price - entryPrice) / entryPrice * 100).toFixed(2);
                setProfitPercent(percent);
                
                setLoading(false);
            } catch (err) {
                console.error("Error fetching current price:", err);
                setError("Failed to fetch current price");
                setLoading(false);
            }
        };
        
        // Fetch immediately
        fetchCurrentPrice();
        
        // Then fetch every 30 seconds
        const interval = setInterval(fetchCurrentPrice, 30000);
        
        return () => clearInterval(interval);
    }, [order]);
    
    const handleDeleteClick = async () => {
        if (showConfirmDelete) {
            try {
                setIsDeleting(true);
                await axios.delete(`${API_URL}/orders/${order.id}`);
                if (onDelete) onDelete(order.id);
            } catch (error) {
                console.error("Error deleting order:", error);
                setError("Failed to delete order");
            } finally {
                setIsDeleting(false);
                setShowConfirmDelete(false);
            }
        } else {
            setShowConfirmDelete(true);
        }
    };
    
    const handleCancelDelete = () => {
        setShowConfirmDelete(false);
    };
    
    if (loading) return <div className="tracker-loading">Loading price data...</div>;
    if (error) return <div className="tracker-error">{error}</div>;
    if (!order) return <div className="tracker-error">No order selected</div>;
    
    // Calculate position percentage for the slider
    const calculatePosition = () => {
        const stopLoss = parseFloat(order.stop_loss);
        const takeProfit = parseFloat(order.take_profit);
        const range = takeProfit - stopLoss;
        
        // Calculate percentage position between stop loss and take profit
        const position = ((currentPrice - stopLoss) / range) * 100;
        
        // Clamp position between 0 and 100
        return Math.min(Math.max(position, 0), 100);
    };
    
    const sliderPosition = calculatePosition();
    const isProfitable = parseFloat(profitPercent) > 0;
    
    // Get crypto logo or use a placeholder
    const logoUrl = cryptoLogos[order.symbol] || 'https://via.placeholder.com/32?text=' + order.symbol;
    
    // Determine if we're close to stop loss or take profit (within 5%)
    const closeToStopLoss = (parseFloat(order.stop_loss) / currentPrice > 0.95);
    const closeToTakeProfit = (currentPrice / parseFloat(order.take_profit) > 0.95);
    
    return (
        <div className="order-tracker">
            <div className="tracker-header">
                <div className="tracker-title">
                    <img src={logoUrl} alt={order.symbol} className="crypto-logo" />
                    <h2>{order.symbol}/USD</h2>
                </div>
                <div className={`profit-percent ${isProfitable ? 'positive' : 'negative'}`}>
                    {isProfitable ? '+' : ''}{profitPercent}%
                </div>
            </div>
            
            <div className="tracker-meta">
                <div className="timestamp">
                    Created: {new Date(order.created_at).toLocaleString()}
                </div>
                <div className="tracker-actions">
                    {showConfirmDelete ? (
                        <>
                            <span className="confirm-text">Are you sure?</span>
                            <button 
                                className="confirm-btn yes" 
                                onClick={handleDeleteClick}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Yes'}
                            </button>
                            <button 
                                className="confirm-btn no" 
                                onClick={handleCancelDelete}
                                disabled={isDeleting}
                            >
                                No
                            </button>
                        </>
                    ) : (
                        <button className="delete-btn" onClick={handleDeleteClick}>
                            Delete Order
                        </button>
                    )}
                </div>
            </div>
            
            <div className="price-points">
                <div className={`price-point ${closeToStopLoss ? 'alert' : ''}`}>
                    <div className="price-icon stop-loss-icon">
                        <i className="fa fa-arrow-down"></i>
                    </div>
                    <div className="price-value">${parseFloat(order.stop_loss).toFixed(2)}</div>
                    <div className="price-label">Stop Loss</div>
                    {closeToStopLoss && <div className="alert-badge">Near!</div>}
                </div>
                
                <div className="price-point">
                    <div className="price-icon entry-icon">
                        <i className="fa fa-sign-in-alt"></i>
                    </div>
                    <div className="price-value">${parseFloat(order.entry_price).toFixed(2)}</div>
                    <div className="price-label">Entry Price</div>
                </div>
                
                <div className="price-point highlight">
                    <div className="price-icon current-icon">
                        <i className="fa fa-dot-circle"></i>
                    </div>
                    <div className="price-value">${currentPrice.toFixed(2)}</div>
                    <div className="price-label">Current Price</div>
                </div>
                
                <div className={`price-point ${closeToTakeProfit ? 'alert' : ''}`}>
                    <div className="price-icon take-profit-icon">
                        <i className="fa fa-arrow-up"></i>
                    </div>
                    <div className="price-value">${parseFloat(order.take_profit).toFixed(2)}</div>
                    <div className="price-label">Take Profit</div>
                    {closeToTakeProfit && <div className="alert-badge">Near!</div>}
                </div>
            </div>
            
            <div className="price-slider">
                <div className="slider-track"></div>
                <div 
                    className="slider-progress" 
                    style={{ width: `${sliderPosition}%` }}
                ></div>
                
                <div className="slider-markers">
                    <div className="marker stop-loss" title="Stop Loss">
                        <div className="marker-dot"></div>
                        <div className="marker-label">SL</div>
                    </div>
                    
                    <div className="marker entry-price" title="Entry Price">
                        <div className="marker-dot"></div>
                        <div className="marker-label">ENTRY</div>
                    </div>
                    
                    <div 
                        className="marker current-price" 
                        style={{ left: `${sliderPosition}%` }}
                        title="Current Price"
                    >
                        <div className="marker-dot"></div>
                        <div className="marker-pulse"></div>
                    </div>
                    
                    <div className="marker take-profit" title="Take Profit">
                        <div className="marker-dot"></div>
                        <div className="marker-label">TP</div>
                    </div>
                </div>
            </div>
            
            <div className="price-analysis">
                {isProfitable ? (
                    <p className="analysis-text positive">
                        <i className="fa fa-chart-line"></i>
                        The price is {Math.abs(profitPercent)}% higher than your entry price.
                    </p>
                ) : (
                    <p className="analysis-text negative">
                        <i className="fa fa-chart-line"></i>
                        The price is {Math.abs(profitPercent)}% lower than your entry price.
                    </p>
                )}
            </div>
        </div>
    );
};

export default OrderTracker; 