import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// API Keys
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const OPEN_EXCHANGE_RATES_API_KEY = process.env.NODE_ENV === 'production' 
  ? process.env.OPEN_EXCHANGE_RATES_API_KEY_GLOBAL 
  : process.env.OPEN_EXCHANGE_RATES_API_KEY_LOCAL;

// Fetch crypto prices
export async function fetchCryptoPrices(symbols) {
  const prices = {};
  
  try {
    for (const symbol of symbols) {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${symbol}&to_currency=USD&apikey=${ALPHA_VANTAGE_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data && data['Realtime Currency Exchange Rate']) {
        const price = parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate']);
        prices[`crypto_${symbol}`] = price;
      }
    }
    
    return prices;
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    return prices;
  }
}

// Fetch forex prices using Open Exchange Rates API
export async function fetchForexPrices(symbols) {
  const prices = {};
  
  try {
    // Fetch base rates from USD
    const response = await fetch(
      `https://openexchangerates.org/api/latest.json?app_id=${OPEN_EXCHANGE_RATES_API_KEY}&base=USD`
    );
    
    const data = await response.json();
    
    if (data && data.rates) {
      for (const symbol of symbols) {
        // For each currency pair like "EURUSD", we need to calculate the rate
        const baseCurrency = symbol.substring(0, 3);
        const quoteCurrency = symbol.substring(3, 6);
        
        // If base currency is USD
        if (baseCurrency === 'USD') {
          const rate = data.rates[quoteCurrency];
          if (rate) {
            prices[`forex_${symbol}`] = rate;
          }
        } 
        // If quote currency is USD
        else if (quoteCurrency === 'USD') {
          const rate = 1 / data.rates[baseCurrency];
          if (rate) {
            prices[`forex_${symbol}`] = rate;
          }
        } 
        // If neither currency is USD
        else {
          const baseToUsd = 1 / data.rates[baseCurrency]; // Convert base to USD
          const usdToQuote = data.rates[quoteCurrency];   // Convert USD to quote
          const crossRate = baseToUsd * usdToQuote;       // Calculate cross rate
          
          if (baseToUsd && usdToQuote) {
            prices[`forex_${symbol}`] = crossRate;
          }
        }
      }
    }
    
    return prices;
  } catch (error) {
    console.error('Error fetching forex prices:', error);
    return prices;
  }
}

// Save prices to database
export async function savePricesToDatabase(prices) {
  try {
    const { error } = await supabase
      .from('prices')
      .upsert(
        Object.keys(prices).map(symbol => ({
          symbol,
          price: prices[symbol],
          timestamp: new Date().toISOString()
        })),
        { onConflict: 'symbol' }
      );
      
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error saving prices to database:', error);
    return { success: false, error };
  }
}

// Main function to update all prices
export async function updateAllPrices() {
  try {
    // Get unique symbols from orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select('symbol, market_type');
      
    if (error) throw error;
    
    // Extract symbols by market type
    const cryptoSymbols = [...new Set(
      orders
        .filter(order => order.market_type === 'crypto')
        .map(order => order.symbol.replace('USDT', ''))
    )];
    
    const forexSymbols = [...new Set(
      orders
        .filter(order => order.market_type === 'forex')
        .map(order => order.symbol)
    )];
    
    // Fetch prices
    const cryptoPrices = await fetchCryptoPrices(cryptoSymbols);
    const forexPrices = await fetchForexPrices(forexSymbols);
    
    // Combine prices
    const allPrices = { ...cryptoPrices, ...forexPrices };
    
    // Save to database
    await savePricesToDatabase(allPrices);
    
    return { success: true, prices: allPrices };
  } catch (error) {
    console.error('Error updating prices:', error);
    return { success: false, error };
  }
} 