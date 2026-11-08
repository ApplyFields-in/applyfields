/**
 * Fieldy, the AI advisor — the website's chat (POST /chatbot/query, 3 free chats a
 * day) as a full screen. The mascot follows the conversation: waves on open,
 * "working" while you type, thinking (looping) until the answer lands, a cheer
 * when it does, dozing when left alone. Shortcuts open app screens and never
 * use a chat.
 */
import type { ChatbotAction, ChatbotQueryInput, ChatbotQueryResponse } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FieldyMascot, type FieldyMood } from '@/components/fieldy-mascot';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { recordMascotEvent } from '@/services/mascot/IconManager';
import { C, R, S, column } from '@/theme';

const WEB = 'https://applyfields.com';
const BORED_AFTER_MS = 25_000;
const TYPING_PAUSE_MS = 2_500;

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  actions?: ChatbotAction[];
  related?: string[];
}

interface Quota {
  daily_limit: number;
  queries_remaining: number;
  is_premium: boolean;
  limit_reached: boolean;
}

// Kept for the app session, like the website keeps it per browser tab.
let history: Message[] = [];

const CAPTION: Record<FieldyMood, string> = {
  idle: 'Your first move starts here',
  greeting: 'Hi! Ask me anything',
  working: 'Reading along…',
  thinking: 'Thinking…',
  success: 'Here you go!',
  'bored-idle': 'Still here when you need me',
};

const PROMPTS = [
  'Which exams are closing this week?',
  'What are the top government recruitments open now?',
  'Show my saved applications',
  'How can I get help filing my application at a CSC kiosk?',
];

type Shortcut = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  to: Href;
  needsSignIn?: boolean;
};
const SHORTCUTS: Shortcut[] = [
  {
    label: 'Deadlines',
    icon: 'time-outline',
    to: { pathname: '/', params: { deadline: 'closing_soon' } },
  },
  {
    label: 'Suits me',
    icon: 'checkmark-circle-outline',
    to: { pathname: '/', params: { eligible: '1' } },
    needsSignIn: true,
  },
  { label: 'Alerts', icon: 'notifications-outline', to: '/alerts' },
  { label: 'Saved', icon: 'bookmark-outline', to: '/saved' },
  { label: 'Help centres', icon: 'storefront-outline', to: '/centres' },
];

/** The bot's light markdown: ## headings, **bold**, bullets, numbered lines, > notes. */
function Markdown({ text, onLink }: { text: string; onLink: (url: string) => void }) {
  const boldOnly = (s: string, k: string) =>
    s.split(/\*\*(.*?)\*\*/g).map((part, i) =>
      i % 2 ? (
        <Text key={`${k}b${i}`} style={{ fontWeight: '800', color: C.navy }}>
          {part}
        </Text>
      ) : (
        part
      ),
    );
  // [title](/apply/jobs/slug) -> tappable title (bold inside the brackets is kept)
  const bold = (line: string) =>
    line.split(/\[([^\]]+)\]\(([^)\s]+)\)/g).flatMap((part, i, all) => {
      if (i % 3 === 0) return boldOnly(part, `t${i}`);
      if (i % 3 === 2) return [];
      const url = all[i + 1];
      return [
        <Text key={`l${i}`} style={md.link} onPress={() => onLink(url)} accessibilityRole="link">
          {boldOnly(part, `l${i}`)}
        </Text>,
      ];
    });
  return (
    <View style={{ gap: 2 }}>
      {text.split('\n').map((raw, i) => {
        const line = raw.replace(/`/g, '');
        if (!line.trim()) return <View key={i} style={{ height: 4 }} />;
        const heading = line.match(/^#{2,4}\s+(.*)/);
        if (heading)
          return (
            <Text key={i} style={md.h}>
              {bold(heading[1])}
            </Text>
          );
        if (line.startsWith('> '))
          return (
            <Text key={i} style={md.note}>
              {bold(line.slice(2))}
            </Text>
          );
        const bullet = line.match(/^(?:[•-]|(\d+)\.)\s*(.*)/);
        if (bullet) {
          return (
            <View key={i} style={{ flexDirection: 'row', gap: 6 }}>
              <Text style={md.mark}>{bullet[1] ? `${bullet[1]}.` : '•'}</Text>
              <Text style={[md.p, { flex: 1 }]}>{bold(bullet[2])}</Text>
            </View>
          );
        }
        return (
          <Text key={i} style={md.p}>
            {bold(line)}
          </Text>
        );
      })}
    </View>
  );
}

export default function Assistant() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signedIn } = useAuth();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [messages, setMessages] = useState<Message[]>(history);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quota, setQuota] = useState<Quota | null>(null);

  const [mood, setMood] = useState<FieldyMood>('greeting');
  const [replay, setReplay] = useState(0);
  const boredTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function react(next: FieldyMood) {
    setMood(next);
    clearTimeout(boredTimer.current);
    if (next !== 'thinking')
      boredTimer.current = setTimeout(() => setMood('bored-idle'), BORED_AFTER_MS);
  }

  useEffect(() => {
    react('greeting');
    void api.get<Quota>('/chatbot/quota').then((res) => res.data && setQuota(res.data));
    return () => {
      clearTimeout(boredTimer.current);
      clearTimeout(typingTimer.current);
    };
  }, []);

  useEffect(() => {
    history = messages;
  }, [messages]);

  function waveHello() {
    if (loading) return;
    react('greeting');
    setReplay((n) => n + 1);
  }

  function onTyping(value: string) {
    setInput(value);
    if (loading) return;
    react(value.trim() ? 'working' : 'idle');
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => react('idle'), TYPING_PAUSE_MS);
  }

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading || quota?.limit_reached) return;
    const userMsg: Message = { id: `u${Date.now()}`, sender: 'user', text: q };
    const before = messages;
    setMessages([...before, userMsg]);
    setInput('');
    setLoading(true);
    clearTimeout(typingTimer.current);
    react('thinking'); // loops until the answer (or an error) arrives
    recordMascotEvent({ type: 'research' }); // asking Fieldy counts toward the "thinking" app icon

    const payload: ChatbotQueryInput = {
      query: q,
      page_type: 'general',
      history: before.slice(-4).map((m) => ({ role: m.sender, content: m.text })),
    };
    const res = await api.post<ChatbotQueryResponse>('/chatbot/query', payload, 60_000); // a sleeping server can take ~50 s to wake
    const data = res.data;
    if (data && typeof data.queries_remaining === 'number') {
      setQuota({
        daily_limit: data.daily_limit ?? 3,
        queries_remaining: data.queries_remaining,
        is_premium: data.is_premium ?? false,
        limit_reached: data.limit_reached ?? false,
      });
    }
    setMessages((cur) => [
      ...cur,
      data
        ? {
            id: `b${Date.now()}`,
            sender: 'assistant',
            text: data.answer,
            actions: data.actions,
            related: data.related_queries,
          }
        : {
            id: `b${Date.now()}`,
            sender: 'assistant',
            text:
              res.status >= 400 && res.status < 500 && res.error
                ? res.error
                : 'Fieldy could not reach the server just now. Please try again in a moment.',
          },
    ]);
    setLoading(false);
    react(data && data.mode !== 'limit_reached' ? 'success' : 'idle');
  }

  async function runAction(a: ChatbotAction) {
    if (a.action === 'save' && a.item_slug) {
      const res = await api.put(
        `/saved/${a.item_type || 'opportunity'}/${encodeURIComponent(a.item_slug)}`,
      );
      if (res.error) router.push('/login');
      else react('success');
      return;
    }
    const url = a.url;
    if (!url) return;
    // Site paths that have an app screen open it; everything else opens in the in-app browser.
    const opp = url.match(/^\/(?:apply\/)?(?:jobs|exams|scholarships|admissions)\/([^/?#]+)/);
    if (opp) router.push(`/opportunity/${opp[1]}`);
    else if (url === '/saved') router.push('/saved');
    else void WebBrowser.openBrowserAsync(url.startsWith('http') ? url : `${WEB}${url}`);
  }

  function openShortcut(sc: Shortcut) {
    if (sc.needsSignIn && !signedIn) router.push('/login');
    else router.dismissTo(sc.to);
  }

  const remaining = quota?.is_premium
    ? 'Plus'
    : quota
      ? `${quota.queries_remaining}/${quota.daily_limit} left`
      : '';
  const blocked = !!quota?.limit_reached;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.canvas }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.header, { paddingTop: insets.top + S.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close Fieldy"
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons name="close" size={24} color={C.white} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Say hi to Fieldy"
          onPress={waveHello}
        >
          {/* The welcome card shows the big Fieldy before the first question; the thinking bubble during a wait. */}
          <FieldyMascot
            mood={messages.length && !loading ? mood : 'idle'}
            replay={replay}
            size={44}
            radius={14}
          />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>
            Fieldy <Text style={s.role}>· AI Advisor</Text>
          </Text>
          <Text style={s.caption} accessibilityLiveRegion="polite">
            {CAPTION[mood]}
          </Text>
        </View>
        {remaining ? (
          <View style={[s.quota, blocked && { backgroundColor: 'rgba(192,57,43,0.25)' }]}>
            <Text style={s.quotaText}>{remaining}</Text>
          </View>
        ) : null}
        {messages.length ? (
          <Pressable accessibilityLabel="Clear chat" onPress={() => setMessages([])} hitSlop={12}>
            <Ionicons name="refresh" size={20} color={C.white} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        ref={scroll}
        contentContainerStyle={[column, s.body]}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
      >
        <View style={s.welcome}>
          {messages.length === 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Say hi to Fieldy"
              onPress={waveHello}
            >
              <FieldyMascot mood={mood} replay={replay} size={112} radius={20} />
            </Pressable>
          ) : null}
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={s.welcomeTitle}>Ask Fieldy</Text>
            <Text style={s.welcomeBody}>
              Government jobs, closing dates, fee waivers, eligibility or career paths. Free
              accounts get <Text style={{ fontWeight: '800' }}>3 AI chats a day</Text>; shortcuts
              below are always free.
            </Text>
          </View>
        </View>

        {messages.length === 0 ? (
          <View style={{ gap: S.sm }}>
            <Text style={s.kicker}>TRY ASKING</Text>
            {PROMPTS.map((p) => (
              <Pressable
                key={p}
                disabled={blocked}
                onPress={() => send(p)}
                style={[s.prompt, blocked && { opacity: 0.5 }]}
              >
                <Text style={s.promptText}>{p}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {messages.map((m) =>
          m.sender === 'user' ? (
            <View key={m.id} style={s.userBubble}>
              <Text style={s.userText}>{m.text}</Text>
            </View>
          ) : (
            <View key={m.id} style={{ gap: S.xs }}>
              <View style={s.botBubble}>
                <Markdown
                  text={m.text}
                  onLink={(url) => runAction({ label: '', action: 'navigate', url })}
                />
                {m.actions?.length ? (
                  <View style={s.actions}>
                    {m.actions.map((a, i) => (
                      <Pressable key={i} onPress={() => runAction(a)} style={s.action}>
                        <Text style={s.actionText}>{a.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
              {m.related?.length ? (
                <View style={s.related}>
                  {m.related.map((r) => (
                    <Pressable
                      key={r}
                      disabled={blocked}
                      onPress={() => send(r)}
                      style={s.relatedChip}
                    >
                      <Text style={s.relatedText}>↳ {r}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          ),
        )}

        {loading ? (
          <View
            style={s.thinking}
            accessibilityRole="progressbar"
            accessibilityLabel="Fieldy is thinking"
          >
            <FieldyMascot mood="thinking" size={72} radius={14} />
            <Text style={s.thinkingText}>Fieldy is thinking…</Text>
          </View>
        ) : null}

        {blocked ? (
          <View style={s.limit}>
            <Text style={s.limitTitle}>Today's 3 free chats are used</Text>
            <Text style={s.welcomeBody}>
              They reset at midnight IST. The shortcuts below still work.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, S.sm) }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.shortcuts}
        >
          {SHORTCUTS.map((sc) => (
            <Pressable
              key={sc.label}
              accessibilityRole="link"
              onPress={() => openShortcut(sc)}
              style={s.shortcut}
            >
              <Ionicons name={sc.icon} size={14} color={C.blue} />
              <Text style={s.shortcutText}>{sc.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={[column, s.inputRow]}>
          <TextInput
            value={input}
            onChangeText={onTyping}
            editable={!blocked && !loading}
            placeholder={blocked ? 'Daily limit reached' : 'Ask about any exam, job or career…'}
            placeholderTextColor={C.muted}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
            style={s.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            disabled={!input.trim() || loading || blocked}
            onPress={() => send(input)}
            style={[s.send, (!input.trim() || loading || blocked) && { opacity: 0.4 }]}
          >
            <Ionicons name="send" size={18} color={C.white} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const md = StyleSheet.create({
  link: { color: C.blue, textDecorationLine: 'underline' },
  h: { fontSize: 15, fontWeight: '800', color: C.navy, marginTop: 4 },
  p: { fontSize: 14, lineHeight: 20, color: '#334a69' },
  mark: { fontSize: 14, lineHeight: 20, fontWeight: '800', color: C.blue },
  note: {
    fontSize: 13,
    color: C.navy,
    backgroundColor: C.ice,
    borderLeftWidth: 3,
    borderLeftColor: C.blue,
    padding: S.sm,
    borderRadius: R.sm,
    marginVertical: 2,
  },
});

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingHorizontal: S.lg,
    paddingBottom: S.md,
    backgroundColor: C.navy,
  },
  name: { color: C.white, fontSize: 16, fontWeight: '800' },
  role: { color: '#BFDBFE', fontSize: 12, fontWeight: '500' },
  caption: { color: '#DBEAFE', fontSize: 12, fontStyle: 'italic' },
  quota: {
    backgroundColor: 'rgba(16,185,129,0.25)',
    borderRadius: R.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  quotaText: { color: C.white, fontSize: 12, fontWeight: '800' },
  body: { padding: S.lg, gap: S.md },
  welcome: {
    flexDirection: 'row',
    gap: S.md,
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: R.card,
    borderWidth: 1,
    borderColor: C.lineBorder,
    padding: S.md,
  },
  welcomeTitle: { fontSize: 16, fontWeight: '800', color: C.navy },
  welcomeBody: { fontSize: 13, lineHeight: 19, color: C.mutedNavy },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: C.muted, marginTop: S.xs },
  prompt: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.md,
    paddingHorizontal: S.md,
    paddingVertical: 10,
  },
  promptText: { fontSize: 14, color: C.navy, fontWeight: '600' },
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    backgroundColor: C.blue,
    borderRadius: R.lg,
    borderBottomRightRadius: 4,
    paddingHorizontal: S.md,
    paddingVertical: 10,
  },
  userText: { color: C.white, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  botBubble: {
    alignSelf: 'flex-start',
    maxWidth: '92%',
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.lg,
    borderBottomLeftRadius: 4,
    padding: S.md,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.sm,
    marginTop: S.sm,
    paddingTop: S.sm,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  action: { backgroundColor: C.ice, borderRadius: R.sm, paddingHorizontal: 10, paddingVertical: 8 },
  actionText: { color: C.blue, fontSize: 13, fontWeight: '700' },
  related: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, maxWidth: '92%' },
  relatedChip: {
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    borderRadius: R.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  relatedText: { fontSize: 12, color: C.mutedNavy },
  thinking: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.lg,
    padding: S.sm,
    paddingRight: S.lg,
  },
  thinkingText: { fontSize: 13, color: C.mutedNavy, fontWeight: '600' },
  limit: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: R.lg,
    padding: S.md,
    gap: 4,
  },
  limitTitle: { fontSize: 14, fontWeight: '800', color: C.navy },
  footer: {
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.line,
    paddingTop: S.sm,
    gap: S.sm,
  },
  shortcuts: { gap: 6, paddingHorizontal: S.lg },
  shortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: R.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  shortcutText: { fontSize: 13, fontWeight: '700', color: C.navy },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingHorizontal: S.lg },
  input: {
    flex: 1,
    minHeight: 46,
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.inputBorder,
    borderRadius: R.md,
    paddingHorizontal: S.md,
    fontSize: 15,
    color: C.navy,
  },
  send: {
    width: 46,
    height: 46,
    borderRadius: R.md,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
