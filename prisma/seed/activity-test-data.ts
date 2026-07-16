import { PrismaClient, ActivityStatus } from "@prisma/client";
import { hash } from "bcryptjs";

export async function seedActivityTestData(prisma: PrismaClient) {
  console.log("🏃 Seeding Activity Flow Test Data (Employees, Users, Manager Chain, Permissions)...");

  // 1. Ensure required Permissions exist
  const permissionsToSeed = [
    { key: "menu.activity_plans", name: "เมนูการวางแผนกิจกรรม", action: "menu", category: "MENU" as const, resource: "activity_plan" },
    { key: "activity.create", name: "สร้างแผนกิจกรรม", action: "create", category: "ACTION" as const, resource: "activity_plan" },
    { key: "activity.edit", name: "แก้ไขแผนกิจกรรม", action: "edit", category: "ACTION" as const, resource: "activity_plan" },
    { key: "activity.delete", name: "ลบแผนกิจกรรม", action: "delete", category: "ACTION" as const, resource: "activity_plan" },
    { key: "activity.view", name: "ดูแผนกิจกรรม", action: "view", category: "ACTION" as const, resource: "activity_plan" },
    { key: "activity.approve", name: "อนุมัติแผนกิจกรรม", action: "approve", category: "ACTION" as const, resource: "activity_plan" },
    { key: "activity.manage", name: "จัดการแผนกิจกรรมทั้งหมด", action: "manage", category: "ACTION" as const, resource: "activity_plan" },
  ];

  for (const perm of permissionsToSeed) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {},
      create: perm,
    });
  }

  // 2. Fetch Departments
  const saDept = await prisma.department.findUnique({ where: { code: "SA" } });
  const mktDept = await prisma.department.findUnique({ where: { code: "MKT" } });

  if (!saDept || !mktDept) {
    throw new Error("SA or MKT Departments not found. Run seedMaster first.");
  }

  // 3. Create Positions
  const posData = [
    { name: "พนักงานฝ่ายขาย", level: 1, isManagerial: false, departmentId: saDept.id },
    { name: "ผู้จัดการเขตขาย", level: 2, isManagerial: true, departmentId: saDept.id },
    { name: "ผู้จัดการแผนกบริหารงานขาย", level: 3, isManagerial: true, departmentId: saDept.id },
    { name: "พนักงานการตลาด", level: 1, isManagerial: false, departmentId: mktDept.id },
    { name: "ผู้จัดการแผนกการตลาด", level: 3, isManagerial: true, departmentId: mktDept.id },
    { name: "ผู้จัดการฝ่ายขาย", level: 4, isManagerial: true, departmentId: saDept.id },
  ];

  const positions: Record<string, any> = {};
  for (const p of posData) {
    let existing = await prisma.position.findFirst({
      where: { name: p.name, departmentId: p.departmentId },
    });
    if (!existing) {
      existing = await prisma.position.create({
        data: {
          name: p.name,
          level: p.level,
          isManagerial: p.isManagerial,
          departmentId: p.departmentId,
        },
      });
    }
    positions[p.name] = existing;
  }

  // 4. Upsert Users and Employees
  const defaultPassword = await hash("b@b.com", 12);

  // Setup Role slugs helper
  const salesRepRole = await prisma.role.findUnique({ where: { slug: "sales-rep" } });
  const salesManagerRole = await prisma.role.findUnique({ where: { slug: "sales-manager" } });
  const salesAdminRole = await prisma.role.findUnique({ where: { slug: "sales-admin" } });

  const createTestUserAndEmployee = async (
    email: string,
    name: string,
    positionName: string,
    departmentId: string,
    roleId?: string,
    managerEmployeeId?: string | null
  ) => {
    // Upsert User
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: defaultPassword,
          departmentId,
          positionId: positions[positionName].id,
          userRoles: roleId ? { create: { roleId } } : undefined,
        },
      });
    }

    // Upsert Employee profile
    let employee = await prisma.employee.findUnique({ where: { email } });
    if (!employee) {
      employee = await prisma.employee.create({
        data: {
          name,
          email,
          userId: user.id,
          departmentId,
          positionId: positions[positionName].id,
          positionTitle: positionName,
          departmentName: departmentId === saDept.id ? "แผนกบริหารงานขาย" : "แผนกการตลาด",
          status: "ACTIVE",
          managerId: managerEmployeeId,
        },
      });
    } else if (managerEmployeeId !== undefined && employee.managerId !== managerEmployeeId) {
      employee = await prisma.employee.update({
        where: { id: employee.id },
        data: { managerId: managerEmployeeId },
      });
    }

    // Grant direct permission overrides to user so they can access the activity pages without failing
    const userPermissions = [
      "menu.activity_plans",
      "activity.view",
    ];

    if (positionName === "พนักงานฝ่ายขาย") {
      userPermissions.push("activity.create", "activity.edit", "activity.delete");
    } else if (positionName.includes("ผู้จัดการ") || positionName.includes("ฝ่ายขาย")) {
      userPermissions.push("activity.approve", "activity.create", "activity.edit");
    }

    for (const key of userPermissions) {
      const permObj = await prisma.permission.findUnique({ where: { key } });
      if (permObj) {
        const existOverride = await prisma.userPermissionOverride.findFirst({
          where: { userId: user.id, permissionId: permObj.id },
        });
        if (!existOverride) {
          await prisma.userPermissionOverride.create({
            data: {
              userId: user.id,
              permissionId: permObj.id,
              allow: true,
            },
          });
        }
      }
    }

    return employee;
  };

  // Create managers first in reverse order to set up manager chaining

  // 1. Sales Director (ວິໄຊ)
  const dirEmp = await createTestUserAndEmployee(
    "salesdirector@b.com",
    "วิชัย ฝ่ายขาย",
    "ผู้จัดการฝ่ายขาย",
    saDept.id,
    salesManagerRole?.id,
    null
  );

  // 2. Sales Admin Manager (สมหญิง)
  const saMgrEmp = await createTestUserAndEmployee(
    "salesadmin@b.com",
    "สมหญิง บริหารขาย",
    "ผู้จัดการแผนกบริหารงานขาย",
    saDept.id,
    salesAdminRole?.id,
    dirEmp.id
  );

  // 3. Marketing Manager (มานะ)
  const mktMgrEmp = await createTestUserAndEmployee(
    "marketing@b.com",
    "มานะ การตลาด",
    "ผู้จัดการแผนกการตลาด",
    mktDept.id,
    salesAdminRole?.id, // Marketing acts with sales-admin/manager roles
    dirEmp.id
  );

  // 4. Area Manager (สมเจตน์)
  const areaMgrEmp = await createTestUserAndEmployee(
    "area@b.com",
    "สมเจตน์ เขตขาย",
    "ผู้จัดการเขตขาย",
    saDept.id,
    salesManagerRole?.id,
    saMgrEmp.id
  );

  // 5. Salesperson Creator (สมชาย)
  const salespersonEmp = await createTestUserAndEmployee(
    "sales@b.com",
    "สมชาย ยอดเซลส์",
    "พนักงานฝ่ายขาย",
    saDept.id,
    salesRepRole?.id,
    areaMgrEmp.id
  );

  // 6. Helpers
  const helperSaEmp = await createTestUserAndEmployee(
    "helper_sa@b.com",
    "สมคิด ช่วยขาย",
    "พนักงานฝ่ายขาย",
    saDept.id,
    salesRepRole?.id,
    saMgrEmp.id
  );

  const helperMktEmp = await createTestUserAndEmployee(
    "helper_mkt@b.com",
    "มานพ ช่วยตลาด",
    "พนักงานการตลาด",
    mktDept.id,
    salesRepRole?.id,
    mktMgrEmp.id
  );

  console.log("✅ Seeding of Activity Flow Test Data completed.");
}
