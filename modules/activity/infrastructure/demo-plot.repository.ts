import { db } from "@/lib/db";
import { Prisma, DemoPlotStatus } from "@prisma/client";

export interface DemoPlotOption {
  id: string;
  code?: string;
  name: string;
  location: string;
  targetCrop: string;
  showcase: string;
  ownerName?: string;
  cropCategory?: string;
  cropName?: string;
  customCropName?: string;
  productId?: string;
  productName?: string;
  areaRai?: number;
  treeCount?: number;
  startDate?: string;
  status?: string;
  visitsCount?: number;
  totalCost?: number;
  daysSinceStart?: number;
  objective?: string;
  experimentDetail?: string;
  latitude?: string;
  longitude?: string;
  province?: string;
  district?: string;
  initialSprayDate?: string;
  nextSprayDate?: string;
  mainCropInfo?: string;
  sprayMethod?: string;
  hasExternalChemicals?: boolean;
  dealerId?: string;
  dealerName?: string;
  activityName?: string;
  activityCode?: string;
  activityType?: string;
  demoProducts?: any[];
  externalProducts?: any[];
  irrigations?: any[];
}

/**
 * Fetch all master demo plots from dedicated Type 7A targets (excluding CANCELLED and deleted plans)
 */
export async function findMasterDemoPlots() {
  return db.activityPlanType7aTarget.findMany({
    where: {
      status: { not: DemoPlotStatus.CANCELLED },
      activityPlan: {
        deletedAt: null,
        status: { not: "CANCELLED" },
      },
    },
    include: {
      activityPlan: {
        select: {
          id: true,
          code: true,
          title: true,
          startDate: true,
          endDate: true,
        },
      },
      store: {
        select: { id: true, name: true, customerCode: true },
      },
      products: {
        include: { product: true },
        orderBy: { sortOrder: "asc" },
      },
      results: {
        include: {
          irrigations: true,
          actualProducts: { include: { product: true } },
          sprayExternals: true,
          attachments: true,
        },
      },
      type7bTargets: true,
      type7bResults: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetch Farmer Customers to retrieve farm plots
 */
export async function findFarmerCustomersForPlots() {
  return db.customer.findMany({
    where: {
      deletedAt: null,
      OR: [{ customerType: "FARMER" }, { farmPlots: { not: Prisma.DbNull } }],
    },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      farmPlots: true,
      addresses: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

function mapDemoPlotToOption(p: any, farmerMap: Map<string, any>): DemoPlotOption {
  const result1 = p.results?.[0];
  const visitsCount = (p.results?.length || 0) + (p.type7bResults?.length || 0);
  const totalCost = 0;
  const msPerDay = 1000 * 60 * 60 * 24;
  const startDate = p.activityPlan?.startDate ? new Date(p.activityPlan.startDate) : new Date(p.createdAt);
  const daysSinceStart = Math.max(
    0,
    Math.floor((Date.now() - startDate.getTime()) / msPerDay),
  );

  const ownerName = result1?.farmerName || p.store?.name || p.dealerName || "";
  const linkedCustomer =
    (p.storeId && farmerMap.get(p.storeId)) ||
    (ownerName && farmerMap.get(ownerName.trim()));

  let plotLat: string | undefined = result1?.latitude ? String(result1.latitude).trim() : undefined;
  let plotLng: string | undefined = result1?.longitude ? String(result1.longitude).trim() : undefined;

  if (!plotLat && !plotLng && linkedCustomer) {
    if (linkedCustomer.farmPlots && Array.isArray(linkedCustomer.farmPlots)) {
      const matchedPlot = (linkedCustomer.farmPlots as any[]).find(
        (fp) =>
          (fp.cropType && fp.cropType === p.cropName) ||
          (fp.latitude && fp.longitude),
      );
      if (matchedPlot) {
        plotLat = matchedPlot.latitude ? String(matchedPlot.latitude).trim() : undefined;
        plotLng = matchedPlot.longitude ? String(matchedPlot.longitude).trim() : undefined;
      }
    }
    if (!plotLat && linkedCustomer.latitude) {
      plotLat = String(linkedCustomer.latitude).trim();
    }
    if (!plotLng && linkedCustomer.longitude) {
      plotLng = String(linkedCustomer.longitude).trim();
    }
  }

  const primaryProduct = p.products?.[0]?.product?.name || p.products?.[0]?.productName || "";
  const formattedLocation =
    plotLat && plotLng
      ? `${plotLat}, ${plotLng}`
      : ownerName ? `แปลงสาธิต ${ownerName}` : p.plotName || "";

  return {
    id: p.id,
    code: p.code || undefined,
    name: p.plotName || "แปลงสาธิต",
    location: formattedLocation,
    targetCrop: p.customCropName || p.cropName || p.cropCategory || "",
    showcase: primaryProduct,
    ownerName: ownerName || undefined,
    cropCategory: p.cropCategory || undefined,
    cropName: p.cropName || undefined,
    customCropName: p.customCropName || undefined,
    productName: primaryProduct || undefined,
    areaRai: p.areaRai ? Number(p.areaRai) : 0,
    treeCount: p.treeCount || 0,
    startDate: startDate.toISOString().split("T")[0],
    status: p.status,
    visitsCount,
    totalCost,
    daysSinceStart,
    objective: p.objective || undefined,
    experimentDetail: result1?.experimentDetail || undefined,
    latitude: plotLat,
    longitude: plotLng,
    province: p.province || p.store?.province || undefined,
    district: p.district || p.store?.district || undefined,
    initialSprayDate: result1?.firstSprayDate ? new Date(result1.firstSprayDate).toISOString().split("T")[0] : undefined,
    nextSprayDate: result1?.nextSprayDate ? new Date(result1.nextSprayDate).toISOString().split("T")[0] : undefined,
    mainCropInfo: result1?.mainCropInfo || undefined,
    sprayMethod: result1?.sprayMethod || undefined,
    hasExternalChemicals: Boolean(result1?.hasExternalChemicals),
    dealerId: p.storeId || p.store?.id || undefined,
    dealerName: p.store?.name || p.dealerName || undefined,
    demoProducts: p.products,
    externalProducts: result1?.sprayExternals || [],
    irrigations: (result1?.irrigations || []).map((ir: any) => ir.method),
  };
}

/**
 * Fetch available demo plots for Activity Plans (Master Demo Plots + Farmer Farm Plots)
 */
export async function getAvailableDemoPlots() {
  const farmerCustomers = await findFarmerCustomersForPlots();
  const farmerMap = new Map<string, (typeof farmerCustomers)[0]>();
  farmerCustomers.forEach((f) => {
    farmerMap.set(f.id, f);
    if (f.name) farmerMap.set(f.name.trim(), f);
  });

  const masterPlots = await findMasterDemoPlots();
  const realPlots: DemoPlotOption[] = masterPlots.map((p) =>
    mapDemoPlotToOption(p, farmerMap),
  );

  farmerCustomers.forEach((farmer) => {
    if (farmer.farmPlots && Array.isArray(farmer.farmPlots)) {
      (farmer.farmPlots as any[]).forEach((fp, idx) => {
        const cropDisplay = fp.cropType || "พืชเกษตร";
        const varietyDisplay = fp.variety ? ` (${fp.variety})` : "";
        const plotLabel = `แปลงที่ ${idx + 1}: ${cropDisplay}${varietyDisplay}`;

        const locParts: string[] = [];
        if (fp.soilType) locParts.push(`ดิน: ${fp.soilType}`);
        if (fp.waterSource) locParts.push(`แหล่งน้ำ: ${fp.waterSource}`);
        const locationStr =
          locParts.length > 0
            ? locParts.join(", ")
            : farmer.name
              ? `แปลงเกษตรของ ${farmer.name}`
              : "";

        const farmPlotOption: DemoPlotOption = {
          id: `farmplot-${farmer.id}-${idx}`,
          code: `FP-${farmer.id.slice(-4)}-${idx + 1}`,
          name: plotLabel,
          location: locationStr,
          targetCrop: `${cropDisplay}${varietyDisplay}`,
          showcase: "",
          ownerName: farmer.name,
          cropCategory: cropDisplay,
          cropName: cropDisplay,
          customCropName: fp.variety || undefined,
          areaRai: fp.areaRai ? Number(fp.areaRai) : 0,
          treeCount: 0,
          status: "IN_PROGRESS",
          latitude: fp.latitude || farmer.latitude || undefined,
          longitude: fp.longitude || farmer.longitude || undefined,
        };

        realPlots.push(farmPlotOption);
      });
    }
  });

  return realPlots;
}
