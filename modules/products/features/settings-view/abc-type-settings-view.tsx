"use client";

import React from "react";
import ProductManagementSettingsView from "./settings-view";
import { ListChecks } from "lucide-react";

export default function ABCTypeSettingsView() {
  return (
    <ProductManagementSettingsView
      title="ประเภท (ABC Code)"
      icon={ListChecks}
      apiPath="/api/products/abc-types"
      entityKey="abcTypes"
      entityLabel="ประเภท (ABC Code)"
      gradientFrom="from-indigo-600"
      gradientTo="to-purple-600"
      accentColor="#4f46e5"
      nameLabel="ชื่อ"
    />
  );
}
