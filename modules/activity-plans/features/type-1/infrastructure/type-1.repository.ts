import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { Type1VisitItem, Type1ActualData } from "../types";
import { mapType1FormToPlanStore, mapType1ActualFormToDb } from "../application/mapper";

/**
 * Fetch Farmer customers for selection in TYPE_1 Visit
 */
export async function findType1FarmerOptions(province?: string) {
  return db.customer.findMany({
    where: {
      deletedAt: null,
      customerType: "FARMER",
      ...(province && province.trim() ? { province: province.trim() } : {}),
    },
    select: {
      id: true,
      name: true,
      customerCode: true,
      customerType: true,
      phone: true,
      province: true,
      district: true,
      addressLine: true,
      subdistrict: true,
      postalCode: true,
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Fetch Dealer & Subdealer customers for selection in TYPE_1 Visit (Store)
 */
export async function findType1DealerOptions() {
  return db.customer.findMany({
    where: {
      deletedAt: null,
      customerType: {
        in: ["DEALER", "SUBDEALER"],
      },
    },
    select: {
      id: true,
      name: true,
      customerCode: true,
      customerType: true,
      phone: true,
      province: true,
      district: true,
      addressLine: true,
      subdistrict: true,
      postalCode: true,
      parentDealerId: true,
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Fetch TYPE_1 stores with customer details for a given plan
 */
export async function findType1StoresByPlanId(
  activityPlanId: string,
  tx?: Prisma.TransactionClient,
) {
  const client = tx || db;
  return client.activityPlanStore.findMany({
    where: {
      activityPlanId,
      workTypeCode: "TYPE_1",
    },
    include: {
      store: {
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
    },
  });
}

/**
 * Persist TYPE_1 plan stores during plan creation/update transaction
 */
export async function createType1PlanStores(
  activityPlanId: string,
  items: Type1VisitItem[],
  tx: Prisma.TransactionClient,
) {
  if (!items || items.length === 0) return;

  const recordsToInsert = items
    .map((item) => mapType1FormToPlanStore(item))
    .filter(Boolean)
    .map((record) => ({
      activityPlanId,
      workTypeCode: "TYPE_1",
      visitPurpose: record!.visitPurpose,
      storeId: record!.storeId ?? null,
      storeName: record!.storeName ?? null,
      province: record!.province ?? null,
      isUnregisteredFarmer: record!.isUnregisteredFarmer,
      unregisteredFarmerName: record!.unregisteredFarmerName ?? null,
      unregisteredFarmerPhone: record!.unregisteredFarmerPhone ?? null,
      remarks: record!.remarks ?? null,
      notes: record!.notes ?? null,
    }));

  if (recordsToInsert.length > 0) {
    await tx.activityPlanStore.createMany({
      data: recordsToInsert,
    });
  }
}

/**
 * Save TYPE_1 actual result outcome
 */
export async function saveType1ActualResult(
  activityPlanId: string,
  actual: Type1ActualData,
  tx?: Prisma.TransactionClient,
) {
  const client = tx || db;
  const updateData = mapType1ActualFormToDb(actual);

  return client.activityResult.upsert({
    where: { activityPlanId },
    update: updateData,
    create: {
      activityPlanId,
      actualStartDate: new Date(),
      actualEndDate: new Date(),
      ...updateData,
    },
  });
}

export const type1Repository = {
  findFarmerOptions: findType1FarmerOptions,
  findDealerOptions: findType1DealerOptions,
  findStoresByPlanId: findType1StoresByPlanId,
  createPlanStores: createType1PlanStores,
  saveActualResult: saveType1ActualResult,
};
