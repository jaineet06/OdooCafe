import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Download, FileSpreadsheet, RefreshCw, ShoppingBag, DollarSign, TrendingUp, UtensilsCrossed, LayoutGrid } from "lucide-react";
import { reportsApi } from "../../api/config.api";
import { useDebounce } from "../../hooks/useDebounce";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { PageSkeleton } from "../../components/common/Skeletons";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Tabs } from "../../components/common/Tabs";
import { AnimatedNumber } from "../../components/common/AnimatedNumber";
import { OrderStatusPill } from "../../components/common/Badge";
import { formatCurrency } from "../../utils/formatters";
import { CHART_COLORS, KDS_STAGE_COLORS } from "../../styles/tokens";
import { usePageEnter } from "../../hooks/useGsapAnimation";

const STATUS_COLORS = { draft: CHART_COLORS.tertiary, paid: CHART_COLORS.secondary, cancelled: "#b54040" };

export default function ReportsPage() {
  const [period, setPeriod] = useState("today");
  const [exporting, setExporting] = useState(null);
  const debouncedPeriod = useDebounce(period, 300);
  const params = { period: debouncedPeriod };
  const pageRef = usePageEnter([debouncedPeriod]);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["reports", "dashboard", debouncedPeriod],
    queryFn: () => reportsApi.dashboard(params),
  });

  const { data: orderStatus, refetch: refetchStatus, isFetching: statusFetching } = useQuery({
    queryKey: ["reports", "order-status"],
    queryFn: reportsApi.orderStatus,
    refetchInterval: 15_000,
  });

  const { data: trend } = useQuery({
    queryKey: ["reports", "trend", debouncedPeriod],
    queryFn: () => reportsApi.salesTrend(params),
  });

  const { data: topProducts } = useQuery({
    queryKey: ["reports", "top-products", debouncedPeriod],
    queryFn: () => reportsApi.topProducts(params),
  });

  const { data: topCategories } = useQuery({
    queryKey: ["reports", "top-categories", debouncedPeriod],
    queryFn: () => reportsApi.topCategories(params),
  });

  const { data: topOrders } = useQuery({
    queryKey: ["reports", "top-orders", debouncedPeriod],
    queryFn: () => reportsApi.topOrders(params),
  });

  const exportReport = async (format) => {
    setExporting(format);
    try {
      const blob = await reportsApi.exportBlob({ ...params, format });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = format === "xls" ? "sales-report.xlsx" : "sales-report.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} export ready`);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(null);
    }
  };

  if (isLoading) return <AdminLayout title="Dashboard" wide><PageSkeleton /></AdminLayout>;

  const statusChart = orderStatus
    ? Object.entries(orderStatus.byStatus || {}).map(([name, value]) => ({ name, value }))
    : [];

  const kdsChart = orderStatus
    ? Object.entries(orderStatus.kdsPipeline || {}).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }))
    : [];

  const categoryPie = (topCategories || []).slice(0, 6).map((c) => ({
    name: c.name || "Other",
    value: Number(c.revenue) || 0,
    color: c.color || CHART_COLORS.primary,
  }));

  return (
    <AdminLayout title="Dashboard" wide>
      <div ref={pageRef} className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Tabs
            value={period}
            onChange={setPeriod}
            items={[
              { id: "today", label: "Today" },
              { id: "week", label: "Week" },
              { id: "month", label: "Month" },
            ]}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={RefreshCw} loading={statusFetching} onClick={() => refetchStatus()}>
              Refresh live
            </Button>
            <Button variant="outline" icon={Download} loading={exporting === "pdf"} onClick={() => exportReport("pdf")}>
              Export PDF
            </Button>
            <Button variant="outline" icon={FileSpreadsheet} loading={exporting === "xls"} onClick={() => exportReport("xls")}>
              Export XLS
            </Button>
          </div>
        </div>

        {/* KPI row — reference-inspired stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={DollarSign} label="Revenue" value={dashboard?.revenue} format={formatCurrency} accent={CHART_COLORS.primary} />
          <StatCard icon={ShoppingBag} label="Total orders" value={dashboard?.totalOrders} accent={CHART_COLORS.secondary} />
          <StatCard icon={TrendingUp} label="Avg order" value={dashboard?.averageOrderValue} format={formatCurrency} accent={CHART_COLORS.tertiary} />
          <StatCard icon={LayoutGrid} label="Open today" value={orderStatus?.byStatus?.draft ?? 0} accent={CHART_COLORS.tertiary} live />
          <StatCard icon={UtensilsCrossed} label="Tables occupied" value={orderStatus?.tablesOccupied ?? 0} accent={CHART_COLORS.primary} live />
        </div>

        {/* Charts row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="dashboard-card lg:col-span-2" padding="lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg text-brand-espresso">Sales trend</h3>
              <span className="text-xs capitalize text-text-muted">{period}</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trend || []}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--color-text-muted)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--color-text-muted)" />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border-subtle)" }} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: CHART_COLORS.primary }}
                  isAnimationActive
                  animationDuration={600}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="dashboard-card" padding="lg">
            <h3 className="mb-4 font-display text-lg text-brand-espresso">Categories</h3>
            {categoryPie.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={categoryPie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      isAnimationActive
                    >
                      {categoryPie.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="mt-4 space-y-2">
                  {categoryPie.map((c) => (
                    <li key={c.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </span>
                      <span className="font-medium">{formatCurrency(c.value)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="py-16 text-center text-sm text-text-muted">No category data</p>
            )}
          </Card>
        </div>

        {/* Live ops — compact row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="dashboard-card">
            <h3 className="mb-3 text-sm font-semibold text-text-muted">Order status · today</h3>
            {statusChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} isAnimationActive>
                    {statusChart.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#888"} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-text-muted">No orders yet</p>
            )}
          </Card>

          <Card className="dashboard-card">
            <h3 className="mb-3 text-sm font-semibold text-text-muted">Kitchen pipeline</h3>
            {kdsChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={kdsChart} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} isAnimationActive>
                    {kdsChart.map((entry) => (
                      <Cell key={entry.name} fill={KDS_STAGE_COLORS[entry.name] || "#888"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-text-muted">Kitchen clear</p>
            )}
          </Card>

          <Card className="dashboard-card" padding="none">
            <div className="border-b border-border-subtle px-5 py-4">
              <h3 className="font-semibold text-brand-espresso">Recent orders</h3>
            </div>
            <DataTable
              headers={["Order", "Status"]}
              rows={(orderStatus?.recentOrders || []).slice(0, 6).map((o) => [
                `#${o.order_number}${o.table_number ? ` · T${o.table_number}` : ""}`,
                <OrderStatusPill key={o.id} paymentStatus={o.status} kdsStage={o.kds_stage} />,
              ])}
              empty="No recent activity"
            />
          </Card>
        </div>

        {/* Data tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="dashboard-card" padding="none">
            <div className="border-b border-border-subtle px-5 py-4">
              <h3 className="font-semibold text-brand-espresso">Top products · {period}</h3>
            </div>
            <DataTable
              headers={["Product", "Qty", "Revenue"]}
              alignRight={[1, 2]}
              rows={(topProducts || []).map((p) => [p.name, p.quantity ?? p.qty, formatCurrency(p.revenue)])}
              empty="No product sales in this period"
            />
          </Card>

          <Card className="dashboard-card" padding="none">
            <div className="border-b border-border-subtle px-5 py-4">
              <h3 className="font-semibold text-brand-espresso">Top orders · {period}</h3>
            </div>
            <DataTable
              headers={["Order", "Table", "Total"]}
              alignRight={[2]}
              rows={(topOrders || []).map((o) => [`#${o.order_number}`, o.table_number ? `T${o.table_number}` : "—", formatCurrency(o.total)])}
              empty="No orders in this period"
            />
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ icon: Icon, label, value, format, accent, live }) {
  const display = value == null ? "—" : format ? format(value) : value;
  return (
    <Card className="dashboard-card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${accent}18`, color: accent }}>
          <Icon size={20} strokeWidth={1.75} />
        </div>
        {live && <span className="rounded-full bg-accent-success/15 px-2 py-0.5 text-[10px] font-bold uppercase text-accent-success">Live</span>}
      </div>
      <div>
        <p className="text-xs font-medium text-text-muted">{label}</p>
        <p className="font-display text-2xl text-brand-espresso">
          {typeof value === "number" && !format ? <AnimatedNumber value={value} /> : display}
        </p>
      </div>
    </Card>
  );
}

function DataTable({ headers, rows, empty, alignRight = [] }) {
  if (!rows?.length) {
    return <p className="px-5 py-8 text-center text-sm text-text-muted">{empty}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-bg-base/80 text-left text-xs uppercase text-text-muted">
            {headers.map((h, i) => (
              <th key={h} className={`px-5 py-3 font-semibold ${alignRight.includes(i) ? "text-right" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={`border-b border-border-subtle/50 ${i % 2 ? "bg-bg-base/40" : ""}`}>
              {row.map((cell, j) => (
                <td key={j} className={`px-5 py-3 ${alignRight.includes(j) ? "text-right font-medium" : ""}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
