"use client";

import React from "react";
import ProductManagementSettingsView from "./settings-view";
import { Layers } from "lucide-react";

export default function CategorySettingsView() {
  return (
    <ProductManagementSettingsView
      title="หมวดสินค้า"
      icon={Layers}
      apiPath="/api/products/categories"
      entityKey="categories"
      entityLabel="หมวดสินค้า"
      gradientFrom="from-purple-600"
      gradientTo="to-violet-600"
      accentColor="#9333ea"
    />
  );
}
