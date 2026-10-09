import { db, pool } from '../src/db/client';
import { products, type NewProduct } from '../src/db/schema';
import { makeJan } from '../src/lib/jan';
import { todayInTokyo } from '../src/lib/today';

/**
 * 見本データを入れる（同じ JAN コードがあれば上書き）。
 * 商品名はすべて架空。JAN コードは店内用に予約された「20」で始まる番号を使い、実在の商品と重ならないようにしている。
 */
function daysFromToday(days: number): string {
  const d = new Date(`${todayInTokyo()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const items: Omit<NewProduct, 'janCode'>[] = [
  {
    name: '不織布マスク ふつうサイズ 50枚入',
    category: '衛生用品',
    unit: '箱',
    price: 480,
    stock: 120,
    lotNumber: 'MK-2609A',
    expiryDate: daysFromToday(700),
  },
  {
    name: 'ニトリル手袋 M 100枚入',
    category: '衛生用品',
    unit: '箱',
    price: 980,
    stock: 45,
    lotNumber: 'GL-2605M',
    expiryDate: daysFromToday(20),
  },
  {
    name: 'ニトリル手袋 L 100枚入',
    category: '衛生用品',
    unit: '箱',
    price: 980,
    stock: 8,
    lotNumber: 'GL-2605L',
    expiryDate: daysFromToday(-5),
  },
  {
    name: '滅菌ガーゼ 10cm×10cm 100枚',
    category: '衛生用品',
    unit: '袋',
    price: 1200,
    stock: 30,
    lotNumber: 'GZ-2511',
    expiryDate: daysFromToday(400),
  },
  {
    name: '綿棒 個包装 200本',
    category: '衛生用品',
    unit: '袋',
    price: 350,
    stock: 60,
    lotNumber: 'CS-2607',
    expiryDate: daysFromToday(15),
  },
  {
    name: '使い捨てエプロン 50枚入',
    category: '介護用品',
    unit: '箱',
    price: 1500,
    stock: 22,
    lotNumber: 'AP-2602',
    expiryDate: null,
  },
  {
    name: '防水シーツ 90×150cm',
    category: '介護用品',
    unit: '枚',
    price: 2400,
    stock: 10,
    lotNumber: null,
    expiryDate: null,
  },
  {
    name: '口腔ケア用スポンジ 50本',
    category: '介護用品',
    unit: '袋',
    price: 780,
    stock: 40,
    lotNumber: 'OS-2608',
    expiryDate: daysFromToday(25),
  },
  {
    name: '検体容器 30mL 100個',
    category: '検査用品',
    unit: '箱',
    price: 3200,
    stock: 12,
    lotNumber: 'SC-2604',
    expiryDate: daysFromToday(250),
  },
  {
    name: '体温計カバー 500枚',
    category: '検査用品',
    unit: '箱',
    price: 1800,
    stock: 5,
    lotNumber: 'TC-2603',
    expiryDate: daysFromToday(-30),
  },
  {
    name: 'ラベルシール 白 A4 20面',
    category: '事務用品',
    unit: '冊',
    price: 650,
    stock: 18,
    lotNumber: null,
    expiryDate: null,
  },
  {
    name: 'カルテ用ファイル A4 10冊',
    category: '事務用品',
    unit: 'パック',
    price: 900,
    stock: 25,
    lotNumber: null,
    expiryDate: null,
  },
];

const rows: NewProduct[] = items.map((item, i) => ({
  ...item,
  janCode: makeJan(`2000000${String(i + 1).padStart(5, '0')}`),
}));

for (const row of rows) {
  await db
    .insert(products)
    .values(row)
    .onConflictDoUpdate({ target: products.janCode, set: { ...row, updatedAt: new Date() } });
}
await pool.end();
console.log(`見本データを ${rows.length} 件入れました`);
