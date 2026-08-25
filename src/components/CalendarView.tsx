import React, { useState } from 'react';
import { DailyNote, LineItem } from '../types';
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileText,
  Clock,
  Plus,
  Grid,
  Columns,
  Square
} from 'lucide-react';

export type CalendarSubView = 'month' | 'week' | 'day';

interface CalendarViewProps {
  allNotes: Record<string, DailyNote>;
  selectedDate: string;
  onSelectDate: (dateId: string) => void;
  onToggleLine?: (noteId: string, lineId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  allNotes,
  selectedDate,
  onSelectDate,
  onToggleLine,
}) => {
  const [subView, setSubView] = useState<CalendarSubView>('month');
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    try {
      return parseISO(selectedDate);
    } catch {
      return new Date();
    }
  });

  const today = new Date();

  // Navigation handlers
  const handlePrev = () => {
    if (subView === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (subView === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (subView === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (subView === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handleTodayClick = () => {
    const now = new Date();
    setCurrentDate(now);
    onSelectDate(format(now, 'yyyy-MM-dd'));
  };

  // Label for top header
  const getHeaderLabel = () => {
    if (subView === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else if (subView === 'week') {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    }
  };

  // Helper for day selection
  const handleDayClick = (day: Date) => {
    const dateId = format(day, 'yyyy-MM-dd');
    onSelectDate(dateId);
  };

  return (
    <div className="glass-card p-6 rounded-2xl shadow-xl flex flex-col gap-6 border border-white/10 animate-fade-in max-w-6xl mx-auto">
      {/* Google Calendar Style Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        {/* Title & Date Range */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {getHeaderLabel()}
            </h2>
            <p className="text-xs text-slate-400 font-medium">Google Calendar Schedule View</p>
          </div>
        </div>

        {/* Controls: Prev/Today/Next + View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Navigation Arrows & Today */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-white/10">
            <button
              onClick={handleTodayClick}
              className="px-3 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-semibold rounded-lg transition-all"
            >
              Today
            </button>
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-colors"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Switcher: Day / Week / Month */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setSubView('day')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                subView === 'day'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Square className="w-3.5 h-3.5" /> Day
            </button>
            <button
              onClick={() => setSubView('week')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                subView === 'week'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" /> Week
            </button>
            <button
              onClick={() => setSubView('month')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                subView === 'month'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> Month
            </button>
          </div>
        </div>
      </div>

      {/* Render Sub View */}
      {subView === 'month' && (
        <MonthView
          currentDate={currentDate}
          allNotes={allNotes}
          selectedDate={selectedDate}
          onSelectDate={handleDayClick}
        />
      )}

      {subView === 'week' && (
        <WeekView
          currentDate={currentDate}
          allNotes={allNotes}
          selectedDate={selectedDate}
          onSelectDate={handleDayClick}
          onToggleLine={onToggleLine}
        />
      )}

      {subView === 'day' && (
        <DayView
          currentDate={currentDate}
          allNotes={allNotes}
          onSelectDate={handleDayClick}
          onToggleLine={onToggleLine}
        />
      )}
    </div>
  );
};

// ==========================================
// MONTH VIEW COMPONENT
// ==========================================
interface SubViewProps {
  currentDate: Date;
  allNotes: Record<string, DailyNote>;
  selectedDate?: string;
  onSelectDate: (day: Date) => void;
  onToggleLine?: (noteId: string, lineId: string) => void;
}

const MonthView: React.FC<SubViewProps> = ({ currentDate, allNotes, selectedDate, onSelectDate }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const today = new Date();

  return (
    <div className="flex flex-col gap-2 animate-fade-in">
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayId = format(day, 'yyyy-MM-dd');
          const note = allNotes[dayId];
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, today);
          const isSelected = selectedDate === dayId;

          const totalLines = note?.lines?.length || 0;
          const completedLines = note?.lines?.filter(l => l.completed).length || 0;
          const percent = totalLines > 0 ? Math.round((completedLines / totalLines) * 100) : 0;

          return (
            <div
              key={dayId}
              onClick={() => onSelectDate(day)}
              className={`min-h-[100px] p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                !isCurrentMonth
                  ? 'bg-slate-950/20 border-slate-900/40 text-slate-600 hover:border-slate-700/40'
                  : isSelected
                  ? 'bg-indigo-900/40 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : isToday
                  ? 'bg-indigo-500/10 border-indigo-500/50 text-white'
                  : 'bg-slate-900/70 border-white/5 hover:border-indigo-500/40 hover:bg-slate-900/90 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                  isToday ? 'bg-indigo-600 text-white' : 'text-slate-300 group-hover:text-indigo-300'
                }`}>
                  {format(day, 'd')}
                </span>

                {note && totalLines > 0 && (
                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-0.5">
                    <FileText className="w-3 h-3 text-indigo-400" /> {totalLines}
                  </span>
                )}
              </div>

              {/* Preview of first 2 lines */}
              <div className="my-1 flex flex-col gap-1 overflow-hidden">
                {note?.lines?.slice(0, 2).map(l => (
                  <div key={l.id} className="text-[10px] truncate text-slate-300 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${l.completed ? 'bg-emerald-400' : 'bg-indigo-400'}`} />
                    <span className={l.completed ? 'line-through text-slate-500' : ''}>{l.text}</span>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              {note && totalLines > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-medium mb-0.5">
                    <span>{completedLines}/{totalLines}</span>
                    <span className="text-indigo-300">{percent}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-1 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// WEEK VIEW COMPONENT
// ==========================================
const WeekView: React.FC<SubViewProps> = ({ currentDate, allNotes, selectedDate, onSelectDate, onToggleLine }) => {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const today = new Date();

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-3 animate-fade-in">
      {weekDays.map(day => {
        const dayId = format(day, 'yyyy-MM-dd');
        const note = allNotes[dayId];
        const isToday = isSameDay(day, today);
        const isSelected = selectedDate === dayId;

        return (
          <div
            key={dayId}
            className={`p-3 rounded-xl border flex flex-col gap-3 min-h-[300px] transition-all ${
              isToday
                ? 'bg-indigo-950/30 border-indigo-500/50 shadow-md shadow-indigo-500/10'
                : isSelected
                ? 'bg-slate-900/90 border-indigo-400'
                : 'bg-slate-900/60 border-white/5'
            }`}
          >
            {/* Header */}
            <div
              onClick={() => onSelectDate(day)}
              className="flex flex-col items-center pb-2 border-b border-white/10 cursor-pointer group"
            >
              <span className="text-[11px] font-semibold uppercase text-slate-400">
                {format(day, 'EEE')}
              </span>
              <span className={`text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full mt-0.5 ${
                isToday ? 'bg-indigo-600 text-white' : 'text-white group-hover:bg-white/10'
              }`}>
                {format(day, 'd')}
              </span>
            </div>

            {/* Tasks list inside day column */}
            <div className="flex-1 flex flex-col gap-2">
              {!note || note.lines.length === 0 ? (
                <p className="text-[11px] text-slate-600 text-center py-4 italic">No items</p>
              ) : (
                note.lines.map(line => (
                  <div
                    key={line.id}
                    className="p-2 rounded-lg bg-slate-950/50 border border-white/5 flex items-start gap-2 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={line.completed}
                      onChange={() => onToggleLine && onToggleLine(note.id, line.id)}
                      className="custom-checkbox mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`leading-snug ${line.completed ? 'completed-line' : 'text-slate-200'}`}>
                        {line.text}
                      </p>
                      {line.category && (
                        <span className={`badge-tag badge-${line.category} text-[9px] mt-1 inline-block`}>
                          @{line.category}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ==========================================
// DAY VIEW COMPONENT
// ==========================================
const DayView: React.FC<SubViewProps> = ({ currentDate, allNotes, onSelectDate, onToggleLine }) => {
  const dayId = format(currentDate, 'yyyy-MM-dd');
  const note = allNotes[dayId];

  const hours = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM'
  ];

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Day Overview Banner */}
      <div className="p-4 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h3>
          <p className="text-xs text-indigo-300">
            {note?.lines ? `${note.lines.filter(l => l.completed).length} of ${note.lines.length} tasks completed` : 'No tasks logged'}
          </p>
        </div>
        <button
          onClick={() => onSelectDate(currentDate)}
          className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow-md"
        >
          Open Full Editor
        </button>
      </div>

      {/* Hourly Schedule Timeline */}
      <div className="flex flex-col gap-2 bg-slate-900/60 p-4 rounded-xl border border-white/5">
        {hours.map(hour => {
          // Match lines or reminders near this hour
          const matchingLines = note?.lines?.filter(l => {
            if (l.reminder && l.reminder.dateTime.includes(hour.substring(0, 2))) return true;
            if (l.text.toLowerCase().includes(hour.toLowerCase())) return true;
            return false;
          }) || [];

          return (
            <div key={hour} className="flex items-start gap-4 py-2 border-b border-white/5 last:border-0 min-h-[50px]">
              <span className="text-xs font-mono text-slate-400 w-20 flex-shrink-0 pt-1">{hour}</span>
              <div className="flex-1 flex flex-wrap gap-2">
                {matchingLines.length === 0 ? (
                  <span className="text-xs text-slate-700 italic pt-1">—</span>
                ) : (
                  matchingLines.map(line => (
                    <div key={line.id} className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-xs flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={line.completed}
                        onChange={() => onToggleLine && onToggleLine(note.id, line.id)}
                        className="custom-checkbox"
                      />
                      <span className={line.completed ? 'completed-line' : 'text-white'}>{line.text}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
