# @bp848/meeting-minutes-assistant

AI議事録作成アシスタント - 会議音声をリアルタイム録音し、Gemini AIで文字起こし・要約・アクションプラン自動生成を行うReactコンポーネントライブラリ。

## 特徴

- **音声録音** - ブラウザのマイクAPIを使用したリアルタイム音声録音
- **AI文字起こし** - Gemini 2.5 Flash による高精度な日本語文字起こし
- **AI分析** - Gemini 3 Pro による議事録要約・アクションアイテム自動抽出
- **ローカルストレージ** - IndexedDB による安全なローカルデータ保存
- **Supabase連携** - クラウドへの議事録同期・チーム共有
- **再分析機能** - 失敗時やモデル更新時の再分析対応

## インストール

```bash
npm install @bp848/meeting-minutes-assistant
```

## クイックスタート

### スタンドアロンアプリとして実行

```bash
git clone https://github.com/bp848/meeting.git
cd meeting
npm install
cp .env.example .env.local
# .env.local にGEMINI_API_KEYを設定
npm run dev
```

### npmパッケージとして使用

```tsx
import { MeetingApp } from '@bp848/meeting-minutes-assistant';

function App() {
  return <MeetingApp />;
}
```

個別コンポーネントの使用：

```tsx
import {
  MeetingRecorder,
  Dashboard,
  MeetingDetail,
  transcribeAudio,
  analyzeTranscript,
} from '@bp848/meeting-minutes-assistant';
```

## 環境変数

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `GEMINI_API_KEY` | Yes | Google Gemini API キー |

## エクスポート一覧

### コンポーネント

| コンポーネント | 説明 |
|---------------|------|
| `MeetingApp` | フルアプリケーション（ダッシュボード + 録音 + 詳細画面） |
| `Dashboard` | 会議一覧ダッシュボード |
| `MeetingRecorder` | 音声録音 + AI処理コンポーネント |
| `MeetingDetail` | 議事録詳細表示（要約・文字起こし・アクションプラン） |
| `SettingsModal` | Supabase設定モーダル |
| `AudioVisualizer` | 音声波形ビジュアライザー |

### サービス

| サービス | 説明 |
|---------|------|
| `transcribeAudio()` | Gemini AIによる音声文字起こし |
| `analyzeTranscript()` | Gemini AIによるトランスクリプト分析 |
| `saveMeetingToSupabase()` | Supabaseへのデータ保存 |
| `fetchUsersFromSupabase()` | Supabaseからのユーザー取得 |
| `getAllMeetingsFromStorage()` | IndexedDBからの会議データ取得 |
| `saveMeetingToStorage()` | IndexedDBへの会議データ保存 |

### 型定義

`Meeting`, `ActionItem`, `SupabaseConfig`, `User`, `AnalysisResult`, `MeetingStatus`

## ドキュメント

- [仕様書](./docs/SPECIFICATION.md) - システム仕様・アーキテクチャ・データ構造
- [統合説明書](./docs/INTEGRATION.md) - 外部システム統合・API連携ガイド
- [手順書](./docs/PROCEDURES.md) - セットアップ・デプロイ・運用手順

## 技術スタック

- **フロントエンド**: React 19, TypeScript, Tailwind CSS
- **AI**: Google Gemini API (@google/genai)
- **ストレージ**: IndexedDB (ローカル), Supabase (クラウド)
- **ビルド**: Vite 6
- **アイコン**: Lucide React

## ライセンス

MIT License - [LICENSE](./LICENSE)
