import { Prisma } from "@prisma/client";

/**
 * Complete relation include tree for ActivityPlan queries in modules/activity.
 * Includes all standard domain relations, plus dedicated Type 1 relations.
 */
export const ACTIVITY_PLAN_FULL_INCLUDE = {
  activityType: true,
  workTypes: {
    include: {
      activityType: true,
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
  tour: {
    include: {
      store: {
        select: {
          id: true,
          name: true,
          customerCode: true,
          province: true,
        },
      },
    },
  },
  type7aPlots: {
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
      demoPlot: {
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              customerCode: true,
              customerType: true,
              province: true,
              district: true,
            },
          },
          farmerCustomer: {
            select: {
              id: true,
              name: true,
              customerCode: true,
              customerType: true,
              province: true,
              district: true,
              phone: true,
            },
          },
          demoProducts: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  productCode: true,
                  unit: true,
                  packageSizeUnit: true,
                },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
          externalProducts: {
            orderBy: { sortOrder: "asc" },
          },
          irrigations: true,
          attachments: true,
          visits: {
            orderBy: [{ visitNumber: "asc" }, { createdAt: "asc" }],
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
              unit: true,
              packageSizeUnit: true,
            },
          },
        },
      },
    },
  },
  type7b: {
    include: {
      sourceActivityPlan: {
        select: {
          id: true,
          code: true,
          title: true,
          startDate: true,
          endDate: true,
        },
      },
      plots: {
        include: {
          demoPlot: true,
        },
      },
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              productCode: true,
              unit: true,
              packageSizeUnit: true,
            },
          },
        },
      },
    },
  },
  type13: {
    include: {
      plots: {
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
          demoPlot: true,
        },
        orderBy: { plotIndex: "asc" },
      },
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              productCode: true,
              unit: true,
              packageSizeUnit: true,
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  },
  type14: {
    include: {
      sourceActivityPlan: {
        select: {
          id: true,
          code: true,
          title: true,
          startDate: true,
          endDate: true,
        },
      },
      plots: {
        include: {
          demoPlot: true,
        },
      },
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              productCode: true,
              unit: true,
              packageSizeUnit: true,
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
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
      result: true,
    },
    orderBy: { createdAt: "asc" },
  },
  type1Results: true,
  type1Products: {
    include: {
      product: true,
    },
  },
  type2Targets: {
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
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  },
  type2Products: {
    include: {
      product: true,
    },
  },
  type3Targets: {
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
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  },
  type4Targets: {
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
    orderBy: { createdAt: "asc" },
  },
  type4Results: {
    include: {
      store: {
        select: {
          id: true,
          name: true,
          customerCode: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  },
  type5Targets: {
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
      product: {
        select: {
          id: true,
          name: true,
          productCode: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  },
  type6Targets: {
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
    orderBy: { createdAt: "asc" },
  },
  marketingItems: {
    orderBy: { createdAt: "asc" },
  },
  promotionItems: {
    orderBy: { createdAt: "asc" },
  },
  demoPlotVisits: {
    include: {
      attachments: true,
      demoPlot: {
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              customerCode: true,
              customerType: true,
              province: true,
              district: true,
            },
          },
          farmerCustomer: {
            select: {
              id: true,
              name: true,
              customerCode: true,
              customerType: true,
              province: true,
              district: true,
              phone: true,
            },
          },
          demoProducts: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  productCode: true,
                  unit: true,
                  packageSizeUnit: true,
                },
              },
            },
          },
          externalProducts: true,
          irrigations: true,
          attachments: true,
          visits: {
            orderBy: [{ visitNumber: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
    orderBy: [{ visitNumber: "asc" }, { createdAt: "asc" }],
  },
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
      approvedBy: true,
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
      logs: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      recordedBy: {
        select: { id: true, name: true, email: true },
      },
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
      surveyResults: {
        include: {
          product: {
            select: { id: true, name: true, productCode: true },
          },
          store: {
            select: { id: true, name: true, customerCode: true },
          },
          attachments: true,
        },
      },
      demoResults: {
        include: {
          plannedProduct: {
            select: {
              id: true,
              name: true,
              productCode: true,
              unit: true,
              packageSizeUnit: true,
            },
          },
          actualProduct: {
            select: {
              id: true,
              name: true,
              productCode: true,
              unit: true,
              packageSizeUnit: true,
            },
          },
        },
      },
      followupResults: {
        include: {
          product: {
            select: { id: true, name: true, productCode: true },
          },
          store: {
            select: { id: true, name: true, customerCode: true },
          },
        },
      },
      issueResults: {
        include: {
          product: {
            select: { id: true, name: true, productCode: true },
          },
          store: {
            select: { id: true, name: true, customerCode: true },
          },
          attachments: true,
        },
      },
      sprayRounds: {
        include: {
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  productCode: true,
                  unit: true,
                  packageSizeUnit: true,
                },
              },
            },
          },
          externalProducts: true,
          attachments: true,
        },
        orderBy: { roundNumber: "asc" },
      },
      attachments: true,
    },
  },
  attachments: true,
} as const satisfies Prisma.ActivityPlanInclude;
