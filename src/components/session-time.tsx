import { router } from "expo-router";
import { useState } from "react";
import { Button, Card, ErrorNote, Field, Muted, TextLink } from "@/components/ui";
import { formatDay } from "@/domain/format";
import { continuationIsNeutral, parseSessionWindow } from "@/domain/policy";
import type { PrivateSession } from "@/domain/types";
import { useCommunity } from "@/state/community";

export function SessionNote({ session }: { session: PrivateSession }) {
  const community = useCommunity();
  const user = community.user;
  if (!user) return null;
  const mine = session.memberA === user.id;
  const iAgreed = mine ? session.aAgreed : session.bAgreed;
  const theyAgreed = mine ? session.bAgreed : session.aAgreed;
  const myAnswer = mine ? session.continuationA : session.continuationB;
  const theirAnswer = mine ? session.continuationB : session.continuationA;
  const ended = new Date(session.endsAt).getTime() < Date.now();
  const upcoming = new Date(session.startsAt).getTime() > Date.now();

  if (session.status === "proposed" && !upcoming && !iAgreed) return null;
  if (session.status === "proposed" && !iAgreed && upcoming) {
    return (
      <Card>
        <Muted>A time was suggested</Muted>
        <Muted>{formatDay(session.startsAt)}</Muted>
        <Button label="I can meet then" tone="quiet" onPress={() => void community.agreeSession(session.id)} />
      </Card>
    );
  }
  if (session.status === "proposed" && iAgreed && !theyAgreed) {
    return (
      <Card>
        <Muted>You suggested a time. They can accept when they want. Nothing else will be sent.</Muted>
        <Muted>{formatDay(session.startsAt)}</Muted>
      </Card>
    );
  }
  if (session.status === "scheduled" && !ended) {
    return (
      <Card tone="clay">
        <Muted>A session you both accepted</Muted>
        <Muted>{formatDay(session.startsAt)}</Muted>
      </Card>
    );
  }
  if (theirAnswer === false || myAnswer === false) return null;
  if (myAnswer === true && theirAnswer === true) {
    const href = session.contextType === "same" ? "/same" : "/skill-swaps";
    return (
      <Card>
        <Muted>You both said yes to another session. Suggest a time when you want one.</Muted>
        <TextLink label="Suggest a time" onPress={() => router.push(href)} />
      </Card>
    );
  }
  if (ended && myAnswer === null && continuationIsNeutral(session)) {
    return (
      <Card>
        <Muted>Would you like another session?</Muted>
        <Button label="Yes" tone="quiet" onPress={() => void community.answerContinuation(session.id, true)} />
        <Button label="Not at this time" tone="quiet" onPress={() => void community.answerContinuation(session.id, false)} />
      </Card>
    );
  }
  if (myAnswer === true && theirAnswer === null) {
    return (
      <Card>
        <Muted>You answered. The other person is not being asked again.</Muted>
      </Card>
    );
  }
  return null;
}

export function SessionOffer({
  enabled,
  contextType,
  contextId,
  memberId,
}: {
  enabled: boolean;
  contextType: "skill-swap" | "same";
  contextId: string;
  memberId: string;
}) {
  const community = useCommunity();
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [error, setError] = useState("");
  if (!enabled || !community.user) return null;
  return (
    <Card>
      <Muted>A private session, only for the two of you, only during the time you both accept.</Muted>
      <Field label="Starts" value={starts} onChangeText={setStarts} placeholder="2026-10-20 16:00" />
      <Field label="Ends" value={ends} onChangeText={setEnds} placeholder="2026-10-20 17:00" />
      <ErrorNote>{error}</ErrorNote>
      <Button
        label="Suggest this time"
        tone="quiet"
        onPress={async () => {
          const window = parseSessionWindow(starts, ends);
          if (!window) {
            setError("Choose a time that begins soon and ends within a day.");
            return;
          }
          setError((await community.proposeSession({ contextType, contextId, memberId, ...window })) ?? "");
        }}
      />
    </Card>
  );
}
