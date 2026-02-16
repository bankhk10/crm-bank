import type {
  DataAccessLevel,
  EditAccessLevel,
  DeleteAccessLevel,
  PermissionType,
} from "@/src/infrastructure/database";
import type { DefaultSession } from "next-auth";

export interface SessionPermission {
  key: string;
  category: PermissionType;
  allow: boolean;
  menuPath?: string | null;
  action?: string | null;
  resource?: string | null;
  dataAccess?: DataAccessLevel | null;
  editAccess?: EditAccessLevel | null;
  deleteAccess?: DeleteAccessLevel | null;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: string[];
      permissionKeys: string[]; // Changed from permissions object to simple key array
      departmentId?: string | null;
      positionId?: string | null;
      dataAccessByResource: Record<string, DataAccessLevel>;
      editAccessByResource?: Record<string, EditAccessLevel>;
      deleteAccessByResource?: Record<string, DeleteAccessLevel>;
      employeeId?: string | null;
      managerId?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    roles: string[];
    employeeId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: string[];
    permissionKeys?: string[]; // Changed from permissions object to simple key array
    departmentId?: string | null;
    positionId?: string | null;
    dataAccessByResource?: Record<string, DataAccessLevel>;
    editAccessByResource?: Record<string, EditAccessLevel>;
    deleteAccessByResource?: Record<string, DeleteAccessLevel>;
    employeeId?: string | null;
    managerId?: string | null;
  }
}
