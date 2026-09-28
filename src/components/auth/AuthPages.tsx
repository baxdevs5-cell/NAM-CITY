import React, { useState } from 'react';
import {
  TrendingUp,
  Mail,
  Lock,
  User,
  Building2,
  Phone,
  ArrowRight,
  Sparkles,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { useAuth } from '../../context/AuthContext';
import { Currency } from '../../types';

interface AuthPagesProps {
  initialMode?: 'login' | 'register' | 'forgot';
  onSuccess: () => void;
  onBackToLanding: () => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({
  initialMode = 'login',
  onSuccess,
  onBackToLanding,
}) => {
  const { t } = useI18n();
  const { login, register, quickDemoLogin } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('retail');
  const [currency, setCurrency] = useState<Currency>('UZS');
  const [phone, setPhone] = useState('+998 ');

  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      onSuccess();
    } else {
      setErrorMsg(res.error || 'Kirishda xatolik');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    const res = await register({
      name,
      email,
      password,
      businessName,
      businessType,
      currency,
      phone,
    });
    setLoading(false);
    if (res.success) {
      onSuccess();
    } else {
      setErrorMsg(res.error || 'Ro‘yxatdan o‘tishda xatolik');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const d = await res.json();
      setLoading(false);
      if (res.ok) {
        setInfoMsg(d.message);
      } else {
        setErrorMsg(d.error || 'Xatolik');
      }
    } catch {
      setLoading(false);
      setErrorMsg('Server bilan bog‘lanib bo‘lmadi');
    }
  };

  const handle1ClickDemo = async () => {
    setLoading(true);
    await quickDemoLogin();
    setLoading(false);
    onSuccess();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xl p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div
            onClick={onBackToLanding}
            className="inline-flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-emerald-500 via-teal-600 to-cyan-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              HISOBCHI
            </span>
          </div>

          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {mode === 'login'
              ? t('loginTitle')
              : mode === 'register'
              ? t('registerTitle')
              : t('forgotPasswordTitle')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {mode === 'login'
              ? t('loginSubtitle')
              : mode === 'register'
              ? t('registerSubtitle')
              : 'Emailingizni kiriting va ko‘rsatmalarga rioya qiling'}
          </p>
        </div>

        {/* 1-Click Demo Shortcut Banner (if in login mode) */}
        {mode === 'login' && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2 text-xs">
            <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                {t('demoLoginCredentials')}
              </span>
            </div>
            <button
              type="button"
              onClick={handle1ClickDemo}
              disabled={loading}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{t('quickFillDemo')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {errorMsg && (
          <p className="text-xs text-rose-500 font-medium p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
            {errorMsg}
          </p>
        )}

        {infoMsg && (
          <p className="text-xs text-teal-600 dark:text-teal-400 font-medium p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900">
            {infoMsg}
          </p>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {t('emailLabel')} *
              </label>
              <div className="relative mt-1">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hisobchi.uz"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {t('passwordLabel')} *
                </label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {t('forgotPasswordTitle')}?
                </button>
              </div>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer mt-2"
            >
              {loading ? t('loading') : t('loginButton')}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Ism va familiyangiz *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alisher Usmonov"
                className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {t('emailLabel')} *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alisher@biznes.uz"
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {t('passwordLabel')} *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {t('businessName')} *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Masalan: Rayhon Kofexona"
                className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Faoliyat turi
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="retail">Do‘kon</option>
                  <option value="cafe">Kafe / Qahvaxona</option>
                  <option value="salon">Salon</option>
                  <option value="minimarket">Mini-market</option>
                  <option value="workshop">Ustaxona</option>
                  <option value="other">Boshqa</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Asosiy valyuta
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  <option value="UZS">UZS (So‘m)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="RUB">RUB (₽)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer mt-2"
            >
              {loading ? t('loading') : t('registerButton')}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {t('emailLabel')} *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hisobchi.uz"
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              {loading ? t('loading') : 'Tiklash havolasini yuborish'}
            </button>
          </form>
        )}

        {/* Footer switch links */}
        <div className="pt-2 text-center text-xs space-y-1.5 border-t border-slate-100 dark:border-slate-800">
          {mode === 'login' ? (
            <p className="text-slate-500 dark:text-slate-400">
              {t('noAccountYet')}?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                {t('registerTitle')}
              </button>
            </p>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">
              {t('alreadyHaveAccount')}?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                {t('loginButton')}
              </button>
            </p>
          )}

          <button
            type="button"
            onClick={onBackToLanding}
            className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 block mx-auto pt-1 cursor-pointer"
          >
            ← {t('navLanding')}
          </button>
        </div>
      </div>
    </div>
  );
};
