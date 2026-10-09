import { defineConfig } from 'drizzle-kit';

// テーブルの定義（src/db/schema.ts）から、マイグレーションの SQL（drizzle/）を作る設定
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
});
