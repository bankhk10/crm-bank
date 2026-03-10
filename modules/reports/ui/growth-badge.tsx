import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, Minus } from "lucide-react";

export function GrowthBadge({ pct }: { pct: number }) {
    if (pct > 0)
        return (
            <Badge className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold text-xs">
                <ChevronUp className="h-3 w-3" />+{pct.toFixed(1)}%
            </Badge>
        );
    if (pct < 0)
        return (
            <Badge className="gap-1 bg-red-50 text-red-700 border-red-200 font-semibold text-xs">
                <ChevronDown className="h-3 w-3" />
                {pct.toFixed(1)}%
            </Badge>
        );
    return (
        <Badge className="gap-1 bg-slate-100 text-slate-500 border-slate-200 font-semibold text-xs">
            <Minus className="h-3 w-3" />
            0%
        </Badge>
    );
}
