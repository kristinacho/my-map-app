import * as SQLite from "expo-sqlite";

export const DATABASE_NAME = "markers.db";
const DATABASE_VERSION = 1;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  try {
    // Включаем соблюдение внешних ключей и режим журнала WAL.
    await db.execAsync("PRAGMA foreign_keys = ON;");
    await db.execAsync("PRAGMA journal_mode = WAL;");

    const row = await db.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version;",
    );
    const currentVersion = row?.user_version ?? 0;

    if (currentVersion > DATABASE_VERSION) {
      throw new Error(
        `Версия базы (${currentVersion}) новее поддерживаемой (${DATABASE_VERSION})`,
      );
    }

    if (currentVersion < 1) {
      await db.withTransactionAsync(async () => {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS markers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS marker_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            marker_id INTEGER NOT NULL,
            uri TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (marker_id) REFERENCES markers (id) ON DELETE CASCADE
          );

          CREATE INDEX IF NOT EXISTS idx_marker_images_marker_id
            ON marker_images(marker_id);
        `);

        await db.execAsync("PRAGMA user_version = 1;");
      });
    }

    return db;
  } catch (error) {
    console.error("Ошибка инициализации SQLite:", error);
    await db.closeAsync();
    throw error;
  }
}
