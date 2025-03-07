-- This function will handle the transaction to ensure data consistency
CREATE OR REPLACE FUNCTION close_order_transaction(
  order_id UUID,
  close_price NUMERIC,
  profit_loss NUMERIC,
  close_reason TEXT
) RETURNS void AS $$
DECLARE
  order_record RECORD;
BEGIN
  -- Get the order details
  SELECT * INTO order_record FROM orders WHERE id = order_id;
  
  -- Make sure the order exists
  IF order_record IS NULL THEN
    RAISE EXCEPTION 'Order with ID % not found', order_id;
  END IF;
  
  -- Insert into order_history
  INSERT INTO order_history (
    id,
    order_id,
    user_id,
    symbol,
    entry_price,
    stop_loss,
    take_profit,
    position_type,
    close_price,
    profit_loss,
    close_reason,
    created_at,
    closed_at
  ) VALUES (
    uuid_generate_v4(),
    order_record.id,
    order_record.user_id,
    order_record.symbol,
    order_record.entry_price,
    order_record.stop_loss,
    order_record.take_profit,
    order_record.position_type,
    close_price,
    profit_loss,
    close_reason,
    order_record.created_at,
    NOW()
  );
  
  -- Delete the original order
  DELETE FROM orders WHERE id = order_id;
END;
$$ LANGUAGE plpgsql; 