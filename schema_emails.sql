-- Create new email address management system

-- Drop the old aliases table since we're restructuring
DROP TABLE IF EXISTS aliases CASCADE;

-- Create user_emails table for managing email addresses
CREATE TABLE IF NOT EXISTS user_emails (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email_address VARCHAR(255) UNIQUE NOT NULL,
    forward_to VARCHAR(255), -- If NULL, forwards to user's personal_email
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP NULL
);

-- Create trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_user_email_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_email_updated_at_trigger ON user_emails;
CREATE TRIGGER update_user_email_updated_at_trigger
    BEFORE UPDATE ON user_emails
    FOR EACH ROW
    EXECUTE FUNCTION update_user_email_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_emails_user_id ON user_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_user_emails_address ON user_emails(email_address);
CREATE INDEX IF NOT EXISTS idx_user_emails_active ON user_emails(is_active);
