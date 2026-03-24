import { Card, CardContent } from "@/components/ui/card";

export function KpiCard({
    label,
    sublabel,
    value,
    sub,
    icon: Icon,
    gradient,
    ring,
    barColor,
    barWidth,
    topColor,
}: {
    label: string;
    sublabel?: string;
    value: string;
    sub?: React.ReactNode;
    icon: React.ElementType;
    gradient: string;
    ring: string;
    barColor: string;
    barWidth: string;
    topColor?: "red" | "black";
}) {
    const topBorderClass = topColor === "red"
        ? "border-t-[8px] border-t-red-700"
        : topColor === "black"
            ? "border-t-[8px] border-t-slate-900"
            : "";

    return (
        <Card className={`rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-md shadow-[0_8px_24px_-12px_rgba(2,6,23,0.25)] hover:shadow-[0_16px_40px_-16px_rgba(2,6,23,0.35)] transition-all duration-300 ${topBorderClass}`}>
            <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-lg text-slate-800 font-semibold">{label}</p>
                        {sublabel && (
                            <p className="text-[12px] text-slate-500 mt-0.5">{sublabel}</p>
                        )}
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 mt-1.5 leading-none">
                            {value}
                        </p>
                        {sub && <div className="mt-1.5">{sub}</div>}
                        <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className={`h-full rounded-full ${barColor} transition-all duration-700`}
                                style={{ width: barWidth }}
                            />
                        </div>
                    </div>
                    <div className={`shrink-0 grid place-items-center size-11 sm:size-12 rounded-2xl ${gradient} ${ring}`}>
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
