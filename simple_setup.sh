#!/bin/bash

# Simple database setup for development
echo "Setting up PostgreSQL database for development..."

# Check if PostgreSQL is running
if ! sudo service postgresql status > /dev/null 2>&1; then
    echo "Starting PostgreSQL service..."
    sudo service postgresql start
fi

# Database configuration
DB_USER="codespace_user"
DB_NAME="mail_server_db"
DB_PASSWORD="secure_password_123"

# Create database user if not exists
echo "Creating database user..."
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "User already exists"

# Create database if not exists
echo "Creating database..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || echo "Database already exists"

# Drop existing tables to recreate them properly
echo "Recreating database schema..."
sudo -u postgres psql -d $DB_NAME <<EOF
DROP TABLE IF EXISTS aliases CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS domains CASCADE;

CREATE TABLE domains (
    id SERIAL PRIMARY KEY,
    domain_name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    domain_id INTEGER NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    email VARCHAR(510) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN DEFAULT FALSE,
    UNIQUE (username, domain_id)
);

CREATE TABLE aliases (
    id SERIAL PRIMARY KEY,
    domain_id INTEGER NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    source_address VARCHAR(255) NOT NULL,
    destination_address VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (source_address, domain_id)
);

INSERT INTO domains (domain_name)
VALUES ('estrogen.email'), ('blahaj.email');
EOF

echo "Database setup complete!"

# Update .env file
cd mail-server-api
cat > .env <<EOL
DB_USER=$DB_USER
DB_HOST=localhost
DB_NAME=$DB_NAME
DB_PASSWORD=$DB_PASSWORD
DB_PORT=5432
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EOL

echo "Environment file updated!"
echo ""
echo "Setup complete! You can now:"
echo "1. Start the API: cd mail-server-api && npm start"
echo "2. Start the frontend: cd mail-server-frontend && npm start"
