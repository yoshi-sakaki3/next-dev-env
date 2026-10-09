import { runMigrations } from '../scripts/migrate';

/** テストの前に、テスト用 DB を最新のテーブル定義にする */
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url)
    throw new Error(
      'TEST_DATABASE_URL が設定されていません（Docker の中で .\\dev.ps1 test を使ってください）',
    );
  await runMigrations(url);
}
