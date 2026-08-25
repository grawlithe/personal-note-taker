import React, { useState } from 'react';
import { LineItem, Reminder } from '../types';
import { Bell, Calendar, Clock, X, Check } from 'lucide-react';
import { format } from 'date-fns';

interface ReminderModalProps {
  lineItem: LineItem | null;
  onClose: () => void;
  onSaveReminder: (reminder: Reminder) => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  lineItem,
  onClose,
  onSaveReminder,
}) => {
  const defaultDate = format(new Date(), 'yyyy-MM-dd');
  const defaultTime = '12:00';

  const [title, setTitle] = useState(lineItem ? lineItem.text : 'Task Reminder');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly'>('none');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reminder: Reminder = {
      id: lineItem?.reminder?.id || `rem-${Date.now()}`,
      title: title.trim() || 'Task Reminder',
      dateTime: `${date} ${time}`,
      repeat,
      triggered: false
    };

    onSaveReminder(reminder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-md p-6 rounded-2xl border border-white/10 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Set Task Reminder</h3>
            <p className="text-xs text-slate-400">Audio chime & native OS notification</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Reminder Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Call client / Submit proposal"
              className="w-full bg-slate-900/90 text-white text-sm px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-900/90 text-white text-sm px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-900/90 text-white text-sm px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Repeat Cycle
            </label>
            <select
              value={repeat}
              onChange={(e) => setRepeat(e.target.value as any)}
              className="w-full bg-slate-900/90 text-white text-sm px-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500"
            >
              <option value="none">One-time only</option>
              <option value="daily">Repeat Every Day</option>
              <option value="weekly">Repeat Every Week</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-500/25 transition-all"
            >
              <Check className="w-4 h-4" /> Save Reminder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
