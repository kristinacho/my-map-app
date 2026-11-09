import type { SQLiteDatabase } from "expo-sqlite";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  addImage as addImageToDb,
  createMarker,
  deleteImage as deleteImageFromDb,
  deleteMarker as deleteMarkerFromDb,
  getMarkerImages as getMarkerImagesFromDb,
  getMarkers as getMarkersFromDb,
  type MarkerImageRow,
  type MarkerRow,
} from "../database/operations";
import { initDatabase } from "../database/schema";

interface DatabaseContextValue {
  isLoading: boolean;
  error: Error | null;
  isReady: boolean;
  addMarker: (latitude: number, longitude: number) => Promise<number>;
  deleteMarker: (id: number) => Promise<void>;
  getMarkers: () => Promise<MarkerRow[]>;
  addImage: (markerId: number, uri: string) => Promise<void>;
  deleteImage: (id: number) => Promise<void>;
  getMarkerImages: (markerId: number) => Promise<MarkerImageRow[]>;
}

const DatabaseContext = createContext<DatabaseContextValue | undefined>(
  undefined,
);

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    let connection: SQLiteDatabase | null = null;

    async function initialize() {
      try {
        const database = await initDatabase();
        connection = database;

        if (cancelled) {
          await database.closeAsync();
          return;
        }

        setDb(database);
        setError(null);
      } catch (cause) {
        if (!cancelled) {
          const nextError = toError(cause);
          setError(nextError);
          console.error("DatabaseContext: ошибка инициализации", nextError);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void initialize();

    return () => {
      cancelled = true;
      if (connection) {
        // На этом этапе другие компоненты ещё не выполняют SQL-запросы.
        void connection.closeAsync().catch((cause: unknown) => {
          console.error("DatabaseContext: ошибка закрытия SQLite", cause);
        });
      }
    };
  }, []);

  function requireDatabase(): SQLiteDatabase {
    if (!db) throw new Error("База данных ещё не готова");
    return db;
  }

  async function execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      const result = await operation();
      setError(null);
      return result;
    } catch (cause) {
      const nextError = toError(cause);
      setError(nextError);
      if (__DEV__) console.error("DatabaseContext: ошибка операции", nextError);
      throw nextError;
    }
  }

  return (
    <DatabaseContext.Provider
      value={{
        isLoading,
        error,
        isReady: db !== null,
        addMarker: (latitude, longitude) =>
          execute(() => createMarker(requireDatabase(), latitude, longitude)),
        deleteMarker: (id) =>
          execute(() => deleteMarkerFromDb(requireDatabase(), id)),
        getMarkers: () => execute(() => getMarkersFromDb(requireDatabase())),
        addImage: async (markerId, uri) => {
          await execute(() => addImageToDb(requireDatabase(), markerId, uri));
        },
        deleteImage: (id) =>
          execute(() => deleteImageFromDb(requireDatabase(), id)),
        getMarkerImages: (markerId) =>
          execute(() => getMarkerImagesFromDb(requireDatabase(), markerId)),
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error(
      "useDatabase должен использоваться внутри DatabaseProvider",
    );
  }
  return context;
}
