import React from 'react';
import './SimplePriceTracker.css';

const SimplePriceTracker = ({ currentPrice, entryPrice, stopLoss, takeProfit, positionType = 'long' }) => {
    // Calculate percentages for the progress bar
    const calculatePercentages = () => {
        const min = Math.min(entryPrice, stopLoss, takeProfit) * 0.9; // 10% below minimum
        const max = Math.max(entryPrice, stopLoss, takeProfit) * 1.1; // 10% above maximum
        const range = max - min;
        
        // Calculate positions as percentages
        const entryPercent = ((entryPrice - min) / range) * 100;
        const slPercent = ((stopLoss - min) / range) * 100;
        const tpPercent = ((takeProfit - min) / range) * 100;
        const currentPercent = ((currentPrice - min) / range) * 100;
        
        return {
            entry: entryPercent,
            sl: slPercent,
            tp: tpPercent,
            current: currentPercent,
            min,
            max
        };
    };
    
    const percentages = calculatePercentages();
    
    // Determine if we're in profit or loss
    const isProfitable = positionType === 'long' 
        ? currentPrice > entryPrice 
        : currentPrice < entryPrice;
    
    // Calculate profit/loss percentage
    const profitLossPercent = positionType === 'long'
        ? ((currentPrice - entryPrice) / entryPrice * 100).toFixed(2)
        : ((entryPrice - currentPrice) / entryPrice * 100).toFixed(2);
    
    return (
        <div className="simple-tracker">
            <div className="price-info">
                <div className="current-price">
                    <span className="label">Current Price:</span>
                    <span className={`value ${isProfitable ? 'profit' : 'loss'}`}>
                        {currentPrice.toFixed(2)}
                    </span>
                </div>
                <div className={`profit-loss ${isProfitable ? 'profit' : 'loss'}`}>
                    {isProfitable ? '+' : ''}{profitLossPercent}%
                </div>
            </div>
            
            <div className="price-bar-container">
                <div className="price-bar">
                    {/* Entry marker */}
                    <div 
                        className="price-marker entry" 
                        style={{ left: `${percentages.entry}%` }}
                        title={`Entry: ${entryPrice.toFixed(2)}`}
                    >
                        <div className="marker-label">Entry</div>
                    </div>
                    
                    {/* Stop Loss marker */}
                    <div 
                        className="price-marker sl" 
                        style={{ left: `${percentages.sl}%` }}
                        title={`Stop Loss: ${stopLoss.toFixed(2)}`}
                    >
                        <div className="marker-label">SL</div>
                    </div>
                    
                    {/* Take Profit marker */}
                    <div 
                        className="price-marker tp" 
                        style={{ left: `${percentages.tp}%` }}
                        title={`Take Profit: ${takeProfit.toFixed(2)}`}
                    >
                        <div className="marker-label">TP</div>
                    </div>
                    
                    {/* Current price indicator */}
                    <div 
                        className={`current-indicator ${isProfitable ? 'profit' : 'loss'}`}
                        style={{ left: `${percentages.current}%` }}
                    ></div>
                </div>
                
                {/* Price scale */}
                <div className="price-scale">
                    <span>{percentages.min.toFixed(2)}</span>
                    <span>{percentages.max.toFixed(2)}</span>
                </div>
            </div>
            
            <div className="price-status">
                {isProfitable ? (
                    <div className="status profit">
                        <i className="fa fa-arrow-up"></i> In Profit
                    </div>
                ) : (
                    <div className="status loss">
                        <i className="fa fa-arrow-down"></i> In Loss
                    </div>
                )}
                
                {positionType === 'long' ? (
                    currentPrice >= takeProfit ? (
                        <div className="alert tp-alert">Take Profit Reached!</div>
                    ) : currentPrice <= stopLoss ? (
                        <div className="alert sl-alert">Stop Loss Reached!</div>
                    ) : null
                ) : (
                    currentPrice <= takeProfit ? (
                        <div className="alert tp-alert">Take Profit Reached!</div>
                    ) : currentPrice >= stopLoss ? (
                        <div className="alert sl-alert">Stop Loss Reached!</div>
                    ) : null
                )}
            </div>
        </div>
    );
};

export default SimplePriceTracker; 