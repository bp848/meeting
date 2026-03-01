# 仕様書 - @bp848/meeting-minutes-assistant

## 1. 概要

本ドキュメントは、AI議事録作成アシスタントのシステム仕様を定義する。

### 1.1 目的

会議の音声録音からAIを活用して文字起こし、要約、アクションアイテム抽出を自動化し、議事録作成の効率化を実現する。

### 1.2 対象ユーザー

- 日本語環境で会議を行うチーム
- 議事録作成を自動化したい企業・組織
- 独自システムに議事録機能を組み込みたい開発者

---

## 2. システムアーキテクチャ

### 2.1 全体構成

```
┌─────────────────────────────────────────────────┐
│                  ブラウザ (クライアント)            │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │Dashboard  │  │Recorder  │  │MeetingDetail │   │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       │              │               │            │
│  ┌────┴──────────────┴───────────────┴────┐      │
│  │              App.tsx (状態管理)          │      │
│  └────┬──────────────┬───────────────┬────┘      │
│       │              │               │            │
│  ┌────▼────┐  ┌──────▼─────┐  ┌─────▼──────┐   │
│  │Storage  │  │  Gemini    │  │  Supabase  │    │
│  │Service  │  │  Service   │  │  Service   │    │
│  └────┬────┘  └──────┬─────┘  └─────┬──────┘   │
│       │              │               │            │
└───────┼──────────────┼───────────────┼────────────┘
        │              │               │
   IndexedDB     Gemini API      Supabase REST API
   (ローカル)     (Google)        (クラウド)
```

### 2.2 コンポーネント構成

| コンポーネント | ファイル | 責務 |
|---------------|---------|------|
| App | `src/App.tsx` | アプリ全体の状態管理・画面遷移 |
| Dashboard | `src/components/Dashboard.tsx` | 会議一覧・新規会議開始 |
| MeetingRecorder | `src/components/MeetingRecorder.tsx` | 音声録音・処理パイプライン |
| MeetingDetail | `src/components/MeetingDetail.tsx` | 議事録詳細表示・再分析 |
| SettingsModal | `src/components/SettingsModal.tsx` | Supabase接続設定 |
| AudioVisualizer | `src/components/AudioVisualizer.tsx` | 録音中の音声波形表示 |

### 2.3 サービス層

| サービス | ファイル | 機能 |
|---------|---------|------|
| geminiService | `src/services/geminiService.ts` | Gemini AIとの通信（文字起こし・分析） |
| storageService | `src/services/storageService.ts` | IndexedDBによるローカルデータ永続化 |
| supabaseService | `src/services/supabaseService.ts` | Supabase REST APIによるクラウド同期 |

---

## 3. データ構造

### 3.1 Meeting（会議）

```typescript
interface Meeting {
  id: string;              // 一意識別子
  title: string;           // 会議タイトル（AI生成）
  date: string;            // ISO 8601形式の日時
  durationSeconds: number; // 録音時間（秒）
  transcript: string;      // 文字起こしテキスト
  summary: string;         // AI要約（Markdown形式）
  actionItems: ActionItem[]; // アクションアイテム配列
  status: MeetingStatus;   // RECORDING | PROCESSING | COMPLETED | FAILED
  synced?: boolean;        // Supabase同期済みフラグ
  audioData?: string;      // Base64エンコード音声データ
  mimeType?: string;       // 音声MIMEタイプ（例: audio/webm）
  notes?: string;          // ユーザーの個人メモ
}
```

### 3.2 ActionItem（アクションアイテム）

```typescript
interface ActionItem {
  task: string;            // タスク内容
  owner: string;           // 担当者名
  priority: 'High' | 'Medium' | 'Low'; // 優先度
  deadline?: string;       // 期限（任意）
}
```

### 3.3 SupabaseConfig（Supabase設定）

```typescript
interface SupabaseConfig {
  url: string;             // Supabase Project URL
  key: string;             // Supabase Anon Key
  tableName: string;       // 議事録テーブル名
  usersTableName?: string; // ユーザーテーブル名
}
```

### 3.4 MeetingStatus（会議ステータス）

```typescript
enum MeetingStatus {
  RECORDING = 'RECORDING',     // 録音中
  PROCESSING = 'PROCESSING',   // AI処理中
  COMPLETED = 'COMPLETED',     // 完了
  FAILED = 'FAILED'           // 失敗
}
```

---

## 4. 処理フロー

### 4.1 録音→議事録作成フロー

```
[録音開始] → MediaRecorder API で音声キャプチャ
    ↓
[録音停止] → Blob → Base64変換
    ↓
[中間保存] → IndexedDBに音声データ保存（status: PROCESSING）
    ↓
[文字起こし] → Gemini 2.5 Flash に Base64音声送信
    ↓
[分析] → Gemini 3 Pro にトランスクリプト送信
    ↓  ※ Thinking Config (budget: 32768) 使用
    ↓  ※ Structured Output (JSON Schema) で結果取得
    ↓
[完了保存] → IndexedDBに結果保存（status: COMPLETED）
    ↓
[表示] → MeetingDetail画面に遷移
    ↓ (任意)
[Supabase同期] → REST APIで議事録データをクラウドに保存
```

### 4.2 エラーハンドリング

- AI処理失敗時: ステータスをFAILEDに設定し、音声データを保持。再分析ボタンで再試行可能。
- ネットワークエラー: ローカルストレージに保存済みのデータは保持される。
- マイクアクセス拒否: ユーザーにエラーメッセージを表示。

---

## 5. AI モデル仕様

### 5.1 文字起こし

| 項目 | 値 |
|------|-----|
| モデル | `gemini-2.5-flash` |
| 入力 | Base64エンコード音声 + プロンプト |
| 出力 | 日本語テキスト（話者ラベル付き） |
| プロンプト言語 | 日本語 |

### 5.2 分析

| 項目 | 値 |
|------|-----|
| モデル | `gemini-3-pro-preview` |
| Thinking Budget | 32,768 トークン |
| 出力形式 | JSON (Structured Output) |
| システム指示 | 議事録作成の専門家として振る舞う |

### 5.3 分析出力スキーマ

```json
{
  "title": "会議タイトル（日本語）",
  "summary": "包括的な要約（Markdown形式、日本語）",
  "actionItems": [
    {
      "task": "タスク内容",
      "owner": "担当者名",
      "priority": "High|Medium|Low",
      "deadline": "期限（任意）"
    }
  ]
}
```

---

## 6. ストレージ仕様

### 6.1 IndexedDB

| 項目 | 値 |
|------|-----|
| データベース名 | `MeetingMinuteMasterDB` |
| バージョン | 1 |
| オブジェクトストア | `meetings` |
| キーパス | `id` |

### 6.2 Supabase テーブル構造（推奨）

```sql
CREATE TABLE meetings (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER,
  transcript TEXT,
  summary TEXT,
  action_items JSONB,
  audio_base64 TEXT,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);
```

---

## 7. ブラウザ要件

| 要件 | 最低バージョン |
|------|-------------|
| Chrome | 89+ |
| Firefox | 85+ |
| Safari | 14.1+ |
| Edge | 89+ |
| Web API | MediaRecorder, IndexedDB, AudioContext |
| HTTPS | 必須（マイクアクセスのため） |

---

## 8. npmパッケージ仕様

| 項目 | 値 |
|------|-----|
| パッケージ名 | `@bp848/meeting-minutes-assistant` |
| バージョン | 1.0.0 |
| ライセンス | MIT |
| ESM出力 | `dist/index.es.js` |
| CJS出力 | `dist/index.cjs.js` |
| 型定義 | `dist/index.d.ts` |
| peerDependencies | `react >= 18.0.0`, `react-dom >= 18.0.0` |
