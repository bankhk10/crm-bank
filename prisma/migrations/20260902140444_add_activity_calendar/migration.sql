-- CreateEnum
CREATE TYPE "CalendarEventStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CalendarAttendeeRole" AS ENUM ('CREATOR', 'HELPER');

-- CreateEnum
CREATE TYPE "CalendarAttendeeStatus" AS ENUM ('INVITED', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "activity_calendar_events" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "province" TEXT,
    "district" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "CalendarEventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_by_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "activity_calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_calendar_attendees" (
    "id" TEXT NOT NULL,
    "calendar_event_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "role" "CalendarAttendeeRole" NOT NULL DEFAULT 'HELPER',
    "status" "CalendarAttendeeStatus" NOT NULL DEFAULT 'INVITED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_calendar_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_calendar_events_activity_plan_id_key" ON "activity_calendar_events"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_calendar_events_employee_id_idx" ON "activity_calendar_events"("employee_id");

-- CreateIndex
CREATE INDEX "activity_calendar_events_start_date_idx" ON "activity_calendar_events"("start_date");

-- CreateIndex
CREATE INDEX "activity_calendar_events_end_date_idx" ON "activity_calendar_events"("end_date");

-- CreateIndex
CREATE INDEX "activity_calendar_events_status_idx" ON "activity_calendar_events"("status");

-- CreateIndex
CREATE INDEX "activity_calendar_attendees_employee_id_idx" ON "activity_calendar_attendees"("employee_id");

-- CreateIndex
CREATE INDEX "activity_calendar_attendees_status_idx" ON "activity_calendar_attendees"("status");

-- CreateIndex
CREATE UNIQUE INDEX "activity_calendar_attendees_calendar_event_id_employee_id_key" ON "activity_calendar_attendees"("calendar_event_id", "employee_id");

-- AddForeignKey
ALTER TABLE "activity_calendar_events" ADD CONSTRAINT "activity_calendar_events_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_calendar_events" ADD CONSTRAINT "activity_calendar_events_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_calendar_events" ADD CONSTRAINT "activity_calendar_events_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_calendar_attendees" ADD CONSTRAINT "activity_calendar_attendees_calendar_event_id_fkey" FOREIGN KEY ("calendar_event_id") REFERENCES "activity_calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_calendar_attendees" ADD CONSTRAINT "activity_calendar_attendees_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
