import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import type {
  DataAccessLevel,
  EditAccessLevel,
  DeleteAccessLevel,
} from "@/src/infrastructure/database";
import type { SessionPermission } from "@/types/next-auth";
import { db } from "./db";
import {
  buildDataAccessByResource,
  buildEditAccessByResource,
  buildDeleteAccessByResource,
  buildPermissionMap,
} from "./rbac";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Helper to create a minimal permission map (remove redundant fields to reduce token size)
function createMinimalPermissionMap(
  permissionMap: Record<string, SessionPermission>
): Record<string, SessionPermission> {
  const minimal: Record<string, SessionPermission> = {};
  for (const [key, perm] of Object.entries(permissionMap)) {
    minimal[key] = {
      key: perm.key,
      category: perm.category,
      allow: perm.allow,
      // Only include non-null optional fields
      ...(perm.menuPath && { menuPath: perm.menuPath }),
      ...(perm.action && { action: perm.action }),
      ...(perm.resource && { resource: perm.resource }),
      ...(perm.dataAccess && { dataAccess: perm.dataAccess }),
      ...(perm.editAccess && { editAccess: perm.editAccess }),
      ...(perm.deleteAccess && { deleteAccess: perm.deleteAccess }),
    };
  }
  return minimal;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
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
          return null;
        }

        const passwordMatches = await compare(password, user.password);
        if (!passwordMatches) {
          return null;
        }
        const rolePermissions = user.userRoles.flatMap(
          (userRole) => userRole.role.permissions
        );
        const permissionMap = buildPermissionMap(
          rolePermissions,
          user.permissionOverrides
        );

        // Create minimal permission map to reduce token size
        const minimalPermissions = createMinimalPermissionMap(permissionMap);

        // Build access maps
        const dataAccessByResource = buildDataAccessByResource(permissionMap);
        const editAccessByResource = buildEditAccessByResource(permissionMap);
        const deleteAccessByResource =
          buildDeleteAccessByResource(permissionMap);
        const roles = user.userRoles.map((userRole) => userRole.role.slug);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          roles,
          permissions: minimalPermissions,
          departmentId: user.departmentId,
          positionId: user.positionId,
          dataAccessByResource,
          editAccessByResource,
          deleteAccessByResource,
          employeeId: user.employeeProfile?.id ?? null,
        } satisfies {
          id: string;
          name: string;
          email: string;
          roles: string[];
          permissions: Record<string, SessionPermission>;
          departmentId?: string | null;
          positionId?: string | null;
          dataAccessByResource: Record<string, DataAccessLevel>;
          editAccessByResource: Record<string, EditAccessLevel>;
          deleteAccessByResource: Record<string, DeleteAccessLevel>;
          employeeId?: string | null;
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
          permissions: Record<string, SessionPermission>;
          departmentId?: string | null;
          positionId?: string | null;
          dataAccessByResource?: Record<string, DataAccessLevel>;
          editAccessByResource?: Record<string, EditAccessLevel>;
          deleteAccessByResource?: Record<string, DeleteAccessLevel>;
          employeeId?: string | null;
        };
        token.roles = enriched.roles;
        token.permissions = enriched.permissions;
        token.departmentId = enriched.departmentId ?? null;
        token.positionId = enriched.positionId ?? null;
        token.dataAccessByResource = enriched.dataAccessByResource ?? {};
        token.editAccessByResource = enriched.editAccessByResource ?? {};
        token.deleteAccessByResource = enriched.deleteAccessByResource ?? {};
        token.employeeId = enriched.employeeId ?? null;
      } else if (token.sub) {
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
              (ur) => ur.role.permissions
            );
            const permissionMap = buildPermissionMap(
              rolePermissions,
              fresh.permissionOverrides
            );

            // Create minimal permission map
            const minimalPermissions =
              createMinimalPermissionMap(permissionMap);

            const dataAccessByResource =
              buildDataAccessByResource(permissionMap);
            const editAccessByResource =
              buildEditAccessByResource(permissionMap);
            const deleteAccessByResource =
              buildDeleteAccessByResource(permissionMap);
            token.roles = fresh.userRoles.map((ur) => ur.role.slug);
            token.permissions = minimalPermissions;
            token.departmentId = fresh.departmentId ?? null;
            token.positionId = fresh.positionId ?? null;
            token.dataAccessByResource = dataAccessByResource;
            token.editAccessByResource = editAccessByResource;
            token.deleteAccessByResource = deleteAccessByResource;
            token.employeeId = fresh.employeeProfile?.id ?? null;
          }
        } catch {
          // Silent fail: keep old token data
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.roles = (token.roles as string[]) ?? [];
        session.user.permissions =
          (token.permissions as Record<string, SessionPermission>) ?? {};
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
      }

      return session;
    },
  },
});
