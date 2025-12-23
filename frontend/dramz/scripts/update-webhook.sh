#!/bin/bash

# Script to update Telegram webhook configuration
# This ensures the webhook receives all update types including my_chat_member

BOT_TOKEN="${TELEGRAM_BOT_TOKEN}"
WEBHOOK_URL="${WEBHOOK_URL:-https://dramz.tv/api/telegram/webhook}"

if [ -z "$BOT_TOKEN" ]; then
  echo "Error: TELEGRAM_BOT_TOKEN environment variable is not set"
  exit 1
fi

echo "Updating webhook to: $WEBHOOK_URL"
echo "Bot token: ${BOT_TOKEN:0:10}..."

# Set webhook with allowed updates including my_chat_member and chat_member
curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"${WEBHOOK_URL}\",
    \"allowed_updates\": [\"message\", \"my_chat_member\", \"chat_member\", \"callback_query\"]
  }"

echo ""
echo "Webhook updated. Checking webhook info..."

# Get webhook info
curl -X GET "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"

echo ""

