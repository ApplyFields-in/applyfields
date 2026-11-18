# Deadlines home-screen widget (citizen app, Android) — design

## Why
Saved items already carry reminders. A home-screen widget lets users see what closes next
without opening the app, which supports the "track → get updates" step of Apply Mode.

## Goals
- An Android widget called "Closing soon" that shows the user's 3 saved opportunities closing soonest.
- Tapping a row opens that opportunity in the app.

## Non-goals (for now)
- iOS (WidgetKit + App Group, done separately later).
- Alerts, mascot or quick-action widgets.
- A settings screen for the widget. Saved services and colleges are left out because they have no last date.

## Anti-goals
- Showing a date that is wrong or stale as if it were current, or a deadline we don't have.
  If `last_date` is null, the item isn't shown.

## Approaches
- **A. `react-native-android-widget` (picked by Likhith).** The widget is written in JSX and the
  library ships an Expo config plugin. A headless JS handler fetches `/saved` with the existing `api`/`getToken`.
  It's all TS. The cost is one more native library to keep working across Expo upgrades.
  v0.26.0 (Oct 2026) has peer dependency `expo >=54`. SDK 58 / RN 0.88 is confirmed by the first build.
- B. A native Kotlin / Jetpack Glance widget inside our own config plugin plus a native module. It gives full visual control,
  but there's far more native code to maintain for 3 rows.
- `expo-widgets` was ruled out because it targets iOS.

## Behaviour (builder's calls, open to change)
- **Size:** 4×2 by default and resizable. The header reads "Closing soon".
- **Rows:** saved items where `item_type = 'opportunity'` and `last_date >= today`, sorted by `last_date` ascending, top 3.
  Each row shows a one-line title and "Closes today" / "Closes tomorrow" / "Closes in N days". Rows with ≤ 3 days left are shown in red.
  Days are worked out from `last_date` when the widget is drawn, not from `days_left`, which goes stale.
- **States:**
  - Signed out: "Sign in to see your deadlines". Tapping it opens login.
  - Nothing upcoming: "No upcoming deadlines". Tapping it opens Saved.
  - Fetch failed or offline: the last good rows are kept (cached in a JSON file in the document dir,
    the same approach as `lib/offline.ts`). If there is no cache, a "Couldn't refresh" line is shown.
- **Taps:** a row opens `applyfields://opportunity/<slug>` and the header opens the Saved tab.
- **Refresh:** Android's periodic update every 30 min (the minimum). The app also requests a widget update
  after save/unsave, sign-in/sign-out, and when the Saved screen loads.
  None of this depends on the mascot background task.
- **Look:** a light theme that uses the app's `C` colours.

## Build shape
- `react-native-android-widget` and its plugin entry are added to `app.json`, with widget name, size and update period.
- `src/widgets/deadlines.ts`: a pure `pickDeadlines(items, today)` plus day-label logic.
- `src/widgets/DeadlinesWidget.tsx`: the layout. `src/widgets/task-handler.ts`: fetch, cache and render.
- The widget task handler is registered in `index.ts` next to the mascot import, because it runs headless.
- `requestWidgetUpdate` is called from the save/unsave code, `lib/auth.tsx` sign-in/out, and the Saved screen.
- Test: `scripts/deadlines-widget.test.mjs` covers filtering, sorting, null dates, past dates and labels,
  added to `pnpm --filter @applyfields/mobile test`.
- Verify with an EAS build, then on the emulator: add the widget, check the signed-out state, sign in,
  save an item and see the widget update, and tap a row to open the opportunity.

## Left to the builder
Exact spacing and fonts, the widget preview image, and the cache file name.
