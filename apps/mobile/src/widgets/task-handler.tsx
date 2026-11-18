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
import type { SavedItem, SavedList } from '@applyfields/types';
import { File, Paths } from 'expo-file-system';
import { PixelRatio } from 'react-native';
import {
  registerWidgetTaskHandler,
  requestWidgetUpdate,
  type WidgetInfo,
} from 'react-native-android-widget';

import { api, getToken } from '@/lib/api';

import {
  type Deadline,
  fromSaved,
  parseCache,
  rowsThatFit,
  settleWidget,
  todayLocal,
  type WidgetState,
} from './deadlines';
import { DeadlinesWidget } from './DeadlinesWidget';

const WIDGET = 'Deadlines'; // = the widget name in app.json
const cache = new File(Paths.document, 'deadlines-widget.json');

function readCache(): Deadline[] | null {
  try {
    return cache.exists ? parseCache(cache.textSync()) : null;
  } catch {
    return null;
  }
}

function clearCache(): void {
  try {
    if (cache.exists) cache.delete();
  } catch {
    // Can't delete: the signed-out state still hides it.
  }
}

/**
 * Never throws: a throw here means nothing gets drawn (the library runs renders detached).
 * `items`: the /saved list a screen just loaded, so the widget doesn't fetch it a second time.
 */
export async function loadWidgetState(items?: SavedItem[]): Promise<WidgetState> {
  try {
    let fetched: Deadline[] | null = null;
    if (await getToken()) {
      const list = items ?? (await api.get<SavedList>('/saved')).data?.items;
      fetched = list ? fromSaved(list) : null;
    }
    // Checked again after the fetch: a sign-out (or a dead session, cleared inside api.get)
    // while it was in flight must not write or draw the old account's list.
    const { state, cache: action } = settleWidget(!!(await getToken()), fetched, readCache(), todayLocal());
    if (action === 'clear') clearCache();
    if (action === 'write') {
      try {
        cache.writeSync(JSON.stringify(fetched));
      } catch {
        // Disk full or similar: still draw what we fetched.
      }
    }
    return state;
  } catch {
    return { kind: 'error' };
  }
}

function draw(state: WidgetState, info: WidgetInfo) {
  return <DeadlinesWidget state={state} maxRows={rowsThatFit(info.height, PixelRatio.getFontScale())} />;
}

export async function redrawDeadlinesWidgets(items?: SavedItem[]): Promise<void> {
  // Only placed widgets get redrawn, so clear a signed-out cache here too: otherwise the next
  // account to add the widget offline would see this one's list.
  if (!(await getToken())) clearCache();
  let pending: Promise<WidgetState> | undefined;
  await requestWidgetUpdate({
    widgetName: WIDGET,
    // Loaded once, on the first placed widget, and shared by the rest.
    renderWidget: async (info) => draw(await (pending ??= loadWidgetState(items)), info),
  });
}

registerWidgetTaskHandler(async ({ widgetInfo, widgetAction, renderWidget }) => {
  if (widgetInfo.widgetName !== WIDGET) return;
  if (widgetAction === 'WIDGET_ADDED' || widgetAction === 'WIDGET_UPDATE' || widgetAction === 'WIDGET_RESIZED') {
    renderWidget(draw(await loadWidgetState(), widgetInfo));
  }
  // Taps use OPEN_URI, so WIDGET_CLICK never reaches here; WIDGET_DELETED needs no cleanup.
});
