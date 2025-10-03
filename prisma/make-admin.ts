import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  
  if (!email) {
    console.error('❌ Please provide an email address')
    console.log('Usage: npx tsx prisma/make-admin.ts <email>')
    process.exit(1)
  }

  console.log(`🔍 Looking for user with email: ${email}`)
  
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    console.error(`❌ User with email ${email} not found`)
    process.exit(1)
  }

  console.log(`📝 Found user: ${user.name} (${user.email}) - Current role: ${user.role}`)

  if (user.role === 'ADMIN') {
    console.log('✅ User is already an ADMIN!')
    return
  }

  // Update user to ADMIN
  const updatedUser = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' }
  })

  console.log(`✅ Successfully updated ${updatedUser.name} to ADMIN role!`)
  console.log('\n🔐 You can now login with ADMIN privileges:')
  console.log(`   Email: ${updatedUser.email}`)
  console.log(`   Role: ${updatedUser.role}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
