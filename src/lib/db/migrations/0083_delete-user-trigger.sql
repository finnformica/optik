 -- Function to handle user deletion when dim_user.deletedAt is set
  CREATE OR REPLACE FUNCTION handle_user_deletion()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, auth
  AS $$
  BEGIN
    -- When a user is marked as deleted in dim_user, soft delete them in auth.users
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      UPDATE auth.users
      SET deleted_at = NEW.deleted_at
      WHERE id = NEW.auth_user_id;
    END IF;

    RETURN NEW;
  END;
  $$;

  -- Create trigger on dim_user table
  DROP TRIGGER IF EXISTS trigger_handle_user_deletion ON dim_user;
  CREATE TRIGGER trigger_handle_user_deletion
    AFTER UPDATE ON dim_user
    FOR EACH ROW
    EXECUTE FUNCTION handle_user_deletion();
