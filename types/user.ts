import type {
  DataAccessLevel,
  EditAccessLevel,
  DeleteAccessLevel,
} from "@/lib/db";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  departmentId?: string | null;
  positionId?: string | null;
  permissionKeys: string[]; // Changed from permissions object to array of keys
  dataAccessByResource: Record<string, DataAccessLevel>;
  editAccessByResource?: Record<string, EditAccessLevel>;
  deleteAccessByResource?: Record<string, DeleteAccessLevel>;
  employeeId?: string | null;
}
