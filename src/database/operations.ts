import type { SQLiteDatabase } from "expo-sqlite";

// Строка таблицы markers. ID создаётся самой SQLite.
export interface MarkerRow {
  id: number;
  latitude: number;
  longitude: number;
  created_at: string;
}

// Строка таблицы marker_images.
export interface MarkerImageRow {
  id: number;
  marker_id: number;
  uri: string;
  created_at: string;
}

export async function createMarker(
  db: SQLiteDatabase,
  latitude: number,
  longitude: number,
): Promise<number> {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error("Некорректная широта маркера");
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error("Некорректная долгота маркера");
  }

  const result = await db.runAsync(
    "INSERT INTO markers (latitude, longitude) VALUES (?, ?)",
    latitude,
    longitude,
  );
  return result.lastInsertRowId;
}

export async function getMarkers(db: SQLiteDatabase): Promise<MarkerRow[]> {
  return db.getAllAsync<MarkerRow>(
    "SELECT id, latitude, longitude, created_at FROM markers ORDER BY id",
  );
}

export async function deleteMarker(
  db: SQLiteDatabase,
  markerId: number,
): Promise<void> {
  const result = await db.runAsync(
    "DELETE FROM markers WHERE id = ?",
    markerId,
  );
  if (result.changes === 0) {
    throw new Error(`Маркер с ID ${markerId} не найден`);
  }
  // При PRAGMA foreign_keys = ON дочерние строки удалятся через ON DELETE CASCADE.
}

export async function addImage(
  db: SQLiteDatabase,
  markerId: number,
  uri: string,
): Promise<number> {
  if (!uri.trim()) {
    throw new Error("URI изображения не может быть пустым");
  }

  const result = await db.runAsync(
    "INSERT INTO marker_images (marker_id, uri) VALUES (?, ?)",
    markerId,
    uri,
  );
  return result.lastInsertRowId;
}

export async function getMarkerImages(
  db: SQLiteDatabase,
  markerId: number,
): Promise<MarkerImageRow[]> {
  return db.getAllAsync<MarkerImageRow>(
    `SELECT id, marker_id, uri, created_at
     FROM marker_images
     WHERE marker_id = ?
     ORDER BY id`,
    markerId,
  );
}

export async function deleteImage(
  db: SQLiteDatabase,
  imageId: number,
): Promise<void> {
  const result = await db.runAsync(
    "DELETE FROM marker_images WHERE id = ?",
    imageId,
  );
  if (result.changes === 0) {
    throw new Error(`Изображение с ID ${imageId} не найдено`);
  }
}
