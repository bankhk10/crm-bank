import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import type { DataAccessLevel } from "@/src/infrastructure/database";
import type { SessionPermission } from "@/types/next-auth";
import { db } from "./db";
import { buildDataAccessByResource, buildPermissionMap } from "./rbac";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

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
        const dataAccessByResource = buildDataAccessByResource(permissionMap);
        const roles = user.userRoles.map((userRole) => userRole.role.slug);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          roles,
          permissions: permissionMap,
          departmentId: user.departmentId,
          positionId: user.positionId,
          dataAccessByResource,
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
          employeeId?: string | null;
        };
        token.roles = enriched.roles;
        token.permissions = enriched.permissions;
        token.departmentId = enriched.departmentId ?? null;
        token.positionId = enriched.positionId ?? null;
        token.dataAccessByResource = enriched.dataAccessByResource ?? {};
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
            const dataAccessByResource =
              buildDataAccessByResource(permissionMap);
            token.roles = fresh.userRoles.map((ur) => ur.role.slug);
            token.permissions = permissionMap;
            token.departmentId = fresh.departmentId ?? null;
            token.positionId = fresh.positionId ?? null;
            token.dataAccessByResource = dataAccessByResource;
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
        session.user.employeeId = (token.employeeId as string | null) ?? null;
      }

      return session;
    },
  },
});
