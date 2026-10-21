import { useState } from "react";
import { SessionOffer } from "@/components/session-time";
import { Body, Button, Card, ErrorNote, Field, Screen, Title, TopBar } from "@/components/ui";
import { useCommunity } from "@/state/community";

export default function SkillSwaps() {
  const community = useCommunity();
  const [skill, setSkill] = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const { shell, user } = community;
  return (
    <Screen>
      <TopBar back title="Skill Swap" />
      <Title>Skill Swap</Title>
      <Body>Offer what you know. Ask for what you would like to learn. No prices, no ratings, no marketplace.</Body>
      <Field label="A skill" value={skill} onChangeText={setSkill} />
      <Field label="A few words" value={description} onChangeText={setDescription} multiline />
      <Button label="Offer this" onPress={async () => setError((await community.offerSkill(skill, description)) ?? "")} />
      <Button label="Ask for this" tone="quiet" onPress={async () => setError((await community.requestSkill(skill, description)) ?? "")} />
      <Title>Offers</Title>
      {shell.world.offers.map((offer) => (
        <Card key={offer.id}>
          <Body>{offer.skill}</Body>
          <Body>{offer.description}</Body>
          <Body>{community.nameOf(offer.userId)}</Body>
          {offer.userId !== user?.id ? (
            <>
              <Field label="Opening note" value={note} onChangeText={setNote} />
              <Button
                label="Express interest"
                tone="quiet"
                onPress={async () =>
                  setError((await community.expressInterest({ offerId: offer.id, toUserId: offer.userId, note })) ?? "")
                }
              />
            </>
          ) : null}
        </Card>
      ))}
      <Title>Requests</Title>
      {shell.world.requests.map((request) => (
        <Card key={request.id}>
          <Body>{request.skill}</Body>
          <Body>{community.nameOf(request.userId)}</Body>
        </Card>
      ))}
      <Title>Exchanges</Title>
      {shell.world.connections
        .filter((item) => item.fromUserId === user?.id || item.toUserId === user?.id)
        .map((item) => (
          <Card key={item.id}>
            <Body>{item.note || "An opening note"}</Body>
            <Body>{item.status}</Body>
            <Button label="Accept" tone="quiet" onPress={() => void community.setSwapStatus(item.id, "accepted")} />
            <Button label="Decline" tone="quiet" onPress={() => void community.setSwapStatus(item.id, "declined")} />
            <Button label="Pause" tone="quiet" onPress={() => void community.setSwapStatus(item.id, "paused")} />
            <Button label="Complete" tone="quiet" onPress={() => void community.setSwapStatus(item.id, "completed")} />
            {item.status === "accepted" && user ? (
              <SessionOffer
                enabled={shell.capabilities.sessions}
                contextType="skill-swap"
                contextId={item.id}
                memberId={item.fromUserId === user.id ? item.toUserId : item.fromUserId}
              />
            ) : null}
          </Card>
        ))}
      <ErrorNote>{error}</ErrorNote>
    </Screen>
  );
}
