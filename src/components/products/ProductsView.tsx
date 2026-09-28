import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  SlidersHorizontal,
  AlertTriangle,
  FileSpreadsheet,
  X,
  CheckCircle2,
  ArrowUpDown,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { useBusiness } from '../../context/BusinessContext';
import { Product, Category, Supplier } from '../../types';
import { formatMoney, exportToCsv } from '../../lib/utils';

export const ProductsView: React.FC = () => {
  const { t } = useI18n();
  const { activeBusiness } = useBusiness();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockTab, setStockTab] = useState<'all' | 'low' | 'out'>('all');

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('Keltirildi (Yangi partiya)');

  // Form fields
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPurchasePrice, setFormPurchasePrice] = useState('');
  const [formSellingPrice, setFormSellingPrice] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formMinStock, setFormMinStock] = useState('10');
  const [formUnit, setFormUnit] = useState<'pcs' | 'kg' | 'liter' | 'box' | 'meter'>('pcs');
  const [formSupplier, setFormSupplier] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState('');

  const loadData = () => {
    if (!activeBusiness) return;
    setLoading(true);
    const bId = activeBusiness.id;
    Promise.all([
      fetch(`/api/products?businessId=${bId}`).then((r) => r.json()),
      fetch(`/api/categories?businessId=${bId}`).then((r) => r.json()),
      fetch(`/api/suppliers?businessId=${bId}`).then((r) => r.json()),
    ])
      .then(([prods, cats, sups]) => {
        if (Array.isArray(prods)) setProducts(prods);
        if (Array.isArray(cats)) setCategories(cats);
        if (Array.isArray(sups)) setSuppliers(sups);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [activeBusiness]);

  const curr = activeBusiness?.currency || 'UZS';

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSku(`SKU-${Date.now().toString().slice(-5)}`);
    setFormBarcode('');
    setFormCategory(categories[0]?.id || 'cat_drinks');
    setFormPurchasePrice('');
    setFormSellingPrice('');
    setFormQuantity('0');
    setFormMinStock('10');
    setFormUnit('pcs');
    setFormSupplier('');
    setFormDescription('');
    setFormError('');
    setIsAddEditOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormBarcode(p.barcode || '');
    setFormCategory(p.categoryId);
    setFormPurchasePrice(p.purchasePrice.toString());
    setFormSellingPrice(p.sellingPrice.toString());
    setFormQuantity(p.quantity.toString());
    setFormMinStock(p.minStockLevel.toString());
    setFormUnit(p.unit);
    setFormSupplier(p.supplierId || '');
    setFormDescription(p.description || '');
    setFormError('');
    setIsAddEditOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Mahsulot nomi kiritilishi shart');
      return;
    }
    const buyPrice = Number(formPurchasePrice);
    const sellPrice = Number(formSellingPrice);
    if (isNaN(buyPrice) || buyPrice < 0 || isNaN(sellPrice) || sellPrice < 0) {
      setFormError('Tan narx va sotuv narxi musbat son bo‘lishi lozim');
      return;
    }

    const payload = {
      businessId: activeBusiness?.id,
      name: formName.trim(),
      sku: formSku.trim(),
      barcode: formBarcode.trim(),
      categoryId: formCategory,
      purchasePrice: buyPrice,
      sellingPrice: sellPrice,
      quantity: Math.max(0, Number(formQuantity) || 0),
      minStockLevel: Math.max(0, Number(formMinStock) || 5),
      unit: formUnit,
      supplierId: formSupplier || undefined,
      description: formDescription.trim(),
    };

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-business-id': activeBusiness?.id || '' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsAddEditOpen(false);
        loadData();
      } else {
        const data = await res.json();
        setFormError(data.error || 'Xatolik yuz berdi');
      }
    } catch (err: any) {
      setFormError(err.message || 'Server xatosi');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProductToDelete(null);
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdjustStock = async () => {
    if (!adjustingProduct) return;
    const delta = Number(adjustDelta);
    if (isNaN(delta) || delta === 0) return;

    try {
      const res = await fetch(`/api/products/${adjustingProduct.id}/adjust-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta, reason: adjustReason }),
      });
      if (res.ok) {
        setAdjustingProduct(null);
        setAdjustDelta('');
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q));
    const matchCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchStockTab =
      stockTab === 'all'
        ? true
        : stockTab === 'low'
        ? p.quantity <= p.minStockLevel && p.quantity > 0
        : p.quantity <= 0;
    return matchSearch && matchCategory && matchStockTab;
  });

  const lowStockCount = products.filter((p) => p.quantity <= p.minStockLevel && p.quantity > 0).length;
  const outOfStockCount = products.filter((p) => p.quantity <= 0).length;

  const handleExport = () => {
    const rows: (string | number)[][] = [
      ['Nomi', 'SKU', 'Shtrix-kod', 'Kategoriya', 'Tan narx', 'Sotuv narx', 'Ustama %', 'Qoldiq', 'Birlik', 'Min zaxira'],
      ...filteredProducts.map((p) => {
        const cat = categories.find((c) => c.id === p.categoryId)?.name || p.categoryId;
        const margin = p.purchasePrice > 0 ? Math.round(((p.sellingPrice - p.purchasePrice) / p.purchasePrice) * 100) : 0;
        return [
          p.name,
          p.sku,
          p.barcode,
          cat,
          p.purchasePrice,
          p.sellingPrice,
          `${margin}%`,
          p.quantity,
          p.unit,
          p.minStockLevel,
        ];
      }),
    ];
    exportToCsv(`HISOBCHI_Ombor_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-5">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            {t('productsTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('productsSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('exportCsv')}</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addProduct')}</span>
          </button>
        </div>
      </div>

      {/* Stock Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setStockTab('all')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
            stockTab === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          Barcha mahsulotlar ({products.length})
        </button>
        <button
          onClick={() => setStockTab('low')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
            stockTab === 'low'
              ? 'bg-amber-500 text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <span>{t('statusLowStock')}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950 font-bold">
            {lowStockCount}
          </span>
        </button>
        <button
          onClick={() => setStockTab('out')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
            stockTab === 'out'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <span>{t('statusOutOfStock')}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 dark:bg-rose-950 font-bold">
            {outOfStockCount}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nomi, SKU yoki shtrix-kod..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            <option value="all">Barcha kategoriyalar</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 font-semibold">
                <th className="py-3 px-4">{t('productName')}</th>
                <th className="py-3 px-4">{t('category')}</th>
                <th className="py-3 px-4 text-right">{t('purchasePrice')}</th>
                <th className="py-3 px-4 text-right">{t('sellingPrice')}</th>
                <th className="py-3 px-4 text-center">{t('margin')}</th>
                <th className="py-3 px-4 text-center">{t('stockQty')}</th>
                <th className="py-3 px-4 text-center">{t('stockStatus')}</th>
                <th className="py-3 px-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map((p) => {
                const catName = categories.find((c) => c.id === p.categoryId)?.name || '-';
                const marginPct =
                  p.purchasePrice > 0
                    ? Math.round(((p.sellingPrice - p.purchasePrice) / p.purchasePrice) * 100)
                    : 0;
                const isOutOfStock = p.quantity <= 0;
                const isLowStock = p.quantity <= p.minStockLevel && !isOutOfStock;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                      <p className="text-[10px] text-slate-400">
                        SKU: {p.sku} {p.barcode ? `· ${p.barcode}` : ''}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {catName}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-500 tabular-nums">
                      {formatMoney(p.purchasePrice, curr)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatMoney(p.sellingPrice, curr)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        +{marginPct}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white tabular-nums">
                      {p.quantity} {p.unit}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          isOutOfStock
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            : isLowStock
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {isOutOfStock
                          ? t('statusOutOfStock')
                          : isLowStock
                          ? t('statusLowStock')
                          : t('statusInStock')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setAdjustingProduct(p);
                            setAdjustDelta('');
                          }}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title={t('adjustStock')}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          title={t('editProduct')}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setProductToDelete(p)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title={t('deleteProduct')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
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

      {/* Add / Edit Product Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingProduct ? t('editProduct') : t('addProduct')}
              </h3>
              <button
                onClick={() => setIsAddEditOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-4 overflow-y-auto space-y-3 text-xs">
              {formError && (
                <p className="text-[11px] text-rose-500 font-medium p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                  {formError}
                </p>
              )}

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {t('productName')} *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Masalan: Coca-Cola 1.5L"
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {t('sku')}
                  </label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {t('barcode')}
                  </label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    placeholder="Shtrix-kod..."
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {t('category')}
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {t('unit')}
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value as any)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="pcs">{t('unitPcs')}</option>
                    <option value="kg">{t('unitKg')}</option>
                    <option value="liter">{t('unitLiter')}</option>
                    <option value="box">{t('unitBox')}</option>
                    <option value="meter">{t('unitMeter')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {t('purchasePrice')} ({curr}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(e.target.value)}
                    placeholder="10000"
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {t('sellingPrice')} ({curr}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value)}
                    placeholder="13000"
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {t('stockQty')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {t('minStock')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {t('supplier')}
                </label>
                <select
                  value={formSupplier}
                  onChange={(e) => setFormSupplier(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="">Noma‘lum / Boshqa</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {t('description')}
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Mahsulot haqida qo‘shimcha ma‘lumot..."
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('adjustStock')}
              </h3>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {adjustingProduct.name}
              </p>
              <p className="text-slate-400">
                Hozirgi qoldiq: <span className="font-bold">{adjustingProduct.quantity} {adjustingProduct.unit}</span>
              </p>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                O‘zgarish miqdori (+ qo‘shish / - ayirish)
              </label>
              <input
                type="number"
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(e.target.value)}
                placeholder="Masalan: +20 yoki -5"
                className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {t('adjustReason')}
              </label>
              <select
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="Keltirildi (Yangi partiya)">Keltirildi (Yangi partiya)</option>
                <option value="Yaroqsiz / Buzilgan tovar">Yaroqsiz / Buzilgan tovar</option>
                <option value="Ombor inventarizatsiyasi">Ombor inventarizatsiyasi</option>
                <option value="Qaytarilgan tovar">Qaytarilgan tovar</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setAdjustingProduct(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleAdjustStock}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('confirmDelete')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                "{productToDelete.name}" mahsuloti ombordan butunlay o‘chiriladi.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => handleDeleteProduct(productToDelete.id)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
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
