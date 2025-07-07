import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 5000;

// Email transporter configuration
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify SMTP configuration on startup
emailTransporter.verify((error, success) => {
  if (error) {
    console.warn('SMTP configuration error:', error.message);
    console.warn('Email sending will be disabled. Please check your SMTP settings.');
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

// Helper function to send email
const sendEmail = async (to, subject, html, text) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('SMTP not configured, skipping email send');
      return { success: false, error: 'SMTP not configured' };
    }

    const info = await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text,
    });

    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Account tier configuration - higher tiers get more email addresses
const ACCOUNT_TIERS = {
  standard: { name: 'Standard', limit: 3, price: 'Free' },
  plus: { name: 'Plus+', limit: 6, price: '$5/month' },
  premium: { name: 'Premium Pro', limit: 12, price: '$10/month' },
  unlimited: { name: 'Elite Unlimited', limit: -1, price: '$20/month' }
};

// Reserved email prefixes that cannot be used for aliases
const RESERVED_PREFIXES = [
  'admin', 'administrator', 'support', 'help', 'info', 'contact',
  'owner', 'root', 'webmaster', 'postmaster', 'mail', 'email',
  'no-reply', 'noreply', 'no.reply', 'donotreply', 'do-not-reply',
  'security', 'abuse', 'spam', 'phishing', 'billing', 'sales',
  'marketing', 'newsletter', 'updates', 'notifications', 'alerts',
  'system', 'daemon', 'service', 'api', 'bot', 'automated',
  'legal', 'privacy', 'terms', 'compliance', 'gdpr',
  'hello', 'welcome', 'team', 'staff', 'office', 'headquarters'
];

// Helper function to get email address limit for user
const getEmailLimit = (tier) => {
  return ACCOUNT_TIERS[tier]?.limit || 3;
};

// Helper function to check if user can create more email addresses
const canCreateEmail = async (userId) => {
  const userResult = await pool.query(
    'SELECT account_tier FROM users WHERE id = $1',
    [userId]
  );
  
  if (userResult.rows.length === 0) {
    return { canCreate: false, error: 'User not found' };
  }
  
  const userTier = userResult.rows[0].account_tier;
  const limit = getEmailLimit(userTier);
  
  if (limit === -1) return { canCreate: true }; // Unlimited
  
  const emailCount = await pool.query(
    'SELECT COUNT(*) FROM user_emails WHERE user_id = $1',
    [userId]
  );
  
  const currentCount = parseInt(emailCount.rows[0].count);
  
  return {
    canCreate: currentCount < limit,
    currentCount,
    limit,
    tier: userTier
  };
};

// Middleware
app.use(cors());
app.use(express.json());

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Mail Server API is running!' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// User registration
app.post('/api/register', async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { username, domain, password, personalEmail } = req.body;

    // Validate personal email is provided
    if (!personalEmail) {B
      return res.status(400).json({ error: 'Personal email is required for forwarding' });
    }

    // Prevent using our domain emails as personal email to avoid loops
    const ourDomains = ['estrogen.email', 'blahaj.email'];
    const personalEmailDomain = personalEmail.split('@')[1];
    if (ourDomains.includes(personalEmailDomain)) {
    return res.status(400).json({ error: 'Personal email must use a different email provider (not estrogen.email or blahaj.email)' });
    }

    // Get domain ID
    const domainResult = await pool.query(
      'SELECT id FROM domains WHERE domain_name = $1',
      [domain]
    );

    if (domainResult.rows.length === 0) {
      return res.status(400).json({ error: 'Domain not found' });
    }

    const domainId = domainResult.rows[0].id;
    const email = `${username}@${domain}`;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with personal email
    const result = await pool.query(
      'INSERT INTO users (username, domain_id, email, password_hash, personal_email) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, personal_email',
      [username, domainId, email, hashedPassword, personalEmail]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET);

    // Send welcome email
    const welcomeEmailHtml = `
      <h2>Welcome to Estrogen.Email! 🏳️‍⚧️</h2>
      <p>Hi ${user.username},</p>
      <p>Your account has been successfully created!</p>
      <p><strong>Your primary email:</strong> ${user.email}</p>
      <p><strong>Forwarding to:</strong> ${user.personal_email}</p>
      <p>You can now create up to 3 additional email addresses using our service. Each address can have its own forwarding settings.</p>
      <p>Get started by visiting your dashboard and creating your first custom email address.</p>
      <p>Need help? Check out our documentation or contact support.</p>
      <br>
      <p>Best regards,<br>The Estrogen.Email Team</p>
    `;

    const welcomeEmailText = `
Welcome to Estrogen.Email!

Hi ${user.username},

Your account has been successfully created!

Your primary email: ${user.email}
Forwarding to: ${user.personal_email}

You can now create up to 3 additional email addresses using our service. Each address can have its own forwarding settings.

Get started by visiting your dashboard and creating your first custom email address.

Need help? Check out our documentation or contact support.

Best regards,
The Estrogen.Email Team
    `;

    // Send welcome email (don't block registration if email fails)
    sendEmail(
      user.personal_email,
      'Welcome to Estrogen.Email! 🏳️‍⚧️',
      welcomeEmailHtml,
      welcomeEmailText
    ).catch(error => {
      console.error('Failed to send welcome email:', error);
    });

    res.status(201).json({ 
      message: 'User created successfully',
      token,
      user: { id: user.id, username: user.username, email: user.email, personalEmail: user.personal_email }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await pool.query(
      'SELECT id, username, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get available domains
app.get('/api/domains', async (req, res) => {
  try {
    const result = await pool.query('SELECT domain_name FROM domains ORDER BY domain_name');
    res.json(result.rows.map(row => row.domain_name));
  } catch (error) {
    console.error('Error fetching domains:', error);
    res.status(500).json({ error: 'Failed to fetch domains' });
  }
});

// Get account tiers
app.get('/api/account-tiers', (req, res) => {
  res.json(ACCOUNT_TIERS);
});

// Get user's account info including email address usage
app.get('/api/account-info', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const userResult = await pool.query(
      'SELECT account_tier FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userTier = userResult.rows[0].account_tier;
    const tierInfo = ACCOUNT_TIERS[userTier];
    
    const emailCount = await pool.query(
      'SELECT COUNT(*) FROM user_emails WHERE user_id = $1',
      [userId]
    );
    
    const currentEmails = parseInt(emailCount.rows[0].count);
    
    res.json({
      tier: userTier,
      tierInfo,
      currentEmails,
      canCreateMore: tierInfo.limit === -1 || currentEmails < tierInfo.limit
    });
  } catch (error) {
    console.error('Error fetching account info:', error);
    res.status(500).json({ error: 'Failed to fetch account info' });
  }
});

// Create email address
app.post('/api/emails', authenticateToken, async (req, res) => {
  try {
    const { emailAddress } = req.body;
    const userId = req.user.userId;

    // Check if user can create more email addresses
    const emailCheck = await canCreateEmail(userId);
    if (!emailCheck.canCreate) {
      return res.status(400).json({ 
        error: `Email limit reached. Your ${ACCOUNT_TIERS[emailCheck.tier].name} plan allows ${emailCheck.limit} email addresses. You currently have ${emailCheck.currentCount}.`
      });
    }

    // Get user's account info
    const userResult = await pool.query(
      'SELECT email, account_tier, personal_email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Validate email address domain - all users can use our domains
    const ourDomains = ['estrogen.email', 'blahaj.email'];
    const emailDomain = emailAddress.split('@')[1];
    
    if (!ourDomains.includes(emailDomain)) {
      return res.status(400).json({ 
        error: 'Email addresses can only be created on estrogen.email or blahaj.email domains.' 
      });
    }

    // Extract and validate the prefix (part before @)
    const emailPrefix = emailAddress.split('@')[0].toLowerCase();
    
    // Check if the prefix is reserved
    if (RESERVED_PREFIXES.includes(emailPrefix)) {
      return res.status(400).json({ 
        error: `The email prefix "${emailPrefix}" is reserved and cannot be used. Please choose a different prefix.` 
      });
    }

    // Check for common reserved patterns
    if (emailPrefix.includes('admin') || emailPrefix.includes('support') || 
        emailPrefix.includes('noreply') || emailPrefix.includes('no-reply') ||
        emailPrefix.startsWith('mail') || emailPrefix.startsWith('email')) {
      return res.status(400).json({ 
        error: `The email prefix "${emailPrefix}" contains reserved words and cannot be used. Please choose a different prefix.` 
      });
    }

    // Check if email address already exists
    const existingEmail = await pool.query(
      'SELECT id FROM user_emails WHERE email_address = $1',
      [emailAddress]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ error: 'This email address already exists' });
    }

    // Create email address with default forwarding to user's personal email
    const result = await pool.query(
      'INSERT INTO user_emails (user_id, email_address, forward_to) VALUES ($1, $2, $3) RETURNING *',
      [userId, emailAddress, user.personal_email] // Default to personal email
    );

    res.status(201).json({
      message: 'Email address created successfully',
      email: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating email address:', error);
    res.status(500).json({ error: 'Failed to create email address' });
  }
});

// Get user's email addresses
app.get('/api/emails', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get email addresses created by this user
    const result = await pool.query(
      'SELECT * FROM user_emails WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching email addresses:', error);
    res.status(500).json({ error: 'Failed to fetch email addresses' });
  }
});

// Delete email address
app.delete('/api/emails/:id', authenticateToken, async (req, res) => {
  try {
    const emailId = req.params.id;
    const userId = req.user.userId;

    // Delete email address (only if it belongs to the user)
    const result = await pool.query(
      'DELETE FROM user_emails WHERE id = $1 AND user_id = $2 RETURNING *',
      [emailId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email address not found or you do not have permission to delete it' });
    }

    res.json({ message: 'Email address deleted successfully' });
  } catch (error) {
    console.error('Error deleting email address:', error);
    res.status(500).json({ error: 'Failed to delete email address' });
  }
});

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT id, username, email, personal_email, account_tier, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const tierInfo = ACCOUNT_TIERS[user.account_tier];

    res.json({
      ...user,
      tierInfo
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update email forwarding destination
app.put('/api/emails/:id/forwarding', authenticateToken, async (req, res) => {
  try {
    const emailId = req.params.id;
    const { forwardTo } = req.body;
    const userId = req.user.userId;

    // If forwardTo is null or empty, use user's personal email as default
    let finalForwardTo = forwardTo;
    if (!forwardTo) {
      const userResult = await pool.query(
        'SELECT personal_email FROM users WHERE id = $1',
        [userId]
      );
      if (userResult.rows.length > 0) {
        finalForwardTo = userResult.rows[0].personal_email;
      }
    }

    // Validate forwarding address - prevent loops with our domains
    const ourDomains = ['estrogen.email', 'blahaj.email'];
    const forwardDomain = finalForwardTo.split('@')[1];
    if (ourDomains.includes(forwardDomain)) {
      return res.status(400).json({ error: 'Cannot forward to estrogen.email or blahaj.email addresses to prevent email loops' });
    }

    // Update email forwarding (only if it belongs to the user)
    const result = await pool.query(
      'UPDATE user_emails SET forward_to = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [finalForwardTo, emailId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email address not found or you do not have permission to modify it' });
    }

    res.json({
      message: 'Email forwarding updated successfully',
      email: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating email forwarding:', error);
    res.status(500).json({ error: 'Failed to update email forwarding' });
  }
});

// Request primary email change (requires confirmation)
app.post('/api/settings/change-primary-email', authenticateToken, async (req, res) => {
  try {
    const { newEmail } = req.body;
    const userId = req.user.userId;

    // Validate new email is not from our domains to prevent issues
    const ourDomains = ['estrogen.email', 'blahaj.email'];
    const newEmailDomain = newEmail.split('@')[1];
    if (ourDomains.includes(newEmailDomain)) {
      return res.status(400).json({ error: 'Primary email cannot be from estrogen.email or blahaj.email domains' });
    }

    // Check if email is already in use
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE personal_email = $1 AND id != $2',
      [newEmail, userId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'This email is already in use by another account' });
    }

    // Generate confirmation token
    const confirmationToken = jwt.sign(
      { userId, newEmail, type: 'email_change' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Store pending email change
    await pool.query(
      'UPDATE users SET pending_email_change = $1, email_change_token = $2, email_change_expires = $3 WHERE id = $4',
      [newEmail, confirmationToken, new Date(Date.now() + 3600000), userId] // 1 hour expiry
    );

    // In a real app, you would send an email to the new address with the confirmation link
    // For now, we'll return the token for testing
    res.json({
      message: 'Primary email change requested. Please confirm using the provided token.',
      confirmationToken // In production, this would be sent via email
    });
  } catch (error) {
    console.error('Error requesting email change:', error);
    res.status(500).json({ error: 'Failed to request email change' });
  }
});

// Confirm primary email change
app.post('/api/settings/confirm-email-change', authenticateToken, async (req, res) => {
  try {
    const { confirmationToken } = req.body;
    const userId = req.user.userId;

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(confirmationToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or expired confirmation token' });
    }

    if (decoded.userId !== userId || decoded.type !== 'email_change') {
      return res.status(400).json({ error: 'Invalid confirmation token' });
    }

    // Get pending email change
    const userResult = await pool.query(
      'SELECT pending_email_change, email_change_expires FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    
    if (!user.pending_email_change) {
      return res.status(400).json({ error: 'No pending email change found' });
    }

    if (new Date() > user.email_change_expires) {
      return res.status(400).json({ error: 'Email change confirmation has expired' });
    }

    // Update primary email and clear pending change
    await pool.query(
      'UPDATE users SET personal_email = $1, pending_email_change = NULL, email_change_token = NULL, email_change_expires = NULL WHERE id = $2',
      [user.pending_email_change, userId]
    );

    res.json({
      message: 'Primary email updated successfully',
      newEmail: user.pending_email_change
    });
  } catch (error) {
    console.error('Error confirming email change:', error);
    res.status(500).json({ error: 'Failed to confirm email change' });
  }
});

// Get user settings
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT email, personal_email, pending_email_change, account_tier FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const tierInfo = ACCOUNT_TIERS[user.account_tier];

    res.json({
      accountEmail: user.email,
      primaryEmail: user.personal_email,
      pendingEmailChange: user.pending_email_change,
      accountTier: user.account_tier,
      tierInfo
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.listen(PORT, () => {
  console.log(`Mail server API running on port ${PORT}`);
});
