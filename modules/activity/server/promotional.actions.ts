"use server";

import * as legacyActions from "@/modules/activity-plans/server/actions";

export async function getActivePromotionalMaterialsGroupedAction(
  ...args: Parameters<typeof legacyActions.getActivePromotionalMaterialsGroupedAction>
) {
  return legacyActions.getActivePromotionalMaterialsGroupedAction(...args);
}

export async function createPromotionalMaterialAction(
  ...args: Parameters<typeof legacyActions.createPromotionalMaterialAction>
) {
  return legacyActions.createPromotionalMaterialAction(...args);
}

export async function updatePromotionalMaterialAction(
  ...args: Parameters<typeof legacyActions.updatePromotionalMaterialAction>
) {
  return legacyActions.updatePromotionalMaterialAction(...args);
}

export async function deletePromotionalMaterialAction(
  ...args: Parameters<typeof legacyActions.deletePromotionalMaterialAction>
) {
  return legacyActions.deletePromotionalMaterialAction(...args);
}

export async function getPromotionalMaterialsAction(
  ...args: Parameters<typeof legacyActions.getPromotionalMaterialsAction>
) {
  return legacyActions.getPromotionalMaterialsAction(...args);
}

export async function getDistinctPromotionalCategoriesAction(
  ...args: Parameters<typeof legacyActions.getDistinctPromotionalCategoriesAction>
) {
  return legacyActions.getDistinctPromotionalCategoriesAction(...args);
}
