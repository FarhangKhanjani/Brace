import React, { useState } from 'react';
import './OrderForm.css';
import axios from 'axios';
import config from '../config';
import { toast } from 'react-hot-toast';

const API_URL = config.API_URL;

const OrderForm = ({ onSubmit, user, onCancel }) => {
    const [symbol, setSymbol] = useState('');
    const [entryPrice, setEntryPrice] = useState('');
    const [stopLoss, setStopLoss] = useState('');
    const [takeProfit, setTakeProfit] = useState('');
    const [positionType, setPositionType] = useState('long'); // Default to long position
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validatePrices = () => {
        const entry = parseFloat(entryPrice);
        const sl = parseFloat(stopLoss);
        const tp = parseFloat(takeProfit);
        
        // Different validation rules based on position type
        if (positionType === 'long') {
            // Long position: SL should be below entry, TP should be above entry
            if (entry <= sl) {
                setError('For LONG positions, Stop Loss must be lower than Entry Price');
                return false;
            }
            
            if (entry >= tp) {
                setError('For LONG positions, Take Profit must be higher than Entry Price');
                return false;
            }
        } else {
            // Short position: SL should be above entry, TP should be below entry
            if (entry >= sl) {
                setError('For SHORT positions, Stop Loss must be higher than Entry Price');
                return false;
            }
            
            if (entry <= tp) {
                setError('For SHORT positions, Take Profit must be lower than Entry Price');
                return false;
            }
        }
        
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        
        // Validate the prices before submission
        if (!validatePrices()) {
            setIsSubmitting(false);
            return; // Stop form submission if validation fails
        }
        
        try {
            const orderData = {
                user_id: user.id,
                symbol: symbol.toUpperCase(),
                entry_price: parseFloat(entryPrice),
                stop_loss: parseFloat(stopLoss),
                take_profit: parseFloat(takeProfit),
                position_type: positionType
            };
            
            const response = await axios.post(`${API_URL}/orders`, orderData);
            
            // Show success notification
            toast.success(`${positionType.toUpperCase()} order created for ${symbol.toUpperCase()}`);
            
            // Call the onSubmit callback to update the parent component
            if (onSubmit) onSubmit(response.data);
            
            // Reset form
            setSymbol('');
            setEntryPrice('');
            setStopLoss('');
            setTakeProfit('');
            setPositionType('long');
        } catch (error) {
            console.error("Error creating order:", error);
            setError(error.response?.data?.detail || "Failed to create order");
            toast.error("Failed to create order");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="order-form-container">
            <div className="form-header">
                <h2>Create New Order</h2>
                <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={onCancel}
                    aria-label="Close form"
                >
                    ×
                </button>
            </div>
            
            {error && (
                <div className="error-message">
                    <i className="fa fa-exclamation-circle"></i> {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="order-form">
                <div className="form-group">
                    <label>Symbol</label>
                    <input 
                        type="text" 
                        value={symbol} 
                        onChange={(e) => setSymbol(e.target.value)} 
                        placeholder="e.g. BTC" 
                        required 
                    />
                </div>
                
                <div className="form-group">
                    <label>Position Type</label>
                    <div className="position-type-selector">
                        <button 
                            type="button" 
                            className={`position-btn ${positionType === 'long' ? 'active' : ''}`}
                            onClick={() => setPositionType('long')}
                        >
                            LONG
                        </button>
                        <button 
                            type="button" 
                            className={`position-btn ${positionType === 'short' ? 'active' : ''}`}
                            onClick={() => setPositionType('short')}
                        >
                            SHORT
                        </button>
                    </div>
                </div>
                
                <div className="form-group">
                    <label>Entry Price</label>
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
                    <label>
                        Stop Loss
                        <span className="validation-hint">
                            {positionType === 'long' ? 'Must be lower than Entry' : 'Must be higher than Entry'}
                        </span>
                    </label>
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
                    <label>
                        Take Profit
                        <span className="validation-hint">
                            {positionType === 'long' ? 'Must be higher than Entry' : 'Must be lower than Entry'}
                        </span>
                    </label>
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
                
                <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Creating...' : 'Create Order'}
                </button>
            </form>
        </div>
    );
};

export default OrderForm; 