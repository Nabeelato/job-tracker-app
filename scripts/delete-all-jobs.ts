import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllJobs() {
  try {
    console.log('Deleting all jobs and related data...');
    
    // Delete related data first
    const comments = await prisma.comment.deleteMany({});
    console.log(`Deleted ${comments.count} comments`);
    
    const statusUpdates = await prisma.statusUpdate.deleteMany({});
    console.log(`Deleted ${statusUpdates.count} status updates`);
    
    const notifications = await prisma.notification.deleteMany({});
    console.log(`Deleted ${notifications.count} notifications`);
    
    // Delete all jobs
    const jobs = await prisma.job.deleteMany({});
    console.log(`Deleted ${jobs.count} jobs`);
    
    console.log('\n✅ All jobs deleted successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllJobs();
