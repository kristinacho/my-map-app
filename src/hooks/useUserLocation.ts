import * as Location from "expo-location";
import { useEffect, useState } from "react";

type Coordinates = {
  latitude: number;
  longitude: number;
};

export function useUserLocation() {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;

    async function startTracking() {
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          if (!cancelled) setError("На устройстве выключена геолокация.");
          return;
        }

        const permission = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;

        if (permission.status !== "granted") {
          setError("Нет разрешения на доступ к местоположению.");
          return;
        }

        setPermissionGranted(true);
        setError(null);

        const newSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 5,
          },
          (location) => {
            if (cancelled) return;

            setCoordinates({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          },
        );

        if (cancelled) {
          newSubscription.remove();
        } else {
          subscription = newSubscription;
        }
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Не удалось получить местоположение.",
          );
        }
      }
    }

    void startTracking();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  return { coordinates, permissionGranted, error };
}
