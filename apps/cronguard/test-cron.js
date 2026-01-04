#!/usr/bin/env node

/**
 * Test Cron Job - Node.js Example
 * 
 * This simulates a real cron job that:
 * 1. Does some work (e.g., API call, database query, file processing)
 * 2. Pings CronGuard on success
 * 3. Skips ping on failure (so CronGuard alerts you)
 */

const https = require('https')

// Replace with your actual monitor slug from the dashboard
const MONITOR_SLUG = 'YOUR_MONITOR_SLUG'
const PING_URL = `http://localhost:3000/api/ping/${MONITOR_SLUG}`

async function doWork() {
  console.log('🔄 Starting job at', new Date().toISOString())
  
  try {
    // Simulate doing some work
    console.log('📊 Fetching data from API...')
    await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate 2s work
    
    // Simulate random failure (10% chance)
    if (Math.random() < 0.1) {
      throw new Error('Simulated failure')
    }
    
    console.log('✅ Work completed successfully')
    return true
  } catch (error) {
    console.error('❌ Work failed:', error.message)
    return false
  }
}

async function pingCronGuard() {
  console.log('📡 Pinging CronGuard...')
  
  try {
    const response = await fetch(PING_URL)
    const data = await response.json()
    console.log('✅ CronGuard notified:', data)
  } catch (error) {
    console.error('⚠️ Failed to ping CronGuard:', error.message)
  }
}

async function main() {
  const success = await doWork()
  
  if (success) {
    await pingCronGuard()
    console.log('🎉 Job completed successfully at', new Date().toISOString())
    process.exit(0)
  } else {
    console.log('💥 Job failed - NOT pinging CronGuard (alert will be sent)')
    process.exit(1)
  }
}

main()

