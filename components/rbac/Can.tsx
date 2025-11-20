"use client";

import React from "react";
import { usePermission } from "@/hooks/use-permission";

type CanProps = {
  permission?: string | string[];
  fallback?: React.ReactNode | null;
  children: React.ReactNode;
};

export default function Can({ permission, fallback = null, children }: CanProps) {
  const { allowed, isLoading } = usePermission(permission);

  if (isLoading) return null;

  return allowed ? <>{children}</> : <>{fallback}</>;
}
