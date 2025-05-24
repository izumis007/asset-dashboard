# Self-Hosted Asset Dashboard

プライバシーを重視したセルフホスト型の資産管理ダッシュボード。Money Forwardの代替として、ビットコインを含む家計資産を統合管理します。

## 🚧 WIP
このリポジトリは現在開発中です。設計や実装は変更される可能性が高く、本番環境での利用は想定されていません。

## 主な機能

- 📊 **資産ダッシュボード**: 総資産額、履歴トレンド、資産配分の可視化
- 💰 **マルチ資産対応**: 株式、ETF、投資信託、債券、暗号資産、現金
- 🔐 **プライバシー重視**: 完全セルフホスト、ウォレットアドレス不要
- 📈 **自動価格更新**: 複数のAPIソースから日次で価格取得
- 💸 **BTC損益計算**: FIFO/HIFO対応、Excel出力可能
- 🏦 **Money Forward連携**: 銀行残高の自動取得
- 📱 **レスポンシブUI**: デスクトップ・スマートフォン対応

## 技術スタック

- **Backend**: FastAPI (Python 3.12), PostgreSQL, Celery, Redis
- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS
- **Infrastructure**: Docker Compose, Caddy
- **Security**: JWT認証, TOTP 2FA対応

## クイックスタート

### 1. 前提条件

- Docker & Docker Compose
- Git

### 2. セットアップ

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/asset-dashboard.git
cd asset-dashboard

# 環境変数の設定
cp .env.example .env
# .envファイルを編集して必要な値を設定

# 起動
docker-compose up -d
```

### 3. 初期設定

1. ブラウザで `http://localhost` にアクセス
2. 新規ユーザー登録
3. 設定画面でAPIキーを設定：
   - Twelve Data API (推奨)
   - Alpha Vantage API (バックアップ)
   - Money Forward認証情報（オプション）

### 4. 資産の登録

1. Assets → Add Assetで資産を登録
2. Holdings → Add Holdingで保有数量を入力
3. BTCの場合はBTC Trades画面で取引履歴を記録

## 環境変数

```env
# Database
POSTGRES_PASSWORD=secure_password_here

# Redis  
REDIS_PASSWORD=secure_redis_password

# Application
SECRET_KEY=your_32_char_secret_key_here

# API Keys (最低1つ必要)
TWELVE_DATA_API_KEY=your_key  # 無料プラン: 800リクエスト/日
ALPHA_VANTAGE_API_KEY=your_key  # 無料プラン: 5リクエスト/分

# Money Forward (オプション)
MONEY_FORWARD_EMAIL=your_email
MONEY_FORWARD_PASSWORD=your_password
```

## APIキーの取得

### Twelve Data (推奨)
1. https://twelvedata.com にアクセス
2. 無料アカウント作成
3. APIキーを取得（800リクエスト/日）

### Stooq
- APIキー不要
- 自動的にフォールバックとして使用

### Alpha Vantage
1. https://www.alphavantage.co にアクセス
2. 無料APIキー取得（5リクエスト/分）

## 使用方法

### 日次の運用

1. **自動更新**: 毎日0:30 JSTに価格を自動取得
2. **手動更新**: ダッシュボードの「Refresh Prices」ボタン

### BTC損益計算

1. BTC Trades画面で取引履歴を入力
2. 売却取引を選択して「Calculate Gain」
3. FIFO/HIFO方式を選択
4. Excel形式でダウンロード

### バックアップ

```bash
# データベースバックアップ
docker-compose exec postgres pg_dump -U postgres asset_dashboard > backup.sql

# リストア
docker-compose exec -T postgres psql -U postgres asset_dashboard < backup.sql
```

## セキュリティ

- HTTPS通信（Caddyによる自動証明書）
- パスワードハッシュ化（bcrypt）
- TOTP 2FA対応
- 環境変数による機密情報管理
- BTCアドレス/XPubは保存しない

## トラブルシューティング

### 価格が更新されない
- APIキーが正しく設定されているか確認
- `docker-compose logs backend`でエラーを確認

### Money Forwardスクレイピングが失敗
- 認証情報を確認
- `docker-compose logs scraper`でエラーを確認
- Money Forwardの仕様変更の可能性

### データベース接続エラー
```bash
