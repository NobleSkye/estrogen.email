#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Setting up sudoers for codespace user to not require password..."
# Add/ensure codespace user can use sudo without password.
# This is usually default in Codespaces, but ensures it for the script.
echo "codespace ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/codespace > /dev/null
sudo chmod 0440 /etc/sudoers.d/codespace
echo "Sudoers configured."

echo "Starting Mail Server Codespace Setup..."

# --- 1. System Updates & Prerequisites ---
echo "1. Updating system packages..."
sudo apt update -y
sudo apt upgrade -y
sudo apt install -y postgresql postgresql-contrib curl postgis # postgis is optional
sudo apt install -y postfix dovecot-core dovecot-imapd dovecot-pop3d dovecot-lmtpd postfix-pgsql

# --- 2. PostgreSQL Setup ---
echo "2. Setting up PostgreSQL..."

# Start PostgreSQL service if not running
sudo service postgresql start
# Note: In non-systemd containers, 'enable' often isn't applicable or necessary.
# Services usually need to be started explicitly upon container (re)start.

# Create database user and database if they don't exist
DB_USER="codespace_user"
DB_NAME="mail_server_db"
DB_PASSWORD="your_strong_db_password_here" # <--- IMPORTANT: CHANGE THIS TO A SECURE PASSWORD!

# Check if user exists, create if not
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
    echo "Creating PostgreSQL user: $DB_USER"
    # Create the user with password as postgres superuser
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
else
    echo "PostgreSQL user $DB_USER already exists."
fi

# Check if database exists, create if not
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
    echo "Creating PostgreSQL database: $DB_NAME"
    # Create the database owned by the new user, as postgres superuser
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
else
    echo "PostgreSQL database $DB_NAME already exists."
fi

echo "Applying database schema..."
# IMPORTANT CHANGE HERE: Run schema application as 'postgres' superuser
# This ensures it's allowed by pg_hba.conf's default 'peer' auth for 'postgres'
sudo -u postgres psql -d $DB_NAME <<EOF
CREATE TABLE IF NOT EXISTS domains (
    id SERIAL PRIMARY KEY,
    domain_name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    domain_id INTEGER NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    email VARCHAR(510) GENERATED ALWAYS AS (username || '@' || (SELECT domain_name FROM domains WHERE id = domain_id)) STORED UNIQUE,
    password VARCHAR(255) NOT NULL, -- bcrypt hash
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN DEFAULT FALSE,
    UNIQUE (username, domain_id)
);

CREATE TABLE IF NOT EXISTS aliases (
    id SERIAL PRIMARY KEY,
    domain_id INTEGER NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    source_address VARCHAR(255) NOT NULL,
    destination_address VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (source_address, domain_id)
);

INSERT INTO domains (domain_name)
VALUES ('estrogen.email'), ('blahaj.email')
ON CONFLICT (domain_name) DO NOTHING;
EOF

echo "PostgreSQL setup complete."

# --- 3. Node.js API Setup ---
echo "3. Setting up Node.js API..."
# Check if mail-server-api directory exists, if not, create and link
if [ ! -d "mail-server-api" ]; then
    echo "mail-server-api directory not found. Please ensure it exists with server.js and package.json."
    exit 1
fi
cd mail-server-api

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file for Node.js API..."
    cat <<EOL > .env
DB_USER=$DB_USER
DB_HOST=localhost
DB_NAME=$DB_NAME
DB_PASSWORD=$DB_PASSWORD
DB_PORT=5432
PORT=5000
JWT_SECRET=$(head /dev/urandom | tr -dc A-Za-z0-9_ | head -c 64 ; echo '') # Random 64-char string
EOL
fi

echo "Installing Node.js API dependencies..."
npm install

echo "Starting Node.js API..."
# Use nohup to run in background so script can continue
nohup node server.js > api.log 2>&1 &
API_PID=$!
echo "Node.js API started with PID: $API_PID (check api.log for output)"
cd .. # Go back to root

# --- 4. Postfix and Dovecot Setup ---
echo "4. Setting up Postfix and Dovecot for database integration..."

# Create vmail user/group
if ! getent group vmail > /dev/null; then
    sudo groupadd -g 5000 vmail
    echo "Group 'vmail' created."
else
    echo "Group 'vmail' already exists."
fi

if ! id -u vmail > /dev/null 2>&1; then
    sudo useradd -r -g vmail -u 5000 vmail
    echo "User 'vmail' created."
else
    echo "User 'vmail' already exists."
fi

sudo mkdir -p /var/vmail
sudo chown -R vmail:vmail /var/vmail
sudo chmod 700 /var/vmail # Ensure correct permissions for maildir base

# Configure Postfix
echo "Configuring Postfix..."
sudo cp /etc/postfix/main.cf /etc/postfix/main.cf.bak

# Capture the hostname dynamically for myhostname
SERVER_HOSTNAME=$(hostname -f)
if [ -z "$SERVER_HOSTNAME" ]; then
    SERVER_HOSTNAME="codespace.local" # Fallback if hostname -f is empty
fi

sudo tee /etc/postfix/main.cf > /dev/null <<EOF
# Postfix main.cf (Codespace specific - simplified for internal testing)
smtpd_banner = \$myhostname ESMTP \$mail_name (Ubuntu)
biff = no
append_dot_mydomain = no
readme_directory = no
compatibility_level = 2

virtual_alias_domains =
virtual_alias_maps = pgsql:/etc/postfix/pgsql-virtual-aliases.cf

# Virtual Mailbox Configuration
virtual_mailbox_domains = pgsql:/etc/postfix/pgsql-virtual-domains.cf
virtual_mailbox_maps = pgsql:/etc/postfix/pgsql-virtual-mailboxes.cf
virtual_mailbox_base = /var/vmail/
virtual_uid_maps = static:5000
virtual_gid_maps = static:5000

# Authentication (via Dovecot SASL)
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_sasl_auth_enable = yes
smtpd_sasl_security_options = noanonymous
broken_sasl_auth_clients = yes

# Internal network configuration (important for Codespaces)
# Allow connections from localhost and the Codespace internal network range
mynetworks = 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128 $(hostname -I | awk '{print $1 "/16"}')
inet_interfaces = all
inet_protocols = all

# TLS (self-signed for internal testing, not for production)
# For real use, use Let's Encrypt
smtpd_tls_cert_file = /etc/ssl/certs/ssl-cert-snakeoil.pem
smtpd_tls_key_file = /etc/ssl/private/ssl-cert-snakeoil.key
smtpd_use_tls = yes
smtpd_tls_auth_only = yes
smtpd_tls_security_level = may

# Mailbox handling with Dovecot LMTP
virtual_transport = lmtp:unix:private/dovecot-lmtp

# Other standard settings
myhostname = ${SERVER_HOSTNAME}
mydestination = ${SERVER_HOSTNAME}, localhost.$(hostname -d), localhost
smtp_helo_timeout = 30s
smtp_helo_restrictions =
smtpd_helo_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_invalid_helo_hostname, reject_non_fqdn_helo_hostname
smtpd_recipient_restrictions =
    permit_mynetworks,
    permit_sasl_authenticated,
    reject_non_fqdn_recipient,
    reject_unknown_recipient_domain,
    reject_unauth_destination
#   check_policy_service unix:private/policy-spf # Disable for Codespace as it adds complexity not vital for internal test
debug_peer_level = 2
debug_peer_list =
EOF

echo "Creating Postfix PostgreSQL query files..."
POSTFIX_DB_CONF_DIR="/etc/postfix"

cat <<EOL | sudo tee ${POSTFIX_DB_CONF_DIR}/pgsql-virtual-domains.cf > /dev/null
user = ${DB_USER}
password = ${DB_PASSWORD}
hosts = 127.0.0.1:5432
dbname = ${DB_NAME}
query = SELECT 1 FROM domains WHERE domain_name='%s'
EOL

cat <<EOL | sudo tee ${POSTFIX_DB_CONF_DIR}/pgsql-virtual-mailboxes.cf > /dev/null
user = ${DB_USER}
password = ${DB_PASSWORD}
hosts = 127.0.0.1:5432
dbname = ${DB_NAME}
query = SELECT 1 FROM users WHERE email='%s'
EOL

cat <<EOL | sudo tee ${POSTFIX_DB_CONF_DIR}/pgsql-virtual-aliases.cf > /dev/null
user = ${DB_USER}
password = ${DB_PASSWORD}
hosts = 127.0.0.1:5432
dbname = ${DB_NAME}
query = SELECT destination_address FROM aliases WHERE source_address='%s'
EOL

sudo chmod 640 ${POSTFIX_DB_CONF_DIR}/pgsql-*.cf
sudo chown root:postfix ${POSTFIX_DB_CONF_DIR}/pgsql-*.cf

# Configure Dovecot
echo "Configuring Dovecot..."
sudo cp /etc/dovecot/dovecot.conf /etc/dovecot/dovecot.conf.bak

# Adjust main dovecot.conf (simplified)
sudo sed -i 's/^#!\s*include\sconf\.d\/\*\.conf/\!include conf\.d\/\*\.conf/' /etc/dovecot/dovecot.conf
sudo sed -i 's/^auth_mechanisms\s*=.*/auth_mechanisms = plain login/' /etc/dovecot/conf.d/10-auth.conf
# Ensure auth-sql.conf.ext is included
if ! grep -q "\!include auth-sql.conf.ext" /etc/dovecot/conf.d/10-auth.conf; then
    echo "!include auth-sql.conf.ext" | sudo tee -a /etc/dovecot/conf.d/10-auth.conf > /dev/null
fi


# 10-master.conf - ensure listeners and postfix auth
sudo tee /etc/dovecot/conf.d/10-master.conf > /dev/null <<EOF
service imap-login {
  inet_listener imap { port = 143 }
  inet_listener imaps { port = 993 ssl = yes }
}
service pop3-login {
  inet_listener pop3 { port = 110 }
  inet_listener pop3s { port = 995 ssl = yes }
}
service auth {
  unix_listener auth-master {
    mode = 0666
    user = postfix
    group = postfix
  }
  unix_listener auth-userdb {
    mode = 0600
    user = vmail
    group = vmail
  }
}
service lmtp {
  unix_listener /var/spool/postfix/private/dovecot-lmtp {
    mode = 0666
    user = postfix
    group = postfix
  }
}
service managesieve { # For sieve filtering, useful later
  unix_listener sieve-login {
    mode = 0600
    user = vmail
    group = vmail
  }
}
EOF

# 10-mail.conf - maildir location
sudo tee /etc/dovecot/conf.d/10-mail.conf > /dev/null <<EOF
mail_location = maildir:/var/vmail/%d/%n
mail_privileged_group = vmail
EOF

# 10-ssl.conf - use snakeoil for codespace
sudo tee /etc/dovecot/conf.d/10-ssl.conf > /dev/null <<EOF
ssl_cert = </etc/ssl/certs/ssl-cert-snakeoil.pem
ssl_key = </etc/ssl/private/ssl-cert-snakeoil.key
ssl = required
EOF

# dovecot-sql.conf.ext - database connection for Dovecot
DOVECOT_SQL_CONF_DIR="/etc/dovecot"
cat <<EOL | sudo tee ${DOVECOT_SQL_CONF_DIR}/dovecot-sql.conf.ext > /dev/null
driver = pgsql
connect = host=127.0.0.1 dbname=${DB_NAME} user=${DB_USER} password=${DB_PASSWORD}
default_pass_scheme = BLOWFISH-CRYPT # Important for bcrypt compatibility with Node.js API

password_query = SELECT email AS user, password FROM users WHERE email = '%u'
user_query = SELECT email AS user, 'maildir:/var/vmail/%d/%n' AS mail, 5000 AS uid, 5000 AS gid FROM users WHERE email = '%u'
EOL

sudo chmod 640 ${DOVECOT_SQL_CONF_DIR}/dovecot-sql.conf.ext
sudo chown root:dovecot ${DOVECOT_SQL_CONF_DIR}/dovecot-sql.conf.ext

# --- 5. Restart Services ---
echo "5. Restarting Postfix and Dovecot services..."
sudo service postfix restart
sudo service dovecot restart

# --- 6. Frontend Setup ---
echo "6. Setting up React Frontend..."
# Check if frontend directory exists, create if not
if [ ! -d "mail-server-frontend" ]; then
    echo "mail-server-frontend directory not found. Creating a new React app..."
    npx create-react-app mail-server-frontend
else
    echo "mail-server-frontend directory already exists. Skipping create-react-app."
fi
cd mail-server-frontend
npm install # Ensure all dependencies are installed
echo "Frontend setup complete. Run 'npm start' in the mail-server-frontend directory in a new terminal."
cd ..

echo "--- Setup Complete! ---"
echo "You can now access the Node.js API and your mail server components internally."
echo ""
echo "NEXT STEPS:"
echo "1. In a NEW Codespace terminal, navigate to 'mail-server-frontend' and run: 'npm start'"
echo "2. The React app should open on a forwarded port (usually 3000)."
echo "3. You can register users via the web UI."
echo "4. To test mail, you'll need to use a mail client (like Thunderbird) configured to connect to your Codespace's forwarded ports."
echo "   - Look for the 'Ports' tab in your Codespace UI. You'll see forwarded ports like 5000 (API), 3000 (Frontend)."
echo "   - You may need to manually forward ports 25, 465, 587, 110, 143, 993, 995 if they aren't auto-forwarded."
echo "   - For host, use 'localhost' and the respective forwarded port."
echo "   - IMPORTANT: Emails will only work between users created on THIS codespace mail server. External mail will likely fail due to Codespace network limitations."
echo ""
echo "Note: This setup uses self-signed SSL certificates for Postfix/Dovecot. Your mail client will warn you. For production, use Let's Encrypt."
echo "To check API logs: 'cat mail-server-api/api.log'"
echo "To check Postfix logs: 'sudo tail -f /var/log/mail.log'"
echo "To check Dovecot logs: 'sudo tail -f /var/log/mail.log'"