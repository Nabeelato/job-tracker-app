/**
 * Business Hours Utility
 * Calculates time differences excluding Sundays for job activity tracking
 */

/**
 * Calculate business hours between two dates, excluding Sundays
 * @param startDate - The start date/time
 * @param endDate - The end date/time (defaults to now)
 * @returns Number of hours excluding Sundays
 */
export function calculateBusinessHours(
  startDate: Date,
  endDate: Date = new Date()
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start >= end) {
    return 0;
  }

  let totalHours = 0;
  let currentDate = new Date(start);

  // Iterate through each day
  while (currentDate < end) {
    const dayOfWeek = currentDate.getDay();
    
    // Skip Sundays (0 = Sunday)
    if (dayOfWeek !== 0) {
      // Calculate hours remaining in current day
      const endOfDay = new Date(currentDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Use the earlier of: end of day or final end date
      const periodEnd = endOfDay < end ? endOfDay : end;
      
      // Calculate hours in this period
      const hoursInPeriod = (periodEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60);
      totalHours += hoursInPeriod;
    }
    
    // Move to start of next day
    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(0, 0, 0, 0);
  }

  return totalHours;
}

/**
 * Check if a job requires attention based on last activity
 * @param lastActivityAt - When the job was last active
 * @param reminderSnoozeUntil - If the reminder is snoozed, until when
 * @returns Status: "active" (<24h), "warning" (24-48h), "critical" (>48h), or null if snoozed
 */
export function getActivityStatus(
  lastActivityAt: Date | null,
  reminderSnoozeUntil?: Date | null
): "active" | "warning" | "critical" | null {
  // If no activity recorded yet, consider it active
  if (!lastActivityAt) {
    return "active";
  }

  // Check if reminder is snoozed
  if (reminderSnoozeUntil && new Date(reminderSnoozeUntil) > new Date()) {
    return null;
  }

  const businessHours = calculateBusinessHours(lastActivityAt);

  if (businessHours >= 48) {
    return "critical"; // Red - over 48 hours
  } else if (businessHours >= 24) {
    return "warning"; // Yellow - between 24-48 hours
  } else {
    return "active"; // Green - under 24 hours
  }
}

/**
 * Check if a job needs a reminder notification
 * @param lastActivityAt - When the job was last active
 * @param lastReminderSentAt - When the last reminder was sent
 * @param reminderSnoozeUntil - If the reminder is snoozed, until when
 * @returns Object with needsReminder flag and reminder level
 */
export function checkReminderNeeded(
  lastActivityAt: Date | null,
  lastReminderSentAt: Date | null,
  reminderSnoozeUntil?: Date | null
): { needsReminder: boolean; level: "24h" | "48h" | null } {
  // If no activity recorded yet, no reminder needed
  if (!lastActivityAt) {
    return { needsReminder: false, level: null };
  }

  // Check if reminder is snoozed
  if (reminderSnoozeUntil && new Date(reminderSnoozeUntil) > new Date()) {
    return { needsReminder: false, level: null };
  }

  const businessHoursSinceActivity = calculateBusinessHours(lastActivityAt);

  // Determine which level of reminder is needed
  let reminderLevel: "24h" | "48h" | null = null;
  if (businessHoursSinceActivity >= 48) {
    reminderLevel = "48h";
  } else if (businessHoursSinceActivity >= 24) {
    reminderLevel = "24h";
  } else {
    return { needsReminder: false, level: null };
  }

  // If we've already sent a reminder at this level, don't send again
  if (lastReminderSentAt) {
    const businessHoursSinceReminder = calculateBusinessHours(lastReminderSentAt);
    
    // For 24h reminders, only send if we haven't sent one in the last 24h
    if (reminderLevel === "24h" && businessHoursSinceReminder < 24) {
      return { needsReminder: false, level: null };
    }
    
    // For 48h reminders, only send if we haven't sent one in the last 24h
    if (reminderLevel === "48h" && businessHoursSinceReminder < 24) {
      return { needsReminder: false, level: null };
    }
  }

  return { needsReminder: true, level: reminderLevel };
}

/**
 * Calculate snooze until date (24 business hours from now, excluding Sundays)
 * @returns Date 24 business hours in the future
 */
export function calculateSnoozeUntil(): Date {
  const now = new Date();
  let hoursAdded = 0;
  let currentDate = new Date(now);

  // Add 24 business hours
  while (hoursAdded < 24) {
    const dayOfWeek = currentDate.getDay();
    
    // Skip Sundays
    if (dayOfWeek !== 0) {
      // Calculate hours remaining in current day
      const endOfDay = new Date(currentDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const hoursUntilEndOfDay = (endOfDay.getTime() - currentDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursAdded + hoursUntilEndOfDay >= 24) {
        // We'll hit 24 hours today
        const hoursNeeded = 24 - hoursAdded;
        currentDate = new Date(currentDate.getTime() + hoursNeeded * 60 * 60 * 1000);
        hoursAdded = 24;
      } else {
        // Add all remaining hours in this day
        hoursAdded += hoursUntilEndOfDay;
        currentDate = endOfDay;
      }
    }
    
    // Move to start of next day if we haven't reached 24 hours yet
    if (hoursAdded < 24) {
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
    }
  }

  return currentDate;
}

/**
 * Format business hours for display
 * @param hours - Number of business hours
 * @returns Formatted string like "2d 5h" or "23h"
 */
export function formatBusinessHours(hours: number): string {
  if (hours < 1) {
    return "< 1h";
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = Math.floor(hours % 24);
  
  if (days > 0) {
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
  
  return `${remainingHours}h`;
}
