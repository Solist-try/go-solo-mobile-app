import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Body, Button, Card, Choice, ErrorNote, Muted, Screen, Subtitle, Title } from "@/components/ui";
import { INTENTIONS } from "@/domain/types";
import { useCommunity } from "@/state/community";

const STEPS = ["welcome", "season", "connection", "waypoint", "seed", "contact", "arrive"] as const;

export default function Onboarding() {
  const community = useCommunity();
  const { user, content, shell, updateProfile, joinWaypoint, plantSeed, setCommunication } = community;
  const copy = content.mobile!;
  const initial = STEPS.indexOf((user?.onboardingStep as (typeof STEPS)[number]) ?? "welcome");
  const [step, setStep] = useState(initial >= 0 ? initial : 0);
  const [intention, setIntention] = useState(user?.intentions[0] ?? "");
  const [waypointId, setWaypointId] = useState("");
  const [seedId, setSeedId] = useState("");
  const [preference, setPreference] = useState<"anyone" | "contextual" | "none" | "">("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (!user) return <Redirect href="/sign-in" />;
  if (user.onboardingComplete) return <Redirect href="/home" />;

  async function saveStep(next: string, patch: Parameters<typeof updateProfile>[0] = {}) {
    setPending(true);
    const message = await updateProfile({ ...patch, onboardingStep: next });
    setPending(false);
    if (message) {
      setError(message);
      return false;
    }
    setError("");
    return true;
  }

  async function next(skipOptional = false) {
    const current = STEPS[step];
    if (current === "welcome") {
      if (await saveStep("season")) setStep(1);
      return;
    }
    if (current === "season") {
      if (!intention) {
        setError("Choose one. You can change it later.");
        return;
      }
      if (await saveStep("connection", { intentions: [intention] })) setStep(2);
      return;
    }
    if (current === "connection") {
      if (await saveStep("waypoint")) setStep(3);
      return;
    }
    if (current === "waypoint") {
      if (!skipOptional && waypointId) {
        const message = await joinWaypoint(waypointId);
        if (message) {
          setError(message);
          return;
        }
      }
      if (await saveStep("seed")) setStep(4);
      return;
    }
    if (current === "seed") {
      if (!skipOptional && seedId) {
        const message = await plantSeed(seedId, "");
        if (message) {
          setError(message);
          return;
        }
      }
      if (await saveStep("contact")) setStep(5);
      return;
    }
    if (current === "contact") {
      if (!preference) {
        setError("Choose how people may reach you. Nothing is selected for you.");
        return;
      }
      const message = await setCommunication(preference);
      if (message) {
        setError(message);
        return;
      }
      if (await saveStep("arrive")) setStep(6);
      return;
    }
    setPending(true);
    const message = await updateProfile({ onboardingComplete: true, onboardingStep: "arrive" });
    setPending(false);
    if (message) setError(message);
  }

  return (
    <Screen>
      <Muted>
        {step + 1} of {STEPS.length}
      </Muted>
      {STEPS[step] === "welcome" ? (
        <>
          <Title>{copy.welcomeHello}</Title>
          <Body>{copy.welcomeBody}</Body>
        </>
      ) : null}
      {STEPS[step] === "season" ? (
        <>
          <Title>What brings you here right now?</Title>
          <Body>You can change this later.</Body>
          {INTENTIONS.map((item) => (
            <Choice key={item.id} label={item.label} selected={intention === item.id} onPress={() => setIntention(item.id)} />
          ))}
        </>
      ) : null}
      {STEPS[step] === "connection" ? (
        <>
          <Title>{copy.communityNote}</Title>
          {copy.connectionNote.map((line) => (
            <Body key={line}>{line}</Body>
          ))}
          <Muted>Reading this is enough. You do not have to promise anything.</Muted>
        </>
      ) : null}
      {STEPS[step] === "waypoint" ? (
        <>
          <Title>Take a seat, if you want one.</Title>
          <Body>A waypoint is a topic to return to. This is optional.</Body>
          {shell.waypoints.map((waypoint) => (
            <Choice
              key={waypoint.id}
              label={waypoint.name}
              hint={waypoint.summary}
              selected={waypointId === waypoint.id}
              onPress={() => setWaypointId(waypoint.id)}
            />
          ))}
          <Button label={copy.maybeLater} tone="quiet" onPress={() => void next(true)} />
        </>
      ) : null}
      {STEPS[step] === "seed" ? (
        <>
          <Title>Plant a first seed?</Title>
          <Body>A seed is a tiny future. This is optional.</Body>
          {shell.seeds.slice(0, 6).map((seed) => (
            <Choice key={seed.id} label={seed.title} hint={seed.description} selected={seedId === seed.id} onPress={() => setSeedId(seed.id)} />
          ))}
          <Button label={copy.maybeLater} tone="quiet" onPress={() => void next(true)} />
        </>
      ) : null}
      {STEPS[step] === "contact" ? (
        <>
          <Title>Who may start a conversation?</Title>
          <Choice label="Anyone can start a conversation with me" selected={preference === "anyone"} onPress={() => setPreference("anyone")} />
          <Choice
            label="Only through shared context"
            hint="Recommended"
            selected={preference === "contextual"}
            onPress={() => setPreference("contextual")}
          />
          <Choice
            label="No private conversations at this time"
            selected={preference === "none"}
            onPress={() => setPreference("none")}
          />
        </>
      ) : null}
      {STEPS[step] === "arrive" ? (
        <>
          <Title>You are here.</Title>
          <Body>Go solo, not alone.</Body>
          <Card tone="sage">
            <Subtitle>{copy.arriveCampfire}</Subtitle>
            <Button label={copy.arriveCampfire} onPress={() => router.push("/campfire")} />
          </Card>
          <Button label={copy.arriveGarden} tone="quiet" onPress={() => router.push("/garden")} />
          <Button label={copy.arriveReading} tone="quiet" onPress={() => router.push("/reading-room")} />
        </>
      ) : null}
      <ErrorNote>{error}</ErrorNote>
      {STEPS[step] === "arrive" ? (
        <Button label={pending ? "Saving" : "Finish arriving"} onPress={() => void next()} disabled={pending} />
      ) : STEPS[step] === "waypoint" || STEPS[step] === "seed" ? (
        <Button label={pending ? "Saving" : copy.beginLabel} onPress={() => void next()} disabled={pending} />
      ) : (
        <Button label={pending ? "Saving" : copy.beginLabel} onPress={() => void next()} disabled={pending} />
      )}
    </Screen>
  );
}
