# 手順書 - @bp848/meeting-minutes-assistant

## 1. 環境構築手順

### 1.1 前提条件

| 要件 | バージョン |
|------|-----------|
| Node.js | 18.0.0 以上 |
| npm | 9.0.0 以上 |
| Git | 2.30.0 以上 |
| ブラウザ | Chrome 89+ / Firefox 85+ / Safari 14.1+ |

### 1.2 リポジトリのクローン

```bash
git clone https://github.com/bp848/meeting.git
cd meeting
```

### 1.3 依存関係のインストール

```bash
npm install
```

### 1.4 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` を編集し、Gemini API キーを設定：

```
GEMINI_API_KEY=AIzaSy...your_key_here
```

**APIキーの取得方法**:
1. https://aistudio.google.com/apikey にアクセス
2. Google アカウントでログイン
3. 「Create API Key」をクリック
4. 生成されたキーをコピー

---

## 2. 開発手順

### 2.1 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセス。

### 2.2 型チェック

```bash
npm run typecheck
```

### 2.3 プロダクションビルド（アプリ）

```bash
npm run build
npm run preview
```

### 2.4 ライブラリビルド（npmパッケージ）

```bash
npm run build:lib
```

出力先: `dist/` ディレクトリ

| ファイル | 説明 |
|---------|------|
| `dist/index.es.js` | ESM形式バンドル |
| `dist/index.cjs.js` | CommonJS形式バンドル |
| `dist/index.d.ts` | TypeScript型定義 |

---

## 3. npmパッケージ公開手順

### 3.1 npmアカウント設定

```bash
# npmアカウントがない場合
npm adduser

# 既にアカウントがある場合
npm login
```

### 3.2 スコープパッケージの設定

`@bp848` スコープで公開するため、npm Organization の設定が必要：

```bash
# Organization作成（初回のみ）
# https://www.npmjs.com/org/create で作成
```

### 3.3 パッケージのビルドと公開

```bash
# ライブラリビルド
npm run build:lib

# バージョン確認
npm version patch  # or minor / major

# 公開（スコープパッケージはpublic指定が必要）
npm publish --access public
```

### 3.4 公開後の確認

```bash
npm info @bp848/meeting-minutes-assistant
```

---

## 4. Supabaseセットアップ手順

### 4.1 プロジェクト作成

1. https://supabase.com にアクセス
2. 「Start your project」をクリック
3. 新規プロジェクトを作成（リージョン: Northeast Asia を推奨）

### 4.2 テーブル作成

SQL Editorで以下を実行：

```sql
-- 議事録テーブル
CREATE TABLE meetings (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER DEFAULT 0,
  transcript TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  action_items JSONB DEFAULT '[]'::jsonb,
  audio_base64 TEXT,
  mime_type TEXT DEFAULT 'audio/webm',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security有効化
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- 匿名ユーザーの読み書き許可
CREATE POLICY "Allow anon insert" ON meetings
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon select" ON meetings
  FOR SELECT TO anon USING (true);

-- ユーザーテーブル（任意 - AI担当者予測用）
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon select" ON users
  FOR SELECT TO anon USING (true);
```

### 4.3 接続情報の取得

1. Supabase Dashboard → Settings → API
2. 以下をメモ：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbG...`

### 4.4 アプリでの設定

アプリの設定画面（歯車アイコン）から以下を入力：

| 項目 | 入力値 |
|------|--------|
| プロジェクトURL | `https://xxxxx.supabase.co` |
| API Key | `eyJhbG...（anon key）` |
| 議事録テーブル名 | `meetings` |
| ユーザーテーブル名 | `users`（任意） |

---

## 5. 使用手順

### 5.1 会議録音

1. ダッシュボードの「新規会議」ボタンをクリック
2. マイクのアクセス許可を付与
3. 「録音開始」をクリック
4. 会議終了後、「会議終了」をクリック
5. AI処理（文字起こし → 分析）を待機
6. 完了後、議事録詳細画面に自動遷移

### 5.2 議事録確認

議事録詳細画面では以下を確認可能：

- **AI要約タブ**: Gemini AIによる構造化された要約
- **文字起こし原文タブ**: 音声の完全なテキスト
- **個人メモタブ**: 自由記述のメモ欄
- **アクションプラン**: 右パネルに担当者・優先度付きで表示
- **音声再生**: 録音した音声の再生

### 5.3 Supabase同期

1. 議事録詳細画面の「Supabaseに保存」をクリック
2. 成功すると「同期済み」ステータスに変更

### 5.4 再分析

AI分析が失敗した場合、またはモデル更新後に再実行したい場合：

1. 議事録詳細画面の「再分析する」ボタンをクリック
2. 音声データから再度文字起こし・分析を実行

---

## 6. トラブルシューティング

### 6.1 マイクアクセスエラー

**症状**: 「マイクの使用がブロックされています」

**対処**:
1. ブラウザのアドレスバー左のアイコンをクリック
2. 「マイク」を「許可」に変更
3. ページを再読み込み

### 6.2 AI処理エラー

**症状**: 「分析中にエラーが発生しました」

**対処**:
1. `GEMINI_API_KEY` が正しく設定されているか確認
2. APIの利用上限に達していないか確認
3. 「再分析する」ボタンで再試行

### 6.3 Supabase同期エラー

**症状**: 「同期エラー: API Error 4xx」

**対処**:
1. プロジェクトURL・APIキーが正しいか確認
2. テーブル名が一致しているか確認
3. RLSポリシーが設定されているか確認
4. CORSが許可されているか確認

### 6.4 ビルドエラー

**症状**: `npm run build:lib` が失敗する

**対処**:
```bash
# node_modules を削除して再インストール
rm -rf node_modules
npm install

# TypeScriptキャッシュクリア
npx tsc --build --clean

# 再ビルド
npm run build:lib
```

---

## 7. デプロイ手順

### 7.1 Vercel

```bash
npm install -g vercel
vercel

# 環境変数の設定
vercel env add GEMINI_API_KEY
```

### 7.2 Netlify

```bash
# netlify.toml を作成
cat > netlify.toml << 'EOF'
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
EOF

# デプロイ
npx netlify deploy --prod
```

### 7.3 Docker

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

```bash
docker build --build-arg GEMINI_API_KEY=your_key -t meeting-app .
docker run -p 8080:80 meeting-app
```
