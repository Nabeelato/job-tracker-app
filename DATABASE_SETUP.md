# Database Setup Instructions

## Prerequisites
- PostgreSQL installed and running
- Database credentials ready

## Step 1: Create Database

Open PostgreSQL command line (psql) or pgAdmin and run:

```sql
CREATE DATABASE job_tracking_db;
```

## Step 2: Configure Environment Variables

The `.env` file has been created with a template. Update the following:

```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/job_tracking_db?schema=public"
```

Replace:
- `YOUR_USERNAME` with your PostgreSQL username (usually `postgres`)
- `YOUR_PASSWORD` with your PostgreSQL password

## Step 3: Run Database Migrations

This will create all the tables in your database:

```bash
npx prisma migrate dev --name init
```

## Step 4: Seed the Database (Optional but Recommended)

This will populate your database with sample data for testing:

```bash
npm run db:seed
```

This creates:
- 3 Departments (IT, HR, Sales)
- 5 Users with different roles
- 4 Sample jobs
- Comments and status updates
- Notifications

## Step 5: View Your Database

You can use Prisma Studio to visually inspect your database:

```bash
npx prisma studio
```

This will open a browser window at http://localhost:5555

## Login Credentials (After Seeding)

- **Admin**: admin@example.com / admin123
- **Manager**: manager@example.com / manager123
- **Supervisor**: supervisor@example.com / supervisor123
- **Staff**: staff@example.com / staff123

## Troubleshooting

### Connection Error
If you get a connection error, make sure:
1. PostgreSQL is running
2. Your credentials in `.env` are correct
3. The database `job_tracking_db` exists

### Migration Errors
If migrations fail:
1. Delete the `prisma/migrations` folder
2. Run `npx prisma migrate dev --name init` again

### Reset Database
To start fresh:
```bash
npx prisma migrate reset
```
This will drop all data and rerun migrations.

## Next Steps

After setup is complete:
1. Start the development server: `npm run dev`
2. Visit http://localhost:3000
3. Click "Sign In" and use one of the demo credentials
4. Explore the dashboard!
