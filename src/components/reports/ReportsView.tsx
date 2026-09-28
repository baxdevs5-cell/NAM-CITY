import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  Package,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { useBusiness } from '../../context/BusinessContext';
import { Sale, Expense, Product } from '../../types';
import { formatMoney, exportToCsv, formatDateShort } from '../../lib/utils';

export const ReportsView: React.FC = () => {
  const { t } = useI18n();
  const { activeBusiness } = useBusiness();

  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<'pnl' | 'inventory' | 'sales'>('pnl');

  const curr = activeBusiness?.currency || 'UZS';

  useEffect(() => {
    if (!activeBusiness) return;
    setLoading(true);
    const bId = activeBusiness.id;
    Promise.all([
      fetch(`/api/sales?businessId=${bId}`).then((r) => r.json()),
      fetch(`/api/expenses?businessId=${bId}`).then((r) => r.json()),
      fetch(`/api/products?businessId=${bId}`).then((r) => r.json()),
    ])
      .then(([sls, exps, prods]) => {
        if (Array.isArray(sls)) setSales(sls.filter((s) => s.status === 'completed'));
        if (Array.isArray(exps)) setExpenses(exps);
        if (Array.isArray(prods)) setProducts(prods);
      })
      .finally(() => setLoading(false));
  }, [activeBusiness]);

  // Aggregate numbers
  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalRevenue - totalExpense;

  // Inventory valuation
  const totalCostValue = products.reduce((acc, p) => acc + p.purchasePrice * p.quantity, 0);
  const totalRetailValue = products.reduce((acc, p) => acc + p.sellingPrice * p.quantity, 0);
  const expectedProfit = totalRetailValue - totalCostValue;

  const handleExportPnL = () => {
    const rows: (string | number)[][] = [
      ['Kategoriya / Modda', 'Summa'],
      ['Umumiy Savdo Tushumi', totalRevenue],
      ['Jami Xarajatlar', totalExpense],
      ['Sof Foyda / Zarar', netProfit],
    ];
    exportToCsv(`HISOBCHI_P&L_Hisoboti_${new Date().toISOString().split('T')[0]}`, rows);
  };

  const handleExportInventory = () => {
    const rows: (string | number)[][] = [
      ['Mahsulot', 'Qoldiq', 'Tan narxi', 'Tan narx qiymati', 'Sotuv narxi', 'Sotuv qiymati', 'Kutilayotgan foyda'],
      ...products.map((p) => [
        p.name,
        p.quantity,
        p.purchasePrice,
        p.purchasePrice * p.quantity,
        p.sellingPrice,
        p.sellingPrice * p.quantity,
        (p.sellingPrice - p.purchasePrice) * p.quantity,
      ]),
    ];
    exportToCsv(`HISOBCHI_Ombor_Qiymati_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            {t('reportsTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('reportsSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={activeReport === 'inventory' ? handleExportInventory : handleExportPnL}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t('exportCsv')}</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveReport('pnl')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeReport === 'pnl'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {t('reportProfitLoss')}
        </button>
        <button
          onClick={() => setActiveReport('inventory')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeReport === 'inventory'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {t('reportInventoryValue')}
        </button>
      </div>

      {activeReport === 'pnl' ? (
        <div className="space-y-5">
          {/* P&L Snapshot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <span className="text-xs text-slate-400">{t('kpiRevenue')}</span>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                {formatMoney(totalRevenue, curr)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">{sales.length} ta savdo bitimi</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <span className="text-xs text-slate-400">{t('kpiExpenses')}</span>
              <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1 tabular-nums">
                {formatMoney(totalExpense, curr)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">{expenses.length} ta xarajat moddasi</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <span className="text-xs text-slate-400">{t('kpiNetProfit')}</span>
              <p className={`text-xl font-extrabold mt-1 tabular-nums ${netProfit >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600'}`}>
                {formatMoney(netProfit, curr)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Rentabellik ko‘rsatkichi</p>
            </div>
          </div>

          {/* Breakdown Statement */}
          <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
              Moliyaviy Natijalar To‘g‘risida Hisobot (P&L)
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-2.5 flex justify-between font-semibold">
                <span className="text-slate-800 dark:text-slate-200">1. Asosiy faoliyatdan tushum (Savdo)</span>
                <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">+{formatMoney(totalRevenue, curr)}</span>
              </div>
              <div className="py-2.5 flex justify-between font-semibold">
                <span className="text-slate-800 dark:text-slate-200">2. Operatsion xarajatlar</span>
                <span className="text-rose-600 dark:text-rose-400 tabular-nums">-{formatMoney(totalExpense, curr)}</span>
              </div>
              <div className="py-3 flex justify-between font-extrabold text-sm pt-3">
                <span className="text-slate-900 dark:text-white">Sof Foyda / Zarar (Net Profit)</span>
                <span className={`tabular-nums ${netProfit >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600'}`}>
                  {formatMoney(netProfit, curr)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Inventory Valuation Snapshot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <span className="text-xs text-slate-400">{t('costValue')}</span>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 tabular-nums">
                {formatMoney(totalCostValue, curr)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Ombordagi tovarlar tan narxi</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <span className="text-xs text-slate-400">{t('retailValue')}</span>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                {formatMoney(totalRetailValue, curr)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Sotuv narxi bo‘yicha qiymat</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <span className="text-xs text-slate-400">{t('expectedProfit')}</span>
              <p className="text-xl font-extrabold text-teal-600 dark:text-teal-400 mt-1 tabular-nums">
                {formatMoney(expectedProfit, curr)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Barcha tovarlar sotilgandagi foyda</p>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-semibold">
                    <th className="py-3 px-4">{t('productName')}</th>
                    <th className="py-3 px-4 text-center">{t('stockQty')}</th>
                    <th className="py-3 px-4 text-right">{t('purchasePrice')}</th>
                    <th className="py-3 px-4 text-right">Tan narx qiymati</th>
                    <th className="py-3 px-4 text-right">{t('sellingPrice')}</th>
                    <th className="py-3 px-4 text-right">Sotuv qiymati</th>
                    <th className="py-3 px-4 text-right">Kutilayotgan foyda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {products.map((p) => {
                    const costTotal = p.purchasePrice * p.quantity;
                    const retailTotal = p.sellingPrice * p.quantity;
                    const profitTotal = retailTotal - costTotal;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {p.name}
                        </td>
                        <td className="py-3 px-4 text-center tabular-nums font-semibold">
                          {p.quantity} {p.unit}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-slate-500">
                          {formatMoney(p.purchasePrice, curr)}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums font-medium text-slate-700 dark:text-slate-300">
                          {formatMoney(costTotal, curr)}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-slate-500">
                          {formatMoney(p.sellingPrice, curr)}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-900 dark:text-white">
                          {formatMoney(retailTotal, curr)}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums font-extrabold text-emerald-600 dark:text-emerald-400">
                          +{formatMoney(profitTotal, curr)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
