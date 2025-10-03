# Job Tracking App

A modern, full-featured team job and task management system built with Next.js 14+, TypeScript, and Prisma.

## 🚀 Features

### Core Functionality
- **Job Management**: Create, assign, track, and manage jobs/tasks
- **Role-Based Access Control**: Admin, Manager, Supervisor, and Staff roles
- **Status Tracking**: Comprehensive status pipeline (Not Started, In Progress, Pending Review, Completed, On Hold, Cancelled)
- **Timeline & Activity**: Full audit trail of all job-related activities
- **Comments System**: Threaded comments with @mentions and rich text
- **Priority Management**: Mark jobs as Low, Normal, High, or Urgent
- **Auto Status Markers**: Automatic late detection for overdue jobs
- **Job Reassignment**: Transfer jobs between team members
- **Approval Workflow**: Manager approval required for job completion

### User Roles & Permissions

#### 🔴 Admin
- Full system access
- User management (create, edit, delete, activate/deactivate)
- Department management
- System-wide analytics and reports
- Configuration and settings

#### 🔵 Manager
- Create and assign jobs to supervisors and staff
- Approve/reject job completions
- View department-wide jobs
- Team analytics and reports
- Reassign jobs within department

#### 🟢 Supervisor
- Create and assign jobs to staff
- Update job status
- Monitor team progress
- Report to managers

#### 🟡 Staff/Employee
- View assigned jobs
- Update job status
- Add comments and updates
- Mark jobs as complete (requires approval)
- Upload attachments

### Technical Features
- **Real-time Updates**: Instant notifications and status updates
- **Advanced Filtering**: Filter by status, priority, assignee, date range, tags
- **Search**: Full-text search across jobs
- **Analytics Dashboard**: Performance metrics and charts
- **Dark Mode**: System-wide dark/light theme support
- **Responsive Design**: Mobile-first, works on all devices
- **File Attachments**: Upload and manage job-related files
- **Email Notifications**: Automated email alerts for important events

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **Real-time**: Pusher (for notifications)

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Steps

1. **Clone and Install Dependencies**
```bash
npm install
```

2. **Set Up Environment Variables**
```bash
# Copy the example env file
copy .env.example .env
```

Edit `.env` and configure:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/job_tracking_db?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Pusher (Optional - for real-time features)
NEXT_PUBLIC_PUSHER_KEY="your-pusher-key"
PUSHER_SECRET="your-pusher-secret"
PUSHER_APP_ID="your-pusher-app-id"
NEXT_PUBLIC_PUSHER_CLUSTER="your-cluster"
```

3. **Set Up Database**
```bash
# Run Prisma migrations
npx prisma migrate dev --name init

# (Optional) Seed the database
npx prisma db seed
```

4. **Generate Prisma Client**
```bash
npx prisma generate
```

5. **Run Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Schema

### Key Models
- **User**: User accounts with roles and department associations
- **Department**: Organizational departments with managers
- **Job**: Task/job entries with status, priority, and assignments
- **Comment**: Threaded comments on jobs
- **StatusUpdate**: Audit trail of all job changes
- **Attachment**: File uploads associated with jobs
- **Notification**: User notification system

## 📁 Project Structure

```
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # API routes
│   │   ├── auth/             # Authentication pages
│   │   ├── dashboard/        # Dashboard pages
│   │   ├── jobs/             # Job management pages
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/           # React components
│   │   ├── ui/              # UI components (buttons, forms, etc.)
│   │   └── providers.tsx    # Context providers
│   └── lib/                 # Utility functions
│       ├── prisma.ts        # Prisma client
│       └── utils.ts         # Helper functions
├── .env                      # Environment variables
├── .env.example             # Example environment variables
├── next.config.js           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

## 🚦 Available Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm start           # Start production server

# Database
npx prisma studio   # Open Prisma Studio (database GUI)
npx prisma migrate dev  # Run database migrations
npx prisma generate # Generate Prisma Client

# Linting
npm run lint        # Run ESLint
```

## 🔒 Authentication

The app uses NextAuth.js for authentication with the following features:
- Email/password authentication
- Session management
- Role-based access control
- Protected routes and API endpoints

## 📊 Dashboard Features

### Admin Dashboard
- System-wide metrics and analytics
- User management interface
- Department overview
- All jobs across organization

### Manager Dashboard
- Team performance metrics
- Job status distribution
- Workload balance
- Approval queue

### Supervisor Dashboard
- Team job overview
- Quick assignment interface
- Progress tracking

### Staff Dashboard
- My assigned jobs
- Upcoming deadlines
- Recent activity
- Completed jobs history

## 🎨 UI Features

- Modern, clean interface
- Smooth animations with Framer Motion
- Toast notifications
- Loading states and skeletons
- Error boundaries
- Accessible components (WCAG compliant)

## 🔔 Notifications

Users receive notifications for:
- New job assignments
- Status changes
- Comments and @mentions
- Approaching deadlines
- Overdue jobs
- Approval requests/results

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is private and proprietary.

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables
Make sure to set all required environment variables in your deployment platform:
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- Pusher credentials (if using real-time features)

---

Built with ❤️ using Next.js, TypeScript, and Prisma
