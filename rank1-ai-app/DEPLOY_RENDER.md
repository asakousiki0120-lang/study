# 学年1位製造AI - RENDER デプロイガイド

## 🚀 デプロイ手順

### 方法1: Render Dashboard からデプロイ（推奨）

1. **GitHub リポジトリにプッシュ**
   ```bash
   cd /workspace/rank1-ai-app
   git init
   git add .
   git commit -m "Initial commit for Render deployment"
   # GitHub リモートリポジトリを追加してプッシュ
   ```

2. **Render で新規 Web Service を作成**
   - https://dashboard.render.com にアクセス
   - 「New +」→「Web Service」を選択
   - GitHub リポジトリを接続

3. **設定項目**
   - **Name**: `rank1-ai-app`（任意）
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free または Starter（$7/月）

4. **環境変数の設定**（必要に応じて）
   - `NODE_ENV`: `production`
   - `PORT`: `3000`（Render が自動設定）

5. **Deploy!**
   - 「Create Web Service」をクリック
   - デプロイが完了すると URL が発行されます

---

### 方法2: render.yaml を使用した自動デプロイ

`render.yaml` ファイルをルートに配置済みです。

```bash
# GitHub にプッシュ後、Render Dashboard で
# 「Blueprints」から自動認識されます
```

---

## ⚠️ 重要：SQLite の注意点

現在のアプリは SQLite (`rank1.db`) を使用しています。

**Render の制限:**
- Free プランではファイルシステムが一時的
- **再起動で SQLite DB が消去される可能性あり**

**解決策:**

### オプションA: PostgreSQL に移行（推奨）
Render は無料 PostgreSQL を提供しています。

```bash
# 1. Render Dashboard で Database を作成
# 2. 接続情報を環境変数に設定
# 3. サーバーコードを PostgreSQL 対応に変更
```

### オプションB: 外部ストレージを使用
- Supabase (無料枠あり)
- Firebase Firestore
- PlanetScale (MySQL)

### オプションC: 簡易バックアップ
起動時に DB を復元する仕組みを実装

---

## 🔧 PostgreSQL への移行手順

### 1. Render で PostgreSQL データベースを作成
- Dashboard → New + → PostgreSQL
- Free プランを選択
- 接続情報をコピー

### 2. 依存関係の追加
```json
{
  "dependencies": {
    "pg": "^8.11.0"
  }
}
```

### 3. 環境変数を設定
```
DATABASE_URL=postgresql://user:password@host:port/dbname
```

### 4. サーバーコードを修正
`better-sqlite3` → `pg` に変更

---

## 📊 デプロイ後の確認事項

1. **ヘルスチェック**
   ```
   https://your-app-name.onrender.com/health
   ```

2. **ログの確認**
   - Render Dashboard → Logs タブ

3. **パフォーマンス**
   - Free プランは 15 分でスリープ
   - 初回アクセス時に再起動（30 秒程度）

---

## 🎯 次のステップ

1. GitHub リポジトリにコードをプッシュ
2. Render Dashboard で Web Service を作成
3. PostgreSQL データベースを追加（推奨）
4. 環境変数を設定
5. デプロイ完了！

質問があればお知らせください。
