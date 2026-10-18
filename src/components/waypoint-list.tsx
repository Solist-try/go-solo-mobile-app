import { router } from "expo-router";
import { Body, Card, Empty, Screen, TextLink, Title } from "@/components/ui";
import { useCommunity } from "@/state/community";

export function WaypointList({ back = false }: { back?: boolean }) {
  const { shell, content } = useCommunity();
  return (
    <Screen>
      {back ? <TextLink label="Back" onPress={() => router.back()} /> : null}
      <Title>Waypoints</Title>
      <Body>Topic-focused rooms. Reflective, in depth, and tied to the Reading Room. Not a membership directory.</Body>
      {shell.waypoints.length === 0 ? <Empty>{content.mobile!.emptyWaypoints}</Empty> : null}
      {shell.waypoints.map((waypoint) => (
        <Card key={waypoint.id} tone="mist">
          <Title>{waypoint.name}</Title>
          <Body>{waypoint.summary}</Body>
          <TextLink label="Sit with this" onPress={() => router.push(`/waypoints/${waypoint.slug}`)} />
        </Card>
      ))}
    </Screen>
  );
}
