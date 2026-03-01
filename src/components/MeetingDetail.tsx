import React, { useState } from 'react';
import { Meeting, MeetingStatus } from '../types';
import { ArrowLeft, Calendar, Clock, Share2, CheckCircle, Circle, ListTodo, FileText, BrainCircuit, Cloud, Play, RefreshCw, NotepadText, AlertTriangle, Loader2 } from 'lucide-react';

interface MeetingDetailProps {
  meeting: Meeting;
  onBack: () => void;
  onSync: () => void;
  onReanalyze: (meeting: Meeting) => void;
  onUpdateMeeting: (meeting: Meeting) => void;
}

const PRIORITY_MAP: Record<string, string> = {
  "High": "高",
  "Medium": "中",
  "Low": "低"
};

export const MeetingDetail: React.FC<MeetingDetailProps> = ({ meeting, onBack, onSync, onReanalyze, onUpdateMeeting }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'notes'>('summary');
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [currentNotes, setCurrentNotes] = useState(meeting.notes || '');

  const handleReanalyzeClick = async () => {
    setIsReanalyzing(true);
    await onReanalyze(meeting);
    setIsReanalyzing(false);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentNotes(e.target.value);
    onUpdateMeeting({ ...meeting, notes: e.target.value });
  };

  const isProcessing = meeting.status === MeetingStatus.PROCESSING;
  const isFailed = meeting.status === MeetingStatus.FAILED;

  return (
    <div className="space-y-6 animate-fade-in p-0 bg-darkbg">
      {/* Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-darkborder pb-6">
        <div className="space-y-2">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-darktextsecondary hover:text-brand-400 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            ダッシュボードに戻る
          </button>
          
          <div className="flex items-center gap-3">
             <h1 className="text-3xl font-bold text-white">{meeting.title}</h1>
             {isFailed && (
               <span className="bg-red-950/50 text-red-400 text-xs px-2 py-1 rounded border border-red-900">分析失敗</span>
             )}
             {isProcessing && (
               <span className="bg-brand-900/50 text-brand-400 text-xs px-2 py-1 rounded border border-brand-900 flex items-center gap-1">
                 <Loader2 className="w-3 h-3 animate-spin" /> 処理中
               </span>
             )}
          </div>

          <div className="flex items-center gap-4 text-darktextsecondary text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(meeting.date).toLocaleDateString('ja-JP')}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {Math.floor(meeting.durationSeconds / 60)}分 {meeting.durationSeconds % 60}秒
            </div>
             <div className={`flex items-center gap-1 ${meeting.synced ? 'text-emerald-400' : 'text-darktextsecondary'}`}>
              <Cloud className="w-4 h-4" />
              {meeting.synced ? '同期済み' : 'ローカルのみ'}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
            {isFailed && (
              <button 
                onClick={handleReanalyzeClick}
                disabled={isReanalyzing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-brand-700 hover:bg-brand-600 text-white shadow-lg transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${isReanalyzing ? 'animate-spin' : ''}`} />
                {isReanalyzing ? '分析中...' : '再分析する'}
              </button>
            )}

            {!isFailed && !isProcessing && (
              <button 
                onClick={onSync}
                disabled={meeting.synced}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  meeting.synced 
                    ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900 cursor-default'
                    : 'bg-brand-700 hover:bg-brand-600 text-white shadow-lg shadow-brand-700/20'
                }`}
              >
                {meeting.synced ? <CheckCircle className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {meeting.synced ? 'Supabaseに保存済み' : 'Supabaseに保存'}
              </button>
            )}
        </div>
      </div>

      {isFailed && (
        <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
          <div>
            <h3 className="text-red-200 font-semibold text-sm">AI分析に失敗しました</h3>
            <p className="text-red-300/70 text-sm mt-1">
              録音データは保存されています。「再分析する」ボタンを押して、もう一度AIによる議事録作成を試みてください。
            </p>
          </div>
        </div>
      )}

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Summary & Transcript */}
        <div className="lg:col-span-2 space-y-6">

           {/* Audio Player Section */}
           {meeting.audioData && (
            <div className="bg-darkcard rounded-xl border border-darkborder p-4 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-brand-900/50 flex items-center justify-center text-brand-400 flex-shrink-0">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-slate-300 mb-1">音声録音</h3>
                <audio 
                  controls 
                  src={`data:${meeting.mimeType};base64,${meeting.audioData}`}
                  className="w-full h-8" 
                />
              </div>
              {!isFailed && !isProcessing && (
                <button
                  onClick={handleReanalyzeClick}
                  disabled={isReanalyzing}
                  className={`p-2 rounded-lg border border-darkborder hover:bg-highlightbg transition-colors flex-shrink-0 ${isReanalyzing ? 'animate-spin text-brand-500' : 'text-darktextsecondary'}`}
                  title="再分析する"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
          
          <div className="bg-darkcard rounded-xl border border-darkborder overflow-hidden shadow-sm">
            <div className="flex border-b border-darkborder">
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'summary' 
                    ? 'bg-highlightbg text-brand-400 border-b-2 border-brand-500' 
                    : 'text-darktextsecondary hover:text-white'
                }`}
              >
                <BrainCircuit className="w-4 h-4" />
                AI要約
              </button>
              <button
                onClick={() => setActiveTab('transcript')}
                className={`flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'transcript' 
                    ? 'bg-highlightbg text-brand-400 border-b-2 border-brand-500' 
                    : 'text-darktextsecondary hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                文字起こし原文
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 px-6 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'notes' 
                    ? 'bg-highlightbg text-brand-400 border-b-2 border-brand-500' 
                    : 'text-darktextsecondary hover:text-white'
                }`}
              >
                <NotepadText className="w-4 h-4" />
                個人的なメモ
              </button>
            </div>

            <div className="p-6 min-h-[400px] text-slate-300 leading-relaxed">
              {activeTab === 'summary' ? (
                <div className="prose prose-invert prose-sm max-w-none">
                   {meeting.summary ? meeting.summary.split('\n').map((line, i) => {
                     if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-white mb-4">{line.slice(2)}</h1>;
                     if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-semibold text-white mt-6 mb-3">{line.slice(3)}</h2>;
                     if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold text-white mt-4 mb-2">{line.slice(4)}</h3>;
                     if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-darktext mb-1">{line.slice(2)}</li>;
                     if (line.trim() === '') return <br key={i}/>;
                     return <p key={i} className="mb-2">{line}</p>;
                   }) : (
                     <p className="text-darktextsecondary italic">
                       {isProcessing ? 'AIが要約を作成中です...' : '要約はありません。'}
                     </p>
                   )}
                </div>
              ) : activeTab === 'transcript' ? (
                <p className="whitespace-pre-wrap text-darktextsecondary font-mono text-sm">
                  {meeting.transcript || (isProcessing ? '文字起こし中...' : '文字起こしデータはありません。')}
                </p>
              ) : ( // Notes tab
                <textarea
                  value={currentNotes}
                  onChange={handleNotesChange}
                  className="w-full h-full min-h-[400px] bg-darkbg border border-darkborder rounded-lg p-4 text-darktext focus:outline-none focus:border-brand-500 resize-none"
                  placeholder="ここに個人的なメモを入力してください..."
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Action Items */}
        <div className="space-y-4">
          <div className="bg-darkcard rounded-xl border border-darkborder p-6 h-full shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-brand-400">
              <ListTodo className="w-5 h-5" />
              <h2 className="font-semibold">アクションプラン</h2>
            </div>

            <div className="space-y-4">
              {(!meeting.actionItems || meeting.actionItems.length === 0) ? (
                <p className="text-darktextsecondary italic text-sm">
                  {isProcessing ? '分析中...' : 'アクションアイテムは見つかりませんでした。'}
                </p>
              ) : (
                meeting.actionItems.map((item, idx) => (
                  <div key={idx} className="bg-highlightbg border border-darkborder p-4 rounded-lg hover:border-brand-500/30 transition-colors group">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <Circle className="w-4 h-4 text-darktextsecondary group-hover:text-brand-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium mb-2">{item.task}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-darktextsecondary bg-darkcard px-2 py-1 rounded">
                            {item.owner}
                          </span>
                          <span className={`px-2 py-1 rounded font-medium ${
                            item.priority === 'High' ? 'bg-red-950 text-red-400' :
                            item.priority === 'Medium' ? 'bg-yellow-950 text-yellow-400' :
                            'bg-blue-950 text-blue-400'
                          }`}>
                            {PRIORITY_MAP[item.priority] || item.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
