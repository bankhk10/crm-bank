"use client";

import React from "react";
import ProductManagementSettingsView from "./settings-view";
import { FolderTree } from "lucide-react";

export default function GroupSettingsView() {
  return (
    <ProductManagementSettingsView
      title="กลุ่มชื่อการค้า"
      icon={FolderTree}
      apiPath="/api/products/groups"
      entityKey="groups"
      entityLabel="กลุ่มชื่อการค้า"
      gradientFrom="from-emerald-600"
      gradientTo="to-teal-600"
      accentColor="#059669"
    />
  );
}
