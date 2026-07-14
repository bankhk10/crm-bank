import { useState, useMemo } from "react";
import { mockTripPlans, TripPlanMock } from "../../infrastructure/mock-data";
import { STATUS_CONFIG } from "../../constants";

export function useActivityReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [jobType, setJobType] = useState("all");
  const [status, setStatus] = useState("all");
  const [responsible, setResponsible] = useState("all");
  const [province, setProvince] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [selectedPlan, setSelectedPlan] = useState<TripPlanMock | null>(null);

  const uniqueOptions = useMemo(() => {
    return {
      jobTypes: Array.from(new Set(mockTripPlans.map((d) => d.jobType))),
      employees: Array.from(new Set(mockTripPlans.map((d) => d.responsible))),
      provinces: Array.from(new Set(mockTripPlans.map((d) => d.province))),
    };
  }, []);

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setJobType("all");
    setStatus("all");
    setResponsible("all");
    setProvince("all");
    setCurrentPage(1);
  };

  const filteredData = useMemo(() => {
    return mockTripPlans.filter((item) => {
      if (startDate && item.activityDate < startDate) return false;
      if (endDate && item.activityDate > endDate) return false;
      if (jobType !== "all" && item.jobType !== jobType) return false;
      if (status !== "all" && item.status !== status) return false;
      if (responsible !== "all" && item.responsible !== responsible) return false;
      if (province !== "all" && item.province !== province) return false;
      return true;
    });
  }, [startDate, endDate, jobType, status, responsible, province]);

  const finishedActivities = useMemo(() => {
    return filteredData.filter((item) => item.status === "FINISHED");
  }, [filteredData]);

  // ─── Active Filter Count ───────────────────────────────────────────────────
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (startDate) count++;
    if (endDate) count++;
    if (jobType !== "all") count++;
    if (status !== "all") count++;
    if (responsible !== "all") count++;
    if (province !== "all") count++;
    return count;
  }, [startDate, endDate, jobType, status, responsible, province]);

  // ─── KPI Calculations ───────────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const totalPlans = filteredData.length;
    const totalFinished = finishedActivities.length;
    const totalPending = filteredData.filter((i) => i.status === "PENDING").length;
    const totalBudget = filteredData.reduce((acc, cur) => acc + cur.budget, 0);
    const totalSales = finishedActivities.reduce((acc, cur) => acc + cur.actualSales, 0);
    const totalTargetSales = finishedActivities.reduce((acc, cur) => acc + cur.targetSales, 0);
    const totalNewCustomers = finishedActivities.reduce((acc, cur) => acc + cur.actualNewCustomers, 0);
    const totalOrders = finishedActivities.reduce((acc, cur) => acc + (cur.actualOrders || 0), 0);
    const achievementRate = totalTargetSales > 0 ? (totalSales / totalTargetSales) * 100 : 0;

    // Budget utilization
    const totalActualBudget = finishedActivities.reduce((acc, cur) => acc + (cur.actualBudget || 0) + (cur.otherExpenses || 0), 0);
    const totalPlannedBudgetForFinished = finishedActivities.reduce((acc, cur) => acc + cur.budget, 0);
    const budgetUtilizationRate = totalPlannedBudgetForFinished > 0 ? (totalActualBudget / totalPlannedBudgetForFinished) * 100 : 0;

    return {
      totalPlans,
      totalFinished,
      totalPending,
      totalBudget,
      totalActualBudget,
      budgetUtilizationRate,
      totalSales,
      totalNewCustomers,
      totalOrders,
      achievementRate,
    };
  }, [filteredData, finishedActivities]);

  // ─── Analytics ──────────────────────────────────────────────────────────────
  const statusAnalytics = useMemo(() => {
    const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0, CANCELLED: 0, FINISHED: 0 };
    filteredData.forEach((item) => {
      counts[item.status]++;
    });
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([key, count]) => ({
        name: STATUS_CONFIG[key as TripPlanMock["status"]]?.label || key,
        value: count,
      }));
  }, [filteredData]);

  const jobTypeAnalytics = useMemo(() => {
    const g: Record<string, { name: string; budget: number; sales: number }> = {};
    filteredData.forEach((item) => {
      const name = item.jobType.replace(/^\d+\.\s*/, "");
      if (!g[name]) g[name] = { name, budget: 0, sales: 0 };
      g[name].budget += item.budget;
      if (item.status === "FINISHED") g[name].sales += item.actualSales;
    });
    return Object.values(g).sort((a, b) => b.budget - a.budget);
  }, [filteredData]);

  const employeeAnalytics = useMemo(() => {
    const g: Record<string, { name: string; sales: number; count: number }> = {};
    finishedActivities.forEach((item) => {
      if (!g[item.responsible]) g[item.responsible] = { name: item.responsible, sales: 0, count: 0 };
      g[item.responsible].sales += item.actualSales;
      g[item.responsible].count += 1;
    });
    return Object.values(g).sort((a, b) => b.sales - a.sales).slice(0, 5); // Top 5
  }, [finishedActivities]);

  // ─── Pagination ─────────────────────────────────────────────────────────────
  const paginatedPlans = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    jobType,
    setJobType,
    status,
    setStatus,
    responsible,
    setResponsible,
    province,
    setProvince,
    currentPage,
    setCurrentPage,
    selectedPlan,
    setSelectedPlan,
    uniqueOptions,
    resetFilters,
    filteredData,
    activeFiltersCount,
    kpi,
    statusAnalytics,
    jobTypeAnalytics,
    employeeAnalytics,
    paginatedPlans,
    totalPages,
  };
}
