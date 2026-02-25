"use client";

import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency-utils";

interface YearlyTargetCardProps {
    year: number;
    totalTarget: number;
}

export function YearlyTargetCard({ year, totalTarget }: YearlyTargetCardProps) {
    return (
        <Card className="relative overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
            {/* Decorative Gradient Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-transparent to-indigo-500/10 pointer-events-none" />
            <CardHeader className="relative pb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className="relative">
                            <div className="absolute inset-0 rounded-2xl bg-emerald-400 blur-md opacity-30" />
                            <div className="relative p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/30">
                                <Sparkles className="w-6 h-6 text-emerald-400" />
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <CardTitle className="text-lg font-semibold tracking-tight">
                                เป้าหมายรวมทั้งปี {year}
                            </CardTitle>
                            <p className="text-sm text-slate-400">
                                กำหนดเป้าหมายยอดขายรวมของปี
                            </p>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                    {/* KPI Value */}
                    <div>
                        <p className="text-sm text-slate-400 mb-1">รวมเป้าหมายทั้งปี</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl sm:text-4xl font-bold text-emerald-400 tracking-tight">
                                {formatCurrency(totalTarget)}
                            </span>
                            <span className="text-xs text-slate-500">THB</span>
                        </div>
                    </div>

                    {/* Hint / Status */}
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs text-slate-300">
                            คำนวณจากเป้าหมายรายเดือน
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
