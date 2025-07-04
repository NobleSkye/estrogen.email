# 💊 estrogen.email - Email Forwarding Service

A modern web-based email forwarding service built with FastAPI that allows users to create temporary email addresses at `@estrogen.email` domain with automatic forwarding to their personal email.

## ✨ Features

- 🔐 **User Registration & Authentication** - Secure account creation and login
- 📧 **Custom Email Addresses** - Get your own `username@estrogen.email` address
- 📨 **Email Forwarding** - Automatically forward emails to your personal inbox
- 📬 **Web Dashboard** - View all received emails in a clean web interface
- 🗑️ **Email Management** - Delete emails from your dashboard
- 🎨 **Modern UI** - Beautiful, responsive design with clean CSS
- 🔒 **Session Management** - Secure authentication with HTTP-only cookies
- 🌐 **Mailgun Integration** - Real email receiving via Mailgun webhooks

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo>
cd estrogen_email
./start.sh
```

### 2. Configure SMTP (Required for forwarding)

Copy the example environment file and edit it:

```bash
cp .env.example .env
```

Edit `.env` with your SMTP credentials:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**For Gmail users:**
1. Enable 2-factor authentication
2. Generate an App Password: https://support.google.com/accounts/answer/185833
3. Use the App Password in the `.env` file

### 3. Start the Service

```bash
./start.sh
```

The service will be available at: http://localhost:8000

## 📡 Mailgun Setup

To receive real emails, you need to configure Mailgun:

### 1. Domain Setup
1. Add your domain (`estrogen.email`) to Mailgun
2. Configure DNS records as instructed by Mailgun
3. Verify domain ownership

### 2. Webhook Configuration
Set up a webhook in Mailgun dashboard:
- **URL**: `http://your-domain.com/email-inbound`
- **Events**: `delivered`
- **Method**: `POST`

### 3. DNS Configuration
Add MX records to your domain DNS:
```
Priority: 10, Value: mxa.mailgun.org
Priority: 10, Value: mxb.mailgun.org
```

## 🛠️ Project Structure

```
estrogen_email/
├── main.py              # FastAPI application and routes
├── database.py          # SQLAlchemy models and database setup
├── models.py            # Pydantic models for API
├── requirements.txt     # Python dependencies
├── start.sh            # Startup script
├── .env.example        # Environment configuration template
├── static/
│   └── style.css       # CSS styling
└── templates/
    ├── login.html      # Login and registration page
    ├── dashboard.html  # User dashboard with emails
    └── set_forwarding.html  # Forwarding settings page
```

## 🔧 API Endpoints

### Web Routes
- `GET /` - Login/Registration page
- `POST /login` - User authentication
- `POST /register` - User registration
- `GET /dashboard/{username}` - User dashboard
- `GET /set-forwarding/{username}` - Forwarding settings
- `POST /set-forwarding/{username}` - Update forwarding
- `POST /delete-email/{email_id}` - Delete email
- `POST /logout` - User logout

### Webhook
- `POST /email-inbound` - Mailgun webhook for incoming emails

## 🗄️ Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username (becomes email prefix)
- `password_hash` - Bcrypt hashed password
- `forwarding_address` - Optional forwarding email

### Emails Table
- `id` - Primary key
- `username` - Associated user
- `subject` - Email subject
- `body` - Email content
- `from_address` - Sender email
- `created_at` - Timestamp

## 🔒 Security Features

- Password hashing with bcrypt
- Session-based authentication
- HTTP-only cookies
- Input validation and sanitization
- SQL injection protection via SQLAlchemy ORM
- CSRF protection for forms

## 🚀 Deployment

### Development
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Production
1. Set up a reverse proxy (nginx)
2. Use a production WSGI server (gunicorn)
3. Configure SSL certificates
4. Set up proper database (PostgreSQL)
5. Configure environment variables
6. Set up monitoring and logging

### Docker Deployment (Optional)
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | `your-email@gmail.com` |
| `SMTP_PASSWORD` | SMTP password | `your-app-password` |
| `DATABASE_URL` | Database connection URL | `sqlite:///./emails.db` |
| `SECRET_KEY` | Secret key for sessions | `random-secret-key` |
| `DOMAIN` | Your domain name | `estrogen.email` |

## 🐛 Troubleshooting

### Common Issues

**SMTP Authentication Failed**
- Verify SMTP credentials in `.env`
- For Gmail, ensure App Password is used
- Check firewall/network restrictions

**Emails Not Receiving**
- Verify Mailgun webhook URL
- Check Mailgun logs for delivery status
- Ensure DNS MX records are configured

**Database Errors**
- Check file permissions for SQLite
- Verify database file path
- Check disk space

### Logs
Check application logs for detailed error information:
```bash
tail -f logs/app.log  # If logging is configured
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- FastAPI for the excellent web framework
- Mailgun for email infrastructure
- SQLAlchemy for database ORM
- Jinja2 for templating

---

💊 **estrogen.email** - Making email forwarding fabulous! ✨
