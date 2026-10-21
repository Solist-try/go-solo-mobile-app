import { Redirect, Tabs } from "expo-router";
import { colors, fonts, Loading } from "@/components/ui";
import { useCommunity } from "@/state/community";

export default function TabsLayout() {
  const { ready, user } = useCommunity();
  if (!ready) return <Loading />;
  if (!user) return <Redirect href="/" />;
  if (!user.emailVerified) return <Redirect href="/verify-email" />;
  if (!user.onboardingComplete) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border, minHeight: 64 },
        tabBarIcon: () => null,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="campfire" options={{ title: "Campfire" }} />
      <Tabs.Screen name="waypoints" options={{ title: "Waypoints" }} />
      <Tabs.Screen name="out-there" options={{ title: "Out There" }} />
      <Tabs.Screen name="garden" options={{ title: "My Garden" }} />
    </Tabs>
  );
}
