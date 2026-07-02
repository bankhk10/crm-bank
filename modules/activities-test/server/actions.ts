"use server"

import { revalidatePath } from "next/cache"
import { ActivityRole } from "@prisma/client"
import * as app from "../application/index"
import * as repo from "../infrastructure/activity.repository"

export async function assignZoneRoleAction(employeeId: string, role: ActivityRole, zone: string, supervisorId?: string | null) {
  await repo.createEmployeeZoneRole(employeeId, role, zone, supervisorId)
  revalidatePath("/activities/test", "layout")
}

export async function deleteZoneRoleAction(employeeId: string, role: ActivityRole, zone: string) {
  await repo.deleteEmployeeZoneRole(employeeId, role, zone)
  revalidatePath("/activities/test", "layout")
}

export async function getZoneRolesAction() {
  const data = await repo.getAllZoneRoles()
  return JSON.parse(JSON.stringify(data))
}

export async function createActivityAction(formData: any) {
  await app.calculateAutoEscalationAndCreateActivity(formData)
  revalidatePath("/activities/test", "layout")
}

export async function deleteActivityAction(id: string) {
  await repo.deleteActivity(id)
  revalidatePath("/activities/test", "layout")
}

export async function getEmployeesAction() {
  const data = await repo.getAllEmployees()
  return JSON.parse(JSON.stringify(data))
}

export async function listActivitiesAction() {
  const data = await repo.listActivities()
  return JSON.parse(JSON.stringify(data))
}

export async function getActivityDetailsAction(id: string) {
  const data = await repo.getActivityWithDetails(id)
  return JSON.parse(JSON.stringify(data))
}

export async function approveTaskAction(activityId: string, taskId: string, employeeId: string, isApproved: boolean) {
  // Update task
  await repo.updateApprovalTaskStatus(taskId, isApproved ? 'APPROVED' : 'REJECTED', employeeId)

  if (!isApproved) {
    await repo.updateActivityStatus(activityId, 'REJECTED')
    revalidatePath("/activities/test", "layout")
    return
  }

  // Check next tasks
  const activity = await repo.getActivityWithDetails(activityId)
  if (!activity) return

  const pendingTasks = activity.approvalTasks.filter(t => t.status === 'PENDING')
  
  if (pendingTasks.length === 0) {
     // All approved!
     await repo.updateActivityStatus(activityId, 'APPROVED')
  } else {
     // Update activity status based on the step of next pending task
     const nextPending = pendingTasks[0]
     let nextStatus = 'PENDING_POSITION'
     if (nextPending.step === 'BUDGET_DEPT' || nextPending.step === 'BUDGET_DIRECTOR') nextStatus = 'PENDING_BUDGET'
     if (nextPending.step === 'HELPER') nextStatus = 'PENDING_HELPER'
     
     await repo.updateActivityStatus(activityId, nextStatus)
  }
  
  revalidatePath("/activities/test", "layout")
}
