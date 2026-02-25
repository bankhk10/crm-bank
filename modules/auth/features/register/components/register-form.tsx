"use client";

import { Card } from "@/components/ui/card";

export default function RegisterForm() {
  return (
    <Card className="space-y-4 p-6">
      <h2 className="text-xl font-semibold">สร้างบัญชีไม่ได้</h2>
      <p className="text-sm text-slate-500">การสมัครสมาชิกแบบสาธารณะถูกปิดไว้ — ผู้ดูแลระบบจะเป็นผู้สร้างผู้ใช้งานเท่านั้น</p>
    </Card>
  );
}
