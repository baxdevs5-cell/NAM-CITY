import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Bot,
  Sparkles,
  Receipt,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { useBusiness } from '../../context/BusinessContext';
import { DashboardStats, Sale } from '../../types';
import { formatMoney, formatDate } from '../../lib/utils';

interface DashboardViewProps {
  onOpenQuickSale: () => void;
  onNavigate: (section: any) => void;
  onViewReceipt: (sale: Sale) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenQuickSale,
  onNavigate,
  onViewReceipt,
}) => {
  const { t, language } = useI18n();
  const { activeBusiness } = useBusiness();

  const [dateRange, setDateRange] = useState<string>('this_month');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<{
    trend: { date: string; label: string; revenue: number; expense: number; profit: number }[];
    topProducts: { name: string; salesCount: number; revenue: number }[];
    expenseCategories: { category: string; amount: number }[];
    paymentMethods: { method: string; amount: number }[];
  } | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = () => {
    if (!activeBusiness) return;
    setLoading(true);
    const bId = activeBusiness.id;

    Promise.all([
      fetch(`/api/dashboard/stats?businessId=${bId}&range=${dateRange}`).then((r) => r.json()),
      fetch(`/api/dashboard/charts?businessId=${bId}`).then((r) => r.json()),
      fetch(`/api/ai/insights?businessId=${bId}`).then((r) => r.json()),
      fetch(`/api/sales?businessId=${bId}`).then((r) => r.json()),
    ])
      .then(([statsData, chartsData, insightsData, salesData]) => {
        setStats(statsData);
        setCharts(chartsData);
        if (insightsData?.insights) setInsights(insightsData.insights);
        if (Array.isArray(salesData)) setRecentSales(salesData.slice(0, 5));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeBusiness, dateRange]);

  const curr = activeBusiness?.currency || 'UZS';

  // Date range tabs
  const dateFilters = [
    { id: 'today', label: t('filterToday') },
    { id: 'yesterday', label: t('filterYesterday') },
    { id: 'this_week', label: t('filterThisWeek') },
    { id: 'this_month', label: t('filterThisMonth') },
    { id: 'last_month', label: t('filterLastMonth') },
    { id: 'this_year', label: t('filterThisYear') },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Range Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {activeBusiness?.name || 'HISOBCHI'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('brandTagline')}
          </p>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs overflow-x-auto scrollbar-none">
          {dateFilters.map((df) => (
            <button
              key={df.id}
              onClick={() => setDateRange(df.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                dateRange === df.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {df.label}
            </button>
          ))}
          <button
            onClick={fetchDashboardData}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Yangilash"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 7 KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Revenue */}
        <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{t('kpiRevenue')}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {formatMoney(stats?.totalRevenue, curr)}
            </span>
          </div>
          <div className="mt-1 flex items-center text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{stats?.totalSalesCount || 0} {t('kpiTotalSales')}</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{t('kpiExpenses')}</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {formatMoney(stats?.totalExpenses, curr)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            <span>{t('expensesSubtitle').slice(0, 30)}...</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{t('kpiNetProfit')}</span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                (stats?.netProfit ?? 0) >= 0
                  ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
              }`}
            >
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span
              className={`text-lg sm:text-xl font-extrabold tabular-nums tracking-tight ${
                (stats?.netProfit ?? 0) >= 0
                  ? 'text-teal-600 dark:text-teal-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatMoney(stats?.netProfit, curr)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            <span>{(stats?.netProfit ?? 0) >= 0 ? 'Foydada ✅' : 'Zararda ⚠️'}</span>
          </div>
        </div>

        {/* Outstanding Debts */}
        <div
          onClick={() => onNavigate('debts')}
          className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs relative overflow-hidden cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{t('kpiOutstandingDebts')}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg sm:text-xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums tracking-tight">
              {formatMoney(stats?.totalCustomerDebts, curr)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            <span>Yetkazuvchiga: {formatMoney(stats?.totalSupplierDebts, curr)}</span>
          </div>
        </div>
      </div>

      {/* Secondary Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => onNavigate('products')}
          className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Package className="w-4 h-4 text-emerald-500" />
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('kpiInStock')}</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                {stats?.productsInStock || 0} {t('unitPcs')}
              </p>
            </div>
          </div>
          {Number(stats?.lowStockCount) > 0 && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
              {stats?.lowStockCount} ta kam
            </span>
          )}
        </div>

        <div
          onClick={() => onNavigate('customers')}
          className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('kpiCustomers')}</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                {stats?.totalCustomers || 0}
              </p>
            </div>
          </div>
          <span className="text-[10px] text-slate-400">Faol</span>
        </div>

        <div
          onClick={onOpenQuickSale}
          className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/60 flex items-center justify-between cursor-pointer hover:bg-emerald-100/80 dark:hover:bg-emerald-950/60 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">{t('quickSale')}</p>
              <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">Kassa terminali</p>
            </div>
          </div>
          <Plus className="w-4 h-4 text-emerald-600" />
        </div>

        <div
          onClick={() => onNavigate('ai')}
          className="p-3 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/60 flex items-center justify-between cursor-pointer hover:bg-purple-100/80 dark:hover:bg-purple-950/60 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">{t('navAI')}</p>
              <p className="text-[10px] text-purple-600/80 dark:text-purple-400/80">Hisobot va maslahat</p>
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-purple-600" />
        </div>
      </div>

      {/* AI Smart Insights Banner */}
      {insights.length > 0 && (
        <div className="p-4 rounded-2xl bg-linear-to-r from-purple-900/10 via-indigo-900/5 to-emerald-900/10 dark:from-purple-950/40 dark:via-indigo-950/20 dark:to-emerald-950/30 border border-purple-200/60 dark:border-purple-800/50 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h2 className="font-bold text-xs uppercase tracking-wider text-purple-900 dark:text-purple-200">
                {t('aiInsightsTitle')}
              </h2>
            </div>
            <button
              onClick={() => onNavigate('ai')}
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>{t('viewAllInsights')}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.slice(0, 2).map((ins, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-purple-100 dark:border-purple-900/50 text-xs flex gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{ins.title}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    {ins.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Trend: Revenue vs Expense Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('chartRevenueVsExpenses')}
              </h3>
              <p className="text-xs text-slate-400">Oxirgi 7 kunlik moliyaviy oqim</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" />
                <span className="text-slate-600 dark:text-slate-400">{t('chartRevenue')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-rose-400 inline-block" />
                <span className="text-slate-600 dark:text-slate-400">{t('chartExpense')}</span>
              </div>
            </div>
          </div>

          {/* SVG Bar Visualizer */}
          {charts && charts.trend.length > 0 ? (
            <div className="h-56 flex items-end justify-between gap-2 pt-6">
              {(() => {
                const maxVal = Math.max(
                  ...charts.trend.flatMap((d) => [d.revenue, d.expense]),
                  100000
                );
                return charts.trend.map((day, i) => {
                  const revHeight = Math.max(8, (day.revenue / maxVal) * 160);
                  const expHeight = Math.max(8, (day.expense / maxVal) * 160);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="w-full flex items-end justify-center gap-1 h-44">
                        {/* Revenue Bar */}
                        <div
                          style={{ height: `${revHeight}px` }}
                          className="w-1/2 max-w-[20px] bg-emerald-500 hover:bg-emerald-600 rounded-t-sm transition-all relative group cursor-pointer"
                        >
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-20 shadow-md">
                            {formatMoney(day.revenue, curr)}
                          </div>
                        </div>

                        {/* Expense Bar */}
                        <div
                          style={{ height: `${expHeight}px` }}
                          className="w-1/2 max-w-[20px] bg-rose-400 hover:bg-rose-500 rounded-t-sm transition-all relative group cursor-pointer"
                        >
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-20 shadow-md">
                            {formatMoney(day.expense, curr)}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[40px]">
                        {day.label}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-xs text-slate-400">
              {t('noData')}
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('chartTopProducts')}
              </h3>
              <button
                onClick={() => onNavigate('products')}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Barchasi
              </button>
            </div>

            <div className="space-y-3">
              {charts && charts.topProducts.length > 0 ? (
                charts.topProducts.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {p.salesCount} dona sotilgan
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">
                      {formatMoney(p.revenue, curr)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 text-xs py-10">{t('noData')}</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={onOpenQuickSale}
              className="w-full py-2 px-3 text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('newSaleButton')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Sales History Table */}
      <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {t('salesHistory')}
            </h3>
            <p className="text-xs text-slate-400">Oxirgi amalga oshirilgan savdo operatsiyalari</p>
          </div>
          <button
            onClick={() => onNavigate('sales')}
            className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
          >
            Barcha savdolar →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                <th className="pb-2.5 font-medium">{t('saleNumber')}</th>
                <th className="pb-2.5 font-medium">{t('customer')}</th>
                <th className="pb-2.5 font-medium">{t('date')}</th>
                <th className="pb-2.5 font-medium">{t('paymentMethod')}</th>
                <th className="pb-2.5 font-medium text-right">{t('total')}</th>
                <th className="pb-2.5 font-medium text-center">{t('status')}</th>
                <th className="pb-2.5 font-medium text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentSales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 font-semibold text-slate-900 dark:text-white">
                    {s.saleNumber}
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">
                    {s.customerName || t('walkInCustomer')}
                  </td>
                  <td className="py-3 text-slate-400">
                    {formatDate(s.createdAt, language)}
                  </td>
                  <td className="py-3 capitalize text-slate-600 dark:text-slate-300">
                    {s.paymentMethod}
                  </td>
                  <td className="py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatMoney(s.total, curr)}
                  </td>
                  <td className="py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        s.status === 'completed'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {s.status === 'completed' ? t('statusCompleted') : t('statusCancelled')}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => onViewReceipt(s)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={t('viewReceipt')}
                    >
                      <Receipt className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {recentSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    {t('noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function ArrowRight(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}
