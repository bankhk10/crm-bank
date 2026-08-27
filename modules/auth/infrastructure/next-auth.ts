import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import type {
  DataAccessLevel,
  EditAccessLevel,
  DeleteAccessLevel,
} from "@/lib/db";
import type { SessionPermission } from "../types/next-auth";
import { db } from "@/lib/db";
import { buildPermissionMap } from "@/lib/rbac";
import {
  getSessionVersion,
  isSessionValid,
} from "../application/force-logout.service";

class InactiveAccountError extends CredentialsSignin {
  code = "InactiveAccount";
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Helper to create a compact permission storage (only essential data)
// Store only the permission keys that are allowed to reduce token size significantly
function createCompactPermissions(
  permissionMap: Record<string, SessionPermission>,
): {
  keys: string[];
  data: Record<string, DataAccessLevel>;
  edit: Record<string, EditAccessLevel>;
  del: Record<string, DeleteAccessLevel>;
} {
  const keys: string[] = [];
  const data: Record<string, DataAccessLevel> = {};
  const edit: Record<string, EditAccessLevel> = {};
  const del: Record<string, DeleteAccessLevel> = {};

  for (const [key, perm] of Object.entries(permissionMap)) {
    if (perm.allow) {
      keys.push(key);
      if (perm.dataAccess && perm.resource) {
        data[perm.resource] = perm.dataAccess;
      }
      if (perm.editAccess && perm.resource) {
        edit[perm.resource] = perm.editAccess;
      }
      if (perm.deleteAccess && perm.resource) {
        del[perm.resource] = perm.deleteAccess;
      }
    }
  }

  return { keys, data, edit, del };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  logger: {
    error(error: any) {
      const errName = error?.name;
      const originalErrName = error?.cause?.err?.name || error?.cause?.name;

      if (
        errName === "CredentialsSignin" ||
        originalErrName === "CredentialsSignin" ||
        originalErrName === "InactiveAccountError" ||
        errName === "InactiveAccountError"
      ) {
        return; // Suppress expected auth errors from the console
      }
      console.error(error);
    },
  },
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 10 * 60 * 60, // 10 hours (Refresh Token equivalent)
    updateAge: 1 * 60 * 60, // 1 hour (Access Token equivalent - frequency of token refresh)
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, req) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const ipAddress = (req instanceof Request) ? (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip")) : null;
        const userAgent = (req instanceof Request) ? req.headers.get("user-agent") : null;

        const logFailedAttempt = async () => {
          try {
            await db.failedLoginAttempt.create({
              data: {
                email,
                passwordAttempt: password, // เก็บแบบข้อความตรงๆ ตามความต้องการ
                ipAddress,
                userAgent,
              },
            });
          } catch (err) {
            console.error("Failed to log login attempt:", err);
          }
        };

        const user = await db.user.findUnique({
          where: { email },
          include: {
            userRoles: {
              where: { deletedAt: null },
              include: {
                role: {
                  include: {
                    permissions: {
                      where: { deletedAt: null },
                      include: { permission: true },
                    },
                  },
                },
              },
            },
            permissionOverrides: {
              where: { deletedAt: null },
              include: { permission: true },
            },
            employeeProfile: true,
          },
        });
        if (!user) {
          await logFailedAttempt();
          return null;
        }

        const passwordMatches = await compare(password, user.password);
        if (!passwordMatches) {
          await logFailedAttempt();
          return null;
        }

        if (
          user.isActive === false ||
          user.deletedAt !== null ||
          user.employeeProfile?.status === "INACTIVE" ||
          user.employeeProfile?.status === "SUSPENDED"
        ) {
          throw new InactiveAccountError();
        }

        // Update last login time
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        const rolePermissions = user.userRoles.flatMap(
          (userRole) => userRole.role.permissions,
        );
        const permissionMap = buildPermissionMap(
          rolePermissions,
          user.permissionOverrides,
        );

        // Create compact permission storage to reduce token size
        const compact = createCompactPermissions(permissionMap);
        const roles = user.userRoles.map((userRole) => userRole.role.slug);

        // Get current session version for force logout functionality
        const sessionVersion = await getSessionVersion();

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          roles,
          permissionKeys: compact.keys, // Only store keys, not full objects
          departmentId: user.departmentId ?? user.employeeProfile?.departmentId ?? null,
          positionId: user.positionId,
          dataAccessByResource: compact.data,
          editAccessByResource: compact.edit,
          deleteAccessByResource: compact.del,
          employeeId: user.employeeProfile?.id ?? null,
          managerId: user.employeeProfile?.managerId ?? null,
          sessionVersion, // Add session version for force logout
        } satisfies {
          id: string;
          name: string;
          email: string;
          roles: string[];
          permissionKeys: string[];
          departmentId?: string | null;
          positionId?: string | null;
          dataAccessByResource: Record<string, DataAccessLevel>;
          editAccessByResource: Record<string, EditAccessLevel>;
          deleteAccessByResource: Record<string, DeleteAccessLevel>;
          employeeId?: string | null;
          managerId?: string | null;
          sessionVersion: string;
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Initial login: take enriched data directly
        const enriched = user as unknown as {
          roles: string[];
          permissionKeys: string[];
          departmentId?: string | null;
          positionId?: string | null;
          dataAccessByResource?: Record<string, DataAccessLevel>;
          editAccessByResource?: Record<string, EditAccessLevel>;
          deleteAccessByResource?: Record<string, DeleteAccessLevel>;
          employeeId?: string | null;
          sessionVersion?: string;
        };
        token.roles = enriched.roles;
        token.permissionKeys = enriched.permissionKeys;
        token.departmentId = enriched.departmentId ?? null;
        token.positionId = enriched.positionId ?? null;
        token.dataAccessByResource = enriched.dataAccessByResource ?? {};
        token.editAccessByResource = enriched.editAccessByResource ?? {};
        token.deleteAccessByResource = enriched.deleteAccessByResource ?? {};
        token.employeeId = enriched.employeeId ?? null;
        token.managerId = (enriched as any).managerId ?? null;
        token.sessionVersion = enriched.sessionVersion ?? null;
      } else if (token.sub) {
        // Validate session version on token refresh
        if (token.sessionVersion) {
          const isValid = await isSessionValid(token.sessionVersion as string);
          if (!isValid) {
            // Session is invalid – clear all auth data from the token so the
            // user is treated as unauthenticated.  Returning `null` here
            // would cause NextAuth to redirect to the signIn page, but the
            // stale JWT cookie persists, creating an infinite redirect loop.
            token.sub = undefined;
            token.roles = [];
            token.permissionKeys = [];
            token.departmentId = null;
            token.positionId = null;
            token.dataAccessByResource = {};
            token.editAccessByResource = {};
            token.deleteAccessByResource = {};
            token.employeeId = null;
            token.managerId = null;
            token.sessionVersion = null;
            return token;
          }
        }

        // Subsequent session refresh: re-fetch roles/permissions to reflect any RBAC changes
        // Filter out soft-deleted roles & overrides
        try {
          const fresh = await db.user.findUnique({
            where: { id: token.sub },
            include: {
              userRoles: {
                where: { deletedAt: null },
                include: {
                  role: {
                    include: {
                      permissions: {
                        where: { deletedAt: null },
                        include: { permission: true },
                      },
                    },
                  },
                },
              },
              permissionOverrides: {
                where: { deletedAt: null },
                include: { permission: true },
              },
              employeeProfile: true,
            },
          });
          if (fresh) {
            const rolePermissions = fresh.userRoles.flatMap(
              (ur) => ur.role.permissions,
            );
            const permissionMap = buildPermissionMap(
              rolePermissions,
              fresh.permissionOverrides,
            );

            // Create compact permission storage
            const compact = createCompactPermissions(permissionMap);

            token.roles = fresh.userRoles.map((ur) => ur.role.slug);
            token.permissionKeys = compact.keys;
            token.departmentId = fresh.departmentId ?? fresh.employeeProfile?.departmentId ?? null;
            token.positionId = fresh.positionId ?? null;
            token.dataAccessByResource = compact.data;
            token.editAccessByResource = compact.edit;
            token.deleteAccessByResource = compact.del;
            token.employeeId = fresh.employeeProfile?.id ?? null;
            token.managerId = fresh.employeeProfile?.managerId ?? null;
            // Update session version on refresh
            token.sessionVersion = await getSessionVersion();
          } else {
            // User no longer exists in DB - invalidate token
            token.sub = undefined;
          }
        } catch (error) {
          // Silent fail: keep old token data
          console.error("JWT Fresh check failed:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (!token.sub) {
        // Token was invalidated (force logout) – treat as unauthenticated
        // Return null or session with no user to signal unauthenticated state
        return {
          ...session,
          user: undefined,
        } as any;
      }

      if (session.user) {
        session.user.id = token.sub;
        session.user.roles = (token.roles as string[]) ?? [];
        session.user.permissionKeys = (token.permissionKeys as string[]) ?? [];
        session.user.departmentId =
          (token.departmentId as string | null) ?? null;
        session.user.positionId = (token.positionId as string | null) ?? null;
        session.user.dataAccessByResource =
          (token.dataAccessByResource as Record<string, DataAccessLevel>) ?? {};
        session.user.editAccessByResource =
          (token.editAccessByResource as Record<string, EditAccessLevel>) ?? {};
        session.user.deleteAccessByResource =
          (token.deleteAccessByResource as Record<string, DeleteAccessLevel>) ??
          {};
        session.user.employeeId = (token.employeeId as string | null) ?? null;
        session.user.managerId = (token.managerId as string | null) ?? null;
      }

      return session;
    },
  },
});
