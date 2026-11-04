/**
 * MeeSeva and CSC centres near you, on a map and nearest first.
 * GET /partners/directory?type=meeseva,csc&lat&lng. Location is asked only on
 * this screen; without it the list falls back to the profile's state, unsorted.
 * Walk / Drive hand the route to the phone's maps app, which knows the roads.
 */
import type { PartnerDirectoryResponse, PartnerSummary } from '@applyfields/types';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, Button, Empty, Loading, Muted } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useApi } from '@/lib/use-api';
import { C, R, S, TAP, card, column } from '@/theme';

type Point = { lat: number; lng: number };

const TYPE_LABEL: Record<string, string> = { meeseva: 'MeeSeva', csc: 'CSC' };

/** Google's universal directions link: opens the Maps app if installed, else the browser. */
function directions(p: PartnerSummary, mode: 'walking' | 'driving') {
  const to =
    p.latitude !== null && p.longitude !== null
      ? `${p.latitude},${p.longitude}`
      : encodeURIComponent([p.business_name, p.address, p.city].filter(Boolean).join(', '));
  void Linking.openURL(
    `https://www.google.com/maps/dir/?api=1&destination=${to}&travelmode=${mode}`,
  ).catch(() => undefined);
}

export default function Centres() {
  const { me } = useAuth();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView | null>(null);
  const [here, setHere] = useState<Point | null>(null);
  const [locating, setLocating] = useState(true);
  const [denied, setDenied] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (granted) {
        // A fresh fix can take ages indoors: use a recent one if the phone has it,
        // otherwise wait at most 10 s and fall back to the state list.
        const fix =
          (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 }).catch(() => null)) ??
          (await Promise.race([
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 10_000)),
          ]));
        if (fix) setHere({ lat: fix.coords.latitude, lng: fix.coords.longitude });
      } else {
        setDenied(true);
      }
      setLocating(false);
    })();
  }, []);

  // ~110 m precision is plenty for "nearest" and keeps the exact fix off the server.
  const state = me?.profile?.state_code;
  const path = locating
    ? null
    : here
      ? `/partners/directory?type=meeseva,csc&lat=${here.lat.toFixed(3)}&lng=${here.lng.toFixed(3)}&limit=30`
      : `/partners/directory?type=meeseva,csc&limit=30${state ? `&state=${state}` : ''}`;
  const { data, loading, error } = useApi<PartnerDirectoryResponse>(path);
  const items = data?.items ?? [];
  const pinned = items.filter((p) => p.latitude !== null && p.longitude !== null);

  const centre = here ?? (pinned[0] ? { lat: pinned[0].latitude!, lng: pinned[0].longitude! } : null);

  function focus(p: PartnerSummary) {
    setSelected(p.id);
    if (p.latitude === null || p.longitude === null) return;
    mapRef.current?.animateToRegion(
      { latitude: p.latitude, longitude: p.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      350,
    );
  }

  if (locating || (loading && !data)) {
    return <Loading label={locating ? 'Finding where you are…' : 'Finding centres near you…'} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      {centre ? (
        <MapView
          ref={mapRef}
          style={s.map}
          initialRegion={{
            latitude: centre.lat,
            longitude: centre.lng,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }}
          showsUserLocation={!!here}
          showsMyLocationButton={!!here}
        >
          {pinned.map((p) => (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.latitude!, longitude: p.longitude! }}
              title={p.business_name}
              description={p.distance_km !== undefined ? `${p.distance_km} km away` : p.address ?? undefined}
              pinColor={p.id === selected ? C.blue : C.navy}
              onPress={() => setSelected(p.id)}
            />
          ))}
        </MapView>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(p) => p.id}
        contentContainerStyle={[column, s.list, { paddingBottom: S.xl + insets.bottom }]}
        ListHeaderComponent={
          here ? (
            <Muted>Nearest first · straight-line distance. Walk or Drive for the real route.</Muted>
          ) : (
            <Muted>
              {denied ? 'Allow location to sort by distance.' : 'Could not get your location right now.'}
              {state ? ` Showing centres in ${state}.` : ''}
            </Muted>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => focus(item)}
            style={[card, s.card, item.id === selected && { borderColor: C.blue }]}
          >
            <View style={s.top}>
              <Badge label={TYPE_LABEL[item.type] ?? item.type} color={C.blue} />
              {item.distance_km !== undefined ? (
                <Text style={s.km}>{item.distance_km} km away</Text>
              ) : null}
            </View>
            <Text style={s.name}>{item.business_name}</Text>
            {item.address ? (
              <Muted numberOfLines={2}>
                {[item.address, item.city, item.pincode].filter(Boolean).join(', ')}
              </Muted>
            ) : null}
            <View style={s.actions}>
              <Button
                label="Walk"
                icon="walk-outline"
                variant="secondary"
                style={{ flex: 1 }}
                onPress={() => directions(item, 'walking')}
              />
              <Button
                label="Drive"
                icon="car-outline"
                variant="secondary"
                style={{ flex: 1 }}
                onPress={() => directions(item, 'driving')}
              />
              {item.phone ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${item.business_name}`}
                  onPress={() => Linking.openURL(`tel:${item.phone}`).catch(() => undefined)}
                  style={s.call}
                >
                  <Ionicons name="call-outline" size={18} color={C.blue} />
                </Pressable>
              ) : null}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          error ? (
            <Empty icon="cloud-offline-outline" title="Could not load" body={error} />
          ) : (
            <Empty
              icon="business-outline"
              title="No verified centres listed here yet"
              body="Centres join ApplyFields every week. Check back soon."
            />
          )
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  map: { height: '40%', width: '100%' },
  list: { padding: S.lg, gap: S.md, flexGrow: 1 },
  card: { padding: S.lg, gap: 6 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: S.sm },
  km: { color: C.navy, fontSize: 13, fontWeight: '800' },
  name: { color: C.navy, fontSize: 16, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginTop: S.sm },
  call: {
    width: TAP,
    height: TAP,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
  },
});
