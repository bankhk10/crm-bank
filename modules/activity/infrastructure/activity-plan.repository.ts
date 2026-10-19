import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getWorkTypeCode, WORK_TYPE_CONFIG } from "../constants";

/**
 * Utility: Calculate Fiscal Dimensions from startDate and endDate
 */
export function computeFiscalFields(startDate: Date, endDate: Date) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const year = start.getFullYear();
  const month = start.getMonth() + 1; // 1–12
  const quarter = Math.ceil(month / 3); // 1–4
  const msPerDay = 1000 * 60 * 60 * 24;
  const durationDays = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / msPerDay),
  );
  return {
    fiscalYear: year,
    fiscalMonth: month,
    fiscalQuarter: quarter,
    durationDays,
  };
}

/**
 * Generate Activity Plan Code (format: TPYYMMXXXX)
 * Uses strict regex parsing, transaction advisory lock, and collision protection.
 */
export async function generateActivityPlanCode(
  tx: Prisma.TransactionClient | typeof db,
  date: Date = new Date(),
): Promise<string> {
  const d = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
  const yearStr = String(d.getFullYear()).slice(-2);
  const monthStr = String(d.getMonth() + 1).padStart(2, "0");
  const prefix = `TP${yearStr}${monthStr}`;

  // 1. Transaction-level advisory lock to serialize concurrent code generation for the same monthly prefix
  try {
    await (tx as any)
      .$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${prefix}))`;
  } catch {
    // If not supported or outside transaction, proceed with regex-based scan
  }

  // 2. Fetch all existing plans matching the prefix
  const existingPlans = await tx.activityPlan.findMany({
    where: {
      code: { startsWith: prefix },
    },
    select: { code: true },
  });

  // 3. Extract max numeric sequence strictly matching TPYYMM\d{4}
  let maxSeq = 0;
  const codeRegex = new RegExp(`^${prefix}(\\d{4})$`);

  for (const p of existingPlans) {
    if (p.code) {
      const match = p.code.match(codeRegex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const seqStr = String(nextSeq).padStart(4, "0");
  return `${prefix}${seqStr}`;
}

/**
 * Resolve activity type ID (accepts cuid ID, code like "TYPE_1", or Thai name like "เข้าพบร้านค้า / Key Farmer")
 */
export async function resolveActivityTypeId(
  idOrCode: string,
  tx: Prisma.TransactionClient | typeof db = db,
): Promise<string> {
  if (!idOrCode) {
    const first = await tx.activityType.findFirst({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return first?.id ?? "";
  }

  // 1. Direct ID check
  const byId = await tx.activityType.findUnique({
    where: { id: idOrCode },
  });
  if (byId) return byId.id;

  // 2. Resolve code via WORK_TYPE_CONFIG or raw string
  const resolvedCode = getWorkTypeCode(idOrCode);
  const byCode = await tx.activityType.findUnique({
    where: { code: resolvedCode },
  });
  if (byCode) return byCode.id;

  // 3. Check by name
  const byName = await tx.activityType.findFirst({
    where: { name: idOrCode },
  });
  if (byName) return byName.id;

  // 4. Auto-seed if present in WORK_TYPE_CONFIG
  const config = WORK_TYPE_CONFIG[resolvedCode];
  if (config) {
    const created = await tx.activityType.create({
      data: {
        code: config.code,
        name: config.name,
        shortName: config.shortName,
        sortOrder: config.sortOrder,
        hasActual: config.hasActual,
        requiresApproval: config.requiresApproval,
        isActive: true,
      },
    });
    return created.id;
  }

  const first = await tx.activityType.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return first?.id ?? idOrCode;
}

/**
 * Find all active activity types
 */
export async function findActivityTypes() {
  return db.activityType.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * Find activity type by code (e.g. "TYPE_1")
 */
export async function findActivityTypeByCode(code: string) {
  return db.activityType.findUnique({
    where: { code },
  });
}
