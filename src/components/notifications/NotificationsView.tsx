import React, { useState, useEffect } from 'react';
import { Bell, Check, Package, CreditCard, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { useBusiness } from '../../context/BusinessContext';
import { NotificationItem } from '../../types';
import { formatDate } from '../../lib/utils';

interface NotificationsViewProps {
  onNavigate: (section: any) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigate }) => {
  const { t, language } = useI18n();
  const { activeBusiness } = useBusiness();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = () => {
    if (!activeBusiness) return;
    setLoading(true);
    fetch(`/api/notifications?businessId=${activeBusiness.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  }, [activeBusiness]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: activeBusiness?.id }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'low_stock':
      case 'out_of_stock':
        return <Package className="w-4 h-4 text-amber-500" />;
      case 'debt_due':
        return <CreditCard className="w-4 h-4 text-rose-500" />;
      case 'expense_spike':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-500" />
            {t('notificationsTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Zaxira, qarzlar va muhim biznes ogohlantirishlari
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{t('markAllAsRead')}</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 flex items-start justify-between gap-3 transition-colors ${
              !n.isRead ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                {getIcon(n.type)}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    {n.title}
                  </h4>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {n.message}
                </p>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                  <span>{formatDate(n.createdAt, language)}</span>
                  {n.link && (
                    <button
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.link === '/products') onNavigate('products');
                        if (n.link === '/debts') onNavigate('debts');
                        if (n.link === '/dashboard') onNavigate('dashboard');
                      }}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                    >
                      Ko‘rish →
                    </button>
                  )}
                </div>
              </div>
            </div>

            {!n.isRead && (
              <button
                onClick={() => markAsRead(n.id)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="O‘qilgan deb belgilash"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>{t('noNotifications')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
