import React from 'react';
import { DailyNote, LineItem } from '../types';
import { DEFAULT_CATEGORIES } from '../services/storage';
import { Tag, Filter, CheckCircle2 } from 'lucide-react';

interface CategoryFilterProps {
  allNotes: Record<string, DailyNote>;
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  onToggleLine: (noteId: string, lineId: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  allNotes,
  selectedCategory,
  onSelectCategory,
  onToggleLine,
}) => {
  // Aggregate all line items and note categories across all daily notes
  const notesArray = Object.values(allNotes);

  // Compute category statistics
  const categoryCounts: Record<string, number> = {};
  notesArray.forEach(note => {
    if (note.noteCategory) {
      categoryCounts[note.noteCategory] = (categoryCounts[note.noteCategory] || 0) + 1;
    }
    note.lines.forEach(line => {
      if (line.category) {
        categoryCounts[line.category] = (categoryCounts[line.category] || 0) + 1;
      }
      line.tags.forEach(tag => {
        if (tag !== line.category) {
          categoryCounts[tag] = (categoryCounts[tag] || 0) + 1;
        }
      });
    });
  });

  // Filtered matching lines across all days
  const filteredResults: { note: DailyNote; lines: LineItem[] }[] = [];

  notesArray.forEach(note => {
    const isNoteMatch = selectedCategory && note.noteCategory === selectedCategory;
    const matchingLines = note.lines.filter(l =>
      !selectedCategory ||
      l.category === selectedCategory ||
      l.tags.includes(selectedCategory) ||
      isNoteMatch
    );

    if (matchingLines.length > 0) {
      filteredResults.push({
        note,
        lines: matchingLines
      });
    }
  });

  return (
    <div className="glass-card p-6 rounded-2xl shadow-xl flex flex-col gap-6 border border-white/10 animate-fade-in">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-white">Categorized Notes & Line Items</h2>
        </div>

        {selectedCategory && (
          <button
            onClick={() => onSelectCategory(null)}
            className="text-xs text-indigo-300 hover:text-white px-2.5 py-1 rounded-md bg-indigo-500/20 border border-indigo-500/30 transition-colors"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Category Pills Selector */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelectCategory(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            selectedCategory === null
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
              : 'bg-slate-900/80 text-slate-300 border-white/10 hover:border-indigo-500/40'
          }`}
        >
          All Items ({notesArray.reduce((acc, n) => acc + n.lines.length, 0)})
        </button>

        {DEFAULT_CATEGORIES.map(cat => {
          const count = categoryCounts[cat.id] || 0;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                  : 'bg-slate-900/80 text-slate-300 border-white/10 hover:border-indigo-500/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
              @{cat.name}
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-white/10 font-bold">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Categorized Filter Results */}
      <div className="flex flex-col gap-5 mt-2">
        {filteredResults.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-10">
            No line items or notes match the category "{selectedCategory}".
          </p>
        ) : (
          filteredResults.map(({ note, lines }) => (
            <div key={note.id} className="bg-slate-900/60 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-400">
                  {note.formattedDate}
                </span>
                {note.noteCategory && (
                  <span className={`badge-tag badge-${note.noteCategory}`}>
                    Note Category: @{note.noteCategory}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {lines.map(line => (
                  <div
                    key={line.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-950/40 border border-white/5"
                  >
                    <input
                      type="checkbox"
                      checked={line.completed}
                      onChange={() => onToggleLine(note.id, line.id)}
                      className="custom-checkbox"
                    />
                    <span className={`text-sm flex-1 ${line.completed ? 'completed-line' : 'text-slate-200'}`}>
                      {line.text}
                    </span>
                    {line.category && (
                      <span className={`badge-tag badge-${line.category}`}>
                        @{line.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
