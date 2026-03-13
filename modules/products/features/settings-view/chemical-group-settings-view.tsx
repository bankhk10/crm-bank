"use client";

import React from "react";
import ProductManagementSettingsView from "./settings-view";
import { Beaker } from "lucide-react";

export default function ChemicalGroupSettingsView() {
  return (
    <ProductManagementSettingsView
      title="กลุ่มสินค้า"
      icon={Beaker}
      apiPath="/api/products/chemical-groups"
      entityKey="chemicalGroups"
      entityLabel="กลุ่มสินค้า"
      gradientFrom="from-blue-600"
      gradientTo="to-cyan-600"
      accentColor="#2563eb"
      nameLabel="ชื่อ"
    />
  );
}
