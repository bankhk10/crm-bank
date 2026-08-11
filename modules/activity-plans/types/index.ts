import { Prisma, ActivityStatus, ActivityHelperStatus, ActivityApprovalStep, ActivityApprovalAction } from "@prisma/client";
import { findActivityPlanById } from "../infrastructure/activity-plan.repository";

export type ActivityPlanWithRelations = NonNullable<Prisma.PromiseReturnType<typeof findActivityPlanById>>;
export type ActivityHelperWithRelations = ActivityPlanWithRelations["helpers"][number];
export type ActivityApprovalLogWithRelations = ActivityPlanWithRelations["approvalLogs"][number];

export type { ActivityStatus, ActivityHelperStatus, ActivityApprovalStep, ActivityApprovalAction };
