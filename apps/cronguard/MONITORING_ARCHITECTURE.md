# CronGuard Monitoring Architecture

## Overview

CronGuard uses a **smart polling architecture** that efficiently handles monitors with different check intervals (from 1 minute to 7 days) using a single scheduled function.

## How It Works

### 1. Scheduled Function
- **Frequency**: Runs every 1 minute (`* * * * *`)
- **Location**: `netlify/functions/check-monitors.ts`
- **Platform**: Netlify Scheduled Functions

### 2. Efficient Querying
Instead of fetching all monitors and filtering in-memory, we use a **Firestore composite index** to query only monitors that are actually due for checking:

```typescript
db.collection("monitors")
  .where("status", "!=", "PAUSED")
  .where("nextExpectedAt", "<=", now)
  .get()
```

**Benefits:**
- ✅ Only fetches monitors that need checking right now
- ✅ Reduces Firestore read operations (cost savings)
- ✅ Faster execution (less data to process)
- ✅ Scales efficiently with thousands of monitors

### 3. Per-Monitor Intervals

Each monitor has its own `expectedInterval` (in seconds):
- **1 minute**: `expectedInterval: 60`
- **5 minutes**: `expectedInterval: 300`
- **1 hour**: `expectedInterval: 3600`
- **1 day**: `expectedInterval: 86400`

When a monitor receives a ping, we calculate the next expected time:
```typescript
nextExpectedAt = new Date(now.getTime() + expectedInterval * 1000)
```

### 4. Grace Period

Each monitor also has a `gracePeriod` (in seconds) that allows for slight delays:
- Monitor is marked **LATE** when overdue but within grace period
- Monitor is marked **DOWN** when grace period expires
- Alert email is sent only once when transitioning to DOWN

## Why This Architecture?

### ❌ Alternative: Per-User Scheduled Functions
Creating a separate Netlify function for each user would:
- Require dynamic function deployment (not supported by Netlify)
- Increase complexity and maintenance burden
- Waste resources (many functions running simultaneously)
- Hit Netlify's function limits quickly

### ✅ Current: Smart Single Function
Our approach:
- Single function runs every minute
- Queries only overdue monitors using indexed query
- Handles all users and all intervals efficiently
- Scales to thousands of monitors without code changes

## Performance Characteristics

### Scenario 1: 100 Users, Mixed Intervals
- 50 monitors @ 1 minute interval
- 30 monitors @ 5 minute interval  
- 20 monitors @ 60 minute interval

**At minute 0:**
- Query returns: ~50 monitors (only 1-min interval monitors are due)
- Execution time: ~2-3 seconds

**At minute 5:**
- Query returns: ~80 monitors (1-min + 5-min interval monitors)
- Execution time: ~3-4 seconds

**At minute 60:**
- Query returns: ~100 monitors (all monitors due)
- Execution time: ~4-5 seconds

### Scenario 2: 1000 Users, Mostly 1-Minute Intervals
- 800 monitors @ 1 minute interval
- 200 monitors @ longer intervals

**Every minute:**
- Query returns: ~800-850 monitors
- Execution time: ~10-15 seconds
- Well within Netlify's 10-second function timeout for scheduled functions

## Required Firestore Index

**Collection**: `monitors`

**Composite Index**:
```
status (Ascending) + nextExpectedAt (Ascending)
```

This index enables the efficient query:
```typescript
where("status", "!=", "PAUSED").where("nextExpectedAt", "<=", now)
```

## Monitoring States

1. **PENDING**: Monitor created but never received a ping
2. **HEALTHY**: Monitor received ping within expected interval
3. **LATE**: Monitor is overdue but within grace period
4. **DOWN**: Monitor exceeded grace period (alert sent)
5. **PAUSED**: Monitor temporarily disabled (not checked)

## Cost Analysis

### Firestore Reads
- **Old approach** (fetch all, filter in-memory): 1000 reads/minute
- **New approach** (indexed query): 50-100 reads/minute (95% reduction!)

### Netlify Function Invocations
- **Per-user functions**: 1000 invocations/minute (1000 users)
- **Single smart function**: 1 invocation/minute (100% reduction!)

## Future Optimizations

If we need to scale beyond 10,000 monitors:

1. **Sharding**: Split monitors into multiple collections by interval range
2. **Multiple Functions**: Run separate functions for different interval tiers
3. **Cloud Tasks**: Use Google Cloud Tasks for per-monitor scheduling
4. **Pub/Sub**: Use event-driven architecture with message queues

But for now, the current architecture handles thousands of monitors efficiently!

