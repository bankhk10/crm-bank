"use client";

import { useState, useCallback } from "react";

/**
 * Form Field Errors Hook
 * Manages field-level validation errors for forms
 */
export function useFormErrors() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear a specific field error
   */
  const clearFieldError = useCallback((field: string) => {
    setFieldErrors((prev) => {
      if (!prev || !(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  /**
   * Set multiple field errors at once
   */
  const setFieldErrorsFromValidation = useCallback(
    (errors: Record<string, string[]>) => {
      setFieldErrors(errors);
      // Set first error as the main error message
      const firstError = Object.values(errors).flat()[0];
      if (firstError) {
        setError(firstError);
      }
    },
    []
  );

  /**
   * Clear all errors
   */
  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
    setError(null);
  }, []);

  /**
   * Add a single error to a field
   */
  const addFieldError = useCallback((field: string, message: string) => {
    setFieldErrors((prev) => ({
      ...prev,
      [field]: [message],
    }));
  }, []);

  /**
   * Get error for a specific field
   */
  const getFieldError = useCallback(
    (field: string): string | undefined => {
      return fieldErrors[field]?.[0];
    },
    [fieldErrors]
  );

  return {
    fieldErrors,
    error,
    setError,
    clearFieldError,
    setFieldErrors,
    setFieldErrorsFromValidation,
    clearAllErrors,
    addFieldError,
    getFieldError,
  };
}
