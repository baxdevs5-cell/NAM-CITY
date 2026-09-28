export type Language = 'uz' | 'ru' | 'en';
export type Currency = 'UZS' | 'USD' | 'EUR' | 'RUB';
export type UserRole = 'owner' | 'manager' | 'employee';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  activeBusinessId: string;
  businessIds: string[];
  avatarUrl?: string;
}

export interface Business {
  id: string;
  name: string;
  type: 'retail' | 'cafe' | 'salon' | 'workshop' | 'minimarket' | 'services' | 'other';
  currency: Currency;
  phone: string;
  address: string;
  taxId?: string;
  ownerId: string;
  logo?: string;
  defaultLanguage: Language;
  timezone: string;
  createdAt: string;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  minStockLevel: number;
  unit: 'pcs' | 'kg' | 'liter' | 'box' | 'meter';
  supplierId?: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  businessId: string;
  name: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  icon?: string;
  color?: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  totalSpent: number;
  debtAmount: number;
  purchaseCount: number;
  lastPurchaseDate?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  debtAmount: number;
  totalPurchased: number;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  purchasePrice: number;
  total: number;
}

export interface Sale {
  id: string;
  businessId: string;
  saleNumber: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  debtAmount: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other';
  status: 'completed' | 'cancelled';
  cashierName: string;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  businessId: string;
  amount: number;
  category: string;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other';
  description: string;
  date: string;
  receiptUrl?: string;
  createdBy: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  businessId: string;
  type: 'customer' | 'supplier';
  entityId: string;
  entityName: string;
  phone: string;
  originalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: 'unpaid' | 'partially_paid' | 'paid' | 'overdue';
  notes?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  businessId: string;
  invoiceNumber: string;
  saleId?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'paid' | 'pending' | 'cancelled';
  dueDate: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  businessId: string;
  title: string;
  message: string;
  type: 'low_stock' | 'out_of_stock' | 'debt_due' | 'expense_spike' | 'sales_milestone' | 'insight';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  permissions: string[];
  salary: number;
  status: 'active' | 'inactive';
  joinedDate: string;
}

export interface AuditLog {
  id: string;
  businessId: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  details: string;
  createdAt: string;
}

export interface DashboardStats {
  currency: Currency;
  businessName: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalSalesCount: number;
  productsInStock: number;
  totalCustomers: number;
  totalCustomerDebts: number;
  totalSupplierDebts: number;
  lowStockCount: number;
  outOfStockCount: number;
  productTypesCount: number;
}
