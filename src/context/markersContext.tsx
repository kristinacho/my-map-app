import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Alert } from "react-native";
import { useDatabase } from "../contexts/databaseContext";
import type { MapMarker } from "../types";
import { deleteSavedMarkerImage, saveMarkerImage } from "../utils/markerImages";

interface MarkersContextValue {
  markers: MapMarker[];
  addMarker: (latitude: number, longitude: number) => Promise<void>;
  getMarkerById: (id: string) => MapMarker | undefined;
  addImageToMarker: (markerId: string, uri: string) => Promise<void>;
  removeImageFromMarker: (markerId: string, imageId: string) => Promise<void>;
  deleteMarker: (id: string) => Promise<void>;
}

const MarkersContext = createContext<MarkersContextValue | undefined>(
  undefined,
);

export function MarkersProvider({ children }: { children: ReactNode }) {
  const { deleteMarker: deleteMarkerFromDatabase } = useDatabase();
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const {
    isReady,
    getMarkers,
    addMarker: insertMarker,
    getMarkerImages,
    addImage: insertImage,
    deleteImage: removeImage,
  } = useDatabase();

  useEffect(() => {
    if (!isReady) return;
    let cancelled = false;

    async function loadData() {
      try {
        const markerRows = await getMarkers();
        const loadedMarkers: MapMarker[] = await Promise.all(
          markerRows.map(async (row) => {
            const imageRows = await getMarkerImages(row.id);
            return {
              id: String(row.id),
              latitude: row.latitude,
              longitude: row.longitude,
              images: imageRows.map((image) => ({
                id: String(image.id),
                uri: image.uri,
              })),
            };
          }),
        );

        if (!cancelled) {
          setMarkers(loadedMarkers);
        }
      } catch (error) {
        console.error("SQLite: ошибка загрузки маркеров и фотографий", error);
        if (!cancelled)
          Alert.alert("Ошибка", "Не удалось загрузить данные из базы.");
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
    // Загрузка выполняется при готовности БД; функции контекста пока не мемоизированы.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  const addMarker = async (latitude: number, longitude: number) => {
    try {
      const id = await insertMarker(latitude, longitude);
      setMarkers((previous) => [
        ...previous,
        {
          id: String(id),
          latitude,
          longitude,
          images: [],
        },
      ]);
    } catch (error) {
      console.error("SQLite: ошибка создания маркера", error);
      Alert.alert("Ошибка", "Не удалось сохранить маркер.");
    }
  };

  const getMarkerById = (id: string) =>
    markers.find((marker) => marker.id === id);

  const addImageToMarker = async (markerId: string, uri: string) => {
    let savedUri: string | null = null;
    try {
      const numericMarkerId = Number(markerId);
      if (!Number.isSafeInteger(numericMarkerId) || numericMarkerId <= 0) {
        throw new Error("Некорректный ID маркера");
      }

      savedUri = await saveMarkerImage(uri);
      await insertImage(numericMarkerId, savedUri);

      // Читаем реальные ID фотографий, которые выдала SQLite.
      const imageRows = await getMarkerImages(numericMarkerId);
      setMarkers((previous) =>
        previous.map((marker) =>
          marker.id === markerId
            ? {
                ...marker,
                images: imageRows.map((image) => ({
                  id: String(image.id),
                  uri: image.uri,
                })),
              }
            : marker,
        ),
      );
      savedUri = null; // Файл записан в БД, откатывать не нужно.
    } catch (error) {
      // Если SQL-вставка не удалась, удаляем только что скопированный файл.
      if (savedUri) {
        try {
          deleteSavedMarkerImage(savedUri);
        } catch (cleanupError) {
          console.warn(
            "Не удалось очистить временную копию изображения",
            cleanupError,
          );
        }
      }
      console.error("SQLite: ошибка добавления фотографии", error);
      Alert.alert("Ошибка", "Не удалось сохранить фотографию.");
    }
  };

  const removeImageFromMarker = async (markerId: string, imageId: string) => {
    try {
      const marker = markers.find((item) => item.id === markerId);
      const image = marker?.images.find((item) => item.id === imageId);
      const numericImageId = Number(imageId);
      if (
        !image ||
        !Number.isSafeInteger(numericImageId) ||
        numericImageId <= 0
      ) {
        throw new Error("Изображение не найдено");
      }

      await removeImage(numericImageId);
      setMarkers((previous) =>
        previous.map((item) =>
          item.id === markerId
            ? {
                ...item,
                images: item.images.filter((entry) => entry.id !== imageId),
              }
            : item,
        ),
      );

      // При ошибке удаления файла запись БД уже корректно удалена.
      try {
        deleteSavedMarkerImage(image.uri);
      } catch (cleanupError) {
        console.warn("Не удалось удалить файл фотографии", cleanupError);
      }
    } catch (error) {
      console.error("SQLite: ошибка удаления фотографии", error);
      Alert.alert("Ошибка", "Не удалось удалить фотографию.");
    }
  };

  const deleteMarker = async (id: string): Promise<void> => {
    await deleteMarkerFromDatabase(Number(id));

    setMarkers((previousMarkers) =>
      previousMarkers.filter((marker) => marker.id !== id),
    );
  };

  return (
    <MarkersContext.Provider
      value={{
        markers,
        addMarker,
        getMarkerById,
        addImageToMarker,
        removeImageFromMarker,
        deleteMarker,
      }}
    >
      {children}
    </MarkersContext.Provider>
  );
}

export function useMarkers() {
  const context = useContext(MarkersContext);
  if (!context)
    throw new Error("useMarkers должен использоваться внутри MarkersProvider");
  return context;
}
