#!/bin/bash

# Test Cron Job Script
# This simulates a real cron job that does work and then pings CronGuard

echo "🔄 Starting backup job at $(date)"

# Simulate doing some work (e.g., database backup)
echo "📦 Backing up database..."
sleep 2  # Simulate work taking 2 seconds

# Check if the work succeeded
if [ $? -eq 0 ]; then
  echo "✅ Backup completed successfully"
  
  # Ping CronGuard to report success
  # Replace YOUR_MONITOR_SLUG with your actual monitor slug
  PING_URL="http://localhost:3000/api/ping/YOUR_MONITOR_SLUG"
  
  echo "📡 Pinging CronGuard..."
  curl -s "$PING_URL"
  echo ""
  echo "✅ CronGuard notified"
else
  echo "❌ Backup failed - NOT pinging CronGuard"
  exit 1
fi

echo "🎉 Job completed at $(date)"

