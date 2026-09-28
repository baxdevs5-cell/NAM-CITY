import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { useBusiness } from '../../context/BusinessContext';
import { Debt, Customer, Supplier } from '../../types';
import { formatMoney, exportToCsv } from '../../lib/utils';

export const DebtsView: React.FC = () => {
  const { t } = useI18n();
  const { activeBusiness } = useBusiness();

  const [debts, setDebts] = useState<Debt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'customer' | 'supplier'>('customer');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'partially_paid' | 'overdue' | 'paid'>('all');

  // Payment Recording Modal
  const [debtToPay, setDebtToPay] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentError, setPaymentError] = useState('');

  // Add Debt Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formType, setFormType] = useState<'customer' | 'supplier'>('customer');
  const [formEntityName, setFormEntityName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  const loadDebts = () => {
    if (!activeBusiness) return;
    setLoading(true);
    const bId = activeBusiness.id;
    Promise.all([
      fetch(`/api/debts?businessId=${bId}`).then((r) => r.json()),
      fetch(`/api/customers?businessId=${bId}`).then((r) => r.json()),
      fetch(`/api/suppliers?businessId=${bId}`).then((r) => r.json()),
    ])
      .then(([dbts, custs, sups]) => {
        if (Array.isArray(dbts)) setDebts(dbts);
        if (Array.isArray(custs)) setCustomers(custs);
        if (Array.isArray(sups)) setSuppliers(sups);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDebts();
  }, [activeBusiness]);

  const curr = activeBusiness?.currency || 'UZS';

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtToPay) return;
    const amt = Number(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setPaymentError('To‘lov summasi 0 dan katta bo‘lishi lozim');
      return;
    }
    if (amt > debtToPay.remainingAmount) {
      setPaymentError(`To‘lov summasi qarz qoldig‘idan (${formatMoney(debtToPay.remainingAmount, curr)}) oshmasligi kerak`);
      return;
    }

    try {
      const res = await fetch(`/api/debts/${debtToPay.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          paymentMethod,
          notes: paymentNotes,
        }),
      });

      if (res.ok) {
        setDebtToPay(null);
        setPaymentAmount('');
        setPaymentNotes('');
        setPaymentError('');
        loadDebts();
      } else {
        const d = await res.json();
        setPaymentError(d.error || 'Xatolik');
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Server xatosi');
    }
  };

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEntityName.trim() || !formAmount.trim()) {
      setFormError('Shaxs/Kompaniya nomi va summa kiritilishi shart');
      return;
    }
    const amt = Number(formAmount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Summa 0 dan katta bo‘lishi kerak');
      return;
    }

    const payload = {
      businessId: activeBusiness?.id,
      type: formType,
      entityName: formEntityName.trim(),
      phone: formPhone.trim(),
      originalAmount: amt,
      dueDate: formDueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: formNotes.trim(),
    };

    try {
      const res = await fetch('/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsAddOpen(false);
        setFormEntityName('');
        setFormPhone('');
        setFormAmount('');
        setFormNotes('');
        setFormError('');
        loadDebts();
      } else {
        const d = await res.json();
        setFormError(d.error || 'Xatolik');
      }
    } catch (err: any) {
      setFormError(err.message || 'Server xatosi');
    }
  };

  const totalCustomerReceivables = debts
    .filter((d) => d.type === 'customer' && d.status !== 'paid')
    .reduce((acc, d) => acc + d.remainingAmount, 0);

  const totalSupplierPayables = debts
    .filter((d) => d.type === 'supplier' && d.status !== 'paid')
    .reduce((acc, d) => acc + d.remainingAmount, 0);

  const filteredDebts = debts.filter((d) => {
    const matchTab = d.type === activeTab;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || d.entityName.toLowerCase().includes(q) || d.phone.includes(q);
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchTab && matchSearch && matchStatus;
  });

  const handleExport = () => {
    const rows: (string | number)[][] = [
      ['Turi', 'Shaxs/Kompaniya', 'Telefon', 'Boshlang‘ich summa', 'To‘langan', 'Qoldiq', 'Muddati', 'Holat'],
      ...filteredDebts.map((d) => [
        d.type === 'customer' ? 'Mijoz qarzi' : 'Yetkazuvchiga qarz',
        d.entityName,
        d.phone,
        d.originalAmount,
        d.paidAmount,
        d.remainingAmount,
        d.dueDate,
        d.status,
      ]),
    ];
    exportToCsv(`HISOBCHI_Qarzlar_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-amber-500" />
            {t('debtsTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('debtsSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('exportCsv')}</span>
          </button>
          <button
            onClick={() => {
              setFormType(activeTab);
              setIsAddOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addDebt')}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => setActiveTab('customer')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'customer'
              ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-500 shadow-xs'
              : 'bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{t('tabCustomerDebts')}</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2 tabular-nums">
            {formatMoney(totalCustomerReceivables, curr)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Mijozlar tomonidan do‘konga qaytarilishi kerak
          </p>
        </div>

        <div
          onClick={() => setActiveTab('supplier')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'supplier'
              ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-500 shadow-xs'
              : 'bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{t('tabSupplierDebts')}</span>
            <ArrowUpRight className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-2 tabular-nums">
            {formatMoney(totalSupplierPayables, curr)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Distribyutor va ta‘minotchilarga to‘lanishi kerak
          </p>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Shaxs yoki telefon raqami..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <option value="all">Barcha holatlar</option>
            <option value="unpaid">{t('debtStatusUnpaid')}</option>
            <option value="partially_paid">{t('debtStatusPartially')}</option>
            <option value="overdue">{t('debtStatusOverdue')}</option>
            <option value="paid">{t('debtStatusPaid')}</option>
          </select>
        </div>
      </div>

      {/* Debts Table */}
      <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-semibold">
                <th className="py-3 px-4">Shaxs / Kompaniya</th>
                <th className="py-3 px-4">{t('phone')}</th>
                <th className="py-3 px-4 text-right">{t('originalAmount')}</th>
                <th className="py-3 px-4 text-right">{t('paidSoFar')}</th>
                <th className="py-3 px-4 text-right">{t('remainingAmount')}</th>
                <th className="py-3 px-4 text-center">{t('dueDate')}</th>
                <th className="py-3 px-4 text-center">{t('status')}</th>
                <th className="py-3 px-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDebts.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {d.entityName}
                    {d.notes && <p className="text-[10px] text-slate-400 font-normal">{d.notes}</p>}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                    {d.phone || '-'}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-500 tabular-nums">
                    {formatMoney(d.originalAmount, curr)}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 tabular-nums font-medium">
                    {formatMoney(d.paidAmount, curr)}
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-rose-500 tabular-nums text-sm">
                    {formatMoney(d.remainingAmount, curr)}
                  </td>
                  <td className="py-3 px-4 text-center tabular-nums text-slate-500">
                    {d.dueDate}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        d.status === 'paid'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : d.status === 'overdue'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          : d.status === 'partially_paid'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {d.status === 'paid'
                        ? t('debtStatusPaid')
                        : d.status === 'overdue'
                        ? t('debtStatusOverdue')
                        : d.status === 'partially_paid'
                        ? t('debtStatusPartially')
                        : t('debtStatusUnpaid')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {d.status !== 'paid' && (
                      <button
                        onClick={() => {
                          setDebtToPay(d);
                          setPaymentAmount(d.remainingAmount.toString());
                          setPaymentError('');
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                      >
                        {t('recordPayment')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredDebts.length === 0 && (
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

      {/* Record Payment Modal */}
      {debtToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('recordPayment')}
              </h3>
              <button onClick={() => setDebtToPay(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-slate-400">Qarzdor:</p>
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                {debtToPay.entityName}
              </p>
              <p className="text-rose-500 font-semibold mt-0.5 tabular-nums">
                Qoldiq qarz: {formatMoney(debtToPay.remainingAmount, curr)}
              </p>
            </div>

            {paymentError && (
              <p className="text-[11px] text-rose-500 font-medium p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40">
                {paymentError}
              </p>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {t('debtPaymentAmount')} ({curr}) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={debtToPay.remainingAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold tabular-nums"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {t('paymentMethod')}
                </label>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {(['cash', 'card', 'transfer'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`p-2 rounded-lg border text-center font-medium capitalize transition-colors ${
                        paymentMethod === m
                          ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {m === 'cash' ? t('paymentCash') : m === 'card' ? t('paymentCard') : t('paymentTransfer')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Izoh (ixtiyoriy)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Kvitansiya yoki to‘lov tafsiloti..."
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDebtToPay(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  To‘lovni saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Debt Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('addDebt')}
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

            <form onSubmit={handleCreateDebt} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Qarz turi
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setFormType('customer')}
                    className={`p-2 rounded-xl border text-center font-medium transition-colors ${
                      formType === 'customer'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-600 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Mijoz qarzi
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('supplier')}
                    className={`p-2 rounded-xl border text-center font-medium transition-colors ${
                      formType === 'supplier'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Yetkazuvchiga qarz
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Shaxs / Kompaniya nomi *
                </label>
                <input
                  type="text"
                  required
                  value={formEntityName}
                  onChange={(e) => setFormEntityName(e.target.value)}
                  placeholder="Masalan: Sardor Rahimov"
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Telefon raqami
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+998 90 000 00 00"
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Summa ({curr}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="500000"
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  To‘lov muddati (Qaytarish sanasi)
                </label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Izoh
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Xarid tafsiloti yoki eslatma..."
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
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
