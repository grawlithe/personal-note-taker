import React, { useState } from 'react';
import { DailyNote, LineItem } from '../types';
import { parseLineCategories, DEFAULT_CATEGORIES, isNoteEditable, getTodayDateId } from '../services/storage';
import { Plus, Trash2, Bell, Tag, CheckCircle2, Clock, Calendar as CalendarIcon, Sparkles, Lock, Pencil, Check, X } from 'lucide-react';

interface DailyNoteEditorProps {
  note: DailyNote;
  onUpdateNote: (updatedNote: DailyNote) => void;
  onSetLineReminder: (line: LineItem) => void;
}

export const DailyNoteEditor: React.FC<DailyNoteEditorProps> = ({
  note,
  onUpdateNote,
  onSetLineReminder,
}) => {
  const [newLineText, setNewLineText] = useState('');
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const todayId = getTodayDateId();
  const isEditable = isNoteEditable(note.date);
  const isFutureNote = note.date > todayId;
  const isToday = note.date === todayId;

  const completedCount = note.lines.filter(l => l.completed).length;
  const totalCount = note.lines.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggleLine = (lineId: string) => {
    const updatedLines = note.lines.map(line => {
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

    onUpdateNote({
      ...note,
      lines: updatedLines
    });
  };

  const handleAddLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLineText.trim() || !isEditable) return;

    const parsed = parseLineCategories(newLineText);
    const newLine: LineItem = {
      id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      text: newLineText.trim(),
      completed: false,
      category: parsed.category || note.noteCategory || undefined,
      tags: parsed.tags,
      createdAt: new Date().toISOString()
    };

    onUpdateNote({
      ...note,
      lines: [...note.lines, newLine]
    });

    setNewLineText('');
  };

  const handleStartEditLine = (line: LineItem) => {
    if (!isEditable) return;
    setEditingLineId(line.id);
    setEditingText(line.text);
  };

  const handleSaveEditLine = (lineId: string) => {
    if (!editingText.trim() || !isEditable) return;

    const parsed = parseLineCategories(editingText);
    const updatedLines = note.lines.map(line => {
      if (line.id === lineId) {
        return {
          ...line,
          text: editingText.trim(),
          category: parsed.category || line.category,
          tags: parsed.tags
        };
      }
      return line;
    });

    onUpdateNote({
      ...note,
      lines: updatedLines
    });

    setEditingLineId(null);
    setEditingText('');
  };

  const handleCancelEdit = () => {
    setEditingLineId(null);
    setEditingText('');
  };

  const handleDeleteLine = (lineId: string) => {
    if (!isEditable) return;
    onUpdateNote({
      ...note,
      lines: note.lines.filter(l => l.id !== lineId)
    });
  };

  const handleNoteCategoryChange = (catId: string) => {
    if (!isEditable) return;
    onUpdateNote({
      ...note,
      noteCategory: catId || undefined
    });
  };

  return (
    <div className="glass-card p-6 rounded-2xl shadow-xl flex flex-col gap-6 border border-white/10 animate-fade-in">
      {/* Immutability Banner for Past Notes */}
      {!isEditable && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl flex items-center justify-between text-xs text-amber-300">
          <span className="flex items-center gap-2 font-medium">
            <Lock className="w-4 h-4 text-amber-400" />
            Immutable Past Record — Notes from yesterday and earlier are locked against structural edits.
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[10px] font-bold uppercase tracking-wider text-amber-200">
            Read Only
          </span>
        </div>
      )}

      {/* Future Note Planner Banner */}
      {isFutureNote && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 p-3.5 rounded-xl flex items-center justify-between text-xs text-indigo-300">
          <span className="flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Future Planner — You are scheduling tasks and notes for an upcoming date ({note.formattedDate}).
          </span>
          <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-[10px] font-bold uppercase tracking-wider text-indigo-200">
            Future Note
          </span>
        </div>
      )}

      {/* Note Header & Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <CalendarIcon className="w-3.5 h-3.5" />
            {note.formattedDate} {isToday ? '(Today)' : ''}
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            {note.title}
          </h2>
        </div>

        {/* Note-level Category Selector */}
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-slate-400" />
          <select
            value={note.noteCategory || ''}
            onChange={(e) => handleNoteCategoryChange(e.target.value)}
            disabled={!isEditable}
            className="bg-slate-900/80 text-xs font-medium text-slate-200 border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 disabled:opacity-50 transition-colors"
          >
            <option value="">No Note Category</option>
            {DEFAULT_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Daily Task Progress Bar */}
      {totalCount > 0 && (
        <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Progress: {completedCount} of {totalCount} lines crossed off
            </span>
            <span className="text-indigo-400 font-semibold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Lines List */}
      <div className="flex flex-col gap-2.5 min-h-[160px]">
        {note.lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500 border border-dashed border-white/10 rounded-xl">
            <Sparkles className="w-8 h-8 mb-2 text-indigo-400/50" />
            <p className="text-sm font-medium">No items logged for this date.</p>
            {isEditable && (
              <p className="text-xs text-slate-500">Type a line below (try adding @work or #urgent tags)!</p>
            )}
          </div>
        ) : (
          note.lines.map((line) => (
            <div
              key={line.id}
              className={`group flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 ${
                line.completed
                  ? 'bg-slate-950/40 border-slate-800/40 opacity-75'
                  : 'bg-slate-900/70 border-white/10 hover:border-indigo-500/40 hover:bg-slate-900/90'
              }`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={line.completed}
                onChange={() => handleToggleLine(line.id)}
                className="custom-checkbox mt-0.5"
              />

              {/* Line Text & Editing UI */}
              <div className="flex-1 min-w-0">
                {editingLineId === line.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEditLine(line.id);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      className="flex-1 bg-slate-950 text-white text-sm px-3 py-1.5 rounded-lg border border-indigo-500 focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEditLine(line.id)}
                      className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                      title="Save line edit"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <p
                      onDoubleClick={() => handleStartEditLine(line)}
                      className={`text-sm font-medium leading-relaxed ${isEditable ? 'cursor-pointer hover:text-indigo-200' : ''} ${
                        line.completed ? 'completed-line' : 'text-slate-100'
                      }`}
                      title={isEditable ? "Double-click or click edit pencil to change line text" : undefined}
                    >
                      {line.text}
                    </p>

                    {/* Inline Category & Reminder Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {line.category && (
                        <span className={`badge-tag badge-${line.category}`}>
                          @{line.category}
                        </span>
                      )}

                      {line.reminder && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${
                          line.reminder.triggered
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {line.reminder.dateTime}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Line Item Action Buttons */}
              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                {isEditable && editingLineId !== line.id && (
                  <>
                    <button
                      onClick={() => handleStartEditLine(line)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                      title="Edit Line Text"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onSetLineReminder(line)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                      title="Set Line Reminder"
                    >
                      <Bell className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteLine(line.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Line"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add New Line Input Form (Only for Editable Today/Future notes) */}
      {isEditable ? (
        <form onSubmit={handleAddLine} className="flex items-center gap-2 mt-2">
          <input
            type="text"
            value={newLineText}
            onChange={(e) => setNewLineText(e.target.value)}
            placeholder="Add new item... (e.g. Finish report @work #urgent)"
            className="flex-1 bg-slate-900/90 text-white placeholder-slate-500 text-sm px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!newLineText.trim()}
            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-medium text-sm flex items-center gap-1.5 shadow-lg shadow-indigo-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Line
          </button>
        </form>
      ) : (
        <div className="p-3 bg-slate-950/40 rounded-xl border border-white/5 text-center text-xs text-slate-500">
          🔒 Add/Edit editing is disabled for past daily records.
        </div>
      )}
    </div>
  );
};
