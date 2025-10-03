import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Ensuring admin account exists...')

  const adminEmail = 'admin@example.com'
  const adminPassword = 'admin123' // Change this in production!

  // Check if admin exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (existingAdmin) {
    console.log('✅ Admin account already exists')
    console.log(`   Email: ${existingAdmin.email}`)
    console.log(`   Role: ${existingAdmin.role}`)
    
    // Ensure the user has ADMIN role
    if (existingAdmin.role !== 'ADMIN') {
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: 'ADMIN' }
      })
      console.log('✅ Updated existing user to ADMIN role')
    }
    return
  }

  // Create admin account
  const hashedPassword = await bcrypt.hash(adminPassword, 10)
  
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    }
  })

  console.log('✅ Admin account created successfully!')
  console.log('\n🔐 Login Credentials:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📧 Email:    ${admin.email}`)
  console.log(`🔑 Password: ${adminPassword}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n⚠️  IMPORTANT: Change the admin password after first login!')
}

main()
  .catch((e) => {
    console.error('❌ Error ensuring admin account:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
