import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_STYLE, DEFAULT_BADGE_STYLE } from "../constants";
import type { SaleStatus } from "../types/types";

export function StatusBadge({
    status,
    className,
}: {
    status?: string;
    className?: string;
}) {
    const style =
        STATUS_STYLE[status as SaleStatus] || DEFAULT_BADGE_STYLE;

    return (
        <Badge
            variant="outline"
            className={cn(
                "pl-1.5 pr-2.5 py-0.5 border-0 font-medium transition-colors cursor-default",
                style.className,
                className
            )}
        >
            <div className="flex items-center gap-1.5">
                <span
                    className={cn("h-1.5 w-1.5 rounded-full", style.dot)}
                    aria-hidden="true"
                />
                {style.label}
            </div>
        </Badge>
    );
}
