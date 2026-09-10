import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedActivityRBAC } from "./activity-rbac";

export async function seedWorkflowTestUsers(prisma: PrismaClient) {
  console.log("👥 Seeding Workflow Test Users & Hierarchy...");

  // 0. Ensure Activity RBAC Master Data exists (Permissions, Roles & Mappings)
  await seedActivityRBAC(prisma);

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Departments
  const salesDept = await prisma.department.upsert({
    where: { code: "SA" },
    update: {},
    create: { name: "แผนกบริหารงานขาย", code: "SA" },
  });

  const mktDept = await prisma.department.upsert({
    where: { code: "MKT" },
    update: { name: "แผนกการตลาด" },
    create: { name: "แผนกการตลาด", code: "MKT" },
  });

  // 2. Positions
  const posPromoter = await prisma.position.upsert({
    where: { id: "pos_test_promoter" },
    update: { name: "พนักงานส่งเสริมการขาย", level: 1, isManagerial: false, departmentId: salesDept.id },
    create: { id: "pos_test_promoter", name: "พนักงานส่งเสริมการขาย", level: 1, isManagerial: false, departmentId: salesDept.id },
  });

  const posSales = await prisma.position.upsert({
    where: { id: "pos_test_sales" },
    update: { name: "พนักงานขาย", level: 1, isManagerial: false, departmentId: salesDept.id },
    create: { id: "pos_test_sales", name: "พนักงานขาย", level: 1, isManagerial: false, departmentId: salesDept.id },
  });

  const posDistrictMgr = await prisma.position.upsert({
    where: { id: "pos_test_districtmgr" },
    update: { name: "ผู้จัดการเขต", level: 2, isManagerial: true, departmentId: salesDept.id },
    create: { id: "pos_test_districtmgr", name: "ผู้จัดการเขต", level: 2, isManagerial: true, departmentId: salesDept.id },
  });

  const posAreaMgr = await prisma.position.upsert({
    where: { id: "pos_test_areamgr" },
    update: { name: "ผู้จัดการภาค", level: 2, isManagerial: true, departmentId: salesDept.id },
    create: { id: "pos_test_areamgr", name: "ผู้จัดการภาค", level: 2, isManagerial: true, departmentId: salesDept.id },
  });

  const posSalesAdmin = await prisma.position.upsert({
    where: { id: "pos_test_salesadmin" },
    update: { name: "ผู้จัดการแผนกบริหารงานขาย", level: 3, isManagerial: true, departmentId: salesDept.id },
    create: { id: "pos_test_salesadmin", name: "ผู้จัดการแผนกบริหารงานขาย", level: 3, isManagerial: true, departmentId: salesDept.id },
  });

  const posMktMgr = await prisma.position.upsert({
    where: { id: "pos_test_mktmgr" },
    update: { name: "ผู้จัดการแผนกการตลาด", level: 3, isManagerial: true, departmentId: mktDept.id },
    create: { id: "pos_test_mktmgr", name: "ผู้จัดการแผนกการตลาด", level: 3, isManagerial: true, departmentId: mktDept.id },
  });

  const posSalesDirector = await prisma.position.upsert({
    where: { id: "pos_test_salesdir" },
    update: { name: "ผู้จัดการฝ่ายขาย", level: 4, isManagerial: true, departmentId: salesDept.id },
    create: { id: "pos_test_salesdir", name: "ผู้จัดการฝ่ายขาย", level: 4, isManagerial: true, departmentId: salesDept.id },
  });

  const posMktStaff = await prisma.position.upsert({
    where: { id: "pos_test_mktstaff" },
    update: { name: "พนักงานการตลาด", level: 1, isManagerial: false, departmentId: mktDept.id },
    create: { id: "pos_test_mktstaff", name: "พนักงานการตลาด", level: 1, isManagerial: false, departmentId: mktDept.id },
  });

  // 3. Create Users
  const getOrCreateUser = async (email: string, name: string) => {
    return prisma.user.upsert({
      where: { email },
      update: { name },
      create: {
        email,
        name,
        password: passwordHash,
        isActive: true,
      },
    });
  };

  const uSalesAdmin = await getOrCreateUser("test.salesadmin@crm.local", "สมคิด บริหารงานขาย (ผจก.แผนก SA)");
  const uMktMgr = await getOrCreateUser("test.mktmgr@crm.local", "วิภา การตลาด (ผจก.แผนก MKT)");
  const uSalesDir = await getOrCreateUser("test.salesdir@crm.local", "ธนพล ฝ่ายขาย (ผจก.ฝ่ายขาย)");
  const uAreaMgr = await getOrCreateUser("test.areamgr@crm.local", "เกรียงไกร จัดการภาค (ผจก.ภาค)");
  const uDistrictMgr = await getOrCreateUser("test.districtmgr@crm.local", "อภิสิทธิ์ จัดการเขต (ผจก.เขต)");
  const uSales = await getOrCreateUser("test.sales@crm.local", "กิตติพงษ์ ขายเก่ง (พนักงานขาย)");
  const uPromoter = await getOrCreateUser("test.promoter@crm.local", "สุดา ส่งเสริม (พนักงานส่งเสริมการขาย)");
  const uMktStaff = await getOrCreateUser("test.mktstaff@crm.local", "นที ช่วยการตลาด (พนักงานการตลาด)");

  // 4. Create Employees & Wire Hierarchy (Top-down)
  // Top: Sales Director & Managers
  const empSalesDir = await prisma.employee.upsert({
    where: { email: uSalesDir.email },
    update: { name: uSalesDir.name, positionId: posSalesDirector.id, departmentId: salesDept.id, positionTitle: posSalesDirector.name, departmentName: salesDept.name },
    create: {
      email: uSalesDir.email,
      name: uSalesDir.name,
      userId: uSalesDir.id,
      positionId: posSalesDirector.id,
      departmentId: salesDept.id,
      positionTitle: posSalesDirector.name,
      departmentName: salesDept.name,
    },
  });

  const empSalesAdmin = await prisma.employee.upsert({
    where: { email: uSalesAdmin.email },
    update: { name: uSalesAdmin.name, positionId: posSalesAdmin.id, departmentId: salesDept.id, positionTitle: posSalesAdmin.name, departmentName: salesDept.name, managerId: empSalesDir.id },
    create: {
      email: uSalesAdmin.email,
      name: uSalesAdmin.name,
      userId: uSalesAdmin.id,
      positionId: posSalesAdmin.id,
      departmentId: salesDept.id,
      positionTitle: posSalesAdmin.name,
      departmentName: salesDept.name,
      managerId: empSalesDir.id,
    },
  });

  const empMktMgr = await prisma.employee.upsert({
    where: { email: uMktMgr.email },
    update: { name: uMktMgr.name, positionId: posMktMgr.id, departmentId: mktDept.id, positionTitle: posMktMgr.name, departmentName: mktDept.name, managerId: empSalesDir.id },
    create: {
      email: uMktMgr.email,
      name: uMktMgr.name,
      userId: uMktMgr.id,
      positionId: posMktMgr.id,
      departmentId: mktDept.id,
      positionTitle: posMktMgr.name,
      departmentName: mktDept.name,
      managerId: empSalesDir.id,
    },
  });

  // Middle: Area Manager -> reports to Sales Admin Manager
  const empAreaMgr = await prisma.employee.upsert({
    where: { email: uAreaMgr.email },
    update: { name: uAreaMgr.name, positionId: posAreaMgr.id, departmentId: salesDept.id, positionTitle: posAreaMgr.name, departmentName: salesDept.name, managerId: empSalesAdmin.id },
    create: {
      email: uAreaMgr.email,
      name: uAreaMgr.name,
      userId: uAreaMgr.id,
      positionId: posAreaMgr.id,
      departmentId: salesDept.id,
      positionTitle: posAreaMgr.name,
      departmentName: salesDept.name,
      managerId: empSalesAdmin.id,
    },
  });

  // District Manager -> reports to Area Manager (Section 8 Case 1)
  const empDistrictMgr = await prisma.employee.upsert({
    where: { email: uDistrictMgr.email },
    update: {
      name: uDistrictMgr.name,
      positionId: posDistrictMgr.id,
      departmentId: salesDept.id,
      positionTitle: posDistrictMgr.name,
      departmentName: salesDept.name,
      managerId: empAreaMgr.id,
    },
    create: {
      email: uDistrictMgr.email,
      name: uDistrictMgr.name,
      userId: uDistrictMgr.id,
      positionId: posDistrictMgr.id,
      departmentId: salesDept.id,
      positionTitle: posDistrictMgr.name,
      departmentName: salesDept.name,
      managerId: empAreaMgr.id,
    },
  });

  // Operational: Salesperson -> reports to Area Manager
  const empSales = await prisma.employee.upsert({
    where: { email: uSales.email },
    update: { name: uSales.name, positionId: posSales.id, departmentId: salesDept.id, positionTitle: posSales.name, departmentName: salesDept.name, managerId: empAreaMgr.id },
    create: {
      email: uSales.email,
      name: uSales.name,
      userId: uSales.id,
      positionId: posSales.id,
      departmentId: salesDept.id,
      positionTitle: posSales.name,
      departmentName: salesDept.name,
      managerId: empAreaMgr.id,
    },
  });

  // Operational: Promoter -> reports to Salesperson
  const empPromoter = await prisma.employee.upsert({
    where: { email: uPromoter.email },
    update: { name: uPromoter.name, positionId: posPromoter.id, departmentId: salesDept.id, positionTitle: posPromoter.name, departmentName: salesDept.name, managerId: empSales.id },
    create: {
      email: uPromoter.email,
      name: uPromoter.name,
      userId: uPromoter.id,
      positionId: posPromoter.id,
      departmentId: salesDept.id,
      positionTitle: posPromoter.name,
      departmentName: salesDept.name,
      managerId: empSales.id,
    },
  });

  // Operational: Marketing Staff -> reports to Marketing Manager
  const empMktStaff = await prisma.employee.upsert({
    where: { email: uMktStaff.email },
    update: { name: uMktStaff.name, positionId: posMktStaff.id, departmentId: mktDept.id, positionTitle: posMktStaff.name, departmentName: mktDept.name, managerId: empMktMgr.id },
    create: {
      email: uMktStaff.email,
      name: uMktStaff.name,
      userId: uMktStaff.id,
      positionId: posMktStaff.id,
      departmentId: mktDept.id,
      positionTitle: posMktStaff.name,
      departmentName: mktDept.name,
      managerId: empMktMgr.id,
    },
  });

  // 5. Link Users to Existing Roles in Database (Idempotent via userRole.upsert)
  const rolePromoter = await prisma.role.findUnique({ where: { slug: "sales_promotion" } });
  const roleActivityPlanUser = await prisma.role.findUnique({ where: { slug: "activity_plan_user" } });
  const roleSales = await prisma.role.findUnique({ where: { slug: "sales_employee" } });
  const roleSalesManager = await prisma.role.findUnique({ where: { slug: "sales_manager" } });
  const roleMktManager = await prisma.role.findUnique({ where: { slug: "marketing_manager" } });
  const roleMktStaff = await prisma.role.findUnique({ where: { slug: "employee_mk" } });

  // 7 Activity Roles
  const roleActPromoter = await prisma.role.findUnique({ where: { slug: "activity_promoter" } });
  const roleActSales = await prisma.role.findUnique({ where: { slug: "activity_sales_employee" } });
  const roleActAreaMgr = await prisma.role.findUnique({ where: { slug: "activity_area_manager" } });
  const roleActDistrictMgr = await prisma.role.findUnique({ where: { slug: "activity_district_manager" } });
  const roleActSalesAdmin = await prisma.role.findUnique({ where: { slug: "activity_sales_admin_manager" } });
  const roleActMktMgr = await prisma.role.findUnique({ where: { slug: "activity_marketing_manager" } });
  const roleActSalesDir = await prisma.role.findUnique({ where: { slug: "activity_sales_director" } });

  const assignUserRole = async (userId: string, roleId?: string) => {
    if (!roleId) return;
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
      update: {
        deletedAt: null,
      },
      create: {
        userId,
        roleId,
      },
    });
  };

  // 5.1 Assign Legacy Roles (100% Preserved)
  await assignUserRole(uPromoter.id, rolePromoter?.id);
  await assignUserRole(uPromoter.id, roleActivityPlanUser?.id);
  await assignUserRole(uSales.id, roleSales?.id);
  await assignUserRole(uAreaMgr.id, roleSalesManager?.id);
  await assignUserRole(uDistrictMgr.id, roleSalesManager?.id);
  await assignUserRole(uSalesAdmin.id, roleSalesManager?.id);
  await assignUserRole(uMktMgr.id, roleMktManager?.id);
  await assignUserRole(uSalesDir.id, roleSalesManager?.id);
  await assignUserRole(uMktStaff.id, roleMktStaff?.id);

  // 5.2 Assign New Activity Roles (Multi-role Assignment)
  await assignUserRole(uPromoter.id, roleActPromoter?.id);
  await assignUserRole(uSales.id, roleActSales?.id);
  await assignUserRole(uAreaMgr.id, roleActAreaMgr?.id);
  await assignUserRole(uDistrictMgr.id, roleActDistrictMgr?.id);
  await assignUserRole(uSalesAdmin.id, roleActSalesAdmin?.id);
  await assignUserRole(uMktMgr.id, roleActMktMgr?.id);
  await assignUserRole(uSalesDir.id, roleActSalesDir?.id);
  // Note: uMktStaff remains employee_mk (specification has no dedicated Activity Role for Marketing Staff)

  // 6. Assign Permission Overrides for Activity Testing (Idempotent via userPermissionOverride.upsert)
  const allPermissions = await prisma.permission.findMany({
    where: {
      key: {
        in: [
          "menu.test_activity",
          "menu.activity_plans",
          "activity.view",
          "activity.approve",
          "activity.create",
          "activity.edit",
          "data.activity_plans",
        ],
      },
    },
  });
  const permMap = Object.fromEntries(allPermissions.map((p) => [p.key, p]));

  const setOverride = async (
    userId: string,
    key: string,
    allow: boolean = true,
    dataAccess?: any,
  ) => {
    const perm = permMap[key];
    if (!perm) return;
    await prisma.userPermissionOverride.upsert({
      where: {
        userId_permissionId: {
          userId,
          permissionId: perm.id,
        },
      },
      update: {
        allow,
        dataAccess: dataAccess || (perm.category === "DATA" ? "VIEW_ALL" : null),
        deletedAt: null,
      },
      create: {
        userId,
        permissionId: perm.id,
        allow,
        dataAccess: dataAccess || (perm.category === "DATA" ? "VIEW_ALL" : null),
        reason: "Activity Workflow Testing",
      },
    });
  };

  // Approver permissions: menu + view + approve + data (strictly NO create/edit)
  const approverKeys = ["menu.test_activity", "menu.activity_plans", "activity.view", "activity.approve", "data.activity_plans"];
  for (const key of approverKeys) {
    await setOverride(uSales.id, key);
    await setOverride(uDistrictMgr.id, key);
    await setOverride(uAreaMgr.id, key);
    await setOverride(uSalesAdmin.id, key);
    await setOverride(uMktMgr.id, key);
    await setOverride(uSalesDir.id, key);
  }

  // Marketing Staff (Helper): menu + view + data (NO approve, NO create, NO edit)
  const helperKeys = ["menu.test_activity", "menu.activity_plans", "activity.view", "data.activity_plans"];
  for (const key of helperKeys) {
    await setOverride(uMktStaff.id, key, true, "VIEW_OWN");
  }

  console.log("✅ Workflow Test Users & Hierarchy seeded successfully:");
  console.log("   1. Promoter:     test.promoter@crm.local   -> Roles: sales_promotion, activity_plan_user, activity_promoter");
  console.log("   2. Sales:        test.sales@crm.local      -> Roles: sales_employee, activity_sales_employee");
  console.log("   3. District Mgr: test.districtmgr@crm.local-> Roles: sales_manager, activity_district_manager");
  console.log("   4. Area Mgr:     test.areamgr@crm.local    -> Roles: sales_manager, activity_area_manager");
  console.log("   5. Sales Admin:  test.salesadmin@crm.local -> Roles: sales_manager, activity_sales_admin_manager");
  console.log("   6. MKT Mgr:      test.mktmgr@crm.local     -> Roles: marketing_manager, activity_marketing_manager");
  console.log("   7. Sales Dir:    test.salesdir@crm.local   -> Roles: sales_manager, activity_sales_director");
  console.log("   8. MKT Staff:    test.mktstaff@crm.local   -> Roles: employee_mk + Helper Overrides");

  return {
    users: { uPromoter, uSales, uDistrictMgr, uAreaMgr, uSalesAdmin, uMktMgr, uSalesDir, uMktStaff },
    employees: { empPromoter, empSales, empDistrictMgr, empAreaMgr, empSalesAdmin, empMktMgr, empSalesDir, empMktStaff },
  };
}

// Standalone execution entrypoint
if (process.argv[1]?.includes("workflow-test-users")) {
  const { db } = require("../../../lib/db");
  seedWorkflowTestUsers(db)
    .then(async () => {
      await db.$disconnect();
    })
    .catch(async (error: any) => {
      console.error("❌ Workflow Test Users Seed failed:", error);
      await db.$disconnect();
      process.exit(1);
    });
}
