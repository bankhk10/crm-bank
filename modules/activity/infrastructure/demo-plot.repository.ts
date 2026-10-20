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
 * Fetch all master demo plots with visits (excluding CANCELLED and deleted plots)
 */
export async function findMasterDemoPlots() {
  return db.demoPlot.findMany({
    where: {
      deletedAt: null,
      plotType: "GENERAL_DEMO",
      status: { not: DemoPlotStatus.CANCELLED },
    },
    include: {
      customer: {
        select: { id: true, name: true, customerCode: true },
      },
      demoProducts: {
        include: { product: true },
        orderBy: { sortOrder: "asc" },
      },
      externalProducts: {
        orderBy: { sortOrder: "asc" },
      },
      irrigations: true,
      attachments: true,
      visits: {
        orderBy: { visitDate: "asc" },
      },
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
  const visitsCount = p.visits.length;
  const totalCost = p.visits.reduce(
    (sum: number, v: any) => sum + (Number(v.totalVisitCost) || 0),
    0,
  );
  const lastVisit = p.visits[p.visits.length - 1];
  const msPerDay = 1000 * 60 * 60 * 24;
  const latestDate = lastVisit ? new Date(lastVisit.visitDate) : new Date();
  const daysSinceStart = Math.max(
    0,
    Math.floor((latestDate.getTime() - new Date(p.startDate).getTime()) / msPerDay),
  );

  const linkedCustomer =
    (p.customerId && farmerMap.get(p.customerId)) ||
    (p.ownerName && farmerMap.get(p.ownerName.trim()));

  let plotLat: string | undefined = undefined;
  let plotLng: string | undefined = undefined;

  if (linkedCustomer) {
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

  if (!plotLat && !plotLng && p.location) {
    const coordMatch = p.location.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (coordMatch) {
      plotLat = coordMatch[1];
      plotLng = coordMatch[2];
    }
  }

  const formattedLocation =
    plotLat && plotLng
      ? `${plotLat}, ${plotLng}`
      : p.location || (p.ownerName ? `แปลงสาธิต ${p.ownerName}` : "");

  return {
    id: p.id,
    code: p.code,
    name: p.name,
    location: formattedLocation,
    targetCrop: p.customCropName || p.cropName,
    showcase: p.primaryProductName,
    ownerName: p.ownerName,
    cropCategory: p.cropCategory,
    cropName: p.cropName,
    customCropName: p.customCropName || undefined,
    productName: p.primaryProductName,
    areaRai: p.areaRai ? Number(p.areaRai) : 0,
    treeCount: p.treeCount || 0,
    startDate: p.startDate ? p.startDate.toISOString().split("T")[0] : "",
    status: p.status,
    visitsCount,
    totalCost,
    daysSinceStart,
    objective: p.objective || undefined,
    experimentDetail: p.experimentDetail || undefined,
    latitude: p.latitude ? String(p.latitude) : plotLat,
    longitude: p.longitude ? String(p.longitude) : plotLng,
    province: p.province || undefined,
    district: p.district || undefined,
    initialSprayDate: p.initialSprayDate ? p.initialSprayDate.toISOString().split("T")[0] : undefined,
    nextSprayDate: p.nextSprayDate ? p.nextSprayDate.toISOString().split("T")[0] : undefined,
    mainCropInfo: p.mainCropInfo || undefined,
    sprayMethod: p.sprayMethod || undefined,
    hasExternalChemicals: p.hasExternalChemicals || false,
    dealerId: p.customerId || p.customer?.id || undefined,
    dealerName: p.customer?.name || (p as any).dealerName || undefined,
    demoProducts: p.demoProducts,
    externalProducts: p.externalProducts,
    irrigations: (p.irrigations || []).map((ir: any) => ir.method),
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
