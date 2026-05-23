# 学年1位製造AI - RENDER デプロイ完全ガイド

## 🚀 クイックスタート

### 方法1: render.yaml で自動デプロイ（推奨）

**render.yaml** を使用すると、Web サービスとデータベースが同時に設定されます。

```bash
# 1. GitHub リポジトリにコードをプッシュ
cd /workspace/rank1-ai-app
git init
git add .
git commit -m "Initial commit for Render deployment"
# git remote add origin <your-repo-url>
# git push -u origin main
```

**2. Render Dashboard でデプロイ**

1. https://dashboard.render.com にアクセス
2. 「New +」→「Blueprint」を選択
3. GitHub リポジトリを接続
4. **render.yaml** が自動認識され、以下の構成が作成されます：
   - Web Service: `rank1-ai-app`
   - PostgreSQL Database: `rank1-db`

---

## 📋 手動設定の方法

### ステップ1: PostgreSQL データベースを作成

1. Render Dashboard →「New +」→「PostgreSQL」
2. 設定：
   - **Name**: `rank1-db`
   - **Region**: `Tokyo`（日本から近いリージョン）
   - **Plan**: `Free`（無料枠）
   - **Database Name**: `rank1db`

3. 作成後、「Connection」タブから **Internal Database URL** をコピー

### ステップ2: Web Service を作成

1. Render Dashboard →「New +」→「Web Service」
2. GitHub リポジトリを接続
3. 設定：
   - **Name**: `rank1-ai-app`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start:render`
   - **Instance Type**: `Free`

4. **環境変数を追加**：
   ```
   NODE_ENV = production
   DATABASE_URL = <コピーした Internal Database URL>
   ```

5. 「Create Web Service」をクリック

---

## 🔧 ファイル構成

```
rank1-ai-app/
├── server.js              # 開発用（SQLite）
├── server-render.js       # 本番用（PostgreSQL）← Render で使用
├── package.json           # 依存関係 + スクリプト
├── render.yaml            # Render 設定ファイル
├── public/
│   └── index.html         # フロントエンド
├── DEPLOY_RENDER.md       # デプロイガイド（旧）
└── README.md              # プロジェクト概要
```

---

## 🗄️ データベース移行

### SQLite → PostgreSQL の違い

| 項目 | SQLite (開発) | PostgreSQL (本番) |
|------|--------------|------------------|
| ファイル | `rank1.db` | クラウド DB |
| 永続性 | ❌ ローカル | ✅ 永続 |
| 同時接続 | 制限あり | 多数可能 |
| Render 対応 | ❌ 非推奨 | ✅ 推奨 |

### 使用されるテーブル

- `users` - ユーザー情報
- `subjects` - 教科・点数
- `study_logs` - 学習ログ
- `weaknesses` - 弱点データ
- `study_plans` - 学習計画
- `problems` - 問題・正誤記録

---

## 🌐 デプロイ後の確認

### 1. ヘルスチェック

```
https://<your-app-name>.onrender.com/api/health
```

レスポンス例：
```json
{
  "status": "ok",
  "database": "postgresql"
}
```

### 2. ログの確認

Render Dashboard →「Logs」タブでリアルタイムログを確認

### 3. パフォーマンス注意

**Free プランの制限:**
- ⏱️ 15 分間アクセスがないとスリープ
- 🚀 初回アクセス時に再起動（30-60 秒）
- 💾 月間 750 時間まで（約 24 日稼働）

**アップグレード案:**
- Starter Plan ($7/月): スリープなし、高速応答

---

## 🔄 CI/CD 自動デプロイ

GitHub にプッシュするたびに自動デプロイされます：

```bash
# 修正を加えたら
git add .
git commit -m "Fix: 問題生成ロジック改善"
git push

# ↓ 自動で Render にデプロイ ↑
```

---

## 🛠️ トラブルシューティング

### エラー: "Database connection failed"

**原因:** `DATABASE_URL` が未設定または間違っている

**解決:**
1. Render Dashboard → 環境変数を確認
2. PostgreSQL の「Connection」タブから正しい URL をコピー
3. 再デプロイ

### エラー: "Module not found: pg"

**原因:** 依存関係がインストールされていない

**解決:**
```bash
# package.json に pg が含まれているか確認
cat package.json

# 必要なら追加
npm install pg
git add package.json package-lock.json
git commit -m "Add pg dependency"
git push
```

### エラー: "better-sqlite3" ビルドエラー

**原因:** Render は SQLite ネイティブモジュールをサポートしていない

**解決:**
- ✅ 既に `server-render.js` で PostgreSQL 対応済み
- Start Command: `npm run start:render` を使用

---

## 🎯 次のアクション

### 今すぐやるべきこと

1. **GitHub リポジトリを作成**
   ```bash
   cd /workspace/rank1-ai-app
   git init
   git add .
   git commit -m "Initial commit"
   # GitHub でリポジトリ作成後、リモートを設定
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Render でデプロイ**
   - 方法 A: `render.yaml` を Blueprint として読み込む（推奨）
   - 方法 B: 手動で Web Service と Database を作成

3. **動作確認**
   - ヘルスチェック URL にアクセス
   - フロントエンドの UI を確認

4. **ユーザー登録テスト**
   - アプリでユーザーを作成
   - 教科を追加
   - AI 分析を実行

---

## 📊 監視と分析

### 使用するツール

- **Render Logs**: リアルタイムログ
- **Render Metrics**: CPU/メモリ使用量
- **PostgreSQL Metrics**: DB パフォーマンス

### アラート設定（有料プラン）

- 応答時間の閾値
- エラーレートの通知
- データベース容量警告

---

## 🔒 セキュリティベストプラクティス

1. **環境変数の管理**
   - API キーは絶対に Git にコミットしない
   - `.env` ファイルは `.gitignore` に追加

2. **CORS 設定**
   - 本番ではドメインを制限
   ```javascript
   app.use(cors({
     origin: ['https://yourdomain.com']
   }));
   ```

3. **データベースアクセス**
   - SSL 接続を必須化（実装済み）
   - 最小権限の原則

---

## 💰 費用試算

### 無料プランの場合
- Web Service (Free): $0/月
- PostgreSQL (Free): $0/月
- **合計: $0/月**
  - 制限: スリープあり、月 750 時間

### Starter プランの場合
- Web Service (Starter): $7/月
- PostgreSQL (Free): $0/月
- **合計: $7/月**
  - 利点: スリープなし、常時稼働

### Pro プランの場合
- Web Service (Pro): $25/月
- PostgreSQL (Standard): $29/月
- **合計: $54/月**
  - 利点: 高性能、優先サポート

---

## 📞 サポート

- Render ドキュメント: https://render.com/docs
- コミュニティ: https://community.render.com
- 本アプリの課題: GitHub Issues

---

**🎉 デプロイ完了後、URL を生徒たちに共有しましょう！**
