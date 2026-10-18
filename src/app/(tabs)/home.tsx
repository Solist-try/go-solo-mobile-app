import { router } from "expo-router";
import { SessionNote } from "@/components/session-time";
import { Banner, Body, Card, Muted, Screen, Subtitle, TextLink, Title } from "@/components/ui";
import { formatDay } from "@/domain/format";
import { useCommunity } from "@/state/community";

export default function Home() {
  const { user, content, shell, offline, unread, readingSuggestion, readings } = useCommunity();
  const copy = content.mobile!;
  if (!user) return null;
  const world = shell.world;
  const seeds = world.userSeeds.filter((item) => item.userId === user.id && item.status === "active");
  const chairs = world.memberships.filter((item) => item.userId === user.id);
  const posts = world.campfire.filter((item) => !item.hidden).slice(0, 3);
  const requests = world.conversations.filter((item) => item.recipientId === user.id && item.status === "request");
  const sessions = world.sessions.filter((item) => item.memberA === user.id || item.memberB === user.id);
  const preferredReading: Record<string, string> = {
    "starting-over": "starting-again-in-midlife",
    "independent-living": "building-routines-that-stick",
    connection: "how-adults-make-friends",
    "out-there": "exploring-your-own-city",
    reflections: "permission-to-begin",
    "living-well": "creating-a-weekly-reset",
  };
  const suggestion =
    readings.find((item) => item.slug === preferredReading[readingSuggestion]) ??
    readings.find((item) => item.category === readingSuggestion);
  const dismissed = new Set(world.dismissedPins.filter((item) => item.userId === user.id).map((item) => item.targetId));
  const pinned = world.campfire.find((item) => item.pinned && !item.hidden && !dismissed.has(item.id));

  return (
    <Screen>
      {offline ? <Banner>You are offline. Showing the last words this device could keep.</Banner> : null}
      {shell.fromCache ? <Banner>This is a saved copy. Pull the room open again when you have a connection.</Banner> : null}
      <Muted>{content.heroTagline}</Muted>
      <Title>Hello{user.displayName ? `, ${user.displayName}` : ""}.</Title>
      <Body>{content.heroSubhead}</Body>
      <Card tone="gold">
        <Muted>{copy.pinnedLabels.community}</Muted>
        <Subtitle>{content.belief}</Subtitle>
        <Body>{content.beliefSecond}</Body>
      </Card>
      {pinned ? (
        <Card tone="sage">
          <Muted>{copy.pinnedLabels.campfire}</Muted>
          <Subtitle>{pinned.title || copy.campfireWelcome}</Subtitle>
          <TextLink label="Read it" onPress={() => router.push(`/campfire/${pinned.id}`)} />
        </Card>
      ) : null}
      <Subtitle>Seeds you are growing</Subtitle>
      {seeds.length === 0 ? <Muted>{copy.emptySeeds}</Muted> : null}
      {seeds.map((seed) => (
        <Card key={seed.id}>
          <Body>{seed.title || seed.goal || "A seed"}</Body>
          <Muted>{copy.seedStatus[seed.status] ?? seed.status}</Muted>
        </Card>
      ))}
      <TextLink label="Browse seeds" onPress={() => router.push("/seeds")} />
      <Subtitle>Where you are sitting</Subtitle>
      {chairs.length === 0 ? <Muted>You have not taken a chair yet.</Muted> : null}
      {chairs.map((chair) => {
        const waypoint = shell.waypoints.find((item) => item.id === chair.waypointId);
        return waypoint ? (
          <TextLink key={chair.waypointId} label={waypoint.name} onPress={() => router.push(`/waypoints/${waypoint.slug}`)} />
        ) : null;
      })}
      <Subtitle>Around the campfire</Subtitle>
      {posts.map((post) => (
        <Card key={post.id}>
          <Body>{post.title || post.body.slice(0, 120)}</Body>
          <Muted>{formatDay(post.createdAt)}</Muted>
          <TextLink label="Open" onPress={() => router.push(`/campfire/${post.id}`)} />
        </Card>
      ))}
      {suggestion ? (
        <Card tone="mist">
          <Muted>From the Reading Room</Muted>
          <Subtitle>{suggestion.title}</Subtitle>
          <Body>{suggestion.standfirst}</Body>
          <TextLink label="Read" onPress={() => router.push(`/reading-room/${suggestion.slug}`)} />
        </Card>
      ) : null}
      {requests.length ? (
        <Card>
          <Subtitle>Conversation requests</Subtitle>
          <Body>{requests.length === 1 ? "Someone left an opening note." : `${requests.length} opening notes are waiting.`}</Body>
          <TextLink label="Read them" onPress={() => router.push("/conversations")} />
        </Card>
      ) : null}
      {sessions.map((session) => (
        <SessionNote key={session.id} session={session} />
      ))}
      <TextLink label={unread ? `Notifications (${unread})` : "Notifications"} onPress={() => router.push("/notifications")} />
      <TextLink label="Conversations" onPress={() => router.push("/conversations")} />
      <TextLink label="Skill Swaps" onPress={() => router.push("/skill-swaps")} />
      <TextLink label="SAME introductions" onPress={() => router.push("/same")} />
      <TextLink label="Reading Room" onPress={() => router.push("/reading-room")} />
      <TextLink label="Settings" onPress={() => router.push("/settings")} />
      {user.role === "admin" ? <TextLink label="Steward" onPress={() => router.push("/steward")} /> : null}
    </Screen>
  );
}
