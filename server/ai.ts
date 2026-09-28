import { GoogleGenAI } from '@google/genai';
import { db } from './db.js';

let aiInstance: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

export function buildBusinessContext(businessId: string) {
  const businesses = db.get('businesses');
  const business = businesses.find((b) => b.id === businessId) || businesses[0];
  const products = db.get('products').filter((p) => p.businessId === businessId);
  const sales = db.get('sales').filter((s) => s.businessId === businessId);
  const expenses = db.get('expenses').filter((e) => e.businessId === businessId);
  const debts = db.get('debts').filter((d) => d.businessId === businessId);
  const customers = db.get('customers').filter((c) => c.businessId === businessId);
  const suppliers = db.get('suppliers').filter((s) => s.businessId === businessId);

  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const lowStock = products.filter((p) => p.quantity <= p.minStockLevel && p.quantity > 0);
  const outOfStock = products.filter((p) => p.quantity <= 0);

  const customerDebts = debts
    .filter((d) => d.type === 'customer' && d.status !== 'paid')
    .reduce((acc, d) => acc + d.remainingAmount, 0);

  const supplierDebts = debts
    .filter((d) => d.type === 'supplier' && d.status !== 'paid')
    .reduce((acc, d) => acc + d.remainingAmount, 0);

  // Top products by revenue
  const productSalesMap = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const s of sales) {
    for (const item of s.items) {
      const existing = productSalesMap.get(item.productId) || { name: item.productName, qty: 0, revenue: 0 };
      existing.qty += item.quantity;
      existing.revenue += item.total;
      productSalesMap.set(item.productId, existing);
    }
  }
  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Expense categories
  const expenseCategoryMap = new Map<string, number>();
  for (const e of expenses) {
    const prev = expenseCategoryMap.get(e.category) || 0;
    expenseCategoryMap.set(e.category, prev + e.amount);
  }
  const topExpenseCategories = Array.from(expenseCategoryMap.entries())
    .map(([cat, amt]) => ({ category: cat, amount: amt }))
    .sort((a, b) => b.amount - a.amount);

  return {
    businessName: business?.name || 'Mening Biznesim',
    currency: business?.currency || 'UZS',
    businessType: business?.type || 'retail',
    totalRevenue,
    totalExpenses,
    netProfit,
    salesCount: sales.length,
    customerCount: customers.length,
    supplierCount: suppliers.length,
    totalProductsCount: products.length,
    lowStockItems: lowStock.map((p) => `${p.name} (omborda: ${p.quantity} ${p.unit}, min: ${p.minStockLevel})`),
    outOfStockItems: outOfStock.map((p) => `${p.name} (0 ta qoldi)`),
    customerDebts,
    supplierDebts,
    topProducts,
    topExpenseCategories,
    recentSales: sales.slice(-5).map((s) => ({
      saleNumber: s.saleNumber,
      total: s.total,
      paymentMethod: s.paymentMethod,
      customer: s.customerName || 'Noma‘lum',
      date: s.createdAt,
    })),
  };
}

export async function askHisobchiAI(prompt: string, businessId: string, language: 'uz' | 'ru' | 'en' = 'uz') {
  const context = buildBusinessContext(businessId);
  const ai = getAIClient();

  // If no API key configured, provide a rich, precise heuristic answer based on actual data
  if (!ai) {
    return generateFallbackAIResponse(prompt, context, language);
  }

  const langPrompt =
    language === 'uz'
      ? 'Javobni aniq, samimiy va o‘zbek tilida ber. Moliyaviy maslahat va tahlilingni qisqa va tushunarli punktlarda yoz.'
      : language === 'ru'
      ? 'Ответь на русском языке чётко, кратко и профессионально. Давай конкретный финансовый анализ без лишней воды.'
      : 'Answer in clear, concise English with actionable business and financial advice.';

  const systemInstruction = `You are "HISOBCHI AI", an expert business analyst and financial advisor for small businesses (shops, cafes, salons, workshops, minimarkets).
You are talking to the owner or manager of "${context.businessName}".
All currency figures are in ${context.currency}.

CRITICAL RULES:
1. Ground every answer strictly in the real business data provided below.
2. NEVER invent, hallucinate, or assume financial figures not present in the data.
3. If data is not available (e.g., asked about a product or period not recorded), explicitly say that the data is not recorded or not available yet.
4. Keep responses concise, easily readable, formatted with clear bullets or short paragraphs.
5. ${langPrompt}

REAL CURRENT BUSINESS DATA:
- Business: ${context.businessName} (${context.businessType})
- Currency: ${context.currency}
- Total Revenue: ${context.totalRevenue.toLocaleString()} ${context.currency}
- Total Expenses: ${context.totalExpenses.toLocaleString()} ${context.currency}
- Net Profit: ${context.netProfit.toLocaleString()} ${context.currency}
- Total Completed Sales: ${context.salesCount}
- Active Customers: ${context.customerCount}
- Active Suppliers: ${context.supplierCount}
- Total Products in Catalog: ${context.totalProductsCount}
- Low Stock Alerts: ${context.lowStockItems.length > 0 ? context.lowStockItems.join(', ') : 'None'}
- Out of Stock Alerts: ${context.outOfStockItems.length > 0 ? context.outOfStockItems.join(', ') : 'None'}
- Customer Debts (Mijozlar qarzi): ${context.customerDebts.toLocaleString()} ${context.currency}
- Supplier Debts (Yetkazuvchilarga qarz): ${context.supplierDebts.toLocaleString()} ${context.currency}
- Top Selling Products: ${JSON.stringify(context.topProducts)}
- Top Expense Categories: ${JSON.stringify(context.topExpenseCategories)}
- Recent Sales: ${JSON.stringify(context.recentSales)}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    return response.text || (language === 'uz' ? 'Javob shakllantirilmadi.' : 'No response generated.');
  } catch (error) {
    console.error('Gemini API call failed, using grounded fallback analysis:', error);
    return generateFallbackAIResponse(prompt, context, language);
  }
}

function generateFallbackAIResponse(
  prompt: string,
  ctx: ReturnType<typeof buildBusinessContext>,
  lang: 'uz' | 'ru' | 'en'
): string {
  const p = prompt.toLowerCase();
  const curr = ctx.currency;

  if (lang === 'uz') {
    if (p.includes('foyda') || p.includes('daromad') || p.includes('tushum')) {
      return `📊 **Moliyaviy ko'rsatkichlaringiz (${ctx.businessName}):**\n\n` +
        `• **Umumiy tushum (Savdo):** ${ctx.totalRevenue.toLocaleString()} ${curr}\n` +
        `• **Jami xarajatlar:** ${ctx.totalExpenses.toLocaleString()} ${curr}\n` +
        `• **Sof foyda:** ${ctx.netProfit.toLocaleString()} ${curr} (${ctx.netProfit >= 0 ? "foydadasiz ✅" : "zarardasiz ⚠️"})\n` +
        `• **Jami bitimlar soni:** ${ctx.salesCount} ta savdo amalga oshirilgan.`;
    }
    if (p.includes('mahsulot') || p.includes('ko‘p sotilgan') || p.includes('kop sotilgan') || p.includes('top')) {
      if (ctx.topProducts.length === 0) return "Hozircha sotilgan mahsulotlar bo‘yicha yetarli ma’lumot yo‘q.";
      const items = ctx.topProducts.map((tp, i) => `${i + 1}. **${tp.name}** — ${tp.qty} dona sotilgan (${tp.revenue.toLocaleString()} ${curr})`).join('\n');
      return `⭐ **Eng ko‘p sotilgan top mahsulotlar:**\n\n${items}`;
    }
    if (p.includes('kamayib') || p.includes('zaxira') || p.includes('ombor') || p.includes('tugadi')) {
      const outMsg = ctx.outOfStockItems.length > 0 ? `🚨 **Tugagan mahsulotlar:**\n• ${ctx.outOfStockItems.join('\n• ')}\n\n` : '';
      const lowMsg = ctx.lowStockItems.length > 0 ? `⚠️ **Kam qolgan mahsulotlar:**\n• ${ctx.lowStockItems.join('\n• ')}` : 'Barcha boshqa mahsulotlar zaxirasi yetarli.';
      return `${outMsg}${lowMsg}`;
    }
    if (p.includes('xarajat') || p.includes('rasxod')) {
      const expList = ctx.topExpenseCategories.map(c => `• **${c.category}:** ${c.amount.toLocaleString()} ${curr}`).join('\n');
      return `💸 **Xarajatlar tahlili (Jami: ${ctx.totalExpenses.toLocaleString()} ${curr}):**\n\n${expList || 'Hozircha xarajatlar mavjud emas.'}`;
    }
    if (p.includes('qarz')) {
      return `💳 **Qarzlar holati:**\n\n` +
        `• **Mijozlarning sizdan qarzi:** ${ctx.customerDebts.toLocaleString()} ${curr}\n` +
        `• **Sizning yetkazuvchilarga qarzingiz:** ${ctx.supplierDebts.toLocaleString()} ${curr}\n\n` +
        `💡 *Tavsiya:* Kechiktirilgan mijozlar qarzlarini undirish orqali aylanma mablag'ni oshirishingiz mumkin.`;
    }
    return `Salom! Men **HISOBCHI AI** yordamchingizman.\n\n` +
      `Bugungi kunda sizning biznesingiz ko'rsatkichlari:\n` +
      `• Tushum: **${ctx.totalRevenue.toLocaleString()} ${curr}**\n` +
      `• Sof foyda: **${ctx.netProfit.toLocaleString()} ${curr}**\n` +
      `• Zaxirasi kam mahsulotlar: **${ctx.lowStockItems.length + ctx.outOfStockItems.length} ta**\n` +
      `• Mijozlar qarzi: **${ctx.customerDebts.toLocaleString()} ${curr}**\n\n` +
      `Menga aniq savol bering: masalan, eng ko'p sotilgan mahsulotlar yoki xarajatlar haqida!`;
  } else if (lang === 'ru') {
    return `Здравствуйте! Я **HISOBCHI AI** — ваш бизнес-ассистент.\n\n` +
      `Текущие показатели вашего бизнеса (${ctx.businessName}):\n` +
      `• Выручка: **${ctx.totalRevenue.toLocaleString()} ${curr}**\n` +
      `• Расходы: **${ctx.totalExpenses.toLocaleString()} ${curr}**\n` +
      `• Чистая прибыль: **${ctx.netProfit.toLocaleString()} ${curr}**\n` +
      `• Долги клиентов: **${ctx.customerDebts.toLocaleString()} ${curr}**\n` +
      `• Заканчивающиеся товары: **${ctx.lowStockItems.length + ctx.outOfStockItems.length} шт.**\n\n` +
      `Задайте любой интересующий вопрос о ваших продажах, остатках или финансах.`;
  } else {
    return `Hello! I am **HISOBCHI AI**, your business analytics assistant.\n\n` +
      `Current snapshot for **${ctx.businessName}**:\n` +
      `• Revenue: **${ctx.totalRevenue.toLocaleString()} ${curr}**\n` +
      `• Expenses: **${ctx.totalExpenses.toLocaleString()} ${curr}**\n` +
      `• Net Profit: **${ctx.netProfit.toLocaleString()} ${curr}**\n` +
      `• Customer Debts: **${ctx.customerDebts.toLocaleString()} ${curr}**\n` +
      `• Stock Alerts: **${ctx.lowStockItems.length + ctx.outOfStockItems.length} items**\n\n` +
      `Feel free to ask for product performance, expense breakdowns, or sales summaries!`;
  }
}
