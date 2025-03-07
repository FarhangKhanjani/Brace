// This would be deployed as a serverless function (AWS Lambda, Vercel, etc.)
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for background tasks
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndExecuteOrders() {
  console.log('Running order monitor check...');
  
  try {
    // Get all open orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'open');
      
    if (error) {
      throw error;
    }
    
    // Group orders by symbol AND market_type to handle them separately
    const ordersBySymbolAndMarket = {};
    orders.forEach(order => {
      const key = `${order.market_type || 'crypto'}_${order.symbol}`;
      if (!ordersBySymbolAndMarket[key]) {
        ordersBySymbolAndMarket[key] = [];
      }
      ordersBySymbolAndMarket[key].push(order);
    });
    
    // Process each symbol's orders
    for (const [key, ordersGroup] of Object.entries(ordersBySymbolAndMarket)) {
      // Skip if no orders for this symbol
      if (ordersGroup.length === 0) continue;
      
      const [marketType, symbol] = key.split('_');
      let currentPrice;
      
      try {
        // Fetch current price based on market type
        if (marketType === 'crypto') {
          // Fetch crypto price from Binance
          const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
          const data = await response.json();
          
          if (data.price) {
            currentPrice = parseFloat(data.price);
          } else {
            console.error(`Could not fetch price for crypto ${symbol}`);
            continue; // Skip this symbol if price fetch failed
          }
        } else if (marketType === 'forex') {
          // Fetch forex price from Alpha Vantage
          const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
          const [fromCurrency, toCurrency] = symbol.split('/');
          const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${apiKey}`;
          
          const response = await fetch(url);
          const data = await response.json();
          
          if (data['Realtime Currency Exchange Rate']) {
            currentPrice = parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate']);
          } else {
            console.error(`Could not fetch price for forex pair ${symbol}`);
            continue; // Skip this symbol if price fetch failed
          }
        }
        
        // Now check each order against the current price
        for (const order of ordersGroup) {
          let shouldClose = false;
          let closeReason = '';
          
          // Check stop loss condition
          if (order.position_type === 'LONG' && currentPrice <= order.stop_loss) {
            shouldClose = true;
            closeReason = 'stop_loss_triggered';
          } else if (order.position_type === 'SHORT' && currentPrice >= order.stop_loss) {
            shouldClose = true;
            closeReason = 'stop_loss_triggered';
          }
          
          // Check take profit condition
          else if (order.position_type === 'LONG' && currentPrice >= order.take_profit) {
            shouldClose = true;
            closeReason = 'take_profit_triggered';
          } else if (order.position_type === 'SHORT' && currentPrice <= order.take_profit) {
            shouldClose = true;
            closeReason = 'take_profit_triggered';
          }
          
          // Close order if conditions met
          if (shouldClose) {
            await closeOrder(order, currentPrice, closeReason);
          }
        }
      } catch (error) {
        console.error(`Error processing ${marketType} ${symbol}:`, error);
      }
    }
    
    console.log('Order monitoring completed successfully');
    
  } catch (error) {
    console.error('Error in order monitoring service:', error);
  }
}

async function closeOrder(order, currentPrice, closeReason) {
  try {
    console.log(`Closing order ${order.id} due to ${closeReason} at price ${currentPrice}`);
    
    // Calculate profit/loss percentage
    let profitLossPercent;
    if (order.position_type === 'LONG') {
      profitLossPercent = ((currentPrice - order.entry_price) / order.entry_price) * 100;
    } else { // SHORT
      profitLossPercent = ((order.entry_price - currentPrice) / order.entry_price) * 100;
    }
    
    // Begin transaction
    const { error: transactionError } = await supabase.rpc('close_order_transaction', { 
      order_id: order.id,
      close_price: currentPrice,
      profit_loss: profitLossPercent.toFixed(2),
      close_reason: closeReason
    });
    
    if (transactionError) {
      throw transactionError;
    }
    
    // Send notification to user (if you have a notification system)
    await createNotification(order.user_id, {
      type: 'order_closed',
      title: `${closeReason === 'stop_loss_triggered' ? 'Stop Loss' : 'Take Profit'} Triggered`,
      message: `Your ${order.position_type} position for ${order.symbol} was automatically closed at $${currentPrice.toFixed(2)} (${profitLossPercent >= 0 ? '+' : ''}${profitLossPercent.toFixed(2)}%)`,
      orderDetails: {
        symbol: order.symbol,
        position_type: order.position_type,
        entry_price: order.entry_price,
        close_price: currentPrice,
        profit_loss: profitLossPercent.toFixed(2)
      }
    });
    
    console.log(`Successfully closed order ${order.id}`);
    
  } catch (error) {
    console.error(`Error closing order ${order.id}:`, error);
  }
}

async function createNotification(userId, notificationData) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        ...notificationData,
        read: false,
        created_at: new Date().toISOString()
      }]);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// Export for serverless function
module.exports = checkAndExecuteOrders; 