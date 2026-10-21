import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Body, Button, Card, ErrorNote, Field, Muted, Screen, Title, TopBar } from "@/components/ui";
import { RichText } from "@/components/rich-text";
import { ReportBox } from "@/components/report-box";
import { createId } from "@/domain/format";
import { useCommunity } from "@/state/community";

export default function ConversationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const community = useCommunity();
  const conversation = community.shell.world.conversations.find((item) => item.id === id);
  const member = community.user;
  const [body, setBody] = useState(community.draft(`conversation:${id}`));
  const [error, setError] = useState("");
  if (!conversation || !member) {
    return (
      <Screen>
        <TopBar back />
        <Title>This conversation is not here.</Title>
      </Screen>
    );
  }
  const other = conversation.requesterId === member.id ? conversation.recipientId : conversation.requesterId;
  const messages = community.shell.world.messages.filter((item) => item.conversationId === conversation.id);
  const phrases = community.content.mobile!.interaction;
  return (
    <Screen>
      <TopBar back title="Conversation" />
      <Title>{community.nameOf(other)}</Title>
      <Muted>{conversation.contextLabel}</Muted>
      <Muted>{conversation.status}</Muted>
      {messages.map((message) => (
        <Card key={message.id}>
          <Muted>{community.nameOf(message.authorId)}</Muted>
          <RichText value={message.body} />
        </Card>
      ))}
      {conversation.status === "request" && conversation.recipientId === member.id ? (
        <>
          <Button label="Accept" onPress={() => void community.chooseInteraction(conversation.id, "continue")} />
          <Button label="Not at this time" tone="quiet" onPress={() => void community.chooseInteraction(conversation.id, "decline")} />
        </>
      ) : null}
      {conversation.status === "accepted" ? (
        <>
          <Field label="A note" value={body} onChangeText={setBody} multiline />
          <ErrorNote>{error}</ErrorNote>
          <Button
            label="Send"
            onPress={async () => {
              await community.saveDraft(`conversation:${id}`, body);
              const message = await community.sendMessage(conversation.id, body, createId());
              if (message) setError(message);
              else {
                setBody("");
                await community.clearDraft(`conversation:${id}`);
              }
            }}
          />
          <Button label="Keep in touch" tone="quiet" onPress={() => void community.chooseInteraction(conversation.id, "keep-in-touch")} />
          <Button label="Take a little space" tone="quiet" onPress={() => void community.chooseInteraction(conversation.id, "space")} />
          <Button label="Decline" tone="quiet" onPress={() => void community.chooseInteraction(conversation.id, "decline")} />
          <Muted>{phrases.space}</Muted>
        </>
      ) : null}
      <Button
        label={conversation.mutedBy.includes(member.id) ? "Unmute" : "Mute"}
        tone="quiet"
        onPress={() => void community.setConversationFlag(conversation.id, conversation.mutedBy.includes(member.id) ? "unmute" : "mute")}
      />
      <Button label="Archive" tone="quiet" onPress={() => void community.setConversationFlag(conversation.id, "archive")} />
      <Button label="Close" tone="quiet" onPress={() => void community.setConversationFlag(conversation.id, "close")} />
      <ReportBox targetType="conversation" targetId={conversation.id} />
      <Button label="Block" tone="quiet" onPress={() => void community.block(other)} />
    </Screen>
  );
}
