# Telegram Authentication Flow

## Overview

This document describes the Telegram authentication flow using `dramz.tv` as the authentication domain.

## Flow Diagram

```
1. User on dramz.tv (port 3001) clicks "Sign in with Telegram"
   ↓
2. Popup opens to dramz.tv/auth?redirect=https://dramz.tv/...
   (nginx routes dramz.tv/auth to port 3001 - main project)
   ↓
3. User clicks Telegram login widget on dramz.tv/auth
   ↓
4. Telegram widget redirects to dramz.tv/api/tg-auth?hash=...&redirect=https://dramz.tv/...
   (nginx routes dramz.tv/api/tg-auth to port 3001 - main project)
   ↓
5. dramz.tv/api/tg-auth verifies hash and redirects to t.me/bot?start=https://dramz.tv/...
   ↓
6. User opens Telegram bot (manually sends /start or clicks button)
   ↓
7. Bot receives /start https://dramz.tv/..., generates token
   ↓
8. Bot redirects user to https://dramz.tv/...?token=...
   ↓
9. dramz.tv (port 3001) receives token, authenticates user, closes popup
```

## Architecture

- **dramz.tv**: Main project running on port 3001
- **dramz.tv**: Admin project running on port 3000, but `/auth` and `/api/tg-auth` routes to main project (port 3001)

## Components

### 1. LoginModal (`app/components/LoginModal.tsx`)
- Shows "Sign in with Telegram" button
- Opens popup window to `dramz.tv/auth` when clicked
- Monitors for authentication completion

### 2. Auth Page (`app/auth/page.tsx`)
- Served on `dramz.tv/auth`
- Displays Telegram login widget
- Passes redirect URL to authentication flow

### 3. TG Auth Route (`app/api/tg-auth/route.ts`)
- Verifies Telegram authentication hash
- Redirects to Telegram bot with redirect URL as start parameter

### 4. Telegram Webhook (`app/api/telegram/webhook/route.ts`)
- Handles `/start` command from users
- Extracts redirect URL from start parameter
- Generates authentication token
- Redirects user back to original domain with token

## Environment Variables

Required environment variables:

- `NEXT_PUBLIC_TG_BOT` - Telegram bot username
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `NEXT_PUBLIC_AUTH_DOMAIN` - Auth domain (https://dramz.tv)
- `NEXT_PUBLIC_WEB_APP_URL` - Main app URL (https://dramz.tv)
- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL

## Setup

1. Configure DNS: Point `dramz.tv` to your server
2. Set up nginx: Follow `nginx/README.md`
3. Set environment variables: See `TELEGRAM_SETUP.md`
4. Deploy application to both domains
5. Configure Telegram webhook: Point to `https://dramz.tv/api/telegram/webhook`

## Notes

- The authentication popup must be on a separate domain (`dramz.tv`) as required by Telegram
- SSL certificates are required for both domains
- The bot automatically handles the `/start` command with redirect parameter
- Users are redirected back to the original domain with authentication token

