# Copy these into Coolify Environment Variables:

# 🔒 SECURITY (Required)
JWT_SECRET=your-32-character-random-secret-here
POSTGRES_PASSWORD=your-secure-database-password-here

# 📧 SMTP (Required for email functionality)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=noreply@estrogen.email

# 🌐 DOMAINS (Update with your actual domains)
CORS_ORIGIN=https://your-frontend-domain.com
REACT_APP_API_URL=https://your-api-domain.com

# 📊 DATABASE (Can use defaults)
POSTGRES_DB=emailmanager
POSTGRES_USER=emailuser

# ⚙️ OPTIONAL
NODE_ENV=production
ALLOWED_DOMAINS=estrogen.email,blahaj.email
