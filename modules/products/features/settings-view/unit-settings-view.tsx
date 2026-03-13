"use client";

import React from "react";
import ProductManagementSettingsView from "./settings-view";
import { Ruler } from "lucide-react";

export default function UnitSettingsView() {
  return (
    <ProductManagementSettingsView
      title="หน่วยนับ"
      icon={Ruler}
      apiPath="/api/products/units"
      entityKey="units"
      entityLabel="หน่วยนับ"
      gradientFrom="from-slate-600"
      gradientTo="to-slate-800"
      accentColor="#475569"
    />
  );
}
