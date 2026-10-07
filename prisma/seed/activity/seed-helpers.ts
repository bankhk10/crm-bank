import {
  PrismaClient,
  Prisma,
  ActivityStatus,
  ActivityHelperStatus,
  ActivityApprovalAction,
  ActivityApprovalStep,
  ActivityResultStatus,
  TourType,
  TourSize,
  AttachmentCategory,
  User,
  Employee,
  Customer,
  Product,
  ActivityType,
} from "@prisma/client";

export interface SeedContext {
  users: User[];
  adminUser: User;
  salesUser: User;
  employees: Employee[];
  primaryEmployee: Employee;
  managerEmployee: Employee;
  helperEmployees: Employee[];
  customers: Customer[];
  products: Product[];
  activityTypes: Record<string, ActivityType>;
}

export async function resolveSeedContext(prisma: PrismaClient): Promise<SeedContext> {
  // 1. Fetch Users
  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (users.length === 0) {
    throw new Error("No active users found in database. Please run core seed first.");
  }

  const adminUser = users.find((u) => u.email === "atthapol@gmail.com" || u.email === "b@b.com") || users[0];
  const salesUser = users.find((u) => u.email.includes("agforepax") || u.email.includes("intercrop")) || users[1] || users[0];

  // 2. Fetch Employees
  const employees = await prisma.employee.findMany({
    where: { deletedAt: null },
    include: { department: true },
    orderBy: { createdAt: "asc" },
  });

  if (employees.length === 0) {
    throw new Error("No active employees found in database. Please run core seed first.");
  }

  const primaryEmployee = employees[0];
  const managerEmployee = employees.find((e) => e.id !== primaryEmployee.id && e.managerId == null) || employees[1] || employees[0];
  const helperEmployees = employees.filter((e) => e.id !== primaryEmployee.id).slice(0, 5);

  // 3. Fetch Customers (Dealers, Subdealers, Farmers)
  const customers = await prisma.customer.findMany({
    where: { deletedAt: null },
    take: 20,
    orderBy: { createdAt: "asc" },
  });

  if (customers.length === 0) {
    throw new Error("No customers found in database. Please run core seed first.");
  }

  // 4. Fetch Products
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    take: 25,
    orderBy: { createdAt: "asc" },
  });

  if (products.length === 0) {
    throw new Error("No products found in database. Please run core seed first.");
  }

  // 5. Fetch Activity Types
  const typeList = await prisma.activityType.findMany({
    where: { isActive: true },
  });

  const activityTypes: Record<string, ActivityType> = {};
  for (const t of typeList) {
    activityTypes[t.code] = t;
  }

  return {
    users,
    adminUser,
    salesUser,
    employees,
    primaryEmployee,
    managerEmployee,
    helperEmployees: helperEmployees.length > 0 ? helperEmployees : [primaryEmployee],
    customers,
    products,
    activityTypes,
  };
}

export interface SeedPlanInput {
  code: string;
  title: string;
  primaryWorkTypeCode: string;
  workTypeCodes?: string[];
  startDate: Date;
  endDate: Date;
  province: string;
  district: string;
  location: string;
  objective: string;
  description?: string;
  notes?: string;
  salesPromotionBudgetRequested?: number;
  marketingBudgetRequested?: number;
  salesPromotionBudgetApproved?: number;
  marketingBudgetApproved?: number;
  status: ActivityStatus;
  employeeId: string;
  createdById: string;
  currentApproverEmployeeId?: string | null;
  submittedAt?: Date | null;
  approvedAt?: Date | null;
  rejectedAt?: Date | null;
  demoPlotId?: string | null;
  targetAttendeesCount?: number | null;
  targetBookingSales?: number | null;
  stores?: Array<{
    workTypeCode: string;
    storeId: string;
    storeName?: string | null;
    subDealerStore?: string | null;
    targetAmount?: number | null;
    notes?: string | null;
    remarks?: string | null;
  }>;
  products?: Array<{
    workTypeCode: string;
    storeId?: string | null;
    productId: string;
    productName?: string | null;
    targetQuantity?: number | null;
    masterPrice?: number | null;
    unitPrice?: number | null;
    targetAmount?: number | null;
    isPriceOverridden?: boolean;
    notes?: string | null;
  }>;
  marketingItems?: Array<{
    category?: string;
    marketingProductId?: string | null;
    materialName: string;
    unit?: string | null;
    unitPrice?: number;
    unitCost?: number;
    quantity: number;
    totalAmount?: number;
    totalCost?: number;
  }>;
  promotionItems?: Array<{
    detail?: string;
    promotionDetail?: string;
    budgetType?: string;
    amount?: number;
    requestedAmount?: number;
    approvedAmount?: number | null;
  }>;
  tour?: {
    tourType: TourType;
    tourSize?: TourSize | null;
    country?: string | null;
    storeId?: string | null;
    destination?: string | null;
  } | null;
  helpers?: Array<{
    employeeId: string;
    departmentId?: string | null;
    departmentName?: string | null;
    status: ActivityHelperStatus;
    approvedById?: string | null;
    approvedAt?: Date | null;
    respondedAt?: Date | null;
  }>;
  approvalLogs?: Array<{
    userId: string;
    action: ActivityApprovalAction;
    step: ActivityApprovalStep;
    fromStatus?: ActivityStatus | null;
    toStatus?: ActivityStatus | null;
    comment?: string | null;
    stepDurationSeconds?: number | null;
    createdAt?: Date;
  }>;
  actualResult?: {
    actualStartDate: Date;
    actualEndDate: Date;
    actualAttendeesCount?: number | null;
    resultStatus: ActivityResultStatus;
    resultSummary?: string | null;
    discussionResult?: string | null;
    productAdvice?: string | null;
    salesOpportunity?: string | null;
    problemFound?: string | null;
    nextAction?: string | null;
    nextMeetingDate?: Date | null;
    actualSalesPromotionSpent?: number | null;
    actualMarketingSpent?: number | null;
    salesResultAmount?: number | null;
    salesOrdersCount?: number | null;
    collectResultAmount?: number | null;
    demoPlotsCreated?: number | null;
    demoPlotsFollowedUp?: number | null;
    distributorsCount?: number | null;
    farmersCount?: number | null;
    recordedById: string;
    saleResults?: Array<{
      workTypeCode: string;
      storeId?: string | null;
      productId: string;
      productName?: string;
      actualQuantity: number;
      actualUnitPrice: number;
      actualTotal: number;
      unclosedReason?: string | null;
    }>;
    stockResults?: Array<{
      storeId: string;
      productId: string;
      remainingQuantity: number;
      stockStatus?: string | null;
      reorderOpportunity?: string | null;
      remarks?: string | null;
    }>;
    surveyResults?: Array<{
      storeId: string;
      productId?: string | null;
      competitorBrand: string;
      competitorProduct: string;
      competitorPrice?: number | null;
      competitorUnit?: string | null;
      promotionDetail?: string | null;
    }>;
    demoResults?: Array<{
      demoPlotId?: string | null;
      cropAgeValue?: string | null;
      cropAgeUnit?: string | null;
      growthStage?: string | null;
      cropCondition?: string | null;
      productResponse?: string | null;
      problemDescription?: string | null;
      finalYieldKg?: number | null;
      controlYieldKg?: number | null;
      satisfactionScore?: number | null;
    }>;
    attachments?: Array<{
      workTypeCode?: string | null;
      storeId?: string | null;
      productId?: string | null;
      category: AttachmentCategory;
      fileUrl: string;
      fileName: string;
      fileSize?: number | null;
      mimeType?: string | null;
    }>;
  } | null;
}

export async function upsertSeedPlan(prisma: PrismaClient, input: SeedPlanInput) {
  return prisma.$transaction(async (tx) => {
    // 1. Calculate fiscal and duration
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);
    const diffMs = Math.abs(end.getTime() - start.getTime());
    const durationDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1);
    const fiscalYear = start.getFullYear();
    const fiscalMonth = start.getMonth() + 1;
    const fiscalQuarter = Math.ceil(fiscalMonth / 3);

    const spReq = input.salesPromotionBudgetRequested ?? 0;
    const mktReq = input.marketingBudgetRequested ?? 0;
    const totalReq = spReq + mktReq;

    const spApp = input.salesPromotionBudgetApproved ?? null;
    const mktApp = input.marketingBudgetApproved ?? null;
    const totalApp = spApp != null || mktApp != null ? (spApp ?? 0) + (mktApp ?? 0) : null;

    // Resolve primary activity type
    const primaryType = await tx.activityType.findUnique({
      where: { code: input.primaryWorkTypeCode },
    });

    // Upsert main ActivityPlan
    const plan = await tx.activityPlan.upsert({
      where: { code: input.code },
      update: {
        title: input.title,
        activityTypeId: primaryType?.id ?? null,
        startDate: start,
        endDate: end,
        durationDays,
        fiscalYear,
        fiscalMonth,
        fiscalQuarter,
        province: input.province,
        district: input.district,
        location: input.location,
        objective: input.objective,
        description: input.description ?? null,
        notes: input.notes ?? null,
        salesPromotionBudgetRequested: spReq > 0 ? new Prisma.Decimal(spReq) : null,
        marketingBudgetRequested: mktReq > 0 ? new Prisma.Decimal(mktReq) : null,
        totalBudgetRequested: new Prisma.Decimal(totalReq),
        salesPromotionBudgetApproved: spApp != null ? new Prisma.Decimal(spApp) : null,
        marketingBudgetApproved: mktApp != null ? new Prisma.Decimal(mktApp) : null,
        totalBudgetApproved: totalApp != null ? new Prisma.Decimal(totalApp) : null,
        status: input.status,
        employeeId: input.employeeId,
        createdById: input.createdById,
        currentApproverEmployeeId: input.currentApproverEmployeeId ?? null,
        submittedAt: input.submittedAt ?? null,
        approvedAt: input.approvedAt ?? null,
        rejectedAt: input.rejectedAt ?? null,
        targetAttendeesCount: input.targetAttendeesCount ?? null,
        targetBookingSales: input.targetBookingSales != null ? new Prisma.Decimal(input.targetBookingSales) : null,
      },
      create: {
        code: input.code,
        title: input.title,
        activityTypeId: primaryType?.id ?? null,
        startDate: start,
        endDate: end,
        durationDays,
        fiscalYear,
        fiscalMonth,
        fiscalQuarter,
        province: input.province,
        district: input.district,
        location: input.location,
        objective: input.objective,
        description: input.description ?? null,
        notes: input.notes ?? null,
        salesPromotionBudgetRequested: spReq > 0 ? new Prisma.Decimal(spReq) : null,
        marketingBudgetRequested: mktReq > 0 ? new Prisma.Decimal(mktReq) : null,
        totalBudgetRequested: new Prisma.Decimal(totalReq),
        salesPromotionBudgetApproved: spApp != null ? new Prisma.Decimal(spApp) : null,
        marketingBudgetApproved: mktApp != null ? new Prisma.Decimal(mktApp) : null,
        totalBudgetApproved: totalApp != null ? new Prisma.Decimal(totalApp) : null,
        status: input.status,
        employeeId: input.employeeId,
        createdById: input.createdById,
        currentApproverEmployeeId: input.currentApproverEmployeeId ?? null,
        submittedAt: input.submittedAt ?? null,
        approvedAt: input.approvedAt ?? null,
        rejectedAt: input.rejectedAt ?? null,
        targetAttendeesCount: input.targetAttendeesCount ?? null,
        targetBookingSales: input.targetBookingSales != null ? new Prisma.Decimal(input.targetBookingSales) : null,
      },
    });

    // Clear previous sub-relations for this specific plan to ensure clean update
    await tx.activityPlanWorkType.deleteMany({ where: { activityPlanId: plan.id } });
    await tx.activityPlanStore.deleteMany({ where: { activityPlanId: plan.id } });
    await tx.activityPlanProduct.deleteMany({ where: { activityPlanId: plan.id } });
    await tx.activityPlanTour.deleteMany({ where: { activityPlanId: plan.id } });
    await tx.activityPlanMarketingItem.deleteMany({ where: { activityPlanId: plan.id } });
    await tx.activityPlanPromotionItem.deleteMany({ where: { activityPlanId: plan.id } });
    await tx.activityHelper.deleteMany({ where: { activityPlanId: plan.id } });
    await tx.activityApprovalLog.deleteMany({ where: { activityPlanId: plan.id } });
    await tx.activityResult.deleteMany({ where: { activityPlanId: plan.id } });
    await tx.activityAttachment.deleteMany({ where: { activityPlanId: plan.id } });

    // 2. Work Types Join Table
    const wtCodes = input.workTypeCodes && input.workTypeCodes.length > 0
      ? Array.from(new Set(input.workTypeCodes))
      : [input.primaryWorkTypeCode];

    for (const code of wtCodes) {
      const typeRecord = await tx.activityType.findUnique({ where: { code } });
      if (typeRecord) {
        await tx.activityPlanWorkType.create({
          data: {
            activityPlanId: plan.id,
            activityTypeId: typeRecord.id,
          },
        });
      }
    }

    // 3. Plan Stores
    if (input.stores && input.stores.length > 0) {
      await tx.activityPlanStore.createMany({
        data: input.stores.map((s) => ({
          activityPlanId: plan.id,
          workTypeCode: s.workTypeCode,
          storeId: s.storeId,
          storeName: s.storeName ?? null,
          subDealerStore: s.subDealerStore ?? null,
          targetAmount: s.targetAmount != null ? new Prisma.Decimal(s.targetAmount) : null,
          notes: s.notes ?? null,
          remarks: s.remarks ?? null,
        })),
      });
    }

    // 4. Plan Products
    if (input.products && input.products.length > 0) {
      await tx.activityPlanProduct.createMany({
        data: input.products.map((p) => {
          const qty = p.targetQuantity != null ? Number(p.targetQuantity) : null;
          const uPrice = p.unitPrice != null ? Number(p.unitPrice) : null;
          const mPrice = p.masterPrice != null ? Number(p.masterPrice) : uPrice;
          const totalAmt =
            p.targetAmount != null
              ? Number(p.targetAmount)
              : qty != null && uPrice != null
              ? qty * uPrice
              : null;
          const isOverridden =
            p.isPriceOverridden ??
            (mPrice != null && uPrice != null ? mPrice !== uPrice : false);
          return {
            activityPlanId: plan.id,
            workTypeCode: p.workTypeCode,
            storeId: p.storeId ?? null,
            productId: p.productId,
            productName: p.productName ?? null,
            targetQuantity: qty != null ? Math.round(qty) : null,
            masterPrice: mPrice != null ? new Prisma.Decimal(mPrice) : null,
            unitPrice: uPrice != null ? new Prisma.Decimal(uPrice) : null,
            targetAmount: totalAmt != null ? new Prisma.Decimal(totalAmt) : null,
            isPriceOverridden: isOverridden,
          };
        }),
      });
    }

    // 5. Marketing Items
    if (input.marketingItems && input.marketingItems.length > 0) {
      await tx.activityPlanMarketingItem.createMany({
        data: input.marketingItems.map((m) => {
          const uPrice = m.unitPrice ?? m.unitCost ?? 0;
          const qty = m.quantity || 1;
          const totalAmt = m.totalAmount ?? m.totalCost ?? qty * uPrice;
          return {
            activityPlanId: plan.id,
            category: m.category || "สื่อส่งเสริมการขาย",
            materialName: m.materialName,
            unit: m.unit ?? "ชิ้น",
            unitPrice: new Prisma.Decimal(uPrice),
            quantity: qty,
            totalAmount: new Prisma.Decimal(totalAmt),
          };
        }),
      });
    }

    // 6. Promotion Items
    if (input.promotionItems && input.promotionItems.length > 0) {
      await tx.activityPlanPromotionItem.createMany({
        data: input.promotionItems.map((p) => {
          const amt = p.amount ?? p.requestedAmount ?? 0;
          return {
            activityPlanId: plan.id,
            budgetType: p.budgetType || "SALES_PROMOTION",
            detail: p.detail || p.promotionDetail || "",
            amount: new Prisma.Decimal(amt),
          };
        }),
      });
    }

    // 7. Demo Plot Link (if demoPlotId provided and no visit exists)
    if (input.demoPlotId) {
      const existingVisit = await tx.demoPlotVisit.findFirst({
        where: { activityPlanId: plan.id },
      });
      if (!existingVisit) {
        await tx.demoPlotVisit.create({
          data: {
            demoPlotId: input.demoPlotId,
            activityPlanId: plan.id,
            visitNumber: 1,
            visitDate: start,
            notes: "เข้าตรวจและติดตามแปลงสาธิตตามแผนกิจกรรม",
          },
        });
      }
    }

    // 7. Tour (TYPE_12)
    if (input.tour) {
      await tx.activityPlanTour.create({
        data: {
          activityPlanId: plan.id,
          tourType: input.tour.tourType,
          tourSize: input.tour.tourSize ?? null,
          country: input.tour.country ?? null,
          storeId: input.tour.storeId ?? null,
          destination: input.tour.destination ?? null,
        },
      });
    }

    // 8. Helpers
    if (input.helpers && input.helpers.length > 0) {
      await tx.activityHelper.createMany({
        data: input.helpers.map((h) => ({
          activityPlanId: plan.id,
          employeeId: h.employeeId,
          departmentId: h.departmentId ?? null,
          departmentName: h.departmentName ?? null,
          status: h.status,
          approvedById: h.approvedById ?? null,
          approvedAt: h.approvedAt ?? null,
          respondedAt: h.respondedAt ?? null,
        })),
      });
    }

    // 8. Approval Logs
    if (input.approvalLogs && input.approvalLogs.length > 0) {
      for (const log of input.approvalLogs) {
        await tx.activityApprovalLog.create({
          data: {
            activityPlanId: plan.id,
            userId: log.userId,
            action: log.action,
            step: log.step,
            fromStatus: log.fromStatus ?? null,
            toStatus: log.toStatus ?? null,
            comment: log.comment ?? null,
            stepDurationSeconds: log.stepDurationSeconds ?? null,
            createdAt: log.createdAt ?? new Date(),
          },
        });
      }
    }

    // 9. Actual Result (Only for types with hasActual = true and when actualResult is provided)
    if (input.actualResult && input.primaryWorkTypeCode !== "TYPE_12") {
      const act = input.actualResult;
      const spSpent = act.actualSalesPromotionSpent ?? 0;
      const mktSpent = act.actualMarketingSpent ?? 0;
      const totalSpent = spSpent + mktSpent;

      const result = await tx.activityResult.create({
        data: {
          activityPlanId: plan.id,
          actualStartDate: new Date(act.actualStartDate),
          actualEndDate: new Date(act.actualEndDate),
          actualAttendeesCount: act.actualAttendeesCount ?? null,
          resultStatus: act.resultStatus,
          resultSummary: act.resultSummary ?? null,
          discussionResult: act.discussionResult ?? null,
          productAdvice: act.productAdvice ?? null,
          salesOpportunity: act.salesOpportunity ?? null,
          problemFound: act.problemFound ?? null,
          nextAction: act.nextAction ?? null,
          nextMeetingDate: act.nextMeetingDate ? new Date(act.nextMeetingDate) : null,
          actualSalesPromotionSpent: spSpent > 0 ? new Prisma.Decimal(spSpent) : null,
          actualMarketingSpent: mktSpent > 0 ? new Prisma.Decimal(mktSpent) : null,
          actualTotalSpent: totalSpent > 0 ? new Prisma.Decimal(totalSpent) : null,
          salesResultAmount: act.salesResultAmount != null ? new Prisma.Decimal(act.salesResultAmount) : null,
          salesOrdersCount: act.salesOrdersCount ?? null,
          collectResultAmount: act.collectResultAmount != null ? new Prisma.Decimal(act.collectResultAmount) : null,
          demoPlotsCreated: act.demoPlotsCreated ?? null,
          demoPlotsFollowedUp: act.demoPlotsFollowedUp ?? null,
          distributorsCount: act.distributorsCount ?? null,
          farmersCount: act.farmersCount ?? null,
          recordedById: act.recordedById,
        },
      });

      // 9.1 Sale Results
      if (act.saleResults && act.saleResults.length > 0) {
        await tx.activityResultSaleItem.createMany({
          data: act.saleResults.map((s) => ({
            activityResultId: result.id,
            workTypeCode: s.workTypeCode,
            storeId: s.storeId ?? null,
            productId: s.productId,
            productName: s.productName ?? null,
            actualQuantity: s.actualQuantity,
            actualUnitPrice: new Prisma.Decimal(s.actualUnitPrice),
            actualTotal: new Prisma.Decimal(s.actualTotal),
            unclosedReason: s.unclosedReason ?? null,
          })),
        });
      }

      // 9.2 Stock Results
      if (act.stockResults && act.stockResults.length > 0) {
        await tx.activityResultStockItem.createMany({
          data: act.stockResults.map((st) => ({
            activityResultId: result.id,
            storeId: st.storeId,
            productId: st.productId,
            remainingQuantity: st.remainingQuantity,
            stockStatus: st.stockStatus ?? null,
            reorderOpportunity: st.reorderOpportunity ?? null,
            remarks: st.remarks ?? null,
          })),
        });
      }

      // 9.3 Survey Results
      if (act.surveyResults && act.surveyResults.length > 0) {
        await tx.activityResultSurveyItem.createMany({
          data: act.surveyResults.map((sv) => ({
            activityResultId: result.id,
            storeId: sv.storeId,
            productId: sv.productId ?? null,
            competitorBrand: sv.competitorBrand,
            competitorProduct: sv.competitorProduct,
            competitorPrice: sv.competitorPrice != null ? new Prisma.Decimal(sv.competitorPrice) : null,
            competitorUnit: sv.competitorUnit ?? null,
            promotionDetail: sv.promotionDetail ?? null,
          })),
        });
      }

      // 9.4 Demo Results
      if (act.demoResults && act.demoResults.length > 0) {
        await tx.activityResultDemoItem.createMany({
          data: act.demoResults.map((d) => ({
            activityResultId: result.id,
            demoPlotId: d.demoPlotId ?? null,
            cropAgeValue: d.cropAgeValue ?? null,
            cropAgeUnit: d.cropAgeUnit ?? null,
            growthStage: d.growthStage ?? null,
            cropCondition: d.cropCondition ?? null,
            productResponse: d.productResponse ?? null,
            problemDescription: d.problemDescription ?? null,
            finalYieldKg: d.finalYieldKg != null ? new Prisma.Decimal(d.finalYieldKg) : null,
            controlYieldKg: d.controlYieldKg != null ? new Prisma.Decimal(d.controlYieldKg) : null,
            satisfactionScore: d.satisfactionScore ?? null,
          })),
        });
      }

      // 9.5 Attachments
      if (act.attachments && act.attachments.length > 0) {
        await tx.activityAttachment.createMany({
          data: act.attachments.map((att) => ({
            activityPlanId: plan.id,
            activityResultId: result.id,
            workTypeCode: att.workTypeCode ?? input.primaryWorkTypeCode,
            storeId: att.storeId ?? null,
            productId: att.productId ?? null,
            category: att.category,
            fileUrl: att.fileUrl,
            fileName: att.fileName,
            fileSize: att.fileSize ?? null,
            mimeType: att.mimeType ?? "image/svg+xml",
          })),
        });
      }
    }

    return { planId: plan.id, code: plan.code };
  });
}
