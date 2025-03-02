import React, { useState } from 'react';
import config from '../config';
const API_URL = config.API_URL;

const OrderForm = ({ onSubmit, user }) => {
    const [symbol, setSymbol] = useState('');
    const [entryPrice, setEntryPrice] = useState('');
    const [stopLoss, setStopLoss] = useState('');
    const [takeProfit, setTakeProfit] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            // Prepare order data without user_id (will be added in Dashboard)
            const orderData = {
                symbol: symbol.toUpperCase(),
                entry_price: parseFloat(entryPrice),
                stop_loss: parseFloat(stopLoss),
                take_profit: parseFloat(takeProfit)
            };

            console.log('Form submitting order data:', orderData);
            await onSubmit(orderData);
            
            // Clear form on success
            setSymbol('');
            setEntryPrice('');
            setStopLoss('');
            setTakeProfit('');
        } catch (error) {
            setError(error.message || "Failed to submit order");
        }
    };

    return (
        <div className="order-form">
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Symbol (e.g., BTC)</label>
                    <input 
                        type="text" 
                        value={symbol} 
                        onChange={(e) => setSymbol(e.target.value)} 
                        placeholder="Symbol" 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Entry Price ($)</label>
                    <input 
                        type="number" 
                        value={entryPrice} 
                        onChange={(e) => setEntryPrice(e.target.value)} 
                        placeholder="Entry Price" 
                        step="0.01"
                        min="0"
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Stop Loss ($)</label>
                    <input 
                        type="number" 
                        value={stopLoss} 
                        onChange={(e) => setStopLoss(e.target.value)} 
                        placeholder="Stop Loss" 
                        step="0.01"
                        min="0"
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Take Profit ($)</label>
                    <input 
                        type="number" 
                        value={takeProfit} 
                        onChange={(e) => setTakeProfit(e.target.value)} 
                        placeholder="Take Profit" 
                        step="0.01"
                        min="0"
                        required 
                    />
                </div>
                <button type="submit" className="submit-btn">Create Order</button>
            </form>
        </div>
    );
};

export default OrderForm; 