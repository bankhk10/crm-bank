"use client";

import React from "react";
import { useParams } from "next/navigation";
import { EmployeeFormWrapper } from "./employee-form-wrapper";

export default function EmployeeEditView() {
    const { employeeId } = useParams() as { employeeId: string };
    return <EmployeeFormWrapper employeeId={employeeId} />;
}
