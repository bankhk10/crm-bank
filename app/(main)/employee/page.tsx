"use client";

import { EmployeeTable } from "@/modules/employee";
import { Users } from "lucide-react";

export default function EmployeePage() {
  return (
    <section className="space-y-6">
      <div className="bg-white shadow-sm sm:rounded-lg">
        <div className="p-6">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-3">
              <Users className="w-9 h-9 text-blue-600" />
              <h1 className="text-3xl font-bold tracking-tight">
                ข้อมูลพนักงาน
              </h1>
            </div>
          </div>
          <EmployeeTable />
        </div>
      </div>
    </section>
  );
}
