import React, { useState, useEffect } from 'react';
import { I18nProvider, useI18n } from './i18n/context';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BusinessProvider } from './context/BusinessContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, SectionType } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { SalesView } from './components/sales/SalesView';
import { ProductsView } from './components/products/ProductsView';
import { CustomersView } from './components/customers/CustomersView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { DebtsView } from './components/debts/DebtsView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { InvoicesView } from './components/invoices/InvoicesView';
import { ReportsView } from './components/reports/ReportsView';
import { AIView } from './components/ai/AIView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { SettingsView } from './components/settings/SettingsView';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { QuickSaleModal } from './components/pos/QuickSaleModal';
import { ReceiptModal } from './components/invoices/ReceiptModal';
import { LandingView } from './components/landing/LandingView';
import { AuthPages } from './components/auth/AuthPages';
import { Sale } from './types';

const MainApp: React.FC = () => {
  const { t } = useI18n();
  const { isAuthenticated, isLoading } = useAuth();

  const [currentSection, setCurrentSection] = useState<SectionType>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [receiptToView, setReceiptToView] = useState<Sale | null>(null);

  // Unauthenticated landing vs auth state
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');

  // Custom navigation event listener
  useEffect(() => {
    const handleNavigate = (e: any) => {
      if (e.detail) setCurrentSection(e.detail);
    };
    window.addEventListener('navigate-section', handleNavigate);
    return () => window.removeEventListener('navigate-section', handleNavigate);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 text-xs">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span>HISOBCHI yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, show landing page or auth page
  if (!isAuthenticated) {
    if (authView === 'landing') {
      return (
        <LandingView
          onGetStarted={() => setAuthView('register')}
          onLogin={() => setAuthView('login')}
        />
      );
    }
    return (
      <AuthPages
        initialMode={authView === 'register' ? 'register' : 'login'}
        onSuccess={() => setAuthView('landing')}
        onBackToLanding={() => setAuthView('landing')}
      />
    );
  }

  const getSectionTitle = () => {
    switch (currentSection) {
      case 'dashboard':
        return t('navDashboard');
      case 'sales':
        return t('navSales');
      case 'products':
        return t('navProducts');
      case 'customers':
        return t('navCustomers');
      case 'suppliers':
        return t('navSuppliers');
      case 'debts':
        return t('navDebts');
      case 'expenses':
        return t('navExpenses');
      case 'invoices':
        return t('navInvoices');
      case 'reports':
        return t('navReports');
      case 'ai':
        return t('navAI');
      case 'notifications':
        return t('navNotifications');
      case 'settings':
        return t('navSettings');
      default:
        return t('navDashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors relative flex">
      {/* Subtle ambient colorful background */}
      <div className="ambient-bg">
        <div className="ambient-blob-1" />
        <div className="ambient-blob-2" />
      </div>

      {/* Collapsible Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Navbar
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenQuickSale={() => setIsQuickSaleOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          currentSectionTitle={getSectionTitle()}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentSection === 'dashboard' && (
            <DashboardView
              onOpenQuickSale={() => setIsQuickSaleOpen(true)}
              onNavigate={setCurrentSection}
              onViewReceipt={(sale) => setReceiptToView(sale)}
            />
          )}

          {currentSection === 'sales' && (
            <SalesView
              onOpenQuickSale={() => setIsQuickSaleOpen(true)}
              onViewReceipt={(sale) => setReceiptToView(sale)}
            />
          )}

          {currentSection === 'products' && <ProductsView />}

          {currentSection === 'customers' && <CustomersView />}

          {currentSection === 'suppliers' && <SuppliersView />}

          {currentSection === 'debts' && <DebtsView />}

          {currentSection === 'expenses' && <ExpensesView />}

          {currentSection === 'invoices' && <InvoicesView />}

          {currentSection === 'reports' && <ReportsView />}

          {currentSection === 'ai' && <AIView />}

          {currentSection === 'notifications' && (
            <NotificationsView onNavigate={setCurrentSection} />
          )}

          {currentSection === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setCurrentSection}
      />

      {/* Quick POS Terminal Modal */}
      <QuickSaleModal
        isOpen={isQuickSaleOpen}
        onClose={() => setIsQuickSaleOpen(false)}
        onSaleSuccess={(sale) => {
          setReceiptToView(sale);
        }}
      />

      {/* Receipt & Invoice Viewer Modal */}
      {receiptToView && (
        <ReceiptModal
          isOpen={!!receiptToView}
          onClose={() => setReceiptToView(null)}
          sale={receiptToView}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <BusinessProvider>
            <MainApp />
          </BusinessProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
