import { LogSeverity } from "@prisma/client";

/**
 * Simulates synchronizing an approved Activity Plan to an external Calendar system (like Google/Outlook Calendar)
 * and logs the synchronization event in the system's Audit/Application logs.
 */
export async function syncActivityPlanToCalendarUseCase(
  plan: { id: string; title: string; startDate: Date; endDate: Date; location: string; employee: { name: string } },
  tx: any
) {
  // 1. Generate a mock Google Calendar Meet/Event link
  const mockRandomString = Math.random().toString(36).substring(2, 5) + "-" + 
                           Math.random().toString(36).substring(2, 6) + "-" + 
                           Math.random().toString(36).substring(2, 5);
  const mockEventLink = `https://calendar.google.com/calendar/event?eid=M2Npcms4cjRkNDg3N3E2MDR2MDM4aDRzNm8gYWNjZXNzX2NybV9iYW5r`;
  const mockMeetLink = `https://meet.google.com/mock-${mockRandomString}`;

  // 2. Log this event into the database's ApplicationLog table to demonstrate the integration
  await tx.applicationLog.create({
    data: {
      level: LogSeverity.INFO,
      message: `Successfully synchronized Activity Plan "${plan.title}" (ID: ${plan.id}) of employee ${plan.employee.name} to Calendar. Created Google Meet link: ${mockMeetLink}. Calendar Event: ${mockEventLink}`,
      module: "activity-plans",
      functionName: "syncActivityPlanToCalendarUseCase",
    },
  });

  return {
    success: true,
    eventLink: mockEventLink,
    meetLink: mockMeetLink,
  };
}
