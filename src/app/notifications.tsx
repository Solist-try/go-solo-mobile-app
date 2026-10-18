import { router } from "expo-router";
import { Body, Card, Empty, Screen, TextLink, Title, TopBar } from "@/components/ui";
import { formatDay } from "@/domain/format";
import { useCommunity } from "@/state/community";

export default function Notifications() {
  const { shell, user, markNotifications } = useCommunity();
  const notes = shell.world.notifications.filter((item) => item.userId === user?.id);
  return (
    <Screen>
      <TopBar back title="Notifications" />
      <Title>Notes</Title>
      <Body>Only what you asked to hear about. Nothing here is trying to pull you back.</Body>
      <TextLink label="Mark read" onPress={() => void markNotifications()} />
      {notes.length === 0 ? <Empty>Nothing new.</Empty> : null}
      {notes.map((note) => (
        <Card key={note.id}>
          <Body>{note.title}</Body>
          <Body>{note.body}</Body>
          <Body>{formatDay(note.createdAt)}</Body>
        </Card>
      ))}
      <TextLink label="Notification settings" onPress={() => router.push("/settings")} />
    </Screen>
  );
}
