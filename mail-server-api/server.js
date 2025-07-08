const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mail-server-api' },
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logsDir, 'combined.log') }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    logger.error('Error connecting to database:', err.stack);
  } else {
    logger.info('Connected to database successfully');
    release();
  }
});

// Email transporter configuration
let transporter;
try {
  transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  logger.info('Email transporter configured');
} catch (error) {
  logger.error('Error configuring email transporter:', error);
}

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper function to check if domain is allowed
const isAllowedDomain = (email) => {
  const allowedDomains = (process.env.ALLOWED_DOMAINS || 'estrogen.email,blahaj.email').split(',');
  const domain = email.split('@')[1];
  return allowedDomains.includes(domain);
};

// Helper function to check if email uses reserved prefix
const hasReservedPrefix = (email) => {
  const reservedPrefixes = ['admin', 'root', 'postmaster', 'abuse', 'noreply', 'no-reply', 'support', 'info', 'contact', 'help', 'security', 'webmaster', 'mailer-daemon'];
  const localPart = email.split('@')[0].toLowerCase();
  return reservedPrefixes.some(prefix => localPart.startsWith(prefix));
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });

    logger.info(`User registered: ${username}`);
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find user
    const result = await pool.query('SELECT id, username, password FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });

    logger.info(`User logged in: ${username}`);
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user email addresses
app.get('/api/emails', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email_address, forward_to, is_active, created_at, last_used FROM user_emails WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );

    res.json({ emails: result.rows });
  } catch (error) {
    logger.error('Get emails error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new email address
app.post('/api/emails', authenticateToken, async (req, res) => {
  try {
    const { email_address, forward_to } = req.body;

    if (!email_address || !forward_to) {
      return res.status(400).json({ error: 'Email address and forward_to are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_address) || !emailRegex.test(forward_to)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if domain is allowed
    if (!isAllowedDomain(email_address)) {
      return res.status(400).json({ error: 'Domain not allowed' });
    }

    // Check for reserved prefixes
    if (hasReservedPrefix(email_address)) {
      return res.status(400).json({ error: 'Email uses reserved prefix' });
    }

    // Check if email already exists
    const existingEmail = await pool.query('SELECT id FROM user_emails WHERE email_address = $1', [email_address]);
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ error: 'Email address already exists' });
    }

    // Get user's current email count
    const countResult = await pool.query('SELECT COUNT(*) as count FROM user_emails WHERE user_id = $1', [req.user.userId]);
    const currentCount = parseInt(countResult.rows[0].count);

    // Check limits (free plan: 5 emails)
    const maxEmails = 5; // This could be dynamic based on user plan
    if (currentCount >= maxEmails) {
      return res.status(400).json({ error: `Maximum ${maxEmails} email addresses allowed` });
    }

    // Create email
    const result = await pool.query(
      'INSERT INTO user_emails (user_id, email_address, forward_to) VALUES ($1, $2, $3) RETURNING *',
      [req.user.userId, email_address, forward_to]
    );

    logger.info(`Email added: ${email_address} for user ${req.user.username}`);
    res.status(201).json({
      message: 'Email address created successfully',
      email: result.rows[0]
    });
  } catch (error) {
    logger.error('Add email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update email address
app.put('/api/emails/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { forward_to, is_active } = req.body;

    // Validate forward_to if provided
    if (forward_to) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(forward_to)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    // Check if email belongs to user
    const emailCheck = await pool.query('SELECT id FROM user_emails WHERE id = $1 AND user_id = $2', [id, req.user.userId]);
    if (emailCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Email address not found' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let valueIndex = 1;

    if (forward_to !== undefined) {
      updates.push(`forward_to = $${valueIndex++}`);
      values.push(forward_to);
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${valueIndex++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, req.user.userId);

    const query = `UPDATE user_emails SET ${updates.join(', ')} WHERE id = $${valueIndex++} AND user_id = $${valueIndex++} RETURNING *`;

    const result = await pool.query(query, values);

    logger.info(`Email updated: ${id} for user ${req.user.username}`);
    res.json({
      message: 'Email address updated successfully',
      email: result.rows[0]
    });
  } catch (error) {
    logger.error('Update email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete email address
app.delete('/api/emails/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if email belongs to user and delete
    const result = await pool.query('DELETE FROM user_emails WHERE id = $1 AND user_id = $2 RETURNING email_address', [id, req.user.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email address not found' });
    }

    logger.info(`Email deleted: ${result.rows[0].email_address} for user ${req.user.username}`);
    res.json({ message: 'Email address deleted successfully' });
  } catch (error) {
    logger.error('Delete email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user stats/usage
app.get('/api/user/stats', authenticateToken, async (req, res) => {
  try {
    const emailCountResult = await pool.query('SELECT COUNT(*) as count FROM user_emails WHERE user_id = $1', [req.user.userId]);
    const activeEmailsResult = await pool.query('SELECT COUNT(*) as count FROM user_emails WHERE user_id = $1 AND is_active = true', [req.user.userId]);

    res.json({
      totalEmails: parseInt(emailCountResult.rows[0].count),
      activeEmails: parseInt(activeEmailsResult.rows[0].count),
      maxEmails: 5, // This could be dynamic based on user plan
      plan: 'Free' // This could be dynamic based on user plan
    });
  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send test email (for SMTP testing)
app.post('/api/test-email', authenticateToken, async (req, res) => {
  try {
    const { to, subject, text } = req.body;

    if (!to || !subject || !text) {
      return res.status(400).json({ error: 'To, subject, and text are required' });
    }

    if (!transporter) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: to,
      subject: subject,
      text: text
    };

    await transporter.sendMail(mailOptions);

    logger.info(`Test email sent to ${to} by user ${req.user.username}`);
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    logger.error('Send test email error:', error);
    res.status(500).json({ error: 'Failed to send email: ' + error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'mail-server-api'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
