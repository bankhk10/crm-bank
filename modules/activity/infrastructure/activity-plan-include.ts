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
  type7aPlots: {
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
                select: { id: true, name: true },
              },
            },
          },
          attachments: true,
        },
        orderBy: [{ visitNumber: "asc" }, { visitDate: "asc" }, { createdAt: "asc" }],
      },
      type7bTargets: {
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
                select: { id: true, name: true },
              },
            },
          },
          products: {
            include: {
              product: {
                select: { id: true, name: true, unit: true },
              },
            },
          },
        },
      },
    },
  },
  // Dedicated Type 7A relations
  type7aTargets: {
    include: {
      store: {
        select: {
          id: true,
          name: true,
          customerCode: true,
          province: true,
          district: true,
        },
      },
      demoPlot: true,
      products: {
        include: {
          product: {
            select: { id: true, name: true, productCode: true, unit: true, packageSizeUnit: true },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      results: {
        include: {
          irrigations: true,
          actualProducts: {
            include: {
              product: {
                select: { id: true, name: true, unit: true },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
          sprayExternals: {
            orderBy: { sortOrder: "asc" },
          },
          attachments: true,
        },
      },
    },
  },
  type7aProducts: {
    include: {
      product: {
        select: { id: true, name: true, productCode: true, unit: true, packageSizeUnit: true },
      },
    },
    orderBy: { sortOrder: "asc" },
  },
  type7aResults: {
    include: {
      irrigations: true,
      actualProducts: {
        include: {
          product: {
            select: { id: true, name: true, unit: true },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      sprayExternals: {
        orderBy: { sortOrder: "asc" },
      },
      attachments: true,
    },
  },

  // Dedicated Type 7B relations
  type7bTargets: {
    include: {
      demoPlot: true,
      sourceActivityPlan: {
        select: { id: true, code: true, title: true, startDate: true, endDate: true },
      },
      products: {
        include: {
          product: {
            select: { id: true, name: true, productCode: true, unit: true, packageSizeUnit: true },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      results: {
        include: {
          sprayRounds: {
            include: {
              sprayProducts: {
                include: {
                  product: { select: { id: true, name: true, unit: true } },
                },
                orderBy: { sortOrder: "asc" },
              },
              sprayExternals: {
                orderBy: { sortOrder: "asc" },
              },
            },
            orderBy: { roundNumber: "asc" },
          },
          attachments: true,
        },
      },
    },
  },
  type7bProducts: {
    include: {
      product: {
        select: { id: true, name: true, productCode: true, unit: true, packageSizeUnit: true },
      },
    },
    orderBy: { sortOrder: "asc" },
  },
  type7bResults: {
    include: {
      sprayRounds: {
        include: {
          sprayProducts: {
            include: {
              product: { select: { id: true, name: true, unit: true } },
            },
            orderBy: { sortOrder: "asc" },
          },
          sprayExternals: {
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { roundNumber: "asc" },
      },
      attachments: true,
    },
  },

  // Dedicated Type 13 relations
  type13Targets: {
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
      products: {
        include: {
          product: {
            select: { id: true, name: true, productCode: true, unit: true, packageSizeUnit: true },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      results: {
        include: {
          sprayRounds: {
            include: {
              sprayProducts: {
                include: {
                  product: { select: { id: true, name: true, unit: true } },
                },
                orderBy: { sortOrder: "asc" },
              },
              sprayExternals: {
                orderBy: { sortOrder: "asc" },
              },
            },
            orderBy: { roundNumber: "asc" },
          },
          attachments: true,
        },
      },
    },
    orderBy: { plotIndex: "asc" },
  },
  type13Products: {
    include: {
      product: {
        select: { id: true, name: true, productCode: true, unit: true, packageSizeUnit: true },
      },
    },
    orderBy: { sortOrder: "asc" },
  },
  type13Results: {
    include: {
      sprayRounds: {
        include: {
          sprayProducts: {
            include: {
              product: { select: { id: true, name: true, unit: true } },
            },
            orderBy: { sortOrder: "asc" },
          },
          sprayExternals: {
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { roundNumber: "asc" },
      },
      attachments: true,
    },
  },

  // Dedicated Type 14 relations
  type14Targets: {
    include: {
      sourceActivityPlan: {
        select: { id: true, code: true, title: true, startDate: true, endDate: true },
      },
      demoPlot: true,
      store: {
        select: {
          id: true,
          name: true,
          customerCode: true,
          province: true,
          district: true,
        },
      },
      products: {
        include: {
          product: {
            select: { id: true, name: true, productCode: true, unit: true, packageSizeUnit: true },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      results: {
        include: {
          productsUsed: {
            include: {
              product: { select: { id: true, name: true, unit: true } },
            },
            orderBy: { sortOrder: "asc" },
          },
          attachments: true,
        },
      },
    },
  },
  type14Products: {
    include: {
      product: {
        select: { id: true, name: true, productCode: true, unit: true, packageSizeUnit: true },
      },
    },
    orderBy: { sortOrder: "asc" },
  },
  type14Results: {
    include: {
      productsUsed: {
        include: {
          product: { select: { id: true, name: true, unit: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
      attachments: true,
    },
  },
  // Dedicated Type 1 relations
  type1Targets: {
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
      products: {
        include: {
          product: true,
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
      results: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              productCode: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  },
  type2Results: {
    include: {
      product: true,
      store: true,
      target: true,
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
      results: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              productCode: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  },
  type3Results: {
    include: {
      product: true,
      store: true,
      target: true,
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
      result: true,
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
      target: true,
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
      results: true,
    },
    orderBy: { createdAt: "asc" },
  },
  type5Results: {
    include: {
      store: {
        select: {
          id: true,
          name: true,
          customerCode: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          productCode: true,
        },
      },
      attachments: true,
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
      results: true,
    },
    orderBy: { createdAt: "asc" },
  },
  type6Results: {
    include: {
      store: {
        select: {
          id: true,
          name: true,
          customerCode: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          productCode: true,
        },
      },
      attachments: true,
    },
    orderBy: { createdAt: "asc" },
  },
  // Dedicated Type 8 relations
  type8Targets: {
    include: {
      dealer: {
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
      subdealer: {
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
      products: {
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
        orderBy: { createdAt: "asc" },
      },
      result: true,
    },
    orderBy: { createdAt: "asc" },
  },
  type8Products: {
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
    orderBy: { createdAt: "asc" },
  },
  type8Results: {
    orderBy: { createdAt: "asc" },
  },
  // Dedicated Type 9 relations
  type9Targets: {
    include: {
      dealer: {
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
      subdealer: {
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
      products: {
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
        orderBy: { createdAt: "asc" },
      },
      result: true,
    },
    orderBy: { createdAt: "asc" },
  },
  type9Products: {
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
    orderBy: { createdAt: "asc" },
  },
  type9Results: {
    orderBy: { createdAt: "asc" },
  },
  // Dedicated Type 10 relations
  type10Targets: {
    include: {
      demoPlot: {
        select: {
          id: true,
          code: true,
          name: true,
          ownerName: true,
          location: true,
          province: true,
          district: true,
          cropCategory: true,
          cropName: true,
        },
      },
      showcaseProduct: {
        select: {
          id: true,
          name: true,
          productCode: true,
          price: true,
          unit: true,
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
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      result: true,
    },
    orderBy: { createdAt: "asc" },
  },
  type10Products: {
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
    orderBy: { createdAt: "asc" },
  },
  type10Results: {
    orderBy: { createdAt: "asc" },
  },
  // Dedicated Type 11 relations
  type11Targets: {
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
      dealer: {
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
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      result: true,
    },
    orderBy: { createdAt: "asc" },
  },
  type11Products: {
    include: {
      target: true,
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
    orderBy: { createdAt: "asc" },
  },
  type11Results: {
    orderBy: { createdAt: "asc" },
  },
  type12Targets: {
    include: {
      store: {
        select: {
          id: true,
          name: true,
          customerCode: true,
          province: true,
          district: true,
        },
      },
      result: true,
    },
    orderBy: { createdAt: "asc" },
  },
  type12Results: {
    include: {
      attachments: true,
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
      attachments: true,
    },
  },
  attachments: true,
} as const satisfies Prisma.ActivityPlanInclude;
