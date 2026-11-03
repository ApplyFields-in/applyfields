/**
 * The official application form, opened inside the app, with the user's own
 * profile in a sheet underneath it. Government portals rarely autofill, so the
 * sheet gives one tap to copy each value straight into the form above.
 *
 * ApplyFields never submits anything: the form, the fee and the submit button
 * all belong to the official portal shown in the WebView.
 */
import type { MeResponse, UserEducation } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  WebView as RNWebView,
  type WebViewNavigation,
  type WebViewProps,
} from 'react-native-webview';

import { Empty, Muted } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import { C, R, S, TAP, column } from '@/theme';

/**
 * react-native-webview declares `class WebView<P = undefined>` over
 * `WebViewProps & P`, and `WebViewProps & undefined` collapses to `never`
 * under TypeScript 6, so every prop is rejected. One cast fixes the file;
 * delete it when the package ships corrected types.
 */
const WebView = RNWebView as unknown as React.ComponentType<
  WebViewProps & { ref?: React.Ref<WebViewHandle> }
>;

interface WebViewHandle {
  reload: () => void;
  goBack: () => void;
  goForward: () => void;
}

// Android 13+ shows its own "Copied" system toast, so we skip our in-app one there.
const OS_COPY_TOAST = Platform.OS === 'android' && Number(Platform.Version) >= 33;

interface Field {
  label: string;
  value: string;
}

/** Everything worth copying into a government form, in the order forms ask for it. */
function profileFields(me: MeResponse | null, education: UserEducation[]): Field[] {
  if (!me) return [];
  const p = me.profile;
  const out: Field[] = [];
  const add = (label: string, value: string | number | null | undefined) => {
    if (value !== null && value !== undefined && `${value}`.trim() !== '') {
      out.push({ label, value: `${value}` });
    }
  };

  add('Full name', p?.full_name);
  add('Date of birth', p?.date_of_birth ? formatDate(p.date_of_birth) : null);
  add('Date of birth (DD/MM/YYYY)', p?.date_of_birth?.split('-').reverse().join('/'));
  add('Gender', p?.gender?.replace(/_/g, ' '));
  add('Category', p?.category);
  add('Email', me.user.email);
  add('Mobile', me.user.phone);
  add('State', p?.state_code);
  add('District', p?.district);
  add('Domicile state', p?.domicile_state_code);
  add('Annual family income', p?.annual_family_income);
  if (p?.is_pwbd) add('PwBD type', p.pwbd_type ?? 'Yes');

  for (const e of education) {
    const prefix = e.level.replace(/_/g, ' ');
    add(`${prefix} — degree`, e.degree);
    add(`${prefix} — stream`, e.stream);
    add(`${prefix} — board / university`, e.board_or_university);
    add(`${prefix} — institution`, e.institution_name);
    add(`${prefix} — year of passing`, e.year_of_passing);
    add(`${prefix} — ${e.score_type ?? 'score'}`, e.score);
  }

  return out;
}

export default function ApplyBrowser() {
  const { url, title } = useLocalSearchParams<{ url?: string; title?: string }>();
  const router = useRouter();
  const { me, signedIn } = useAuth();
  const { data: education } = useApi<UserEducation[]>(signedIn ? '/me/education' : null);
  const insets = useSafeAreaInsets();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [host, setHost] = useState('');
  const [nav, setNav] = useState({ back: false, forward: false });
  const [copied, setCopied] = useState<string | null>(null);
  const webRef = useRef<WebViewHandle | null>(null);

  // The form and the sheet take turns. Typing into the portal collapses the
  // sheet so the form keeps the screen; opening the sheet drops the keyboard.
  useEffect(() => {
    const event = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(event, () => setSheetOpen(false));
    return () => sub.remove();
  }, []);

  function toggleSheet() {
    if (!sheetOpen) Keyboard.dismiss();
    setSheetOpen((v) => !v);
  }

  if (!url) {
    return <Empty icon="link-outline" title="No official link was given for this one" />;
  }

  const fields = profileFields(me, education ?? []);

  async function copy(field: Field) {
    await Clipboard.setStringAsync(field.value);
    if (OS_COPY_TOAST) return; // the system already confirmed the copy
    setCopied(field.label);
    setTimeout(() => setCopied((c) => (c === field.label ? null : c)), 1400);
  }

  // The three fields almost every form opens with, copied as separate lines.
  const copyAllFields = fields.filter((f) =>
    ['Full name', 'Date of birth', 'Category'].includes(f.label),
  );
  async function copyAll() {
    await Clipboard.setStringAsync(copyAllFields.map((f) => `${f.label}: ${f.value}`).join('\n'));
    if (OS_COPY_TOAST) return;
    setCopied('__all__');
    setTimeout(() => setCopied((c) => (c === '__all__' ? null : c)), 1400);
  }

  return (
    <View style={s.root}>
      {/* Which site you are actually on — the whole point of applying officially. */}
      <View style={s.urlBar}>
        <Pressable
          accessibilityLabel="Back"
          disabled={!nav.back}
          onPress={() => webRef.current?.goBack()}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={18} color={nav.back ? C.navy : C.line} />
        </Pressable>
        <Pressable
          accessibilityLabel="Forward"
          disabled={!nav.forward}
          onPress={() => webRef.current?.goForward()}
          hitSlop={12}
        >
          <Ionicons name="chevron-forward" size={18} color={nav.forward ? C.navy : C.line} />
        </Pressable>
        <Ionicons name="lock-closed" size={13} color={C.good} />
        <Text style={s.urlText} numberOfLines={1}>
          {host || new URL(url).host}
        </Text>
        <Pressable
          accessibilityLabel="Reload the page"
          onPress={() => webRef.current?.reload()}
          hitSlop={14}
        >
          <Ionicons name="refresh" size={16} color={C.muted} />
        </Pressable>
        <Pressable
          accessibilityLabel="Open in the phone's browser"
          onPress={() => Linking.openURL(url).catch(() => undefined)}
          hitSlop={14}
        >
          <Ionicons name="open-outline" size={16} color={C.muted} />
        </Pressable>
      </View>

      <View style={s.webWrap}>
        <WebView
          ref={webRef}
          source={{ uri: url }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={(s: WebViewNavigation) => {
            setNav({ back: s.canGoBack, forward: s.canGoForward });
            try {
              setHost(new URL(s.url).host);
            } catch {
              /* about:blank and friends — keep the last known host */
            }
          }}
          setSupportMultipleWindows={false}
          allowsBackForwardNavigationGestures
        />
        {loading ? (
          <View style={s.webLoading} pointerEvents="none">
            <ActivityIndicator color={C.blue} />
          </View>
        ) : null}
      </View>

      {/* The split sheet: a handle you can always reach, opening to the profile. */}
      <View
        style={[
          s.sheet,
          { paddingBottom: insets.bottom + S.sm, maxHeight: sheetOpen ? '45%' : undefined },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: sheetOpen }}
          onPress={toggleSheet}
          style={s.handle}
        >
          <Ionicons name="copy-outline" size={16} color={C.navy} />
          <Text style={s.handleText}>{sheetOpen ? 'Hide my details' : 'Copy from my profile'}</Text>
          <Ionicons name={sheetOpen ? 'chevron-down' : 'chevron-up'} size={18} color={C.muted} />
        </Pressable>

        {sheetOpen ? (
          !signedIn ? (
            <Pressable onPress={() => router.push('/login')} style={s.signIn}>
              <Muted>Sign in to copy your saved details into this form.</Muted>
            </Pressable>
          ) : fields.length === 0 ? (
            <Pressable onPress={() => router.push('/profile')} style={s.signIn}>
              <Muted>Your profile is empty. Fill it in once and copy it into every form.</Muted>
            </Pressable>
          ) : (
            <ScrollView
              contentContainerStyle={[column, s.fields]}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={s.warn}>
                Never share an OTP or password. ApplyFields does not submit this form for you.
              </Text>
              {copyAllFields.length > 1 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Copy name, date of birth and category"
                  onPress={copyAll}
                  style={({ pressed }) => [s.copyAll, pressed && { opacity: 0.85 }]}
                >
                  <Ionicons name="copy" size={15} color={C.white} />
                  <Text style={s.copyAllText}>
                    {copied === '__all__' ? 'Copied name, DOB & category' : 'Copy name, DOB & category'}
                  </Text>
                </Pressable>
              ) : null}
              {fields.map((field) => (
                <Pressable
                  key={field.label}
                  accessibilityRole="button"
                  accessibilityLabel={`Copy ${field.label}`}
                  onPress={() => copy(field)}
                  style={({ pressed }) => [s.field, pressed && { backgroundColor: C.ice }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>{field.label}</Text>
                    <Text style={s.fieldValue} numberOfLines={1}>
                      {field.value}
                    </Text>
                  </View>
                  {copied === field.label ? (
                    <Text style={s.copied}>Copied</Text>
                  ) : (
                    <Ionicons name="copy-outline" size={16} color={C.blue} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          )
        ) : (
          <Text style={s.peek} numberOfLines={1}>
            {title ?? 'Official application'}
          </Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  urlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    paddingHorizontal: S.lg,
    paddingVertical: S.sm,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  urlText: { flex: 1, color: C.navy, fontSize: 12, fontWeight: '600' },
  webWrap: { flex: 1 },
  webLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.white,
  },
  sheet: {
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.line,
    shadowColor: C.navy,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  handle: {
    ...column,
    minHeight: TAP + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
  },
  handleText: { flex: 1, color: C.navy, fontSize: 14, fontWeight: '700' },
  peek: { ...column, paddingHorizontal: S.lg, paddingBottom: S.sm, color: C.muted, fontSize: 12 },
  signIn: { ...column, paddingHorizontal: S.lg, paddingBottom: S.lg },
  fields: { paddingHorizontal: S.lg, paddingBottom: S.lg, gap: 2 },
  warn: {
    color: C.warn,
    fontSize: 11.5,
    lineHeight: 17,
    marginBottom: S.sm,
    backgroundColor: '#fff7ed',
    borderRadius: R.sm,
    padding: S.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingVertical: S.sm,
    paddingHorizontal: S.sm,
    borderRadius: R.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  fieldLabel: { color: C.muted, fontSize: 11, textTransform: 'capitalize' },
  fieldValue: { color: C.navy, fontSize: 14, fontWeight: '600' },
  copied: { color: C.good, fontSize: 11, fontWeight: '800' },
  copyAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
    minHeight: TAP,
    marginBottom: S.sm,
    backgroundColor: C.blue,
    borderRadius: R.md,
  },
  copyAllText: { color: C.white, fontSize: 13, fontWeight: '700' },
});
