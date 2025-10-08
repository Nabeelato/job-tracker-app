# External Cron Setup for Activity Tracking

## Problem
Vercel Hobby (free) accounts only allow **daily** cron jobs.
Our activity tracking system needs **hourly** checks.

## Solution: Use cron-job.org (Free)

### Step 1: Create Account
1. Go to: https://cron-job.org/en/
2. Click **"Sign up"** (free, no credit card)
3. Verify your email

### Step 2: Create Cron Job
1. Click **"Create cronjob"**
2. **Title:** "Job Activity Reminder System"
3. **URL:** `https://job-tracker-app-th9g.vercel.app/api/cron/check-inactive-jobs`
4. **Schedule:** 
   - Pattern: **Every hour**
   - Or custom: `0 * * * *`
5. **Execution:** 
   - ✅ Enabled
6. **Notifications:** 
   - Enable if you want email alerts on failures

### Step 3: Add Security (Optional but Recommended)
1. In cron-job.org, go to your job settings
2. Click **"Request headers"**
3. Add header:
   ```
   Authorization: Bearer YOUR_CRON_SECRET
   ```
4. Get your secret from Vercel environment variables

### Step 4: Test
1. Click **"Execute now"** on cron-job.org
2. Check the execution log
3. Should see: `200 OK` response
4. Check your Vercel Function logs for activity

---

## Alternative Free Services

### Option A: EasyCron
- Website: https://www.easycron.com/
- Free tier: 100 executions/day (enough for hourly)
- Setup similar to cron-job.org

### Option B: Uptime Robot (Clever Workaround)
- Website: https://uptimerobot.com/
- Free tier: 50 monitors
- Set up "monitor" to check your cron endpoint
- Check interval: 1 hour
- When it checks, your endpoint runs!

---

## Manual Trigger (For Testing)

You can always manually trigger the cron:

```bash
curl -X GET https://job-tracker-app-th9g.vercel.app/api/cron/check-inactive-jobs
```

Or create an admin button in your dashboard to trigger it manually.

---

## Comparison

| Method | Cost | Frequency | Reliability |
|--------|------|-----------|-------------|
| Vercel Cron (Free) | Free | Daily only | ⭐⭐⭐⭐⭐ |
| Vercel Cron (Pro) | $20/month | Any | ⭐⭐⭐⭐⭐ |
| cron-job.org | Free | Hourly | ⭐⭐⭐⭐ |
| EasyCron | Free | Hourly | ⭐⭐⭐⭐ |
| Uptime Robot | Free | 5 min - 24h | ⭐⭐⭐ |
| Manual | Free | As needed | ⭐⭐ |

---

## Recommendation

**For your use case (tracking job inactivity):**

✅ **Use cron-job.org** - It's free, reliable, and gives you hourly checks.

The activity tracking system will work perfectly with external cron!

---

## Setup Time: 5 minutes
1. Create cron-job.org account (2 min)
2. Add cron job with your Vercel URL (2 min)
3. Test execution (1 min)

Done! 🎉
