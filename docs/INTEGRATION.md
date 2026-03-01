# 統合説明書 - @bp848/meeting-minutes-assistant

## 1. 統合の概要

本ドキュメントでは、AI議事録作成アシスタントを外部システムに統合する方法を解説する。

---

## 2. npmパッケージとしての統合

### 2.1 インストール

```bash
# npmの場合
npm install @bp848/meeting-minutes-assistant

# yarnの場合
yarn add @bp848/meeting-minutes-assistant

# pnpmの場合
pnpm add @bp848/meeting-minutes-assistant
```

### 2.2 peerDependencies

以下が別途必要（プロジェクトに未インストールの場合）：

```bash
npm install react react-dom
```

### 2.3 環境変数の設定

Viteプロジェクトの場合、`.env.local` に以下を設定：

```
GEMINI_API_KEY=your_gemini_api_key
```

ビルド時に `process.env.API_KEY` として注入されるため、Vite以外のプロジェクトでは各ビルドツールの環境変数設定に従うこと。

---

## 3. コンポーネント統合パターン

### 3.1 フルアプリケーション統合

最も簡単な方法。`MeetingApp` コンポーネントをそのまま使用する。

```tsx
import { MeetingApp } from '@bp848/meeting-minutes-assistant';

function MyApp() {
  return (
    <div className="h-screen bg-slate-900">
      <MeetingApp />
    </div>
  );
}
```

### 3.2 個別コンポーネント統合

特定の機能のみを使用する場合。

#### 録音コンポーネントのみ

```tsx
import { MeetingRecorder } from '@bp848/meeting-minutes-assistant';
import type { Meeting } from '@bp848/meeting-minutes-assistant';

function RecordingPage() {
  const handleComplete = (meeting: Meeting) => {
    console.log('議事録作成完了:', meeting);
    // 独自のストレージに保存など
  };

  return (
    <MeetingRecorder
      onCancel={() => window.history.back()}
      onIntermediateSave={async (meeting) => { /* 中間保存処理 */ }}
      onComplete={handleComplete}
      onError={(meeting) => console.error('処理失敗:', meeting)}
      userNames={['田中', '鈴木', '佐藤']}
    />
  );
}
```

#### ダッシュボードのみ

```tsx
import { Dashboard } from '@bp848/meeting-minutes-assistant';
import type { Meeting } from '@bp848/meeting-minutes-assistant';

function MeetingList({ meetings }: { meetings: Meeting[] }) {
  return (
    <Dashboard
      meetings={meetings}
      onNewMeeting={() => { /* 新規会議画面へ遷移 */ }}
      onSelectMeeting={(meeting) => { /* 詳細画面へ遷移 */ }}
      onShowSettings={() => { /* 設定モーダル表示 */ }}
    />
  );
}
```

### 3.3 サービス層のみ使用

UIコンポーネントを使わず、AIサービスだけを利用する場合。

```typescript
import {
  transcribeAudio,
  analyzeTranscript,
} from '@bp848/meeting-minutes-assistant';

// 音声データをBase64で用意
const base64Audio = '...'; // Base64エンコード済み音声

// 文字起こし
const transcript = await transcribeAudio(base64Audio, 'audio/webm');

// 分析
const analysis = await analyzeTranscript(transcript, ['田中', '佐藤']);
console.log(analysis.title);      // 会議タイトル
console.log(analysis.summary);    // 要約
console.log(analysis.actionItems); // アクションアイテム
```

---

## 4. Supabase統合

### 4.1 テーブル作成

Supabaseプロジェクトで以下のSQLを実行：

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

-- Row Level Security（推奨）
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON meetings
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous select" ON meetings
  FOR SELECT TO anon USING (true);

-- ユーザーテーブル（AI担当者予測用、任意）
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous select" ON users
  FOR SELECT TO anon USING (true);

-- 初期ユーザー（例）
INSERT INTO users (name) VALUES ('田中'), ('鈴木'), ('佐藤');
```

### 4.2 プログラムからの設定

```typescript
import { saveMeetingToSupabase, fetchUsersFromSupabase } from '@bp848/meeting-minutes-assistant';
import type { SupabaseConfig, Meeting } from '@bp848/meeting-minutes-assistant';

const config: SupabaseConfig = {
  url: 'https://your-project.supabase.co',
  key: 'your-anon-key',
  tableName: 'meetings',
  usersTableName: 'users',
};

// ユーザー一覧取得
const users = await fetchUsersFromSupabase(config);

// 議事録保存
const meeting: Meeting = { /* ... */ };
await saveMeetingToSupabase(meeting, config);
```

---

## 5. Gemini API 統合

### 5.1 APIキー取得

1. [Google AI Studio](https://aistudio.google.com/apikey) にアクセス
2. 「Create API Key」をクリック
3. 取得したキーを環境変数 `GEMINI_API_KEY` に設定

### 5.2 使用モデル

| 用途 | モデル名 | 特徴 |
|------|---------|------|
| 文字起こし | `gemini-2.5-flash` | 高速・コスト効率的 |
| 分析 | `gemini-3-pro-preview` | 高品質・思考機能付き |

### 5.3 カスタマイズ

モデル名やThinking Budgetをカスタマイズする場合は、`constants.ts` の値を変更する：

```typescript
import { MODEL_TRANSCRIPTION, MODEL_ANALYSIS, THINKING_BUDGET } from '@bp848/meeting-minutes-assistant';
// デフォルト値:
// MODEL_TRANSCRIPTION = 'gemini-2.5-flash'
// MODEL_ANALYSIS = 'gemini-3-pro-preview'
// THINKING_BUDGET = 32768
```

---

## 6. 既存React/Next.jsプロジェクトへの統合

### 6.1 Next.js (App Router)

```tsx
// app/meetings/page.tsx
'use client';

import { MeetingApp } from '@bp848/meeting-minutes-assistant';

export default function MeetingsPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      <MeetingApp />
    </div>
  );
}
```

**注意**: `MeetingApp` はブラウザAPIを使用するため、`'use client'` ディレクティブが必須。

### 6.2 Vite + React

```tsx
// src/App.tsx
import { MeetingApp } from '@bp848/meeting-minutes-assistant';

function App() {
  return <MeetingApp />;
}

export default App;
```

### 6.3 CRA (Create React App)

```tsx
// src/App.tsx
import { MeetingApp } from '@bp848/meeting-minutes-assistant';

function App() {
  return <MeetingApp />;
}

export default App;
```

**環境変数**: CRAでは `REACT_APP_GEMINI_API_KEY` として設定し、ビルド時に `process.env.API_KEY` へマッピングが必要。

---

## 7. セキュリティ考慮事項

| 項目 | 対策 |
|------|------|
| APIキー露出 | 環境変数で管理、コードにハードコードしない |
| Supabase RLS | Row Level Security を有効化 |
| HTTPS | 必須（マイクアクセスのため） |
| 音声データ | Base64でIndexedDB/Supabaseに保存。大容量の場合はSupabase Storageバケットを推奨 |
| CORS | Supabaseのデフォルト設定で対応済み |
