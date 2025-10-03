import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateExistingJobs() {
  try {
    // Get all jobs
    const jobs = await prisma.job.findMany({
      include: {
        assignedTo: true,
        assignedBy: true,
        department: {
          include: {
            manager: true
          }
        }
      }
    })

    console.log(`Found ${jobs.length} jobs to update`)

    for (const job of jobs) {
      // Generate jobId if missing
      const jobId = job.jobId || `JOB-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
      
      // Set clientName from department name if missing
      const clientName = job.clientName || job.department?.name || 'Default Client'
      
      // Set manager from department manager or job creator
      const managerId = job.managerId || job.department?.managerId || job.assignedById
      
      // Set supervisor based on assignedTo role
      const supervisorId = job.supervisorId || (job.assignedTo.role === 'SUPERVISOR' ? job.assignedToId : null)

      await prisma.job.update({
        where: { id: job.id },
        data: {
          jobId,
          clientName,
          managerId,
          supervisorId,
        }
      })

      console.log(`Updated job ${job.id} with jobId: ${jobId}`)
    }

    console.log('All jobs updated successfully!')
  } catch (error) {
    console.error('Error updating jobs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateExistingJobs()
