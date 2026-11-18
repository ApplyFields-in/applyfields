/**
 * The Android "Closing soon" home-screen widget. Widget primitives only (no RN views):
 * the launcher draws this as a native RemoteViews tree. Taps open app deep links.
 * The library calls these components as plain functions outside a React render, so the
 * React Compiler's memo hooks would throw — hence 'use no memo' (pinned by a test).
 */
'use no memo';

import { FlexWidget, TextWidget } from 'react-native-android-widget';

import { C } from '@/theme';

import type { WidgetState } from './deadlines';

const open = (uri: string) => ({ clickAction: 'OPEN_URI', clickActionData: { uri } }) as const;

function Message({ text, uri }: { text: string; uri: string }) {
  return (
    <FlexWidget style={{ flex: 1, width: 'match_parent', justifyContent: 'center' }} {...open(uri)}>
      <TextWidget text={text} style={{ fontSize: 13, color: C.muted }} />
    </FlexWidget>
  );
}

export function DeadlinesWidget({ state }: { state: WidgetState }) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        backgroundColor: C.white,
        borderRadius: 16,
        padding: 12,
      }}
    >
      <TextWidget
        text="Closing soon"
        style={{ fontSize: 14, fontWeight: 'bold', color: C.navy, marginBottom: 6 }}
        {...open('applyfields://saved')}
      />
      {state.kind === 'signed_out' ? (
        <Message text="Sign in to see your deadlines" uri="applyfields://login" />
      ) : state.kind === 'error' ? (
        <Message text="Couldn't refresh" uri="applyfields://saved" />
      ) : state.rows.length === 0 ? (
        <Message text="No upcoming deadlines" uri="applyfields://saved" />
      ) : (
        state.rows.map((r) => (
          <FlexWidget
            key={r.slug}
            style={{ width: 'match_parent', flexDirection: 'column', paddingVertical: 4 }}
            {...open(`applyfields://opportunity/${r.slug}`)}
          >
            <TextWidget text={r.title} maxLines={1} truncate="END" style={{ fontSize: 13, color: C.navy }} />
            <TextWidget text={r.label} style={{ fontSize: 12, color: r.urgent ? C.bad : C.muted }} />
          </FlexWidget>
        ))
      )}
    </FlexWidget>
  );
}
