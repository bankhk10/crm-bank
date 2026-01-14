"use client";

/**
 * useSaleFormData Hook
 * Manages API data loading for sale form (customers, employees, products, companies)
 */

import { useState, useEffect } from "react";
import type {
  SaleFormCustomer,
  SaleFormEmployee,
  SaleFormProduct,
  SaleFormCompany,
} from "../types";

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
      fetch("/api/employee").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/companies?perPage=100&status=ACTIVE").then((r) => r.json()),
    ])
      .then(([customersData, employeesData, productsData, companiesData]) => {
        setCustomers(customersData.customers || []);
        setEmployees(employeesData.employees || []);
        setProducts(productsData.products || []);
        setCompanies(companiesData.companies || []);
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
