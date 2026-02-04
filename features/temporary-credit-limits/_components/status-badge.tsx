import { cn } from "@/lib/utils";
import type { TemporaryCreditStatus } from "@/types/temporary-credit-limit";
import { STATUS_STYLES, DEFAULT_BADGE_STYLE } from "../_lib/constants";

export function StatusBadge({
    status,
    className,
}: {
    status?: string;
    className?: string;
}) {
    const key = (status || "").toUpperCase() as TemporaryCreditStatus;
    const info = STATUS_STYLES[key] ?? {
        ...DEFAULT_BADGE_STYLE,
        label: key || "ไม่ระบุ",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
                info.className,
                className
            )}
        >
            <span
                className={cn("h-2 w-2 rounded-full", info.dot)}
                aria-hidden="true"
            />
            {info.label}
        </span>
    );
}
