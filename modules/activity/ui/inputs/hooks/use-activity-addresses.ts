"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

export interface AddressSubdistrict {
  id: number | string;
  name: string;
  postalCode: string;
}

export interface AddressDistrict {
  id: number | string;
  name: string;
  subdistricts: AddressSubdistrict[];
}

export interface AddressProvince {
  id: number | string;
  name: string;
  districts: AddressDistrict[];
}

export interface UseActivityAddressesResult {
  provinces: Array<{ value: string; label: string }>;
  provincesData: AddressProvince[];
  getDistricts: (provinceName?: string | null) => Array<{ value: string; label: string }>;
  getSubdistricts: (
    provinceName?: string | null,
    districtName?: string | null
  ) => Array<{ value: string; label: string; postalCode: string }>;
  getPostalCode: (
    provinceName?: string | null,
    districtName?: string | null,
    subdistrictName?: string | null
  ) => string;
  isLoading: boolean;
  error: Error | null;
}

// In-memory module cache to avoid redundant API requests across components
let cachedAddresses: AddressProvince[] | null = null;
let fetchPromise: Promise<AddressProvince[]> | null = null;

async function fetchThaiAddresses(): Promise<AddressProvince[]> {
  if (cachedAddresses) return cachedAddresses;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch("/api/thai-addresses")
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to load thai addresses: ${res.statusText}`);
      }
      return res.json();
    })
    .then((json: any[]) => {
      if (!Array.isArray(json)) {
        throw new Error("Invalid address dataset format received");
      }
      const normalized: AddressProvince[] = json.map((p) => ({
        id: p.id,
        name: p.name_th || p.name,
        districts: (p.districts || []).map((d: any) => ({
          id: d.id,
          name: d.name_th || d.name,
          subdistricts: (d.sub_districts || []).map((s: any) => ({
            id: s.id,
            name: s.name_th || s.name,
            postalCode: String(s.zip_code ?? ""),
          })),
        })),
      }));
      cachedAddresses = normalized;
      return normalized;
    })
    .finally(() => {
      fetchPromise = null;
    });

  return fetchPromise;
}

/**
 * useActivityAddresses
 *
 * Dedicated hook for Activity Plan forms to load, query, and cache Thai address data
 * (Province -> District -> Subdistrict -> Postal Code) with in-memory caching.
 */
export function useActivityAddresses(): UseActivityAddressesResult {
  const [provincesData, setProvincesData] = useState<AddressProvince[]>(
    () => cachedAddresses || []
  );
  const [isLoading, setIsLoading] = useState<boolean>(!cachedAddresses);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (cachedAddresses) {
      setProvincesData(cachedAddresses);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    fetchThaiAddresses()
      .then((data) => {
        if (isMounted) {
          setProvincesData(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("useActivityAddresses: Failed to load address data:", err);
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const provinces = useMemo(() => {
    return provincesData.map((p) => ({
      value: p.name,
      label: p.name,
    }));
  }, [provincesData]);

  const getDistricts = useCallback(
    (provinceName?: string | null): Array<{ value: string; label: string }> => {
      const cleanProv = provinceName?.trim();
      if (!cleanProv) return [];
      const matched = provincesData.find((p) => p.name === cleanProv);
      if (!matched) return [];
      return matched.districts.map((d) => ({
        value: d.name,
        label: d.name,
      }));
    },
    [provincesData]
  );

  const getSubdistricts = useCallback(
    (
      provinceName?: string | null,
      districtName?: string | null
    ): Array<{ value: string; label: string; postalCode: string }> => {
      const cleanProv = provinceName?.trim();
      const cleanDist = districtName?.trim();
      if (!cleanProv || !cleanDist) return [];

      const matchedProv = provincesData.find((p) => p.name === cleanProv);
      if (!matchedProv) return [];

      const matchedDist = matchedProv.districts.find((d) => d.name === cleanDist);
      if (!matchedDist) return [];

      return matchedDist.subdistricts.map((s) => ({
        value: s.name,
        label: s.name,
        postalCode: s.postalCode,
      }));
    },
    [provincesData]
  );

  const getPostalCode = useCallback(
    (
      provinceName?: string | null,
      districtName?: string | null,
      subdistrictName?: string | null
    ): string => {
      const cleanProv = provinceName?.trim();
      const cleanDist = districtName?.trim();
      const cleanSub = subdistrictName?.trim();
      if (!cleanProv || !cleanDist || !cleanSub) return "";

      const matchedProv = provincesData.find((p) => p.name === cleanProv);
      const matchedDist = matchedProv?.districts.find((d) => d.name === cleanDist);
      const matchedSub = matchedDist?.subdistricts.find((s) => s.name === cleanSub);

      return matchedSub?.postalCode || "";
    },
    [provincesData]
  );

  return {
    provinces,
    provincesData,
    getDistricts,
    getSubdistricts,
    getPostalCode,
    isLoading,
    error,
  };
}
