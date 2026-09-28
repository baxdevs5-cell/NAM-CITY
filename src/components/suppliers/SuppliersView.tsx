import React, { useState, useEffect } from 'react';
import { Truck, Search, Plus, Phone, Mail, MapPin, Edit2, Trash2, X, FileSpreadsheet } from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { useBusiness } from '../../context/BusinessContext';
import { Supplier } from '../../types';
import { formatMoney, exportToCsv } from '../../lib/utils';

export const SuppliersView: React.FC = () => {
  const { t } = useI18n();
  const { activeBusiness } = useBusiness();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formDebt, setFormDebt] = useState('0');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  const loadSuppliers = () => {
    if (!activeBusiness) return;
    setLoading(true);
    fetch(`/api/suppliers?businessId=${activeBusiness.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSuppliers(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSuppliers();
  }, [activeBusiness]);

  const curr = activeBusiness?.currency || 'UZS';

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormName('');
    setFormPhone('+998 ');
    setFormEmail('');
    setFormAddress('');
    setFormDebt('0');
    setFormNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setFormName(s.name);
    setFormPhone(s.phone);
    setFormEmail(s.email || '');
    setFormAddress(s.address || '');
    setFormDebt(s.debtAmount.toString());
    setFormNotes(s.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Yetkazuvchi nomi kiritilishi shart');
      return;
    }

    const payload = {
      businessId: activeBusiness?.id,
      name: formName.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim(),
      address: formAddress.trim(),
      debtAmount: Number(formDebt) || 0,
      notes: formNotes.trim(),
    };

    try {
      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers';
      const method = editingSupplier ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-business-id': activeBusiness?.id || '' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        loadSuppliers();
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
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSupplierToDelete(null);
        loadSuppliers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    return !q || s.name.toLowerCase().includes(q) || s.phone.includes(q);
  });

  const handleExport = () => {
    const rows: (string | number)[][] = [
      ['Nomi', 'Telefon', 'Email', 'Manzil', 'Qarzimiz', 'Jami partiyalar summasi', 'Izoh'],
      ...filtered.map((s) => [s.name, s.phone, s.email || '', s.address || '', s.debtAmount, s.totalPurchased, s.notes || '']),
    ];
    exportToCsv(`HISOBCHI_Taminotchilar_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-teal-600" />
            {t('suppliersTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('suppliersSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
            <span>{t('exportCsv')}</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addSupplier')}</span>
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
            placeholder="Yetkazib beruvchi nomi..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-teal-500"
          />
        </div>
        <span className="text-xs text-slate-400">Jami: {suppliers.length} ta hamkor</span>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-semibold">
                <th className="py-3 px-4">{t('supplierName')}</th>
                <th className="py-3 px-4">{t('phone')}</th>
                <th className="py-3 px-4">{t('address')}</th>
                <th className="py-3 px-4 text-right">{t('debtToSupplier')}</th>
                <th className="py-3 px-4 text-right">{t('totalSupplied')}</th>
                <th className="py-3 px-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {s.name}
                    {s.notes && <p className="text-[10px] text-slate-400 font-normal">{s.notes}</p>}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                    {s.phone}
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                    {s.address || '-'}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums">
                    {s.debtAmount > 0 ? (
                      <span className="font-extrabold text-rose-500">
                        {formatMoney(s.debtAmount, curr)}
                      </span>
                    ) : (
                      <span className="text-slate-400">0 {curr}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                    {formatMoney(s.totalPurchased, curr)}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSupplierToDelete(s)}
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
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    {loading ? t('loading') : t('noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingSupplier ? t('editSupplier') : t('addSupplier')}
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
                  {t('supplierName')} *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Masalan: Coca-Cola Distribution"
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {t('phone')}
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+998 71 200 00 00"
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {t('debtToSupplier')} ({curr})
                </label>
                <input
                  type="number"
                  min="0"
                  value={formDebt}
                  onChange={(e) => setFormDebt(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold tabular-nums"
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
                  placeholder="Ombor yoki ofis manzili"
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
                  placeholder="Yetkazib berish kunlari yoki shartlar..."
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {t('confirmDelete')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              "{supplierToDelete.name}" yetkazuvchi ma‘lumotlar bazasidan o‘chiriladi.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSupplierToDelete(null)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => handleDelete(supplierToDelete.id)}
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
