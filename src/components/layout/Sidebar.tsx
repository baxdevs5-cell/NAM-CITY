import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Truck,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  BarChart3,
  Bot,
  Bell,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { useBusiness } from '../../context/BusinessContext';

export type SectionType =
  | 'dashboard'
  | 'sales'
  | 'products'
  | 'customers'
  | 'suppliers'
  | 'debts'
  | 'expenses'
  | 'invoices'
  | 'reports'
  | 'ai'
  | 'notifications'
  | 'settings';

interface SidebarProps {
  currentSection: SectionType;
  onSelectSection: (section: SectionType) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { t } = useI18n();
  const { activeBusiness } = useBusiness();

  const navItems: { id: SectionType; labelKey: any; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', labelKey: 'navDashboard', icon: LayoutDashboard },
    { id: 'sales', labelKey: 'navSales', icon: ShoppingCart },
    { id: 'products', labelKey: 'navProducts', icon: Package },
    { id: 'customers', labelKey: 'navCustomers', icon: Users },
    { id: 'suppliers', labelKey: 'navSuppliers', icon: Truck },
    { id: 'debts', labelKey: 'navDebts', icon: CreditCard },
    { id: 'expenses', labelKey: 'navExpenses', icon: Receipt },
    { id: 'invoices', labelKey: 'navInvoices', icon: FileSpreadsheet },
    { id: 'reports', labelKey: 'navReports', icon: BarChart3 },
    { id: 'ai', labelKey: 'navAI', icon: Bot },
    { id: 'notifications', labelKey: 'navNotifications', icon: Bell },
    { id: 'settings', labelKey: 'navSettings', icon: Settings },
  ];

  const handleItemClick = (id: SectionType) => {
    onSelectSection(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white/95 dark:bg-slate-900/95 border-r border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md transition-all duration-200 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div
          onClick={() => handleItemClick('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer overflow-hidden"
        >
          {/* Brand Logo concept: 📊 + 💰 + 📈 in geometric badge */}
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-emerald-500 via-teal-600 to-cyan-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
            <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-base leading-tight">
                HISOBCHI
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                SaaS ERP
              </span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          const isAiItem = item.id === 'ai';

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : isAiItem
                  ? 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={isCollapsed ? t(item.labelKey) : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive
                    ? 'text-white'
                    : isAiItem
                    ? 'text-purple-500'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              />
              {!isCollapsed && (
                <span className="truncate">{t(item.labelKey)}</span>
              )}
              {!isCollapsed && isAiItem && !isActive && (
                <span className="ml-auto text-[9px] uppercase px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold tracking-wider">
                  AI
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Business Info Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                {activeBusiness?.name || 'Mening Biznesim'}
              </p>
              <p className="text-[10px] text-slate-400 uppercase font-mono">
                {activeBusiness?.currency || 'UZS'}
              </p>
            </div>
            <button
              onClick={() => handleItemClick('settings')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Collapse Toggle */}
      <div className="hidden md:flex items-center justify-end p-2 border-t border-slate-200/80 dark:border-slate-800/80">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-xs"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block shrink-0 h-screen sticky top-0 z-40 transition-all duration-200 ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-xs z-50 transition-opacity"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform transition-transform duration-200 ease-in-out shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};
