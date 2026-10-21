import { Linking } from "react-native";
import { Body, Button, Card, Muted, Screen, Title, TopBar } from "@/components/ui";
import { useCommunity } from "@/state/community";

export default function Steward() {
  const { user, shell, stewardModerate, content } = useCommunity();
  const site = (process.env.EXPO_PUBLIC_SITE_URL || process.env.EXPO_PUBLIC_API_URL || "").replace(/\/$/, "");
  if (user?.role !== "admin") {
    return (
      <Screen>
        <TopBar back />
        <Title>Steward desk</Title>
        <Body>This room is only for stewards. Hiding the button is not the lock. The server checks the role.</Body>
        {site ? <Button label="Open the desk on the web" onPress={() => void Linking.openURL(`${site}/steward`)} /> : null}
      </Screen>
    );
  }
  const reports = shell.world.reports.filter((report) => report.status === "open");
  return (
    <Screen>
      <TopBar back title="Steward" />
      <Title>Steward</Title>
      <Body>Essential care from a phone. Heavier administration stays on the website desk.</Body>
      <Muted>{reports.length} open reports. Private conversations are not listed here.</Muted>
      {reports.map((report) => (
        <Card key={report.id}>
          <Body>{report.targetType}</Body>
          <Body>{report.reason}</Body>
        </Card>
      ))}
      {shell.world.campfire.slice(0, 8).map((post) => (
        <Card key={post.id}>
          <Body>{post.title || post.body.slice(0, 80)}</Body>
          <Button label={post.pinned ? "Unpin" : "Pin"} tone="quiet" onPress={() => void stewardModerate({ kind: "campfire", id: post.id, pinned: !post.pinned })} />
          <Button label={post.hidden ? "Show" : "Hide"} tone="quiet" onPress={() => void stewardModerate({ kind: "campfire", id: post.id, hidden: !post.hidden })} />
        </Card>
      ))}
      {shell.world.stories.slice(0, 8).map((story) => (
        <Card key={story.id}>
          <Body>{story.title}</Body>
          <Button label={story.hidden ? "Show" : "Hide"} tone="quiet" onPress={() => void stewardModerate({ kind: "story", id: story.id, hidden: !story.hidden })} />
        </Card>
      ))}
      {site ? <Button label="Full steward desk" tone="quiet" onPress={() => void Linking.openURL(`${site}/admin`)} /> : null}
      <Muted>Letters still go to {content.founderEmail}.</Muted>
    </Screen>
  );
}
