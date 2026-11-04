/** The handful of shared pieces every screen is built from. */
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, CHROME_FONT_SCALE, R, S, TAP, card, column } from '../theme';

/**
 * True when the screen is effectively narrow: a 320pt phone, or a normal phone
 * with large system text (390pt at 1.3x font reads like 300pt). Layouts that
 * put two controls side by side should stack them when this is true.
 */
export function useCompact(): boolean {
  const { width, fontScale } = useWindowDimensions();
  return width / Math.max(fontScale, 1) < 360;
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[card, style]}>{children}</View>;
}

export function Title({ children, style, ...rest }: TextProps) {
  return (
    <Text style={[s.title, style]} {...rest}>
      {children}
    </Text>
  );
}

export function Muted({ children, style, ...rest }: TextProps) {
  return (
    <Text style={[s.muted, style]} {...rest}>
      {children}
    </Text>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={s.section}>{children}</Text>;
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[s.badge, { backgroundColor: `${color}1a`, borderColor: `${color}55` }]}>
      <Text style={[s.badgeText, { color }]} maxFontSizeMultiplier={CHROME_FONT_SCALE}>
        {label}
      </Text>
    </View>
  );
}

/** A horizontal row of filter pills. */
export function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // ScrollView defaults to flexGrow/flexShrink 1. Pin the row to its content
      // height, or a tall layout (large text) squeezes it and clips the labels.
      style={[column, { flexGrow: 0, flexShrink: 0 }]}
      contentContainerStyle={s.chipRow}
      keyboardShouldPersistTaps="handled"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            hitSlop={{ top: 6, bottom: 6 }}
            style={[s.chip, active && s.chipActive]}
          >
            <Text
              style={[s.chipText, active && s.chipTextActive]}
              maxFontSizeMultiplier={CHROME_FONT_SCALE}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const tone =
    variant === 'primary'
      ? { bg: C.blue, fg: C.white }
      : variant === 'danger'
        ? { bg: `${C.bad}14`, fg: C.bad }
        : { bg: C.white, fg: C.navy };
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        { backgroundColor: tone.bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        // Secondary sits on the canvas background, so it needs an edge to read as a button.
        variant === 'secondary' && { borderWidth: 1, borderColor: C.line },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={16} color={tone.fg} /> : null}
      {/* Wraps onto a second line instead of clipping when space or text size runs out. */}
      <Text
        style={[s.buttonText, { color: tone.fg }]}
        numberOfLines={2}
        maxFontSizeMultiplier={CHROME_FONT_SCALE}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={s.centre}>
      <ActivityIndicator color={C.blue} />
      <Muted style={{ marginTop: S.md }}>{label}</Muted>
    </View>
  );
}

export function Empty({
  icon = 'search-outline',
  title,
  body,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
}) {
  return (
    <View style={s.centre}>
      <Ionicons name={icon} size={40} color={C.line} />
      <Text style={[s.title, { marginTop: S.md, textAlign: 'center' }]}>{title}</Text>
      {body ? <Muted style={{ marginTop: S.xs, textAlign: 'center' }}>{body}</Muted> : null}
    </View>
  );
}

/** Labelled text input used by every partner form. */
export function Field({
  label,
  hint,
  style,
  ...input
}: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        placeholderTextColor={C.muted}
        {...input}
        style={[s.input, input.multiline && s.inputMulti, style]}
      />
      {hint ? <Muted style={{ fontSize: 12 }}>{hint}</Muted> : null}
    </View>
  );
}

/** Search field with a clear button, sized for the content column. */
export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <View style={[column, s.searchWrap]}>
      <Ionicons name="search" size={16} color={C.muted} style={s.searchIcon} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        autoCorrect={false}
        returnKeyType="search"
        style={s.search}
      />
      {value ? (
        <Pressable accessibilityLabel="Clear search" hitSlop={12} onPress={() => onChange('')} style={s.searchClear}>
          <Ionicons name="close-circle" size={18} color={C.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Red notice box for a failed request or a form error. */
export function ErrorNote({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <View style={s.error}>
      <Ionicons name="alert-circle-outline" size={16} color={C.bad} />
      <Text style={s.errorText}>{text}</Text>
    </View>
  );
}

/**
 * A scrolling page in the 720pt column with pull-to-refresh. Keyboard-safe on
 * iOS and padded past the home indicator on stack screens.
 */
export function Page({
  children,
  refreshing,
  onRefresh,
  bottomInset = true,
}: {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  bottomInset?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          column,
          { padding: S.lg, gap: S.md, paddingBottom: S.xl + (bottomInset ? insets.bottom : 0) },
        ]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={C.blue} />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  label: { color: C.navy, fontSize: 14, fontWeight: '600' },
  input: {
    minHeight: 48,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.md,
    paddingHorizontal: S.md,
    color: C.navy,
    fontSize: 15,
  },
  inputMulti: { minHeight: 96, paddingTop: S.md, textAlignVertical: 'top' },
  searchWrap: { justifyContent: 'center', paddingHorizontal: S.lg, paddingTop: S.xs },
  searchIcon: { position: 'absolute', left: S.lg + S.md, top: S.xs + 15, zIndex: 1 },
  search: {
    height: TAP,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.pill,
    paddingLeft: 38,
    paddingRight: 40,
    color: C.navy,
    fontSize: 14,
  },
  searchClear: { position: 'absolute', right: S.lg + S.md, top: S.xs + 13 },
  error: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: S.sm,
    padding: S.md,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: `${C.bad}33`,
    backgroundColor: `${C.bad}0d`,
  },
  errorText: { flex: 1, color: C.bad, fontSize: 13, fontWeight: '600' },
  title: { color: C.navy, fontSize: 16, fontWeight: '700' },
  muted: { color: C.muted, fontSize: 13, lineHeight: 19 },
  section: {
    color: C.navy,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: S.sm,
  },
  badge: {
    paddingHorizontal: S.sm,
    paddingVertical: 3,
    borderRadius: R.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  chipRow: { gap: S.sm, paddingHorizontal: S.lg, paddingVertical: S.md },
  chip: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: S.md,
    paddingVertical: S.sm,
    borderRadius: R.pill,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
  },
  chipActive: { backgroundColor: C.blue, borderColor: C.blue },
  chipText: { color: C.navy, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: C.white },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
    minHeight: TAP,
    paddingVertical: S.sm,
    paddingHorizontal: S.lg,
    borderRadius: R.md,
  },
  buttonText: { fontSize: 14, fontWeight: '700', flexShrink: 1, textAlign: 'center' },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: S.xl, gap: 2 },
});
