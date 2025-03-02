import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './OrderTracker.css';
import config from '../config';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { toast } from 'react-hot-toast';

const API_URL = config.API_URL;

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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

const OrderTracker = ({ order, onDelete, onEdit, onClose }) => {
    const [currentPrice, setCurrentPrice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [profitPercent, setProfitPercent] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [showConfirmClose, setShowConfirmClose] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        symbol: '',
        entry_price: '',
        stop_loss: '',
        take_profit: ''
    });
    const [priceHistory, setPriceHistory] = useState([]);
    
    // Define autoCloseOrder with useCallback before using it in useEffect
    const autoCloseOrder = useCallback(async (reason, price) => {
        if (isClosing) return; // Prevent duplicate close calls
        
        // Safety check for order existence and ID
        if (!order || !order.id) {
            console.error("Cannot close order: Invalid order or missing ID");
            setError("Cannot close order: Order data is invalid");
            return;
        }
        
        try {
            console.log(`Attempting to close order ${order.id} with reason: ${reason}, price: ${price}`);
            setIsClosing(true);
            
            const response = await axios.post(`${API_URL}/orders/${order.id}/close`, {
                close_price: price,
                close_reason: reason
            });
            
            console.log("Close order response:", response.data);
            
            // Call the onClose callback to update the parent component
            if (onClose) onClose(response.data.history);
            
            // Show toast notification
            toast.success(`Order closed automatically: ${reason === 'take_profit' ? 'Take Profit' : 'Stop Loss'} reached!`);
        } catch (error) {
            console.error("Error auto-closing order:", error);
            
            // More detailed error message
            const errorMessage = error.response?.data?.detail || error.message || "Unknown error";
            setError(`Failed to auto-close order: ${errorMessage}`);
            setIsClosing(false);
            
            // Show error toast as well
            toast.error(`Failed to close order: ${errorMessage}`);
        }
    }, [isClosing, order, onClose]);
    
    // Add a helper function to update price history
    const updatePriceHistory = (newPrice) => {
        setPriceHistory(prevHistory => {
            const newHistory = [...prevHistory, {
                time: new Date().toLocaleTimeString(),
                price: newPrice
            }];
            
            // Keep only the most recent 20 points
            if (newHistory.length > 20) {
                return newHistory.slice(newHistory.length - 20);
            }
            return newHistory;
        });
    };

    // Initialize edit form when order changes
    useEffect(() => {
        if (order) {
            setEditForm({
                symbol: order.symbol,
                entry_price: order.entry_price,
                stop_loss: order.stop_loss,
                take_profit: order.take_profit
            });
        }
    }, [order]);
    
    // Calculate slider position for price visualization
    const calculateSliderPosition = (price) => {
        if (!order) return 50;
        
        const stopLoss = parseFloat(order.stop_loss);
        const takeProfit = parseFloat(order.take_profit);
        const range = takeProfit - stopLoss;
        
        // Calculate position as percentage between SL and TP
        const position = ((price - stopLoss) / range) * 100;
        return Math.min(Math.max(position, 0), 100); // Clamp between 0-100
    };
    
    // Price fetching effect with auto-close logic
    useEffect(() => {
        if (!order || !order.symbol) return;
        
        const fetchCurrentPrice = async () => {
            try {
                const response = await axios.get(`${API_URL}/current-price/${order.symbol}`);
                const newPrice = parseFloat(response.data.price);
                
                if (isNaN(newPrice)) {
                    console.error("Received invalid price:", response.data.price);
                    setError("Received invalid price data");
                    return;
                }
                
                setCurrentPrice(newPrice);
                
                // Calculate profit percentage based on position type with fallback
                const entryPrice = parseFloat(order.entry_price);
                let percent;
                
                if ((order.position_type || 'long') === 'short') {
                    // For short positions, profit when price goes down
                    percent = ((entryPrice - newPrice) / entryPrice * 100).toFixed(2);
                } else {
                    // For long positions (default), profit when price goes up
                    percent = ((newPrice - entryPrice) / entryPrice * 100).toFixed(2);
                }
                
                setProfitPercent(percent);
                
                // Add to price history
                updatePriceHistory(newPrice);
                
                // Check for auto-close conditions
                const stopLoss = parseFloat(order.stop_loss);
                const takeProfit = parseFloat(order.take_profit);
                
                // Only try to auto-close if not already closing and order has valid ID
                if (order.id && !isClosing) {
                    if (newPrice <= stopLoss) {
                        console.log('Price hit Stop Loss - auto closing');
                        autoCloseOrder('stop_loss', newPrice);
                    } else if (newPrice >= takeProfit) {
                        console.log('Price hit Take Profit - auto closing');
                        autoCloseOrder('take_profit', newPrice);
                    }
                }
                
                setLoading(false);
            } catch (err) {
                console.error("Error fetching current price:", err);
                setError("Failed to fetch current price");
                setLoading(false);
            }
        };
        
        fetchCurrentPrice();
        const interval = setInterval(fetchCurrentPrice, 30000);
        return () => clearInterval(interval);
    }, [order, isClosing, autoCloseOrder]);
    
    // Track price history
    useEffect(() => {
        if (!order || !order.symbol || !currentPrice) return;
        
        // Add the current price to our history (limited to 20 points)
        setPriceHistory(prevHistory => {
            const newHistory = [...prevHistory, {
                time: new Date().toLocaleTimeString(),
                price: parseFloat(currentPrice)
            }];
            
            // Keep only the most recent 20 points
            if (newHistory.length > 20) {
                return newHistory.slice(newHistory.length - 20);
            }
            return newHistory;
        });
    }, [currentPrice, order]);
    
    // Check if price is at SL or TP
    const isPriceAtStopOrTarget = () => {
        if (!currentPrice) return false;
        
        const price = parseFloat(currentPrice);
        const stopLoss = parseFloat(order.stop_loss);
        const takeProfit = parseFloat(order.take_profit);
        
        // Add some tolerance (0.5%) for price comparison
        return (price <= stopLoss * 1.005) || (price >= takeProfit * 0.995);
    };
    
    const handleEditClick = () => {
        setIsEditing(true);
    };
    
    const handleCancelEdit = () => {
        setIsEditing(false);
        // Reset form to original values
        setEditForm({
            symbol: order.symbol,
            entry_price: order.entry_price,
            stop_loss: order.stop_loss,
            take_profit: order.take_profit
        });
    };
    
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm({
            ...editForm,
            [name]: value
        });
    };
    
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            // Validate prices
            const entry = parseFloat(editForm.entry_price);
            const sl = parseFloat(editForm.stop_loss);
            const tp = parseFloat(editForm.take_profit);
            
            if (entry <= sl) {
                setError('Stop Loss must be lower than Entry Price');
                return;
            }
            
            if (entry >= tp) {
                setError('Take Profit must be higher than Entry Price');
                return;
            }
            
            const response = await axios.put(`${API_URL}/orders/${order.id}`, {
                symbol: editForm.symbol.toUpperCase(),
                entry_price: parseFloat(editForm.entry_price),
                stop_loss: parseFloat(editForm.stop_loss),
                take_profit: parseFloat(editForm.take_profit)
            });
            
            setIsEditing(false);
            
            // Call the onEdit callback to update the parent component
            if (onEdit) onEdit(response.data.order);
            
            // Show success message
            toast.success("Order updated successfully!");
        } catch (error) {
            console.error("Error updating order:", error);
            setError(error.response?.data?.detail || "Failed to update order");
        }
    };
    
    const handleDeleteClick = () => {
        if (!showConfirmDelete) {
            setShowConfirmDelete(true);
            return;
        }
        
        setIsDeleting(true);
        onDelete(order.id);
    };
    
    const handleCancelDelete = () => {
        setShowConfirmDelete(false);
    };
    
    const handleCloseClick = () => {
        if (!showConfirmClose) {
            setShowConfirmClose(true);
            return;
        }
    };
    
    const handleConfirmClose = async () => {
        try {
            setIsClosing(true);
            console.log(`Manually closing order: ${order.id} at price: ${currentPrice}`);
            
            // First try to close with current price
            const response = await axios.post(`${API_URL}/orders/${order.id}/close`, {
                close_price: currentPrice,
                close_reason: 'manual'
            });
            
            // Show success notification
            toast.success("Order closed successfully!");
            
            // Call onClose to update parent component
            if (onClose) {
                onClose(response.data.history);
            }
        } catch (error) {
            console.error("Error closing order:", error);
            
            // Create a detailed error message
            const errorDetails = error.response?.data?.detail || error.message || "Unknown error";
            setError(`Failed to close order: ${errorDetails}`);
            
            // Show error notification
            toast.error(`Close failed: ${errorDetails}`);
            
            // Reset the closing state
            setIsClosing(false);
        }
    };
    
    const handleCancelClose = () => {
        setShowConfirmClose(false);
    };
    
    // Create chart data for Chart.js
    const prepareChartData = () => {
        if (!priceHistory.length || !order) {
            // Return empty chart data
            return {
                labels: [],
                datasets: [
                    {
                        label: 'Price',
                        data: [],
                        borderColor: '#00dac6',
                        fill: false
                    }
                ]
            };
        }
        
        const entryPrice = parseFloat(order.entry_price);
        const stopLoss = parseFloat(order.stop_loss);
        const takeProfit = parseFloat(order.take_profit);
        
        return {
            labels: priceHistory.map(p => p.time),
            datasets: [
                {
                    label: 'Price',
                    data: priceHistory.map(p => p.price),
                    borderColor: profitPercent >= 0 ? '#4caf50' : '#f44336',
                    backgroundColor: profitPercent >= 0 
                        ? 'rgba(76, 175, 80, 0.1)' 
                        : 'rgba(244, 67, 54, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Entry Price',
                    data: Array(priceHistory.length).fill(entryPrice),
                    borderColor: '#888',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                },
                {
                    label: 'Stop Loss',
                    data: Array(priceHistory.length).fill(stopLoss),
                    borderColor: '#f44336',
                    borderWidth: 2,
                    borderDash: [3, 3],
                    pointRadius: 0,
                    fill: false
                },
                {
                    label: 'Take Profit',
                    data: Array(priceHistory.length).fill(takeProfit),
                    borderColor: '#4caf50',
                    borderWidth: 2,
                    borderDash: [3, 3],
                    pointRadius: 0,
                    fill: false
                }
            ]
        };
    };

    // ChartJS options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: '#ccc'
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#ccc',
                    maxRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 5
                }
            }
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#ccc',
                    boxWidth: 12
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(30, 27, 46, 0.9)',
                titleColor: '#fff',
                bodyColor: '#ddd'
            }
        },
        animation: {
            duration: 500
        }
    };

    // Render the component
    return (
        <div className="order-tracker">
            {error && (
                <div className="error-message">
                    <div className="error-icon">⚠️</div>
                    <div className="error-text">
                        <strong>Error:</strong> {error}
                        {error.includes("Failed to close order") && (
                            <div className="error-help">
                                <p>Try these steps:</p>
                                <ol>
                                    <li>Refresh the page and try again</li>
                                    <li>Check if the database connection is working</li>
                                    <li>Verify that the order_history table exists in your database</li>
                                </ol>
                            </div>
                        )}
                    </div>
                    <button 
                        className="error-dismiss" 
                        onClick={() => setError(null)}
                    >
                        ×
                    </button>
                </div>
            )}
            
            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading order data...</p>
                </div>
            ) : (
                <>
                    <div className="tracker-header">
                        <div className="tracker-title">
                            <img 
                                src={cryptoLogos[order.symbol] || 'https://via.placeholder.com/32'} 
                                alt={order.symbol}
                                className="crypto-logo"
                            />
                            <h2>{order.symbol}</h2>
                            <span className={`position-badge ${(order.position_type || 'long') === 'short' ? 'short' : 'long'}`}>
                                {(order.position_type || 'long').toUpperCase()}
                            </span>
                        </div>
                        <div className={`profit-percent ${profitPercent >= 0 ? 'positive' : 'negative'}`}>
                            {profitPercent >= 0 ? '+' : ''} {profitPercent}%
                        </div>
                    </div>
                    
                    <div className="tracker-meta">
                        <div className="timestamp">
                            Created: {new Date(order.created_at).toLocaleString()}
                        </div>
                        <div className="tracker-actions">
                            {!isPriceAtStopOrTarget() && (
                                <>
                                    <button className="edit-btn" onClick={handleEditClick}>
                                        Edit Order
                                    </button>
                                    
                                    {showConfirmClose ? (
                                        <>
                                            <span className="confirm-text">Close at current price?</span>
                                            <button 
                                                className="confirm-btn yes" 
                                                onClick={handleConfirmClose}
                                                disabled={isClosing}
                                            >
                                                {isClosing ? 'Closing...' : 'Yes'}
                                            </button>
                                            <button 
                                                className="confirm-btn no" 
                                                onClick={handleCancelClose}
                                                disabled={isClosing}
                                            >
                                                No
                                            </button>
                                        </>
                                    ) : (
                                        <button className="close-btn" onClick={handleCloseClick}>
                                            Close Order
                                        </button>
                                    )}
                                    
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
                                </>
                            )}
                            
                            {isPriceAtStopOrTarget() && (
                                <div className="limit-reached-message">
                                    <i className="fa fa-info-circle"></i>
                                    Price at Stop Loss or Take Profit level. Order will be closed soon.
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="price-points">
                        <div className={`price-point ${parseFloat(order.stop_loss) / currentPrice > 0.95 ? 'alert' : ''}`}>
                            <div className="price-icon stop-loss-icon">
                                <i className={`fa fa-arrow-${(order.position_type || 'long') === 'short' ? 'up' : 'down'}`}></i>
                            </div>
                            <div className="price-value">{parseFloat(order.stop_loss).toFixed(2)}</div>
                            <div className="price-label">Stop Loss</div>
                            {parseFloat(order.stop_loss) / currentPrice > 0.95 && <div className="alert-badge">Near!</div>}
                        </div>
                        
                        <div className="price-point">
                            <div className="price-icon entry-icon">
                                <i className="fa fa-sign-in-alt"></i>
                            </div>
                            <div className="price-value">{parseFloat(order.entry_price).toFixed(2)}</div>
                            <div className="price-label">Entry Price</div>
                        </div>
                        
                        <div className="price-point highlight">
                            <div className="price-icon current-icon">
                                <i className="fa fa-dot-circle"></i>
                            </div>
                            <div className="price-value">{currentPrice.toFixed(2)}</div>
                            <div className="price-label">Current Price</div>
                        </div>
                        
                        <div className={`price-point ${currentPrice / parseFloat(order.take_profit) > 0.95 ? 'alert' : ''}`}>
                            <div className="price-icon take-profit-icon">
                                <i className={`fa fa-arrow-${(order.position_type || 'long') === 'short' ? 'down' : 'up'}`}></i>
                            </div>
                            <div className="price-value">{parseFloat(order.take_profit).toFixed(2)}</div>
                            <div className="price-label">Take Profit</div>
                            {currentPrice / parseFloat(order.take_profit) > 0.95 && <div className="alert-badge">Near!</div>}
                        </div>
                    </div>
                    
                    {/* Chart.js Price Chart */}
                    <div className="price-chart-container">
                        <h3>Price Movement</h3>
                        {priceHistory.length > 1 ? (
                            <div className="chart-wrapper">
                                <Line data={prepareChartData()} options={chartOptions} height={220} />
                            </div>
                        ) : (
                            <div className="chart-loading">
                                Collecting price data...
                            </div>
                        )}
                    </div>
                    
                    <div className="price-analysis">
                        {profitPercent >= 0 ? (
                            <p className="analysis-text positive">
                                <i className="fa fa-chart-line"></i>
                                {(order.position_type || 'long') === 'short' 
                                    ? `The price is ${Math.abs(profitPercent)}% lower than your entry price.`
                                    : `The price is ${Math.abs(profitPercent)}% higher than your entry price.`
                                }
                            </p>
                        ) : (
                            <p className="analysis-text negative">
                                <i className="fa fa-chart-line"></i>
                                {(order.position_type || 'long') === 'short' 
                                    ? `The price is ${Math.abs(profitPercent)}% higher than your entry price.`
                                    : `The price is ${Math.abs(profitPercent)}% lower than your entry price.`
                                }
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

// Fix ESLint warning by defining autoCloseOrder outside of component
OrderTracker.displayName = "OrderTracker";

export default OrderTracker; 