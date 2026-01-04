# Testing CronGuard

## Quick Test (Manual)

### 1. Create a Monitor

1. Go to `http://localhost:3000/dashboard`
2. Click "New Monitor"
3. Fill in:
   - **Name:** "Test Backup Job"
   - **Interval:** 1 minute
   - **Grace Period:** 1 minute
   - **Alert Email:** your-email@example.com
4. Click "Create Monitor"
5. **Copy the Ping URL** (e.g., `http://localhost:3000/api/ping/test-backup-job-123456`)

### 2. Send Test Pings

```bash
# Send a ping (monitor becomes HEALTHY)
curl http://localhost:3000/api/ping/YOUR_MONITOR_SLUG

# Wait 2+ minutes without pinging
# - After 1 min: Status → LATE
# - After 2 min: Status → DOWN (email sent)

# Send another ping (monitor recovers)
curl http://localhost:3000/api/ping/YOUR_MONITOR_SLUG
# Status → HEALTHY (recovery email sent)
```

---

## Test with Scripts

### Option 1: Bash Script

1. **Edit `test-cron.sh`** and replace `YOUR_MONITOR_SLUG`
2. **Make it executable:**
   ```bash
   chmod +x apps/cronguard/test-cron.sh
   ```
3. **Run it:**
   ```bash
   ./apps/cronguard/test-cron.sh
   ```

### Option 2: Node.js Script

1. **Edit `test-cron.js`** and replace `YOUR_MONITOR_SLUG`
2. **Make it executable:**
   ```bash
   chmod +x apps/cronguard/test-cron.js
   ```
3. **Run it:**
   ```bash
   node apps/cronguard/test-cron.js
   ```

---

## Set Up a Real Cron Job (macOS/Linux)

### 1. Edit your crontab

```bash
crontab -e
```

### 2. Add a test job that runs every minute

```bash
# Run test script every minute
* * * * * /path/to/micro-saas/apps/cronguard/test-cron.sh >> /tmp/cronguard-test.log 2>&1

# Or with Node.js
* * * * * /usr/local/bin/node /path/to/micro-saas/apps/cronguard/test-cron.js >> /tmp/cronguard-test.log 2>&1
```

### 3. View the logs

```bash
tail -f /tmp/cronguard-test.log
```

### 4. Test failure scenario

To test what happens when a job fails:

1. **Stop the cron job** (comment it out in crontab)
2. **Wait 2+ minutes**
3. **Check your email** - You should receive a DOWN alert
4. **Re-enable the cron job**
5. **Wait 1 minute** - You should receive a recovery alert

---

## Real-World Examples

### Example 1: Database Backup

```bash
#!/bin/bash
# backup-db.sh

# Backup database
pg_dump mydb > /backups/mydb-$(date +%Y%m%d).sql

# If backup succeeded, ping CronGuard
if [ $? -eq 0 ]; then
  curl -s https://cronguard.com/api/ping/backup-job-123456
fi
```

**Crontab:**
```bash
0 2 * * * /scripts/backup-db.sh  # Every day at 2 AM
```

### Example 2: API Data Sync

```javascript
// sync-data.js
const fetch = require('node-fetch')

async function syncData() {
  // Fetch data from external API
  const response = await fetch('https://api.example.com/data')
  const data = await response.json()
  
  // Save to database
  await saveToDatabase(data)
  
  // Ping CronGuard on success
  await fetch('https://cronguard.com/api/ping/sync-job-123456')
}

syncData().catch(console.error)
```

**Crontab:**
```bash
*/15 * * * * node /scripts/sync-data.js  # Every 15 minutes
```

### Example 3: Clean Up Old Files

```bash
#!/bin/bash
# cleanup.sh

# Delete files older than 30 days
find /tmp/uploads -type f -mtime +30 -delete

# Ping CronGuard
curl -s https://cronguard.com/api/ping/cleanup-job-123456
```

**Crontab:**
```bash
0 * * * * /scripts/cleanup.sh  # Every hour
```

---

## Testing the Background Checker

**Note:** The background checker (`check-monitors.ts`) only runs on Netlify in production.

To test locally, you can manually trigger it:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run the function locally
netlify functions:invoke check-monitors
```

Or deploy to Netlify and check the function logs:
1. Deploy to Netlify
2. Go to Netlify Dashboard → Functions
3. Click "check-monitors"
4. View logs to see it running every minute

---

## Cron Schedule Examples

```bash
# Every minute
* * * * * /script.sh

# Every 5 minutes
*/5 * * * * /script.sh

# Every hour
0 * * * * /script.sh

# Every day at 2 AM
0 2 * * * /script.sh

# Every Monday at 9 AM
0 9 * * 1 /script.sh

# Every 1st of the month
0 0 1 * * /script.sh

# Every 15 minutes during business hours (9 AM - 5 PM)
*/15 9-17 * * * /script.sh
```

---

## Troubleshooting

### Monitor stays PENDING
- Make sure you're pinging the correct URL
- Check the monitor slug matches
- Verify the ping endpoint is working: `curl -v http://localhost:3000/api/ping/YOUR_SLUG`

### No emails received
- Check `RESEND_API_KEY` is set in environment variables
- Verify the alert email is correct in the monitor settings
- Check Netlify function logs for email errors

### Cron job not running
- Check cron is running: `ps aux | grep cron`
- View cron logs: `tail -f /var/log/syslog | grep CRON` (Linux) or `log show --predicate 'process == "cron"' --last 1h` (macOS)
- Make sure script has execute permissions: `chmod +x script.sh`
- Use absolute paths in crontab

