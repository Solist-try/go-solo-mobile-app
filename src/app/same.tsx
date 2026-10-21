import { useState } from "react";
import { SessionOffer } from "@/components/session-time";
import { Body, Button, Card, ErrorNote, Field, Muted, Screen, Title, TopBar } from "@/components/ui";
import { sameMessagingReady } from "@/domain/policy";
import { useCommunity } from "@/state/community";

export default function Same() {
  const community = useCommunity();
  const [goal, setGoal] = useState("");
  const [error, setError] = useState("");
  const seed = community.shell.seeds.find((item) => item.kind === "same") ?? community.shell.seeds[0];
  const mine = community.shell.world.partnerships.filter(
    (item) => item.seekerId === community.user?.id || item.partnerId === community.user?.id,
  );
  return (
    <Screen>
      <TopBar back title="SAME" />
      <Title>SAME</Title>
      <Body>An introduction, made by a steward, between two people on a similar stretch. Not a match, and not a score.</Body>
      <Field label="What would you like to grow alongside someone?" value={goal} onChangeText={setGoal} multiline />
      <Button
        label="Ask for an introduction"
        onPress={async () => {
          if (!seed) return;
          setError((await community.openSame(seed.id, goal)) ?? "");
        }}
      />
      {mine.map((item) => {
        const ready = sameMessagingReady(item.seekerConsent, item.partnerConsent);
        const other = item.seekerId === community.user?.id ? item.partnerId : item.seekerId;
        return (
          <Card key={item.id}>
            <Body>{item.goal}</Body>
            <Muted>{item.partnerId ? `With ${community.nameOf(item.partnerId)}` : "Waiting for a steward."}</Muted>
            <Muted>{item.status}</Muted>
            {item.partnerId ? (
              <>
                <Button label="I accept this introduction" onPress={() => void community.consentSame(item.id, "accepted")} />
                <Button label="Not for me" tone="quiet" onPress={() => void community.consentSame(item.id, "declined")} />
              </>
            ) : null}
            {ready && other ? <Muted>You can start a conversation from their garden. A closed introduction is not a failure.</Muted> : null}
            {ready && other ? (
              <SessionOffer
                enabled={community.shell.capabilities.sessions}
                contextType="same"
                contextId={item.id}
                memberId={other}
              />
            ) : null}
            {!ready && item.partnerId ? <Muted>Neither person can message through this introduction until both have accepted.</Muted> : null}
          </Card>
        );
      })}
      <ErrorNote>{error}</ErrorNote>
    </Screen>
  );
}
