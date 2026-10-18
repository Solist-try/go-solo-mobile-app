import { Redirect } from "expo-router";
import { WaypointList } from "@/components/waypoint-list";
import { useCommunity } from "@/state/community";

export default function PublicWaypoints() {
  const { user } = useCommunity();
  if (user?.onboardingComplete) return <Redirect href="/waypoints" />;
  return <WaypointList back />;
}
