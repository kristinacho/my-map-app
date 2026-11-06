import { useRouter } from "expo-router";
import { Alert, StyleSheet, View } from "react-native";
import Map from "../components/map";
import { useMarkers } from "../context/markersContext";
import type { MapMarker } from "../types";

export default function IndexScreen() {
  const router = useRouter();
  const { markers, addMarker } = useMarkers();

  const handleMarkerPress = (marker: MapMarker) => {
    try {
      router.push({
        pathname: "/marker/[id]",
        params: { id: marker.id },
      });
    } catch {
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
  container: {
    flex: 1,
  },
});
