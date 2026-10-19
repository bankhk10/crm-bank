import { Prisma } from "@prisma/client";

/**
 * Complete relation include tree for ActivityPlan queries in modules/activity
 * Includes dedicated Type 1 relations as first-class citizens.
 */
export const ACTIVITY_PLAN_FULL_INCLUDE = {
  activityType: true,
  workTypes: {
    include: {
      activityType: true,
    },
  },
  // Dedicated Type 1 relations
  type1Stores: {
    include: {
      store: {
        select: {
          id: true,
          name: true,
          customerCode: true,
          customerType: true,
          province: true,
          district: true,
          latitude: true,
          longitude: true,
          addressLine: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  },
  type1Results: true,
  type1Products: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          productCode: true,
          price: true,
          unit: true,
        },
      },
    },
  },
  stores: {
    include: {
      store: {
        select: {
          id: true,
          name: true,
          customerCode: true,
          customerType: true,
          province: true,
          district: true,
        },
      },
    },
  },
  products: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          productCode: true,
          price: true,
          unit: true,
          packageSizeUnit: true,
          categoryId: true,
          category: {
            select: { id: true, code: true, description: true },
          },
          productGroupId: true,
          productGroup: {
            select: { id: true, code: true, name: true },
          },
        },
      },
      store: {
        select: { id: true, name: true, customerCode: true },
      },
    },
  },
  marketingItems: true,
  promotionItems: true,
  employee: {
    include: {
      position: true,
      department: true,
    },
  },
  createdBy: {
    select: { id: true, name: true, email: true },
  },
  currentApprover: {
    include: {
      position: true,
      department: true,
    },
  },
  helpers: {
    where: { deletedAt: null },
    include: {
      employee: {
        include: {
          position: true,
          department: true,
        },
      },
    },
  },
  approvalLogs: {
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  },
  result: {
    include: {
      saleResults: {
        include: {
          product: {
            select: { id: true, name: true, productCode: true },
          },
          store: {
            select: { id: true, name: true, customerCode: true },
          },
        },
      },
      stockResults: {
        include: {
          product: {
            select: { id: true, name: true, productCode: true },
          },
          store: {
            select: { id: true, name: true, customerCode: true },
          },
        },
      },
      attachments: true,
    },
  },
  attachments: true,
} as const satisfies Prisma.ActivityPlanInclude;
