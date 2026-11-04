import type { OpportunityCard as Card_ } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ELIGIBILITY, TYPE_LABEL, deadline } from '../lib/format';
import { C, R, S, card } from '../theme';

interface TileConfig {
  bg: string;
  fg: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const TILE_MAP: Record<string, TileConfig> = {
  exam: { bg: '#E0EDFB', fg: '#0E7BF4', icon: 'school' },
  govt_job: { bg: '#ECFDF5', fg: '#059669', icon: 'briefcase' },
  scholarship: { bg: '#FEF3C7', fg: '#B45309', icon: 'ribbon' },
  admission: { bg: '#F3E8FF', fg: '#7C3AED', icon: 'book' },
};

export function OpportunityCard({ item }: { item: Card_ }) {
  const router = useRouter();
  const d = deadline(item.days_left);
  const elig = item.eligibility ? ELIGIBILITY[item.eligibility] : null;
  const tile = TILE_MAP[item.type] ?? TILE_MAP.govt_job;
  const isUrgent = typeof item.days_left === 'number' && item.days_left <= 7 && item.days_left >= 0;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/opportunity/${item.slug}`)}
      style={({ pressed }) => [card, s.wrap, pressed && { opacity: 0.92 }]}
    >
      {/* Header with IconTile, Title/Org, and Bookmark */}
      <View style={s.headerRow}>
        <View style={[s.iconTile, { backgroundColor: tile.bg }]}>
          <Ionicons name={tile.icon} size={20} color={tile.fg} />
        </View>

        <View style={s.headerContent}>
          <Text style={s.org} numberOfLines={1}>
            {item.organization}
          </Text>
          <Text style={s.title} numberOfLines={2}>
            {item.title}
          </Text>
        </View>

        <View style={s.bookmark}>
          <Ionicons
            name={item.saved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={item.saved ? '#0E7BF4' : '#94A3B8'}
          />
        </View>
      </View>

      {/* Soft Pill Badges Row */}
      <View style={s.badgeRow}>
        <View style={s.typePill}>
          <Text style={s.typePillText}>{TYPE_LABEL[item.type]}</Text>
        </View>

        {isUrgent && (
          <View style={s.urgentPill}>
            <Ionicons name="flame" size={11} color="#B45309" />
            <Text style={s.urgentPillText}>{d.label}</Text>
          </View>
        )}

        {elig && (
          <View
            style={[
              s.eligPill,
              { backgroundColor: `${elig.color}15`, borderColor: `${elig.color}35` },
            ]}
          >
            <Text style={[s.eligPillText, { color: elig.color }]}>{elig.label}</Text>
          </View>
        )}

        {typeof item.match_score === 'number' && (
          <View style={s.matchPill}>
            <Text style={s.matchPillText}>{item.match_score}% match</Text>
          </View>
        )}
      </View>

      {/* Metadata (Location, Qualification, Vacancies) */}
      <View style={s.metaRow}>
        <Meta icon="location-outline" text={item.location} />
        {item.qualification ? <Meta icon="school-outline" text={item.qualification} /> : null}
        {item.vacancies ? (
          <Meta icon="people-outline" text={`${item.vacancies.toLocaleString('en-IN')} posts`} />
        ) : null}
      </View>

      {/* Footer */}
      <View style={s.footer}>
        <View style={s.deadlineContainer}>
          <Ionicons name="time-outline" size={13.5} color={d.color} />
          <Text style={[s.deadlineText, { color: d.color }]}>{d.label}</Text>
        </View>
        <View style={s.arrowLink}>
          <Text style={s.viewDetailsText}>View details</Text>
          <Ionicons name="chevron-forward" size={13} color="#0E7BF4" />
        </View>
      </View>
    </Pressable>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={s.meta}>
      <Ionicons name={icon} size={13} color={C.muted} />
      <Text style={s.metaText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    padding: S.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(8, 32, 70, 0.08)',
    backgroundColor: C.white,
    shadowColor: C.navy,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: S.sm,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerContent: {
    flex: 1,
    minWidth: 0,
  },
  org: {
    color: C.mutedNavy,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  title: {
    color: C.navy,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    marginTop: 2,
  },
  bookmark: {
    padding: 2,
    flexShrink: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  typePill: {
    backgroundColor: '#E0EDFB',
    borderRadius: R.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  typePillText: {
    color: '#0E7BF4',
    fontSize: 11,
    fontWeight: '700',
  },
  urgentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    borderRadius: R.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  urgentPillText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
  },
  eligPill: {
    borderRadius: R.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
  },
  eligPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  matchPill: {
    backgroundColor: '#E0EDFB',
    borderRadius: R.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  matchPillText: {
    color: '#0E7BF4',
    fontSize: 11,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.md,
    marginTop: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  metaText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: S.md,
    marginTop: 4,
    paddingTop: S.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(8, 32, 70, 0.06)',
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deadlineText: {
    fontSize: 12,
    fontWeight: '700',
  },
  arrowLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    color: '#0E7BF4',
    fontSize: 12,
    fontWeight: '700',
  },
});
