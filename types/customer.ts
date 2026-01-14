import type { DataAccessLevel } from "@/src/infrastructure/database";
import type { SessionPermission } from "./next-auth";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  departmentId?: string | null;
  positionId?: string | null;
  permissions: Record<string, SessionPermission>;
  dataAccessByResource: Record<string, DataAccessLevel>;
  employeeId?: string | null;
}
