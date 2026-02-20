"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { RBACSummaryResponse } from "../_types";

/**
 * Hook to fetch and manage RBAC summary data
 */
export function useRBACSummary() {
  const [summary, setSummary] = useState<RBACSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/rbac/summary", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("ไม่สามารถดึงข้อมูล RBAC ได้");
      }
      const payload: RBACSummaryResponse = await response.json();
      setSummary(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      setError(message);
      console.error("RBAC fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Sorted lists for UI
  const sortedRoles = useMemo(() => {
    if (!summary) return [];
    return [...summary.roles].sort((a, b) => {
      const ta = new Date((a as any).createdAt).getTime();
      const tb = new Date((b as any).createdAt).getTime();
      return tb - ta; // newest first
    });
  }, [summary]);

  const sortedPermissions = useMemo(() => {
    if (!summary) return [];
    return [...summary.permissions].sort((a, b) => {
      const ta = new Date((a as any).createdAt).getTime();
      const tb = new Date((b as any).createdAt).getTime();
      return tb - ta;
    });
  }, [summary]);

  const sortedDepartments = useMemo(() => {
    if (!summary) return [];
    return [...summary.departments].sort((a, b) => {
      const ta = new Date((a as any).createdAt).getTime();
      const tb = new Date((b as any).createdAt).getTime();
      return tb - ta;
    });
  }, [summary]);

  const sortedPositions = useMemo(() => {
    if (!summary) return [];
    return [...summary.positions].sort((a, b) => {
      const ta = new Date((a as any).createdAt).getTime();
      const tb = new Date((b as any).createdAt).getTime();
      return tb - ta;
    });
  }, [summary]);

  return {
    summary,
    isLoading,
    error,
    fetchSummary,
    sortedRoles,
    sortedPermissions,
    sortedDepartments,
    sortedPositions,
  };
}
