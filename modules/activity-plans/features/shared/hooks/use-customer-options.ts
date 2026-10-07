"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getDealerAndSubdealerCustomerOptionsAction,
  getFarmerCustomerOptionsAction,
} from "@/modules/activity-plans/server/actions";

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  customerType?: string | null;
  province?: string | null;
  district?: string | null;
  phoneNumber?: string | null;
}

export interface UseCustomerOptionsResult {
  storeOptions: CustomerOption[];
  loadingStores: boolean;
  farmerOptionsByProvince: Record<string, CustomerOption[]>;
  getFarmersForProvince: (province?: string | null) => CustomerOption[];
  loadFarmersForProvince: (province: string) => Promise<CustomerOption[]>;
  loadingFarmers: boolean;
}

/**
 * Shared hook for loading Dealer/Subdealer stores and Farmers by province
 * across TYPE_1, TYPE_2, and TYPE_7A forms.
 */
export function useCustomerOptions(selectedProvince?: string | null): UseCustomerOptionsResult {
  const [storeOptions, setStoreOptions] = useState<CustomerOption[]>([]);
  const [loadingStores, setLoadingStores] = useState<boolean>(false);
  const [farmerOptionsByProvince, setFarmerOptionsByProvince] = useState<
    Record<string, CustomerOption[]>
  >({});
  const [loadingFarmers, setLoadingFarmers] = useState<boolean>(false);

  const isMountedRef = useRef<boolean>(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 1. Load Dealer & Subdealer stores once
  useEffect(() => {
    async function loadStores() {
      setLoadingStores(true);
      try {
        const res = await getDealerAndSubdealerCustomerOptionsAction();
        if (isMountedRef.current && res && res.success && res.stores) {
          setStoreOptions(res.stores as CustomerOption[]);
        }
      } catch (err) {
        console.error("Failed to load dealer/subdealer store options:", err);
      } finally {
        if (isMountedRef.current) setLoadingStores(false);
      }
    }
    loadStores();
  }, []);

  // 2. Load Farmers for a given province (with in-memory cache)
  const loadFarmersForProvince = useCallback(
    async (province: string): Promise<CustomerOption[]> => {
      const cleanProv = province?.trim();
      if (!cleanProv) return [];

      if (farmerOptionsByProvince[cleanProv]) {
        return farmerOptionsByProvince[cleanProv];
      }

      setLoadingFarmers(true);
      try {
        const res = await getFarmerCustomerOptionsAction(cleanProv);
        if (isMountedRef.current && res && res.success && res.farmers) {
          const list = res.farmers as CustomerOption[];
          setFarmerOptionsByProvince((prev) => ({
            ...prev,
            [cleanProv]: list,
          }));
          return list;
        }
        return [];
      } catch (err) {
        console.error(`Failed to load farmers for province ${cleanProv}:`, err);
        return [];
      } finally {
        if (isMountedRef.current) setLoadingFarmers(false);
      }
    },
    [farmerOptionsByProvince],
  );

  // 3. Trigger loading if selectedProvince is passed
  useEffect(() => {
    const cleanProv = selectedProvince?.trim();
    if (cleanProv) {
      loadFarmersForProvince(cleanProv);
    }
  }, [selectedProvince, loadFarmersForProvince]);

  const getFarmersForProvince = useCallback(
    (province?: string | null): CustomerOption[] => {
      const cleanProv = province?.trim();
      if (!cleanProv) return [];
      return farmerOptionsByProvince[cleanProv] || [];
    },
    [farmerOptionsByProvince],
  );

  return {
    storeOptions,
    loadingStores,
    farmerOptionsByProvince,
    getFarmersForProvince,
    loadFarmersForProvince,
    loadingFarmers,
  };
}
