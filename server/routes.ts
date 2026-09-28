import { Router } from 'express';
import { db, User, Business, Product, Sale, Expense, Customer, Supplier, Debt, Payment, Invoice, Employee, Category, AuditLog, NotificationItem } from './db.js';
import { askHisobchiAI, buildBusinessContext } from './ai.js';

export const apiRouter = Router();

// Helper to log audit actions
function logAudit(businessId: string, userId: string, userName: string, action: string, entity: string, details: string) {
  const logs = db.get('audit_logs');
  const newLog: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    businessId,
    userId: userId || 'user_anon',
    userName: userName || 'Foydalanuvchi',
    action,
    entity,
    details,
    createdAt: new Date().toISOString(),
  };
  db.set('audit_logs', [newLog, ...logs]);
}

// Helper to add notifications
function addNotification(businessId: string, title: string, message: string, type: NotificationItem['type'], link?: string) {
  const notifs = db.get('notifications');
  const newNotif: NotificationItem = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    businessId,
    title,
    message,
    type,
    isRead: false,
    link,
    createdAt: new Date().toISOString(),
  };
  db.set('notifications', [newNotif, ...notifs]);
}

// ================= AUTH =================
apiRouter.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email va parol kiritilishi shart' });
  }

  const users = db.get('users');
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Email yoki parol noto‘g‘ri' });
  }

  const businesses = db.get('businesses').filter((b) => user.businessIds.includes(b.id));
  const activeBusiness = businesses.find((b) => b.id === user.activeBusinessId) || businesses[0];

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      activeBusinessId: activeBusiness?.id,
      businessIds: user.businessIds,
    },
    business: activeBusiness,
    businesses,
  });
});

apiRouter.post('/auth/register', (req, res) => {
  const { name, email, password, businessName, businessType, currency, phone } = req.body;

  if (!name || !email || !password || !businessName) {
    return res.status(400).json({ error: 'Barcha majburiy maydonlarni to‘ldiring' });
  }

  const users = db.get('users');
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Bu email bilan foydalanuvchi allaqachon mavjud' });
  }

  const newBizId = `biz_${Date.now()}`;
  const newUserId = `user_${Date.now()}`;

  const newBiz: Business = {
    id: newBizId,
    name: businessName,
    type: businessType || 'retail',
    currency: currency || 'UZS',
    phone: phone || '',
    address: '',
    ownerId: newUserId,
    defaultLanguage: 'uz',
    timezone: 'Asia/Tashkent',
    createdAt: new Date().toISOString(),
  };

  const newUser: User = {
    id: newUserId,
    email,
    password,
    name,
    role: 'owner',
    businessIds: [newBizId],
    activeBusinessId: newBizId,
    createdAt: new Date().toISOString(),
  };

  const newEmp: Employee = {
    id: `emp_${Date.now()}`,
    businessId: newBizId,
    name,
    email,
    phone: phone || '',
    role: 'owner',
    permissions: ['all'],
    salary: 0,
    status: 'active',
    joinedDate: new Date().toISOString().split('T')[0],
  };

  const defaultCategories: Category[] = [
    { id: `cat_${Date.now()}_1`, businessId: newBizId, name: 'Asosiy', nameUz: 'Asosiy mahsulotlar', nameRu: 'Основные товары', nameEn: 'Main goods' },
    { id: `cat_${Date.now()}_2`, businessId: newBizId, name: 'Boshqa', nameUz: 'Boshqa', nameRu: 'Другое', nameEn: 'Other' },
  ];

  db.set('businesses', [...db.get('businesses'), newBiz]);
  db.set('users', [...users, newUser]);
  db.set('employees', [...db.get('employees'), newEmp]);
  db.set('categories', [...db.get('categories'), ...defaultCategories]);

  logAudit(newBizId, newUserId, name, 'REGISTERED', 'User', `Yangi biznes yaratildi: ${businessName}`);
  addNotification(newBizId, 'HISOBCHI ga xush kelibsiz!', 'Biznesingiz muvaffaqiyatli ro‘yxatdan o‘tkazildi.', 'insight', '/dashboard');

  res.json({
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      activeBusinessId: newBizId,
      businessIds: [newBizId],
    },
    business: newBiz,
    businesses: [newBiz],
  });
});

apiRouter.post('/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = db.get('users').find((u) => u.email.toLowerCase() === email?.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'Bunday email bilan foydalanuvchi topilmadi' });
  }
  res.json({ message: 'Parolni tiklash havolasi emailingizga yuborildi (Demo rejimida parolingiz: ' + user.password + ')' });
});

apiRouter.post('/auth/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  const users = db.get('users');
  const index = users.findIndex((u) => u.email.toLowerCase() === email?.toLowerCase());
  if (index === -1) {
    return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  }
  users[index].password = newPassword;
  db.set('users', users);
  res.json({ message: 'Parol muvaffaqiyatli yangilandi' });
});

// ================= BUSINESSES =================
apiRouter.get('/businesses', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const user = db.get('users').find((u) => u.id === userId);
  if (!user) {
    return res.json(db.get('businesses'));
  }
  const businesses = db.get('businesses').filter((b) => user.businessIds.includes(b.id));
  res.json(businesses);
});

apiRouter.post('/businesses', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const { name, type, currency, phone, address, taxId } = req.body;
  if (!name) return res.status(400).json({ error: 'Biznes nomi kiritilishi shart' });

  const newBiz: Business = {
    id: `biz_${Date.now()}`,
    name,
    type: type || 'retail',
    currency: currency || 'UZS',
    phone: phone || '',
    address: address || '',
    taxId: taxId || '',
    ownerId: userId || 'demo_owner',
    defaultLanguage: 'uz',
    timezone: 'Asia/Tashkent',
    createdAt: new Date().toISOString(),
  };

  db.set('businesses', [...db.get('businesses'), newBiz]);

  if (userId) {
    const users = db.get('users');
    const u = users.find((user) => user.id === userId);
    if (u) {
      u.businessIds.push(newBiz.id);
      u.activeBusinessId = newBiz.id;
      db.set('users', users);
    }
  }

  logAudit(newBiz.id, userId, 'Foydalanuvchi', 'CREATED_BUSINESS', 'Business', `Yangi biznes: ${name}`);
  res.status(201).json(newBiz);
});

apiRouter.put('/businesses/:id', (req, res) => {
  const { id } = req.params;
  const businesses = db.get('businesses');
  const index = businesses.findIndex((b) => b.id === id);
  if (index === -1) return res.status(404).json({ error: 'Biznes topilmadi' });

  businesses[index] = {
    ...businesses[index],
    ...req.body,
  };
  db.set('businesses', businesses);
  res.json(businesses[index]);
});

apiRouter.post('/businesses/switch', (req, res) => {
  const { businessId, userId } = req.body;
  const users = db.get('users');
  const user = users.find((u) => u.id === userId);
  if (user) {
    user.activeBusinessId = businessId;
    db.set('users', users);
  }
  const biz = db.get('businesses').find((b) => b.id === businessId);
  res.json({ success: true, business: biz });
});

// ================= DASHBOARD & CHARTS =================
apiRouter.get('/dashboard/stats', (req, res) => {
  const businessId = (req.headers['x-business-id'] as string) || (req.query.businessId as string) || 'biz_oloy_market';
  const range = (req.query.range as string) || 'this_month';

  const businesses = db.get('businesses');
  const biz = businesses.find((b) => b.id === businessId) || businesses[0];
  const allSales = db.get('sales').filter((s) => s.businessId === businessId && s.status === 'completed');
  const allExpenses = db.get('expenses').filter((e) => e.businessId === businessId);
  const products = db.get('products').filter((p) => p.businessId === businessId);
  const customers = db.get('customers').filter((c) => c.businessId === businessId);
  const debts = db.get('debts').filter((d) => d.businessId === businessId && d.status !== 'paid');

  // Filter by date range
  const now = new Date();
  const filterDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (range === 'today') {
      return d.toDateString() === now.toDateString();
    }
    if (range === 'yesterday') {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return d.toDateString() === yesterday.toDateString();
    }
    if (range === 'this_week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= weekAgo;
    }
    if (range === 'this_month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (range === 'last_month') {
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const lastYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return d.getMonth() === lastMonth && d.getFullYear() === lastYear;
    }
    if (range === 'this_year') {
      return d.getFullYear() === now.getFullYear();
    }
    return true; // all
  };

  const sales = allSales.filter((s) => filterDate(s.createdAt));
  const expenses = allExpenses.filter((e) => filterDate(e.date || e.createdAt));

  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const totalSalesCount = sales.length;
  const productsInStock = products.reduce((acc, p) => acc + (p.quantity > 0 ? p.quantity : 0), 0);
  const totalCustomers = customers.length;
  const totalCustomerDebts = debts.filter((d) => d.type === 'customer').reduce((acc, d) => acc + d.remainingAmount, 0);
  const totalSupplierDebts = debts.filter((d) => d.type === 'supplier').reduce((acc, d) => acc + d.remainingAmount, 0);

  const lowStockCount = products.filter((p) => p.quantity <= p.minStockLevel && p.quantity > 0).length;
  const outOfStockCount = products.filter((p) => p.quantity <= 0).length;

  res.json({
    currency: biz?.currency || 'UZS',
    businessName: biz?.name,
    totalRevenue,
    totalExpenses,
    netProfit,
    totalSalesCount,
    productsInStock,
    totalCustomers,
    totalCustomerDebts,
    totalSupplierDebts,
    lowStockCount,
    outOfStockCount,
    productTypesCount: products.length,
  });
});

apiRouter.get('/dashboard/charts', (req, res) => {
  const businessId = (req.headers['x-business-id'] as string) || (req.query.businessId as string) || 'biz_oloy_market';
  const sales = db.get('sales').filter((s) => s.businessId === businessId && s.status === 'completed');
  const expenses = db.get('expenses').filter((e) => e.businessId === businessId);

  // Group by day for the last 7 days
  const last7Days: { date: string; label: string; revenue: number; expense: number; profit: number }[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('uz-UZ', { weekday: 'short', day: 'numeric' });

    const daySales = sales.filter((s) => s.createdAt.startsWith(dateStr));
    const dayExpenses = expenses.filter((e) => (e.date || e.createdAt).startsWith(dateStr));

    const revenue = daySales.reduce((acc, s) => acc + s.total, 0);
    const expense = dayExpenses.reduce((acc, e) => acc + e.amount, 0);

    last7Days.push({
      date: dateStr,
      label: dayLabel,
      revenue,
      expense,
      profit: revenue - expense,
    });
  }

  // Top selling products
  const productMap = new Map<string, { name: string; salesCount: number; revenue: number }>();
  for (const s of sales) {
    for (const item of s.items) {
      const prev = productMap.get(item.productId) || { name: item.productName, salesCount: 0, revenue: 0 };
      prev.salesCount += item.quantity;
      prev.revenue += item.total;
      productMap.set(item.productId, prev);
    }
  }
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Expense categories
  const expenseCatMap = new Map<string, number>();
  for (const e of expenses) {
    const prev = expenseCatMap.get(e.category) || 0;
    expenseCatMap.set(e.category, prev + e.amount);
  }
  const expenseCategories = Array.from(expenseCatMap.entries()).map(([category, amount]) => ({ category, amount }));

  // Payment methods
  const paymentMethodMap = new Map<string, number>();
  for (const s of sales) {
    const prev = paymentMethodMap.get(s.paymentMethod) || 0;
    paymentMethodMap.set(s.paymentMethod, prev + s.total);
  }
  const paymentMethods = Array.from(paymentMethodMap.entries()).map(([method, amount]) => ({ method, amount }));

  res.json({
    trend: last7Days,
    topProducts,
    expenseCategories,
    paymentMethods,
  });
});

// ================= PRODUCTS & INVENTORY =================
apiRouter.get('/products', (req, res) => {
  const businessId = (req.headers['x-business-id'] as string) || (req.query.businessId as string);
  const products = db.get('products').filter((p) => !businessId || p.businessId === businessId);
  res.json(products);
});

apiRouter.post('/products', (req, res) => {
  const businessId = (req.headers['x-business-id'] as string) || req.body.businessId;
  const { name, sku, barcode, categoryId, purchasePrice, sellingPrice, quantity, minStockLevel, unit, supplierId, description, imageUrl } = req.body;

  if (!name || purchasePrice === undefined || sellingPrice === undefined) {
    return res.status(400).json({ error: 'Nomi, tan narxi va sotuv narxi kiritilishi shart' });
  }

  const newProd: Product = {
    id: `prod_${Date.now()}`,
    businessId,
    name,
    sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
    barcode: barcode || '',
    categoryId: categoryId || 'cat_default',
    purchasePrice: Number(purchasePrice) || 0,
    sellingPrice: Number(sellingPrice) || 0,
    quantity: Number(quantity) || 0,
    minStockLevel: Number(minStockLevel) || 5,
    unit: unit || 'pcs',
    supplierId: supplierId || '',
    description: description || '',
    imageUrl: imageUrl || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.set('products', [newProd, ...db.get('products')]);
  logAudit(businessId, req.headers['x-user-id'] as string, 'Admin', 'CREATED_PRODUCT', 'Product', `${name} mahsuloti qo‘shildi`);

  res.status(201).json(newProd);
});

apiRouter.put('/products/:id', (req, res) => {
  const { id } = req.params;
  const products = db.get('products');
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return res.status(404).json({ error: 'Mahsulot topilmadi' });

  products[index] = {
    ...products[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  db.set('products', products);

  // Check low stock
  if (products[index].quantity <= products[index].minStockLevel && products[index].quantity > 0) {
    addNotification(
      products[index].businessId,
      'Kam qolgan mahsulot!',
      `${products[index].name} omborda faqat ${products[index].quantity} ta qoldi.`,
      'low_stock',
      '/products'
    );
  }

  res.json(products[index]);
});

apiRouter.delete('/products/:id', (req, res) => {
  const { id } = req.params;
  const products = db.get('products');
  const target = products.find((p) => p.id === id);
  if (!target) return res.status(404).json({ error: 'Mahsulot topilmadi' });

  db.set('products', products.filter((p) => p.id !== id));
  logAudit(target.businessId, req.headers['x-user-id'] as string, 'Admin', 'DELETED_PRODUCT', 'Product', `${target.name} mahsuloti o‘chirildi`);
  res.json({ success: true });
});

apiRouter.post('/products/:id/adjust-stock', (req, res) => {
  const { id } = req.params;
  const { delta, reason, newQuantity } = req.body;
  const products = db.get('products');
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return res.status(404).json({ error: 'Mahsulot topilmadi' });

  const oldQty = products[index].quantity;
  if (newQuantity !== undefined) {
    products[index].quantity = Math.max(0, Number(newQuantity));
  } else if (delta !== undefined) {
    products[index].quantity = Math.max(0, products[index].quantity + Number(delta));
  }

  products[index].updatedAt = new Date().toISOString();
  db.set('products', products);

  logAudit(
    products[index].businessId,
    req.headers['x-user-id'] as string,
    'Admin',
    'ADJUST_STOCK',
    'Product',
    `${products[index].name} qoldig‘i o‘zgartirildi: ${oldQty} -> ${products[index].quantity}. Sabab: ${reason || 'Qayta hisob'}`
  );

  res.json(products[index]);
});

// ================= CATEGORIES =================
apiRouter.get('/categories', (req, res) => {
  const businessId = (req.headers['x-business-id'] as string) || (req.query.businessId as string);
  const categories = db.get('categories').filter((c) => !businessId || c.businessId === businessId);
  res.json(categories);
});

apiRouter.post('/categories', (req, res) => {
  const businessId = (req.headers['x-business-id'] as string) || req.body.businessId;
  const { name, nameUz, nameRu, nameEn, icon, color } = req.body;
  if (!name && !nameUz) return res.status(400).json({ error: 'Kategoriya nomi kiritilishi shart' });

  const newCat: Category = {
    id: `cat_${Date.now()}`,
    businessId,
    name: name || nameUz,
    nameUz: nameUz || name,
    nameRu: nameRu || name,
    nameEn: nameEn || name,
    icon: icon || 'Tag',
    color: color || '#0ea5e9',
  };

  db.set('categories', [...db.get('categories'), newCat]);
  res.status(201).json(newCat);
});

// ================= SALES & POS =================
apiRouter.get('/sales', (req, res) => {
  const businessId = (req.headers['x-business-id'] as string) || (req.query.businessId as string);
  const sales = db.get('sales').filter((s) => !businessId || s.businessId === businessId);
  res.json(sales);
});

apiRouter.post('/sales', (req, res) => {
  const businessId = (req.headers['x-business-id'] as string) || req.body.businessId;
  const { customerId, customerName, items, discount = 0, tax = 0, paidAmount, paymentMethod, notes, cashierName } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Savdoga kamida 1 ta mahsulot qo‘shilishi shart' });
  }

  // Calculate totals
  let subtotal = 0;
  const products = db.get('products');
  const resolvedItems = items.map((item: any, idx: number) => {
    const prod = products.find((p) => p.id === item.productId);
    const unitPrice = item.unitPrice ?? prod?.sellingPrice ?? 0;
    const purchasePrice = prod?.purchasePrice ?? 0;
    const qty = Number(item.quantity) || 1;
    const total = unitPrice * qty;
    subtotal += total;

    // Deduct stock
    if (prod) {
      prod.quantity = Math.max(0, prod.quantity - qty);
      prod.updatedAt = new Date().toISOString();

      if (prod.quantity <= 0) {
        addNotification(businessId, 'Mahsulot tugadi!', `${prod.name} omborda qolmadi.`, 'out_of_stock', '/products');
      } else if (prod.quantity <= prod.minStockLevel) {
        addNotification(businessId, 'Kam qolgan mahsulot!', `${prod.name} omborda faqat ${prod.quantity} ${prod.unit} qoldi.`, 'low_stock', '/products');
      }
    }

    return {
      id: `item_${Date.now()}_${idx}`,
      saleId: '',
      productId: item.productId,
      productName: item.productName || prod?.name || 'Mahsulot',
      quantity: qty,
      unit: prod?.unit || 'pcs',
      unitPrice,
      purchasePrice,
      total,
    };
  });

  db.set('products', products);

  const grandTotal = Math.max(0, subtotal - Number(discount) + Number(tax));
  const paid = paidAmount !== undefined ? Number(paidAmount) : grandTotal;
  const debt = Math.max(0, grandTotal - paid);

  const saleId = `sale_${Date.now()}`;
  const saleNumber = `INV-${new Date().getFullYear()}-${String(db.get('sales').length + 1).padStart(4, '0')}`;

  resolvedItems.forEach((it) => (it.saleId = saleId));

  const newSale: Sale = {
    id: saleId,
    businessId,
    saleNumber,
    customerId,
    customerName: customerName || (customerId ? 'Doimiy xaridor' : 'Oddiy xaridor'),
    items: resolvedItems,
    subtotal,
    discount: Number(discount),
    tax: Number(tax),
    total: grandTotal,
    paidAmount: paid,
    debtAmount: debt,
    paymentMethod: paymentMethod || 'cash',
    status: 'completed',
    cashierName: cashierName || 'Sotuvchi',
    notes,
    createdAt: new Date().toISOString(),
  };

  db.set('sales', [newSale, ...db.get('sales')]);

  // If debt exists, record debt
  if (debt > 0 && (customerId || customerName)) {
    const newDebt: Debt = {
      id: `debt_${Date.now()}`,
      businessId,
      type: 'customer',
      entityId: customerId || `cust_walkin_${Date.now()}`,
      entityName: customerName || 'Mijoz',
      phone: req.body.customerPhone || '',
      originalAmount: debt,
      paidAmount: 0,
      remainingAmount: debt,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'unpaid',
      notes: `${saleNumber} savdosi bo‘yicha qoldiq qarz`,
      createdAt: new Date().toISOString(),
    };
    db.set('debts', [newDebt, ...db.get('debts')]);
    addNotification(businessId, 'Yangi qarz qayd etildi', `${customerName || 'Mijoz'}ga ${debt.toLocaleString()} UZS qarz yozildi.`, 'debt_due', '/debts');
  }

  // Update customer statistics
  if (customerId) {
    const customers = db.get('customers');
    const cIdx = customers.findIndex((c) => c.id === customerId);
    if (cIdx !== -1) {
      customers[cIdx].purchaseCount += 1;
      customers[cIdx].totalSpent += grandTotal;
      customers[cIdx].debtAmount += debt;
      customers[cIdx].lastPurchaseDate = newSale.createdAt;
      db.set('customers', customers);
    }
  }

  // Auto create invoice record
  const newInvoice: Invoice = {
    id: `inv_${Date.now()}`,
    businessId,
    invoiceNumber: saleNumber,
    saleId,
    customerName: newSale.customerName || 'Xaridor',
    customerPhone: req.body.customerPhone,
    items: resolvedItems.map((ri) => ({
      name: ri.productName,
      quantity: ri.quantity,
      unitPrice: ri.unitPrice,
      total: ri.total,
    })),
    subtotal,
    tax: Number(tax),
    discount: Number(discount),
    total: grandTotal,
    status: debt > 0 ? 'pending' : 'paid',
    dueDate: newSale.createdAt,
    createdAt: newSale.createdAt,
  };
  db.set('invoices', [newInvoice, ...db.get('invoices')]);

  logAudit(businessId, req.headers['x-user-id'] as string, newSale.cashierName, 'COMPLETED_SALE', 'Sale', `${saleNumber} savdosi yakunlandi (${grandTotal.toLocaleString()} UZS)`);

  res.status(201).json(newSale);
});

apiRouter.put('/sales/:id/cancel', (req, res) => {
  const { id } = req.params;
  const sales = db.get('sales');
  const index = sales.findIndex((s) => s.id === id);
  if (index === -1) return res.status(404).json({ error: 'Savdo topilmadi' });

  const sale = sales[index];
  if (sale.status === 'cancelled') {
    return res.status(400).json({ error: 'Ushbu savdo allaqachon bekor qilingan' });
  }

  // Restore inventory stock
  const products = db.get('products');
  for (const item of sale.items) {
    const prod = products.find((p) => p.id === item.productId);
    if (prod) {
      prod.quantity += item.quantity;
      prod.updatedAt = new Date().toISOString();
    }
  }
  db.set('products', products);

  sale.status = 'cancelled';
  db.set('sales', sales);

  logAudit(sale.businessId, req.headers['x-user-id'] as string, 'Admin', 'CANCELLED_SALE', 'Sale', `${sale.saleNumber} savdosi bekor qilindi va qoldiq qaytarildi`);
  res.json(sale);
});

// ================= CUSTOMERS =================
apiRouter.get('/customers', (req, res) => {
  const businessId = (req.headers['x-business-id'] as string) || (req.query.businessId as string);
  const customers = db.get('customers').filter((c) => !businessId || c.businessId === businessId);
  res.json(customers);
});

apiRouter.post('/customers', (req, res) => {
  const businessId = (req.headers['x-business-id'] as string) || req.body.businessId;
  const { name, phone, email, address, notes } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Ism va telefon raqami kiritilishi shart' });

  const newCust: Customer = {
    id: `cust_${Date.now()}`,
    businessId,
    name,
    phone,
    email: email || '',
    address: address || '',
    notes: notes || '',
    totalSpent: 0,
    debtAmount: 0,
    purchaseCount: 0,
    createdAt: new Date().toISOString(),
  };

  db.set('customers', [newCust, ...db.get('customers')]);
  logAudit(businessId, req.headers['x-user-id'] as string, 'Admin', 'CREATED_CUSTOMER', 'Customer', `${name} mijoz ro‘yxatga olindi`);
  res.status(201).json(newCust);
});

apiRouter.put('/customers/:id', (req, res) => {
  const { id } = req.params;
  const customers = db.get('customers');
  const index = customers.findIndex((c) => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Mijoz topilmadi' });

  customers[index] = { ...customers[index], ...req.body };
  db.set('customers', customers);
  res.json(customers[index]);
});

apiRouter.delete('/customers/:id', (req, res) => {
  const { id } = req.params;
  const customers = db.get('customers');
  db.set('customers', customers.filter((c) => c.id !== id));
  res.json({ success: true });
});

// ================= SUPPLIERS =================
apiRouter.get('/suppliers', (req, res) => {
  const businessId = (req.headers['x-business-id'] as string) || (req.query.businessId as string);
  const suppliers = db.get('suppliers').filter((s) => !businessId || s.businessId === businessId);
  res.json(suppliers);
});

apiRouter.post('/suppliers', (req, res) => {
  const businessId = (req.headers['x-business-id'] as string) || req.body.businessId;
  const { name, phone, email, address, notes, debtAmount } = req.body;
  if (!name) return res.status(400).json({ error: 'Yetkazib beruvchi nomi shart' });

  const newSup: Supplier = {
    id: `sup_${Date.now()}`,
    businessId,
    name,
    phone: phone || '',
    email: email || '',
    address: address || '',
    notes: notes || '',
    debtAmount: Number(debtAmount) || 0,
    totalPurchased: 0,
    createdAt: new Date().toISOString(),
  };

  db.set('suppliers', [newSup, ...db.get('suppliers')]);
  res.status(201).json(newSup);
});

apiRouter.put('/suppliers/:id', (req, res) => {
  const { id } = req.params;
  const suppliers = db.get('suppliers');
  const index = suppliers.findIndex((s) => s.id === id);
  if (index === -1) return res.status(404).json({ error: 'Yetkazuvchi topilmadi' });

  suppliers[index] = { ...suppliers[index], ...req.body };
  db.set('suppliers', suppliers);
  res.json(suppliers[index]);
});

apiRouter.delete('/suppliers/:id', (req, res) => {
  const { id } = req.params;
  db.set('suppliers', db.get('suppliers').filter((s) => s.id !== id));
  res.json({ success: true });
});

// ================= DEBTS & PAYMENTS =================
apiRouter.get('/debts', (req, res) => {
  const businessId = (req.headers['x-business-id'] as string) || (req.query.businessId as string);
  const debts = db.get('debts').filter((d) => !businessId || d.businessId === businessId);
  res.json(debts);
});

apiRouter.post('/debts', (req, res) => {
  const businessId = (req.headers['x-business-id'] as string) || req.body.businessId;
  const { type, entityId, entityName, phone, originalAmount, dueDate, notes } = req.body;

  if (!entityName || !originalAmount) {
    return res.status(400).json({ error: 'Shaxs/Kompaniya va summa kiritilishi shart' });
  }

  const amt = Number(originalAmount) || 0;
  const newDebt: Debt = {
    id: `debt_${Date.now()}`,
    businessId,
    type: type || 'customer',
    entityId: entityId || '',
    entityName,
    phone: phone || '',
    originalAmount: amt,
    paidAmount: 0,
    remainingAmount: amt,
    dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'unpaid',
    notes,
    createdAt: new Date().toISOString(),
  };

  db.set('debts', [newDebt, ...db.get('debts')]);
  logAudit(businessId, req.headers['x-user-id'] as string, 'Admin', 'RECORDED_DEBT', 'Debt', `${entityName} uchun ${amt.toLocaleString()} UZS qarz yozildi`);
  res.status(201).json(newDebt);
});

apiRouter.post('/debts/:id/payments', (req, res) => {
  const { id } = req.params;
  const { amount, paymentMethod, notes } = req.body;
  const debts = db.get('debts');
  const index = debts.findIndex((d) => d.id === id);
  if (index === -1) return res.status(404).json({ error: 'Qarz topilmadi' });

  const payAmt = Number(amount) || 0;
  if (payAmt <= 0) return res.status(400).json({ error: 'To‘lov summasi 0 dan katta bo‘lishi kerak' });

  const debt = debts[index];
  debt.paidAmount += payAmt;
  debt.remainingAmount = Math.max(0, debt.originalAmount - debt.paidAmount);

  if (debt.remainingAmount === 0) {
    debt.status = 'paid';
  } else {
    debt.status = 'partially_paid';
  }

  db.set('debts', debts);

  const newPayment: Payment = {
    id: `pay_${Date.now()}`,
    businessId: debt.businessId,
    debtId: debt.id,
    amount: payAmt,
    paymentMethod: paymentMethod || 'cash',
    date: new Date().toISOString(),
    notes,
    createdAt: new Date().toISOString(),
  };
  db.set('payments', [newPayment, ...db.get('payments')]);

  // If customer debt, also reduce customer debtAmount
  if (debt.type === 'customer' && debt.entityId) {
    const customers = db.get('customers');
    const cIdx = customers.findIndex((c) => c.id === debt.entityId);
    if (cIdx !== -1) {
      customers[cIdx].debtAmount = Math.max(0, customers[cIdx].debtAmount - payAmt);
      db.set('customers', customers);
    }
  }

  logAudit(debt.businessId, req.headers['x-user-id'] as string, 'Admin', 'DEBT_PAYMENT', 'Payment', `${debt.entityName} qarziga ${payAmt.toLocaleString()} UZS to‘lov qabul qilindi`);
  res.json({ debt, payment: newPayment });
});

// ================= EXPENSES =================
apiRouter.get('/expenses', (req, res) => {
  const businessId = (req.headers['x-business-id'] as string) || (req.query.businessId as string);
  const expenses = db.get('expenses').filter((e) => !businessId || e.businessId === businessId);
  res.json(expenses);
});

apiRouter.post('/expenses', (req, res) => {
  const businessId = (req.headers['x-business-id'] as string) || req.body.businessId;
  const { amount, category, paymentMethod, description, date, receiptUrl } = req.body;

  if (!amount || !category) {
    return res.status(400).json({ error: 'Summa va kategoriya shart' });
  }

  const newExp: Expense = {
    id: `exp_${Date.now()}`,
    businessId,
    amount: Number(amount) || 0,
    category,
    paymentMethod: paymentMethod || 'cash',
    description: description || '',
    date: date || new Date().toISOString().split('T')[0],
    receiptUrl: receiptUrl || '',
    createdBy: 'Aziz Rahimov',
    createdAt: new Date().toISOString(),
  };

  db.set('expenses', [newExp, ...db.get('expenses')]);
  logAudit(businessId, req.headers['x-user-id'] as string, 'Admin', 'RECORDED_EXPENSE', 'Expense', `${category} bo‘yicha ${Number(amount).toLocaleString()} UZS xarajat yozildi`);
  res.status(201).json(newExp);
});

apiRouter.delete('/expenses/:id', (req, res) => {
  const { id } = req.params;
  const expenses = db.get('expenses');
  const target = expenses.find((e) => e.id === id);
  if (!target) return res.status(404).json({ error: 'Xarajat topilmadi' });

  db.set('expenses', expenses.filter((e) => e.id !== id));
  logAudit(target.businessId, req.headers['x-user-id'] as string, 'Admin', 'DELETED_EXPENSE', 'Expense', `${target.category} xarajati o‘chirildi`);
  res.json({ success: true });
});

// ================= INVOICES =================
apiRouter.get('/invoices', (req, res) => {
  const businessId = (req.headers['x-business-id'] as string) || (req.query.businessId as string);
  const invoices = db.get('invoices').filter((inv) => !businessId || inv.businessId === businessId);
  res.json(invoices);
});

apiRouter.get('/invoices/:id', (req, res) => {
  const { id } = req.params;
  const invoice = db.get('invoices').find((inv) => inv.id === id || inv.invoiceNumber === id);
  if (!invoice) return res.status(404).json({ error: 'Hisob-faktura topilmadi' });
  const business = db.get('businesses').find((b) => b.id === invoice.businessId);
  res.json({ invoice, business });
});

// ================= EMPLOYEES & ROLES =================
apiRouter.get('/employees', (req, res) => {
  const businessId = (req.headers['x-business-id'] as string) || (req.query.businessId as string);
  const employees = db.get('employees').filter((e) => !businessId || e.businessId === businessId);
  res.json(employees);
});

apiRouter.post('/employees', (req, res) => {
  const businessId = (req.headers['x-business-id'] as string) || req.body.businessId;
  const { name, email, phone, role, salary, permissions } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Ism va email shart' });

  const newEmp: Employee = {
    id: `emp_${Date.now()}`,
    businessId,
    name,
    email,
    phone: phone || '',
    role: role || 'employee',
    permissions: permissions || ['sales'],
    salary: Number(salary) || 0,
    status: 'active',
    joinedDate: new Date().toISOString().split('T')[0],
  };

  db.set('employees', [...db.get('employees'), newEmp]);
  res.status(201).json(newEmp);
});

apiRouter.delete('/employees/:id', (req, res) => {
  const { id } = req.params;
  db.set('employees', db.get('employees').filter((e) => e.id !== id));
  res.json({ success: true });
});

// ================= NOTIFICATIONS =================
apiRouter.get('/notifications', (req, res) => {
  const businessId = (req.headers['x-business-id'] as string) || (req.query.businessId as string);
  const notifs = db.get('notifications').filter((n) => !businessId || n.businessId === businessId);
  res.json(notifs);
});

apiRouter.put('/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const notifs = db.get('notifications');
  const target = notifs.find((n) => n.id === id);
  if (target) {
    target.isRead = true;
    db.set('notifications', notifs);
  }
  res.json({ success: true });
});

apiRouter.post('/notifications/read-all', (req, res) => {
  const businessId = (req.headers['x-business-id'] as string) || req.body.businessId;
  const notifs = db.get('notifications');
  notifs.forEach((n) => {
    if (!businessId || n.businessId === businessId) n.isRead = true;
  });
  db.set('notifications', notifs);
  res.json({ success: true });
});

// ================= AUDIT LOGS =================
apiRouter.get('/audit-logs', (req, res) => {
  const businessId = (req.headers['x-business-id'] as string) || (req.query.businessId as string);
  const logs = db.get('audit_logs').filter((l) => !businessId || l.businessId === businessId);
  res.json(logs);
});

// ================= HISOBCHI AI ASSISTANT & INSIGHTS =================
apiRouter.post('/ai/chat', async (req, res) => {
  const { prompt, businessId, language } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Savol matni kiritilishi lozim' });

  try {
    const answer = await askHisobchiAI(prompt, businessId || 'biz_oloy_market', language || 'uz');
    res.json({ answer });
  } catch (error: any) {
    console.error('AI chat route error:', error);
    res.status(500).json({ error: 'AI javob qaytarishda xatolik yuz berdi' });
  }
});

apiRouter.get('/ai/insights', (req, res) => {
  const businessId = (req.headers['x-business-id'] as string) || (req.query.businessId as string) || 'biz_oloy_market';
  const ctx = buildBusinessContext(businessId);

  const insights = [];

  // Profitability insight
  if (ctx.netProfit > 0) {
    insights.push({
      type: 'revenue_increase',
      icon: 'TrendingUp',
      color: 'emerald',
      title: 'Biznesingiz sof foydada',
      description: `Hozirgi davrda umumiy tushum ${ctx.totalRevenue.toLocaleString()} ${ctx.currency}, sof foyda esa ${ctx.netProfit.toLocaleString()} ${ctx.currency} ni tashkil qilmoqda.`,
    });
  } else if (ctx.netProfit < 0) {
    insights.push({
      type: 'expense_warning',
      icon: 'AlertTriangle',
      color: 'rose',
      title: 'Xarajatlar tushumdan ortiq',
      description: `Xarajatlar umumiy tushumdan ${Math.abs(ctx.netProfit).toLocaleString()} ${ctx.currency} ga ko‘p. Asosiy xarajat moddalarini qayta ko‘rib chiqish tavsiya etiladi.`,
    });
  }

  // Low stock warning
  if (ctx.lowStockItems.length > 0 || ctx.outOfStockItems.length > 0) {
    insights.push({
      type: 'low_stock',
      icon: 'PackageAlert',
      color: 'amber',
      title: 'Ombor zaxirasi yetarli emas',
      description: `${ctx.lowStockItems.length + ctx.outOfStockItems.length} ta mahsulot minimal zaxiradan kam yoki tugagan (${ctx.lowStockItems.slice(0, 2).join(', ')}). Yetkazib beruvchilarga buyurtma yuboring.`,
    });
  }

  // Customer debts alert
  if (ctx.customerDebts > 0) {
    insights.push({
      type: 'debt_warning',
      icon: 'CreditCard',
      color: 'blue',
      title: 'Undirilishi kerak bo‘lgan qarzlar',
      description: `Mijozlar tomonidan jami ${ctx.customerDebts.toLocaleString()} ${ctx.currency} miqdorida qarz mavjud. O‘z vaqtida eslatma yuborish naqd pul oqimini yaxshilaydi.`,
    });
  }

  // Best selling products
  if (ctx.topProducts.length > 0) {
    const best = ctx.topProducts[0];
    insights.push({
      type: 'top_product',
      icon: 'Star',
      color: 'purple',
      title: 'Yetakchi mahsulot',
      description: `Eng yuqori savdo hajmini "${best.name}" ko‘rsatmoqda (jami ${best.qty} ta sotilib, ${best.revenue.toLocaleString()} ${ctx.currency} keltirdi).`,
    });
  }

  res.json({ insights, context: ctx });
});

// ================= SYSTEM / RESET =================
apiRouter.post('/system/reset-sample', (req, res) => {
  db.resetToSample();
  res.json({ success: true, message: 'Namuna ma‘lumotlar qayta tiklandi' });
});
