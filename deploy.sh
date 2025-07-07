#!/bin/bash

# Estrogen.Email Deployment Script
# This script helps set up the application for Docker deployment

set -e

echo "🏳️‍⚧️ Estrogen.Email Deployment Setup 🏳️‍⚧️"
echo "=============================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📄 Creating .env file from template..."
    cp .env.example .env
    
    # Generate a random JWT secret
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
    sed -i "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/" .env
    
    # Generate a random database password
    DB_PASSWORD=$(openssl rand -base64 16 2>/dev/null || head -c 16 /dev/urandom | base64)
    sed -i "s/securepassword/$DB_PASSWORD/" .env
    
    echo "✅ .env file created with generated secrets"
    echo "⚠️  Please edit .env file to configure your SMTP settings"
else
    echo "✅ .env file already exists"
fi

# Create logs directory
mkdir -p logs
echo "✅ Created logs directory"

# Pull/build images
echo "🐳 Building Docker images..."
docker-compose build

# Start the application
echo "🚀 Starting Estrogen.Email..."
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check if PostgreSQL is ready
if docker-compose exec -T postgres pg_isready -U emailuser -d emailmanager; then
    echo "✅ Database is ready"
else
    echo "❌ Database is not ready"
fi

# Check if backend is responding
if curl -f http://localhost:5000/ &> /dev/null; then
    echo "✅ Backend is ready"
else
    echo "❌ Backend is not ready"
fi

# Check if frontend is responding
if curl -f http://localhost:3000/health &> /dev/null; then
    echo "✅ Frontend is ready"
else
    echo "❌ Frontend is not ready"
fi

echo ""
echo "🎉 Deployment complete!"
echo "=============================================="
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5000"
echo "📧 Mail Admin: http://localhost:8080"
echo "🗄️  Database: localhost:5432"
echo ""
echo "📝 Next steps:"
echo "1. Configure your domain's MX records to point to this server"
echo "2. Update SMTP settings in .env file"
echo "3. Set up SSL certificates (automatic with Coolify)"
echo "4. Configure SPF/DKIM/DMARC records for email deliverability"
echo ""
echo "🔧 Useful commands:"
echo "- View logs: docker-compose logs -f"
echo "- Stop services: docker-compose down"
echo "- Restart services: docker-compose restart"
echo "- Update application: git pull && docker-compose build && docker-compose up -d"
echo ""
echo "⚠️  Don't forget to:"
echo "- Change default passwords in .env"
echo "- Configure SMTP settings"
echo "- Set up proper DNS records"
echo "- Configure firewall rules (ports 25, 587, 993, 995 for email)"
