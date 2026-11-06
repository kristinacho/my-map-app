import {
    Alert,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import type { MarkerImage } from "../types";

interface ImageListProps {
  images: MarkerImage[];
  onRemoveImage: (imageId: string) => void;
}

export default function ImageList({ images, onRemoveImage }: ImageListProps) {
  if (images.length === 0) {
    return (
      <Text style={styles.empty}>Для этого маркера пока нет изображений.</Text>
    );
  }

  const confirmRemove = (imageId: string) => {
    Alert.alert(
      "Удалить изображение?",
      "Изображение исчезнет из списка маркера.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => onRemoveImage(imageId),
        },
      ],
    );
  };

  return (
    <FlatList
      data={images}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Image
            source={{ uri: item.uri }}
            style={styles.image}
            resizeMode="cover"
            onError={() =>
              Alert.alert("Ошибка", "Не удалось загрузить изображение.")
            }
          />
          <Pressable
            style={styles.removeButton}
            onPress={() => confirmRemove(item.id)}
            accessibilityRole="button"
            accessibilityLabel="Удалить изображение"
          >
            <Text style={styles.removeText}>Удалить</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  empty: { color: "#666" },
  item: { marginBottom: 16, gap: 8 },
  image: {
    width: "100%",
    height: 190,
    borderRadius: 10,
    backgroundColor: "#e5e7eb",
  },
  removeButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
  },
  removeText: { color: "#991b1b", fontWeight: "600" },
});
