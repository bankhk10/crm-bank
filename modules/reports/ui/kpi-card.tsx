import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  className,
}: {
  label: string;
  sublabel?: string;
  value: string;
  sub?: React.ReactNode;
  icon: React.ElementType;
  gradient: string;
  ring: string;
  barColor?: string;
  barWidth?: string;
  topColor?: "red" | "black";
  className?: string;
}) {
  const topBorderClass =
    topColor === "red"
      ? "border-t-4 border-t-red-600"
      : topColor === "black"
        ? "border-t-4 border-t-slate-900"
        : "";

  return (
    <Card
      className={cn(
        "group relative h-full overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/70 bg-white/95 backdrop-blur-xl shadow-sm hover:shadow-xl hover:border-slate-300/80 transition-all duration-300 hover:-translate-y-1",
        topBorderClass,
        className,
      )}
    >
      <CardContent className="p-4 sm:p-5 lg:p-6 flex flex-col justify-between h-full">
        <div className="flex items-start justify-between gap-3">
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-slate-500 tracking-wide">
              {label}
            </p>

            {sublabel && (
              <p className="mt-0.5 text-[11px] sm:text-xs text-slate-400 font-normal leading-normal">
                {sublabel}
              </p>
            )}

            <h3 className="mt-2.5 text-base sm:text-xl lg:text-2xl font-bold tracking-tight text-slate-900 leading-snug tabular-nums break-words line-clamp-2">
              {value}
            </h3>

            {sub && <div className="mt-2 text-xs sm:text-sm">{sub}</div>}
          </div>

          {/* Icon */}
          <div
            className={cn(
              "shrink-0 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl transition-transform duration-300 group-hover:scale-105 shadow-md",
              gradient,
              ring,
            )}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>

        {barColor && barWidth && (
          <div className="mt-3.5 sm:mt-4 h-1.5 sm:h-2 rounded-full bg-slate-100/90 overflow-hidden shrink-0">
            <div
              className={cn("h-full rounded-full transition-all duration-700", barColor)}
              style={{ width: barWidth }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

