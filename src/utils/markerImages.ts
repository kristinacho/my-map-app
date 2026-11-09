import { Directory, File, Paths } from "expo-file-system";

const imageDirectory = new Directory(Paths.document, "marker-images");

export async function saveMarkerImage(sourceUri: string): Promise<string> {
  imageDirectory.create({ idempotent: true, intermediates: true });

  // Убираем query-параметры URI и выбираем безопасное расширение.
  const extension = sourceUri.split("?")[0].split(".").pop()?.toLowerCase();
  const safeExtension =
    extension && /^(jpg|jpeg|png|heic|webp)$/.test(extension)
      ? extension
      : "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExtension}`;
  const destination = new File(imageDirectory, fileName);

  await new File(sourceUri).copy(destination);
  return destination.uri;
}

export function deleteSavedMarkerImage(uri: string): void {
  // Не удаляем произвольные файлы из других папок или фотогалереи.
  if (!uri.startsWith(imageDirectory.uri + "/")) return;

  const file = new File(uri);
  if (file.exists) file.delete();
}
