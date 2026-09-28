import React from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  CreditCard,
  Receipt,
  Bot,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Smartphone,
  Globe,
  Sun,
  Moon,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { useTheme } from '../../context/ThemeContext';
import { Language } from '../../types';

interface LandingViewProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onGetStarted, onLogin }) => {
  const { t, language, setLanguage } = useI18n();
  const { theme, toggleTheme } = useTheme();

  const features = [
    {
      icon: ShoppingCart,
      title: t('landingFeature1Title'),
      desc: t('landingFeature1Desc'),
      color: 'emerald',
    },
    {
      icon: Package,
      title: t('landingFeature2Title'),
      desc: t('landingFeature2Desc'),
      color: 'teal',
    },
    {
      icon: CreditCard,
      title: t('landingFeature3Title'),
      desc: t('landingFeature3Desc'),
      color: 'amber',
    },
    {
      icon: Bot,
      title: t('landingFeature4Title'),
      desc: t('landingFeature4Desc'),
      color: 'purple',
    },
  ];

  const steps = [
    {
      num: '01',
      title: t('howStep1Title'),
      desc: t('howStep1Desc'),
    },
    {
      num: '02',
      title: t('howStep2Title'),
      desc: t('howStep2Desc'),
    },
    {
      num: '03',
      title: t('howStep3Title'),
      desc: t('howStep3Desc'),
    },
  ];

  const faqs = [
    {
      q: 'HISOBCHI qaysi sohalar uchun mo‘ljallangan?',
      a: 'Oziq-ovqat va nooziq-ovqat do‘konlari, kafelar, dorixonalar, go‘zallik salonlari, ustaxonalar va boshqa barcha kichik va o‘rta savdo-xizmat nuqtalari uchun juda qulay.',
    },
    {
      q: 'Telefon yoki planshetda ishlaydimi?',
      a: 'Ha, tizim to‘liq moslashuvchan. Har qanday smartfon, planshet, noutbuk va kompyuter brauzerida tezkor va qulay ishlaydi.',
    },
    {
      q: 'Shtrix-kod skaneri va chek printerga ulanadimi?',
      a: 'Albatta, kassa modulimiz standart USB va Bluetooth shtrix-kod skanerlari bilan ishlaydi hamda har qanday kassa printeriga chek chiqaradi.',
    },
    {
      q: 'HISOBCHI AI qanday yordam beradi?',
      a: 'Sun‘iy intellekt sizning real savdolaringiz va xarajatlaringizni tahlil qilib, sof foydangiz, kamaygan tovarlar va qarzdorlar bo‘yicha tezkor javoblar beradi.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors relative overflow-hidden">
      {/* Ambient background aura */}
      <div className="ambient-bg">
        <div className="ambient-blob-1" />
        <div className="ambient-blob-2" />
      </div>

      {/* Top Navigation */}
      <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-200/80 dark:border-slate-800/80 px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-emerald-500 via-teal-600 to-cyan-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-extrabold tracking-tight">HISOBCHI</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <a href="#features" className="hover:text-emerald-600 transition-colors">Xususiyatlar</a>
          <a href="#how" className="hover:text-emerald-600 transition-colors">Qanday ishlaydi</a>
          <a href="#ai" className="hover:text-emerald-600 transition-colors">HISOBCHI AI</a>
          <a href="#faq" className="hover:text-emerald-600 transition-colors">Ko‘p beriladigan savollar</a>
        </nav>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
            {(['uz', 'ru', 'en'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`px-1.5 py-0.5 rounded cursor-pointer uppercase ${
                  language === l ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          <button
            onClick={onLogin}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            {t('liveDemoBtn')}
          </button>

          <button
            onClick={onGetStarted}
            className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            {t('getStartedFree')}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 px-4 md:px-8 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-800/40">
          <Zap className="w-3.5 h-3.5" />
          <span>Kichik va o‘rta biznes uchun professional SaaS ERP</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] text-balance">
          {t('landingHeroTitle')}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {t('landingHeroSubtitle')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t('getStartedFree')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onLogin}
            className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {t('quickFillDemo')}
          </button>
        </div>

        {/* Live UI Mockup / Dashboard Preview Card */}
        <div className="pt-8">
          <div className="p-3 sm:p-5 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl backdrop-blur-md text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-2">
                  Oloy Bozori Mini-market · Boshqaruv paneli
                </span>
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                ● Jonli tizim
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[11px] text-slate-400">Oylik tushum</span>
                <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">52,850,000 UZS</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[11px] text-slate-400">Xarajatlar</span>
                <p className="text-base font-extrabold text-rose-500 mt-0.5">10,270,000 UZS</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[11px] text-slate-400">Sof foyda</span>
                <p className="text-base font-extrabold text-teal-600 dark:text-teal-400 mt-0.5">42,580,000 UZS</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[11px] text-slate-400">Mijozlar qarzi</span>
                <p className="text-base font-extrabold text-amber-500 mt-0.5">770,000 UZS</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 px-4 md:px-8 max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Biznesingizning barcha bo‘g‘inlari bir joyda
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Savdodan to sof foydagacha bo‘lgan barcha hisob-kitoblar avtomatlashgan
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-2.5"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {f.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-16 px-4 md:px-8 max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {t('howItWorks')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Murakkab buxgalteriya bilimlarisiz, 3 oddiy qadamda ish boshlang
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((st, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-2 relative"
            >
              <span className="text-2xl font-black text-emerald-600/40 dark:text-emerald-400/30 font-mono">
                {st.num}
              </span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {st.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {st.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* HISOBCHI AI Highlight */}
      <section id="ai" className="py-16 px-4 md:px-8 max-w-5xl mx-auto">
        <div className="p-6 sm:p-10 rounded-3xl bg-linear-to-r from-purple-900/20 via-indigo-900/10 to-emerald-900/20 border border-purple-200/60 dark:border-purple-800/50 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
            <Bot className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            HISOBCHI AI — Shaxsiy tahlilchingiz
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
            Biznesingizning savdo natijalari, eng ko‘p foyda keltirgan mahsulotlar, qarzlar va xarajatlar bo‘yicha to‘g‘ridan-to‘g‘ri o‘zbek tilida savol bering va soniyalar ichida aniq hisobot oling.
          </p>
          <div className="pt-2">
            <button
              onClick={onLogin}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
            >
              HISOBCHI AI ni sinab ko‘rish →
            </button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 px-4 md:px-8 max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Ko‘p beriladigan savollar
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-1.5"
            >
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {f.q}
              </p>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-slate-200/80 dark:border-slate-800/80 text-center text-xs text-slate-400 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span className="font-bold text-slate-700 dark:text-slate-300">HISOBCHI SaaS</span>
        </div>
        <p>© {new Date().getFullYear()} HISOBCHI. Barcha huquqlar himoyalangan.</p>
      </footer>
    </div>
  );
};
