import { router } from "expo-router";
import { useState } from "react";
import { Body, Button, ErrorNote, Field, Muted, Screen, Title, TopBar } from "@/components/ui";
import { emptyPhoto, photoHold, PhotoDraft, type PhotoState } from "@/components/photo-draft";
import { useCommunity } from "@/state/community";

const PROMPTS = ["What did you try?", "What surprised you?", "What happened next?", "Would you do it again?"];

export default function NewStory() {
  const { publishStory, draft, saveDraft, clearDraft } = useCommunity();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState(draft("story"));
  const [photo, setPhoto] = useState<PhotoState>(emptyPhoto);
  const [error, setError] = useState("");

  return (
    <Screen>
      <TopBar back title="Out There" />
      <Title>What happened?</Title>
      <Body>One story. The prompts below are optional company, not required fields.</Body>
      {PROMPTS.map((prompt) => (
        <Muted key={prompt}>{prompt}</Muted>
      ))}
      <Field label="Title" value={title} onChangeText={setTitle} />
      <Field label="The story" value={body} onChangeText={setBody} multiline />
      <PhotoDraft context="story" onChange={setPhoto} />
      <ErrorNote>{error}</ErrorNote>
      <Button
        label="Share the story"
        onPress={async () => {
          const held = photoHold(photo);
          if (held) {
            setError(held);
            return;
          }
          await saveDraft("story", body);
          const message = await publishStory({
            title,
            body,
            mediaId: photo.mediaId || undefined,
            imageAlt: photo.alt,
          });
          if (message) setError(message);
          else {
            await clearDraft("story");
            router.back();
          }
        }}
      />
    </Screen>
  );
}
