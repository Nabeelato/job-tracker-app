import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create Departments
  console.log('Creating departments...')
  const bookkeepingDept = await prisma.department.create({
    data: {
      name: 'BookKeeping Department',
    },
  })

  const auditDept = await prisma.department.create({
    data: {
      name: 'Audit Department',
    },
  })

  const vatDept = await prisma.department.create({
    data: {
      name: 'VAT/TAX Department',
    },
  })

  // Create Users
  console.log('Creating users...')
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  })

  const managerPassword = await bcrypt.hash('manager123', 10)
  const bookkeepingManager = await prisma.user.create({
    data: {
      name: 'John Manager',
      email: 'manager@example.com',
      password: managerPassword,
      role: 'MANAGER',
      departmentId: bookkeepingDept.id,
      isActive: true,
    },
  })

  // Update BookKeeping department with manager
  await prisma.department.update({
    where: { id: bookkeepingDept.id },
    data: { managerId: bookkeepingManager.id },
  })

  const supervisorPassword = await bcrypt.hash('supervisor123', 10)
  const supervisor = await prisma.user.create({
    data: {
      name: 'Sarah Supervisor',
      email: 'supervisor@example.com',
      password: supervisorPassword,
      role: 'SUPERVISOR',
      departmentId: bookkeepingDept.id,
      isActive: true,
    },
  })

  const staffPassword = await bcrypt.hash('staff123', 10)
  const staff1 = await prisma.user.create({
    data: {
      name: 'Mike Staff',
      email: 'staff@example.com',
      password: staffPassword,
      role: 'STAFF',
      departmentId: bookkeepingDept.id,
      isActive: true,
    },
  })

  const staff2 = await prisma.user.create({
    data: {
      name: 'Jane Employee',
      email: 'jane@example.com',
      password: staffPassword,
      role: 'STAFF',
      departmentId: auditDept.id,
      isActive: true,
    },
  })

  // Create Jobs with Service Types
  console.log('Creating jobs...')
  const job1 = await prisma.job.create({
    data: {
      jobId: 'JOB-001',
      clientName: 'ABC Company Ltd',
      title: 'Monthly Bookkeeping for ABC Company',
      description: 'Complete monthly bookkeeping including bank reconciliation, expense categorization, and financial statement preparation.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      isUrgent: false,
      serviceTypes: ['BOOKKEEPING'],
      assignedToId: staff1.id,
      assignedById: bookkeepingManager.id,
      departmentId: bookkeepingDept.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      tags: ['monthly', 'bookkeeping', 'reconciliation'],
    },
  })

  const job2 = await prisma.job.create({
    data: {
      jobId: 'JOB-002',
      clientName: 'XYZ Corp',
      title: 'VAT Return Filing Q3',
      description: 'Prepare and file VAT return for Q3 2025. Review all transactions and ensure compliance.',
      status: 'PENDING',
      priority: 'URGENT',
      isUrgent: true,
      serviceTypes: ['VAT'],
      assignedToId: staff2.id,
      assignedById: bookkeepingManager.id,
      departmentId: vatDept.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      tags: ['vat', 'quarterly', 'urgent'],
    },
  })

  const job3 = await prisma.job.create({
    data: {
      jobId: 'JOB-003',
      clientName: 'Tech Startup Inc',
      title: 'Annual Audit Preparation',
      description: 'Prepare financial statements and supporting documentation for annual audit. Coordinate with external auditors.',
      status: 'ON_HOLD',
      priority: 'HIGH',
      isUrgent: false,
      serviceTypes: ['AUDIT', 'FINANCIAL_STATEMENTS'],
      assignedToId: staff2.id,
      assignedById: bookkeepingManager.id,
      departmentId: auditDept.id,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      tags: ['audit', 'annual', 'financial-statements'],
    },
  })

  const job4 = await prisma.job.create({
    data: {
      jobId: 'JOB-004',
      clientName: 'Retail Store Ltd',
      title: 'Bookkeeping and VAT Services',
      description: 'Combined bookkeeping and VAT return preparation. Client requires both services monthly.',
      status: 'COMPLETED',
      priority: 'NORMAL',
      isUrgent: false,
      serviceTypes: ['BOOKKEEPING', 'VAT'],
      assignedToId: staff1.id,
      assignedById: supervisor.id,
      departmentId: bookkeepingDept.id,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      completedAt: new Date(),
      tags: ['bookkeeping', 'vat', 'monthly'],
    },
  })

  // Create Comments
  console.log('Creating comments...')
  await prisma.comment.create({
    data: {
      content: 'Started working on bank reconciliation. All statements received from client.',
      jobId: job1.id,
      userId: staff1.id,
    },
  })

  await prisma.comment.create({
    data: {
      content: 'Great progress! Please ensure all expense categories are correct before finalizing.',
      jobId: job1.id,
      userId: bookkeepingManager.id,
    },
  })

  await prisma.comment.create({
    data: {
      content: 'Waiting for additional documentation from client before proceeding with audit.',
      jobId: job3.id,
      userId: staff2.id,
    },
  })

  // Create Status Updates
  console.log('Creating status updates...')
  await prisma.statusUpdate.create({
    data: {
      jobId: job1.id,
      userId: bookkeepingManager.id,
      action: 'Job created',
      newValue: 'PENDING',
    },
  })

  await prisma.statusUpdate.create({
    data: {
      jobId: job1.id,
      userId: staff1.id,
      action: 'Status changed',
      oldValue: 'PENDING',
      newValue: 'IN_PROGRESS',
    },
  })

  await prisma.statusUpdate.create({
    data: {
      jobId: job3.id,
      userId: staff2.id,
      action: 'Status changed',
      oldValue: 'IN_PROGRESS',
      newValue: 'ON_HOLD',
    },
  })

  await prisma.statusUpdate.create({
    data: {
      jobId: job4.id,
      userId: staff1.id,
      action: 'Status changed',
      oldValue: 'IN_PROGRESS',
      newValue: 'COMPLETED',
    },
  })

  // Create Notifications
  console.log('Creating notifications...')
  await prisma.notification.create({
    data: {
      userId: staff1.id,
      type: 'JOB_ASSIGNED',
      title: 'New job assigned',
      content: 'You have been assigned to "Monthly Bookkeeping for ABC Company"',
      jobId: job1.id,
      isRead: false,
    },
  })

  await prisma.notification.create({
    data: {
      userId: bookkeepingManager.id,
      type: 'JOB_COMPLETED',
      title: 'Job completed',
      content: 'Mike Staff completed "Bookkeeping and VAT Services"',
      jobId: job4.id,
      isRead: true,
    },
  })

  await prisma.notification.create({
    data: {
      userId: staff2.id,
      type: 'JOB_URGENT',
      title: 'Urgent job assigned',
      content: 'You have been assigned to urgent job "VAT Return Filing Q3"',
      jobId: job2.id,
      isRead: false,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log('\n📊 Created:')
  console.log('- 3 Departments (BookKeeping, Audit, VAT/TAX)')
  console.log('- 5 Users (Admin, Manager, Supervisor, 2 Staff)')
  console.log('- 4 Jobs with Service Types')
  console.log('- 3 Comments')
  console.log('- 4 Status Updates')
  console.log('- 3 Notifications')
  console.log('\n🔐 Login Credentials:')
  console.log('Admin: admin@example.com / admin123')
  console.log('Manager: manager@example.com / manager123')
  console.log('Supervisor: supervisor@example.com / supervisor123')
  console.log('Staff: staff@example.com / staff123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
