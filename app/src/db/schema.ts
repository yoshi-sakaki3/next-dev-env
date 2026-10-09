import { date, integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

/**
 * 商品（ロット番号・使用期限つき）。
 * 列を変えたら `pnpm db:generate` でマイグレーション（drizzle/ の SQL）を作り、`pnpm db:migrate` で反映する。
 */
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  janCode: varchar('jan_code', { length: 13 }).notNull().unique(),
  category: varchar('category', { length: 30 }).notNull(),
  unit: varchar('unit', { length: 10 }).notNull(),
  /** 税抜の単価（円） */
  price: integer('price').notNull(),
  stock: integer('stock').notNull().default(0),
  lotNumber: varchar('lot_number', { length: 30 }),
  /** 使用期限（YYYY-MM-DD） */
  expiryDate: date('expiry_date', { mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
