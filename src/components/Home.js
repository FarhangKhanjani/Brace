import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import { 
    BsCurrencyBitcoin, 
    BsCurrencyEuro 
} from 'react-icons/bs';
import { SiBinance, SiSolana } from 'react-icons/si';
import axios from 'axios';

const Home = () => {
    const [cryptoData, setCryptoData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Define the crypto symbols we want to display
    const cryptoSymbols = [
        {
            id: 'bitcoin',
            symbol: 'BTCUSDT',
            name: 'Bitcoin',
            icon: <BsCurrencyBitcoin size={32} color="#F7931A" />,
        },
        {
            id: 'ethereum',
            symbol: 'ETHUSDT',
            name: 'Ethereum',
            icon: <BsCurrencyEuro size={32} color="#627EEA" />,
        },
        {
            id: 'binancecoin',
            symbol: 'BNBUSDT',
            name: 'BNB',
            icon: <SiBinance size={32} color="#F3BA2F" />,
        },
        {
            id: 'solana',
            symbol: 'SOLUSDT',
            name: 'Solana',
            icon: <SiSolana size={32} color="#00FFA3" />,
        }
    ];

    useEffect(() => {
        const fetchCryptoData = async () => {
            try {
                setLoading(true);
                
                // Fetch data for all symbols from Binance API
                const responses = await Promise.all(
                    cryptoSymbols.map(crypto => 
                        axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${crypto.symbol}`)
                    )
                );
                
                // Process the responses
                const processedData = responses.map((response, index) => {
                    const data = response.data;
                    return {
                        ...cryptoSymbols[index],
                        price: parseFloat(data.lastPrice),
                        change: parseFloat(data.priceChangePercent),
                        high24h: parseFloat(data.highPrice),
                        low24h: parseFloat(data.lowPrice),
                    };
                });
                
                setCryptoData(processedData);
                setError(null);
            } catch (err) {
                console.error('Error fetching crypto data:', err);
                setError('Failed to load cryptocurrency data. Using fallback data.');
                
                // Fallback data if API fails
                setCryptoData([
                    {
                        id: 'bitcoin',
                        name: 'Bitcoin',
                        symbol: 'BTC',
                        price: 91696.64,
                        change: 4.13,
                        icon: <BsCurrencyBitcoin size={32} color="#F7931A" />,
                        high24h: 92114.22,
                        low24h: 91279.06
                    },
                    {
                        id: 'ethereum',
                        name: 'Ethereum',
                        symbol: 'ETH',
                        price: 2338.07,
                        change: 3.11,
                        icon: <BsCurrencyEuro size={32} color="#627EEA" />,
                        high24h: 2446.01,
                        low24h: 2230.13
                    },
                    {
                        id: 'binancecoin',
                        name: 'BNB',
                        symbol: 'BNB',
                        price: 598.59,
                        change: 4.23,
                        icon: <SiBinance size={32} color="#F3BA2F" />,
                        high24h: 603.71,
                        low24h: 593.47
                    },
                    {
                        id: 'solana',
                        name: 'Solana',
                        symbol: 'SOL',
                        price: 158.38,
                        change: 0.29,
                        icon: <SiSolana size={32} color="#00FFA3" />,
                        high24h: 163.22,
                        low24h: 153.54
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchCryptoData();
        
        // Set up interval to refresh data every 30 seconds
        const intervalId = setInterval(fetchCryptoData, 30000);
        
        // Clean up interval on component unmount
        return () => clearInterval(intervalId);
    }, []);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(price);
    };

    return (
        <div className="home-container">
            <section className="hero-section">
                <h1 className="hero-title">Start and Build Your Crypto Portfolio Here</h1>
                <p className="hero-subtitle">
                    Only at CryptoCap, you can build a good portfolio and learn best practices about cryptocurrency.
                </p>
                <Link to="/signup" className="get-started-btn">
                    Get Started
                </Link>
            </section>

            <section className="market-section">
                <h2 className="section-title">Market Trend</h2>
                
                {loading ? (
                    <div className="loading-indicator">Loading latest prices...</div>
                ) : error ? (
                    <div className="error-message">{error}</div>
                ) : (
                    <div className="crypto-grid">
                        {cryptoData.map((crypto) => (
                            <div key={crypto.id} className="crypto-card">
                                <div className="crypto-header">
                                    <div className="crypto-icon">
                                        {crypto.icon}
                                    </div>
                                    <div>
                                        <div className="crypto-name">{crypto.name}</div>
                                        <div className="crypto-symbol">{crypto.symbol.replace('USDT', '')}/USDT</div>
                                    </div>
                                </div>
                                <div className="crypto-price">{formatPrice(crypto.price)}</div>
                                <div className={`crypto-change ${crypto.change >= 0 ? 'positive' : 'negative'}`}>
                                    {crypto.change >= 0 ? '+' : ''}{crypto.change}%
                                </div>
                                <div className="crypto-details">
                                    <div className="detail-label">24h High:</div>
                                    <div className="detail-value">{formatPrice(crypto.high24h)}</div>
                                    <div className="detail-label">24h Low:</div>
                                    <div className="detail-value">{formatPrice(crypto.low24h)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Home; 
