/**
 * The only file the rest of the app imports for the home-screen widget.
 * react-native-android-widget throws on import where its native module is missing (iOS, web,
 * Expo Go), so the handler file that imports it is only loaded on Android builds that have it.
 * index.ts imports this file before render so a headless widget run finds its handler.
 */
import { Platform, TurboModuleRegistry } from 'react-native';

type Handler = typeof import('./task-handler');

const handler: Handler | null =
  Platform.OS === 'android' && TurboModuleRegistry.get('AndroidWidget') != null
    ? (require('./task-handler') as Handler)
    : null;

/** Redraw every placed "Closing soon" widget. Never throws; a no-op where widgets don't exist. */
export async function refreshDeadlinesWidget(): Promise<void> {
  if (!handler) return;
  try {
    await handler.redrawDeadlinesWidgets();
  } catch {
    // No widget placed, or the redraw failed: the 30-min update draws it next time.
  }
}
