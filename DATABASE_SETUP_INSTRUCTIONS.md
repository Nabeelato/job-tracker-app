# 🚀 DATABASE SETUP - STEP BY STEP

Follow these steps exactly to set up your database.

---

## ✅ Step 1: Verify PostgreSQL is Installed

Check if PostgreSQL is installed:

```powershell
psql --version
```

**If you see a version number**: ✅ PostgreSQL is installed, proceed to Step 2.

**If you get an error**: Download and install PostgreSQL from:
- https://www.postgresql.org/download/windows/
- During installation, remember the password you set for the `postgres` user

---

## ✅ Step 2: Create the Database

Open PowerShell as Administrator and run:

```powershell
psql -U postgres
```

You'll be prompted for the password you set during installation.

Once in the PostgreSQL prompt, run:

```sql
CREATE DATABASE job_tracking_db;
```

You should see: `CREATE DATABASE`

Then exit:
```sql
\q
```

---

## ✅ Step 3: Update .env File

Your `.env` file already exists. Update this line with your PostgreSQL password:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/job_tracking_db?schema=public"
```

Replace `YOUR_PASSWORD` with your actual PostgreSQL password.

**Example:**
If your password is `mypassword123`, it should look like:
```env
DATABASE_URL="postgresql://postgres:mypassword123@localhost:5432/job_tracking_db?schema=public"
```

---

## ✅ Step 4: Run Database Migrations

This creates all the tables in your database.

In your project terminal, run:

```powershell
npx prisma migrate dev --name init
```

You should see output like:
```
✔ Your database is now in sync with your schema.
✔ Generated Prisma Client
```

---

## ✅ Step 5: Seed the Database (Demo Data)

This adds sample users, jobs, and data for testing.

```powershell
npm run db:seed
```

You should see:
```
✅ Database seeded successfully!

📊 Created:
- 3 Departments
- 5 Users (Admin, Manager, Supervisor, 2 Staff)
- 4 Jobs (various statuses)
- 3 Comments
- 4 Status Updates
- 3 Notifications

🔐 Login Credentials:
Admin: admin@example.com / admin123
Manager: manager@example.com / manager123
Supervisor: supervisor@example.com / supervisor123
Staff: staff@example.com / staff123
```

---

## ✅ Step 6: Test the Application

1. Go to http://localhost:3000
2. Click "Sign In"
3. Use any of the demo credentials:
   - **Admin**: admin@example.com / admin123
   - **Manager**: manager@example.com / manager123
   - **Supervisor**: supervisor@example.com / supervisor123
   - **Staff**: staff@example.com / staff123

4. You should see the dashboard!

---

## 🎨 Bonus: View Your Database Visually

Want to see all the data in a nice interface?

```powershell
npx prisma studio
```

This opens a browser at http://localhost:5555 where you can:
- Browse all tables
- View all records
- Edit data directly
- See relationships

---

## 🆘 Troubleshooting

### Problem: "psql: command not found"
**Solution**: PostgreSQL is not in your PATH. Either:
1. Reinstall PostgreSQL and check "Add to PATH"
2. Use the full path: `"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres`

### Problem: "Connection refused"
**Solution**: PostgreSQL service is not running.
- Open Services (Win + R, type `services.msc`)
- Find "postgresql-x64-16" (or similar)
- Right-click → Start

### Problem: "Authentication failed"
**Solution**: Wrong password in `.env`. Make sure it matches your PostgreSQL password.

### Problem: "Database does not exist"
**Solution**: Go back to Step 2 and create the database.

### Problem: Migration errors
**Solution**: 
```powershell
# Delete migrations folder if it exists
rm -r prisma/migrations -Force

# Run migration again
npx prisma migrate dev --name init
```

---

## 📋 Quick Reference - All Commands

```powershell
# Create database (in psql)
CREATE DATABASE job_tracking_db;

# Run migrations
npx prisma migrate dev --name init

# Seed demo data
npm run db:seed

# View database GUI
npx prisma studio

# Start dev server (if not running)
npm run dev

# Reset database (WARNING: Deletes all data!)
npx prisma migrate reset
```

---

## ✅ Verification Checklist

Check off each item as you complete it:

- [ ] PostgreSQL installed
- [ ] Database `job_tracking_db` created
- [ ] `.env` file updated with correct password
- [ ] Migrations ran successfully
- [ ] Seed script completed
- [ ] Can log in at http://localhost:3000/auth/login
- [ ] Dashboard loads with user role displayed

---

Once you've completed all steps, you're ready to start building features! 🎉

**Run into any issues?** Let me know which step failed and I'll help you fix it!
