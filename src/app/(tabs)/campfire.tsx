import { router } from "expo-router";
import { Body, Card, Empty, Muted, Screen, TextLink, Title } from "@/components/ui";
import { formatDay } from "@/domain/format";
import { useCommunity } from "@/state/community";

export default function CampfireList() {
  const { shell, content, nameOf, user } = useCommunity();
  const copy = content.mobile!;
  const dismissed = new Set(shell.world.dismissedPins.filter((item) => item.userId === user?.id).map((item) => `${item.targetType}:${item.targetId}`));
  const posts = shell.world.campfire
    .filter((post) => !post.hidden || user?.role === "admin")
    .filter((post) => !post.waypointId)
    .slice()
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt));

  return (
    <Screen>
      <Title>Campfire</Title>
      <Body>{copy.pullUpAChair}</Body>
      <Muted>Light, everyday conversation. Not a scoreboard.</Muted>
      <TextLink label={copy.shareIt} onPress={() => router.push("/campfire/new")} />
      {posts.length === 0 ? <Empty>{copy.emptyCampfire}</Empty> : null}
      {posts.map((post) => (
        <Card key={post.id} tone={post.pinned && !dismissed.has(`campfire:${post.id}`) ? "sage" : "card"}>
          {post.pinned ? <Muted>{copy.pinnedLabels.campfire}</Muted> : null}
          <Body>{post.title || "A note"}</Body>
          <Muted>
            {nameOf(post.authorId)} · {formatDay(post.createdAt)}
          </Muted>
          <TextLink label="Pull up a chair" onPress={() => router.push(`/campfire/${post.id}`)} />
        </Card>
      ))}
    </Screen>
  );
}
