import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, type LongPressEvent } from "react-native-maps";
import type { MapMarker } from "../types";

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
    setIsMapReady(false);
    setIsMapTimedOut(false);
    setMapAttempt((previous) => previous + 1);
  };

  return (
    <View style={styles.container}>
      <MapView
        key={mapAttempt}
        style={styles.map}
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
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={`Маркер ${marker.id}`}
            onPress={() => {
              onMarkerPress(marker);
            }}
          />
        ))}
      </MapView>

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
});
