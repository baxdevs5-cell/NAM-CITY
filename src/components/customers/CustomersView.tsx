import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Phone, Mail, MapPin, Edit2, Trash2, X, FileSpreadsheet } from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { useBusiness } from '../../context/BusinessContext';
import { Customer } from '../../types';
import { formatMoney, exportToCsv } from '../../lib/utils';

export const CustomersView: React.FC = () => {
  const { t } = useI18n();
  const { activeBusiness } = useBusiness();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  const loadCustomers = () => {
    if (!activeBusiness) return;
    setLoading(true);
    fetch(`/api/customers?businessId=${activeBusiness.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCustomers(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCustomers();
  }, [activeBusiness]);

  const curr = activeBusiness?.currency || 'UZS';

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('+998 ');
    setFormEmail('');
    setFormAddress('');
    setFormNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormPhone(c.phone);
    setFormEmail(c.email || '');
    setFormAddress(c.address || '');
    setFormNotes(c.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      setFormError('Ism va telefon raqami kiritilishi shart');
      return;
    }

    const payload = {
      businessId: activeBusiness?.id,
      name: formName.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim(),
      address: formAddress.trim(),
      notes: formNotes.trim(),
    };

    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-business-id': activeBusiness?.id || '' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        loadCustomers();
      } else {
        const d = await res.json();
        setFormError(d.error || 'Xatolik yuz berdi');
      }
    } catch (err: any) {
      setFormError(err.message || 'Server xatosi');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCustomerToDelete(null);
        loadCustomers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.address && c.address.toLowerCase().includes(q));
  });

  const handleExport = () => {
    const rows: (string | number)[][] = [
      ['F.I.SH', 'Telefon', 'Email', 'Manzil', 'Xaridlar soni', 'Jami sarflangan', 'Hozirgi qarz', 'Oxirgi xarid'],
      ...filtered.map((c) => [c.name, c.phone, c.email || '', c.address || '', c.purchaseCount, c.totalSpent, c.debtAmount, c.lastPurchaseDate || '']),
    ];
    exportToCsv(`HISOBCHI_Mijozlar_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            {t('customersTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('customersSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('exportCsv')}</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addCustomer')}</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Mijoz ismi yoki telefon raqami..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-blue-500"
          />
        </div>
        <span className="text-xs text-slate-400">Jami: {customers.length} nafar mijoz</span>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-semibold">
                <th className="py-3 px-4">{t('fullName')}</th>
                <th className="py-3 px-4">{t('phone')}</th>
                <th className="py-3 px-4">{t('address')}</th>
                <th className="py-3 px-4 text-center">{t('purchasesCount')}</th>
                <th className="py-3 px-4 text-right">{t('totalSpent')}</th>
                <th className="py-3 px-4 text-right">{t('currentDebt')}</th>
                <th className="py-3 px-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {c.name}
                    {c.notes && <p className="text-[10px] text-slate-400 font-normal">{c.notes}</p>}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono">
                    {c.phone}
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                    {c.address || '-'}
                  </td>
                  <td className="py-3 px-4 text-center tabular-nums font-semibold">
                    {c.purchaseCount}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                    {formatMoney(c.totalSpent, curr)}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums">
                    {c.debtAmount > 0 ? (
                      <span className="font-extrabold text-rose-500">
                        {formatMoney(c.debtAmount, curr)}
                      </span>
                    ) : (
                      <span className="text-slate-400">0 {curr}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setCustomerToDelete(c)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
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

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingCustomer ? t('editCustomer') : t('addCustomer')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <p className="text-[11px] text-rose-500 font-medium p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40">
                {formError}
              </p>
            )}

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {t('fullName')} *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Masalan: Alisher Usmonov"
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {t('phone')} *
                </label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="mijoz@mail.uz"
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {t('address')}
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Navoiy ko‘chasi, 14"
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {t('notes')}
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Mijoz haqida eslatma..."
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {t('confirmDelete')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              "{customerToDelete.name}" mijoz ma‘lumotlar bazasidan o‘chiriladi.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCustomerToDelete(null)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => handleDelete(customerToDelete.id)}
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
