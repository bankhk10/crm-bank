import { ActivityRole, ActivityBudgetType, ActivityApprovalStep, ActivityStatus, ApprovalStatus } from "@prisma/client"
import * as repo from "../infrastructure/activity.repository"

function getRoleLevel(role: ActivityRole): number {
  switch (role) {
    case 'PROMOTER': return 0;
    case 'SALES': return 1;
    case 'REGIONAL_MANAGER': return 2;
    case 'SALES_ADMIN_MANAGER': return 3;
    case 'SALES_DIRECTOR': return 4;
    case 'MARKETING': return 1;
    case 'MARKETING_MANAGER': return 3;
    default: return 0;
  }
}

export async function calculateAutoEscalationAndCreateActivity(data: any) {
  // 1. Get creator's max level in the given zone
  const zoneRoles = await repo.getEmployeeZoneRoles(data.createdById)
  const zoneSpecificRoles = zoneRoles.filter(r => r.zone === data.zone || r.zone === 'ALL')
  
  let maxLevel = -1;
  let highestRole: ActivityRole = 'PROMOTER';
  let supervisorId = null;
  
  for (const zr of zoneSpecificRoles) {
    const level = getRoleLevel(zr.role)
    if (level > maxLevel) {
      maxLevel = level
      highestRole = zr.role
      supervisorId = zr.supervisorId
    }
  }

  // If no role found in this zone, fallback to lowest
  if (maxLevel === -1) {
    maxLevel = 0;
    highestRole = 'PROMOTER';
    supervisorId = null;
  }

  const approvalTasks = []
  
  // Step 2: Position Check (Auto-escalation up the supervisor chain)
  let status: ActivityStatus = ActivityStatus.PENDING_POSITION
  
  if (maxLevel >= 3) {
    // SALES_ADMIN_MANAGER or above skips position check, moves to BUDGET or HELPER
    approvalTasks.push({ step: ActivityApprovalStep.POSITION, approverRole: highestRole, status: ApprovalStatus.APPROVED, notes: 'Auto-approved by Creator' })
    status = ActivityStatus.PENDING_BUDGET
  } else {
    if (maxLevel > 0) {
      // Creator is higher than Promoter, so log an auto-approval for their level
      approvalTasks.push({ step: ActivityApprovalStep.POSITION, approverRole: highestRole, status: ApprovalStatus.APPROVED, notes: 'Auto-approved by Creator' })
    }
    // Walk up the supervisor chain until we hit level >= 2
    let currentSupervisorId = supervisorId
    
    // Safety limit to prevent infinite loops
    let limit = 5
    while (currentSupervisorId && limit > 0) {
      // Find supervisor's highest role and their supervisor
      const supRoles = await repo.getEmployeeZoneRoles(currentSupervisorId)
      const supZoneRoles = supRoles.filter(r => r.zone === data.zone || r.zone === 'ALL')
      
      let supMaxLevel = -1
      let supHighestRole: ActivityRole = 'PROMOTER'
      let nextSupervisorId = null
      
      for (const r of supZoneRoles) {
        const lvl = getRoleLevel(r.role)
        if (lvl > supMaxLevel) {
          supMaxLevel = lvl
          supHighestRole = r.role
          nextSupervisorId = r.supervisorId
        }
      }
      
      if (supMaxLevel === -1) break; // Supervisor has no role in this zone, stop.
      
      approvalTasks.push({ 
        step: ActivityApprovalStep.POSITION, 
        approverRole: supHighestRole, 
        status: ApprovalStatus.PENDING, 
        assignedApproverId: currentSupervisorId 
      })
      
      if (supMaxLevel >= 3) {
        // Hit Sales Admin Manager or above, chain stops here
        break
      }
      
      currentSupervisorId = nextSupervisorId
      limit--
    }
  }

  // Step 3: Budget Check (Only if they passed position check or are already at budget step)
  if (data.budgets && data.budgets.length > 0) {
    const hasSalesPromo = data.budgets.some((b: any) => b.budgetType === ActivityBudgetType.SALES_PROMOTION)
    const hasMarketing = data.budgets.some((b: any) => b.budgetType === ActivityBudgetType.MARKETING)
    
    if (hasSalesPromo) {
      const isSamInPosition = approvalTasks.some(t => t.approverRole === ActivityRole.SALES_ADMIN_MANAGER && t.step === ActivityApprovalStep.POSITION)
      const isCreatorSamOrHigher = maxLevel >= 3 && (highestRole === ActivityRole.SALES_ADMIN_MANAGER || highestRole === ActivityRole.SALES_DIRECTOR)
      
      if (isSamInPosition || isCreatorSamOrHigher) {
        approvalTasks.push({ step: ActivityApprovalStep.BUDGET_DEPT, approverRole: ActivityRole.SALES_ADMIN_MANAGER, status: ApprovalStatus.APPROVED, notes: 'Auto-approved (รวบยอดกับขั้น Position แล้ว)' })
      } else {
        approvalTasks.push({ step: ActivityApprovalStep.BUDGET_DEPT, approverRole: ActivityRole.SALES_ADMIN_MANAGER, status: ApprovalStatus.PENDING })
      }
    }
    if (hasMarketing) {
      const isMmInPosition = approvalTasks.some(t => t.approverRole === ActivityRole.MARKETING_MANAGER && t.step === ActivityApprovalStep.POSITION)
      const isCreatorMmOrHigher = maxLevel >= 3 && (highestRole === ActivityRole.MARKETING_MANAGER || highestRole === ActivityRole.SALES_DIRECTOR)
      
      if (isMmInPosition || isCreatorMmOrHigher) {
        approvalTasks.push({ step: ActivityApprovalStep.BUDGET_DEPT, approverRole: ActivityRole.MARKETING_MANAGER, status: ApprovalStatus.APPROVED, notes: 'Auto-approved (รวบยอดกับขั้น Position แล้ว)' })
      } else {
        approvalTasks.push({ step: ActivityApprovalStep.BUDGET_DEPT, approverRole: ActivityRole.MARKETING_MANAGER, status: ApprovalStatus.PENDING })
      }
    }
    
    // Sales Director approves overall budget after dept managers
    const isCreatorDirector = maxLevel >= 4
    if (isCreatorDirector) {
      approvalTasks.push({ step: ActivityApprovalStep.BUDGET_DIRECTOR, approverRole: ActivityRole.SALES_DIRECTOR, status: ApprovalStatus.APPROVED, notes: 'Auto-approved by Creator' })
    } else {
      approvalTasks.push({ step: ActivityApprovalStep.BUDGET_DIRECTOR, approverRole: ActivityRole.SALES_DIRECTOR, status: ApprovalStatus.PENDING })
    }
    
  } else if (status === ActivityStatus.PENDING_BUDGET) {
    // No budget, skip to helper
    status = ActivityStatus.PENDING_HELPER
  }

  // Step 4: Helper Check
  if (data.helpers && data.helpers.length > 0) {
    const helperManagers = new Set<ActivityRole>()
    
    for (const h of data.helpers) {
      const hRoles = await repo.getEmployeeZoneRoles(h.employeeId)
      const hZoneRoles = hRoles.filter(r => r.zone === data.zone || r.zone === 'ALL')
      
      let hMaxLevel = -1
      let hRole: ActivityRole = 'PROMOTER'
      for (const zr of hZoneRoles) {
        const lvl = getRoleLevel(zr.role)
        if (lvl > hMaxLevel) { hMaxLevel = lvl; hRole = zr.role }
      }
      
      h.helperRole = hRole // Update actual role
      
      if (hRole === ActivityRole.MARKETING || hRole === ActivityRole.MARKETING_MANAGER) {
        helperManagers.add(ActivityRole.MARKETING_MANAGER)
      } else {
        helperManagers.add(ActivityRole.SALES_ADMIN_MANAGER)
      }
    }
    
    for (const mgrRole of Array.from(helperManagers)) {
      const isMgrInPosition = approvalTasks.some(t => t.approverRole === mgrRole && t.step === ActivityApprovalStep.POSITION)
      const isCreatorMgrOrHigher = maxLevel >= 3 && (highestRole === mgrRole || highestRole === ActivityRole.SALES_DIRECTOR)
      
      if (isMgrInPosition || isCreatorMgrOrHigher) {
        approvalTasks.push({ 
          step: ActivityApprovalStep.HELPER, 
          approverRole: mgrRole, 
          status: ApprovalStatus.APPROVED, 
          notes: 'Auto-approved (รวบยอดกับขั้น Position แล้ว)' 
        })
      } else {
        approvalTasks.push({ step: ActivityApprovalStep.HELPER, approverRole: mgrRole, status: ApprovalStatus.PENDING })
      }
    }
    
  } else if (status === ActivityStatus.PENDING_HELPER) {
    status = ActivityStatus.APPROVED
  }

  data.approvalTasks = approvalTasks
  data.status = status

  return repo.createActivityWithRelations(data)
}
