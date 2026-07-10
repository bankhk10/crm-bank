# Design: Sales Forecast Month Filter

Add a global month-selection condition to the Sales Forecast dashboard, enabling users to select individual months or view all months.

## Requirements & Goal
- Provide a dropdown select input in the dashboard header next to the Year Selector.
- Options: "ทุกเดือน" (All Months) plus 12 months ("ม.ค." to "ธ.ค." / "มกราคม" to "ธันวาคม").
- When a month is selected:
  - The **ภาพรวม (Overview)** KPI cards (ยอดขายจริง YTD, เป้าหมายทั้งปี, ยอดขาย vs เป้าหมาย) display figures only for that selected month.
  - The **Overview Table** displays only the row of the selected month (along with the corresponding summary row).
  - All detailed tabs (**พนักงาน**, **ประเภท (ABC)**, **กลุ่มชื่อการค้า**, and **สินค้า**) will filter their aggregated rows to only include calculations from the selected month.

---

## Technical Approach & Proposed Changes

### 1. Global Month State in Dashboard
In [sales-forecast-dashboard.tsx](file:///d:/code/crm-bank/modules/sales-forecast/features/dashboard/sales-forecast-dashboard.tsx), introduce `selectedMonth` state:
```typescript
const [selectedMonth, setSelectedMonth] = useState<string>("all");
```

### 2. Header UI Upgrade
Render a Shadcn `Select` component in the header next to the Year Selector:
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
```
The design will align with the existing Year Selector using rounded-xl corners, smooth animations, and premium borders.

### 3. Data Filtering Logic
- **Overview Table & KPI Cards**:
  Filter the `performanceData` array:
  ```typescript
  const filteredPerformanceData = useMemo(() => {
    if (selectedMonth === "all") return performanceData;
    return performanceData.filter((d) => d.monthNumber === Number(selectedMonth));
  }, [performanceData, selectedMonth]);
  ```
  Recalculate summary totals using `filteredPerformanceData`.

- **Personal Tab**:
  Use `selectedMonth` directly instead of `personalMonth`. Clean up unused parameters/imports in [PersonalForecastSection.tsx](file:///d:/code/crm-bank/modules/sales-forecast/features/dashboard/components/PersonalForecastSection.tsx) if necessary, or pass the updated handlers.

- **ABC, Trade Name Group, and Product Tab Rows**:
  Filter input lists before performing aggregation:
  ```typescript
  // Example for Trade Name Group
  const filteredTradeName = selectedMonth === "all"
    ? forecastData.tradeNameGroup
    : forecastData.tradeNameGroup.filter(entry => entry.month === Number(selectedMonth));
  ```
  This keeps all tab components thin and reuse-ready without changing their inner layouts, since filtering happens at the container level.

---

## Verification Plan

### Manual Verification
1. Navigate to the Sales Forecast dashboard.
2. Verify that the new Month Filter dropdown is visible next to the Year Selector.
3. Select "มกราคม" (January) and verify:
   - Overview KPI cards update to January's targets/actuals.
   - Overview table shows only January's row (and the summary row).
   - "พนักงาน", "ประเภท (ABC)", "กลุ่มชื่อการค้า", and "สินค้า" lists update to show only January data.
4. Select "ทุกเดือน" (All Months) and verify that it reverts back to the original full-year dashboard view.
