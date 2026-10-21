import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { colors, Loading, useGoSoloFonts } from "@/components/ui";
import { CommunityProvider, useCommunity } from "@/state/community";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNavigator() {
  const { ready } = useCommunity();
  const [fontsLoaded] = useGoSoloFonts();
  useEffect(() => {
    if (fontsLoaded && ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded, ready]);
  if (!fontsLoaded || !ready) return <Loading />;
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <CommunityProvider>
      <RootNavigator />
    </CommunityProvider>
  );
}
