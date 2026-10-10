<#
  Next.js 開発環境の操作コマンド（PowerShell）
  使い方:  .\dev.ps1 <コマンド> [引数]
  一覧:    .\dev.ps1 help
#>
# 引数は param() で受けず、そのまま読む。
# param() を使うと、-c・-e・-v のようにハイフンで始まる指定を PowerShell がこのスクリプトあての指定と解釈して、
# エラーになったり、黙って消えたりするため（例：python -c ...、mvn -e ...）。
$Command = if ($args.Count -gt 0) { [string]$args[0] } else { 'help' }
$Rest = @(if ($args.Count -gt 1) { $args[1..($args.Count - 1)] })

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

function Invoke-Compose { docker compose @args; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }

function Test-Docker {
    docker info *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'Docker が起動していません。Docker Desktop を起動してから、もう一度実行してください。' -ForegroundColor Yellow
        exit 1
    }
}

switch ($Command) {
    'setup' {
        if (-not (Test-Path .env)) { Copy-Item env.example .env; Write-Host '.env を作成しました。' }
        Test-Docker
        Invoke-Compose build
        Invoke-Compose run --rm --no-deps app pnpm install
        Invoke-Compose up -d db
        Invoke-Compose run --rm app pnpm db:migrate
        Invoke-Compose run --rm app pnpm db:seed
        Invoke-Compose up -d
        Write-Host ''
        Write-Host '準備ができました。初回は画面の表示に 10 秒ほどかかります。' -ForegroundColor Green
        & $PSCommandPath urls
    }
    'up'      { Test-Docker; Invoke-Compose up -d; & $PSCommandPath urls }
    'down'    { Invoke-Compose down }
    'restart' { Invoke-Compose restart app }
    'rebuild' { Test-Docker; Invoke-Compose build --no-cache; Invoke-Compose up -d }
    'status'  { Invoke-Compose ps }
    'logs'    { Invoke-Compose logs -f --tail 100 @Rest }
    'sh'      { Invoke-Compose exec app bash }
    'pnpm'    { Invoke-Compose exec app pnpm @Rest }
    'test'    { Invoke-Compose exec app pnpm test @Rest }
    'check'   { Invoke-Compose exec app pnpm check }
    'build'   { Invoke-Compose exec app pnpm build }
    'migrate' { Invoke-Compose exec app pnpm db:migrate }
    'seed'    { Invoke-Compose exec app pnpm db:seed }
    'db'      { Invoke-Compose exec db sh -c 'psql -U "$POSTGRES_USER" "$POSTGRES_DB"' }
    'urls' {
        Write-Host '  アプリ     http://localhost:3200'
        Write-Host '  DB         localhost:5437（ユーザー app / パスワード app）'
    }
    'clean' {
        $ans = Read-Host 'DB と node_modules を含めて全部消します。よろしいですか？ (yes/no)'
        if ($ans -eq 'yes') { Invoke-Compose down -v --rmi local }
    }
    default {
        @'
使い方: .\dev.ps1 <コマンド>

  setup        初回の準備（.env 作成・ビルド・pnpm install・テーブル作成・見本データ・起動）
  up / down    起動 / 停止
  restart      アプリだけ再起動
  rebuild      イメージを作り直して起動（Dockerfile を変えたとき）
  status       動いているサービスの一覧
  logs [名前]  ログを見る（例: .\dev.ps1 logs app）
  sh           アプリのコンテナの中に入る
  pnpm ...     pnpm コマンド（例: .\dev.ps1 pnpm add date-fns）
  test         テストを実行（Vitest。テスト用の DB を使う）
  check        型チェック・ESLint・テストをまとめて実行
  build        本番用のビルドを試す
  migrate      テーブルの変更を DB に反映（先に .\dev.ps1 pnpm db:generate）
  seed         見本データを入れ直す
  db           PostgreSQL に接続
  urls         各画面の URL を表示
  clean        データごと全部消す（確認あり）
'@ | Write-Host
    }
}
