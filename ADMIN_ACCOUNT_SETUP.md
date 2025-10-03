# Admin Account Setup

## Quick Setup

After deploying to production or setting up a new database, ensure an admin account exists:

```bash
npm run db:ensure-admin
```

This will create an admin account if it doesn't exist, or ensure the existing one has ADMIN privileges.

## Default Admin Credentials

**⚠️ IMPORTANT: Change these in production!**

- **Email**: `admin@example.com`
- **Password**: `admin123`

## Available Scripts

### Create/Ensure Admin Account
```bash
npm run db:ensure-admin
```
Creates the default admin account or ensures it has ADMIN role.

### Make Any User an Admin
```bash
npm run db:make-admin <email>
```
Example:
```bash
npm run db:make-admin user@company.com
```

### Full Database Seed (Development)
```bash
npm run db:seed
```
Seeds the database with sample data including:
- 3 Departments
- 5 Users (Admin, Manager, Supervisor, 2 Staff)
- 4 Sample Jobs
- Comments, Status Updates, and Notifications

## Production Deployment Steps

1. **Set up your database** (e.g., Neon, Railway, etc.)

2. **Configure environment variables**:
   ```bash
   DATABASE_URL="postgresql://..."
   NEXTAUTH_URL="https://your-domain.com"
   NEXTAUTH_SECRET="your-secret-key"
   ```

3. **Push database schema**:
   ```bash
   npx prisma db push
   ```

4. **Create admin account**:
   ```bash
   npm run db:ensure-admin
   ```

5. **Login and change password**:
   - Login with `admin@example.com` / `admin123`
   - Navigate to profile settings
   - Change your password immediately

## Security Notes

- The default admin password (`admin123`) should be changed immediately after first login
- Consider using environment variables for admin credentials in production:
  ```bash
  ADMIN_EMAIL="your-admin@company.com"
  ADMIN_PASSWORD="your-secure-password"
  ```
- Keep the `.env` file out of version control (already in `.gitignore`)
- For production, consider implementing password complexity requirements

## Troubleshooting

### "User already exists" error
If you get a unique constraint error, the admin account already exists. You can:
1. Login with the existing credentials
2. Or update the existing user to admin: `npm run db:make-admin admin@example.com`

### Database connection issues
Make sure your `DATABASE_URL` is correctly set in the `.env` file and includes `?sslmode=require` for cloud databases.
