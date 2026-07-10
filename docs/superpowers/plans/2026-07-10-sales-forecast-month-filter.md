# Sales Forecast Month Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a month selector dropdown to the Sales Forecast dashboard to filter all dashboard graphs, tables, and lists by a selected month or show the full-year view.

**Architecture:** Integrate a React state variable `selectedMonth` at the dashboard level, render a Shadcn `Select` component in the header toolbar, and update all dashboard data memorizations (performance, personal, abc, trade group, products) to filter by the selected month when it is not set to "all".

**Tech Stack:** React, Tailwind CSS, Lucide Icons, Shadcn UI (`@/components/ui/select`).

## Global Constraints
- Do not commit changes to git (user requested manual commit).
- Ensure mobile-first styling with Tailwind CSS.

---

### Task 1: Add Global Month Selector Dropdown to Dashboard Header

**Files:**
- Modify: `modules/sales-forecast/features/dashboard/sales-forecast-dashboard.tsx`
- Modify: `modules/sales-forecast/features/dashboard/components/PersonalForecastSection.tsx`

**Interfaces:**
- Consumes: None (UI layout changes)
- Produces: React State `selectedMonth` passed into filter calculations.

- [ ] **Step 1: Import Select component components and add selectedMonth state**
  Open [sales-forecast-dashboard.tsx](file:///d:/code/crm-bank/modules/sales-forecast/features/dashboard/sales-forecast-dashboard.tsx).
  Import the Shadcn `Select` components at the top:
  ```typescript
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
  ```
  Change:
  ```typescript
  const [personalMonth, setPersonalMonth] = useState<string>("all");
  ```
  To:
  ```typescript
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  ```

- [ ] **Step 2: Render Month Selector in Header**
  In [sales-forecast-dashboard.tsx](file:///d:/code/crm-bank/modules/sales-forecast/features/dashboard/sales-forecast-dashboard.tsx), look at the Year Selector & Refresh section (around line 354). Add the month selector dropdown just before the year navigation block.
  Ensure it has standard layout and styling:
  ```tsx
  {/* Month Selector & Year Selector & Refresh */}
  <div className="flex flex-wrap items-center gap-3">
    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
      <SelectTrigger className="w-[140px] h-10 rounded-xl bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm font-medium focus:ring-0">
        <SelectValue placeholder="เลือกเดือน" />
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        {monthOptions.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>

    <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm border border-slate-200/60">
      <button
        onClick={() => setYear((y) => y - 1)}
        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <ChevronLeft className="w-5 h-5 text-slate-600" />
      </button>
      <div className="flex items-center gap-2 px-3">
        <Calendar className="w-5 h-5 text-blue-600" />
        <span className="font-bold text-slate-800 text-lg">{year}</span>
      </div>
      <button
        onClick={() => setYear((y) => y + 1)}
        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <ChevronRight className="w-5 h-5 text-slate-600" />
      </button>
    </div>
    ...
  ```

- [ ] **Step 3: Update PersonalForecastSection Props**
  In [sales-forecast-dashboard.tsx](file:///d:/code/crm-bank/modules/sales-forecast/features/dashboard/sales-forecast-dashboard.tsx), update the prop passing in `PersonalForecastSection`:
  ```tsx
  <PersonalForecastSection
    data={personalForecastRows}
    year={year}
    monthOptions={monthOptions}
    selectedMonth={selectedMonth}
    onMonthChange={setSelectedMonth}
    formatCurrency={formatFullCurrency}
    loading={forecastLoading}
    error={forecastError}
  />
  ```
  In [PersonalForecastSection.tsx](file:///d:/code/crm-bank/modules/sales-forecast/features/dashboard/components/PersonalForecastSection.tsx), since we already have `selectedMonth` and `onMonthChange` props but they are not used to render a Select dropdown (which we are now rendering globally), we can clean up any unused state/handlers if desired, or keep them as is. Let's make sure it still correctly handles resets:
  ```typescript
  // Keep this in PersonalForecastSection to reset pagination when selectedMonth changes
  const [prevMonth, setPrevMonth] = useState(selectedMonth);

  if (selectedMonth !== prevMonth) {
    setPrevMonth(selectedMonth);
    setCurrentPage(1);
    setSearchTerm("");
  }
  ```

---

### Task 2: Implement Filter Logic for Dashboard Sections & KPI Cards

**Files:**
- Modify: `modules/sales-forecast/features/dashboard/sales-forecast-dashboard.tsx`

**Interfaces:**
- Consumes: `selectedMonth` state.
- Produces: Correctly filtered forecast lists and totals.

- [ ] **Step 1: Filter Overview Data & Recalculate Totals**
  In [sales-forecast-dashboard.tsx](file:///d:/code/crm-bank/modules/sales-forecast/features/dashboard/sales-forecast-dashboard.tsx), introduce a filtered performance data memo:
  ```typescript
  const filteredPerformanceData = useMemo(() => {
    if (selectedMonth === "all") return performanceData;
    return performanceData.filter((d) => d.monthNumber === Number(selectedMonth));
  }, [performanceData, selectedMonth]);
  ```
  Update `totals` calculation and KPI totals to read from `filteredPerformanceData` instead of `performanceData`:
  ```typescript
  const totalActual = filteredPerformanceData.reduce((sum, d) => sum + d.actual, 0);
  const totalTarget = filteredPerformanceData.reduce((sum, d) => sum + d.target, 0);
  // ...
  const totals = useMemo(
    () =>
      filteredPerformanceData.reduce(
        (acc, entry) => ({
          target: acc.target + entry.target,
          actual: acc.actual + entry.actual,
          newForecast: acc.newForecast + entry.newForecast,
          totalForecast: acc.totalForecast + entry.totalForecast,
          backlog: acc.backlog + entry.backlog,
        }),
        {
          target: 0,
          actual: 0,
          newForecast: 0,
          totalForecast: 0,
          backlog: 0,
        },
      ),
    [filteredPerformanceData],
  );
  ```

- [ ] **Step 2: Update Overview Table Rows to Render Filtered Performance Data**
  In [sales-forecast-dashboard.tsx](file:///d:/code/crm-bank/modules/sales-forecast/features/dashboard/sales-forecast-dashboard.tsx), in the Overview tab content table body:
  ```tsx
  {/* Change: performanceData.map(...) */}
  {filteredPerformanceData.map((entry) => {
    const index = entry.monthNumber - 1;
    // ...
  ```

- [ ] **Step 3: Filter Other Tab Rows Before Aggregating**
  In [sales-forecast-dashboard.tsx](file:///d:/code/crm-bank/modules/sales-forecast/features/dashboard/sales-forecast-dashboard.tsx):
  - **personalForecastRows**: Filter by `selectedMonth` (already filtered, just verify `selectedMonth` is used).
  - **tradeNameForecastRows**:
    ```typescript
    const tradeNameForecastRows = useMemo(() => {
      if (!forecastData?.tradeNameGroup) return [];

      const filtered =
        selectedMonth === "all"
          ? forecastData.tradeNameGroup
          : forecastData.tradeNameGroup.filter(
            (entry) => entry.month === Number(selectedMonth),
          );

      const map: Record<string, any> = {};
      filtered.forEach((entry) => { ... });
      // ...
    }, [forecastData, tradeNameGroupLabels, selectedMonth]);
    ```
  - **productForecastRows**:
    ```typescript
    const productForecastRows = useMemo(() => {
      if (!forecastData?.product) return [];

      const filtered =
        selectedMonth === "all"
          ? forecastData.product
          : forecastData.product.filter(
            (entry) => entry.month === Number(selectedMonth),
          );

      const map: Record<string, any> = {};
      filtered.forEach((entry) => { ... });
      // ...
    }, [forecastData, selectedMonth]);
    ```
  - **abcForecastRows**:
    ```typescript
    const abcForecastRows = useMemo(() => {
      if (!forecastData?.abc) return [];

      const filtered =
        selectedMonth === "all"
          ? forecastData.abc
          : forecastData.abc.filter(
            (entry) => entry.month === Number(selectedMonth),
          );

      const map: Record<string, any> = {};
      filtered.forEach((entry) => { ... });
      // ...
    }, [forecastData, abcLabels, selectedMonth]);
    ```

- [ ] **Step 4: Verify Compilation & Code Correctness**
  Run typescript type checking and linting to ensure there are no compilation errors:
  Command: `pnpm run lint` or check next dev build.
