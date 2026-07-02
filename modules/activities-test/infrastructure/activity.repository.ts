import { db } from "@/lib/db"
import { ActivityRole, ActivityBudgetType, ActivityApprovalStep, ApprovalStatus } from "@prisma/client"

export async function createEmployeeZoneRole(employeeId: string, role: ActivityRole, zone: string, supervisorId?: string | null) {
  return db.employeeZoneRole.upsert({
    where: {
      employeeId_role_zone: {
        employeeId,
        role,
        zone,
      },
    },
    update: { isActive: true, supervisorId },
    create: { employeeId, role, zone, supervisorId },
  })
}

export async function getEmployeeZoneRoles(employeeId: string) {
  return db.employeeZoneRole.findMany({
    where: { employeeId, isActive: true },
  })
}

export async function getAllZoneRoles() {
  return db.employeeZoneRole.findMany({
    where: { isActive: true },
    include: { 
      employee: { select: { name: true } },
      supervisor: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function deleteEmployeeZoneRole(employeeId: string, role: ActivityRole, zone: string) {
  return db.employeeZoneRole.delete({
    where: {
      employeeId_role_zone: { employeeId, role, zone }
    }
  })
}

export async function getAllEmployees() {
  return db.employee.findMany({
    select: { id: true, name: true, positionTitle: true, departmentName: true },
  })
}

export async function deleteActivity(id: string) {
  return db.activity.delete({ where: { id } })
}

export async function createActivityWithRelations(data: any) {
  return db.activity.create({
    data: {
      title: data.title,
      startDate: data.startDate,
      endDate: data.endDate,
      activityType: data.activityType,
      locationDetails: data.locationDetails,
      target: data.target,
      details: data.details,
      notes: data.notes,
      zone: data.zone,
      status: data.status,
      createdById: data.createdById,
      budgets: {
        create: data.budgets || [],
      },
      helpers: {
        create: data.helpers || [],
      },
      approvalTasks: {
        create: data.approvalTasks || [],
      },
    },
  })
}

export async function getActivityWithDetails(activityId: string) {
  return db.activity.findUnique({
    where: { id: activityId },
    include: {
      createdBy: true,
      budgets: true,
      helpers: { include: { employee: true } },
      approvalTasks: { include: { approvedBy: true }, orderBy: { step: 'asc' } },
    },
  })
}

export async function listActivities() {
  return db.activity.findMany({
    orderBy: { createdAt: 'desc' },
    include: { 
      createdBy: true,
      approvalTasks: { 
        include: { assignedApprover: true },
        orderBy: { step: 'asc' } 
      }
    },
  })
}

export async function updateApprovalTaskStatus(taskId: string, status: ApprovalStatus, employeeId: string) {
  return db.activityApprovalTask.update({
    where: { id: taskId },
    data: {
      status,
      approvedById: employeeId,
      approvedAt: new Date()
    }
  })
}

export async function updateActivityStatus(activityId: string, status: any) {
  return db.activity.update({
    where: { id: activityId },
    data: { status }
  })
}
