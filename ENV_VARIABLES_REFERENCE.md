# 🔐 Environment Variables Reference

## For Vercel Dashboard

Copy and paste these into Vercel's Environment Variables section:

---

### 1. DATABASE_URL
**Value**: Your Neon PostgreSQL connection string

**Format**:
```
postgresql://[username]:[password]@[host]/[database]?sslmode=require
```

**Example**:
```
postgresql://neondb_owner:npg_XXXXXXXXXXXX@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Where to get it**:
- Log into Neon.tech
- Go to your project dashboard
- Click "Connection string"
- Copy the string

**Apply to**: Production, Preview, Development (all environments)

---

### 2. NEXTAUTH_URL
**Value**: Your deployed Vercel app URL

**Format**:
```
https://[your-project-name].vercel.app
```

**Example**:
```
https://job-tracker-app-xyz.vercel.app
```

**Where to get it**:
- Vercel will show you the URL after first deployment
- Format: `https://[project-name]-[random].vercel.app`
- Or use your custom domain if you have one

**Apply to**: Production only

**Important**: 
- Do NOT include trailing slash
- Must be HTTPS
- Update this if you add custom domain later

---

### 3. NEXTAUTH_SECRET
**Value**: A random 32+ character secret

**Generate with**:

**Option 1 - PowerShell**:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 2 - Online**:
Visit: https://generate-secret.vercel.app/

**Example output**:
```
Xj8kP2vN9qR4sT6wU8xZ1aB3cD5eF7gH9iJ0kL2mN4oP6qR8sT0uV2wX4yZ6aB8=
```

**Apply to**: Production, Preview, Development (all environments)

**Important**:
- Keep this secret safe
- Never commit to GitHub
- Use different secrets for dev/prod if possible
- Must be at least 32 characters

---

## Quick Copy Template

```bash
# Variable 1
Name: DATABASE_URL
Value: postgresql://[paste-from-neon]
Environments: Production, Preview, Development

# Variable 2
Name: NEXTAUTH_URL
Value: https://[your-vercel-url].vercel.app
Environments: Production

# Variable 3
Name: NEXTAUTH_SECRET
Value: [paste-generated-secret]
Environments: Production, Preview, Development
```

---

## How to Add in Vercel

1. **Go to your project in Vercel**
2. **Click Settings** (top navigation)
3. **Click Environment Variables** (left sidebar)
4. **Add each variable**:
   - Click "Add New"
   - Enter Name (e.g., `DATABASE_URL`)
   - Enter Value (paste the actual value)
   - Select environments (Production/Preview/Development)
   - Click "Save"
5. **Repeat for all 3 variables**
6. **Redeploy** if needed (click "Redeploy" button in Deployments tab)

---

## Verification Checklist

After adding environment variables:

- [ ] All 3 variables added
- [ ] DATABASE_URL includes `?sslmode=require`
- [ ] NEXTAUTH_URL is HTTPS (no trailing slash)
- [ ] NEXTAUTH_SECRET is at least 32 characters
- [ ] Saved and deployed

---

## Testing Connection

After deployment, check:

1. **App loads**: Visit your Vercel URL
2. **Login works**: Try logging in
3. **Database works**: Try creating a job
4. **No errors**: Check browser console (F12)

If issues, check **Vercel Function Logs** for error details.

---

## Security Notes

✅ **DO**:
- Use different secrets for dev/prod
- Keep secrets in password manager
- Rotate secrets periodically
- Use environment variables only

❌ **DON'T**:
- Commit `.env` to GitHub
- Share secrets in public
- Use weak or short secrets
- Hardcode secrets in code

---

## Need Help?

**Common Issues**:

**"Invalid Database URL"**
- Check connection string format
- Ensure `?sslmode=require` is included
- Verify Neon project is active

**"NextAuth Configuration Error"**
- Check NEXTAUTH_URL matches deployment URL
- Ensure no trailing slash
- Must be HTTPS

**"Session Not Working"**
- Verify NEXTAUTH_SECRET is set
- Must be same across all environments for session consistency
- Check secret is at least 32 characters

---

**Last Updated**: October 3, 2024
