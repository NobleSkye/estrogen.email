-- Create the mail server database schema

-- Create domains table
CREATE TABLE IF NOT EXISTS domains (
    id SERIAL PRIMARY KEY,
    domain_name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default domains
INSERT INTO domains (domain_name) VALUES 
('estrogen.email'),
('blahaj.email')
ON CONFLICT (domain_name) DO NOTHING;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    domain_id INTEGER REFERENCES domains(id),
    email VARCHAR(255) UNIQUE NOT NULL, -- This is their account email (username@domain)
    personal_email VARCHAR(255) NOT NULL, -- This is their personal email for forwarding
    password_hash VARCHAR(255) NOT NULL,
    account_tier VARCHAR(50) DEFAULT 'standard' CHECK (account_tier IN ('standard', 'plus', 'premium', 'unlimited')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(username, domain_id)
);

-- Create aliases table
CREATE TABLE IF NOT EXISTS aliases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    alias_email VARCHAR(255) UNIQUE NOT NULL, -- The new alias email (e.g., myalias@estrogen.email)
    source_email VARCHAR(255) NOT NULL, -- The source email (user's account email)
    destination_email VARCHAR(255) NOT NULL, -- Where emails should be forwarded (personal email)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_personal_email ON users(personal_email);
CREATE INDEX IF NOT EXISTS idx_aliases_user_id ON aliases(user_id);
CREATE INDEX IF NOT EXISTS idx_aliases_alias_email ON aliases(alias_email);
CREATE INDEX IF NOT EXISTS idx_aliases_source_email ON aliases(source_email);
