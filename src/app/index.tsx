import { useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import { useEffect } from "react";
import { Alert, StyleSheet, View } from "react-native";
import Map from "../components/map";
import { useMarkers } from "../context/markersContext";
import type { MapMarker } from "../types";

export default function IndexScreen() {
  const router = useRouter();
  const { markers, addMarker } = useMarkers();

  useEffect(() => {
    const initialize = async () => {
      try {
        const db = await SQLite.openDatabaseAsync("markers.db");
        const version = await db.getFirstAsync<{ version: string }>(
          "SELECT sqlite_version() AS version",
        );
        await db.closeAsync();
      } catch (error) {
        console.error("Тест SQLite не пройден:", error);
      }
    };

    void initialize();
  }, []);

  const handleMarkerPress = (marker: MapMarker) => {
    try {
      router.push({
        pathname: "/marker/[id]",
        params: { id: marker.id },
      });
    } catch (error) {
      console.error("INDEX: ошибка навигации", error);
      Alert.alert("Ошибка", "Не удалось открыть экран маркера.");
    }
  };

  return (
    <View style={styles.container}>
      <Map
        markers={markers}
        onAddMarker={addMarker}
        onMarkerPress={handleMarkerPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
