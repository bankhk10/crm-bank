import { db } from "@/lib/db";

export interface UnifiedWithdrawalItem {
  id: string;
  itemType: "PRODUCT" | "MEDIA";
  name: string; // Product name or Material name
  codeOrCategory: string; // Product code or Material category
  detail?: string; // Target plot / store name or Unit price
  quantity: number;
  unit: string;
  totalAmount?: number; // for media items
  planId: string;
  planCode: string;
  planTitle: string;
  startDate: Date | string;
  endDate: Date | string;
  planStatus: string;
  productWithdrawalApproved?: boolean | null;
  employeeId: string;
  employeeName: string;
  employeeCode?: string;
  positionTitle?: string;
  departmentName?: string;
}

export interface EmployeeWithdrawalGroup {
  employeeId: string;
  employeeName: string;
  employeeCode?: string;
  positionTitle?: string;
  departmentName?: string;
  planCount: number;
  productItemCount: number;
  mediaItemCount: number;
  totalItemCount: number;
  totalMediaAmount: number;
  items: UnifiedWithdrawalItem[];
}

export interface ActivityWithdrawalSummary {
  totalEmployees: number;
  totalPlans: number;
  totalProductItems: number;
  totalMediaItems: number;
  totalMediaAmount: number;
}

export interface ListActivityWithdrawalsParams {
  itemType?: "ALL" | "PRODUCT" | "MEDIA";
  fiscalYear?: number;
  fiscalMonth?: number;
  employeeId?: string;
  status?: string;
  q?: string;
}

export async function findActivityWithdrawals(params: ListActivityWithdrawalsParams = {}) {
  const {
    itemType = "ALL",
    fiscalYear,
    fiscalMonth,
    employeeId,
    status,
    q,
  } = params;

  const searchQuery = q?.trim() || "";

  // Common plan condition
  const planCondition: any = {
    deletedAt: null,
  };
  if (fiscalYear) {
    planCondition.fiscalYear = fiscalYear;
  }
  if (fiscalMonth) {
    planCondition.fiscalMonth = fiscalMonth;
  }
  if (employeeId) {
    planCondition.employeeId = employeeId;
  }
  if (status && status !== "ALL") {
    planCondition.status = status;
  }

  const items: UnifiedWithdrawalItem[] = [];

  // 1. Fetch Media Items (ActivityPlanMarketingItem)
  if (itemType === "ALL" || itemType === "MEDIA") {
    const mediaWhere: any = {
      activityPlan: planCondition,
    };

    if (searchQuery) {
      mediaWhere.OR = [
        { materialName: { contains: searchQuery, mode: "insensitive" } },
        { category: { contains: searchQuery, mode: "insensitive" } },
        { activityPlan: { code: { contains: searchQuery, mode: "insensitive" } } },
        { activityPlan: { title: { contains: searchQuery, mode: "insensitive" } } },
        { activityPlan: { employee: { name: { contains: searchQuery, mode: "insensitive" } } } },
      ];
    }

    const marketingItems = await db.activityPlanMarketingItem.findMany({
      where: mediaWhere,
      include: {
        activityPlan: {
          select: {
            id: true,
            code: true,
            title: true,
            status: true,
            startDate: true,
            endDate: true,
            employee: {
              select: {
                id: true,
                name: true,
                employeeCode: true,
                position: { select: { name: true } },
                department: { select: { name: true } },
                positionTitle: true,
                departmentName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    for (const m of marketingItems) {
      const plan = m.activityPlan;
      const emp = plan.employee;
      const unitPrice = m.unitPrice ? Number(m.unitPrice) : 0;

      items.push({
        id: `media-${m.id}`,
        itemType: "MEDIA",
        name: m.materialName,
        codeOrCategory: m.category,
        detail: unitPrice > 0 ? `@ ฿${unitPrice.toLocaleString()}` : undefined,
        quantity: m.quantity || 1,
        unit: m.unit || "ชิ้น",
        totalAmount: Number(m.totalAmount || unitPrice * (m.quantity || 1)),
        planId: plan.id,
        planCode: plan.code || plan.id.slice(0, 8),
        planTitle: plan.title,
        startDate: plan.startDate,
        endDate: plan.endDate,
        planStatus: plan.status,
        employeeId: emp.id,
        employeeName: emp.name,
        employeeCode: emp.employeeCode || "",
        positionTitle: emp.position?.name || emp.positionTitle || "",
        departmentName: emp.department?.name || emp.departmentName || "",
      });
    }
  }

  // 2. Fetch Product Items (Type 7A, 7B, 13, 14)
  if (itemType === "ALL" || itemType === "PRODUCT") {
    const productWhere: any = {
      activityPlan: planCondition,
    };

    if (searchQuery) {
      productWhere.OR = [
        { productName: { contains: searchQuery, mode: "insensitive" } },
        { product: { name: { contains: searchQuery, mode: "insensitive" } } },
        { product: { productCode: { contains: searchQuery, mode: "insensitive" } } },
        { activityPlan: { code: { contains: searchQuery, mode: "insensitive" } } },
        { activityPlan: { title: { contains: searchQuery, mode: "insensitive" } } },
        { activityPlan: { employee: { name: { contains: searchQuery, mode: "insensitive" } } } },
      ];
    }

    const planSelect = {
      id: true,
      code: true,
      title: true,
      status: true,
      startDate: true,
      endDate: true,
      productWithdrawalApproved: true,
      employee: {
        select: {
          id: true,
          name: true,
          employeeCode: true,
          position: { select: { name: true } },
          department: { select: { name: true } },
          positionTitle: true,
          departmentName: true,
        },
      },
    };

    // Query 7A, 7B, 13, 14 in parallel
    const [t7aList, t7bList, t13List, t14List] = await Promise.all([
      db.activityPlanType7aProduct.findMany({
        where: productWhere,
        include: {
          product: { select: { id: true, name: true, productCode: true, unit: true } },
          target: {
            select: {
              plotName: true,
              dealerName: true,
              store: { select: { name: true } },
            },
          },
          activityPlan: { select: planSelect },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.activityPlanType7bProduct.findMany({
        where: productWhere,
        include: {
          product: { select: { id: true, name: true, productCode: true, unit: true } },
          target: {
            select: {
              plotName: true,
              ownerName: true,
              dealerName: true,
              type7aTarget: {
                select: {
                  plotName: true,
                  dealerName: true,
                  store: { select: { name: true } },
                },
              },
            },
          },
          activityPlan: { select: planSelect },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.activityPlanType13Product.findMany({
        where: productWhere,
        include: {
          product: { select: { id: true, name: true, productCode: true, unit: true } },
          target: {
            select: {
              ownerName: true,
              dealerName: true,
              store: { select: { name: true } },
            },
          },
          activityPlan: { select: planSelect },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.activityPlanType14Product.findMany({
        where: productWhere,
        include: {
          product: { select: { id: true, name: true, productCode: true, unit: true } },
          target: {
            select: {
              plotName: true,
              ownerName: true,
              store: { select: { name: true } },
            },
          },
          activityPlan: { select: planSelect },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Map 7A
    for (const p of t7aList) {
      const plan = p.activityPlan;
      const emp = plan.employee;
      const t = p.target;
      const targetDetail = t
        ? `[TYPE 7A] แปลง ${t.plotName || ""}${t.dealerName ? ` (${t.dealerName})` : ""}${t.store?.name ? ` • ร้าน ${t.store.name}` : ""}`.trim()
        : "[TYPE 7A] แปลงสาธิต";

      items.push({
        id: `prod-7a-${p.id}`,
        itemType: "PRODUCT",
        name: p.product?.name || p.productName || "สินค้าไม่ระบุชื่อ",
        codeOrCategory: p.product?.productCode || "PRD",
        detail: targetDetail,
        quantity: Number(p.quantity || 1),
        unit: p.unit || p.product?.unit || "หน่วย",
        planId: plan.id,
        planCode: plan.code || plan.id.slice(0, 8),
        planTitle: plan.title,
        startDate: plan.startDate,
        endDate: plan.endDate,
        planStatus: plan.status,
        productWithdrawalApproved: plan.productWithdrawalApproved,
        employeeId: emp.id,
        employeeName: emp.name,
        employeeCode: emp.employeeCode || "",
        positionTitle: emp.position?.name || emp.positionTitle || "",
        departmentName: emp.department?.name || emp.departmentName || "",
      });
    }

    // Map 7B
    for (const p of t7bList) {
      const plan = p.activityPlan;
      const emp = plan.employee;
      const t = p.target;
      const ref7a = t?.type7aTarget;
      const plotName = t?.plotName || ref7a?.plotName || "";
      const ownerName = t?.ownerName || t?.dealerName || ref7a?.dealerName || "";
      const targetDetail = (plotName || ownerName)
        ? `[TYPE 7B] ติดตามแปลง ${plotName}${ownerName ? ` (${ownerName})` : ""}`.trim()
        : "[TYPE 7B] ติดตามแปลงสาธิต";

      items.push({
        id: `prod-7b-${p.id}`,
        itemType: "PRODUCT",
        name: p.product?.name || p.productName || "สินค้าไม่ระบุชื่อ",
        codeOrCategory: p.product?.productCode || "PRD",
        detail: targetDetail,
        quantity: Number(p.quantity || 1),
        unit: p.unit || p.product?.unit || "หน่วย",
        planId: plan.id,
        planCode: plan.code || plan.id.slice(0, 8),
        planTitle: plan.title,
        startDate: plan.startDate,
        endDate: plan.endDate,
        planStatus: plan.status,
        productWithdrawalApproved: plan.productWithdrawalApproved,
        employeeId: emp.id,
        employeeName: emp.name,
        employeeCode: emp.employeeCode || "",
        positionTitle: emp.position?.name || emp.positionTitle || "",
        departmentName: emp.department?.name || emp.departmentName || "",
      });
    }

    // Map 13
    for (const p of t13List) {
      const plan = p.activityPlan;
      const emp = plan.employee;
      const t = p.target;
      const targetDetail = t
        ? `[TYPE 13] แปลงฉีดพ่น${t.ownerName ? ` (คุณ${t.ownerName})` : ""}${t.store?.name ? ` • ร้าน ${t.store.name}` : ""}`.trim()
        : "[TYPE 13] แปลงฉีดพ่นสาร";

      items.push({
        id: `prod-13-${p.id}`,
        itemType: "PRODUCT",
        name: p.product?.name || p.productName || "สินค้าไม่ระบุชื่อ",
        codeOrCategory: p.product?.productCode || "PRD",
        detail: targetDetail,
        quantity: Number(p.quantity || 1),
        unit: p.unit || p.product?.unit || "หน่วย",
        planId: plan.id,
        planCode: plan.code || plan.id.slice(0, 8),
        planTitle: plan.title,
        startDate: plan.startDate,
        endDate: plan.endDate,
        planStatus: plan.status,
        productWithdrawalApproved: plan.productWithdrawalApproved,
        employeeId: emp.id,
        employeeName: emp.name,
        employeeCode: emp.employeeCode || "",
        positionTitle: emp.position?.name || emp.positionTitle || "",
        departmentName: emp.department?.name || emp.departmentName || "",
      });
    }

    // Map 14
    for (const p of t14List) {
      const plan = p.activityPlan;
      const emp = plan.employee;
      const t = p.target;
      const targetDetail = t
        ? `[TYPE 14] ติดตามฉีดพ่น${t.ownerName ? ` (คุณ${t.ownerName})` : ""}${t.plotName ? ` แปลง ${t.plotName}` : ""}`.trim()
        : "[TYPE 14] ติดตามแปลงฉีดพ่น";

      items.push({
        id: `prod-14-${p.id}`,
        itemType: "PRODUCT",
        name: p.product?.name || p.productName || "สินค้าไม่ระบุชื่อ",
        codeOrCategory: p.product?.productCode || "PRD",
        detail: targetDetail,
        quantity: Number(p.quantity || 1),
        unit: p.unit || p.product?.unit || "หน่วย",
        planId: plan.id,
        planCode: plan.code || plan.id.slice(0, 8),
        planTitle: plan.title,
        startDate: plan.startDate,
        endDate: plan.endDate,
        planStatus: plan.status,
        productWithdrawalApproved: plan.productWithdrawalApproved,
        employeeId: emp.id,
        employeeName: emp.name,
        employeeCode: emp.employeeCode || "",
        positionTitle: emp.position?.name || emp.positionTitle || "",
        departmentName: emp.department?.name || emp.departmentName || "",
      });
    }
  }

  // 3. Sort items by startDate descending
  items.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  // 4. Group by Employee
  const employeeMap = new Map<string, EmployeeWithdrawalGroup & { planIds: Set<string> }>();
  const allPlanIds = new Set<string>();
  let totalProductItems = 0;
  let totalMediaItems = 0;
  let totalMediaAmount = 0;

  for (const item of items) {
    allPlanIds.add(item.planId);

    if (item.itemType === "PRODUCT") {
      totalProductItems++;
    } else {
      totalMediaItems++;
      totalMediaAmount += item.totalAmount || 0;
    }

    let group = employeeMap.get(item.employeeId);
    if (!group) {
      group = {
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        employeeCode: item.employeeCode,
        positionTitle: item.positionTitle,
        departmentName: item.departmentName,
        planCount: 0,
        productItemCount: 0,
        mediaItemCount: 0,
        totalItemCount: 0,
        totalMediaAmount: 0,
        planIds: new Set<string>(),
        items: [],
      };
      employeeMap.set(item.employeeId, group);
    }

    group.planIds.add(item.planId);
    group.items.push(item);
    group.totalItemCount++;

    if (item.itemType === "PRODUCT") {
      group.productItemCount++;
    } else {
      group.mediaItemCount++;
      group.totalMediaAmount += item.totalAmount || 0;
    }
  }

  const employeeGroups: EmployeeWithdrawalGroup[] = Array.from(employeeMap.values())
    .map(({ planIds, ...rest }) => ({
      ...rest,
      planCount: planIds.size,
    }))
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName, "th"));

  const summary: ActivityWithdrawalSummary = {
    totalEmployees: employeeGroups.length,
    totalPlans: allPlanIds.size,
    totalProductItems,
    totalMediaItems,
    totalMediaAmount,
  };

  return {
    summary,
    employeeGroups,
    totalItems: items.length,
  };
}
