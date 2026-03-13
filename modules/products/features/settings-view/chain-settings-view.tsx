"use client";

import React from "react";
import ProductManagementSettingsView from "./settings-view";
import { Link2 } from "lucide-react";

export default function ChainSettingsView() {
  return (
    <ProductManagementSettingsView
      title="ประเภท (ABC Code)"
      icon={Link2}
      apiPath="/api/products/chains"
      entityKey="abcTypes"
      entityLabel="ประเภท (ABC Code)"
      gradientFrom="from-indigo-600"
      gradientTo="to-purple-600"
      accentColor="#4f46e5"
      nameLabel="ชื่อ"
    />
  );
}
