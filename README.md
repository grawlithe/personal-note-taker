# ✨ ZenNotes — Daily Notes & Reminders

A beautiful, cross-platform note-taking app built with React, TypeScript, and Tailwind CSS. ZenNotes helps you capture daily thoughts, track tasks, set reminders, and sync everything to the cloud — available as a **web app**, **Windows desktop app**, and **Android mobile app**.

---

## 📸 Features

### 📝 Daily Note Editor
- **Per-line editing** — double-click or tap the pencil icon to edit any line inline
- **Checkbox tasks** — toggle lines as complete/incomplete
- **Smart tags** — type `@work`, `@personal`, `#urgent`, `#idea` anywhere in a line to auto-categorize
- **Add lines** with the input bar at the bottom of each note

### 📅 Calendar View
- **Day / Week / Month** sub-views to browse notes across time
- Click any date to jump to that day's note

### 🏷️ Category Filter
- Filter all notes by tag/category across your entire history
- Toggle line completion directly from the filter view

### 🔔 Reminders
- Set date & time reminders on any line item
- Dedicated **Reminders** tab showing all scheduled tasks
- Background reminder checker with browser notifications

### 🔒 Note Immutability
- **Today's notes** and **future notes** are fully editable
- **Past notes** (yesterday and earlier) are locked as read-only immutable records
- A lock banner is displayed on immutable notes

### ☁️ Cloud Sync (Supabase)
- Real-time cloud sync across all your devices
- **Push** local notes to cloud / **Pull** cloud notes to local
- Auto-sync on every edit (when configured)
- Credentials stored securely via `.env` file

### 📱 Mobile Gestures
- **Swipe left/right** to switch between tabs
- **Pull-to-refresh** (swipe down) to sync latest data from cloud
- Safe area padding for notch displays and navigation bars

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS v4 |
| Build Tool | Vite |
| Icons | Lucide React |
| Date Handling | date-fns |
| Database | Supabase (PostgreSQL) |
| Desktop | Electron |
| Mobile | Capacitor (Android) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ and **npm**
- **Git**

### Install Dependencies

```bash
git clone https://github.com/grawlithe/personal-note-taker.git
cd personal-note-taker
npm install
```

### Run in Development Mode

```bash
npm run dev
```

Opens at `http://localhost:5173`.

---

## 📦 Exporting to Different Platforms

### 🖥️ Windows Desktop App (Electron)

ZenNotes can be packaged as a standalone `.exe` that runs without a browser.

#### Build the Windows executable:

```bash
npm run electron:pack
```

This will:
1. Build the production Vite bundle (`dist/`)
2. Package it with Electron into `dist-electron/ZenNotes-win32-x64/`

#### Run the app:

Navigate to `dist-electron/ZenNotes-win32-x64/` and double-click **`ZenNotes.exe`**.

#### Development mode (with hot-reload):

```bash
npm run electron:dev
```

> **Note:** The `vite.config.ts` uses `base: './'` to ensure assets load correctly via Electron's `file://` protocol.

---

### 📱 Android Mobile App (Capacitor)

ZenNotes can be exported as a native Android APK.

#### Prerequisites

- **Android Studio** installed with Android SDK
- **Java JDK 17+**

#### Steps:

1. **Build and sync web assets to the Android project:**

   ```bash
   npm run build
   npx cap sync
   ```

2. **Open in Android Studio:**

   ```bash
   npx cap open android
   ```

3. **Build the debug APK** from Android Studio:
   - Click **Build → Build Bundle(s) / APK(s) → Build APK(s)**
   - The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

4. **Transfer the APK** to your phone and install it.

> **Samsung Galaxy Users:** You may need to disable **Auto Blocker** in Settings → Security → Auto Blocker before sideloading APKs.

#### One-liner build (if Gradle is on PATH):

```bash
npm run android:build
```

---

## ☁️ Supabase Database Setup Guide

ZenNotes uses [Supabase](https://supabase.com) as its cloud database for cross-device sync. Follow these steps to set it up:

### Step 1: Create a Supabase Account

1. Go to [supabase.com](https://supabase.com) and sign up for a free account
2. Click **New Project** and give it a name (e.g., `zen-notes`)
3. Choose a database password and your nearest region
4. Click **Create New Project** and wait for it to provision

### Step 2: Get Your Credentials

1. In your Supabase project dashboard, go to **Settings → API** (in the left sidebar)
2. Copy these two values:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **Anon (public) Key** — the long `eyJ...` string under "Project API keys"

### Step 3: Create the Database Table

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Paste and run this SQL:

   ```sql
   CREATE TABLE IF NOT EXISTS daily_notes (
     id TEXT PRIMARY KEY,
     date TEXT,
     formatted_date TEXT,
     title TEXT,
     note_category TEXT,
     lines JSONB,
     updated_at TIMESTAMP
   );

   -- Disable Row Level Security to allow anon key read/write access
   ALTER TABLE daily_notes DISABLE ROW LEVEL SECURITY;
   ```

> **Important:** Disabling RLS allows your app's anon key to read and write without authentication policies. This is fine for a personal app. If you plan to share the app with others, configure proper RLS policies instead.

### Step 4: Configure Your App

There are two ways to connect ZenNotes to Supabase:

#### Option A: Environment File (Recommended)

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The app will auto-connect on startup. This file is git-ignored so your credentials stay safe.

#### Option B: In-App Settings

1. Open ZenNotes
2. Click the **cloud icon** (☁️) in the header
3. Paste your **Project URL** and **Anon Key**
4. Click **Save Credentials**

### Step 5: Sync Your Notes

Once connected, you can:

- **Push Local to Cloud** — uploads all local notes to Supabase
- **Pull Cloud** — downloads all cloud notes to local storage
- **Auto-sync** — every edit automatically pushes to cloud in the background
- **Pull-to-refresh** (mobile) — swipe down to fetch latest from cloud

### Step 6: Enable Real-Time Sync (Optional)

For live real-time sync across devices:

1. In Supabase dashboard, go to **Database → Replication**
2. Enable replication for the `daily_notes` table
3. ZenNotes will automatically receive live updates via Supabase Realtime

---

## 📁 Project Structure

```
personal-note-taker/
├── electron/
│   └── main.cjs              # Electron main process
├── android/                   # Capacitor Android project
├── src/
│   ├── components/
│   │   ├── CalendarView.tsx   # Day/Week/Month calendar
│   │   ├── CategoryFilter.tsx # Tag-based filtering
│   │   ├── DailyNoteEditor.tsx# Main note editor
│   │   ├── Header.tsx         # Navigation header & tabs
│   │   ├── PullToRefresh.tsx  # Pull-to-refresh gesture
│   │   ├── ReminderModal.tsx  # Reminder creation modal
│   │   ├── SyncSettingsModal.tsx # Cloud sync settings
│   │   └── YesterdayPreview.tsx  # Yesterday's note preview
│   ├── services/
│   │   ├── storage.ts         # Local storage operations
│   │   ├── supabase.ts        # Supabase cloud sync
│   │   └── notifications.ts   # Reminder notifications
│   ├── types.ts               # TypeScript type definitions
│   ├── App.tsx                # Root application component
│   ├── index.css              # Global styles & design system
│   └── main.tsx               # React entry point
├── .env                       # Supabase credentials (git-ignored)
├── .env.example               # Template for .env
├── capacitor.config.ts        # Capacitor mobile config
├── vite.config.ts             # Vite build config
├── tailwind.config.ts         # Tailwind CSS config
└── package.json               # Dependencies & scripts
```

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at localhost:5173 |
| `npm run build` | Build production bundle to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run electron:dev` | Run Electron with hot-reload |
| `npm run electron:pack` | Package Windows `.exe` to `dist-electron/` |
| `npm run cap:sync` | Sync web assets to Capacitor (Android) |
| `npm run android:build` | Build Android debug APK |

---

## 📄 License

This is a personal project. Feel free to fork and adapt for your own use.
