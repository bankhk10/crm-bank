"use client";

import { Loader2, Package, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/src/shared/utils/currency.utils";
import { MONTHS } from "@/features/sales-targets/_lib/constants";

interface ProductGroupTargetsTabProps {
    productGroups: { value: string; label: string }[];
    targets: Record<string, Record<number, number>>;
    onChange: (group: string, month: number, value: number) => void;
    onSave: () => void;
    saving: boolean;
}

export function ProductGroupTargetsTab({
    productGroups,
    targets,
    onChange,
    onSave,
    saving,
}: ProductGroupTargetsTabProps) {
    const calculateTotal = (group: string) => {
        return Object.values(targets[group] || {}).reduce(
            (sum, val) => sum + (val || 0),
            0,
        );
    };

    return (
        <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100">
                            <Package className="w-5 h-5 text-purple-600" />
                        </div>
                        <CardTitle>เป้าหมายตามกลุ่มสินค้า</CardTitle>
                    </div>
                    <Button
                        onClick={onSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white shadow-lg shadow-purple-500/25"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        บันทึก
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-6">
                    {productGroups.map((group) => (
                        <div key={group.value} className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-violet-600" />
                                    {group.label}
                                </h3>
                                <span className="text-sm font-medium text-purple-600">
                                    รวม: ฿{formatCurrency(calculateTotal(group.value))}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                                {MONTHS.map((month) => (
                                    <div
                                        key={`${group.value}-${month.value}`}
                                        className="p-2 rounded-lg bg-purple-50/50 border border-purple-100"
                                    >
                                        <Label className="text-xs text-slate-500 block mb-1">
                                            {month.label.slice(0, 3)}.
                                        </Label>
                                        <Input
                                            type="number"
                                            onWheel={(e) => e.currentTarget.blur()}
                                            value={targets[group.value]?.[month.value] || ""}
                                            onChange={(e) =>
                                                onChange(
                                                    group.value,
                                                    month.value,
                                                    parseFloat(e.target.value) || 0,
                                                )
                                            }
                                            placeholder="0"
                                            className="h-9 text-sm bg-white border-purple-200"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
