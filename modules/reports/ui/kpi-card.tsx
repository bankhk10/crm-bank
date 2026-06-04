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
  barColor?: string;
  barWidth?: string;
  topColor?: "red" | "black";
}) {
  const topBorderClass =
    topColor === "red"
      ? "border-t-4 border-t-red-600"
      : topColor === "black"
        ? "border-t-4 border-t-slate-900"
        : "";

  return (
    <Card
      className={`
        h-full
        rounded-3xl
        border border-slate-200/60
        bg-white/90
        backdrop-blur-xl
        shadow-sm
        hover:shadow-xl
        transition-all duration-300
        hover:-translate-y-1
        ${topBorderClass}
      `}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] sm:text-sm font-medium text-slate-500">
              {label}
            </p>

            {sublabel && (
              <p className="mt-1 text-[10px] sm:text-xs text-slate-400">
                {sublabel}
              </p>
            )}

            <h3
              className="
                mt-2
                text-sm
                sm:text-lg
                lg:text-xl
                font-bold
                text-slate-900
                leading-snug
                break-words
                line-clamp-2
              "
            >
              {value}
            </h3>

            {sub && (
              <div className="mt-2 text-xs sm:text-sm">
                {sub}
              </div>
            )}

            {barColor && barWidth && (
              <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`${barColor} h-full rounded-full transition-all duration-700`}
                  style={{ width: barWidth }}
                />
              </div>
            )}
          </div>

          {/* Icon */}
          <div
            className={`
              shrink-0
              flex items-center justify-center
              w-10 h-10
              sm:w-12 sm:h-12
              rounded-2xl
              ${gradient}
              ${ring}
            `}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}