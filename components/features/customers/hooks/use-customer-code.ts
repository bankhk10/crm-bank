"use client";

import { useState, useCallback, useEffect } from "react";

/**
 * Customer Code Generator Hook
 * Fetches next customer code from API or generates a fallback
 */
export function useCustomerCode(initialCode?: string) {
  const [customerCode, setCustomerCode] = useState<string>(initialCode || "");
  const [loading, setLoading] = useState<boolean>(!initialCode);

  const fetchNextCode = useCallback(async () => {
    try {
      const res = await fetch(`/api/customers/next-code`);
      const json = await res.json();
      if (res.ok && json.nextCode) {
        return json.nextCode as string;
      }
    } catch (err) {
      // ignore and fallback
    }
    return null;
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!initialCode) {
        setLoading(true);
        const next = await fetchNextCode();
        if (mounted) {
          if (next) {
            setCustomerCode(next);
          } else {
            // fallback: generate simple code based on timestamp
            setCustomerCode(`C${String(Date.now()).slice(-5)}`);
          }
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [initialCode, fetchNextCode]);

  return {
    customerCode,
    setCustomerCode,
    loading,
    fetchNextCode,
  };
}
