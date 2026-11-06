import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import ImageList from "../../components/imageList";
import { useMarkers } from "../../context/markersContext";

export default function MarkerDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMarkerById, addImageToMarker, removeImageFromMarker } =
    useMarkers();
  const [isPickingImage, setIsPickingImage] = useState(false);

  const marker = typeof id === "string" ? getMarkerById(id) : undefined;

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const pickImage = async () => {
    if (!marker || isPickingImage) return;

    setIsPickingImage(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled) return;

      const uri = result.assets?.[0]?.uri;
      if (!uri) {
        Alert.alert("Ошибка", "Не удалось получить выбранное изображение.");
        return;
      }

      addImageToMarker(marker.id, uri);
    } catch (error) {
      console.error("Ошибка выбора изображения:", error);
      Alert.alert(
        "Ошибка",
        "Не удалось выбрать изображение. Попробуй ещё раз.",
      );
    } finally {
      setIsPickingImage(false);
    }
  };

  if (!marker) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Маркер не найден</Text>
        <Text>
          Возможно, данные были сброшены после перезапуска приложения.
        </Text>
        <Pressable style={styles.button} onPress={goBack}>
          <Text style={styles.buttonText}>Вернуться на карту</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Детали маркера</Text>
      <Text style={styles.label}>Широта: {marker.latitude.toFixed(5)}</Text>
      <Text style={styles.label}>Долгота: {marker.longitude.toFixed(5)}</Text>

      <Text style={styles.sectionTitle}>
        Изображения ({marker.images.length})
      </Text>
      <ImageList
        images={marker.images}
        onRemoveImage={(imageId) => removeImageFromMarker(marker.id, imageId)}
      />

      <Pressable
        style={[styles.button, isPickingImage && styles.disabledButton]}
        onPress={pickImage}
        disabled={isPickingImage}
      >
        <Text style={styles.buttonText}>
          {isPickingImage ? "Открываем галерею…" : "Добавить изображение"}
        </Text>
      </Pressable>

      <Pressable style={styles.backButton} onPress={goBack}>
        <Text style={styles.backText}>Вернуться на карту</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 36, gap: 12 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  label: { fontSize: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "600", marginTop: 20 },
  button: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "600" },
  backButton: { padding: 14, alignItems: "center", marginTop: 8 },
  backText: { color: "#2563eb", fontWeight: "600" },
});
