import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import './PublicPortfolio.css';

const PublicPortfolio = () => {
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPublicTrades = async () => {
            try {
                setLoading(true);
                // Fetch recent successful trades from order_history
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
                        users:user_id (nickname)
                    `)
                    .order('closed_at', { ascending: false })
                    .limit(15); // Show 15 most recent trades
                
                if (error) throw error;
                
                // Format the data
                setTrades(data);
            } catch (err) {
                console.error('Error fetching public trades:', err);
                setError('Failed to load trade data');
            } finally {
                setLoading(false);
            }
        };
        
        fetchPublicTrades();
        
        // Set up a refresh interval (every 60 seconds)
        const interval = setInterval(fetchPublicTrades, 60000);
        
        return () => clearInterval(interval);
    }, []);

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
    };

    return (
        <div className="public-portfolio-container">
            <div className="public-portfolio-header">
                <h2>Community Trades</h2>
                <p>See what others are trading and how they're performing</p>
            </div>
            
            {loading ? (
                <div className="loading-spinner">Loading trades...</div>
            ) : error ? (
                <div className="error-message">{error}</div>
            ) : trades.length === 0 ? (
                <div className="no-trades-message">No public trades available yet</div>
            ) : (
                <div className="public-trades-grid">
                    {trades.map(trade => (
                        <div 
                            key={trade.id} 
                            className={`trade-card ${parseFloat(trade.profit_loss) >= 0 ? 'profitable' : 'loss'}`}
                        >
                            <div className="trade-header">
                                <div className="trade-symbol">{trade.symbol}</div>
                                <div className={`trade-type ${trade.position_type.toLowerCase()}`}>
                                    {trade.position_type}
                                </div>
                            </div>
                            
                            <div className="trade-result">
                                <span className={`profit-loss-percentage ${parseFloat(trade.profit_loss) >= 0 ? 'positive' : 'negative'}`}>
                                    {parseFloat(trade.profit_loss) >= 0 ? '+' : ''}
                                    {parseFloat(trade.profit_loss).toFixed(2)}%
                                </span>
                            </div>
                            
                            <div className="trade-details">
                                <div className="price-info">
                                    <div className="price-row">
                                        <span className="label">Entry:</span>
                                        <span className="value">${parseFloat(trade.entry_price).toFixed(2)}</span>
                                    </div>
                                    <div className="price-row">
                                        <span className="label">Exit:</span>
                                        <span className="value">${parseFloat(trade.close_price).toFixed(2)}</span>
                                    </div>
                                </div>
                                
                                <div className="trader-info">
                                    <div className="trader-name">
                                        {trade.users?.nickname || 'Anonymous Trader'}
                                    </div>
                                    <div className="trade-date">
                                        {formatDate(trade.closed_at)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PublicPortfolio; 