import React from 'react';
import { DailyNote } from '../types';
import { History, ArrowRightLeft, CheckCircle2, Lock } from 'lucide-react';

interface YesterdayPreviewProps {
  yesterdayNote: DailyNote;
  onUpdateYesterdayNote: (updatedNote: DailyNote) => void;
  onMigrateUnfinishedToToday: () => void;
}

export const YesterdayPreview: React.FC<YesterdayPreviewProps> = ({
  yesterdayNote,
  onUpdateYesterdayNote,
  onMigrateUnfinishedToToday,
}) => {
  const unfinishedLines = yesterdayNote.lines.filter(l => !l.completed);

  const handleToggleLine = (lineId: string) => {
    const updatedLines = yesterdayNote.lines.map(line => {
      if (line.id === lineId) {
        const nextCompleted = !line.completed;
        return {
          ...line,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined
        };
      }
      return line;
    });

    onUpdateYesterdayNote({
      ...yesterdayNote,
      lines: updatedLines
    });
  };

  return (
    <div className="glass-card p-6 rounded-2xl shadow-xl flex flex-col gap-5 border border-indigo-500/20 bg-slate-900/80 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Yesterday's Note
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/10 font-normal">
                <Lock className="w-3 h-3 text-amber-400" /> Immutable
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-medium">{yesterdayNote.formattedDate}</p>
          </div>
        </div>

        {/* Migrate Action Button */}
        {unfinishedLines.length > 0 && (
          <button
            onClick={onMigrateUnfinishedToToday}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow-md shadow-indigo-500/20 transition-all"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Migrate {unfinishedLines.length} Unfinished to Today
          </button>
        )}
      </div>

      {/* Yesterday's Line Items */}
      <div className="flex flex-col gap-2.5">
        {yesterdayNote.lines.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No lines recorded for yesterday.</p>
        ) : (
          yesterdayNote.lines.map((line) => (
            <div
              key={line.id}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                line.completed
                  ? 'bg-slate-950/40 border-slate-800/40 opacity-70'
                  : 'bg-slate-900/90 border-indigo-500/30'
              }`}
            >
              <input
                type="checkbox"
                checked={line.completed}
                onChange={() => handleToggleLine(line.id)}
                className="custom-checkbox mt-0.5"
              />

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${line.completed ? 'completed-line' : 'text-slate-100'}`}>
                  {line.text}
                </p>

                {line.category && (
                  <span className={`badge-tag badge-${line.category} mt-1 inline-block`}>
                    @{line.category}
                  </span>
                )}
              </div>

              {line.completed && (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Done
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
