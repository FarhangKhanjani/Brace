import axios from 'axios';

// Cache to store prices and reduce API calls
const priceCache = {
    data: {},
    timestamp: {}
};

// Symbol mapping for Binance (some symbols need to be mapped to Binance's format)
const binanceSymbolMap = {
    'BTC': 'BTCUSDT',
    'ETH': 'ETHUSDT',
    'SOL': 'SOLUSDT',
    'DOGE': 'DOGEUSDT',
    'XRP': 'XRPUSDT',
    'ADA': 'ADAUSDT',
    'DOT': 'DOTUSDT',
    'AVAX': 'AVAXUSDT',
    'MATIC': 'MATICUSDT',
    'LINK': 'LINKUSDT',
    'BNB': 'BNBUSDT',
    'USDT': 'USDTUSD',
    'USDC': 'USDCUSDT',
    'LTC': 'LTCUSDT',
    'UNI': 'UNIUSDT'
};

// Get the current price of a cryptocurrency from CoinCap
export const getCurrentPrice = async (symbol) => {
    const upperSymbol = symbol.toUpperCase();
    
    // Check cache first (valid for 10 seconds)
    const now = Date.now();
    if (priceCache.data[upperSymbol] && (now - priceCache.timestamp[upperSymbol] < 10000)) {
        return priceCache.data[upperSymbol];
    }
    
    try {
        // CoinCap API is free, reliable and has no rate limits for basic usage
        const response = await axios.get(`https://api.coincap.io/v2/assets/${upperSymbol.toLowerCase()}`);
        
        if (response.data && response.data.data && response.data.data.priceUsd) {
            const price = parseFloat(response.data.data.priceUsd);
            
            // Update cache
            priceCache.data[upperSymbol] = price;
            priceCache.timestamp[upperSymbol] = now;
            
            console.log(`Fetched ${upperSymbol} price from CoinCap: ${price}`);
            return price;
        }
        
        // If CoinCap fails, try Binance as fallback
        return fetchBinancePrice(upperSymbol);
    } catch (error) {
        console.error(`Error fetching price for ${symbol} from CoinCap:`, error);
        // Try Binance as fallback
        return fetchBinancePrice(upperSymbol);
    }
};

// Helper function to fetch from Binance as fallback
const fetchBinancePrice = async (symbol) => {
    try {
        // Map the symbol to Binance format
        const binanceSymbol = binanceSymbolMap[symbol] || `${symbol}USDT`;
        
        // Use Binance API to get the current price
        const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`);
        
        if (response.data && response.data.price) {
            const price = parseFloat(response.data.price);
            
            // Update cache
            const now = Date.now();
            priceCache.data[symbol] = price;
            priceCache.timestamp[symbol] = now;
            
            console.log(`Fetched ${symbol} price from Binance fallback: ${price}`);
            return price;
        }
        
        // If both APIs fail, use fallback mock data
        console.warn(`Could not fetch price for ${symbol} from any API, using mock data`);
        return getFallbackPrice(symbol);
    } catch (error) {
        console.error(`Error fetching price for ${symbol} from Binance fallback:`, error);
        return getFallbackPrice(symbol);
    }
};

// Get fallback price (for testing or when API fails)
const getFallbackPrice = (symbol) => {
    // Use realistic mock prices for common symbols
    const mockPrices = {
        'BTC': 94000 + (Math.random() * 1000 - 500),
        'ETH': 2500 + (Math.random() * 100 - 50),
        'SOL': 175 + (Math.random() * 10 - 5),
        'DOGE': 0.15 + (Math.random() * 0.01 - 0.005),
        'XRP': 0.55 + (Math.random() * 0.05 - 0.025),
        'ADA': 0.45 + (Math.random() * 0.05 - 0.025),
        'DOT': 7.5 + (Math.random() * 0.5 - 0.25),
        'AVAX': 35 + (Math.random() * 2 - 1),
        'MATIC': 0.65 + (Math.random() * 0.05 - 0.025),
        'LINK': 15 + (Math.random() * 1 - 0.5),
        'BNB': 620 + (Math.random() * 20 - 10),
        'USDT': 1.0 + (Math.random() * 0.002 - 0.001),
        'USDC': 1.0 + (Math.random() * 0.002 - 0.001),
        'LTC': 80 + (Math.random() * 5 - 2.5),
        'UNI': 10 + (Math.random() * 0.5 - 0.25)
    };
    
    const mockPrice = mockPrices[symbol] || 100 + (Math.random() * 10 - 5);
    
    // Update cache with mock price
    const now = Date.now();
    priceCache.data[symbol] = mockPrice;
    priceCache.timestamp[symbol] = now;
    
    return mockPrice;
};

// Get daily price data from Binance
export const getDailyPrices = async (symbol, days = 30) => {
    const upperSymbol = symbol.toUpperCase();
    const binanceSymbol = binanceSymbolMap[upperSymbol] || `${upperSymbol}USDT`;
    
    try {
        // Binance klines API for daily candles
        // 1d = 1 day interval, limit = number of candles
        const response = await axios.get(
            `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=1d&limit=${days}`
        );
        
        if (response.data && Array.isArray(response.data)) {
            // Process the data to get daily points
            // Binance klines format: [openTime, open, high, low, close, volume, closeTime, ...]
            const dailyData = response.data.map(candle => {
                const date = new Date(candle[0]);
                const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
                const closePrice = parseFloat(candle[4]); // Close price is at index 4
                
                return {
                    date: dateStr,
                    price: closePrice
                };
            });
            
            return dailyData;
        }
        
        // Fallback to mock data
        console.warn(`Could not fetch daily prices for ${symbol} from Binance, using mock data`);
        return generateMockDailyData(upperSymbol, days);
    } catch (error) {
        console.error(`Error fetching daily prices for ${symbol} from Binance:`, error);
        return generateMockDailyData(upperSymbol, days);
    }
};

// Generate mock daily data (for testing or when API fails)
const generateMockDailyData = (symbol, days) => {
    const data = [];
    const now = new Date();
    
    // Set base price based on symbol - using current market prices
    const basePrice = symbol === 'BTC' ? 94000 : 
                     symbol === 'ETH' ? 2500 : 
                     symbol === 'SOL' ? 175 : 100;
    
    let currentPrice = basePrice;
    
    // Generate a point for each day
    for (let i = 0; i < days; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (days - i - 1));
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Add some realistic price movement (daily volatility is higher)
        const volatility = symbol === 'BTC' ? 0.02 : 0.03; // 2-3% daily volatility
        const randomChange = (Math.random() * 2 - 1) * volatility;
        
        // Add a trend component
        const trendFactor = Math.sin(i / days * Math.PI * 2) * 0.005; // Slight sine wave trend
        
        currentPrice = currentPrice * (1 + randomChange + trendFactor);
        
        data.push({
            date: dateStr,
            price: currentPrice
        });
    }
    
    return data;
};

// Get price data at 10-minute intervals from Binance
export const get10MinIntervalPrices = async (symbol, hours = 4) => {
    const upperSymbol = symbol.toUpperCase();
    const binanceSymbol = binanceSymbolMap[upperSymbol] || `${upperSymbol}USDT`;
    
    try {
        // Binance klines API for 10-minute candles
        // 10m = 10 minute interval, limit = number of candles (24 candles per 4 hours)
        const response = await axios.get(
            `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=10m&limit=${hours * 6}`
        );
        
        if (response.data && Array.isArray(response.data)) {
            // Process the data to get 10-minute points
            // Binance klines format: [openTime, open, high, low, close, volume, closeTime, ...]
            const intervalData = response.data.map(candle => {
                const time = new Date(candle[0]);
                const closePrice = parseFloat(candle[4]); // Close price is at index 4
                
                return {
                    time: time.toLocaleTimeString(),
                    price: closePrice
                };
            });
            
            return intervalData;
        }
        
        // Fallback to mock data
        console.warn(`Could not fetch 10-min interval prices for ${symbol} from Binance, using mock data`);
        return generateMock10MinData(upperSymbol, hours);
    } catch (error) {
        console.error(`Error fetching 10-min interval prices for ${symbol} from Binance:`, error);
        return generateMock10MinData(upperSymbol, hours);
    }
};

// Generate mock 10-minute interval data (for testing or when API fails)
const generateMock10MinData = (symbol, hours) => {
    const data = [];
    const now = new Date();
    now.setMinutes(Math.floor(now.getMinutes() / 10) * 10, 0, 0); // Round to nearest 10 minutes
    
    // Set base price based on symbol - using current market prices
    const basePrice = symbol === 'BTC' ? 94000 : 
                     symbol === 'ETH' ? 2500 : 
                     symbol === 'SOL' ? 175 : 100;
    
    let currentPrice = basePrice;
    
    // Generate a point every 10 minutes
    for (let i = 0; i < hours * 6; i++) {
        const timePoint = new Date(now);
        timePoint.setTime(timePoint.getTime() - (hours * 6 - i) * 10 * 60 * 1000);
        
        // Add some realistic price movement
        const volatility = symbol === 'BTC' ? 0.005 : 0.01; // BTC is less volatile in short timeframes
        const randomChange = (Math.random() * 2 - 1) * volatility; // -0.5% to +0.5% for BTC
        
        // Add some trend to make it look more realistic
        const trendFactor = Math.sin(i / (hours * 6) * Math.PI * 2) * 0.001; // Slight sine wave trend
        
        currentPrice = currentPrice * (1 + randomChange + trendFactor);
        
        data.push({
            time: timePoint.toLocaleTimeString(),
            price: currentPrice
        });
    }
    
    return data;
}; 