import type { NextConfig } from 'next';

// Docker Desktop（Windows・Mac）では、ファイルを保存しても変更の通知がコンテナに届かないことがある。
// compose.yaml で NEXT_WATCH_POLL_MS を設定したときだけ、その間隔（ミリ秒）で変更を見に行く。
// CPU を多めに使うので、Docker を使わずに動かすときは設定しない。
const pollIntervalMs = Number(process.env.NEXT_WATCH_POLL_MS) || undefined;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  ...(pollIntervalMs && { watchOptions: { pollIntervalMs } }),
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
