import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Body, Button, Card, Choice, ErrorNote, Field, Muted, Screen, Title, TopBar } from "@/components/ui";
import { emptyPhoto, photoHold, PhotoDraft, type PhotoState } from "@/components/photo-draft";
import { CAMPFIRE_KINDS, CAMPFIRE_SECTIONS } from "@/domain/types";
import { useCommunity } from "@/state/community";

export default function NewCampfire() {
  const { waypoint, reading } = useLocalSearchParams<{ waypoint?: string; reading?: string }>();
  const waypointId = typeof waypoint === "string" ? waypoint : undefined;
  const readingSlug = typeof reading === "string" ? reading : undefined;
  const { publishCampfire, draft, saveDraft, clearDraft, content, shell, readings } = useCommunity();
  const chair = shell.waypoints.find((item) => item.id === waypointId);
  const source = readings.find((item) => item.slug === readingSlug);
  const [keepSource, setKeepSource] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState(draft("campfire"));
  const [section, setSection] = useState<(typeof CAMPFIRE_SECTIONS)[number]["id"]>("general");
  const [kind, setKind] = useState<(typeof CAMPFIRE_KINDS)[number]["id"]>("thought");
  const [photo, setPhoto] = useState<PhotoState>(emptyPhoto);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    const held = photoHold(photo);
    if (held) {
      setError(held);
      return;
    }
    setPending(true);
    await saveDraft("campfire", body);
    const message = await publishCampfire({
      section,
      kind,
      title,
      body,
      waypointId,
      mediaId: photo.mediaId || undefined,
      imageAlt: photo.alt,
    });
    setPending(false);
    if (message) {
      setError(message);
      return;
    }
    await clearDraft("campfire");
    router.back();
  }

  return (
    <Screen>
      <TopBar back title={content.mobile!.shareIt} />
      <Title>{source && keepSource ? "What stayed with you?" : content.mobile!.pullUpAChair}</Title>
      {chair ? <Muted>This discussion sits in {chair.name}.</Muted> : null}
      {source && keepSource ? (
        <Card tone="mist">
          <Muted>From the Reading Room</Muted>
          <Body>{source.title}</Body>
          <Button label="Remove this context" tone="quiet" onPress={() => setKeepSource(false)} />
        </Card>
      ) : null}
      {source && keepSource ? null : (
        <>
          <Body>Bold, italic, a list, a quote, or a plain link are enough. Photos stay small.</Body>
          <Muted>Use **bold**, *italic*, a line starting with -, or a line starting with 1.</Muted>
          {CAMPFIRE_SECTIONS.map((item) => (
            <Choice key={item.id} label={item.label} hint={item.line} selected={section === item.id} onPress={() => setSection(item.id)} />
          ))}
          {CAMPFIRE_KINDS.map((item) => (
            <Choice key={item.id} label={item.label} selected={kind === item.id} onPress={() => setKind(item.id)} />
          ))}
        </>
      )}
      <Field label="Title" value={title} onChangeText={setTitle} />
      <Field label={source && keepSource ? "What stayed with you?" : "What do you want to say?"} value={body} onChangeText={setBody} multiline />
      <PhotoDraft context={waypointId ? "waypoint" : "campfire"} onChange={setPhoto} />
      <ErrorNote>{error}</ErrorNote>
      {error ? <Muted>The draft is still on this device.</Muted> : null}
      <Button label={pending ? "Sharing" : "Share it"} onPress={() => void submit()} disabled={pending} />
    </Screen>
  );
}
