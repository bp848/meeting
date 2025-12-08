export enum MeetingStatus {
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface ActionItem {
  task: string;
  owner: string;
  priority: 'High' | 'Medium' | 'Low';
  deadline?: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  durationSeconds: number;
  transcript: string;
  summary: string;
  actionItems: ActionItem[];
  status: MeetingStatus;
  synced?: boolean;
  audioData?: string; // Base64 encoded audio
  mimeType?: string;
  notes?: string; // Personal notes
}

export interface SupabaseConfig {
  url: string;
  key: string;
  tableName: string; // For meetings
  usersTableName?: string; // For users table
}

export interface User {
  id: string;
  name: string;
}

// Gemini specific types for structured output
export interface AnalysisResult {
  summary: string;
  actionItems: ActionItem[];
  title: string;
}