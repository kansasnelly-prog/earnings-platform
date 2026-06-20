#!/bin/bash

# Telegram Webhook Verification Script
# This script checks the current webhook status and tests the connection

# Replace this with your actual Telegram bot token from Vercel environment variables
TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN_HERE"
WEBHOOK_URL="https://earnings.ink/api/webhook"

echo "=========================================="
echo "Telegram Webhook Verification"
echo "=========================================="
echo ""

# Check current webhook info
echo "1. Checking current webhook info..."
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo" | jq '.'
echo ""
echo "=========================================="
echo ""

# Test webhook endpoint
echo "2. Testing webhook endpoint availability..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "$WEBHOOK_URL"
echo ""
echo "=========================================="
echo ""

# Set webhook if not configured
echo "3. Setting webhook to production endpoint..."
curl -s -F "url=$WEBHOOK_URL" "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" | jq '.'
echo ""
echo "=========================================="
echo ""

# Verify webhook after setting
echo "4. Verifying webhook after configuration..."
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo" | jq '.result.url'
echo ""
echo "=========================================="
echo ""

echo "Verification complete."
echo "To test the bot, send /status command to your bot in Telegram."
