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
  customersLoading: boolean;
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
  const [customersLoading, setCustomersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setCustomersLoading(true);
    setError(null);

    const customersPromise = fetch("/api/customers?type=DEALER&perPage=1000")
      .then((r) => r.json())
      .then((customersData) => {
        setCustomers(customersData.customers || []);
      })
      .finally(() => {
        setCustomersLoading(false);
      });

    const employeesPromise = import("@/modules/employee/server/actions")
      .then(async ({ getEmployeesAction }) => {
        const res = await getEmployeesAction({ perPage: 1000 });
        return { employees: res.employees || [] };
      })
      .then((employeesData) => {
        setEmployees(
          (employeesData.employees || []).map((e: any) => ({
            id: e.id,
            name: e.name,
            employeeCode: e.employeeCode || undefined,
          })),
        );
      });

    const productsPromise = fetch("/api/products?status=ACTIVE&perPage=1000")
      .then((r) => r.json())
      .then((productsData) => {
        setProducts(
          (productsData.products || []).map((p: any) => ({
            ...p,
            promotionBudget:
              p.promotionBudget != null ? Number(p.promotionBudget) : null,
          })),
        );
      });

    const companiesPromise = getCompaniesAction().then((res) => {
      setCompanies(
        (res.companies || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          addressLine: c.addressLine || undefined,
          province: c.province || undefined,
          district: c.district || undefined,
          subdistrict: c.subdistrict || undefined,
          postalCode: c.postalCode || undefined,
        })),
      );
    });

    Promise.all([
      customersPromise,
      employeesPromise,
      productsPromise,
      companiesPromise,
    ])
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
    customersLoading,
    error,
  };
}

export default useSaleFormData;
