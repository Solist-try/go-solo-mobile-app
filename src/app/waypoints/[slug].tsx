import { router, useLocalSearchParams } from "expo-router";
import { Body, Button, Card, Empty, Muted, Screen, TextLink, Title, TopBar } from "@/components/ui";
import { formatDay } from "@/domain/format";
import { useCommunity } from "@/state/community";

export default function WaypointDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { shell, user, joinWaypoint, leaveWaypoint, content, nameOf, readings } = useCommunity();
  const waypoint = shell.waypoints.find((item) => item.slug === slug || item.id === slug);
  if (!waypoint) {
    return (
      <Screen>
        <TopBar back />
        <Title>This waypoint is not here.</Title>
      </Screen>
    );
  }
  const sitting = shell.world.memberships.some((item) => item.userId === user?.id && item.waypointId === waypoint.id);
  const people = shell.world.memberships.filter((item) => item.waypointId === waypoint.id);
  const discussions = shell.world.campfire.filter((post) => post.waypointId === waypoint.id && !post.hidden);
  const related = readings.filter((item) => item.waypoints?.some((link) => link.slug === waypoint.slug));

  return (
    <Screen>
      <TopBar back title="Waypoint" />
      <Title>{waypoint.name}</Title>
      <Body>{waypoint.description}</Body>
      <Muted>{waypoint.focus.join(" · ")}</Muted>
      {user ? (
        <Button
          label={sitting ? "Leave this chair" : "Take a seat"}
          onPress={() => void (sitting ? leaveWaypoint(waypoint.id) : joinWaypoint(waypoint.id))}
        />
      ) : (
        <Button label="Sign in to take a seat" tone="quiet" onPress={() => router.push("/sign-in")} />
      )}
      <Title>Food for thought</Title>
      <Body>{waypoint.summary}</Body>
      {related.map((reading) => (
        <Card key={reading.slug}>
          <Muted>{content.mobile!.pinnedLabels.reading}</Muted>
          <Body>{reading.title}</Body>
          <TextLink label="Continue in the Reading Room" onPress={() => router.push(`/reading-room/${reading.slug}`)} />
        </Card>
      ))}
      <Title>Current discussions</Title>
      {user ? <TextLink label="Start a discussion" onPress={() => router.push(`/campfire/new?waypoint=${waypoint.id}`)} /> : null}
      {discussions.length === 0 ? <Empty>No discussion yet. The chair is still here.</Empty> : null}
      {discussions.map((post) => (
        <Card key={post.id} tone={post.pinned ? "sage" : "card"}>
          {post.pinned ? <Muted>{content.mobile!.pinnedLabels.waypoint}</Muted> : null}
          <Body>{post.title || post.body.slice(0, 140)}</Body>
          <Muted>{formatDay(post.createdAt)}</Muted>
          <TextLink label="Open" onPress={() => router.push(`/campfire/${post.id}`)} />
        </Card>
      ))}
      {user ? (
        <>
          <Title>People sitting here</Title>
          {people.map((person) => {
            const profile = shell.world.profiles.find((item) => item.id === person.userId);
            if (profile && !profile.showWaypoints && profile.id !== user.id) return null;
            return <TextLink key={person.userId} label={nameOf(person.userId)} onPress={() => router.push(`/garden/${person.userId}`)} />;
          })}
        </>
      ) : (
        <Muted>Member names stay with members.</Muted>
      )}
    </Screen>
  );
}
