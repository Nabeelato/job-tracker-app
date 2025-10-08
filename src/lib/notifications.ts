import { prisma } from "@/lib/prisma"
import { NotificationType } from "@prisma/client"

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  content: string
  jobId?: string
  commentId?: string
  actionUrl?: string
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: params.userId,
        type: params.type,
        title: params.title,
        content: params.content,
        jobId: params.jobId || null,
        commentId: params.commentId || null,
        actionUrl: params.actionUrl || null,
      },
    })
  } catch (error) {
    console.error("Error creating notification:", error)
  }
}

// Extract @mentions from comment text
// Format: @UserName or @[UserName](userId)
export function extractMentions(content: string): string[] {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[2]) // Extract userId from @[Name](userId)
  }

  return mentions
}

// Get all team members on a job for mention suggestions
export async function getJobTeamMembers(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      assignedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      manager: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      supervisor: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  })

  if (!job) return []

  const members = [
    job.assignedTo,
    job.assignedBy,
    job.manager,
    job.supervisor,
  ].filter(Boolean)

  // Remove duplicates
  const uniqueMembers = Array.from(
    new Map(members.map((m) => [m!.id, m])).values()
  )

  return uniqueMembers
}
