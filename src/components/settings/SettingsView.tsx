import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Globe,
  Users,
  Shield,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  User,
  History,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { useBusiness } from '../../context/BusinessContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Employee, AuditLog, Currency, Language, UserRole } from '../../types';
import { formatDate } from '../../lib/utils';

export const SettingsView: React.FC = () => {
  const { t, language, setLanguage } = useI18n();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { activeBusiness, updateBusiness } = useBusiness();

  const [activeTab, setActiveTab] = useState<'business' | 'lang' | 'employees' | 'audit' | 'reset'>('business');

  // Business form
  const [bizName, setBizName] = useState(activeBusiness?.name || '');
  const [bizType, setBizType] = useState<any>(activeBusiness?.type || 'minimarket');
  const [bizCurrency, setBizCurrency] = useState<Currency>(activeBusiness?.currency || 'UZS');
  const [bizPhone, setBizPhone] = useState(activeBusiness?.phone || '');
  const [bizAddress, setBizAddress] = useState(activeBusiness?.address || '');
  const [bizTaxId, setBizTaxId] = useState(activeBusiness?.taxId || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Employees
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAddEmpOpen, setIsAddEmpOpen] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empRole, setEmpRole] = useState<UserRole>('employee');
  const [empSalary, setEmpSalary] = useState('4000000');

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    if (activeBusiness) {
      setBizName(activeBusiness.name);
      setBizType(activeBusiness.type);
      setBizCurrency(activeBusiness.currency);
      setBizPhone(activeBusiness.phone);
      setBizAddress(activeBusiness.address);
      setBizTaxId(activeBusiness.taxId || '');

      fetch(`/api/employees?businessId=${activeBusiness.id}`)
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d)) setEmployees(d);
        });

      fetch(`/api/audit-logs?businessId=${activeBusiness.id}`)
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d)) setAuditLogs(d);
        });
    }
  }, [activeBusiness]);

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;
    const ok = await updateBusiness(activeBusiness.id, {
      name: bizName,
      type: bizType,
      currency: bizCurrency,
      phone: bizPhone,
      address: bizAddress,
      taxId: bizTaxId,
    });
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness || !empName.trim() || !empEmail.trim()) return;

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: activeBusiness.id,
          name: empName.trim(),
          email: empEmail.trim(),
          phone: empPhone.trim(),
          role: empRole,
          salary: Number(empSalary) || 0,
          permissions: empRole === 'owner' ? ['all'] : empRole === 'manager' ? ['sales', 'inventory', 'customers'] : ['sales'],
        }),
      });
      if (res.ok) {
        setIsAddEmpOpen(false);
        setEmpName('');
        setEmpEmail('');
        setEmpPhone('');
        const newEmp = await res.json();
        setEmployees((prev) => [...prev, newEmp]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEmployees((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetSampleData = async () => {
    if (!window.confirm(t('resetDemoConfirm'))) return;
    try {
      const res = await fetch('/api/system/reset-sample', { method: 'POST' });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-600" />
          {t('settingsTitle')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t('settingsSubtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('business')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'business'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {t('tabBusinessProfile')}
        </button>
        <button
          onClick={() => setActiveTab('lang')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'lang'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {t('tabLanguageTheme')}
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'employees'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {t('tabEmployees')}
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'audit'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {t('tabAuditLogs')}
        </button>
        <button
          onClick={() => setActiveTab('reset')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'reset'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {t('tabDataBackup')}
        </button>
      </div>

      {/* Tab: Business Profile */}
      {activeTab === 'business' && (
        <form onSubmit={handleSaveBusiness} className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4 text-xs">
          {saveSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>O‘zgarishlar muvaffaqiyatli saqlandi!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {t('businessName')} *
              </label>
              <input
                type="text"
                required
                value={bizName}
                onChange={(e) => setBizName(e.target.value)}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {t('businessType')}
              </label>
              <select
                value={bizType}
                onChange={(e) => setBizType(e.target.value as any)}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="minimarket">{t('businessTypeMinimarket')}</option>
                <option value="retail">{t('businessTypeRetail')}</option>
                <option value="cafe">{t('businessTypeCafe')}</option>
                <option value="salon">{t('businessTypeSalon')}</option>
                <option value="workshop">{t('businessTypeWorkshop')}</option>
                <option value="other">{t('businessTypeOther')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {t('currency')}
              </label>
              <select
                value={bizCurrency}
                onChange={(e) => setBizCurrency(e.target.value as any)}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
              >
                <option value="UZS">{t('currencyUzs')}</option>
                <option value="USD">{t('currencyUsd')}</option>
                <option value="EUR">{t('currencyEur')}</option>
                <option value="RUB">{t('currencyRub')}</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                INN (Soliq to‘lovchi kodi)
              </label>
              <input
                type="text"
                value={bizTaxId}
                onChange={(e) => setBizTaxId(e.target.value)}
                placeholder="305928174"
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Telefon raqami
              </label>
              <input
                type="text"
                value={bizPhone}
                onChange={(e) => setBizPhone(e.target.value)}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Manzil
              </label>
              <input
                type="text"
                value={bizAddress}
                onChange={(e) => setBizAddress(e.target.value)}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-colors shadow-sm"
            >
              {t('saveChanges')}
            </button>
          </div>
        </form>
      )}

      {/* Tab: Language & Theme */}
      {activeTab === 'lang' && (
        <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-6 text-xs">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
              Tilni tanlang (Language)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { code: 'uz', name: 'O‘zbekcha', flag: '🇺🇿', desc: 'Asosiy til' },
                { code: 'ru', name: 'Русский', flag: '🇷🇺', desc: 'Русский интерфейс' },
                { code: 'en', name: 'English', flag: '🇬🇧', desc: 'Global English' },
              ].map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLanguage(l.code as any)}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-colors ${
                    language === l.code
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-2xl">{l.flag}</span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{l.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{l.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
              Interfeys mavzusi (Theme)
            </h3>
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <button
                onClick={() => setTheme('light')}
                className={`p-3 rounded-xl border text-center font-semibold transition-colors ${
                  theme === 'light'
                    ? 'bg-slate-900 text-white'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                ☀️ {t('lightMode')}
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-xl border text-center font-semibold transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-100 text-slate-900'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-800'
                }`}
              >
                🌙 {t('darkMode')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Employees & Roles */}
      {activeTab === 'employees' && (
        <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('employeesTitle')}
              </h3>
              <p className="text-[11px] text-slate-400">
                Rol va ruxsatlar tizimi (Rahbar, Menejer, Sotuvchi)
              </p>
            </div>
            <button
              onClick={() => setIsAddEmpOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('addEmployee')}</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {employees.map((emp) => (
              <div key={emp.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 dark:text-white">{emp.name}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold uppercase">
                      {emp.role === 'owner' ? t('roleOwner') : emp.role === 'manager' ? t('roleManager') : t('roleEmployee')}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{emp.email} · {emp.phone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium tabular-nums text-slate-700 dark:text-slate-300">
                    {emp.salary ? `${emp.salary.toLocaleString()} ${activeBusiness?.currency}` : '-'}
                  </span>
                  {emp.role !== 'owner' && (
                    <button
                      onClick={() => handleDeleteEmployee(emp.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Employee Modal */}
          {isAddEmpOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {t('addEmployee')}
                </h4>
                <form onSubmit={handleAddEmployee} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">F.I.SH *</label>
                    <input
                      type="text"
                      required
                      value={empName}
                      onChange={(e) => setEmpName(e.target.value)}
                      className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Email *</label>
                    <input
                      type="email"
                      required
                      value={empEmail}
                      onChange={(e) => setEmpEmail(e.target.value)}
                      className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Telefon</label>
                    <input
                      type="text"
                      value={empPhone}
                      onChange={(e) => setEmpPhone(e.target.value)}
                      className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Rol</label>
                    <select
                      value={empRole}
                      onChange={(e) => setEmpRole(e.target.value as any)}
                      className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <option value="employee">{t('roleEmployee')} (Faqat savdo va kassa)</option>
                      <option value="manager">{t('roleManager')} (Savdo, ombor va hisobotlar)</option>
                      <option value="owner">{t('roleOwner')} (Barcha huquqlar)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Oylik maosh</label>
                    <input
                      type="number"
                      value={empSalary}
                      onChange={(e) => setEmpSalary(e.target.value)}
                      className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums"
                    />
                  </div>
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddEmpOpen(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      {t('save')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Audit Log */}
      {activeTab === 'audit' && (
        <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3 text-xs">
          <div className="flex items-center gap-2 mb-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {t('tabAuditLogs')}
            </h3>
          </div>
          <p className="text-slate-400 text-[11px]">
            Muhim amallar tarixi (Tovar kiritish, savdo o‘chirish, qarz to‘lash va hk.)
          </p>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{log.userName}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 dark:bg-slate-800 font-mono text-slate-500">
                      {log.action}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                    {log.details}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                  {formatDate(log.createdAt, language)}
                </span>
              </div>
            ))}

            {auditLogs.length === 0 && (
              <p className="py-8 text-center text-slate-400">Jurnal bo‘sh</p>
            )}
          </div>
        </div>
      )}

      {/* Tab: Reset / Backup */}
      {activeTab === 'reset' && (
        <div className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {t('tabDataBackup')}
            </h3>
            <p className="text-slate-400 text-[11px] mt-1">
              Namuna ma‘lumotlarni qayta tiklash yoki tozalash amali
            </p>
          </div>

          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 space-y-2">
            <h4 className="font-bold text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              {t('resetDemoData')}
            </h4>
            <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 leading-relaxed">
              Barcha joriy yozuvlarni standart o‘zbek bozoridagi namuna tovarlar, mijozlar va savdolar bilan qayta tiklaydi.
            </p>
            <button
              onClick={handleResetSampleData}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer text-xs transition-colors"
            >
              {t('resetDemoData')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
