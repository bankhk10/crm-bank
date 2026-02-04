import { cn } from "@/lib/utils";

export function TruncatedCell({
    value,
    className,
}: {
    value: string;
    className?: string;
}) {
    return (
        <div className={cn("truncate", className)} title={value}>
            {value}
        </div>
    );
}
