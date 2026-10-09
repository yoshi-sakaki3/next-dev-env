# Next.js 開発環境（商品管理の見本つき・Docker Compose + Dev Containers）

Docker Compose と VS Code Dev Containers で動く、Next.js の開発環境です。
見本として、**ロット番号・使用期限つきの商品管理**（医療・介護の消耗品などを想定した、架空のデータ）が入っています。Windows（PowerShell）向けの操作コマンド `dev.ps1` 付き。

動作確認済み（2026-10-09）：Windows 11 + Docker Desktop で、一覧・検索・期限の絞り込み・登録（入力チェック）・編集画面・CSV 出力・CSV 取り込み・保存時の自動反映・テスト（テスト用 DB）・型チェック・ESLint・本番ビルド。

| 画面 | URL | 内容 |
|---|---|---|
| 商品一覧 | http://localhost:3200 | 検索（商品名・JAN コード・ロット番号）、使用期限が30日以内・期限切れの絞り込みと色分け |
| 新規登録 | http://localhost:3200/products/new | 入力チェック（JAN コードのチェックディジット、日付、数値）。誤りは各欄の下に表示 |
| CSV 取り込み | http://localhost:3200/products/import | JAN コードが同じ商品は上書き、無ければ追加。1行でも誤りがあれば何も保存しない |
| CSV 出力 | 一覧の「CSV 出力」 | 一覧と同じ条件で書き出し。Excel でそのまま開ける（UTF-8 BOM つき） |

## 入っているもの

- Node.js 24 ＋ pnpm、Next.js 16（App Router・Cache Components・Server Actions）、React 19、TypeScript
- Tailwind CSS 4
- PostgreSQL 17 ＋ Drizzle ORM（テーブル定義は `src/db/schema.ts`、変更は SQL のマイグレーションで管理）
- 入力チェック：Zod（画面と CSV で同じルールを使う）
- 品質チェック：Vitest（単体テストと、テスト用 DB を使うテスト）、ESLint、Prettier
- テスト用の DB（`app_test`）を開発用とは別に用意。テストで開発中のデータが消えない

### 見本で気を付けていること

- JAN コードの見本データは、店内用に予約された「20」で始まる番号にして、実在の商品と重ならないようにしている
- CSV 出力では、`=` などで始まる値の先頭に `'` を付け、Excel で数式として実行されないようにしている（取り込み時は外す）
- 画面を通さずに Server Action を直接呼ばれることがあるので、本番ではログインと権限の確認を必ず足す（`src/app/products/actions.ts` に注意書き）

## 初回だけの準備

1. Docker Desktop を起動する（初めての PC は、先に管理者の PowerShell で `wsl --install` と再起動が必要）
2. このフォルダで準備コマンドを実行する
   ```powershell
   cd next-dev-env
   .\dev.ps1 setup
   ```
   テーブルの作成と見本データ（12件）の投入まで自動で行います。終わったら http://localhost:3200 を開いてください。

> PowerShell で「スクリプトの実行が無効」と出たら：`powershell -ExecutionPolicy Bypass -File .\dev.ps1 setup`

## 普段の使い方

```powershell
.\dev.ps1 up              # 起動
.\dev.ps1 down            # 停止
.\dev.ps1 check           # 型チェック・ESLint・テストをまとめて実行
.\dev.ps1 build           # 本番用のビルドを試す
.\dev.ps1 pnpm add xxx    # ライブラリを追加
.\dev.ps1 help            # コマンド一覧
```

テーブルを変えるときは、`src/db/schema.ts` を直してから次を実行します。

```powershell
.\dev.ps1 pnpm db:generate   # 変更の SQL を drizzle/ に作る
.\dev.ps1 migrate            # DB に反映
```

## 保存したら画面に反映される仕組み

Docker Desktop（Windows）では、ファイルを保存しても変更の通知がコンテナに届きません。そこで、Docker で動かすときだけ 1 秒ごとに変更を見に行く設定にしています（`compose.yaml` の `NEXT_WATCH_POLL_MS` → `next.config.ts`）。保存から 2 秒ほどで画面に反映されます。
Next.js の公式ガイドでは「CPU を多めに使うので最後の手段」とされているため、Docker を使わずに動かすときは設定しません。

## VS Code で開発する（おすすめ）

VS Code でこのフォルダを開き、「コンテナーで再度開く（Reopen in Container）」を選ぶと、コンテナの中で補完・ESLint・Prettier・テストがそのまま使えます（拡張機能「Dev Containers」が必要）。

## お客さまのソースを扱うときの注意

- お客さまのソースや個人情報を AI（Claude など）に渡す前に、秘密保持契約で外部の AI サービスの利用が認められているかを確認する
- 医療・個人情報を扱うシステムでは、本物のデータを開発環境に持ち込まない（見本データか、匿名化したデータを使う）
- `.env` には本番のパスワードや API キーを入れない（この環境はローカル専用の値で動く）

## フォルダ構成

```
next-dev-env/
├─ compose.yaml            … どのサービスを起動するか
├─ env.example             … 設定の見本（setup で .env にコピーされる）
├─ dev.ps1                 … 操作コマンド
├─ docker/                 … Node.js のイメージ、テスト用 DB を作る SQL
├─ app/                    … アプリのソース（ここを案件ごとに入れ替える）
│  ├─ src/app/             … 画面（一覧・登録・編集・CSV 取り込み）と CSV 出力の API
│  ├─ src/lib/             … 入力チェック・JAN コード・CSV・DB 操作（とそのテスト）
│  ├─ src/db/              … テーブル定義と DB 接続
│  ├─ drizzle/             … マイグレーション（SQL）
│  └─ scripts/             … マイグレーションの反映・見本データの投入
└─ .devcontainer/          … VS Code Dev Containers の設定
```
