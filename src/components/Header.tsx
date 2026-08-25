import React from 'react';
import { Calendar, Cloud, CloudOff, RefreshCw, Settings, Bell, Tag, Sparkles } from 'lucide-react';
import { ViewMode, SyncConfig } from '../types';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedDate: string;
  syncConfig: SyncConfig;
  onOpenSyncSettings: () => void;
  onOpenReminderModal: () => void;
  onSyncNow: () => void;
  isSyncing: boolean;
  activeCategoryFilter: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  selectedDate,
  syncConfig,
  onOpenSyncSettings,
  onOpenReminderModal,
  onSyncNow,
  isSyncing,
  activeCategoryFilter,
}) => {
  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-[var(--border-glass)] px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand logo & status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              ZenNotes
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Daily Engine
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Cross-Platform Sync & Reminders</p>
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <nav className="hidden md:flex items-center bg-slate-900/60 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setViewMode('today')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'today'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Today's Note
          </button>
          <button
            onClick={() => setViewMode('yesterday')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'yesterday'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            Yesterday's Preview
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'calendar'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Calendar
          </button>
          <button
            onClick={() => setViewMode('category')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'category'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Categories {activeCategoryFilter ? `(${activeCategoryFilter})` : ''}
          </button>
          <button
            onClick={() => setViewMode('reminders')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'reminders'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Reminders
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Sync Status Badge */}
          <button
            onClick={onSyncNow}
            disabled={isSyncing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              syncConfig.supabaseUrl && syncConfig.supabaseAnonKey
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title={syncConfig.lastSyncedAt ? `Last synced: ${syncConfig.lastSyncedAt}` : 'Click to sync'}
          >
            {syncConfig.supabaseUrl ? (
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <CloudOff className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="hidden sm:inline">
              {syncConfig.supabaseUrl ? (syncConfig.lastSyncedAt ? `Synced ${syncConfig.lastSyncedAt}` : 'Cloud Ready') : 'Local Offline'}
            </span>
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {/* Quick Reminder button */}
          <button
            onClick={onOpenReminderModal}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300 hover:text-white transition-all"
            title="Set Reminder"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSyncSettings}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300 hover:text-white transition-all"
            title="Sync & Cloud Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="flex md:hidden items-center justify-around mt-2 pt-2 border-t border-white/5">
        <button
          onClick={() => setViewMode('today')}
          className={`text-xs py-1 px-2.5 rounded-md font-medium ${
            viewMode === 'today' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setViewMode('yesterday')}
          className={`text-xs py-1 px-2.5 rounded-md font-medium ${
            viewMode === 'yesterday' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Yesterday
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={`text-xs py-1 px-2.5 rounded-md font-medium ${
            viewMode === 'calendar' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Calendar
        </button>
        <button
          onClick={() => setViewMode('category')}
          className={`text-xs py-1 px-2.5 rounded-md font-medium ${
            viewMode === 'category' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setViewMode('reminders')}
          className={`text-xs py-1 px-2.5 rounded-md font-medium ${
            viewMode === 'reminders' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Reminders
        </button>
      </div>
    </header>
  );
};
