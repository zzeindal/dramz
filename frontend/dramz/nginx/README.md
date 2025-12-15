# Nginx Configuration

This directory contains nginx configurations for both `dramz.tv` and `dramz.tv` domains.

## Architecture

- **dramz.tv**: Admin project (port 3000), except `/auth` and `/api/tg-auth` which route to main project (port 3001)
- **dramz.tv**: Main project (port 3001)

## Setup Instructions

### 1. Install Certbot (Let's Encrypt)

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

### 2. Copy Configuration Files

Copy both configuration files to nginx sites-available:

```bash
sudo cp nginx/dramz.tv.conf /etc/nginx/sites-available/dramz.tv
sudo cp nginx/dramz.tv.conf /etc/nginx/sites-available/dramz.tv
```

### 3. Create Symbolic Links

```bash
sudo ln -s /etc/nginx/sites-available/dramz.tv /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/dramz.tv /etc/nginx/sites-enabled/
```

### 4. Test Nginx Configuration

```bash
sudo nginx -t
```

### 5. Obtain SSL Certificates

```bash
sudo certbot --nginx -d dramz.tv -d www.dramz.tv
sudo certbot --nginx -d dramz.tv -d www.dramz.tv
```

Certbot will automatically:
- Obtain SSL certificates from Let's Encrypt
- Update the nginx configuration with certificate paths
- Set up automatic renewal

### 6. Reload Nginx

```bash
sudo systemctl reload nginx
```

### 7. Set Up Auto-Renewal

Certbot sets up automatic renewal by default. Test it with:

```bash
sudo certbot renew --dry-run
```

## Environment Variables

Make sure to set the following environment variables in your Next.js applications:

**Main Project (port 3001):**
```env
NEXT_PUBLIC_AUTH_DOMAIN=https://dramz.tv
NEXT_PUBLIC_WEB_APP_URL=https://dramz.tv
NEXT_PUBLIC_TG_BOT=your_bot_username
TELEGRAM_BOT_TOKEN=your_bot_token
NEXT_PUBLIC_API_BASE_URL=https://api.dramz.fun
```

**Admin Project (port 3000):**
```env
# Admin-specific environment variables
```

## Routing

### dramz.tv
- `/auth` → Main project (port 3001)
- `/api/tg-auth` → Main project (port 3001)
- All other routes → Admin project (port 3000)

### dramz.tv
- All routes → Main project (port 3001)

## Notes

- Main project runs on port 3001
- Admin project runs on port 3000
- SSL certificates are automatically renewed by certbot
- The configuration includes security headers and caching for static assets
- HTTP traffic is automatically redirected to HTTPS

## Troubleshooting

### Check Nginx Status
```bash
sudo systemctl status nginx
```

### Check Nginx Error Logs
```bash
sudo tail -f /var/log/nginx/error.log
```

### Check Certificate Status
```bash
sudo certbot certificates
```

### Manual Certificate Renewal
```bash
sudo certbot renew
```

### Verify Ports Are Running
```bash
# Check main project (port 3001)
curl http://localhost:3001

# Check admin project (port 3000)
curl http://localhost:3000
```

