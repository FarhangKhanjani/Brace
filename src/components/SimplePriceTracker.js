import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import './SimplePriceTracker.css';
import { supabase } from '../supabase';
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

const SimplePriceTracker = () => {
  const [priceData, setPriceData] = useState({});
  const [selectedCrypto, setSelectedCrypto] = useState('bitcoin');
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('24h');

  useEffect(() => {
    fetchPriceData();
  }, [selectedCrypto, timeframe]);

  const fetchPriceData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('crypto_prices')
        .select('*')
        .eq('symbol', selectedCrypto)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Process data according to timeframe
        let filteredData = data;
        const now = new Date();
        
        if (timeframe === '24h') {
          const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          filteredData = data.filter(item => new Date(item.timestamp) >= oneDayAgo);
        } else if (timeframe === '7d') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filteredData = data.filter(item => new Date(item.timestamp) >= sevenDaysAgo);
        } else if (timeframe === '30d') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filteredData = data.filter(item => new Date(item.timestamp) >= thirtyDaysAgo);
        }

        const formattedData = {
          labels: filteredData.map(item => {
            const date = new Date(item.timestamp);
            return timeframe === '24h' 
              ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : date.toLocaleDateString();
          }),
          prices: filteredData.map(item => item.price),
          currentPrice: filteredData[filteredData.length - 1]?.price || 0,
          priceChange: filteredData.length > 1 
            ? (filteredData[filteredData.length - 1].price - filteredData[0].price) / filteredData[0].price * 100
            : 0,
        };

        setPriceData(formattedData);
      } else {
        // Set default empty data
        setPriceData({
          labels: [],
          prices: [],
          currentPrice: 0,
          priceChange: 0
        });
      }
    } catch (error) {
      console.error('Error fetching price data:', error);
      // Set default empty data on error
      setPriceData({
        labels: [],
        prices: [],
        currentPrice: 0,
        priceChange: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const renderPriceChart = () => {
    if (loading) {
      return <div className="loading-indicator">Loading price data...</div>;
    }

    // Safely check if we have all the data we need
    if (!priceData || !priceData.labels || !priceData.prices || priceData.labels.length === 0) {
      return <div className="no-data-message">No price data available</div>;
    }

    const data = {
      labels: priceData.labels,
      datasets: [
        {
          label: selectedCrypto.toUpperCase(),
          data: priceData.prices,
          fill: 'start',
          backgroundColor: 'rgba(0, 218, 198, 0.1)',
          borderColor: '#00DAC6',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#7B68EE',
          pointHoverBorderColor: '#fff',
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: '#1E1B2E',
          titleColor: '#fff',
          bodyColor: '#ddd',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawBorder: false,
          },
          ticks: {
            display: true,
            color: '#aaa',
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 6,
          },
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            drawBorder: false,
          },
          ticks: {
            display: true,
            color: '#aaa',
            callback: function(value) {
              return '$' + value.toFixed(2);
            },
          },
        },
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
    };

    return <Line data={data} options={options} />;
  };

  // Ensure we have a current price before trying to format it
  const formattedPrice = priceData.currentPrice !== undefined 
    ? `$${priceData.currentPrice.toFixed(2)}` 
    : '$0.00';

  // Ensure we have a price change before trying to format it
  const formattedPriceChange = priceData.priceChange !== undefined 
    ? `${priceData.priceChange > 0 ? '+' : ''}${priceData.priceChange.toFixed(2)}%` 
    : '0.00%';

  const isPriceUp = priceData.priceChange > 0;

  return (
    <div className="price-tracker-container">
      <div className="price-tracker-header">
        <div className="crypto-selector">
          <select 
            value={selectedCrypto} 
            onChange={(e) => setSelectedCrypto(e.target.value)}
            className="crypto-select"
          >
            <option value="bitcoin">Bitcoin (BTC)</option>
            <option value="ethereum">Ethereum (ETH)</option>
            <option value="litecoin">Litecoin (LTC)</option>
            <option value="dogecoin">Dogecoin (DOGE)</option>
            <option value="cardano">Cardano (ADA)</option>
          </select>
        </div>
        <div className="timeframe-selector">
          <button 
            className={`timeframe-btn ${timeframe === '24h' ? 'active' : ''}`}
            onClick={() => setTimeframe('24h')}
          >
            24H
          </button>
          <button 
            className={`timeframe-btn ${timeframe === '7d' ? 'active' : ''}`}
            onClick={() => setTimeframe('7d')}
          >
            7D
          </button>
          <button 
            className={`timeframe-btn ${timeframe === '30d' ? 'active' : ''}`}
            onClick={() => setTimeframe('30d')}
          >
            30D
          </button>
        </div>
      </div>
      
      <div className="price-display">
        <div className="current-price">{formattedPrice}</div>
        <div className={`price-change ${isPriceUp ? 'positive' : 'negative'}`}>
          {formattedPriceChange}
        </div>
      </div>
      
      <div className="price-chart">
        {renderPriceChart()}
      </div>
    </div>
  );
};

export default SimplePriceTracker; 