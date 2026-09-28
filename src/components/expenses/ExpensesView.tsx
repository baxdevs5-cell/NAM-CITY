import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Plus,
  Trash2,
  PieChart,
  FileSpreadsheet,
  X,
  CreditCard,
  Building,
  Truck,
  Zap,
  Megaphone,
  Briefcase,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { useBusiness } from '../../context/BusinessContext';
import { Expense } from '../../types';
import { formatMoney, formatDateShort, exportToCsv } from '../../lib/utils';

export const ExpensesView: React.FC = () => {
  const { t } = useI18n();
  const { activeBusiness } = useBusiness();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('rent');
  const [formPaymentMethod, setFormPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'other'>('cash');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState('');

  const loadExpenses = () => {
    if (!activeBusiness) return;
    setLoading(true);
    fetch(`/api/expenses?businessId=${activeBusiness.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setExpenses(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadExpenses();
  }, [activeBusiness]);

  const curr = activeBusiness?.currency || 'UZS';

  const categories = [
    { id: 'rent', label: t('catRent'), icon: Building },
    { id: 'salary', label: t('catSalary'), icon: Briefcase },
    { id: 'transport', label: t('catTransport'), icon: Truck },
    { id: 'utilities', label: t('catUtilities'), icon: Zap },
    { id: 'marketing', label: t('catMarketing'), icon: Megaphone },
    { id: 'supplies', label: t('catSupplies'), icon: Receipt },
    { id: 'taxes', label: t('catTaxes'), icon: CreditCard },
    { id: 'other', label: t('catOther'), icon: Receipt },
  ];

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(formAmount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Summa 0 dan katta bo‘lishi lozim');
      return;
    }
    if (!formDescription.trim()) {
      setFormError('Xarajat tavsifi kiritilishi shart');
      return;
    }

    const payload = {
      businessId: activeBusiness?.id,
      amount: amt,
      category: formCategory,
      paymentMethod: formPaymentMethod,
      description: formDescription.trim(),
      date: formDate,
    };

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsAddOpen(false);
        setFormAmount('');
        setFormDescription('');
        setFormError('');
        loadExpenses();
      } else {
        const d = await res.json();
        setFormError(d.error || 'Xatolik');
      }
    } catch (err: any) {
      setFormError(err.message || 'Server xatosi');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setExpenseToDelete(null);
        loadExpenses();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
    const matchCategory = selectedCategory === 'all' || e.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);

  // Group by category for visual cards
  const categoryTotals = categories.map((cat) => {
    const total = expenses.filter((e) => e.category === cat.id).reduce((acc, e) => acc + e.amount, 0);
    const percentage = totalExpense > 0 ? Math.round((total / totalExpense) * 100) : 0;
    return { ...cat, total, percentage };
  });

  const handleExport = () => {
    const rows: (string | number)[][] = [
      ['Sana', 'Kategoriya', 'Tavsif', 'To‘lov turi', 'Summa', 'Mas‘ul'],
      ...filteredExpenses.map((e) => [
        e.date,
        categories.find((c) => c.id === e.category)?.label || e.category,
        e.description,
        e.paymentMethod,
        e.amount,
        e.createdBy,
      ]),
    ];
    exportToCsv(`HISOBCHI_Xarajatlar_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-rose-500" />
            {t('expensesTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('expensesSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-rose-500" />
            <span>{t('exportCsv')}</span>
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addExpense')}</span>
          </button>
        </div>
      </div>

      {/* Category Distribution Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {categoryTotals.slice(0, 4).map((cat) => (
          <div
            key={cat.id}
            onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id)}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-xs'
                : 'bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="truncate">{cat.label}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{cat.percentage}%</span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {formatMoney(cat.total, curr)}
            </p>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Xarajat tavsifi..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <option value="all">Barcha xarajat toifalari</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-semibold">
                <th className="py-3 px-4">{t('date')}</th>
                <th className="py-3 px-4">{t('expenseCategory')}</th>
                <th className="py-3 px-4">Tavsif</th>
                <th className="py-3 px-4">{t('paymentMethod')}</th>
                <th className="py-3 px-4">Mas‘ul</th>
                <th className="py-3 px-4 text-right">{t('amount')}</th>
                <th className="py-3 px-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.map((exp) => {
                const catLabel = categories.find((c) => c.id === exp.category)?.label || exp.category;
                return (
                  <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDateShort(exp.date)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {catLabel}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {exp.description}
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-500">
                      {exp.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {exp.createdBy}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-rose-600 dark:text-rose-400 tabular-nums text-sm">
                      -{formatMoney(exp.amount, curr)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setExpenseToDelete(exp)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title={t('delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    {loading ? t('loading') : t('noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('addExpense')}
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <p className="text-[11px] text-rose-500 font-medium p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40">
                {formError}
              </p>
            )}

            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {t('expenseAmount')} ({curr}) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="Masalan: 450000"
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base font-bold tabular-nums text-rose-600 dark:text-rose-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {t('expenseCategory')}
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {t('paymentMethod')}
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="cash">{t('paymentCash')}</option>
                    <option value="card">{t('paymentCard')}</option>
                    <option value="transfer">{t('paymentTransfer')}</option>
                    <option value="other">{t('paymentOther')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Sana
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Tavsif / Maqsad *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Masalan: Damas orqali bozordan yuk keltirish xarajati"
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {t('confirmDelete')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              "{expenseToDelete.description}" xarajati butunlay o‘chiriladi.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setExpenseToDelete(null)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => handleDelete(expenseToDelete.id)}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-lg"
              >
                {t('yesDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
