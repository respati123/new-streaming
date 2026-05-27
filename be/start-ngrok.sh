#!/bin/bash

# Load port from .env or default to 3000
PORT=$(grep "^PORT=" .env | cut -d '=' -f2)
if [ -z "$PORT" ]; then
  PORT=3001
fi

echo "Starting ngrok on port $PORT..."

# Kill any existing ngrok processes to avoid port conflicts
pkill ngrok

# Start ngrok in background
ngrok http $PORT --log=stdout > /tmp/ngrok.log &

# Wait for ngrok to start
echo "Waiting for ngrok to initialize..."
sleep 5

# Try to fetch from 4040 first, then 4041
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | jq -r '.tunnels[0].public_url')

if [ "$NGROK_URL" = "null" ] || [ -z "$NGROK_URL" ]; then
  NGROK_URL=$(curl -s http://127.0.0.1:4041/api/tunnels | jq -r '.tunnels[0].public_url')
fi

if [ "$NGROK_URL" = "null" ] || [ -z "$NGROK_URL" ]; then
  echo "Error: Failed to get ngrok URL."
  echo "Check /tmp/ngrok.log for details."
  exit 1
fi

echo "----------------------------------------------------"
echo "Ngrok is running!"
echo "Public URL: $NGROK_URL"
echo "Bagibagi.co Webhook URL: $NGROK_URL/api/bagibagi/webhook"
echo "----------------------------------------------------"

# Keep the script running
wait
