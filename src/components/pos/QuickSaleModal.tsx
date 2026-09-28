import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Barcode,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { useBusiness } from '../../context/BusinessContext';
import { useAuth } from '../../context/AuthContext';
import { Product, Customer, Category, Sale } from '../../types';
import { formatMoney } from '../../lib/utils';

interface QuickSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleSuccess: (sale: Sale) => void;
}

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

export const QuickSaleModal: React.FC<QuickSaleModalProps> = ({ isOpen, onClose, onSaleSuccess }) => {
  const { t } = useI18n();
  const { activeBusiness } = useBusiness();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Checkout form
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'other'>('cash');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen || !activeBusiness) return;
    const bId = activeBusiness.id;
    Promise.all([
      fetch(`/api/products?businessId=${bId}`).then((r) => r.json()),
      fetch(`/api/categories?businessId=${bId}`).then((r) => r.json()),
      fetch(`/api/customers?businessId=${bId}`).then((r) => r.json()),
    ]).then(([prods, cats, custs]) => {
      if (Array.isArray(prods)) setProducts(prods);
      if (Array.isArray(cats)) setCategories(cats);
      if (Array.isArray(custs)) setCustomers(custs);
    });

    // Reset checkout form
    setCart([]);
    setSelectedCustomerId('');
    setCustomCustomerName('');
    setCustomerPhone('');
    setDiscount(0);
    setTax(0);
    setPaymentMethod('cash');
    setPaidAmount('');
    setNotes('');
    setErrorMsg('');
  }, [isOpen, activeBusiness]);

  if (!isOpen) return null;

  // Filter products by category & search
  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx].quantity += 1;
        return next;
      }
      return [...prev, { product, quantity: 1, unitPrice: product.sellingPrice }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const total = Math.max(0, subtotal - Number(discount) + Number(tax));
  const effectivePaid = paidAmount === '' ? total : Number(paidAmount);
  const debt = Math.max(0, total - effectivePaid);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMsg(t('cartEmpty'));
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const resolvedCustomer = customers.find((c) => c.id === selectedCustomerId);
    const finalCustomerName = resolvedCustomer ? resolvedCustomer.name : customCustomerName.trim() || undefined;

    const payload = {
      businessId: activeBusiness?.id,
      customerId: selectedCustomerId || undefined,
      customerName: finalCustomerName,
      customerPhone: resolvedCustomer ? resolvedCustomer.phone : customerPhone.trim() || undefined,
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      discount,
      tax,
      paidAmount: effectivePaid,
      paymentMethod,
      notes,
      cashierName: user?.name || 'Sotuvchi',
    };

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': activeBusiness?.id || '',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Savdoni yakunlashda xatolik');
        setIsSubmitting(false);
        return;
      }

      onSaleSuccess(data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Server bilan aloqa xatosi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-5xl h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Side: Product Catalog & Fast Picker */}
        <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Header & Search */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2.5 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  POS
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {t('salesTitle')}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchProductsInPos')}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Barchasi
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === c.id
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {filteredProducts.map((p) => {
              const inStock = p.quantity > 0;
              const isLow = p.quantity <= p.minStockLevel && inStock;
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={!inStock}
                  className={`text-left p-2.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                    !inStock
                      ? 'opacity-50 border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/20 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:shadow-xs hover:scale-[1.01]'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-2 leading-tight">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      SKU: {p.sku} {p.barcode ? `· ${p.barcode}` : ''}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatMoney(p.sellingPrice, activeBusiness?.currency)}
                    </span>
                    <span
                      className={`text-[10px] font-medium tabular-nums ${
                        !inStock
                          ? 'text-rose-500'
                          : isLow
                          ? 'text-amber-500'
                          : 'text-slate-400'
                      }`}
                    >
                      {p.quantity} {p.unit}
                    </span>
                  </div>
                </button>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                {t('noData')}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Cart, Customer Picker & Payment Checkout */}
        <div className="w-full md:w-96 flex flex-col bg-slate-50/70 dark:bg-slate-900/70 overflow-hidden">
          {/* Cart Header */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-xs text-slate-900 dark:text-white">
                Savat ({cart.reduce((a, b) => a + b.quantity, 0)} {t('unitPcs')})
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-[11px] text-rose-500 hover:text-rose-600 font-medium"
              >
                Tozalash
              </button>
            )}
            <button
              onClick={onClose}
              className="hidden md:block p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs gap-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">
                    {item.product.name}
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                    {formatMoney(item.unitPrice, activeBusiness?.currency)}
                  </p>
                </div>

                {/* Qty Stepper */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-bold text-xs px-1.5 tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.product.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-xs px-4">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>{t('cartEmpty')}</p>
              </div>
            )}
          </div>

          {/* Checkout Panel */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 text-xs">
            {errorMsg && (
              <p className="text-[11px] text-rose-500 font-medium p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                {errorMsg}
              </p>
            )}

            {/* Customer Picker */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3" /> {t('customer')}
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">{t('walkInCustomer')}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
              {!selectedCustomerId && (
                <input
                  type="text"
                  value={customCustomerName}
                  onChange={(e) => setCustomCustomerName(e.target.value)}
                  placeholder="Mijoz ismi (ixtiyoriy)..."
                  className="w-full p-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              )}
            </div>

            {/* Payment Method Tabs */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {t('paymentMethod')}
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'cash', label: 'Naqd', icon: Banknote },
                  { id: 'card', label: 'Karta', icon: CreditCard },
                  { id: 'transfer', label: 'Payme/Click', icon: Smartphone },
                  { id: 'other', label: 'Qarzga', icon: HelpCircle },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-1.5 rounded-lg border text-center flex flex-col items-center gap-0.5 transition-colors cursor-pointer ${
                        paymentMethod === m.id
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[10px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Discount & Partial Payment */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-medium">{t('discount')}</label>
                <input
                  type="number"
                  min="0"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full p-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-medium">{t('paidAmount')}</label>
                <input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder={total.toString()}
                  className="w-full p-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums font-semibold"
                />
              </div>
            </div>

            {/* Summary Line */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex justify-between text-slate-500 dark:text-slate-400 text-xs">
                <span>{t('subtotal')}:</span>
                <span className="tabular-nums font-medium">{formatMoney(subtotal, activeBusiness?.currency)}</span>
              </div>
              {debt > 0 && (
                <div className="flex justify-between text-rose-500 font-semibold text-xs">
                  <span>{t('debtAmount')}:</span>
                  <span className="tabular-nums">{formatMoney(debt, activeBusiness?.currency)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white pt-1">
                <span>{t('total')}:</span>
                <span className="text-emerald-600 dark:text-emerald-400 tabular-nums text-base">
                  {formatMoney(total, activeBusiness?.currency)}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleCheckout}
              disabled={isSubmitting || cart.length === 0}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? t('loading') : t('completeSale')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
