# Vercel Environment Variables Setup

## Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Select your project: **job-tracker-app-th9g**
3. Go to: **Settings** → **Environment Variables**

## Add These Variables

### Required (Must Have)

```bash
DATABASE_URL
postgresql://neondb_owner:npg_7Ls3TYnuOdbJ@ep-patient-wave-adebfh6c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

NEXTAUTH_SECRET
your-secret-key-here-generate-with-openssl-rand-base64-32

NEXTAUTH_URL
https://job-tracker-app-th9g.vercel.app
```

### Optional (If you use Pusher for real-time)

```bash
NEXT_PUBLIC_PUSHER_KEY
your-pusher-key

PUSHER_SECRET
your-pusher-secret

PUSHER_APP_ID
your-pusher-app-id

NEXT_PUBLIC_PUSHER_CLUSTER
your-cluster
```

---

## Step-by-Step Instructions

### Step 1: Add DATABASE_URL
1. Click **Add New** button
2. **Key:** `DATABASE_URL`
3. **Value:** `postgresql://neondb_owner:npg_7Ls3TYnuOdbJ@ep-patient-wave-adebfh6c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require`
4. **Environments:** Check all (Production, Preview, Development)
5. Click **Save**

### Step 2: Add NEXTAUTH_SECRET
1. Click **Add New**
2. **Key:** `NEXTAUTH_SECRET`
3. **Value:** `your-secret-key-here-generate-with-openssl-rand-base64-32`
4. **Environments:** Check all
5. Click **Save**

### Step 3: Add NEXTAUTH_URL
1. Click **Add New**
2. **Key:** `NEXTAUTH_URL`
3. **Value:** `https://job-tracker-app-th9g.vercel.app`
4. **Environments:** Production only
5. Click **Save**

### Step 4: Redeploy
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **•••** menu
4. Click **Redeploy**
5. Wait 2-3 minutes

---

## Alternative: Use Vercel CLI

If you have Vercel CLI installed:

```bash
cd /workspaces/job-tracker-app

vercel env add DATABASE_URL production
# Paste: postgresql://neondb_owner:npg_7Ls3TYnuOdbJ@ep-patient-wave-adebfh6c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

vercel env add NEXTAUTH_SECRET production
# Paste: your-secret-key-here-generate-with-openssl-rand-base64-32

vercel env add NEXTAUTH_URL production
# Paste: https://job-tracker-app-th9g.vercel.app

# Then redeploy
vercel --prod
```

---

## After Adding Variables

Your Vercel build should now succeed! ✅

Check deployment status at:
https://vercel.com/dashboard → Your Project → Deployments

Once it's green (✓ Ready), your app will be live at:
**https://job-tracker-app-th9g.vercel.app**

Then you can set up the cron job!
