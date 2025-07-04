const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Unsend SMTP config
const transporter = nodemailer.createTransport({
  host: 'smtp.unsend.dev',
  port: 465,
  secure: false,
  auth: {
    user: 'unsend',
    pass: process.env.UNSEND_API_KEY,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Endpoint to send email
app.post('/send', async (req, res) => {
  const { to, from, subject, html, text } = req.body;
  try {
    const info = await transporter.sendMail({ to, from, subject, html, text });
    res.json({ success: true, info });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to set up forwarding (placeholder, as Unsend handles forwarding via SMTP)
app.post('/forward', (req, res) => {
  // In a real app, you would configure forwarding rules here
  res.json({ success: true, message: 'Forwarding setup placeholder' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
