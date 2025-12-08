import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, AlertCircle, MicOff } from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';
import { transcribeAudio, analyzeTranscript } from '../services/geminiService';
import { Meeting, MeetingStatus } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

interface MeetingRecorderProps {
  onCancel: () => void;
  onIntermediateSave: (meeting: Meeting) => Promise<void>;
  onComplete: (meeting: Meeting) => void;
  onError: (meeting: Meeting) => void;
  userNames?: string[];
}

export const MeetingRecorder: React.FC<MeetingRecorderProps> = ({ 
  onCancel, 
  onIntermediateSave, 
  onComplete, 
  onError,
  userNames 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>();

  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then((status) => {
          setPermissionState(status.state);
          status.onchange = () => {
            setPermissionState(status.state);
            if (status.state === 'granted') setError(null);
            else if (status.state === 'denied') setError("マイクへのアクセスがブロックされています。");
          };
        })
        .catch(() => {});
    }
  }, []);

  const startRecording = async () => {
    setError(null);
    if (permissionState === 'denied') {
      setError("マイクの使用がブロックされています。");
      return;
    }

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(audioStream);
      setPermissionState('granted');
      
      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setElapsedTime(0);
      
      timerRef.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setError("マイクの起動に失敗しました。接続を確認してください。");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = async () => {
        stream?.getTracks().forEach(track => track.stop());
        setStream(null);
        setIsRecording(false);
        clearInterval(timerRef.current);
        
        await processRecording();
      };
    }
  };

  const processRecording = async () => {
    let tempMeeting: Meeting | null = null;

    try {
      setProcessingStep("データを保存中...");
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      
      // Convert Blob to Base64
      const base64String = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const res = reader.result as string;
          resolve(res.split(',')[1]);
        };
      });
      
      const mimeType = 'audio/webm'; // Or detect from blob

      // 1. SAFETY SAVE: Save audio immediately before analysis
      tempMeeting = {
        id: generateId(),
        title: `${new Date().toLocaleDateString('ja-JP')} の会議 (分析中...)`,
        date: new Date().toISOString(),
        durationSeconds: elapsedTime,
        transcript: "",
        summary: "",
        actionItems: [],
        status: MeetingStatus.PROCESSING,
        synced: false,
        audioData: base64String,
        mimeType: mimeType
      };

      await onIntermediateSave(tempMeeting);

      // 2. Transcribe
      setProcessingStep("音声を文字起こし中...");
      const transcript = await transcribeAudio(base64String, mimeType);
      
      // 3. Analyze
      setProcessingStep("会話を分析中 (思考中)...");
      const analysis = await analyzeTranscript(transcript, userNames);

      const completedMeeting: Meeting = {
        ...tempMeeting,
        title: analysis.title || tempMeeting.title,
        transcript: transcript,
        summary: analysis.summary,
        actionItems: analysis.actionItems,
        status: MeetingStatus.COMPLETED
      };

      onComplete(completedMeeting);
      
    } catch (err) {
      console.error(err);
      setError("処理中にエラーが発生しました。");
      setProcessingStep(null);
      
      // Update the meeting to FAILED status so user can find it
      if (tempMeeting) {
        onError({
          ...tempMeeting,
          title: "会議 (分析失敗)",
          status: MeetingStatus.FAILED
        });
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.12))] space-y-8 animate-fade-in bg-darkbg text-darktext p-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-white">
          {isRecording ? '聞き取り中...' : processingStep ? '処理中...' : '会議を開始'}
        </h2>
        <p className="text-darktextsecondary">
          {isRecording 
            ? 'Geminiが会議の内容を分析します' 
            : processingStep 
              ? processingStep
              : '会議を録音して議事録とアクションプランを作成します'}
        </p>
      </div>

      <div className="w-full max-w-md h-32 bg-darkcard rounded-xl border border-darkborder flex items-center justify-center overflow-hidden relative shadow-inner">
        {isRecording ? (
          <AudioVisualizer stream={stream} isRecording={isRecording} />
        ) : processingStep ? (
           <div className="flex flex-col items-center gap-3">
             <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
             <span className="text-xs text-brand-400 font-mono uppercase tracking-widest animate-pulse">AI処理中</span>
           </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 text-red-400">
            <MicOff className="w-6 h-6" />
            <span className="text-xs font-medium">マイクエラー</span>
          </div>
        ) : (
          <div className="text-darktextsecondary flex items-center gap-2">
            <Mic className="w-6 h-6" />
            <span>録音準備完了</span>
          </div>
        )}
      </div>

      {(isRecording || elapsedTime > 0) && !processingStep && (
        <div className="text-5xl font-mono font-light text-white tracking-wider">
          {formatTime(elapsedTime)}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-950/50 px-4 py-2 rounded-lg border border-red-900 max-w-md text-left">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="flex gap-6">
        {!isRecording && !processingStep && (
          <>
            <button 
              onClick={onCancel}
              className="px-6 py-3 rounded-full text-darktextsecondary hover:text-white hover:bg-highlightbg transition-all"
            >
              キャンセル
            </button>
            <button 
              onClick={startRecording}
              className="group relative px-8 py-3 bg-brand-700 hover:bg-brand-600 text-white rounded-full font-semibold shadow-lg shadow-brand-700/30 transition-all hover:scale-105 flex items-center gap-2"
            >
              <Mic className="w-5 h-5" />
              録音開始
            </button>
          </>
        )}

        {isRecording && (
          <button 
            onClick={stopRecording}
            className="px-8 py-3 bg-red-500 hover:bg-red-400 text-white rounded-full font-semibold shadow-lg shadow-red-500/30 transition-all hover:scale-105 flex items-center gap-2"
          >
            <Square className="w-5 h-5 fill-current" />
            会議終了
          </button>
        )}
      </div>
      
      {processingStep && (
        <div className="flex items-center gap-2 text-amber-400 bg-amber-950/30 px-4 py-2 rounded text-sm border border-amber-900/50 animate-pulse">
          <AlertCircle className="w-4 h-4" />
          処理中はタブを閉じないでください
        </div>
      )}
    </div>
  );
};
