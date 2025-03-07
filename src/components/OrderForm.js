import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';
import './OrderForm.css';
import { IoMdClose } from 'react-icons/io';

// List of popular cryptocurrency symbols
const popularSymbols = [
    'BTC', 'ETH', 'USDT', 'BNB', 'XRP', 'ADA', 'SOL', 'DOGE', 'DOT', 'SHIB',
    'MATIC', 'LTC', 'AVAX', 'UNI', 'LINK', 'ATOM', 'XLM', 'ETC', 'ALGO', 'FIL',
    'APE', 'MANA', 'SAND', 'AXS', 'NEAR', 'CRO', 'XMR', 'EOS', 'BCH', 'ZEC',
    'CAKE', 'CHZ', 'ONE', 'HOT', 'XTZ', 'IOTA', 'NEO', 'KSM', 'THETA', 'EGLD',
    'FTM', 'HBAR', 'WAVES', 'QNT', 'DASH', 'MKR', 'AR', 'BAT', 'COMP', 'ENJ'
];

const OrderForm = ({ onOrderCreated, onClose }) => {
    const [symbol, setSymbol] = useState('BTC');
    const [entryPrice, setEntryPrice] = useState('');
    const [stopLoss, setStopLoss] = useState('');
    const [takeProfit, setTakeProfit] = useState('');
    const [positionType, setPositionType] = useState('LONG'); // Default to LONG
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // Add this to prevent double submission
    const [currentPrice, setCurrentPrice] = useState(null);
    const [fetchingPrice, setFetchingPrice] = useState(false);

    // Fetch current price when symbol changes
    useEffect(() => {
        const fetchCurrentPrice = async () => {
            try {
                setFetchingPrice(true);
                const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
                const data = await response.json();
                
                if (data.price) {
                    setCurrentPrice(parseFloat(data.price));
                    // Optionally auto-fill the entry price field
                    setEntryPrice(parseFloat(data.price).toFixed(2));
                } else {
                    setCurrentPrice(null);
                    toast.error(`Could not fetch price for ${symbol}`);
                }
            } catch (error) {
                console.error('Error fetching price:', error);
                setCurrentPrice(null);
            } finally {
                setFetchingPrice(false);
            }
        };
        
        fetchCurrentPrice();
    }, [symbol]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Prevent duplicate submissions
        if (isSubmitting) {
            return;
        }
        
        try {
            setIsSubmitting(true);
            setLoading(true);
            
            // Validate inputs
            if (!symbol || !entryPrice || !stopLoss || !takeProfit) {
                toast.error('Please fill in all fields');
                return;
            }
            
            // Convert to proper number formats
            const numericEntryPrice = parseFloat(entryPrice);
            const numericStopLoss = parseFloat(stopLoss);
            const numericTakeProfit = parseFloat(takeProfit);
            
            if (isNaN(numericEntryPrice) || isNaN(numericStopLoss) || isNaN(numericTakeProfit)) {
                toast.error('All price fields must be valid numbers');
                return;
            }
            
            // Validate based on position type
            if (positionType === 'LONG') {
                if (numericStopLoss >= numericEntryPrice) {
                    toast.error('For LONG positions, Stop Loss must be lower than Entry Price');
                    return;
                }
                if (numericTakeProfit <= numericEntryPrice) {
                    toast.error('For LONG positions, Take Profit must be higher than Entry Price');
                    return;
                }
            } else { // SHORT
                if (numericStopLoss <= numericEntryPrice) {
                    toast.error('For SHORT positions, Stop Loss must be higher than Entry Price');
                    return;
                }
                if (numericTakeProfit >= numericEntryPrice) {
                    toast.error('For SHORT positions, Take Profit must be lower than Entry Price');
                    return;
                }
            }
            
            // Get the current user
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                toast.error('You must be logged in to create an order');
                return;
            }
            
            // Create the order in the database
            const { data, error } = await supabase
                .from('orders')
                .insert([
                    {
                        user_id: user.id,
                        symbol: symbol, // Use the selected symbol directly (already uppercase)
                        entry_price: numericEntryPrice,
                        stop_loss: numericStopLoss,
                        take_profit: numericTakeProfit,
                        position_type: positionType,
                        status: 'open',
                        created_at: new Date().toISOString()
                    }
                ])
                .select();
            
            if (error) {
                throw error;
            }
            
            // Clear the form
            setEntryPrice('');
            setStopLoss('');
            setTakeProfit('');
            setPositionType('LONG');
            
            toast.success('Order created successfully!');
            
            // Notify parent component
            if (onOrderCreated && data) {
                onOrderCreated(data[0]);
            }
            
        } catch (error) {
            console.error('Error creating order:', error);
            toast.error(`Failed to create order: ${error.message}`);
        } finally {
            setLoading(false);
            setTimeout(() => {
                setIsSubmitting(false); // Reset submission state with a slight delay
            }, 500);
        }
    };
    
    return (
        <div className="order-form-container">
            <div className="form-header">
                <h2>Create New Order</h2>
                <button 
                    type="button" 
                    className="close-btn" 
                    onClick={onClose}
                    aria-label="Close"
                >
                    <IoMdClose />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="order-form">
                <div className="form-group">
                    <label htmlFor="symbol">Symbol</label>
                    <select
                        id="symbol"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                        required
                        className="symbol-select"
                    >
                        {popularSymbols.map(sym => (
                            <option key={sym} value={sym}>{sym}</option>
                        ))}
                    </select>
                </div>
                
                {/* Current Price Display */}
                {fetchingPrice ? (
                    <div className="current-price-display loading">
                        <span className="price-label">Current Price:</span>
                        <span className="price-value">Loading...</span>
                    </div>
                ) : currentPrice ? (
                    <div className="current-price-display">
                        <span className="price-label">Current Price:</span>
                        <span className="price-value">${currentPrice.toFixed(2)}</span>
                    </div>
                ) : null}
                
                <div className="form-group">
                    <label>Position Type</label>
                    <div className="position-type-selector">
                        <button
                            type="button"
                            className={`position-btn ${positionType === 'LONG' ? 'active' : ''}`}
                            onClick={() => setPositionType('LONG')}
                        >
                            LONG
                        </button>
                        <button
                            type="button"
                            className={`position-btn ${positionType === 'SHORT' ? 'active' : ''}`}
                            onClick={() => setPositionType('SHORT')}
                        >
                            SHORT
                        </button>
                    </div>
                </div>
                
                <div className="form-group">
                    <label htmlFor="entryPrice">Entry Price ($)</label>
                    <input
                        id="entryPrice"
                        type="number"
                        value={entryPrice}
                        onChange={(e) => setEntryPrice(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="stopLoss">
                        Stop Loss ($)
                        <span className="helper-text">
                            {positionType === 'LONG' ? ' Must be lower than entry' : ' Must be higher than entry'}
                        </span>
                    </label>
                    <input
                        id="stopLoss"
                        type="number"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="takeProfit">
                        Take Profit ($)
                        <span className="helper-text">
                            {positionType === 'LONG' ? ' Must be higher than entry' : ' Must be lower than entry'}
                        </span>
                    </label>
                    <input
                        id="takeProfit"
                        type="number"
                        value={takeProfit}
                        onChange={(e) => setTakeProfit(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                    />
                </div>
                
                <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={loading || isSubmitting}
                >
                    {loading ? 'Creating...' : 'Create Order'}
                </button>
            </form>
        </div>
    );
};

export default OrderForm; 