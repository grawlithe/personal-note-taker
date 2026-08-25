import React, { useState } from 'react';
import { SyncConfig } from '../types';
import { Cloud, RefreshCw, Key, Link2, X, CheckCircle, ShieldCheck, Database } from 'lucide-react';
import { pushLocalToSupabase, pullFromSupabase, saveSyncConfig } from '../services/supabase';

interface SyncSettingsModalProps {
  syncConfig: SyncConfig;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const SyncSettingsModal: React.FC<SyncSettingsModalProps> = ({
  syncConfig,
  onClose,
  onConfigUpdated,
}) => {
  const [url, setUrl] = useState(syncConfig.supabaseUrl);
  const [key, setKey] = useState(syncConfig.supabaseAnonKey);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SyncConfig = {
      ...syncConfig,
      supabaseUrl: url.trim(),
      supabaseAnonKey: key.trim(),
      isLoggedIn: Boolean(url.trim() && key.trim())
    };

    saveSyncConfig(updated);
    setStatusMsg({ type: 'success', text: 'Supabase credentials saved successfully!' });
    onConfigUpdated();
  };

  const handlePush = async () => {
    setLoading(true);
    setStatusMsg({ type: 'info', text: 'Pushing local notes to cloud...' });
    const res = await pushLocalToSupabase();
    setLoading(false);
    if (res.success) {
      setStatusMsg({ type: 'success', text: res.message });
      onConfigUpdated();
    } else {
      setStatusMsg({ type: 'error', text: res.message });
    }
  };

  const handlePull = async () => {
    setLoading(true);
    setStatusMsg({ type: 'info', text: 'Fetching notes from cloud...' });
    const res = await pullFromSupabase();
    setLoading(false);
    if (res.success) {
      setStatusMsg({ type: 'success', text: res.message });
      onConfigUpdated();
    } else {
      setStatusMsg({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-lg p-6 rounded-2xl border border-white/10 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Cross-Platform Cloud Sync</h3>
            <p className="text-xs text-slate-400">Sync daily notes across Desktop & Mobile using Supabase</p>
          </div>
        </div>

        {statusMsg && (
          <div className={`p-3 rounded-xl mb-4 text-xs font-medium border flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : statusMsg.type === 'error'
              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
          }`}>
            <CheckCircle className="w-4 h-4" />
            {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleSaveConfig} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5 text-indigo-400" /> Supabase Project URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full bg-slate-900/90 text-white text-sm px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-indigo-400" /> Supabase Anon API Key
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full bg-slate-900/90 text-white text-sm px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 font-mono text-xs"
            />
          </div>

          <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 text-xs text-slate-400 leading-relaxed">
            <p className="font-medium text-slate-300 mb-1 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Supabase Table & RLS Setup:
            </p>
            Run this in your Supabase SQL editor to enable read/write access:<br />
            <code className="block bg-slate-950 p-2 rounded border border-white/10 text-[10px] font-mono text-emerald-300 mt-1 select-all">
              create table if not exists daily_notes (id text primary key, date text, formatted_date text, title text, note_category text, lines jsonb, updated_at timestamp);<br />
              alter table daily_notes disable row level security;
            </code>
          </div>

          <div className="flex items-center justify-between gap-3 mt-2 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePush}
                disabled={loading || !url || !key}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium border border-white/10 disabled:opacity-50 flex items-center gap-1"
              >
                <Database className="w-3.5 h-3.5 text-indigo-400" /> Push Local to Cloud
              </button>
              <button
                type="button"
                onClick={handlePull}
                disabled={loading || !url || !key}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium border border-white/10 disabled:opacity-50 flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} /> Pull Cloud
              </button>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/25"
            >
              Save Credentials
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
