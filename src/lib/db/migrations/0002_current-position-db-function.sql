-- =============================================
-- CREATE POSITION MAINTENANCE FUNCTION
-- This maintains fact_current_positions automatically
-- =============================================
CREATE OR REPLACE FUNCTION update_current_positions_trigger()
RETURNS TRIGGER AS $$
DECLARE
    pos_direction INTEGER;
    affects_pos BOOLEAN;
BEGIN
    -- Get direction and position flag from transaction type
    SELECT direction, affects_position 
    INTO pos_direction, affects_pos
    FROM dim_transaction_type 
    WHERE transaction_type_key = NEW.transaction_type_key;
    
    -- Skip non-position-affecting transactions
    IF NOT affects_pos THEN
        RETURN NEW;
    END IF;
    
    -- Update or insert current position
    INSERT INTO fact_current_positions (
        account_key,
        security_symbol,
        security_type,
        security_option_type,
        security_strike_price,
        security_expiry_date,
        quantity_held,
        cost_basis,
        average_price,
        first_transaction_date,
        last_transaction_date,
        created_at,
        updated_at
    ) VALUES (
        NEW.account_key,
        NEW.security_symbol,
        NEW.security_type,
        NEW.security_option_type,
        NEW.security_strike_price,
        NEW.security_expiry_date,
        NEW.quantity * pos_direction,
        CASE WHEN pos_direction = 1 THEN NEW.net_amount ELSE -NEW.net_amount END,
        CASE WHEN NEW.quantity != 0 THEN NEW.gross_amount / ABS(NEW.quantity) ELSE 0 END,
        (SELECT full_date FROM dim_date WHERE date_key = NEW.date_key),
        (SELECT full_date FROM dim_date WHERE date_key = NEW.date_key),
        NOW(),
        NOW()
    )
    ON CONFLICT (account_key, security_symbol, security_type, security_option_type, security_strike_price, security_expiry_date)
    DO UPDATE SET
        quantity_held = fact_current_positions.quantity_held + (NEW.quantity * pos_direction),
        cost_basis = fact_current_positions.cost_basis + 
                    CASE WHEN pos_direction = 1 THEN NEW.net_amount ELSE -NEW.net_amount END,
        average_price = CASE 
            WHEN (fact_current_positions.quantity_held + (NEW.quantity * pos_direction)) != 0 
            THEN (fact_current_positions.cost_basis + CASE WHEN pos_direction = 1 THEN NEW.net_amount ELSE -NEW.net_amount END) / 
                 ABS(fact_current_positions.quantity_held + (NEW.quantity * pos_direction))
            ELSE 0 
        END,
        last_transaction_date = (SELECT full_date FROM dim_date WHERE date_key = NEW.date_key),
        updated_at = NOW();
    
    -- Remove zero positions to keep table lean
    DELETE FROM fact_current_positions 
    WHERE account_key = NEW.account_key 
      AND security_symbol = NEW.security_symbol
      AND security_type = NEW.security_type
      AND COALESCE(security_option_type, '') = COALESCE(NEW.security_option_type, '')
      AND COALESCE(security_strike_price, 0) = COALESCE(NEW.security_strike_price, 0)
      AND COALESCE(security_expiry_date, '1900-01-01') = COALESCE(NEW.security_expiry_date, '1900-01-01')
      AND quantity_held = 0;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =============================================
-- CREATE THE TRIGGER
-- This runs after every INSERT into fact_transactions
-- =============================================
DROP TRIGGER IF EXISTS tr_update_current_positions ON fact_transactions;

CREATE TRIGGER tr_update_current_positions
    AFTER INSERT ON fact_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_current_positions_trigger();