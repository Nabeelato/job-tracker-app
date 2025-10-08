# Netlify Deployment Guide for Job Tracker App

## Prerequisites
- Netlify account
- GitHub repository: `Nabeelato/job-tracker-app`
- PostgreSQL database (keep using Neon)

## Deployment Steps

### 1. Connect to Netlify

1. Go to: https://app.netlify.com/
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"Deploy with GitHub"**
4. Authorize Netlify to access your GitHub
5. Select: `Nabeelato/job-tracker-app`

### 2. Configure Build Settings

**Build command:**
```bash
npx prisma generate && npx prisma migrate deploy && npm run build
```

**Publish directory:**
```
.next
```

**Base directory:** (leave empty)

### 3. Environment Variables

Add these in **Site settings → Environment variables:**

```bash
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-netlify-site.netlify.app

# Optional: Cron security
CRON_SECRET=your-cron-secret
```

### 4. Install Next.js Plugin

The `netlify.toml` file already includes the Next.js plugin configuration.

### 5. Deploy

Click **"Deploy site"**

Wait 3-5 minutes for:
- ✅ Dependencies installation
- ✅ Prisma Client generation
- ✅ Database migrations
- ✅ Next.js build

## Important: Cron Jobs on Netlify

⚠️ **Netlify doesn't support cron jobs like Vercel does.**

### Option A: Netlify Scheduled Functions
Create a Netlify function and use a third-party scheduler.

### Option B: External Cron Service (Recommended)
Use **Cron-job.org** or **EasyCron**:

1. Go to https://cron-job.org (free)
2. Create account
3. Add new cron job:
   - **URL:** `https://your-netlify-site.netlify.app/api/cron/check-inactive-jobs`
   - **Schedule:** Every hour (`0 * * * *`)
   - **Headers:** Add `Authorization: Bearer YOUR_CRON_SECRET`
4. Enable the job

### Option C: Remove Cron (Manual Reminders)
If you don't want external services, you can:
- Remove the cron job
- Add a "Check Reminders" button in admin panel
- Manually trigger `/api/cron/check-inactive-jobs`

## After Deployment

### Test the Site:
1. Visit your Netlify URL
2. Login with admin credentials
3. Create/edit a job
4. Check if activity tracking works
5. Visit: `/api/test-activity` (diagnostic endpoint)

### Set Up Custom Domain (Optional):
1. Go to **Domain settings**
2. Add your custom domain
3. Update `NEXTAUTH_URL` environment variable

## Troubleshooting

### Build Fails:
- Check build logs in Netlify dashboard
- Ensure all environment variables are set
- Verify `DATABASE_URL` is accessible from Netlify

### Activity Tracking Not Working:
- Check Function logs in Netlify
- Visit `/api/test-activity` to diagnose
- Ensure Prisma migrations ran successfully

### Cron Not Working:
- Set up external cron service
- Test manually: `curl https://your-site.netlify.app/api/cron/check-inactive-jobs`

## Comparison: Vercel vs Netlify

| Feature | Vercel | Netlify |
|---------|--------|---------|
| Next.js Support | Native | Plugin |
| Cron Jobs | Built-in | External service needed |
| Build Speed | Fast | Fast |
| Free Tier | 100GB bandwidth | 100GB bandwidth |
| Database | Any | Any |
| Setup Complexity | Easy | Easy |

## Recommendation

**If Vercel auto-deploy is just broken temporarily:**
- Try reconnecting Git integration in Vercel
- Use Deploy Hook to manually trigger

**If you prefer Netlify:**
- Follow this guide
- Set up external cron service
- Everything else will work the same

Both platforms will run your app perfectly! The main difference is just how you handle the hourly cron job.
