"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

export function AggregateReportDashboard() {
  return (
    <div className="relative flex items-center justify-center min-h-[70vh] overflow-hidden">
      {/* 🌈 background blur */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl animate-pulse delay-300" />

      <Card className="relative max-w-lg w-full rounded-3xl shadow-2xl text-center p-8 bg-white/80 backdrop-blur border border-white/50 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <CardContent className="flex flex-col items-center space-y-6">
          {/* 🐻 Cartoon GIF */}
          <div className="animate-[float_2s_ease-in-out_infinite]">
            <Image
              src="/images/wait.gif"
              alt="Waiting animation"
              width={180}
              height={180}
              priority
              unoptimized
            />
          </div>

          <h1 className="text-3xl font-extrabold text-primary">
            อยู่ระหว่างดำเนินการ
          </h1>

          <p className="text-muted-foreground text-sm leading-relaxed">
            ระบบกำลังอยู่ระหว่างพัฒนา ⏳
          </p>

          {/* ⏳ loading dots */}
          <div className="flex gap-1 pt-1">
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
