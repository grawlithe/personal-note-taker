export interface Reminder {
  id: string;
  dateTime: string; // ISO string or YYYY-MM-DD HH:mm
  triggered?: boolean;
  repeat?: 'none' | 'daily' | 'weekly';
  title: string;
}

export interface LineItem {
  id: string;
  text: string;
  completed: boolean;
  category?: string; // Inline category or tag e.g. @work, #priority
  tags: string[];
  reminder?: Reminder | null;
  createdAt: string;
  completedAt?: string;
}

export interface DailyNote {
  id: string; // Format YYYY-MM-DD
  date: string; // ISO date string
  formattedDate: string; // e.g. "Tuesday, August 25, 2026"
  title: string;
  noteCategory?: string; // Note-level category
  lines: LineItem[];
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  count?: number;
}

export interface SyncConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  userEmail?: string;
  isLoggedIn: boolean;
  autoSync: boolean;
  lastSyncedAt?: string;
}

export type ViewMode = 'today' | 'yesterday' | 'calendar' | 'category' | 'reminders';
