import React, { useState, useEffect } from 'react';
import { X, Save, Database, AlertTriangle, Cloud, Users } from 'lucide-react';
import { SupabaseConfig } from '../types';

interface SettingsModalProps {
  config: SupabaseConfig;
  onClose: () => void;
  onSave: (config: SupabaseConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ config, onClose, onSave }) => {
  const [tempConfig, setTempConfig] = useState<SupabaseConfig>(config);

  useEffect(() => {
    setTempConfig(config);
  }, [config]);

  const handleSave = () => {
    onSave({
      url: tempConfig.url.trim(),
      key: tempConfig.key.trim(),
      tableName: tempConfig.tableName.trim(),
      usersTableName: tempConfig.usersTableName?.trim() || '',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-darkcard border border-darkborder rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-6 border-b border-darkborder flex-shrink-0">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-brand-500" />
            クラウド連携設定
          </h3>
          <button onClick={onClose} className="text-darktextsecondary hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="bg-brand-900/20 border border-brand-900/50 p-4 rounded-lg space-y-3">
             <div className="flex items-start gap-3">
               <Cloud className="w-5 h-5 text-brand-400 mt-1 flex-shrink-0" />
               <div>
                 <h4 className="text-sm font-semibold text-brand-200">Supabase連携とは？</h4>
                 <p className="text-xs text-brand-300/80 mt-1 leading-relaxed">
                   議事録データをクラウド（Supabase）に安全に保存するための設定です。
                   これにより、<strong>PCを変えてもデータが消えず、チームメンバーと議事録を共有</strong>できるようになります。
                 </p>
               </div>
             </div>
             
             <div className="flex items-start gap-3 pt-2 border-t border-brand-900/30">
               <Users className="w-5 h-5 text-brand-400 mt-1 flex-shrink-0" />
               <div>
                 <h4 className="text-sm font-semibold text-brand-200">AI担当者予測</h4>
                 <p className="text-xs text-brand-300/80 mt-1 leading-relaxed">
                   「ユーザーテーブル」を設定すると、AIがあなたのチームメンバーを認識し、
                   アクションプランの担当者を<strong>「佐藤さん」「鈴木さん」のように自動で割り当て</strong>ます。
                 </p>
               </div>
             </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">プロジェクト URL</label>
              <input 
                type="text" 
                value={tempConfig.url}
                onChange={(e) => setTempConfig({...tempConfig, url: e.target.value})}
                placeholder="https://xyz.supabase.co"
                className="w-full bg-darkbg border border-darkborder rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500 placeholder-darktextsecondary text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">API Key (Anon Public)</label>
              <input 
                type="password" 
                value={tempConfig.key}
                onChange={(e) => setTempConfig({...tempConfig, key: e.target.value})}
                placeholder="eyJ..."
                className="w-full bg-darkbg border border-darkborder rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500 placeholder-darktextsecondary text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">議事録テーブル名</label>
                <input 
                  type="text" 
                  value={tempConfig.tableName}
                  onChange={(e) => setTempConfig({...tempConfig, tableName: e.target.value})}
                  placeholder="meetings"
                  className="w-full bg-darkbg border border-darkborder rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500 placeholder-darktextsecondary text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">ユーザーテーブル名</label>
                <input 
                  type="text" 
                  value={tempConfig.usersTableName || ''}
                  onChange={(e) => setTempConfig({...tempConfig, usersTableName: e.target.value})}
                  placeholder="users (任意)"
                  className="w-full bg-darkbg border border-darkborder rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500 placeholder-darktextsecondary text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-darkborder flex justify-end gap-3 flex-shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-darktextsecondary hover:text-white transition-colors font-medium text-sm"
          >
            キャンセル
          </button>
          <button 
            onClick={handleSave}
            className="bg-brand-700 hover:bg-brand-600 text-white px-6 py-2 rounded-lg font-semibold shadow-lg shadow-brand-700/20 transition-all flex items-center gap-2 text-sm"
          >
            <Save className="w-4 h-4" />
            設定を保存
          </button>
        </div>

      </div>
    </div>
  );
};
