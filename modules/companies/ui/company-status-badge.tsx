import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_STYLES, DEFAULT_STATUS_STYLE } from "@/modules/companies/constants";

export function CompanyStatusBadge({ status }: { status?: string }) {
    // Try direct match or fallback
    const style = STATUS_STYLES[status || ""] || DEFAULT_STATUS_STYLE;

    return (
        <Badge
            variant="outline"
            className={cn(
                "pl-1.5 pr-2.5 py-0.5 border-0 font-medium transition-colors cursor-default",
                style.className
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
