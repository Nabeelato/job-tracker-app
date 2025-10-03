import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDepartments() {
  try {
    console.log('🔧 Fixing departments...\n');

    // Delete existing departments (this will also unassign users)
    const deleteResult = await prisma.department.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.count} old departments\n`);

    // Create the correct 3 departments
    const bookkeeping = await prisma.department.create({
      data: {
        name: 'BookKeeping Department',
      },
    });
    console.log('✅ Created BookKeeping Department');

    const audit = await prisma.department.create({
      data: {
        name: 'Audit Department',
      },
    });
    console.log('✅ Created Audit Department');

    const vat = await prisma.department.create({
      data: {
        name: 'VAT/TAX Department',
      },
    });
    console.log('✅ Created VAT/TAX Department');

    console.log('\n🎉 Departments fixed successfully!');
    console.log('\nDepartments created:');
    console.log(`1. ${bookkeeping.name} (ID: ${bookkeeping.id})`);
    console.log(`2. ${audit.name} (ID: ${audit.id})`);
    console.log(`3. ${vat.name} (ID: ${vat.id})`);
    
  } catch (error) {
    console.error('❌ Error fixing departments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDepartments();
