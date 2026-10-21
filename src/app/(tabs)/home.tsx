import { router } from "expo-router";
import { Banner, Body, Card, Muted, Screen, Subtitle, TextLink, Title } from "@/components/ui";
import { useCommunity } from "@/state/community";

function hello(name: string) {
  const hour = new Date().getHours();
  const time = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return name ? `${time}, ${name}.` : `${time}.`;
}

export default function Home() {
  const { user, content, shell, offline, readings, readingSuggestion } = useCommunity();
  if (!user) return null;
  const world = shell.world;
  const growing = user.growing.find((seed) => seed.status === "active") ?? user.growing[0];
  const planted = world.userSeeds.find((seed) => seed.userId === user.id && seed.status === "active");
  const chair = [...world.memberships]
    .filter((item) => item.userId === user.id)
    .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))[0];
  const waypoint = chair ? shell.waypoints.find((item) => item.id === chair.waypointId) : undefined;
  const dismissed = new Set(world.dismissedPins.filter((item) => item.userId === user.id).map((item) => item.targetId));
  const mine = new Set(world.campfire.filter((post) => post.authorId === user.id).map((post) => post.id));
  const reply = world.comments.find((comment) => comment.targetType === "campfire" && mine.has(comment.targetId) && comment.authorId !== user.id && !comment.hidden);
  const nearby = world.campfire.find((post) => !post.hidden && !dismissed.has(post.id) && (post.pinned || (waypoint && post.waypointId === waypoint.id)));
  const fire = reply
    ? { label: "A reply is with something you shared.", href: `/campfire/${reply.targetId}` as const, title: "Open the reply" }
    : nearby
      ? { label: nearby.title || nearby.body.slice(0, 120), href: `/campfire/${nearby.id}` as const, title: "Open" }
      : null;
  const preferred: Record<string, string> = {
    "starting-over": "starting-again-in-midlife",
    "independent-living": "building-routines-that-stick",
    connection: "how-adults-make-friends",
    "out-there": "exploring-your-own-city",
    reflections: "permission-to-begin",
    "living-well": "creating-a-weekly-reset",
  };
  const thought =
    readings.find((item) => item.featured) ??
    readings.find((item) => item.slug === preferred[readingSuggestion]) ??
    readings.find((item) => item.category === readingSuggestion) ??
    readings[0];
  const request = world.conversations.find((item) => item.recipientId === user.id && item.status === "request");
  const note = [...world.messages].reverse().find((item) => item.authorId !== user.id);
  const next = !growing && !planted
    ? { line: "A seed is a tiny future.", action: "Plant a seed", href: "/seeds" as const }
    : !waypoint
      ? { line: "A waypoint is a chair you can come back to.", action: "See the waypoints", href: "/waypoints" as const }
      : { line: "If you tried something, the house can hold the story.", action: "Tell the story", href: "/out-there/new" as const };

  return (
    <Screen>
      {offline ? <Banner>You are offline. Showing the last words this device could keep.</Banner> : null}
      {shell.fromCache ? <Banner>This is a saved copy. Pull the room open again when you have a connection.</Banner> : null}
      <Title>{hello(user.displayName)}</Title>
      <Muted>{content.heroTagline}</Muted>

      <Card tone="sage">
        <Muted>Growing</Muted>
        {growing ? <Subtitle>{growing.name}</Subtitle> : planted ? <Subtitle>{planted.title || "A seed you planted"}</Subtitle> : <Body>Nothing is growing yet.</Body>}
        <TextLink label={growing || planted ? "Look at this seed" : "Plant a seed"} onPress={() => router.push("/seeds")} />
      </Card>

      <Card>
        <Muted>Your waypoint</Muted>
        {waypoint ? <Subtitle>{waypoint.name}</Subtitle> : <Body>You have not taken a chair yet.</Body>}
        {waypoint ? <TextLink label="Return to this chair" onPress={() => router.push(`/waypoints/${waypoint.slug}`)} /> : null}
      </Card>

      <Card tone="clay">
        <Muted>Around the fire</Muted>
        {fire ? <Body>{fire.label}</Body> : <Body>The fire is quiet. You can sit without speaking.</Body>}
        <TextLink label={fire ? fire.title : "Visit the campfire"} onPress={() => router.push(fire ? fire.href : "/campfire")} />
      </Card>

      {thought ? (
        <Card tone="mist">
          <Muted>A thought for today</Muted>
          <Subtitle>{thought.title}</Subtitle>
          <Body>{thought.standfirst}</Body>
          <TextLink label="Read" onPress={() => router.push(`/reading-room/${thought.slug}`)} />
        </Card>
      ) : null}

      <Card>
        <Muted>Conversations</Muted>
        {request ? <Body>An opening note is waiting.</Body> : note ? <Body>There is a new note in a conversation.</Body> : <Body>No new note.</Body>}
        {request || note ? <TextLink label="Open conversations" onPress={() => router.push("/conversations")} /> : null}
      </Card>

      <Card tone="gold">
        <Muted>Continue your journey</Muted>
        <Body>{next.line}</Body>
        <TextLink label={next.action} onPress={() => router.push(next.href)} />
      </Card>
    </Screen>
  );
}
