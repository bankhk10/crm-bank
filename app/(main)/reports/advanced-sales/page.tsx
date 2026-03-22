import { Metadata } from "next";
import AdvancedSalesClient from "./advanced-sales-client";

export const metadata: Metadata = {
  title: "รายงานการขายเชิงลึก | CRM Bank",
  description: "Advanced Sales Report (Mockup)",
};

export default function AdvancedSalesPage() {
  return <AdvancedSalesClient />;
}
