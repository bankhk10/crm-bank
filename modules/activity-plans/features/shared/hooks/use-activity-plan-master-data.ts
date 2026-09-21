import { useState, useEffect, useMemo } from "react";
import {
  getWorkTypeName,
  type UserDemoPlotOption,
} from "@/modules/activity-plans/constants";
import {
  getDemoPlotsAction,
  getFollowUpDemoPlotsAction,
} from "@/modules/activity-plans/server/actions";

export interface UseActivityPlanMasterDataOptions {
  initialCustomers?: any[];
  initialProducts?: any[];
  initialProductCategories?: any[];
  initialChemicalGroups?: any[];
  initialActivityTypes?: any[];
  initialDemoPlots?: UserDemoPlotOption[];
  promotionalMaterialsByCategory?: Record<
    string,
    Array<{ name: string; price: number; unit?: string }>
  >;
}

export interface UseActivityPlanMasterDataResult {
  customersList: any[];
  productsList: any[];
  productCategoriesList: any[];
  demoPlotsList: UserDemoPlotOption[];
  fetchedFollowUpDemoPlots: UserDemoPlotOption[];
  activeWorkTypeOptions: Array<any & { displayName: string }>;
  fetchedMaterialsByCategory:
    | Record<string, Array<{ name: string; price: number; unit?: string }>>
    | undefined;
}

export function useActivityPlanMasterData({
  initialCustomers,
  initialProducts,
  initialProductCategories,
  initialChemicalGroups,
  initialActivityTypes,
  initialDemoPlots,
  promotionalMaterialsByCategory,
}: UseActivityPlanMasterDataOptions): UseActivityPlanMasterDataResult {
  const [fetchedCustomers, setFetchedCustomers] = useState<any[]>([]);
  const [fetchedProducts, setFetchedProducts] = useState<any[]>([]);
  const [fetchedProductCategories, setFetchedProductCategories] = useState<any[]>([]);
  const [fetchedActivityTypes, setFetchedActivityTypes] = useState<any[]>([]);
  const [fetchedDemoPlots, setFetchedDemoPlots] = useState<UserDemoPlotOption[]>([]);
  const [fetchedFollowUpDemoPlots, setFetchedFollowUpDemoPlots] = useState<
    UserDemoPlotOption[]
  >([]);
  const [fetchedMaterialsByCategory, setFetchedMaterialsByCategory] = useState<
    Record<string, Array<{ name: string; price: number; unit?: string }>> | undefined
  >(promotionalMaterialsByCategory);

  // 1. Promotional materials
  useEffect(() => {
    if (promotionalMaterialsByCategory !== undefined) {
      setFetchedMaterialsByCategory(promotionalMaterialsByCategory);
      return;
    }

    let isMounted = true;
    async function loadPromotionalMaterials() {
      try {
        const { getActivePromotionalMaterialsGroupedAction } = await import(
          "@/modules/activity-plans/server/actions"
        );
        const res = await getActivePromotionalMaterialsGroupedAction();
        if (isMounted && res.success && res.grouped) {
          setFetchedMaterialsByCategory(res.grouped);
        }
      } catch (err) {
        console.error("Failed to load promotional materials for Trip Plan:", err);
      }
    }
    loadPromotionalMaterials();
    return () => {
      isMounted = false;
    };
  }, [promotionalMaterialsByCategory]);

  const customersList =
    initialCustomers !== undefined ? initialCustomers : fetchedCustomers;

  const productsList =
    initialProducts !== undefined ? initialProducts : fetchedProducts;

  const productCategoriesList =
    initialProductCategories !== undefined
      ? initialProductCategories
      : initialChemicalGroups !== undefined
        ? initialChemicalGroups
        : fetchedProductCategories;

  const demoPlotsList =
    initialDemoPlots !== undefined ? initialDemoPlots : fetchedDemoPlots;

  // 2. Product categories
  useEffect(() => {
    if (
      initialProductCategories !== undefined ||
      initialChemicalGroups !== undefined
    )
      return;

    let isMounted = true;
    async function loadProductCategories() {
      try {
        const { getProductCategoriesAction } = await import(
          "@/modules/activity-plans/server/actions"
        );
        const res = await getProductCategoriesAction();
        if (isMounted && res.success && res.productCategories) {
          setFetchedProductCategories(res.productCategories);
        }
      } catch (err) {
        console.error("Failed to load product categories for Trip Plan:", err);
      }
    }
    loadProductCategories();
    return () => {
      isMounted = false;
    };
  }, [initialProductCategories, initialChemicalGroups]);

  // 3. Customers
  useEffect(() => {
    if (initialCustomers !== undefined) return;

    let isMounted = true;
    async function loadCustomers() {
      try {
        const res = await fetch("/api/customers?perPage=1000").then((r) =>
          r.json(),
        );
        if (isMounted && res.customers) {
          setFetchedCustomers(res.customers);
        }
      } catch (err) {
        console.error("Failed to load customers for Trip Plan:", err);
      }
    }
    loadCustomers();
    return () => {
      isMounted = false;
    };
  }, [initialCustomers]);

  // 4. Products
  useEffect(() => {
    if (initialProducts !== undefined) return;

    let isMounted = true;
    async function loadProducts() {
      try {
        const res = await fetch("/api/products?status=ACTIVE&perPage=1000").then(
          (r) => r.json(),
        );
        if (isMounted && res.products) {
          setFetchedProducts(res.products);
        }
      } catch (err) {
        console.error("Failed to load products for Trip Plan:", err);
      }
    }
    loadProducts();
    return () => {
      isMounted = false;
    };
  }, [initialProducts]);

  // 5. Demo plots
  useEffect(() => {
    if (initialDemoPlots !== undefined) return;

    let isMounted = true;
    async function loadDemoPlots() {
      try {
        const res = await getDemoPlotsAction();
        if (isMounted && res.success && res.demoPlots) {
          setFetchedDemoPlots(res.demoPlots);
        }
      } catch (err) {
        console.error("Failed to load demo plots for Trip Plan:", err);
      }
    }
    loadDemoPlots();
    return () => {
      isMounted = false;
    };
  }, [initialDemoPlots]);

  // 6. Follow-up demo plots
  useEffect(() => {
    let isMounted = true;
    async function loadFollowUpPlots() {
      try {
        const res = await getFollowUpDemoPlotsAction();
        if (isMounted && res.success && res.demoPlots) {
          setFetchedFollowUpDemoPlots(res.demoPlots);
        }
      } catch (err) {
        console.error(
          "Failed to load follow-up demo plots for Trip Plan:",
          err,
        );
      }
    }
    loadFollowUpPlots();
    return () => {
      isMounted = false;
    };
  }, []);

  // 7. Activity Types
  useEffect(() => {
    if (initialActivityTypes !== undefined) return;

    let isMounted = true;
    async function loadActivityTypes() {
      try {
        const { getActivityTypesAction } = await import(
          "@/modules/activity-plans/server/actions"
        );
        const res = await getActivityTypesAction();
        if (isMounted && res && res.success && res.types) {
          setFetchedActivityTypes(res.types);
        }
      } catch (err) {
        console.error("Failed to load activity types for Trip Plan:", err);
      }
    }
    loadActivityTypes();
    return () => {
      isMounted = false;
    };
  }, [initialActivityTypes]);

  const activeWorkTypeOptions = useMemo(() => {
    const source =
      initialActivityTypes !== undefined
        ? initialActivityTypes
        : fetchedActivityTypes;

    if (source && source.length > 0) {
      return [...source]
        .filter((t) => t.isActive !== false)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((t) => ({
          ...t,
          displayName: getWorkTypeName(t.code) || t.name,
        }));
    }

    return [];
  }, [initialActivityTypes, fetchedActivityTypes]);

  return {
    customersList,
    productsList,
    productCategoriesList,
    demoPlotsList,
    fetchedFollowUpDemoPlots,
    activeWorkTypeOptions,
    fetchedMaterialsByCategory,
  };
}
