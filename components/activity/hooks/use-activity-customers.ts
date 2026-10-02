"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  getDealerAndSubdealerCustomerOptionsAction,
  getFarmerCustomerOptionsAction,
} from "@/modules/activity-plans/server/actions";

export type ActivityCustomerType =
  | "FARMER"
  | "STORE"
  | "DEALER"
  | "SUBDEALER"
  | "BROKER";

export interface ActivityCustomerItem {
  id: string;
  name: string;
  customerCode?: string | null;
  customerType: "DEALER" | "SUBDEALER" | "FARMER" | "BROKER";
  province?: string | null;
  district?: string | null;
  phoneNumber?: string | null;
  parentDealerId?: string | null;
}

export interface UseActivityCustomersOptions {
  selectedProvince?: string | null;
  customers?: ActivityCustomerItem[];
}

export interface UseActivityCustomersResult {
  storeOptions: ActivityCustomerItem[];
  dealerOptions: ActivityCustomerItem[];
  subdealerOptions: ActivityCustomerItem[];
  brokerOptions: ActivityCustomerItem[];
  farmerOptions: ActivityCustomerItem[];
  farmerOptionsByProvince: Record<string, ActivityCustomerItem[]>;
  getFarmersForProvince: (province?: string | null) => ActivityCustomerItem[];
  loadFarmersForProvince: (province: string) => Promise<ActivityCustomerItem[]>;
  loadingStores: boolean;
  loadingFarmers: boolean;
}

// Module-level in-memory cache to prevent repeated API calls
let cachedStores: ActivityCustomerItem[] | null = null;
let fetchStoresPromise: Promise<ActivityCustomerItem[]> | null = null;
const cachedFarmersByProvince: Record<string, ActivityCustomerItem[]> = {};
const fetchFarmersPromises: Record<string, Promise<ActivityCustomerItem[]>> = {};

async function fetchStoresData(): Promise<ActivityCustomerItem[]> {
  if (cachedStores) return cachedStores;
  if (fetchStoresPromise) return fetchStoresPromise;

  fetchStoresPromise = getDealerAndSubdealerCustomerOptionsAction()
    .then((res) => {
      if (res && res.success && Array.isArray(res.stores)) {
        const stores = res.stores as ActivityCustomerItem[];
        cachedStores = stores;
        return stores;
      }
      return [];
    })
    .catch((err) => {
      console.error("Failed to fetch dealer and subdealer customer options:", err);
      return [];
    })
    .finally(() => {
      fetchStoresPromise = null;
    });

  return fetchStoresPromise;
}

async function fetchFarmersData(province: string): Promise<ActivityCustomerItem[]> {
  const cleanProv = province?.trim();
  if (!cleanProv) return [];
  if (cachedFarmersByProvince[cleanProv]) return cachedFarmersByProvince[cleanProv];
  if (fetchFarmersPromises[cleanProv]) return fetchFarmersPromises[cleanProv];

  fetchFarmersPromises[cleanProv] = getFarmerCustomerOptionsAction(cleanProv)
    .then((res) => {
      if (res && res.success && Array.isArray(res.farmers)) {
        const farmers = res.farmers as ActivityCustomerItem[];
        cachedFarmersByProvince[cleanProv] = farmers;
        return farmers;
      }
      return [];
    })
    .catch((err) => {
      console.error(`Failed to fetch farmer options for province ${cleanProv}:`, err);
      return [];
    })
    .finally(() => {
      delete fetchFarmersPromises[cleanProv];
    });

  return fetchFarmersPromises[cleanProv];
}

/**
 * useActivityCustomers
 *
 * Dedicated hook for Activity Plan forms to load, query, and cache customer options
 * for FARMER, STORE (Dealer+Subdealer), DEALER, SUBDEALER, and BROKER.
 */
export function useActivityCustomers(
  options?: UseActivityCustomersOptions
): UseActivityCustomersResult {
  const { selectedProvince, customers = [] } = options || {};

  const [stores, setStores] = useState<ActivityCustomerItem[]>(
    () => cachedStores || []
  );
  const [loadingStores, setLoadingStores] = useState<boolean>(!cachedStores);

  const [farmerCache, setFarmerCache] = useState<
    Record<string, ActivityCustomerItem[]>
  >(() => ({ ...cachedFarmersByProvince }));
  const [loadingFarmers, setLoadingFarmers] = useState<boolean>(false);

  const isMountedRef = useRef<boolean>(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 1. Fetch and cache Stores (DEALER + SUBDEALER)
  useEffect(() => {
    if (cachedStores) {
      setStores(cachedStores);
      setLoadingStores(false);
      return;
    }

    setLoadingStores(true);
    fetchStoresData()
      .then((data) => {
        if (isMountedRef.current) {
          setStores(data);
        }
      })
      .finally(() => {
        if (isMountedRef.current) {
          setLoadingStores(false);
        }
      });
  }, []);

  // 2. Load Farmers for a given province
  const loadFarmersForProvince = useCallback(
    async (province: string): Promise<ActivityCustomerItem[]> => {
      const cleanProv = province?.trim();
      if (!cleanProv) return [];

      if (cachedFarmersByProvince[cleanProv]) {
        return cachedFarmersByProvince[cleanProv];
      }

      setLoadingFarmers(true);
      try {
        const list = await fetchFarmersData(cleanProv);
        if (isMountedRef.current) {
          setFarmerCache((prev) => ({
            ...prev,
            [cleanProv]: list,
          }));
        }
        return list;
      } finally {
        if (isMountedRef.current) {
          setLoadingFarmers(false);
        }
      }
    },
    []
  );

  // 3. Trigger farmer loading when selectedProvince changes
  useEffect(() => {
    const cleanProv = selectedProvince?.trim();
    if (cleanProv) {
      loadFarmersForProvince(cleanProv);
    }
  }, [selectedProvince, loadFarmersForProvince]);

  // Combined Stores (from API + customer props)
  const storeOptions = useMemo(() => {
    const map = new Map<string, ActivityCustomerItem>();
    stores.forEach((s) => map.set(s.id, s));
    customers.forEach((c) => {
      if (
        (c.customerType === "DEALER" || c.customerType === "SUBDEALER") &&
        !map.has(c.id)
      ) {
        map.set(c.id, c);
      }
    });
    return Array.from(map.values());
  }, [stores, customers]);

  // Filter DEALER only
  const dealerOptions = useMemo(() => {
    return storeOptions.filter(
      (s) => s.customerType === "DEALER" || !s.customerType
    );
  }, [storeOptions]);

  // Filter SUBDEALER only
  const subdealerOptions = useMemo(() => {
    return storeOptions.filter((s) => s.customerType === "SUBDEALER");
  }, [storeOptions]);

  // Filter BROKER from master list
  const brokerOptions = useMemo(() => {
    return customers.filter((c) => c.customerType === "BROKER");
  }, [customers]);

  // Query farmers for a specific province
  const getFarmersForProvince = useCallback(
    (province?: string | null): ActivityCustomerItem[] => {
      const cleanProv = province?.trim();
      if (!cleanProv) return [];

      const apiList = farmerCache[cleanProv] || cachedFarmersByProvince[cleanProv] || [];
      const map = new Map<string, ActivityCustomerItem>();
      apiList.forEach((f) => map.set(f.id, f));

      customers.forEach((c) => {
        if (
          c.customerType === "FARMER" &&
          c.province?.trim() === cleanProv &&
          !map.has(c.id)
        ) {
          map.set(c.id, c);
        }
      });

      return Array.from(map.values());
    },
    [farmerCache, customers]
  );

  const farmerOptions = useMemo(() => {
    return getFarmersForProvince(selectedProvince);
  }, [getFarmersForProvince, selectedProvince]);

  return {
    storeOptions,
    dealerOptions,
    subdealerOptions,
    brokerOptions,
    farmerOptions,
    farmerOptionsByProvince: farmerCache,
    getFarmersForProvince,
    loadFarmersForProvince,
    loadingStores,
    loadingFarmers,
  };
}
