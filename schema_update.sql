-- Update database schema for improved alias and forwarding system

-- Add new columns to users table for primary email management
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_email_change VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_change_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_change_expires TIMESTAMP;

-- Update aliases table to support more flexible forwarding
ALTER TABLE aliases ADD COLUMN IF NOT EXISTS can_cross_domain BOOLEAN DEFAULT false;
ALTER TABLE aliases ADD COLUMN IF NOT EXISTS last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add trigger to update last_modified on alias changes
CREATE OR REPLACE FUNCTION update_alias_modified()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_alias_modified_trigger ON aliases;
CREATE TRIGGER update_alias_modified_trigger
    BEFORE UPDATE ON aliases
    FOR EACH ROW
    EXECUTE FUNCTION update_alias_modified();

-- Create index for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_users_pending_email ON users(pending_email_change);
CREATE INDEX IF NOT EXISTS idx_aliases_cross_domain ON aliases(can_cross_domain);
CREATE INDEX IF NOT EXISTS idx_aliases_last_modified ON aliases(last_modified);
