"use server";

import {
  findType1FarmerOptions,
  findType1DealerOptions,
  findType1StoresByPlanId,
} from "../infrastructure/type-1.repository";

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Action: Get list of Farmer customers (filtered by province) for TYPE_1 Visit
 */
export async function getFarmerCustomerOptionsAction(province?: string) {
  try {
    const farmers = await findType1FarmerOptions(province);
    return serialize({
      success: true as const,
      farmers,
    });
  } catch (err: any) {
    console.error("Failed to get farmer customer options for TYPE 1:", err);
    return serialize({
      success: false as const,
      farmers: [],
    });
  }
}

/**
 * Action: Get list of Dealer & Subdealer customers for TYPE_1 Visit (Store)
 */
export async function getDealerAndSubdealerCustomerOptionsAction() {
  try {
    const stores = await findType1DealerOptions();
    return serialize({
      success: true as const,
      stores,
    });
  } catch (err: any) {
    console.error("Failed to get dealer & subdealer customer options for TYPE 1:", err);
    return serialize({
      success: false as const,
      stores: [],
    });
  }
}

/**
 * Action: Get TYPE 1 stores for a given activity plan
 */
export async function getType1StoresAction(activityPlanId: string) {
  try {
    const stores = await findType1StoresByPlanId(activityPlanId);
    return serialize({
      success: true as const,
      stores,
    });
  } catch (err: any) {
    console.error("Failed to get TYPE 1 stores:", err);
    return serialize({
      success: false as const,
      stores: [],
    });
  }
}

// Aliases for explicit naming
export const getType1FarmerOptionsAction = getFarmerCustomerOptionsAction;
export const getType1DealerOptionsAction = getDealerAndSubdealerCustomerOptionsAction;
