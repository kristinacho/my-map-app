import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { MarkersProvider } from "../context/markersContext";
import { DatabaseProvider } from "../contexts/databaseContext";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <DatabaseProvider>
      <MarkersProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <AnimatedSplashOverlay />
          <Stack>
            <Stack.Screen name="index" options={{ title: "Карта" }} />
            <Stack.Screen
              name="marker/[id]"
              options={{ title: "Детали маркера" }}
            />
          </Stack>
        </ThemeProvider>
      </MarkersProvider>
    </DatabaseProvider>
  );
}
