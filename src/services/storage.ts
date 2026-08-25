import { DailyNote, LineItem, Category } from '../types';
import { format, subDays, parseISO } from 'date-fns';

const STORAGE_KEY_NOTES = 'zen_notes_daily_v1';
const STORAGE_KEY_CATEGORIES = 'zen_notes_categories_v1';

export function getTodayDateId(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getYesterdayDateId(): string {
  return format(subDays(new Date(), 1), 'yyyy-MM-dd');
}

export function isNoteEditable(dateId: string): boolean {
  const todayId = getTodayDateId();
  return dateId >= todayId;
}

export function formatDateLabel(dateId: string): string {
  try {
    const date = parseISO(dateId);
    return format(date, 'EEEE, MMMM d, yyyy');
  } catch {
    return dateId;
  }
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'work', name: 'Work', color: '#6366f1' },
  { id: 'personal', name: 'Personal', color: '#ec4899' },
  { id: 'ideas', name: 'Ideas', color: '#10b981' },
  { id: 'urgent', name: 'Urgent', color: '#ef4444' },
  { id: 'shopping', name: 'Shopping', color: '#f59e0b' },
];

function generateSeedData(): Record<string, DailyNote> {
  const todayId = getTodayDateId();
  const yesterdayId = getYesterdayDateId();

  const yesterdayNote: DailyNote = {
    id: yesterdayId,
    date: yesterdayId,
    formattedDate: formatDateLabel(yesterdayId),
    title: `Daily Note - ${formatDateLabel(yesterdayId)}`,
    noteCategory: 'work',
    lines: [
      {
        id: 'y-line-1',
        text: 'Review quarterly project timeline @work #priority',
        completed: true,
        category: 'work',
        tags: ['work', 'priority'],
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      },
      {
        id: 'y-line-2',
        text: 'Buy organic coffee beans & green tea #shopping',
        completed: true,
        category: 'shopping',
        tags: ['shopping'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'y-line-3',
        text: 'Draft architecture proposal for cross-platform app sync @work',
        completed: false,
        category: 'work',
        tags: ['work'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'y-line-4',
        text: 'Call team for weekly sync meeting @ 3:00 PM',
        completed: true,
        category: 'work',
        tags: ['work'],
        createdAt: new Date().toISOString()
      }
    ],
    updatedAt: new Date().toISOString()
  };

  const todayNote: DailyNote = {
    id: todayId,
    date: todayId,
    formattedDate: formatDateLabel(todayId),
    title: `Daily Note - ${formatDateLabel(todayId)}`,
    noteCategory: 'personal',
    lines: [
      {
        id: 't-line-1',
        text: 'Set up cross-device sync with Supabase realtime backend @work',
        completed: false,
        category: 'work',
        tags: ['work'],
        reminder: {
          id: 'rem-1',
          title: 'Supabase setup meeting',
          dateTime: `${todayId} 14:00`,
          triggered: false
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 't-line-2',
        text: '30 min evening workout & stretching #personal',
        completed: false,
        category: 'personal',
        tags: ['personal'],
        createdAt: new Date().toISOString()
      },
      {
        id: 't-line-3',
        text: 'Explore line-level category auto-detection in editor #ideas',
        completed: true,
        category: 'ideas',
        tags: ['ideas'],
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      }
    ],
    updatedAt: new Date().toISOString()
  };

  return {
    [yesterdayId]: yesterdayNote,
    [todayId]: todayNote
  };
}

export function getAllDailyNotes(): Record<string, DailyNote> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTES);
    if (!raw) {
      const seed = generateSeedData();
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse notes storage:', err);
    return generateSeedData();
  }
}

export function getDailyNote(dateId: string): DailyNote {
  const allNotes = getAllDailyNotes();
  if (allNotes[dateId]) {
    return allNotes[dateId];
  }

  // Create new empty daily note for dateId
  const newNote: DailyNote = {
    id: dateId,
    date: dateId,
    formattedDate: formatDateLabel(dateId),
    title: `Daily Note - ${formatDateLabel(dateId)}`,
    lines: [],
    updatedAt: new Date().toISOString()
  };

  allNotes[dateId] = newNote;
  saveAllDailyNotes(allNotes);
  return newNote;
}

export function saveDailyNote(note: DailyNote): void {
  const allNotes = getAllDailyNotes();
  note.updatedAt = new Date().toISOString();
  allNotes[note.id] = note;
  saveAllDailyNotes(allNotes);
}

export function saveAllDailyNotes(allNotes: Record<string, DailyNote>): void {
  localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(allNotes));
  window.dispatchEvent(new CustomEvent('zen_notes_updated', { detail: allNotes }));
}

export function carryOverUnfinishedItems(fromDateId: string, toDateId: string): number {
  const allNotes = getAllDailyNotes();
  const sourceNote = allNotes[fromDateId];
  const targetNote = getDailyNote(toDateId);

  if (!sourceNote || !sourceNote.lines) return 0;

  const unfinished = sourceNote.lines.filter(line => !line.completed);
  if (unfinished.length === 0) return 0;

  // Add unfinished lines to target note if not already present
  const existingTexts = new Set(targetNote.lines.map(l => l.text.trim()));
  let addedCount = 0;

  unfinished.forEach(line => {
    if (!existingTexts.has(line.text.trim())) {
      targetNote.lines.push({
        ...line,
        id: `migrated-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        createdAt: new Date().toISOString()
      });
      addedCount++;
    }
  });

  if (addedCount > 0) {
    saveDailyNote(targetNote);
  }

  return addedCount;
}

// Inline tag parser for line text (detects @category, #tag)
export function parseLineCategories(text: string): { category?: string; tags: string[] } {
  const tags: string[] = [];
  let category: string | undefined = undefined;

  // Match @word or #word
  const atMatch = text.match(/@([a-zA-Z0-9_-]+)/);
  if (atMatch) {
    category = atMatch[1].toLowerCase();
    tags.push(category);
  }

  const hashMatches = text.matchAll(/#([a-zA-Z0-9_-]+)/g);
  for (const match of hashMatches) {
    const tag = match[1].toLowerCase();
    if (!tags.includes(tag)) {
      tags.push(tag);
    }
    if (!category) {
      category = tag;
    }
  }

  return { category, tags };
}
