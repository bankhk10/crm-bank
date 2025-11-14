import type { DataAccessLevel, PermissionType } from "@prisma/client";
import type { DefaultSession } from "next-auth";

export interface SessionPermission {
  key: string;
  category: PermissionType;
  allow: boolean;
  menuPath?: string | null;
  action?: string | null;
  resource?: string | null;
  dataAccess?: DataAccessLevel | null;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: string[];
      permissions: Record<string, SessionPermission>;
      departmentId?: string | null;
      positionId?: string | null;
      dataAccessByResource: Record<string, DataAccessLevel>;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    roles: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: string[];
    permissions?: Record<string, SessionPermission>;
    departmentId?: string | null;
    positionId?: string | null;
    dataAccessByResource?: Record<string, DataAccessLevel>;
  }
}
