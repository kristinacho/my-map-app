import { useEffect, useRef, useState } from "react";
import {
    clearProximityNotification,
    requestNotificationPermission,
    showProximityNotification,
} from "../services/notifications";
import type { MapMarker } from "../types";
import { getDistanceMeters } from "../utils/distance";

const NOTIFICATION_RADIUS_METERS = 100;

type Coordinates = {
  latitude: number;
  longitude: number;
};

export function useProximityNotifications(
  coordinates: Coordinates | null,
  markers: MapMarker[],
) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(
    null,
  );

  // id метки -> id отправленного уведомления.
  // useRef сохраняет данные между обновлениями React-компонента.
  const activeNotificationsRef = useRef(new Map<string, string>());
  // Защищает от двух параллельных отправок для одной метки.
  const pendingRef = useRef(new Set<string>());
  // Метки, внутри радиуса которых пользователь находится СЕЙЧАС.
  const insideRef = useRef(new Set<string>());

  // Разрешение на уведомления спрашиваем один раз при открытии карты.
  useEffect(() => {
    let cancelled = false;

    async function checkPermission() {
      try {
        const granted = await requestNotificationPermission();
        if (cancelled) return;

        setNotificationsEnabled(granted);
        if (!granted) {
          setNotificationError(
            "Уведомления запрещены. Разреши их в настройках iPhone.",
          );
        } else {
          setNotificationError(null);
        }
      } catch (error) {
        if (cancelled) return;
        setNotificationError(
          error instanceof Error
            ? error.message
            : "Не удалось получить разрешение на уведомления.",
        );
      }
    }

    void checkPermission();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!coordinates) return;

    const inside = new Set<string>();

    for (const marker of markers) {
      const distance = getDistanceMeters(
        coordinates.latitude,
        coordinates.longitude,
        marker.latitude,
        marker.longitude,
      );

      if (distance <= NOTIFICATION_RADIUS_METERS) {
        inside.add(marker.id);
      }
    }

    insideRef.current = inside;

    // Выход из радиуса (или удаление метки): забываем старое уведомление.
    for (const [markerId, notificationId] of activeNotificationsRef.current) {
      if (!inside.has(markerId)) {
        activeNotificationsRef.current.delete(markerId);

        void clearProximityNotification(markerId, notificationId).catch(
          (error) => console.warn("Не удалось очистить уведомление:", error),
        );
      }
    }

    if (!notificationsEnabled) return;

    // Вход в радиус: отправляем только для ещё не обработанных меток.
    for (const markerId of inside) {
      if (
        activeNotificationsRef.current.has(markerId) ||
        pendingRef.current.has(markerId)
      ) {
        continue;
      }

      // Ставим отметку ДО асинхронного вызова, чтобы избежать дублей.
      pendingRef.current.add(markerId);

      void showProximityNotification(markerId)
        .then((notificationId) => {
          pendingRef.current.delete(markerId);

          // GPS мог измениться, пока отправлялось уведомление.
          if (!insideRef.current.has(markerId)) {
            void clearProximityNotification(markerId, notificationId).catch(
              (error) => console.warn("Ошибка очистки уведомления:", error),
            );
            return;
          }

          activeNotificationsRef.current.set(markerId, notificationId);
        })
        .catch((error) => {
          pendingRef.current.delete(markerId);
          console.warn("Не удалось показать уведомление:", error);
        });
    }
  }, [coordinates, markers, notificationsEnabled]);

  return { notificationsEnabled, notificationError };
}
