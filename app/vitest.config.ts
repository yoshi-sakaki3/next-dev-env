import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// テストはテスト用の DB（app_test）を使う。開発中のデータには触らない
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'node',
    globalSetup: ['./tests/global-setup.ts'],
    env: { DATABASE_URL: process.env.TEST_DATABASE_URL ?? '' },
    // DB を使うテストが同時に走って、お互いのデータを消さないようにする
    fileParallelism: false,
  },
});
