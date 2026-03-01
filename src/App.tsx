import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Meeting, SupabaseConfig, User, MeetingStatus } from './types';
import { MeetingRecorder } from './components/MeetingRecorder';
import { MeetingDetail } from './components/MeetingDetail';
import { SettingsModal } from './components/SettingsModal';
import { Dashboard } from './components/Dashboard';
import { saveMeetingToSupabase, fetchUsersFromSupabase } from './services/supabaseService';
import { transcribeAudio, analyzeTranscript } from './services/geminiService';
import { getAllMeetingsFromStorage, saveMeetingToStorage } from './services/storageService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'record' | 'detail'>('dashboard');
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Initialize config
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mm_supabase_config');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.url && parsed.key) {
            return {
              url: parsed.url,
              key: parsed.key,
              tableName: parsed.tableName || 'meetings',
              usersTableName: parsed.usersTableName || 'users',
            };
          }
        } catch (e) {
          console.error("Failed to parse Supabase config:", e);
        }
      }
    }
    return {
      url: 'https://rwjhpfghhgstvplmggks.supabase.co',
      key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3amhwZmdoaGdzdHZwbG1nZ2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MDgzNDYsImV4cCI6MjA3NDI4NDM0Nn0.RfCRooN6YVTHJ2Mw-xFCWus3wUVMLkJCLSitB8TNiIo',
      tableName: 'meetings',
      usersTableName: 'users',
    };
  });

  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Load meetings from IndexedDB on mount
  useEffect(() => {
    const initData = async () => {
      try {
        const storedMeetings = await getAllMeetingsFromStorage();
        setMeetings(storedMeetings);
      } catch (error) {
        console.error("Failed to load meetings from storage:", error);
        showNotification('error', 'データの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  // Prevent accidental tab close during processing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isProcessing) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isProcessing]);

  // Fetch users
  useEffect(() => {
    const loadUsers = async () => {
      if (supabaseConfig.url && supabaseConfig.key && supabaseConfig.usersTableName) {
        try {
          const fetchedUsers = await fetchUsersFromSupabase(supabaseConfig);
          setUsers(fetchedUsers);
        } catch (error) {
          console.error("Failed to fetch users:", error);
        }
      } else {
        setUsers([]);
      }
    };
    loadUsers();
  }, [supabaseConfig.url, supabaseConfig.key, supabaseConfig.usersTableName]);

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const saveMeeting = async (meeting: Meeting) => {
    try {
      await saveMeetingToStorage(meeting);
      setMeetings(prev => {
        const existingIndex = prev.findIndex(m => m.id === meeting.id);
        if (existingIndex >= 0) {
          const newMeetings = [...prev];
          newMeetings[existingIndex] = meeting;
          return newMeetings;
        }
        return [meeting, ...prev];
      });
    } catch (e) {
      console.error("Storage save error:", e);
      showNotification('error', '保存に失敗しました');
    }
  };

  const handleSaveConfig = (config: SupabaseConfig) => {
    try {
      setSupabaseConfig(config);
      localStorage.setItem('mm_supabase_config', JSON.stringify(config));
      setShowSettings(false);
      showNotification('success', '設定を保存しました');
    } catch (e) {
      showNotification('error', '設定の保存に失敗しました');
    }
  };

  const handleUpdateMeeting = async (updatedMeeting: Meeting) => {
    await saveMeeting(updatedMeeting);
    setActiveMeeting(updatedMeeting);
  };

  // Called immediately after recording stops, before analysis
  const handleIntermediateSave = async (meeting: Meeting) => {
    setIsProcessing(true);
    await saveMeeting(meeting);
  };

  const handleMeetingComplete = async (meeting: Meeting) => {
    setIsProcessing(false);
    await saveMeeting(meeting);
    setActiveMeeting(meeting);
    setCurrentView('detail');
    
    if (supabaseConfig.url && supabaseConfig.key) {
      handleSupabaseSync(meeting);
    }
  };

  const handleMeetingError = async (meeting: Meeting) => {
     setIsProcessing(false);
     await saveMeeting(meeting); // Save the FAILED state so user can retry
     showNotification('error', '分析中にエラーが発生しました。詳細は会議画面で確認できます。');
  };

  const handleReanalyze = async (meeting: Meeting) => {
    if (!meeting.audioData) {
      showNotification('error', '音声データがないため再分析できません');
      return;
    }

    try {
      setIsProcessing(true);
      showNotification('success', '再分析を開始しました...');
      
      const transcript = await transcribeAudio(meeting.audioData, meeting.mimeType || 'audio/webm');
      
      const userNames = users.map(u => u.name);
      const analysis = await analyzeTranscript(transcript, userNames);

      const updatedMeeting: Meeting = {
        ...meeting,
        transcript,
        summary: analysis.summary,
        actionItems: analysis.actionItems,
        title: analysis.title || meeting.title,
        status: MeetingStatus.COMPLETED,
        synced: false
      };

      await saveMeeting(updatedMeeting);
      setActiveMeeting(updatedMeeting);
      showNotification('success', '再分析が完了しました');
    } catch (error) {
      console.error("Re-analysis failed", error);
      showNotification('error', '再分析に失敗しました');
      // If it failed, ensure we keep the status or set to FAILED if it wasn't already
      const failedMeeting = { ...meeting, status: MeetingStatus.FAILED };
      await saveMeeting(failedMeeting);
      setActiveMeeting(failedMeeting);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSupabaseSync = async (meeting: Meeting) => {
    if (!supabaseConfig.url || !supabaseConfig.key) {
      showNotification('error', 'Supabaseの設定が未完了です。設定画面を開きます。');
      setShowSettings(true);
      return;
    }

    try {
      await saveMeetingToSupabase(meeting, supabaseConfig);
      showNotification('success', 'Supabaseへの同期が完了しました');
      
      const updated = { ...meeting, synced: true };
      await saveMeeting(updated);
      if (activeMeeting?.id === meeting.id) {
        setActiveMeeting(updated);
      }
    } catch (error: any) {
      console.error(error);
      showNotification('error', `同期エラー: ${error.message}`);
    }
  };

  const userNamesForGemini = users.map(u => u.name);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-darkbg text-white gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
        <p className="text-darktextsecondary animate-pulse">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="max-w-7xl mx-auto">
        {currentView === 'dashboard' && (
          <Dashboard 
            meetings={meetings} 
            onNewMeeting={() => setCurrentView('record')}
            onSelectMeeting={(m) => {
              setActiveMeeting(m);
              setCurrentView('detail');
            }}
            onShowSettings={() => setShowSettings(true)}
          />
        )}

        {currentView === 'record' && (
          <MeetingRecorder 
            onCancel={() => setCurrentView('dashboard')}
            onIntermediateSave={handleIntermediateSave}
            onComplete={handleMeetingComplete}
            onError={handleMeetingError}
            userNames={userNamesForGemini}
          />
        )}

        {currentView === 'detail' && activeMeeting && (
          <MeetingDetail 
            meeting={activeMeeting}
            onBack={() => setCurrentView('dashboard')}
            onSync={() => handleSupabaseSync(activeMeeting)}
            onReanalyze={handleReanalyze}
            onUpdateMeeting={handleUpdateMeeting}
          />
        )}
      </div>

      {showSettings && (
        <SettingsModal 
          config={supabaseConfig} 
          onClose={() => setShowSettings(false)}
          onSave={handleSaveConfig}
        />
      )}

      {notification && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-xl border flex items-center gap-3 animate-fade-in-up z-50 ${
          notification.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200' 
            : 'bg-red-950/90 border-red-800 text-red-200'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}
    </div>
  );
};

export default App;
