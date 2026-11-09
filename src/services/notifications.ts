import * as Notifications from "expo-notifications";

// Явно разрешаем показывать баннер, когда приложение открыто.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Запросить у пользователя разрешение показывать уведомления. */
export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();

  if (
    current.granted ||
    current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();

  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

/** Показать уведомление сразу, без сервера и без таймера. */
export async function showProximityNotification(
  markerId: string,
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "📍 Вы рядом с меткой!",
      body: "Вы приблизились к сохранённой точке на карте.",
      sound: "default",
      data: { markerId },
    },
    trigger: null,
  });
}

/** Убрать ожидающее и уже показанное уведомление одной метки. */
export async function clearProximityNotification(
  markerId: string,
  scheduledId?: string,
): Promise<void> {
  // cancelScheduled... отменяет запланированное, но само по себе НЕ
  // удаляет уже доставленное уведомление из центра уведомлений.
  if (scheduledId) {
    await Notifications.cancelScheduledNotificationAsync(scheduledId);
  }

  const presented = await Notifications.getPresentedNotificationsAsync();

  for (const notification of presented) {
    if (notification.request.content.data?.markerId === markerId) {
      await Notifications.dismissNotificationAsync(
        notification.request.identifier,
      );
    }
  }
}
