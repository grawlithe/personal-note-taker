import { getAllDailyNotes, saveDailyNote } from './storage';
import { Reminder } from '../types';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported in this browser/environment');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function playAlarmSound(): void {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Create a pleasant double-chime sound (synth)
    const playTone = (freq: number, delay: number, duration: number) => {
      setTimeout(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      }, delay);
    };

    playTone(523.25, 0, 0.4);   // C5
    playTone(659.25, 200, 0.5); // E5
    playTone(783.99, 400, 0.8); // G5
  } catch (err) {
    console.warn('Could not play notification sound:', err);
  }
}

export function triggerNativeNotification(title: string, body: string): void {
  playAlarmSound();

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.svg',
      requireInteraction: true
    });
  }
}

let reminderCheckerInterval: number | null = null;

export function startReminderChecker(onReminderTriggered?: (reminder: Reminder, noteId: string) => void): () => void {
  if (reminderCheckerInterval) {
    clearInterval(reminderCheckerInterval);
  }

  requestNotificationPermission();

  const check = () => {
    const allNotes = getAllDailyNotes();
    const now = new Date();

    Object.values(allNotes).forEach(note => {
      let updated = false;

      note.lines.forEach(line => {
        if (line.reminder && !line.reminder.triggered && !line.completed) {
          const reminderTime = new Date(line.reminder.dateTime.replace(' ', 'T'));

          if (now >= reminderTime) {
            // Trigger reminder!
            line.reminder.triggered = true;
            updated = true;

            const title = `⏰ Reminder: ${line.reminder.title || 'Task Due'}`;
            const body = `"${line.text}" in Daily Note (${note.formattedDate})`;

            triggerNativeNotification(title, body);

            if (onReminderTriggered) {
              onReminderTriggered(line.reminder, note.id);
            }
          }
        }
      });

      if (updated) {
        saveDailyNote(note);
      }
    });
  };

  // Run immediately and every 10 seconds
  check();
  reminderCheckerInterval = window.setInterval(check, 10000);

  return () => {
    if (reminderCheckerInterval) {
      clearInterval(reminderCheckerInterval);
      reminderCheckerInterval = null;
    }
  };
}
