"use client";

import RBACConsole from "./rbac-console";

export default function RBACListView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">RBAC ศูนย์ควบคุมสิทธิ์</h1>
        <p className="text-sm text-slate-500">
          จัดการ Role, Permission, Department และ Mapping ต่าง ๆ
        </p>
      </div>
      <RBACConsole />
    </div>
  );
}
