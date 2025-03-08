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
    const [marketType, setMarketType] = useState('crypto'); // Default to crypto
    const [forexPairs, setForexPairs] = useState([]);

    // Fetch forex pairs when market type is forex
    useEffect(() => {
        if (marketType === 'forex') {
            const fetchForexPairs = async () => {
                try {
                    const apiKey = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;
                    // Alpha Vantage doesn't have a direct endpoint for all forex pairs
                    // So we'll use a predefined list of common pairs
                    setForexPairs([
                        'EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CHF', 'USD/CAD', 
                        'AUD/USD', 'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY'
                    ]);
                } catch (error) {
                    console.error('Error loading forex pairs:', error);
                    toast.error('Failed to load forex pairs');
                }
            };
            
            fetchForexPairs();
        }
    }, [marketType]);

    // Fetch current price when symbol changes
    useEffect(() => {
        const fetchCurrentPrice = async () => {
            try {
                setFetchingPrice(true);
                
                if (marketType === 'crypto') {
                    // Existing crypto price fetch logic
                    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
                    const data = await response.json();
                    
                    if (data.price) {
                        setCurrentPrice(parseFloat(data.price));
                        setEntryPrice(parseFloat(data.price).toFixed(2));
                    } else {
                        setCurrentPrice(null);
                        toast.error(`Could not fetch price for ${symbol}`);
                    }
                } else if (marketType === 'forex') {
                    // Forex price fetch using Alpha Vantage
                    const apiKey = process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;
                    const [fromCurrency, toCurrency] = symbol.split('/');
                    const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${apiKey}`;
                    
                    const response = await fetch(url);
                    const data = await response.json();
                    
                    if (data['Realtime Currency Exchange Rate']) {
                        const price = parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate']);
                        setCurrentPrice(price);
                        setEntryPrice(price.toFixed(4));
                    } else {
                        setCurrentPrice(null);
                        toast.error(`Could not fetch price for ${symbol}`);
                    }
                }
            } catch (error) {
                console.error('Error fetching price:', error);
                setCurrentPrice(null);
            } finally {
                setFetchingPrice(false);
            }
        };
        
        if (symbol) {
            fetchCurrentPrice();
        }
    }, [symbol, marketType]);

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
            
            // Create the order in the database with market_type
            const { data, error } = await supabase
                .from('orders')
                .insert([
                    {
                        user_id: user.id,
                        symbol: symbol,
                        entry_price: numericEntryPrice,
                        stop_loss: numericStopLoss,
                        take_profit: numericTakeProfit,
                        position_type: positionType,
                        market_type: marketType,
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
        <div className="order-form-overlay">
            <div className="order-form-container">
                <div className="form-header">
                    <h2>Create New Order</h2>
                    <button className="close-btn" onClick={onClose}>
                        <IoMdClose />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="order-form">
                    <div className="form-group">
                        <label>Market Type</label>
                        <div className="market-type-selector">
                            <button
                                className={`market-btn ${marketType === 'crypto' ? 'active' : ''}`}
                                onClick={() => setMarketType('crypto')}
                            >
                                Cryptocurrency
                            </button>
                            <button
                                className={`market-btn ${marketType === 'forex' ? 'active' : ''}`}
                                onClick={() => setMarketType('forex')}
                            >
                                Forex
                            </button>
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="symbol">Symbol</label>
                        <select
                            id="symbol"
                            className="form-input"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            required
                        >
                            <option value="">Select a {marketType === 'crypto' ? 'cryptocurrency' : 'forex pair'}</option>
                            {marketType === 'crypto' ? (
                                popularSymbols.map(sym => (
                                    <option key={sym} value={sym}>{sym}</option>
                                ))
                            ) : (
                                forexPairs.map(pair => (
                                    <option key={pair} value={pair}>{pair}</option>
                                ))
                            )}
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
                        <label>Entry Price</label>
                        <input
                            type="number"
                            className="form-input"
                            value={entryPrice}
                            onChange={(e) => setEntryPrice(e.target.value)}
                            placeholder="Enter your entry price"
                            step="0.00000001"
                            min="0"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Stop Loss <span className="helper-instruction">Must be lower than entry</span></label>
                        <input
                            type="number"
                            className="form-input"
                            value={stopLoss}
                            onChange={(e) => setStopLoss(e.target.value)}
                            placeholder="Enter your stop loss"
                            step="0.00000001"
                            min="0"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Take Profit <span className="helper-instruction">Must be higher than entry</span></label>
                        <input
                            type="number"
                            className="form-input"
                            value={takeProfit}
                            onChange={(e) => setTakeProfit(e.target.value)}
                            placeholder="Enter your take profit"
                            step="0.00000001"
                            min="0"
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
        </div>
    );
};

export default OrderForm; 