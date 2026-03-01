// Library entry point - exports all public components, services, and types
// Usage: import { MeetingApp, transcribeAudio, ... } from '@bp848/meeting-minutes-assistant'

// Types
export { MeetingStatus } from './types';
export type { Meeting, ActionItem, SupabaseConfig, User, AnalysisResult } from './types';

// Constants
export { MODEL_TRANSCRIPTION, MODEL_ANALYSIS, THINKING_BUDGET, buildAnalysisSystemInstruction } from './constants';

// Services
export { transcribeAudio, analyzeTranscript } from './services/geminiService';
export { saveMeetingToSupabase, fetchUsersFromSupabase } from './services/supabaseService';
export { initDB, getAllMeetingsFromStorage, saveMeetingToStorage, deleteMeetingFromStorage } from './services/storageService';

// Components
export { default as MeetingApp } from './App';
export { MeetingRecorder } from './components/MeetingRecorder';
export { MeetingDetail } from './components/MeetingDetail';
export { Dashboard } from './components/Dashboard';
export { SettingsModal } from './components/SettingsModal';
export { AudioVisualizer } from './components/AudioVisualizer';
