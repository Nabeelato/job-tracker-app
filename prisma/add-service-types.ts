import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addServiceTypes() {
  try {
    console.log('🔧 Adding service types to existing jobs...\n');

    // Get all jobs
    const jobs = await prisma.job.findMany();
    
    console.log(`Found ${jobs.length} jobs\n`);

    for (const job of jobs) {
      // Determine service types based on job title/description
      let serviceTypes: string[] = [];
      
      const titleLower = job.title.toLowerCase();
      const descLower = (job.description || '').toLowerCase();
      const combined = titleLower + ' ' + descLower;

      if (combined.includes('bookkeeping') || combined.includes('book keeping')) {
        serviceTypes.push('BOOKKEEPING');
      }
      if (combined.includes('vat') || combined.includes('tax')) {
        serviceTypes.push('VAT');
      }
      if (combined.includes('audit')) {
        serviceTypes.push('AUDIT');
      }
      if (combined.includes('financial statement') || combined.includes('fs')) {
        serviceTypes.push('FINANCIAL_STATEMENTS');
      }

      // If no service types detected, default to BOOKKEEPING
      if (serviceTypes.length === 0) {
        serviceTypes.push('BOOKKEEPING');
      }

      // Update job with service types
      await prisma.job.update({
        where: { id: job.id },
        data: { serviceTypes },
      });

      console.log(`✅ Updated ${job.jobId}: ${job.title}`);
      console.log(`   Service Types: ${serviceTypes.join(', ')}\n`);
    }

    console.log('🎉 Service types added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding service types:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addServiceTypes();
