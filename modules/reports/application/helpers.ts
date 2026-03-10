import * as repo from "../infrastructure/reports.repository";
import { DataAccessLevel } from "@/lib/db";

export async function getTeamEmployeeIds(session: any): Promise<string[]> {
  const employeeId = session.user?.employeeId;
  if (!employeeId) return [];
  const managerId = session.user?.managerId;
  return repo.findTeamEmployeeIds(employeeId, managerId);
}

export async function buildScopeFilter(
  session: any,
  viewScope: DataAccessLevel | string,
): Promise<any> {
  const scopeFilter: any = {};
  if (viewScope === DataAccessLevel.VIEW_OWN) {
    if (!session.user.employeeId) throw new Error("User is not an employee");
    scopeFilter.employeeId = session.user.employeeId;
  } else if (viewScope === "VIEW_TEAM") {
    const teamIds = await getTeamEmployeeIds(session);
    if (teamIds.length > 0) {
      scopeFilter.employeeId = { in: teamIds };
    } else {
      scopeFilter.employeeId = session.user.employeeId;
    }
  } else if (viewScope === DataAccessLevel.VIEW_DEPARTMENT) {
    if (!session.user.departmentId) throw new Error("User has no department");
    scopeFilter.employee = { departmentId: session.user.departmentId };
  }
  return scopeFilter;
}
