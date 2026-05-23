# 🎯 学年 1 位製造 AI

最短で学年 1 位を取るための最適化学習戦略を自動生成するアプリケーション

## 🚀 始め方

### 1. インストール

```bash
cd rank1-ai-app
npm install
```

### 2. 起動

```bash
npm start
```

サーバーが起動し、以下の URL でアクセス可能になります：
- **http://localhost:3000**

### 3. 開発モード（ホットリロード）

```bash
npm run dev
```

## 📋 機能

- **教科別分析**: 数学・英語・国語・理科・社会に対応
- **弱点推定**: 過去の点数から苦手分野を自動特定
- **学習計画**: 1 日単位の最適な学習スケジュール
- **問題生成**: 弱点を狙った実践問題を自動作成
- **点数予測**: 現在の学習量から本番の点数を予測
- **学年 1 位ライン**: 必要な点数と達成可能性を表示
- **進捗管理**: 学習ログを記録して計画を自動調整

## 🗄️ データベース

SQLite を使用したローカルデータベース：
- `rank1.db` - ユーザー情報、学習ログ、弱点データなどを保存

## 🔌 API エンドポイント

| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| POST | `/api/user` | ユーザー作成・取得 |
| POST | `/api/subject` | 教科登録 |
| POST | `/api/study-strategy` | 学習戦略生成（メイン） |
| POST | `/api/study-log` | 学習記録 |
| GET | `/api/progress/:userId` | 進捗状況取得 |

## 📝 使用例

### 学習戦略を生成

```bash
curl -X POST http://localhost:3000/api/study-strategy \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "数学",
    "range": "二次関数、図形",
    "currentScore": 65,
    "daysUntilTest": 7
  }'
```

## 🛠️ 技術スタック

- **バックエンド**: Node.js + Express
- **データベース**: SQLite (better-sqlite3)
- **フロントエンド**: HTML5 + CSS3 + Vanilla JavaScript
- **AI エンジン**: 内蔵（拡張可能）

## 🔄 拡張案

1. **実 AI 連携**: OpenAI API や Anthropic API と連携
2. **モバイルアプリ**: React Native でネイティブ対応
3. **音声入力**: 音声で学習ログを記録
4. **友達機能**: ランキングや競争要素を追加
5. **写真認識**: 問題用紙を撮影して自動解析

## 📄 ライセンス

MIT
