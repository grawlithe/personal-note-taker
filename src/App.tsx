import React, { useState, useEffect, useRef } from 'react';
import { DailyNote, LineItem, ViewMode, SyncConfig, Reminder } from './types';
import {
  getTodayDateId,
  getYesterdayDateId,
  getDailyNote,
  saveDailyNote,
  getAllDailyNotes,
  carryOverUnfinishedItems,
  saveAllDailyNotes
} from './services/storage';
import { getSyncConfig, subscribeToRealtimeSync, pushLocalToSupabase } from './services/supabase';
import { startReminderChecker } from './services/notifications';

import { Header } from './components/Header';
import { DailyNoteEditor } from './components/DailyNoteEditor';
import { YesterdayPreview } from './components/YesterdayPreview';
import { CategoryFilter } from './components/CategoryFilter';
import { CalendarView } from './components/CalendarView';
import { ReminderModal } from './components/ReminderModal';
import { SyncSettingsModal } from './components/SyncSettingsModal';

import { Sparkles, Calendar as CalendarIcon, Bell, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const TABS: ViewMode[] = ['today', 'yesterday', 'calendar', 'category', 'reminders'];

export const App: React.FC = () => {
  const todayId = getTodayDateId();
  const yesterdayId = getYesterdayDateId();

  const [selectedDate, setSelectedDate] = useState<string>(todayId);
  const [allNotes, setAllNotes] = useState<Record<string, DailyNote>>(() => getAllDailyNotes());
  const [currentNote, setCurrentNote] = useState<DailyNote>(() => getDailyNote(todayId));
  const [yesterdayNote, setYesterdayNote] = useState<DailyNote>(() => getDailyNote(yesterdayId));

  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  const [syncConfig, setSyncConfig] = useState<SyncConfig>(() => getSyncConfig());
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [targetLineForReminder, setTargetLineForReminder] = useState<LineItem | null>(null);

  // Touch Swipe Gesture State
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Reload state from storage
  const reloadData = (dateToLoad = selectedDate) => {
    const freshAll = getAllDailyNotes();
    setAllNotes(freshAll);
    setCurrentNote(getDailyNote(dateToLoad));
    setYesterdayNote(getDailyNote(yesterdayId));
  };

  useEffect(() => {
    // Start background reminder checker
    const stopReminderChecker = startReminderChecker(() => {
      reloadData();
    });

    // Subscribe to realtime cloud updates if configured
    const unsubscribeSync = subscribeToRealtimeSync(() => {
      reloadData();
    });

    // Listen to local update events
    const handleLocalUpdate = () => reloadData();
    window.addEventListener('zen_notes_updated', handleLocalUpdate);

    return () => {
      stopReminderChecker();
      unsubscribeSync();
      window.removeEventListener('zen_notes_updated', handleLocalUpdate);
    };
  }, [selectedDate]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    // Don't intercept swipe when user is typing in inputs or textareas
    if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName)) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // Minimum swipe threshold & horizontal dominance check
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      const currentIndex = TABS.indexOf(viewMode);

      if (deltaX < -60) {
        // Swipe Left -> Next Tab
        if (currentIndex < TABS.length - 1) {
          setViewMode(TABS[currentIndex + 1]);
        }
      } else if (deltaX > 60) {
        // Swipe Right -> Previous Tab
        if (currentIndex > 0) {
          setViewMode(TABS[currentIndex - 1]);
        }
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleUpdateCurrentNote = (updated: DailyNote) => {
    setCurrentNote(updated);
    saveDailyNote(updated);
    const updatedAll = { ...allNotes, [updated.id]: updated };
    setAllNotes(updatedAll);

    if (syncConfig.autoSync && syncConfig.supabaseUrl) {
      pushLocalToSupabase();
    }
  };

  const handleUpdateYesterdayNote = (updated: DailyNote) => {
    setYesterdayNote(updated);
    saveDailyNote(updated);
    const updatedAll = { ...allNotes, [updated.id]: updated };
    setAllNotes(updatedAll);

    if (syncConfig.autoSync && syncConfig.supabaseUrl) {
      pushLocalToSupabase();
    }
  };

  const handleSelectCalendarDate = (dateId: string) => {
    setSelectedDate(dateId);
    setCurrentNote(getDailyNote(dateId));
    setViewMode('today');
  };

  const handleMigrateUnfinished = () => {
    const count = carryOverUnfinishedItems(yesterdayId, todayId);
    if (count > 0) {
      reloadData();
      alert(`Successfully migrated ${count} unfinished item(s) to Today's note!`);
    } else {
      alert('No unfinished items found to migrate.');
    }
  };

  const handleSetLineReminder = (line: LineItem) => {
    setTargetLineForReminder(line);
    setIsReminderModalOpen(true);
  };

  const handleSaveReminder = (reminder: Reminder) => {
    if (targetLineForReminder) {
      // Line-level reminder
      const updatedLines = currentNote.lines.map(line => {
        if (line.id === targetLineForReminder.id) {
          return { ...line, reminder };
        }
        return line;
      });

      handleUpdateCurrentNote({
        ...currentNote,
        lines: updatedLines
      });
    } else {
      // Add as new line item with reminder
      const newLine: LineItem = {
        id: `line-${Date.now()}`,
        text: reminder.title,
        completed: false,
        tags: ['reminder'],
        reminder,
        createdAt: new Date().toISOString()
      };

      handleUpdateCurrentNote({
        ...currentNote,
        lines: [...currentNote.lines, newLine]
      });
    }
    setTargetLineForReminder(null);
  };

  const handleToggleLineFromFilter = (noteId: string, lineId: string) => {
    const note = allNotes[noteId];
    if (!note) return;

    const updatedLines = note.lines.map(l => {
      if (l.id === lineId) {
        return { ...l, completed: !l.completed };
      }
      return l;
    });

    const updatedNote = { ...note, lines: updatedLines };
    saveDailyNote(updatedNote);
    reloadData();
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    await pushLocalToSupabase();
    setIsSyncing(false);
    setSyncConfig(getSyncConfig());
  };

  // Collect all reminders across all notes for the Reminders View
  const allReminders: { note: DailyNote; line: LineItem }[] = [];
  Object.values(allNotes).forEach(n => {
    n.lines.forEach(l => {
      if (l.reminder) {
        allReminders.push({ note: n, line: l });
      }
    });
  });

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen flex flex-col bg-[var(--bg-dark)] text-slate-100 safe-bottom-padding select-none"
    >
      {/* Header Bar */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedDate={selectedDate}
        syncConfig={syncConfig}
        onOpenSyncSettings={() => setIsSyncModalOpen(true)}
        onOpenReminderModal={() => {
          setTargetLineForReminder(null);
          setIsReminderModalOpen(true);
        }}
        onSyncNow={handleSyncNow}
        isSyncing={isSyncing}
        activeCategoryFilter={selectedCategoryFilter}
      />

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto w-full px-4 pt-6 flex-1">
        {/* Render View Modes */}
        {viewMode === 'today' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Daily Note Editor (8 Cols on Desktop) */}
            <div className="lg:col-span-8">
              <DailyNoteEditor
                note={currentNote}
                onUpdateNote={handleUpdateCurrentNote}
                onSetLineReminder={handleSetLineReminder}
              />
            </div>

            {/* Side Preview of Yesterday's Note (4 Cols on Desktop) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <YesterdayPreview
                yesterdayNote={yesterdayNote}
                onUpdateYesterdayNote={handleUpdateYesterdayNote}
                onMigrateUnfinishedToToday={handleMigrateUnfinished}
              />

              {/* Quick Info Card */}
              <div className="glass-card p-5 rounded-2xl border border-white/5 bg-slate-900/60 text-xs text-slate-400 leading-relaxed flex flex-col gap-2">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                  <Sparkles className="w-4 h-4" /> Pro Tip: Touch Gestures & Tags
                </div>
                <p>
                  Swipe Left or Right on your mobile screen to switch tabs! Type <code className="text-emerald-300 font-mono">@work</code> or <code className="text-amber-300 font-mono">#urgent</code> anywhere in a line to assign categories!
                </p>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'yesterday' && (
          <div className="max-w-4xl mx-auto">
            <YesterdayPreview
              yesterdayNote={yesterdayNote}
              onUpdateYesterdayNote={handleUpdateYesterdayNote}
              onMigrateUnfinishedToToday={handleMigrateUnfinished}
            />
          </div>
        )}

        {viewMode === 'calendar' && (
          <CalendarView
            allNotes={allNotes}
            selectedDate={selectedDate}
            onSelectDate={handleSelectCalendarDate}
            onToggleLine={handleToggleLineFromFilter}
          />
        )}

        {viewMode === 'category' && (
          <div className="max-w-5xl mx-auto">
            <CategoryFilter
              allNotes={allNotes}
              selectedCategory={selectedCategoryFilter}
              onSelectCategory={setSelectedCategoryFilter}
              onToggleLine={handleToggleLineFromFilter}
            />
          </div>
        )}

        {viewMode === 'reminders' && (
          <div className="max-w-4xl mx-auto glass-card p-6 rounded-2xl border border-white/10 flex flex-col gap-5 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">Scheduled Task Reminders</h2>
              </div>
              <button
                onClick={() => {
                  setTargetLineForReminder(null);
                  setIsReminderModalOpen(true);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md"
              >
                + New Reminder
              </button>
            </div>

            {allReminders.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-medium">No scheduled reminders found.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {allReminders.map(({ note, line }) => (
                  <div key={line.id} className="p-4 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-white">{line.text}</span>
                      <span className="text-xs text-slate-400 flex items-center gap-2">
                        <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" /> {note.formattedDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${
                        line.reminder?.triggered
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      }`}>
                        ⏰ {line.reminder?.dateTime}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Sync Settings Modal */}
      {isSyncModalOpen && (
        <SyncSettingsModal
          syncConfig={syncConfig}
          onClose={() => setIsSyncModalOpen(false)}
          onConfigUpdated={() => {
            setSyncConfig(getSyncConfig());
            reloadData();
          }}
        />
      )}

      {/* Reminder Modal */}
      {isReminderModalOpen && (
        <ReminderModal
          lineItem={targetLineForReminder}
          onClose={() => {
            setIsReminderModalOpen(false);
            setTargetLineForReminder(null);
          }}
          onSaveReminder={handleSaveReminder}
        />
      )}
    </div>
  );
};
