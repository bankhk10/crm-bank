import { DashboardPeriod } from "../types";

export interface PeriodSwitcherProps {
  value: DashboardPeriod;
  onChange: (p: DashboardPeriod) => void;
  options: { value: DashboardPeriod; label: string }[];
  variant?: "light" | "dark";
}

export function PeriodSwitcher({
  value,
  onChange,
  options,
  variant = "light",
}: PeriodSwitcherProps) {
  const base =
    variant === "dark"
      ? "bg-white/10 border border-white/20"
      : "bg-slate-100/80 border border-slate-200/60";
  const activeClass =
    variant === "dark"
      ? "bg-white text-slate-900 shadow-md"
      : "bg-white text-slate-900 shadow-md";
  const inactiveClass =
    variant === "dark"
      ? "text-white/70 hover:text-white hover:bg-white/10"
      : "text-slate-500 hover:text-slate-700 hover:bg-white/60";

  return (
    <div className={`inline-flex items-center rounded-xl p-1 gap-0.5 ${base}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-semibold transition-all duration-200 ${
            value === opt.value ? activeClass : inactiveClass
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
