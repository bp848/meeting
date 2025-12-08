import React from 'react';
import { Meeting } from '../types';
import { Plus, Calendar, ArrowRight, Clock, Search, Mic, Settings } from 'lucide-react';

interface DashboardProps {
  meetings: Meeting[];
  onNewMeeting: () => void;
  onSelectMeeting: (meeting: Meeting) => void;
  onShowSettings: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ meetings, onNewMeeting, onSelectMeeting, onShowSettings }) => {
  return (
    <div className="space-y-6 animate-fade-in p-0 bg-darkbg"> {/* Removed padding, bg-darkbg is already body */}
      {/* Top Card Section - Matching the image */}
      <div className="bg-darkcard rounded-xl border border-darkborder p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-darktextsecondary">
            <Mic className="w-5 h-5" />
            <span className="text-sm font-medium">議事録作製アシスタント</span>
          </div>
          <button 
            onClick={onShowSettings}
            className="p-1 text-darktextsecondary hover:text-white hover:bg-highlightbg rounded-full transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">議事録作製アシスタント</h2>
          <button 
            onClick={onNewMeeting}
            className="bg-brand-700 hover:bg-brand-600 text-white px-4 py-2 rounded-lg font-semibold shadow-brand-700/20 transition-all flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            新規会議
          </button>
        </div>
      </div>

      {/* Recent Meetings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">最近の会議</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-darktextsecondary" />
            <input 
              type="text" 
              placeholder="議事録を検索..." 
              className="bg-darkcard border border-darkborder rounded-full pl-10 pr-4 py-2 text-sm text-darktext focus:outline-none focus:border-brand-500 w-64 placeholder-darktextsecondary"
            />
          </div>
        </div>

        {meetings.length === 0 ? (
          <div className="bg-darkcard border border-darkborder rounded-xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-highlightbg rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-darktextsecondary" />
            </div>
            <h4 className="text-xl font-medium text-white mb-2">まだ会議の記録がありません</h4>
            <p className="text-darktextsecondary mb-6">録音を開始して議事録とアクションプランを作成しましょう。</p>
            <button 
              onClick={onNewMeeting}
              className="text-brand-400 hover:text-brand-300 font-medium"
            >
              最初の会議を始める &rarr;
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetings.map((meeting) => (
              <div 
                key={meeting.id}
                onClick={() => onSelectMeeting(meeting)}
                className="bg-darkcard border border-darkborder hover:border-brand-500/50 rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg hover:shadow-brand-900/10 group shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-highlightbg flex items-center justify-center text-darktextsecondary group-hover:text-white transition-colors">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${meeting.synced ? 'bg-emerald-950 text-emerald-400' : 'bg-highlightbg text-darktextsecondary'}`}>
                    {meeting.synced ? '同期済' : '未同期'}
                  </div>
                </div>
                
                <h4 className="text-lg font-semibold text-white mb-2 line-clamp-1 group-hover:text-brand-400 transition-colors">
                  {meeting.title}
                </h4>
                
                <p className="text-darktextsecondary text-sm mb-4 line-clamp-2">
                  {meeting.summary || meeting.transcript.substring(0, 100) + "..."}
                </p>
                
                <div className="flex items-center justify-between text-xs text-darktextsecondary pt-4 border-t border-darkborder">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.floor(meeting.durationSeconds / 60)}分 {meeting.durationSeconds % 60}秒
                  </div>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-brand-500/0 group-hover:text-brand-500">
                    詳細を見る <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};