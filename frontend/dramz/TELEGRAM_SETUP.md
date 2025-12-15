# Telegram Bot Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
NEXT_PUBLIC_TG_BOT=your_bot_username_here

# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://api.dramz.fun

# Web App URL (for Telegram Mini App)
NEXT_PUBLIC_WEB_APP_URL=https://dramz.tv

# Auth Domain (for Telegram authentication popup)
NEXT_PUBLIC_AUTH_DOMAIN=https://dramz.tv
```

## Required Environment Variables:

1. **TELEGRAM_BOT_TOKEN** - Your Telegram bot token from @BotFather
2. **NEXT_PUBLIC_TG_BOT** - Your bot username (without @)
3. **NEXT_PUBLIC_API_BASE_URL** - Your backend API URL (default: https://api.dramz.fun)
4. **NEXT_PUBLIC_WEB_APP_URL** - Your deployed web app URL (default: https://dramz.tv)
5. **NEXT_PUBLIC_AUTH_DOMAIN** - Domain for Telegram auth popup (default: https://dramz.tv)

## Setting Up Telegram Webhook

After deploying, set the webhook URL:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://dramz.tv/api/telegram/webhook"}'
```

Or use this URL format:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://dramz.tv/api/telegram/webhook
```

## Setting Up Domains

### Architecture
- **dramz.tv**: Main project (port 3001)
- **dramz.tv**: Admin project (port 3000), but `/auth` and `/api/tg-auth` route to main project (port 3001)

### Nginx Setup

See `nginx/README.md` for detailed nginx and SSL setup instructions.

Quick setup:
1. Point both `dramz.tv` and `dramz.tv` DNS to your server
2. Install certbot: `sudo apt install certbot python3-certbot-nginx`
3. Copy nginx configs:
   ```bash
   sudo cp nginx/dramz.tv.conf /etc/nginx/sites-available/dramz.tv
   sudo cp nginx/dramz.tv.conf /etc/nginx/sites-available/dramz.tv
   ```
4. Enable sites:
   ```bash
   sudo ln -s /etc/nginx/sites-available/dramz.tv /etc/nginx/sites-enabled/
   sudo ln -s /etc/nginx/sites-available/dramz.tv /etc/nginx/sites-enabled/
   ```
5. Get SSL certificates:
   ```bash
   sudo certbot --nginx -d dramz.tv -d www.dramz.tv
   sudo certbot --nginx -d dramz.tv -d www.dramz.tv
   ```
6. Reload nginx: `sudo systemctl reload nginx`

### Running Projects

Make sure both projects are running:
- Main project: `npm run start` (runs on port 3001)
- Admin project: `npm run start` in `dramz-admin` directory (runs on port 3000)

## Testing

1. Send `/start` to your bot in Telegram
2. The bot should respond with a welcome message and a button to open the app
3. Clicking the button will open your web app in Telegram

## Vercel Environment Variables

Make sure to add all environment variables in Vercel:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all variables from `.env.local` (use the same names)

