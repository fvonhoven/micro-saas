#!/bin/bash

# Interactive CronGuard Monitor Tester
# This script helps you test your monitors easily

echo "🔍 CronGuard Monitor Tester"
echo "============================"
echo ""

# Check if monitor slug is provided
if [ -z "$1" ]; then
  echo "Usage: ./test-monitor.sh YOUR_MONITOR_SLUG"
  echo ""
  echo "Example: ./test-monitor.sh test-backup-job-123456"
  echo ""
  echo "Get your monitor slug from the dashboard ping URL:"
  echo "http://localhost:3000/api/ping/YOUR_MONITOR_SLUG"
  exit 1
fi

MONITOR_SLUG=$1
PING_URL="http://localhost:3000/api/ping/$MONITOR_SLUG"

echo "Monitor Slug: $MONITOR_SLUG"
echo "Ping URL: $PING_URL"
echo ""

# Function to send a ping
send_ping() {
  echo "📡 Sending ping..."
  RESPONSE=$(curl -s "$PING_URL")
  
  if [ $? -eq 0 ]; then
    echo "✅ Ping successful!"
    echo "Response: $RESPONSE"
  else
    echo "❌ Ping failed!"
  fi
  echo ""
}

# Interactive menu
while true; do
  echo "What would you like to do?"
  echo "1) Send a ping (mark as HEALTHY)"
  echo "2) Send 3 pings (1 per second)"
  echo "3) Send ping every minute (continuous)"
  echo "4) Exit"
  echo ""
  read -p "Choose an option (1-4): " choice
  
  case $choice in
    1)
      send_ping
      ;;
    2)
      echo "Sending 3 pings..."
      for i in {1..3}; do
        echo "Ping $i/3"
        send_ping
        if [ $i -lt 3 ]; then
          sleep 1
        fi
      done
      ;;
    3)
      echo "Sending ping every minute. Press Ctrl+C to stop."
      echo ""
      while true; do
        echo "$(date): Sending ping..."
        send_ping
        echo "Waiting 60 seconds..."
        sleep 60
      done
      ;;
    4)
      echo "👋 Goodbye!"
      exit 0
      ;;
    *)
      echo "❌ Invalid option. Please choose 1-4."
      echo ""
      ;;
  esac
done

