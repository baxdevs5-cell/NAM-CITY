import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Filter,
  Receipt,
  RotateCcw,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { useBusiness } from '../../context/BusinessContext';
import { Sale } from '../../types';
import { formatMoney, formatDate, exportToCsv } from '../../lib/utils';

interface SalesViewProps {
  onOpenQuickSale: () => void;
  onViewReceipt: (sale: Sale) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({ onOpenQuickSale, onViewReceipt }) => {
  const { t, language } = useI18n();
  const { activeBusiness } = useBusiness();

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);

  const loadSales = () => {
    if (!activeBusiness) return;
    setLoading(true);
    fetch(`/api/sales?businessId=${activeBusiness.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSales(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSales();
  }, [activeBusiness]);

  const handleCancelSale = async (saleId: string) => {
    try {
      const res = await fetch(`/api/sales/${saleId}/cancel`, {
        method: 'PUT',
      });
      if (res.ok) {
        setSaleToCancel(null);
        loadSales();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const curr = activeBusiness?.currency || 'UZS';

  const filteredSales = sales.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      s.saleNumber.toLowerCase().includes(q) ||
      (s.customerName && s.customerName.toLowerCase().includes(q));
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchPayment = paymentFilter === 'all' || s.paymentMethod === paymentFilter;
    return matchSearch && matchStatus && matchPayment;
  });

  const handleExport = () => {
    const rows: (string | number)[][] = [
      ['Chek №', 'Xaridor', 'Sana', 'To‘lov usuli', 'Oraliq summa', 'Chegirma', 'Jami to‘lov', 'To‘langan', 'Qarz', 'Holat'],
      ...filteredSales.map((s) => [
        s.saleNumber,
        s.customerName || 'Oddiy xaridor',
        s.createdAt,
        s.paymentMethod,
        s.subtotal,
        s.discount,
        s.total,
        s.paidAmount,
        s.debtAmount,
        s.status,
      ]),
    ];
    exportToCsv(`HISOBCHI_Savdolar_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-5">
      {/* Header & Main CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-emerald-600" />
            {t('salesTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('salesSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('exportCsv')}</span>
          </button>
          <button
            onClick={onOpenQuickSale}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('newSaleButton')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Chek raqami yoki xaridor..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <option value="all">Barcha holatlar</option>
            <option value="completed">{t('statusCompleted')}</option>
            <option value="cancelled">{t('statusCancelled')}</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <option value="all">Barcha to‘lov turlari</option>
            <option value="cash">{t('paymentCash')}</option>
            <option value="card">{t('paymentCard')}</option>
            <option value="transfer">{t('paymentTransfer')}</option>
            <option value="other">{t('paymentOther')}</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-semibold">
                <th className="py-3 px-4">{t('saleNumber')}</th>
                <th className="py-3 px-4">{t('customer')}</th>
                <th className="py-3 px-4">{t('date')}</th>
                <th className="py-3 px-4">{t('paymentMethod')}</th>
                <th className="py-3 px-4 text-center">{t('itemsCount')}</th>
                <th className="py-3 px-4 text-right">{t('total')}</th>
                <th className="py-3 px-4 text-center">{t('status')}</th>
                <th className="py-3 px-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {s.saleNumber}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {s.customerName || t('walkInCustomer')}
                    </p>
                    {s.cashierName && (
                      <p className="text-[10px] text-slate-400">
                        Kassir: {s.cashierName}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {formatDate(s.createdAt, language)}
                  </td>
                  <td className="py-3 px-4 capitalize text-slate-700 dark:text-slate-300">
                    {s.paymentMethod === 'cash'
                      ? t('paymentCash')
                      : s.paymentMethod === 'card'
                      ? t('paymentCard')
                      : s.paymentMethod === 'transfer'
                      ? t('paymentTransfer')
                      : t('paymentOther')}
                  </td>
                  <td className="py-3 px-4 text-center tabular-nums text-slate-500">
                    {s.items?.length || 0}
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {formatMoney(s.total, curr)}
                    {s.debtAmount > 0 && (
                      <span className="block text-[10px] text-rose-500 font-semibold">
                        Qarz: {formatMoney(s.debtAmount, curr)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        s.status === 'completed'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {s.status === 'completed' ? t('statusCompleted') : t('statusCancelled')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onViewReceipt(s)}
                        className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                        title={t('viewReceipt')}
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                      {s.status === 'completed' && (
                        <button
                          onClick={() => setSaleToCancel(s)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title={t('cancelSale')}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    {loading ? t('loading') : t('noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog for Cancelling Sale */}
      {saleToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Savdoni bekor qilishni tasdiqlaysizmi?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {saleToCancel.saleNumber} cheki bekor qilinadi va sotilgan tovarlar avtomatik omborga qaytariladi.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSaleToCancel(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => handleCancelSale(saleToCancel.id)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
