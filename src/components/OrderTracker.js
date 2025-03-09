import React, { useState, useEffect } from 'react';
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
import SimplePriceTracker from './SimplePriceTracker';
import { getCurrentPrice } from '../services/priceService';

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
    const [editForm, setEditForm] = useState({
        symbol: '',
        entry_price: '',
        stop_loss: '',
        take_profit: ''
    });
    const [priceHistory, setPriceHistory] = useState([]);
    const [autoCloseEnabled, setAutoCloseEnabled] = useState(true);
    const [timeRange, setTimeRange] = useState('10min'); // '10min', 'daily', 'weekly'
    const [dailyPriceHistory, setDailyPriceHistory] = useState([]);
    
    // Add proper null checks when accessing symbol properties
    const getSymbol = (order) => {
        if (!order || !order.crypto_symbol) {
            return 'Unknown';
        }
        return order.crypto_symbol.toUpperCase();
    };
    
    // Add proper null checks in your render functions
    const renderChartTitle = (order) => {
        if (!order || !order.crypto_symbol) {
            return 'Trading Position';
        }
        return `${order.crypto_symbol.toUpperCase()} Position`;
    };
    
    // Update the chart title based on time range
    const getChartTitle = () => {
        switch(timeRange) {
            case 'daily':
                return `${getSymbol(order)} Price (Daily)`;
            default:
                return `${getSymbol(order)} Price (10-min intervals)`;
        }
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
            setLoading(false);
        }
    }, [order]);
    
    // Update the price tracking logic to use the new service
    useEffect(() => {
        if (!order) return;
        
        const fetchPrice = async () => {
            try {
                // Use our new price service
                const newPrice = await getCurrentPrice(order.symbol, order.market_type || 'crypto');
                
                // Log price updates for debugging
                console.log(`Real price update for ${order.symbol}: ${newPrice}`);
                
                setCurrentPrice(newPrice);
                
                // Calculate profit percentage based on position type
                const entryPrice = parseFloat(order.entry_price);
                const positionType = order.position_type || 'long';
                let percent;
                
                if (positionType === 'short') {
                    percent = ((entryPrice - newPrice) / entryPrice * 100).toFixed(2);
                } else {
                    percent = ((newPrice - entryPrice) / entryPrice * 100).toFixed(2);
                }
                
                setProfitPercent(percent);
                
                // Only add to price history every 10 minutes
                const now = new Date();
                const minutes = now.getMinutes();
                
                // Add to price history if it's a 10-minute mark or the first data point
                if (minutes % 10 === 0 || priceHistory.length === 0) {
                    const timestamp = now.toLocaleTimeString();
                    setPriceHistory(prev => {
                        // Check if we already have a data point for this 10-minute interval
                        const lastTime = prev.length > 0 ? new Date(prev[prev.length - 1].time) : null;
                        
                        // Only add if this is a new 10-minute interval or the first point
                        if (!lastTime || 
                            lastTime.getHours() !== now.getHours() || 
                            Math.floor(lastTime.getMinutes() / 10) !== Math.floor(minutes / 10)) {
                            
                            const updated = [...prev, { time: timestamp, price: newPrice }];
                            return updated.slice(-24); // Keep only the last 24 points (4 hours at 10-min intervals)
                        }
                        return prev;
                    });
                }
            } catch (error) {
                console.error("Error fetching price:", error);
                setError("Failed to fetch current price");
            }
        };
        
        // Set up interval for price updates (every 60 seconds)
        const intervalId = setInterval(fetchPrice, 60000);
        
        // Initial fetch
        fetchPrice();
        
        return () => clearInterval(intervalId);
    }, [order, priceHistory.length]);
    
    // Add useEffect for fetching daily data
    useEffect(() => {
        if (!order) return;
        
        const fetchDailyPrices = async () => {
            try {
                // Import the function from priceService
                const { getDailyPrices } = await import('../services/priceService');
                const dailyData = await getDailyPrices(order.symbol, 30); // Get 30 days of data
                
                setDailyPriceHistory(dailyData);
            } catch (error) {
                console.error("Error fetching daily prices:", error);
            }
        };
        
        // Fetch daily data when the component mounts or order changes
        fetchDailyPrices();
    }, [order]);
    
    // Prepare chart data with entry price line
    const prepareChartData = () => {
        // Use the appropriate price history based on time range
        const historyData = timeRange === '10min' ? priceHistory : dailyPriceHistory;
        
        const labels = historyData.map(item => 
            timeRange === '10min' ? item.time : item.date
        );
        const prices = historyData.map(item => item.price);
        
        // Calculate appropriate min and max for y-axis - we'll use these in the chart options
        // const minPrice = Math.min(...prices) * 0.995; // 0.5% below minimum
        // const maxPrice = Math.max(...prices) * 1.005; // 0.5% above maximum
        
        // Make sure entry price, stop loss, and take profit are within the visible range
        const entryPrice = parseFloat(order.entry_price);
        const stopLoss = parseFloat(order.stop_loss);
        const takeProfit = parseFloat(order.take_profit);
        
        // Create a dataset for the price line
        return {
            labels,
            datasets: [
                {
                    label: 'Price',
                    data: prices,
                    borderColor: '#00dac6',
                    backgroundColor: 'rgba(0, 218, 198, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    pointBackgroundColor: '#00dac6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 1,
                },
                {
                    label: 'Entry Price',
                    data: Array(labels.length).fill(entryPrice),
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                    tension: 0
                },
                {
                    label: 'Stop Loss',
                    data: Array(labels.length).fill(stopLoss),
                    borderColor: '#f44336',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                    tension: 0
                },
                {
                    label: 'Take Profit',
                    data: Array(labels.length).fill(takeProfit),
                    borderColor: '#4caf50',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                    tension: 0
                }
            ]
        };
    };
    
    // Update chart options for better Y-axis scaling
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: '#fff',
                    boxWidth: 12,
                    padding: 10,
                    font: {
                        size: 11
                    }
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            },
            title: {
                display: true,
                text: getChartTitle(),
                color: '#fff',
                font: {
                    size: 16
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: '#888',
                    maxRotation: 45,
                    minRotation: 45,
                    autoSkip: true,
                    maxTicksLimit: 8
                }
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: '#888',
                    callback: function(value) {
                        return '$' + value.toLocaleString();
                    }
                },
                // Set the min and max based on the price range
                afterDataLimits: (scale) => {
                    // Get the entry, SL, and TP prices
                    const entryPrice = parseFloat(order.entry_price);
                    const stopLoss = parseFloat(order.stop_loss);
                    const takeProfit = parseFloat(order.take_profit);
                    
                    // Find the min and max of all relevant prices
                    const historyData = timeRange === '10min' ? priceHistory : dailyPriceHistory;
                    const allPrices = [...historyData.map(item => item.price), entryPrice, stopLoss, takeProfit];
                    const minPrice = Math.min(...allPrices);
                    const maxPrice = Math.max(...allPrices);
                    
                    // Calculate a good range (add padding)
                    const range = maxPrice - minPrice;
                    const padding = range * 0.1; // 10% padding
                    
                    scale.min = minPrice - padding;
                    scale.max = maxPrice + padding;
                }
            }
        },
        elements: {
            point: {
                radius: 2,
                hoverRadius: 5
            },
            line: {
                tension: 0.4
            }
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        },
        animation: {
            duration: 1000
        }
    };
    
    // Add time range selector UI
    const TimeRangeSelector = () => (
        <div className="time-range-selector">
            <button 
                className={`range-btn ${timeRange === '10min' ? 'active' : ''}`}
                onClick={() => setTimeRange('10min')}
            >
                10 Min
            </button>
            <button 
                className={`range-btn ${timeRange === 'daily' ? 'active' : ''}`}
                onClick={() => setTimeRange('daily')}
            >
                Daily
            </button>
        </div>
    );
    
    // Handle delete button click
    const handleDeleteClick = () => {
        if (showConfirmDelete) {
            // User confirmed deletion
            setIsDeleting(true);
            
            // Call the onDelete callback
            if (onDelete) {
                onDelete(order.id);
            }
        } else {
            // Show confirmation first
            setShowConfirmDelete(true);
        }
    };
    
    // Handle cancel delete
    const handleCancelDelete = () => {
        setShowConfirmDelete(false);
    };
    
    // Handle edit button click
    const handleEditClick = () => {
        if (onEdit) {
            onEdit(order.id, editForm);
        }
    };
    
    // Handle close button click
    const handleCloseClick = () => {
        setShowConfirmClose(true);
    };
    
    // Handle confirm close
    const handleConfirmClose = async () => {
        setIsClosing(true);
        
        try {
            // Prepare close data
            const closeData = {
                close_reason: 'manual',
                close_price: currentPrice
            };
            
            // Send close request to API
            await axios.post(`${API_URL}/orders/${order.id}/close`, closeData);
            
            toast.success('Order closed successfully');
            
            // Notify parent component
            if (onClose) {
                onClose();
            }
        } catch (error) {
            console.error('Error closing order:', error);
            toast.error('Failed to close order');
            setIsClosing(false);
            setShowConfirmClose(false);
        }
    };
    
    // Handle cancel close
    const handleCancelClose = () => {
        setShowConfirmClose(false);
    };
    
    // Toggle auto-close
    const toggleAutoClose = () => {
        setAutoCloseEnabled(prev => !prev);
        
        // Show a toast message explaining that auto-close is disabled
        if (!autoCloseEnabled) {
            toast.info("Auto-close is currently disabled in this version");
        }
    };
    
    // Check if price is at stop loss or take profit
    const isPriceAtStopOrTarget = () => {
        if (!currentPrice) return false;
        
        const stopLoss = parseFloat(order.stop_loss);
        const takeProfit = parseFloat(order.take_profit);
        const positionType = order.position_type || 'long';
        
        if (positionType === 'long') {
            return currentPrice <= stopLoss || currentPrice >= takeProfit;
        } else {
            return currentPrice >= stopLoss || currentPrice <= takeProfit;
        }
    };
    
    // Render the component
    return (
        <div className="order-tracker">
            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading order data...</p>
                </div>
            ) : error ? (
                <div className="error-message">
                    <div className="error-icon">⚠️</div>
                    <div className="error-text">{error}</div>
                    <button className="error-dismiss" onClick={() => setError(null)}>×</button>
                </div>
            ) : (
                <>
                    <div className="tracker-header">
                        <div className="tracker-title">
                            {cryptoLogos[getSymbol(order)] && (
                                <img 
                                    src={cryptoLogos[getSymbol(order)]} 
                                    alt={`${getSymbol(order)} logo`} 
                                    className="crypto-logo" 
                                />
                            )}
                            <h2>{getSymbol(order)}</h2>
                            <div className={`position-badge ${order.position_type || 'long'}`}>
                                {order.position_type || 'LONG'}
                            </div>
                        </div>
                        
                        {currentPrice && (
                            <div className={`profit-percent ${parseFloat(profitPercent) >= 0 ? 'positive' : 'negative'}`}>
                                {profitPercent}%
                            </div>
                        )}
                    </div>
                    
                    <div className="tracker-meta">
                        <div className="timestamp">
                            Opened: {new Date(order.created_at).toLocaleString()}
                        </div>
                        
                        <div className="tracker-actions">
                            {order.status === 'open' && (
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
                    
                    <div className="auto-close-toggle">
                        <label className="toggle-label">
                            <input 
                                type="checkbox" 
                                checked={autoCloseEnabled} 
                                onChange={toggleAutoClose} 
                            />
                            <span className="toggle-text">Auto-close at SL/TP</span>
                        </label>
                    </div>
                    
                    {currentPrice && (
                        <>
                            <div className="price-points">
                                <div className="price-point">
                                    <div className="price-icon stop-loss-icon">
                                        <i className={`fa fa-arrow-${(order.position_type || 'long') === 'short' ? 'up' : 'down'}`}></i>
                                    </div>
                                    <div className="price-value">{parseFloat(order.stop_loss).toFixed(2)}</div>
                                    <div className="price-label">Stop Loss</div>
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
                                
                                <div className="price-point">
                                    <div className="price-icon take-profit-icon">
                                        <i className={`fa fa-arrow-${(order.position_type || 'long') === 'short' ? 'down' : 'up'}`}></i>
                                    </div>
                                    <div className="price-value">{parseFloat(order.take_profit).toFixed(2)}</div>
                                    <div className="price-label">Take Profit</div>
                                </div>
                            </div>
                            
                            <SimplePriceTracker 
                                currentPrice={currentPrice}
                                entryPrice={parseFloat(order.entry_price)}
                                stopLoss={parseFloat(order.stop_loss)}
                                takeProfit={parseFloat(order.take_profit)}
                                positionType={order.position_type || 'long'}
                            />
                            
                            {/* Chart.js Price Chart */}
                            <div className="price-chart-container">
                                <h3>Price Movement</h3>
                                
                                <TimeRangeSelector />
                                
                                {(timeRange === '10min' && priceHistory.length > 1) || 
                                 (timeRange === 'daily' && dailyPriceHistory.length > 1) ? (
                                    <div className="chart-wrapper">
                                        <Line data={prepareChartData()} options={chartOptions} height={220} />
                                    </div>
                                ) : (
                                    <div className="chart-loading">
                                        {timeRange === '10min' 
                                            ? 'Collecting 10-minute price data...' 
                                            : 'Loading daily price data...'}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default OrderTracker; 