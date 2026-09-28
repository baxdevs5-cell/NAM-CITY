import React, { useState, useEffect } from 'react';
import { Search, X, Package, Users, Truck, ShoppingCart, CreditCard, ArrowRight } from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { useBusiness } from '../../context/BusinessContext';
import { Product, Customer, Supplier, Sale, Debt } from '../../types';
import { formatMoney } from '../../lib/utils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const { t } = useI18n();
  const { activeBusiness } = useBusiness();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !activeBusiness) return;
    setLoading(true);
    const bId = activeBusiness.id;
    Promise.all([
      fetch(`/api/products?businessId=${bId}`).then((r) => r.json()),
      fetch(`/api/customers?businessId=${bId}`).then((r) => r.json()),
      fetch(`/api/suppliers?businessId=${bId}`).then((r) => r.json()),
      fetch(`/api/sales?businessId=${bId}`).then((r) => r.json()),
      fetch(`/api/debts?businessId=${bId}`).then((r) => r.json()),
    ])
      .then(([prods, custs, sups, sls, dbts]) => {
        if (Array.isArray(prods)) setProducts(prods);
        if (Array.isArray(custs)) setCustomers(custs);
        if (Array.isArray(sups)) setSuppliers(sups);
        if (Array.isArray(sls)) setSales(sls);
        if (Array.isArray(dbts)) setDebts(dbts);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [isOpen, activeBusiness]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredProducts = q
    ? products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q)).slice(0, 4)
    : [];

  const filteredCustomers = q
    ? customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)).slice(0, 4)
    : [];

  const filteredSuppliers = q
    ? suppliers.filter((s) => s.name.toLowerCase().includes(q) || s.phone.includes(q)).slice(0, 3)
    : [];

  const filteredSales = q
    ? sales.filter((s) => s.saleNumber.toLowerCase().includes(q) || (s.customerName && s.customerName.toLowerCase().includes(q))).slice(0, 3)
    : [];

  const filteredDebts = q
    ? debts.filter((d) => d.entityName.toLowerCase().includes(q) || d.phone.includes(q)).slice(0, 3)
    : [];

  const totalResults =
    filteredProducts.length +
    filteredCustomers.length +
    filteredSuppliers.length +
    filteredSales.length +
    filteredDebts.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {loading && <p className="text-center text-slate-400 py-6">{t('loading')}</p>}

          {!loading && !q && (
            <div className="py-8 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>{t('searchPlaceholder')}</p>
            </div>
          )}

          {!loading && q && totalResults === 0 && (
            <div className="py-8 text-center text-slate-400">
              <p>{t('noData')}</p>
            </div>
          )}

          {/* Products Section */}
          {filteredProducts.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-emerald-500" />
                {t('navProducts')}
              </p>
              <div className="space-y-1">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onNavigate('products');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{p.name}</p>
                      <p className="text-slate-400 text-[11px]">
                        SKU: {p.sku} {p.barcode ? `· ${p.barcode}` : ''} · Qoldiq: {p.quantity} {p.unit}
                      </p>
                    </div>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatMoney(p.sellingPrice, activeBusiness?.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers Section */}
          {filteredCustomers.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                {t('navCustomers')}
              </p>
              <div className="space-y-1">
                {filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onNavigate('customers');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-slate-400 text-[11px]">{c.phone} {c.address ? `· ${c.address}` : ''}</p>
                    </div>
                    {c.debtAmount > 0 ? (
                      <span className="text-rose-500 font-semibold tabular-nums">
                        Qarzi: {formatMoney(c.debtAmount, activeBusiness?.currency)}
                      </span>
                    ) : (
                      <span className="text-slate-400">{c.purchaseCount} xarid</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sales Section */}
          {filteredSales.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-purple-500" />
                {t('navSales')}
              </p>
              <div className="space-y-1">
                {filteredSales.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      onNavigate('sales');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{s.saleNumber}</p>
                      <p className="text-slate-400 text-[11px]">{s.customerName || 'Oddiy xaridor'} · {s.paymentMethod}</p>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                      {formatMoney(s.total, activeBusiness?.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Debts Section */}
          {filteredDebts.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                {t('navDebts')}
              </p>
              <div className="space-y-1">
                {filteredDebts.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => {
                      onNavigate('debts');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{d.entityName}</p>
                      <p className="text-slate-400 text-[11px]">
                        {d.type === 'customer' ? 'Mijoz qarzi' : 'Yetkazuvchiga qarz'} · Muddat: {d.dueDate}
                      </p>
                    </div>
                    <span className="font-bold text-rose-500 tabular-nums">
                      {formatMoney(d.remainingAmount, activeBusiness?.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
