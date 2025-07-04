#!/bin/bash

# Email Forwarding Service Startup Script

echo "🚀 Starting estrogen.email service..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Copying example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your SMTP credentials before running the service."
    echo "   For Gmail: https://support.google.com/accounts/answer/185833"
fi

# Run the service
echo "🌐 Starting FastAPI server..."
echo "📧 Your email service will be available at: http://localhost:8000"
echo "🔧 Dashboard: http://localhost:8000/"
echo "📨 Webhook endpoint: http://localhost:8000/email-inbound"
echo ""
echo "💡 For Mailgun setup:"
echo "   1. Add your domain to Mailgun"
echo "   2. Set webhook URL to: http://your-domain.com/email-inbound"
echo "   3. Configure DNS MX records to point to Mailgun"
echo ""

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
