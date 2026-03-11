"use client";

/**
 * useSaleFormData Hook
 * Manages API data loading for sale form (customers, employees, products, companies)
 */

import { useState, useEffect } from "react";
import { getCompaniesAction } from "@/modules/companies/server/actions";
import type {
  SaleFormCustomer,
  SaleFormEmployee,
  SaleFormProduct,
  SaleFormCompany,
} from "../../types";

interface SaleFormData {
  customers: SaleFormCustomer[];
  employees: SaleFormEmployee[];
  products: SaleFormProduct[];
  companies: SaleFormCompany[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to load all required data for sale form
 */
export function useSaleFormData(): SaleFormData {
  const [customers, setCustomers] = useState<SaleFormCustomer[]>([]);
  const [employees, setEmployees] = useState<SaleFormEmployee[]>([]);
  const [products, setProducts] = useState<SaleFormProduct[]>([]);
  const [companies, setCompanies] = useState<SaleFormCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      fetch("/api/customers?type=DEALER").then((r) => r.json()),
      import("@/modules/employee/server/actions").then(
        async ({ getEmployeesAction }) => {
          const res = await getEmployeesAction();
          return { employees: res.employees || [] };
        },
      ),
      fetch("/api/products?status=ACTIVE&perPage=100").then((r) => r.json()),
      getCompaniesAction().then((res) => {
        return { companies: res.companies || [] };
      }),
    ])
      .then(([customersData, employeesData, productsData, companiesData]) => {
        setCustomers(customersData.customers || []);
        setEmployees(
          (employeesData.employees || []).map((e: any) => ({
            id: e.id,
            name: e.name,
            employeeCode: e.employeeCode || undefined,
          })),
        );
        setProducts(productsData.products || []);
        setCompanies(
          (companiesData.companies || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            addressLine: c.addressLine || undefined,
            province: c.province || undefined,
            district: c.district || undefined,
            subdistrict: c.subdistrict || undefined,
            postalCode: c.postalCode || undefined,
          })),
        );
      })
      .catch((err) => {
        console.error("Error loading data:", err);
        setError("ไม่สามารถโหลดข้อมูลได้");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return {
    customers,
    employees,
    products,
    companies,
    loading,
    error,
  };
}

export default useSaleFormData;
