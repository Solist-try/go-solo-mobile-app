import { router } from "expo-router";
import { Body, Card, Empty, Screen, TextLink, Title, TopBar } from "@/components/ui";
import { useCommunity } from "@/state/community";

export default function Conversations() {
  const { shell, user, content, nameOf } = useCommunity();
  if (!shell.capabilities.conversations) {
    return (
      <Screen>
        <TopBar back />
        <Title>Conversations</Title>
        <Body>Private conversations stay closed until the shared database update is applied. This app will not invent a separate inbox.</Body>
      </Screen>
    );
  }
  const mine = shell.world.conversations.filter(
    (item) => user && (item.requesterId === user.id || item.recipientId === user.id) && item.status !== "closed",
  );
  return (
    <Screen>
      <TopBar back title="Conversations" />
      <Title>Conversations</Title>
      <Body>Requests, accepted exchanges, and the choice to continue, keep in touch, take space, or decline.</Body>
      {mine.length === 0 ? <Empty>{content.mobile!.emptyConversations}</Empty> : null}
      {mine.map((conversation) => {
        const other = conversation.requesterId === user?.id ? conversation.recipientId : conversation.requesterId;
        return (
          <Card key={conversation.id}>
            <Body>{nameOf(other)}</Body>
            <Body>{conversation.contextLabel || conversation.status}</Body>
            <TextLink label="Open" onPress={() => router.push(`/conversations/${conversation.id}`)} />
          </Card>
        );
      })}
    </Screen>
  );
}
