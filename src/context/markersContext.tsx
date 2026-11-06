import { createContext, useContext, useState, type ReactNode } from "react";
import type { MapMarker, MarkerImage } from "../types";

interface MarkersContextValue {
  markers: MapMarker[];
  addMarker: (latitude: number, longitude: number) => void;
  getMarkerById: (id: string) => MapMarker | undefined;
  addImageToMarker: (markerId: string, uri: string) => void;
  removeImageFromMarker: (markerId: string, imageId: string) => void;
}

const MarkersContext = createContext<MarkersContextValue | undefined>(
  undefined,
);

export function MarkersProvider({ children }: { children: ReactNode }) {
  const [markers, setMarkers] = useState<MapMarker[]>([]);

  const addMarker = (latitude: number, longitude: number) => {
    const newMarker: MapMarker = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      latitude,
      longitude,
      images: [],
    };

    setMarkers((previousMarkers) => [...previousMarkers, newMarker]);
  };

  const getMarkerById = (id: string) =>
    markers.find((marker) => marker.id === id);

  const addImageToMarker = (markerId: string, uri: string) => {
    const newImage: MarkerImage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      uri,
    };

    setMarkers((previousMarkers) =>
      previousMarkers.map((marker) =>
        marker.id === markerId
          ? { ...marker, images: [...marker.images, newImage] }
          : marker,
      ),
    );
  };

  const removeImageFromMarker = (markerId: string, imageId: string) => {
    setMarkers((previousMarkers) =>
      previousMarkers.map((marker) =>
        marker.id === markerId
          ? {
              ...marker,
              images: marker.images.filter((image) => image.id !== imageId),
            }
          : marker,
      ),
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
      }}
    >
      {children}
    </MarkersContext.Provider>
  );
}

export function useMarkers() {
  const context = useContext(MarkersContext);

  if (!context) {
    throw new Error("useMarkers должен использоваться внутри MarkersProvider");
  }

  return context;
}
