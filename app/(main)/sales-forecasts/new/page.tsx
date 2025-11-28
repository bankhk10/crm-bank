"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SalesForecastForm } from "@/components/features/sales-forecasts/sales-forecast-form";
import { CreateSalesForecastInput } from "@/types/sales-forecast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Employee {
  id: string;
  name: string;
  employeeCode?: string | null;
}

interface Product {
  id: string;
  name: string;
  productCode: string;
  unit?: string | null;
}

interface Customer {
  id: string;
  name: string;
  customerCode: string;
}

export default function NewSalesForecastPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [employeesRes, productsRes, customersRes] = await Promise.all([
          fetch("/api/employee"),
          fetch("/api/products"),
          fetch("/api/customers"),
        ]);

        if (employeesRes.ok) {
          const empData = await employeesRes.json();
          // API may return { employees: [...] } or { data: [...] } or an array directly
          const empList = empData.employees ?? empData.data ?? empData;
          setEmployees(Array.isArray(empList) ? empList : []);
        }

        if (productsRes.ok) {
          const prodData = await productsRes.json();
          const prodList = prodData.products ?? prodData.data ?? prodData;
          setProducts(Array.isArray(prodList) ? prodList : []);
        }

        if (customersRes.ok) {
          const custData = await customersRes.json();
          const custList = custData.customers ?? custData.data ?? custData;
          setCustomers(Array.isArray(custList) ? custList : []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (data: CreateSalesForecastInput) => {
    try {
      setLoading(true);
      const response = await fetch("/api/sales-forecasts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create sales forecast");
      }

      alert("สร้างการพยากรณ์การขายสำเร็จ");
      router.push("/sales-forecasts");
    } catch (error) {
      console.error("Error creating sales forecast:", error);
      alert(
        error instanceof Error
          ? error.message
          : "ไม่สามารถสร้างการพยากรณ์การขายได้"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>สร้างการพยากรณ์การขายใหม่</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesForecastForm
            employees={employees}
            products={products}
            customers={customers}
            onSubmit={handleSubmit}
            isLoading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
