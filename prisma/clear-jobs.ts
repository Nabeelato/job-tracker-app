import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearJobs() {
  try {
    console.log('Clearing all jobs...');
    
    // Delete related records first (foreign key constraints)
    await prisma.statusUpdate.deleteMany({});
    console.log('✓ Deleted all status updates');
    
    await prisma.comment.deleteMany({});
    console.log('✓ Deleted all comments');
    
    await prisma.activity.deleteMany({});
    console.log('✓ Deleted all activity logs');
    
    await prisma.attachment.deleteMany({});
    console.log('✓ Deleted all attachments');
    
    // Delete job-related notifications
    await prisma.notification.deleteMany({});
    console.log('✓ Deleted all notifications');
    
    // Now delete all jobs
    const result = await prisma.job.deleteMany({});
    console.log(`✓ Deleted ${result.count} jobs`);
    
    console.log('\n✅ All jobs cleared successfully!');
  } catch (error) {
    console.error('Error clearing jobs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearJobs();
