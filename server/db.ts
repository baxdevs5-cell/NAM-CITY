import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  email: string;
  password: string; // Stored securely
  name: string;
  role: 'owner' | 'manager' | 'employee';
  businessIds: string[];
  activeBusinessId: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Business {
  id: string;
  name: string;
  type: 'retail' | 'cafe' | 'salon' | 'workshop' | 'minimarket' | 'services' | 'other';
  currency: 'UZS' | 'USD' | 'EUR' | 'RUB';
  phone: string;
  address: string;
  taxId?: string;
  ownerId: string;
  logo?: string;
  defaultLanguage: 'uz' | 'ru' | 'en';
  timezone: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'manager' | 'employee';
  permissions: string[];
  salary: number;
  status: 'active' | 'inactive';
  joinedDate: string;
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

export interface Payment {
  id: string;
  businessId: string;
  debtId: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other';
  date: string;
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

export interface DatabaseSchema {
  users: User[];
  businesses: Business[];
  employees: Employee[];
  categories: Category[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  expenses: Expense[];
  debts: Debt[];
  payments: Payment[];
  invoices: Invoice[];
  notifications: NotificationItem[];
  audit_logs: AuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'hisobchi_db.json');

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDirectory();
    this.data = this.loadDatabase();
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || [],
          businesses: parsed.businesses || [],
          employees: parsed.employees || [],
          categories: parsed.categories || [],
          products: parsed.products || [],
          customers: parsed.customers || [],
          suppliers: parsed.suppliers || [],
          sales: parsed.sales || [],
          expenses: parsed.expenses || [],
          debts: parsed.debts || [],
          payments: parsed.payments || [],
          invoices: parsed.invoices || [],
          notifications: parsed.notifications || [],
          audit_logs: parsed.audit_logs || [],
        };
      } catch (err) {
        console.error('Error reading database file, reinitializing:', err);
      }
    }
    const initial = this.getInitialSampleData();
    this.saveData(initial);
    return initial;
  }

  private saveData(data: DatabaseSchema) {
    this.ensureDataDirectory();
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  public persist() {
    this.saveData(this.data);
  }

  public get<K extends keyof DatabaseSchema>(key: K): DatabaseSchema[K] {
    return this.data[key];
  }

  public set<K extends keyof DatabaseSchema>(key: K, value: DatabaseSchema[K]) {
    this.data[key] = value;
    this.persist();
  }

  public resetToSample() {
    this.data = this.getInitialSampleData();
    this.persist();
    return this.data;
  }

  private getInitialSampleData(): DatabaseSchema {
    const demoBizId = 'biz_oloy_market';
    const demoOwnerId = 'user_demo_owner';
    const now = new Date();
    const dStr = (daysAgo: number) => {
      const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      return d.toISOString();
    };

    const users: User[] = [
      {
        id: demoOwnerId,
        email: 'admin@hisobchi.uz',
        password: 'admin',
        name: 'Aziz Rahimov',
        role: 'owner',
        businessIds: [demoBizId],
        activeBusinessId: demoBizId,
        avatarUrl: '',
        createdAt: dStr(60),
      },
    ];

    const businesses: Business[] = [
      {
        id: demoBizId,
        name: 'Oloy Bozori Mini-market',
        type: 'minimarket',
        currency: 'UZS',
        phone: '+998 90 123 45 67',
        address: 'Amir Temur shoh ko‘chasi, Toshkent',
        taxId: '305928174',
        ownerId: demoOwnerId,
        defaultLanguage: 'uz',
        timezone: 'Asia/Tashkent',
        createdAt: dStr(60),
      },
    ];

    const employees: Employee[] = [
      {
        id: 'emp_1',
        businessId: demoBizId,
        name: 'Aziz Rahimov',
        email: 'admin@hisobchi.uz',
        phone: '+998 90 123 45 67',
        role: 'owner',
        permissions: ['all'],
        salary: 15000000,
        status: 'active',
        joinedDate: '2024-01-01',
      },
      {
        id: 'emp_2',
        businessId: demoBizId,
        name: 'Jasur Saidov',
        email: 'jasur@hisobchi.uz',
        phone: '+998 93 456 78 90',
        role: 'manager',
        permissions: ['sales', 'inventory', 'customers', 'reports'],
        salary: 6000000,
        status: 'active',
        joinedDate: '2024-03-15',
      },
      {
        id: 'emp_3',
        businessId: demoBizId,
        name: 'Malika Karimova',
        email: 'malika@hisobchi.uz',
        phone: '+998 97 789 01 23',
        role: 'employee',
        permissions: ['sales'],
        salary: 4000000,
        status: 'active',
        joinedDate: '2024-05-10',
      },
    ];

    const categories: Category[] = [
      { id: 'cat_drinks', businessId: demoBizId, name: 'Ichimliklar', nameUz: 'Ichimliklar', nameRu: 'Напитки', nameEn: 'Beverages', icon: 'CupSoda', color: '#0284c7' },
      { id: 'cat_bakery', businessId: demoBizId, name: 'Non mahsulotlari', nameUz: 'Non mahsulotlari', nameRu: 'Выпечка и хлеб', nameEn: 'Bakery', icon: 'Wheat', color: '#d97706' },
      { id: 'cat_dairy', businessId: demoBizId, name: 'Sut mahsulotlari', nameUz: 'Sut mahsulotlari', nameRu: 'Молочные продукты', nameEn: 'Dairy', icon: 'Milk', color: '#2563eb' },
      { id: 'cat_grocery', businessId: demoBizId, name: 'Baqqollik', nameUz: 'Baqqollik', nameRu: 'Бакалея', nameEn: 'Groceries', icon: 'ShoppingBag', color: '#16a34a' },
      { id: 'cat_sweets', businessId: demoBizId, name: 'Qandolat', nameUz: 'Qandolat', nameRu: 'Кондитерские изделия', nameEn: 'Sweets', icon: 'Cookie', color: '#db2777' },
      { id: 'cat_household', businessId: demoBizId, name: 'Xo‘jalik mollari', nameUz: 'Xo‘jalik mollari', nameRu: 'Хозтовары', nameEn: 'Household', icon: 'Sparkles', color: '#7c3aed' },
    ];

    const suppliers: Supplier[] = [
      {
        id: 'sup_coke',
        businessId: demoBizId,
        name: 'Coca-Cola Bottlers Uzbekistan',
        phone: '+998 71 200 11 22',
        email: 'orders@coca-cola.uz',
        address: 'Bektemir tumani, Toshkent',
        debtAmount: 2400000,
        totalPurchased: 48000000,
        notes: 'Haftada bir marta payshanba kuni yetkazib beradi',
        createdAt: dStr(50),
      },
      {
        id: 'sup_musaffo',
        businessId: demoBizId,
        name: 'Musaffo Sut MCHJ',
        phone: '+998 71 250 88 99',
        email: 'sales@musaffo.uz',
        address: 'Sergeli sanoat zonasi, Toshkent',
        debtAmount: 0,
        totalPurchased: 22000000,
        notes: 'Kunlik yangi sut mahsulotlari',
        createdAt: dStr(45),
      },
      {
        id: 'sup_grocery',
        businessId: demoBizId,
        name: 'O‘zbek Oziq-Ovqat Ulgurji',
        phone: '+998 90 999 88 77',
        email: 'ulgurji@oziqovqat.uz',
        address: 'Qo‘yliq bozori, Toshkent',
        debtAmount: 1500000,
        totalPurchased: 35000000,
        notes: 'Shakar, yog‘, un va guruch yetkazuvchi',
        createdAt: dStr(55),
      },
    ];

    const products: Product[] = [
      {
        id: 'prod_1',
        businessId: demoBizId,
        name: 'Coca-Cola Classic 1.5L',
        sku: 'DRK-COKE-15',
        barcode: '5449000000996',
        categoryId: 'cat_drinks',
        purchasePrice: 11000,
        sellingPrice: 14000,
        quantity: 38,
        minStockLevel: 15,
        unit: 'pcs',
        supplierId: 'sup_coke',
        description: 'Klassik gazlangan ichimlik 1.5 litr',
        createdAt: dStr(40),
        updatedAt: dStr(2),
      },
      {
        id: 'prod_2',
        businessId: demoBizId,
        name: 'Coca-Cola Classic 0.5L',
        sku: 'DRK-COKE-05',
        barcode: '5449000000439',
        categoryId: 'cat_drinks',
        purchasePrice: 5500,
        sellingPrice: 7500,
        quantity: 5, // LOW STOCK
        minStockLevel: 20,
        unit: 'pcs',
        supplierId: 'sup_coke',
        description: 'Gazlangan ichimlik 0.5 litr',
        createdAt: dStr(40),
        updatedAt: dStr(1),
      },
      {
        id: 'prod_3',
        businessId: demoBizId,
        name: 'Samarqand Obi Non',
        sku: 'BKR-SAM-01',
        barcode: '4780001230012',
        categoryId: 'cat_bakery',
        purchasePrice: 4000,
        sellingPrice: 6000,
        quantity: 42,
        minStockLevel: 10,
        unit: 'pcs',
        description: 'Yangi yopilgan issiq Samarqand obi noni',
        createdAt: dStr(30),
        updatedAt: dStr(1),
      },
      {
        id: 'prod_4',
        businessId: demoBizId,
        name: 'Musaffo Sut 3.2% 1L',
        sku: 'DRY-MSF-32',
        barcode: '4780029381029',
        categoryId: 'cat_dairy',
        purchasePrice: 10500,
        sellingPrice: 13000,
        quantity: 18,
        minStockLevel: 10,
        unit: 'pcs',
        supplierId: 'sup_musaffo',
        description: 'Tabiiy pasterizatsiyalangan sut',
        createdAt: dStr(25),
        updatedAt: dStr(1),
      },
      {
        id: 'prod_5',
        businessId: demoBizId,
        name: 'Zolotaya Semechka Kungaboqar Yog‘i 1L',
        sku: 'GRC-OIL-1L',
        barcode: '4607008160015',
        categoryId: 'cat_grocery',
        purchasePrice: 16500,
        sellingPrice: 20000,
        quantity: 26,
        minStockLevel: 12,
        unit: 'liter',
        supplierId: 'sup_grocery',
        description: 'Tozalangan va hidlanmagan kungaboqar yog‘i',
        createdAt: dStr(35),
        updatedAt: dStr(3),
      },
      {
        id: 'prod_6',
        businessId: demoBizId,
        name: 'Shakar (Xorazm) 1kg',
        sku: 'GRC-SUG-1K',
        barcode: '4780004928172',
        categoryId: 'cat_grocery',
        purchasePrice: 12000,
        sellingPrice: 14500,
        quantity: 75,
        minStockLevel: 25,
        unit: 'kg',
        supplierId: 'sup_grocery',
        description: 'Oliy navli tozalangan oq shakar',
        createdAt: dStr(35),
        updatedAt: dStr(4),
      },
      {
        id: 'prod_7',
        businessId: demoBizId,
        name: 'MacCoffee 3in1 Original (20gr)',
        sku: 'DRK-MCF-01',
        barcode: '8888065000018',
        categoryId: 'cat_drinks',
        purchasePrice: 1800,
        sellingPrice: 2500,
        quantity: 110,
        minStockLevel: 30,
        unit: 'pcs',
        description: 'Tez eriydigan qahva ichimligi',
        createdAt: dStr(40),
        updatedAt: dStr(2),
      },
      {
        id: 'prod_8',
        businessId: demoBizId,
        name: 'Fairy Idish Yuvish Vositasi 500ml',
        sku: 'HSH-FRY-50',
        barcode: '5413149021432',
        categoryId: 'cat_household',
        purchasePrice: 18500,
        sellingPrice: 23000,
        quantity: 0, // OUT OF STOCK
        minStockLevel: 8,
        unit: 'pcs',
        description: 'Limon xushbo‘yli konsentrlangan yuvish vositasi',
        createdAt: dStr(30),
        updatedAt: dStr(1),
      },
      {
        id: 'prod_9',
        businessId: demoBizId,
        name: 'Alpen Gold Shokolad Sutli 85g',
        sku: 'SWT-AGL-85',
        barcode: '7622210214812',
        categoryId: 'cat_sweets',
        purchasePrice: 11000,
        sellingPrice: 15000,
        quantity: 24,
        minStockLevel: 10,
        unit: 'pcs',
        description: 'Yong‘oq va mayizli sutli shokolad',
        createdAt: dStr(28),
        updatedAt: dStr(2),
      },
      {
        id: 'prod_10',
        businessId: demoBizId,
        name: 'Toshkent Choy 95 Ko‘k Choy 200g',
        sku: 'DRK-TEA-95',
        barcode: '4780005112044',
        categoryId: 'cat_drinks',
        purchasePrice: 9000,
        sellingPrice: 12500,
        quantity: 34,
        minStockLevel: 15,
        unit: 'pcs',
        description: 'An‘anaviy 95 ko‘k choy',
        createdAt: dStr(35),
        updatedAt: dStr(2),
      },
    ];

    const customers: Customer[] = [
      {
        id: 'cust_1',
        businessId: demoBizId,
        name: 'Alisher Usmonov',
        phone: '+998 90 987 65 43',
        email: 'alisher@mail.uz',
        address: 'Navoiy ko‘chasi, 14-uy',
        notes: 'Doimiy xaridor, har hafta xarid qiladi',
        totalSpent: 1850000,
        debtAmount: 450000,
        purchaseCount: 14,
        lastPurchaseDate: dStr(1),
        createdAt: dStr(45),
      },
      {
        id: 'cust_2',
        businessId: demoBizId,
        name: 'Dilnoza Karimova',
        phone: '+998 94 333 22 11',
        email: 'dilnoza@gmail.com',
        address: 'Chilonzor 9-mavze, 2-uy',
        notes: 'Mahalla raisi',
        totalSpent: 920000,
        debtAmount: 0,
        purchaseCount: 8,
        lastPurchaseDate: dStr(3),
        createdAt: dStr(35),
      },
      {
        id: 'cust_3',
        businessId: demoBizId,
        name: 'Rustam Zokirov',
        phone: '+998 93 111 44 55',
        email: 'rustam_z@yahoo.com',
        address: 'Mustaqillik shoh ko‘chasi, 45',
        notes: 'Qo‘shni ofis xodimi',
        totalSpent: 2400000,
        debtAmount: 320000,
        purchaseCount: 19,
        lastPurchaseDate: dStr(2),
        createdAt: dStr(50),
      },
      {
        id: 'cust_4',
        businessId: demoBizId,
        name: 'Shaxnoza Po‘latova',
        phone: '+998 91 555 77 99',
        email: '',
        address: 'Yunusobod 4-mavze',
        notes: 'Kofexona uchun xarid qiladi',
        totalSpent: 3100000,
        debtAmount: 0,
        purchaseCount: 12,
        lastPurchaseDate: dStr(4),
        createdAt: dStr(40),
      },
    ];

    const sales: Sale[] = [
      {
        id: 'sale_1',
        businessId: demoBizId,
        saleNumber: 'INV-2024-001',
        customerId: 'cust_1',
        customerName: 'Alisher Usmonov',
        items: [
          { id: 'item_1', saleId: 'sale_1', productId: 'prod_1', productName: 'Coca-Cola Classic 1.5L', quantity: 2, unit: 'pcs', unitPrice: 14000, purchasePrice: 11000, total: 28000 },
          { id: 'item_2', saleId: 'sale_1', productId: 'prod_3', productName: 'Samarqand Obi Non', quantity: 3, unit: 'pcs', unitPrice: 6000, purchasePrice: 4000, total: 18000 },
          { id: 'item_3', saleId: 'sale_1', productId: 'prod_4', productName: 'Musaffo Sut 3.2% 1L', quantity: 2, unit: 'pcs', unitPrice: 13000, purchasePrice: 10500, total: 26000 },
        ],
        subtotal: 72000,
        discount: 2000,
        tax: 0,
        total: 70000,
        paidAmount: 70000,
        debtAmount: 0,
        paymentMethod: 'card',
        status: 'completed',
        cashierName: 'Malika Karimova',
        notes: 'Chek berildi',
        createdAt: dStr(0),
      },
      {
        id: 'sale_2',
        businessId: demoBizId,
        saleNumber: 'INV-2024-002',
        customerId: 'cust_3',
        customerName: 'Rustam Zokirov',
        items: [
          { id: 'item_4', saleId: 'sale_2', productId: 'prod_5', productName: 'Zolotaya Semechka Kungaboqar Yog‘i 1L', quantity: 2, unit: 'liter', unitPrice: 20000, purchasePrice: 16500, total: 40000 },
          { id: 'item_5', saleId: 'sale_2', productId: 'prod_6', productName: 'Shakar (Xorazm) 1kg', quantity: 5, unit: 'kg', unitPrice: 14500, purchasePrice: 12000, total: 72500 },
          { id: 'item_6', saleId: 'sale_2', productId: 'prod_10', productName: 'Toshkent Choy 95 Ko‘k Choy 200g', quantity: 2, unit: 'pcs', unitPrice: 12500, purchasePrice: 9000, total: 25000 },
        ],
        subtotal: 137500,
        discount: 0,
        tax: 0,
        total: 137500,
        paidAmount: 137500,
        debtAmount: 0,
        paymentMethod: 'cash',
        status: 'completed',
        cashierName: 'Aziz Rahimov',
        createdAt: dStr(1),
      },
      {
        id: 'sale_3',
        businessId: demoBizId,
        saleNumber: 'INV-2024-003',
        customerId: 'cust_1',
        customerName: 'Alisher Usmonov',
        items: [
          { id: 'item_7', saleId: 'sale_3', productId: 'prod_6', productName: 'Shakar (Xorazm) 1kg', quantity: 10, unit: 'kg', unitPrice: 14500, purchasePrice: 12000, total: 145000 },
          { id: 'item_8', saleId: 'sale_3', productId: 'prod_5', productName: 'Zolotaya Semechka Kungaboqar Yog‘i 1L', quantity: 5, unit: 'liter', unitPrice: 20000, purchasePrice: 16500, total: 100000 },
        ],
        subtotal: 245000,
        discount: 5000,
        tax: 0,
        total: 240000,
        paidAmount: 100000,
        debtAmount: 140000,
        paymentMethod: 'other',
        status: 'completed',
        cashierName: 'Jasur Saidov',
        notes: '140,000 so‘m keyingi haftaga qarz qoldirildi',
        createdAt: dStr(3),
      },
      {
        id: 'sale_4',
        businessId: demoBizId,
        saleNumber: 'INV-2024-004',
        customerName: 'Oddiy Xaridor',
        items: [
          { id: 'item_9', saleId: 'sale_4', productId: 'prod_7', productName: 'MacCoffee 3in1 Original (20gr)', quantity: 15, unit: 'pcs', unitPrice: 2500, purchasePrice: 1800, total: 37500 },
          { id: 'item_10', saleId: 'sale_4', productId: 'prod_9', productName: 'Alpen Gold Shokolad Sutli 85g', quantity: 3, unit: 'pcs', unitPrice: 15000, purchasePrice: 11000, total: 45000 },
        ],
        subtotal: 82500,
        discount: 2500,
        tax: 0,
        total: 80000,
        paidAmount: 80000,
        debtAmount: 0,
        paymentMethod: 'transfer',
        status: 'completed',
        cashierName: 'Malika Karimova',
        createdAt: dStr(5),
      },
    ];

    const expenses: Expense[] = [
      {
        id: 'exp_1',
        businessId: demoBizId,
        amount: 4500000,
        category: 'rent',
        paymentMethod: 'transfer',
        description: 'Do‘kon ijarasi uchun oylik to‘lov (Savdo majmuasi)',
        date: dStr(4),
        createdBy: 'Aziz Rahimov',
        createdAt: dStr(4),
      },
      {
        id: 'exp_2',
        businessId: demoBizId,
        amount: 850000,
        category: 'utilities',
        paymentMethod: 'card',
        description: 'Elektr energiyasi va kommunal xizmatlar',
        date: dStr(7),
        createdBy: 'Aziz Rahimov',
        createdAt: dStr(7),
      },
      {
        id: 'exp_3',
        businessId: demoBizId,
        amount: 320000,
        category: 'transport',
        paymentMethod: 'cash',
        description: 'Ulgurji bozordan mahsulot keltirish uchun Damas',
        date: dStr(2),
        createdBy: 'Jasur Saidov',
        createdAt: dStr(2),
      },
      {
        id: 'exp_4',
        businessId: demoBizId,
        amount: 600000,
        category: 'marketing',
        paymentMethod: 'transfer',
        description: 'Telegram kanal va mahalla guruhida e’lonlar',
        date: dStr(10),
        createdBy: 'Aziz Rahimov',
        createdAt: dStr(10),
      },
      {
        id: 'exp_5',
        businessId: demoBizId,
        amount: 4000000,
        category: 'salary',
        paymentMethod: 'card',
        description: 'Sotuvchi Malika Karimovaning oylik maoshi',
        date: dStr(15),
        createdBy: 'Aziz Rahimov',
        createdAt: dStr(15),
      },
    ];

    const debts: Debt[] = [
      {
        id: 'debt_1',
        businessId: demoBizId,
        type: 'customer',
        entityId: 'cust_1',
        entityName: 'Alisher Usmonov',
        phone: '+998 90 987 65 43',
        originalAmount: 450000,
        paidAmount: 0,
        remainingAmount: 450000,
        dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'unpaid',
        notes: 'Oziq-ovqat xaridi uchun qarz',
        createdAt: dStr(3),
      },
      {
        id: 'debt_2',
        businessId: demoBizId,
        type: 'customer',
        entityId: 'cust_3',
        entityName: 'Rustam Zokirov',
        phone: '+998 93 111 44 55',
        originalAmount: 500000,
        paidAmount: 180000,
        remainingAmount: 320000,
        dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'overdue',
        notes: 'Shakar va yog‘ partiyasi',
        createdAt: dStr(12),
      },
      {
        id: 'debt_3',
        businessId: demoBizId,
        type: 'supplier',
        entityId: 'sup_coke',
        entityName: 'Coca-Cola Bottlers Uzbekistan',
        phone: '+998 71 200 11 22',
        originalAmount: 5000000,
        paidAmount: 2600000,
        remainingAmount: 2400000,
        dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'partially_paid',
        notes: 'Oxirgi 50 blok kola yetkazmasi',
        createdAt: dStr(10),
      },
      {
        id: 'debt_4',
        businessId: demoBizId,
        type: 'supplier',
        entityId: 'sup_grocery',
        entityName: 'O‘zbek Oziq-Ovqat Ulgurji',
        phone: '+998 90 999 88 77',
        originalAmount: 3000000,
        paidAmount: 1500000,
        remainingAmount: 1500000,
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'partially_paid',
        notes: 'Shakar va yog‘ konsignatsiyasi',
        createdAt: dStr(8),
      },
    ];

    const payments: Payment[] = [
      {
        id: 'pay_1',
        businessId: demoBizId,
        debtId: 'debt_2',
        amount: 180000,
        paymentMethod: 'cash',
        date: dStr(5),
        notes: 'Qisman to‘lov qilindi',
        createdAt: dStr(5),
      },
      {
        id: 'pay_2',
        businessId: demoBizId,
        debtId: 'debt_3',
        amount: 2600000,
        paymentMethod: 'transfer',
        date: dStr(6),
        notes: 'Bank o‘tkazmasi orqali to‘landi',
        createdAt: dStr(6),
      },
    ];

    const invoices: Invoice[] = [
      {
        id: 'inv_1',
        businessId: demoBizId,
        invoiceNumber: 'INV-2024-001',
        saleId: 'sale_1',
        customerName: 'Alisher Usmonov',
        customerPhone: '+998 90 987 65 43',
        customerAddress: 'Navoiy ko‘chasi, 14-uy',
        items: [
          { name: 'Coca-Cola Classic 1.5L', quantity: 2, unitPrice: 14000, total: 28000 },
          { name: 'Samarqand Obi Non', quantity: 3, unitPrice: 6000, total: 18000 },
          { name: 'Musaffo Sut 3.2% 1L', quantity: 2, unitPrice: 13000, total: 26000 },
        ],
        subtotal: 72000,
        tax: 0,
        discount: 2000,
        total: 70000,
        status: 'paid',
        dueDate: dStr(0),
        createdAt: dStr(0),
      },
    ];

    const notifications: NotificationItem[] = [
      {
        id: 'notif_1',
        businessId: demoBizId,
        title: 'Kam qolgan mahsulot ogohlantirishi',
        message: 'Coca-Cola 0.5L omborda faqat 5 dona qoldi! Minimal zaxira: 20 dona.',
        type: 'low_stock',
        isRead: false,
        link: '/products',
        createdAt: dStr(0),
      },
      {
        id: 'notif_2',
        businessId: demoBizId,
        title: 'Mahsulot tugadi!',
        message: 'Fairy Idish Yuvish Vositasi 500ml omborda 0 ta qoldi.',
        type: 'out_of_stock',
        isRead: false,
        link: '/products',
        createdAt: dStr(1),
      },
      {
        id: 'notif_3',
        businessId: demoBizId,
        title: 'Qarz to‘lovi muddati bugun',
        message: 'Alisher Usmonovning 450,000 UZS qarzi bugun to‘lanishi kerak.',
        type: 'debt_due',
        isRead: false,
        link: '/debts',
        createdAt: dStr(0),
      },
      {
        id: 'notif_4',
        businessId: demoBizId,
        title: 'Kechikkan qarz ogohlantirishi',
        message: 'Rustam Zokirovning 320,000 UZS qarzi to‘lov muddati 2 kun avval o‘tgan!',
        type: 'debt_due',
        isRead: true,
        link: '/debts',
        createdAt: dStr(2),
      },
    ];

    const audit_logs: AuditLog[] = [
      {
        id: 'log_1',
        businessId: demoBizId,
        userId: demoOwnerId,
        userName: 'Aziz Rahimov',
        action: 'CREATED_PRODUCT',
        entity: 'Product',
        details: 'Coca-Cola Classic 1.5L mahsuloti qo‘shildi',
        createdAt: dStr(40),
      },
      {
        id: 'log_2',
        businessId: demoBizId,
        userId: 'emp_3',
        userName: 'Malika Karimova',
        action: 'COMPLETED_SALE',
        entity: 'Sale',
        details: 'INV-2024-001 cheki yaratildi (70,000 UZS)',
        createdAt: dStr(0),
      },
      {
        id: 'log_3',
        businessId: demoBizId,
        userId: demoOwnerId,
        userName: 'Aziz Rahimov',
        action: 'RECORDED_EXPENSE',
        entity: 'Expense',
        details: 'Do‘kon ijarasi xarajati qayd etildi (4,500,000 UZS)',
        createdAt: dStr(4),
      },
    ];

    return {
      users,
      businesses,
      employees,
      categories,
      products,
      customers,
      suppliers,
      sales,
      expenses,
      debts,
      payments,
      invoices,
      notifications,
      audit_logs,
    };
  }
}

export const db = new Database();
