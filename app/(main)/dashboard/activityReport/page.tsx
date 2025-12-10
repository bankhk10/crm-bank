"use client";

import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function InProgressPage() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] from-gray-100 to-gray-200">
      <Card className="max-w-sm w-full rounded-2xl shadow-lg text-center p-6 sm:p-10">
        <CardContent className="flex flex-col items-center space-y-4">
          <Construction className="w-16 h-16 text-primary" />

          <h1 className="text-3xl font-bold text-primary">
            อยู่ระหว่างดำเนินการ
          </h1>

          <p className="text-muted-foreground text-sm leading-relaxed">
            หน้านี้กำลังอยู่ระหว่างการปรับแต่งและพัฒนา
            <br />
            โปรดกลับมาอีกครั้งในภายหลัง
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
