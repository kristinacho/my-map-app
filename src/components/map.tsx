import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, type LongPressEvent } from "react-native-maps";
import { useProximityNotifications } from "../hooks/useProximityNotifications";
import { useUserLocation } from "../hooks/useUserLocation";
import type { MapMarker } from "../types";
import { formatDistance, getDistanceMeters } from "../utils/distance";

interface MapProps {
  markers: MapMarker[];
  onAddMarker: (latitude: number, longitude: number) => void;
  onMarkerPress: (marker: MapMarker) => void;
}

const MAP_READY_TIMEOUT_MS = 15000;

export default function Map({ markers, onAddMarker, onMarkerPress }: MapProps) {
  const [isMapReady, setIsMapReady] = useState(false);
  const [isMapTimedOut, setIsMapTimedOut] = useState(false);
  const [mapAttempt, setMapAttempt] = useState(0);

  const mapRef = useRef<MapView>(null);
  const hasCenteredOnUser = useRef(false);

  useEffect(() => {
    if (isMapReady) return;

    const timeoutId = setTimeout(() => {
      setIsMapTimedOut(true);
    }, MAP_READY_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, [isMapReady, mapAttempt]);

  const handleLongPress = (event: LongPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    onAddMarker(latitude, longitude);
  };

  const retryLoading = () => {
    hasCenteredOnUser.current = false;
    setIsMapReady(false);
    setIsMapTimedOut(false);
    setMapAttempt((previous) => previous + 1);
  };

  const { coordinates, permissionGranted, error } = useUserLocation();
  useEffect(() => {
    if (!isMapReady || !coordinates || hasCenteredOnUser.current) {
      return;
    }

    mapRef.current?.animateToRegion(
      {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      800,
    );

    hasCenteredOnUser.current = true;
  }, [coordinates, isMapReady]);
  const { notificationsEnabled, notificationError } = useProximityNotifications(
    coordinates,
    markers,
  );

  const nearestMarker = coordinates
    ? markers
        .map((marker) => ({
          id: marker.id,
          distance: getDistanceMeters(
            coordinates.latitude,
            coordinates.longitude,
            marker.latitude,
            marker.longitude,
          ),
        }))
        .sort((a, b) => a.distance - b.distance)[0]
    : undefined;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        key={mapAttempt}
        style={styles.map}
        showsUserLocation={permissionGranted}
        initialRegion={{
          latitude: 55.7558,
          longitude: 37.6173,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        onMapReady={() => {
          setIsMapReady(true);
          setIsMapTimedOut(false);
        }}
        onLongPress={handleLongPress}
      >
        {markers.map((marker, index) => {
          const distance = coordinates
            ? getDistanceMeters(
                coordinates.latitude,
                coordinates.longitude,
                marker.latitude,
                marker.longitude,
              )
            : null;

          return (
            <Marker
              key={marker.id}
              coordinate={{
                latitude: marker.latitude,
                longitude: marker.longitude,
              }}
              title={`Маркер ${index + 1}`}
              description={
                distance === null
                  ? "Определяем местоположение…"
                  : `Расстояние: ${formatDistance(distance)}`
              }
              onPress={() => onMarkerPress(marker)}
            />
          );
        })}
      </MapView>

      {isMapReady && (
        <View style={styles.distancePanel}>
          {error ? (
            <Text style={styles.distanceText}>GPS: {error}</Text>
          ) : !coordinates ? (
            <Text style={styles.distanceText}>Определяем координаты…</Text>
          ) : nearestMarker ? (
            <Text style={styles.distanceText}>
              Ближайшая метка: {formatDistance(nearestMarker.distance)}
            </Text>
          ) : (
            <Text style={styles.distanceText}>
              Добавь метку долгим нажатием на карту
            </Text>
          )}
        </View>
      )}

      {!isMapReady && (
        <View style={styles.overlay}>
          {isMapTimedOut ? (
            <>
              <Text style={styles.message}>
                Карта долго не отвечает. Проверь подключение и попробуй ещё раз.
              </Text>
              <Pressable
                style={styles.retryButton}
                onPress={retryLoading}
                accessibilityRole="button"
              >
                <Text style={styles.retryText}>Повторить</Text>
              </Pressable>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" />
              <Text style={styles.message}>Загрузка карты…</Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  message: {
    textAlign: "center",
    fontSize: 16,
    color: "#333",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#2563eb",
  },
  retryText: { color: "#fff", fontWeight: "600" },

  distancePanel: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  distanceText: {
    color: "#222",
    fontSize: 14,
    textAlign: "center",
  },
});
