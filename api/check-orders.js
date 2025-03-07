import checkAndExecuteOrders from '../src/server/orderMonitor';

export default async function handler(req, res) {
  try {
    await checkAndExecuteOrders();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in order monitoring:', error);
    res.status(500).json({ success: false, error: error.message });
  }
} 