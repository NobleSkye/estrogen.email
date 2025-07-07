# Estrogen.Email 🏳️‍⚧️

A privacy-focused email forwarding service that allows users to create custom email addresses on `estrogen.email` and `blahaj.email` domains that forward to their personal email addresses.

## Features

- 🏳️‍⚧️ **LGBTQ+ Friendly**: Built for the trans community with inclusive naming
- 🔒 **Privacy-First**: No logging of email content, only forwarding metadata
- 📧 **Custom Addresses**: Create up to 3 email addresses (more with paid plans)
- 🚀 **Easy Setup**: Docker-based deployment with Coolify support
- 🛡️ **Secure**: JWT authentication, password hashing, container security
- 📱 **Modern UI**: React-based frontend with Material-UI
- 🔄 **Per-Address Forwarding**: Each email address can forward to different destinations

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Domain with DNS control (for production)
- SMTP server credentials (Gmail, SendGrid, etc.)

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd estrogen.email
```

2. Run the deployment script:
```bash
./deploy.sh
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Mail Admin: http://localhost:8080

### Production Deployment with Coolify

1. **Set up Coolify** on your server
2. **Add your domain** to Coolify
3. **Import this repository** as a Docker Compose application
4. **Configure environment variables**:
   ```env
   # Required SMTP Settings
   SMTP_HOST=smtp.gmail.com
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=noreply@estrogen.email
   
   # Security (auto-generated in Coolify)
   JWT_SECRET=your-random-32-character-secret
   POSTGRES_PASSWORD=auto-generated
   ```

5. **Configure DNS records**:
   ```
   # A Records
   estrogen.email    A    YOUR_SERVER_IP
   blahaj.email      A    YOUR_SERVER_IP
   
   # MX Records  
   estrogen.email    MX   10 mail.estrogen.email
   blahaj.email      MX   10 mail.blahaj.email
   
   # SPF Record
   estrogen.email    TXT  "v=spf1 ip4:YOUR_SERVER_IP -all"
   blahaj.email      TXT  "v=spf1 ip4:YOUR_SERVER_IP -all"
   ```

6. **Deploy** through Coolify interface

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Application environment | `production` | No |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `POSTGRES_DB` | Database name | `emailmanager` | No |
| `POSTGRES_USER` | Database user | `emailuser` | No |
| `POSTGRES_PASSWORD` | Database password | - | Yes |
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` | Yes |
| `SMTP_PORT` | SMTP server port | `587` | No |
| `SMTP_USER` | SMTP username | - | Yes |
| `SMTP_PASS` | SMTP password/app password | - | Yes |
| `SMTP_FROM` | From email address | `noreply@estrogen.email` | No |
| `ALLOWED_DOMAINS` | Comma-separated allowed domains | `estrogen.email,blahaj.email` | No |
| `CORS_ORIGIN` | Frontend URL for CORS | `http://localhost:3000` | No |

### Account Tiers

| Tier | Email Limit | Price |
|------|-------------|-------|
| Standard | 3 | Free |
| Plus+ | 6 | $5/month |
| Premium Pro | 12 | $10/month |
| Elite Unlimited | Unlimited | $20/month |

### Reserved Prefixes

These prefixes cannot be used for email addresses:
- `admin`, `administrator`, `support`, `help`, `info`, `contact`
- `no-reply`, `noreply`, `donotreply`
- `security`, `abuse`, `spam`, `phishing`
- `system`, `daemon`, `service`, `api`, `bot`
- And more... (see server.js for full list)

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │    │     Backend     │    │   Mail Server   │
│   (React/MUI)   │◄──►│  (Node.js/API)  │◄──►│  (Postfix/...)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                         ┌─────────────────┐
                         │   PostgreSQL    │
                         │   (Database)    │
                         └─────────────────┘
```

### Components

- **Frontend**: React application with Material-UI, served by Nginx
- **Backend**: Node.js Express API with JWT authentication
- **Database**: PostgreSQL with user and email address management
- **Mail Server**: Postfix/Dovecot for handling incoming emails
- **SMTP**: External SMTP service for outbound notifications

## Development

### Backend Development

```bash
cd mail-server-api
npm install
npm run dev  # Starts with nodemon
```

### Frontend Development

```bash
cd mail-server-frontend  
npm install
npm start   # Starts React dev server
```

### Database Schema

The application uses PostgreSQL with the following main tables:
- `users`: User accounts with authentication
- `user_emails`: Email addresses created by users
- `domains`: Allowed domains for email creation

## Security Considerations

- 🔐 **Passwords**: Bcrypt hashed with salt
- 🎫 **Authentication**: JWT tokens with configurable expiration
- 🛡️ **Container Security**: Non-root users in containers
- 🔒 **Database**: Isolated network, credential-based access
- 📧 **Email Privacy**: No email content logging
- 🚫 **Reserved Prefixes**: Prevents creation of system emails
- 🔄 **CORS**: Configurable origins for API access

## Monitoring & Logs

- **Application Logs**: Available in `./logs/` directory
- **Health Checks**: Built-in endpoints for service monitoring
- **Database**: PostgreSQL logs and performance metrics
- **Email**: SMTP delivery status and bounce handling

## Troubleshooting

### Common Issues

1. **SMTP Authentication Failed**
   - Check SMTP credentials
   - Enable "Less secure app access" or use app passwords
   - Verify SMTP host and port

2. **Database Connection Issues**
   - Ensure PostgreSQL is running
   - Check database credentials
   - Verify network connectivity

3. **Email Delivery Problems**
   - Configure SPF/DKIM/DMARC records
   - Check domain reputation
   - Verify MX records are correct

4. **Frontend Build Issues**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall
   - Check Node.js version compatibility

### Support

For support and contributions:
- 📧 Email: support@estrogen.email
- 🐛 Issues: GitHub Issues
- 💬 Community: Discord/Matrix (links TBD)

## License

[License details to be added]

## Contributing

Contributions are welcome! Please read our contributing guidelines and code of conduct.

---

Made with 🏳️‍⚧️ for the community
