import { router } from "expo-router";
import { Body, Card, Empty, Screen, TextLink, Title } from "@/components/ui";
import { formatDay } from "@/domain/format";
import { useCommunity } from "@/state/community";

export default function OutThereList() {
  const { shell, content, nameOf, user } = useCommunity();
  const stories = shell.world.stories
    .filter((story) => (!story.hidden || user?.role === "admin") && !story.example)
    .slice()
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt));
  return (
    <Screen>
      <Title>Out There</Title>
      <Body>Lived experience, told plainly. Ideas for a first step stay marked as ideas.</Body>
      <TextLink label="Tell a story" onPress={() => router.push("/out-there/new")} />
      {stories.length === 0 ? <Empty>{content.mobile!.emptyStories}</Empty> : null}
      {stories.map((story) => (
        <Card key={story.id} tone={story.pinned ? "clay" : "card"}>
          {story.pinned ? <MutedLabel>{content.mobile!.pinnedLabels.story}</MutedLabel> : null}
          <Body>{story.title}</Body>
          <Body>{nameOf(story.authorId)} · {formatDay(story.createdAt)}</Body>
          <TextLink label="Read" onPress={() => router.push(`/out-there/${story.id}`)} />
        </Card>
      ))}
    </Screen>
  );
}

function MutedLabel({ children }: { children: string }) {
  return <Body>{children}</Body>;
}
