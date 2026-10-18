import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Body, Button, ErrorNote, Field, Screen, Title, TopBar } from "@/components/ui";
import { contactBetween } from "@/domain/contact";
import { useCommunity } from "@/state/community";

export default function NewConversation() {
  const { member } = useLocalSearchParams<{ member: string }>();
  const community = useCommunity();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const decision = community.user && member ? contactBetween(community.shell.world, community.user.id, member) : null;
  return (
    <Screen>
      <TopBar back title="Conversation" />
      <Title>An opening note</Title>
      <Body>{decision?.allowed ? `To ${community.nameOf(member)}.` : decision?.message}</Body>
      <Field label="Note" value={note} onChangeText={setNote} multiline />
      <ErrorNote>{error}</ErrorNote>
      <Button
        label="Send the request"
        disabled={!decision?.allowed}
        onPress={async () => {
          if (!member) return;
          const message = await community.startConversation({
            targetId: member,
            contextType: "direct",
            contextId: member,
            contextLabel: "A direct note",
            note,
          });
          if (message) setError(message);
          else router.back();
        }}
      />
    </Screen>
  );
}
