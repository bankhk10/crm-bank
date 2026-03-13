"use client";

import React from "react";
import ProductManagementSettingsView from "./settings-view";
import { Tag } from "lucide-react";

export default function BrandSettingsView() {
  return (
    <ProductManagementSettingsView
      title="แบรนด์สินค้า"
      icon={Tag}
      apiPath="/api/products/brands"
      entityKey="brands"
      entityLabel="แบรนด์"
      gradientFrom="from-blue-600"
      gradientTo="to-indigo-600"
      accentColor="#2563eb"
    />
  );
}
