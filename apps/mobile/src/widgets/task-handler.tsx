/**
 * Data + lifecycle for the "Closing soon" widget. Android runs the handler headless (no screen
 * mounted) on add, resize and every 30 min; the app calls refreshDeadlinesWidget() (refresh.ts)
 * after a save, an auth change or a Saved-screen load. Only refresh.ts may import this file:
 * the widget library throws on import where its native module is missing.
 *
 * The full deadline list is cached (same JSON-in-document-dir approach as lib/offline.ts) so the
 * widget keeps working offline and rolls the next deadline up when one passes. Signing out deletes
 * the cache: a widget must never show the previous account's list.
 */
import type { SavedList } from '@applyfields/types';
import { File, Paths } from 'expo-file-system';
import { registerWidgetTaskHandler, requestWidgetUpdate } from 'react-native-android-widget';

import { api, getToken } from '@/lib/api';

import { type Deadline, fromSaved, pickDeadlines, todayLocal } from './deadlines';
import { DeadlinesWidget, type WidgetState } from './DeadlinesWidget';

const WIDGET = 'Deadlines'; // = the widget name in app.json
const cache = new File(Paths.document, 'deadlines-widget.json');

function readCache(): Deadline[] | null {
  try {
    return cache.exists ? (JSON.parse(cache.textSync()) as Deadline[]) : null;
  } catch {
    return null;
  }
}

function clearCache(): void {
  try {
    if (cache.exists) cache.delete();
  } catch {
    // Can't delete: the signed-out state below still hides it.
  }
}

export async function loadWidgetState(): Promise<WidgetState> {
  if (!(await getToken())) {
    clearCache();
    return { kind: 'signed_out' };
  }
  const res = await api.get<SavedList>('/saved');
  if (res.data) {
    const list = fromSaved(res.data.items);
    try {
      cache.writeSync(JSON.stringify(list));
    } catch {
      // Disk full or similar: still draw what we fetched.
    }
    return { kind: 'rows', rows: pickDeadlines(list, todayLocal()) };
  }
  // A dead session is cleared inside api.get (401 + failed refresh), so check again.
  if (!(await getToken())) {
    clearCache();
    return { kind: 'signed_out' };
  }
  const cached = readCache();
  return cached ? { kind: 'rows', rows: pickDeadlines(cached, todayLocal()) } : { kind: 'error' };
}

export function redrawDeadlinesWidgets(): Promise<void> {
  return requestWidgetUpdate({
    widgetName: WIDGET,
    renderWidget: async () => <DeadlinesWidget state={await loadWidgetState()} />,
  });
}

registerWidgetTaskHandler(async ({ widgetInfo, widgetAction, renderWidget }) => {
  if (widgetInfo.widgetName !== WIDGET) return;
  if (widgetAction === 'WIDGET_ADDED' || widgetAction === 'WIDGET_UPDATE' || widgetAction === 'WIDGET_RESIZED') {
    renderWidget(<DeadlinesWidget state={await loadWidgetState()} />);
  }
  // Taps use OPEN_URI, so WIDGET_CLICK never reaches here; WIDGET_DELETED needs no cleanup.
});
