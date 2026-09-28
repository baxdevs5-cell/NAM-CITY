import React from 'react';
import { X, Printer, CheckCircle2, Building2 } from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { useBusiness } from '../../context/BusinessContext';
import { Sale, Invoice } from '../../types';
import { formatMoney, formatDate } from '../../lib/utils';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale?: Sale | null;
  invoice?: Invoice | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, sale, invoice }) => {
  const { t, language } = useI18n();
  const { activeBusiness } = useBusiness();

  if (!isOpen || (!sale && !invoice)) return null;

  const docNumber = sale?.saleNumber || invoice?.invoiceNumber || 'INV-000';
  const customerName = sale?.customerName || invoice?.customerName || t('walkInCustomer');
  const items = sale?.items || invoice?.items || [];
  const subtotal = sale?.subtotal ?? invoice?.subtotal ?? 0;
  const discount = sale?.discount ?? invoice?.discount ?? 0;
  const tax = sale?.tax ?? invoice?.tax ?? 0;
  const total = sale?.total ?? invoice?.total ?? 0;
  const paid = sale?.paidAmount ?? (invoice?.status === 'paid' ? total : 0);
  const debt = sale?.debtAmount ?? (invoice?.status === 'pending' ? total : 0);
  const createdAt = sale?.createdAt || invoice?.createdAt || new Date().toISOString();
  const cashier = sale?.cashierName || 'HISOBCHI Kassa';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Controls Header */}
        <div className="no-print flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {t('viewReceipt')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('printReceipt')}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="printable-area flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs">
          {/* Business Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300 dark:border-slate-700">
            <h2 className="text-base font-bold font-sans tracking-tight">
              {activeBusiness?.name || 'HISOBCHI'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {activeBusiness?.address || 'Toshkent shahar'}
            </p>
            {activeBusiness?.phone && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tel: {activeBusiness.phone}
              </p>
            )}
            {activeBusiness?.taxId && (
              <p className="text-[10px] text-slate-400 mt-0.5">
                INN: {activeBusiness.taxId}
              </p>
            )}
          </div>

          {/* Receipt Info */}
          <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t('saleNumber')}:</span>
              <span className="font-semibold">{docNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t('date')}:</span>
              <span>{formatDate(createdAt, language)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t('customer')}:</span>
              <span className="truncate max-w-[200px]">{customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">{t('cashier')}:</span>
              <span>{cashier}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-2">
            <div className="flex justify-between text-[11px] font-bold text-slate-400 pb-1 border-b border-slate-200 dark:border-slate-800">
              <span className="flex-1">Mahsulot</span>
              <span className="w-12 text-center">Soni</span>
              <span className="w-20 text-right">Summa</span>
            </div>
            {items.map((item: any, idx: number) => {
              const name = item.productName || item.name;
              const q = item.quantity;
              const p = item.unitPrice;
              const tVal = item.total || q * p;
              return (
                <div key={idx} className="flex justify-between items-start text-[11px]">
                  <div className="flex-1 pr-2">
                    <p className="font-sans font-medium leading-tight">{name}</p>
                    <p className="text-[10px] text-slate-400 tabular-nums">
                      {q} × {formatMoney(p, activeBusiness?.currency)}
                    </p>
                  </div>
                  <span className="w-20 text-right font-medium tabular-nums">
                    {formatMoney(tVal, activeBusiness?.currency)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>{t('subtotal')}:</span>
              <span className="tabular-nums">{formatMoney(subtotal, activeBusiness?.currency)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>{t('discount')}:</span>
                <span className="tabular-nums">-{formatMoney(discount, activeBusiness?.currency)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>{t('tax')}:</span>
                <span className="tabular-nums">+{formatMoney(tax, activeBusiness?.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-200 dark:border-slate-800">
              <span>{t('total')}:</span>
              <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatMoney(total, activeBusiness?.currency)}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 pt-1">
              <span>{t('paidAmount')}:</span>
              <span className="tabular-nums font-semibold">{formatMoney(paid, activeBusiness?.currency)}</span>
            </div>
            {debt > 0 && (
              <div className="flex justify-between text-[11px] text-rose-500 font-semibold">
                <span>{t('debtAmount')}:</span>
                <span className="tabular-nums">{formatMoney(debt, activeBusiness?.currency)}</span>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="pt-4 text-center text-[10px] text-slate-400 space-y-1">
            <p>Xaridingiz uchun rahmat!</p>
            <p>HISOBCHI SaaS tizimida shakllantirildi</p>
          </div>
        </div>
      </div>
    </div>
  );
};
