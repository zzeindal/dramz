# Environment Variables Guide

This document lists all required and optional environment variables for the application.

## Required Environment Variables

### 1. Telegram Bot Configuration

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```
- **Description**: Your Telegram bot token obtained from [@BotFather](https://t.me/BotFather)
- **Required**: Yes
- **Used in**: `app/api/telegram/webhook/route.ts`
- **Purpose**: Used to authenticate with Telegram API and send messages

```env
NEXT_PUBLIC_TG_BOT=your_bot_username_here
```
- **Description**: Your Telegram bot username (without @)
- **Required**: Yes
- **Used in**: Multiple components (LoginModal, NoUsernameModal, etc.)
- **Purpose**: Used to generate Telegram bot deep links

### 2. API Configuration

```env
NEXT_PUBLIC_API_BASE_URL=https://api.dramz.fun
```
- **Description**: Your backend API base URL
- **Required**: Yes
- **Default**: `https://api.dramz.fun`
- **Used in**: All API client files
- **Purpose**: Base URL for all API requests

### 3. Web App Configuration

```env
NEXT_PUBLIC_WEB_APP_URL=https://dramz.tv
```
- **Description**: Your deployed web application URL
- **Required**: Yes
- **Default**: `https://dramz.tv`
- **Used in**: `app/api/telegram/webhook/route.ts`
- **Purpose**: Used to generate redirect URLs after authentication

### 4. Auth Domain (Optional but Recommended)

```env
NEXT_PUBLIC_AUTH_DOMAIN=https://dramz.tv
```
- **Description**: Domain for Telegram authentication popup
- **Required**: No (but recommended)
- **Default**: Same as `NEXT_PUBLIC_WEB_APP_URL`
- **Used in**: Auth flow components
- **Purpose**: Domain where Telegram auth widget is hosted

## Complete .env.local Example

Create a `.env.local` file in the root directory:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
NEXT_PUBLIC_TG_BOT=dramztestbot

# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://api.dramz.fun

# Web App Configuration
NEXT_PUBLIC_WEB_APP_URL=https://dramz.tv

# Auth Domain (optional)
NEXT_PUBLIC_AUTH_DOMAIN=https://dramz.tv
```

## Environment Variables by Component

### Webhook Handler (`app/api/telegram/webhook/route.ts`)
- `TELEGRAM_BOT_TOKEN` - Required for Telegram API calls
- `NEXT_PUBLIC_API_BASE_URL` - Required for token generation
- `NEXT_PUBLIC_WEB_APP_URL` - Required for redirect URLs

### Login Modal (`app/components/LoginModal.tsx`)
- `NEXT_PUBLIC_TG_BOT` - Required for Telegram bot deep links
- `NEXT_PUBLIC_API_BASE_URL` - Required for session and SSE endpoints

### API Client (`src/lib/api/client.ts`)
- `NEXT_PUBLIC_API_BASE_URL` - Required for all API requests

## Backend API Requirements

**IMPORTANT**: Your backend API server (at `NEXT_PUBLIC_API_BASE_URL`) also needs `TELEGRAM_BOT_TOKEN` configured!

The backend API uses the bot token to verify the `initData` signature. Without it, you'll get:
```json
{
  "message": "Telegram bot token is not configured",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Backend Environment Variables

Make sure your backend API server has:
```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

This must be the **same token** as in your frontend `.env.local` file.

## Troubleshooting

### Error: "❌ Ошибка авторизации. Попробуйте позже."

This error occurs when token generation fails. Check:

1. **Frontend: TELEGRAM_BOT_TOKEN is set**
   ```bash
   # In your frontend project
   echo $TELEGRAM_BOT_TOKEN
   ```
   If empty, add it to your `.env.local` file

2. **Backend: TELEGRAM_BOT_TOKEN is set**
   ```bash
   # On your backend API server
   # Check if the backend has TELEGRAM_BOT_TOKEN configured
   ```
   - The backend API needs `TELEGRAM_BOT_TOKEN` to verify initData signatures
   - This is the **most common cause** of the 400 error

3. **NEXT_PUBLIC_API_BASE_URL is correct**
   - Verify the API is accessible
   - Check if `/user/token` endpoint exists
   - Ensure the API accepts requests from your domain

4. **SessionId is being passed**
   - Make sure you're clicking the "Go to Telegram" button from the website
   - If you type `/start` directly in the bot, sessionId will be undefined
   - The sessionId is only passed when using the deep link from the website

5. **Check server logs**
   - Look for `[WEBHOOK]` prefixed logs in your frontend
   - Check backend API logs for token verification errors
   - Verify initData generation

6. **Verify environment variables are loaded**
   - Restart your Next.js server after changing `.env.local`
   - Restart your backend API server after changing its environment variables
   - In Next.js, only variables prefixed with `NEXT_PUBLIC_` are available in the browser
   - Server-side variables (like `TELEGRAM_BOT_TOKEN`) are only available in API routes

## Production Deployment

### Vercel
1. Go to Project Settings → Environment Variables
2. Add all variables from `.env.local`
3. Make sure to set them for Production, Preview, and Development environments

### Other Platforms
- Ensure all environment variables are set in your hosting platform
- `TELEGRAM_BOT_TOKEN` should be kept secret (not prefixed with `NEXT_PUBLIC_`)
- All `NEXT_PUBLIC_*` variables are exposed to the browser

## Security Notes

- **Never commit `.env.local` to version control**
- `TELEGRAM_BOT_TOKEN` is sensitive - keep it secret
- `NEXT_PUBLIC_*` variables are exposed to the browser - don't put secrets there
- Use different tokens for development and production

