export type PlanActionResult = {
  success: boolean;
  plan?: any;
  error?: string;
};

export interface ActivityPlanMasterData {
  employees: any[];
  customers: any[];
  products: any[];
  productCategories: any[];
  activityTypes: any[];
  demoPlots: any[];
  followUpPlans: any[];
  hattackFollowUpPlans: any[];
  promotionalMaterialsByCategory?: Record<string, any[]>;
  currentEmployeeName?: string;
  loadError?: string | null;
}

export interface ActivityPlanEditMasterData extends ActivityPlanMasterData {
  plan?: any | null;
  planError?: string | null;
}

export interface ActivityPlanActualInitialData {
  plan?: any | null;
  planError?: string | null;
  products: any[];
  customers: any[];
}

export interface ActivityFilterMasterData {
  activityTypes: any[];
  employees: any[];
}
