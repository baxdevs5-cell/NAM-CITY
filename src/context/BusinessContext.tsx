import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Business } from '../types';
import { useAuth } from './AuthContext';

interface BusinessContextType {
  activeBusiness: Business | null;
  businesses: Business[];
  isLoading: boolean;
  currency: string;
  switchBusiness: (businessId: string) => Promise<void>;
  createBusiness: (data: Partial<Business>) => Promise<Business | null>;
  updateBusiness: (id: string, data: Partial<Business>) => Promise<boolean>;
  refreshBusinesses: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshBusinesses = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/businesses', {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const list: Business[] = await res.json();
        setBusinesses(list);

        const savedActive = localStorage.getItem('hisobchi_active_business');
        if (savedActive) {
          try {
            const parsed = JSON.parse(savedActive);
            const found = list.find((b) => b.id === parsed.id);
            if (found) {
              setActiveBusiness(found);
              return;
            }
          } catch (e) {}
        }

        const match = list.find((b) => b.id === user.activeBusinessId) || list[0] || null;
        setActiveBusiness(match);
        if (match) {
          localStorage.setItem('hisobchi_active_business', JSON.stringify(match));
        }
      }
    } catch (err) {
      console.error('Failed to load businesses:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshBusinesses();
    } else {
      setBusinesses([]);
      setActiveBusiness(null);
    }
  }, [isAuthenticated, refreshBusinesses]);

  const switchBusiness = async (businessId: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/businesses/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ businessId, userId: user.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveBusiness(data.business);
        localStorage.setItem('hisobchi_active_business', JSON.stringify(data.business));
      }
    } catch (err) {
      console.error('Failed to switch business:', err);
    }
  };

  const createBusiness = async (data: Partial<Business>): Promise<Business | null> => {
    if (!user) return null;
    try {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const newBiz: Business = await res.json();
        setBusinesses((prev) => [...prev, newBiz]);
        setActiveBusiness(newBiz);
        localStorage.setItem('hisobchi_active_business', JSON.stringify(newBiz));
        return newBiz;
      }
    } catch (err) {
      console.error('Failed to create business:', err);
    }
    return null;
  };

  const updateBusiness = async (id: string, data: Partial<Business>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/businesses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated: Business = await res.json();
        setBusinesses((prev) => prev.map((b) => (b.id === id ? updated : b)));
        if (activeBusiness?.id === id) {
          setActiveBusiness(updated);
          localStorage.setItem('hisobchi_active_business', JSON.stringify(updated));
        }
        return true;
      }
    } catch (err) {
      console.error('Failed to update business:', err);
    }
    return false;
  };

  return (
    <BusinessContext.Provider
      value={{
        activeBusiness,
        businesses,
        isLoading,
        currency: activeBusiness?.currency || 'UZS',
        switchBusiness,
        createBusiness,
        updateBusiness,
        refreshBusinesses,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};
