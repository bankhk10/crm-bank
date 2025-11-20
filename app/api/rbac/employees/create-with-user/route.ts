import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { guardPermission } from "@/lib/api-guard";

const payloadSchema = z.object({
  employee: z.object({
    // basic identity
    name: z.string().min(2),
    email: z.string().email().optional(),
    roleTitle: z.string().optional(),
    phone: z.string().optional(),
    companyId: z.string().optional(),
    company: z.string().optional(),
    // extended fields from form
    prefix: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    employeeCode: z.string().optional(),
    birthDate: z.string().optional(),
    addressLine: z.string().optional(),
    address: z
      .object({
        province: z.string().optional(),
        district: z.string().optional(),
        subdistrict: z.string().optional(),
        // postalCode may be sent as number or string from various clients
        postalCode: z.union([z.string(), z.number()]).optional(),
      })
      .optional(),
    responsibilityArea: z.string().optional(),
    status: z.string().optional(),
    position: z.string().optional(),
    department: z.string().optional(),
    // frontend sometimes sends relation ids as `positionId` / `departmentId`
    positionId: z.string().optional(),
    departmentId: z.string().optional()
  }),
  user: z
    .object({
      email: z.string().email(),
      password: z.string().min(6),
      roleId: z.string().optional()
    })
    .optional()
});

export async function POST(request: Request) {
  const guardResult = await guardPermission("rbac.manage");
  if ("response" in guardResult) {
    return guardResult.response;
  }

  const body = await request.json().catch(() => null);
  console.log("[api/rbac/employees/create-with-user] received body:", JSON.stringify(body));
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    // Log zod issues to server console for easier debugging in dev
    try {
      console.log(
        "[api/rbac/employees/create-with-user] Zod validation failed:",
        JSON.stringify(parsed.error.flatten())
      );
    } catch (e) {
      console.log("[api/rbac/employees/create-with-user] Zod validation failed (could not stringify)", parsed.error);
    }

    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { employee: empPayload, user: userPayload } = parsed.data;

  // If frontend provided company name (empPayload.company) but not companyId,
  // try to resolve the company by name to a companyId.
  if (empPayload.company && !empPayload.companyId) {
    try {
      const comp = await db.company.findFirst({ where: { name: empPayload.company } });
      if (comp) {
        // assign back to payload so creation uses the id
        (parsed.data.employee as any).companyId = comp.id;
        empPayload.companyId = comp.id;
      }
    } catch (e) {
      // ignore lookup errors; creation will proceed without companyId
    }
  }

  // Basic uniqueness checks
  if (empPayload.email) {
    const existingEmp = await db.employee.findUnique({ where: { email: empPayload.email } });
    if (existingEmp) {
      return NextResponse.json({ error: "Employee email already in use" }, { status: 409 });
    }
  }

  if (userPayload) {
    const existingUser = await db.user.findUnique({ where: { email: userPayload.email } });
    if (existingUser) {
      return NextResponse.json({ error: "User email already in use" }, { status: 409 });
    }
  }

  // If roleId provided for user, validate it
  let roleForUser: { id: string; name: string } | null = null;
  if (userPayload?.roleId) {
    const r = await db.role.findUnique({ where: { id: userPayload.roleId } });
    if (!r) {
      return NextResponse.json({ error: "Invalid roleId" }, { status: 400 });
    }
    roleForUser = { id: r.id, name: r.name };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      let createdUser = null;

      if (userPayload) {
        const hashed = await hash(userPayload.password, 12);

        const userCreateData: any = {
          name: empPayload.name,
          email: userPayload.email,
          password: hashed
        };

        if (userPayload.roleId) {
          userCreateData.userRoles = { create: { roleId: userPayload.roleId } };
        }

        createdUser = await tx.user.create({ data: userCreateData });
      }

      // If roleTitle not provided, and roleForUser present, use role name
      const roleTitle = empPayload.roleTitle ?? roleForUser?.name ?? null;

      const employeeCreateData: any = {
        name: empPayload.name,
        roleTitle: roleTitle,
        phone: empPayload.phone,
        companyId: empPayload.companyId,
        // optional extended fields
        prefix: empPayload.prefix,
        firstName: empPayload.firstName,
        lastName: empPayload.lastName,
        employeeCode: empPayload.employeeCode,
        addressLine: empPayload.addressLine,
        responsibilityArea: empPayload.responsibilityArea,
        status: empPayload.status,
        // store relation ids if provided
        positionId: empPayload.positionId ?? empPayload.position ?? undefined,
        departmentId: empPayload.departmentId ?? empPayload.department ?? undefined,
        // if frontend provided position/department objects instead of ids, you may
        // want to extract/display names here. Keep empty for now.
      };

      if (empPayload.email) employeeCreateData.email = empPayload.email;
      if (empPayload.birthDate) {
        // attempt to parse ISO date strings
        try {
          const d = new Date(empPayload.birthDate);
          if (!isNaN(d.getTime())) employeeCreateData.birthDate = d;
        } catch (e) {
          // ignore invalid date
        }
      }

      if (empPayload.address) {
        if (empPayload.address.province) employeeCreateData.province = empPayload.address.province;
        if (empPayload.address.district) employeeCreateData.district = empPayload.address.district;
          if (empPayload.address.subdistrict) employeeCreateData.subdistrict = empPayload.address.subdistrict;
          if (typeof empPayload.address.postalCode !== "undefined" && empPayload.address.postalCode !== null) {
            employeeCreateData.postalCode = String(empPayload.address.postalCode);
          }
      }
      if (createdUser) employeeCreateData.userId = createdUser.id;

      const createdEmployee = await tx.employee.create({ data: employeeCreateData });

      return { user: createdUser, employee: createdEmployee };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
