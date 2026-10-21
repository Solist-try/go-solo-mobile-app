import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Button, ErrorNote, Field, Muted, Screen, Title, TopBar } from "@/components/ui";
import { emptyPhoto, photoHold, PhotoDraft, type PhotoState } from "@/components/photo-draft";
import { useCommunity } from "@/state/community";

export default function EditStory() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { shell, user, updateStory } = useCommunity();
  const story = shell.world.stories.find((item) => item.id === id && item.authorId === user?.id);
  const [title, setTitle] = useState(story?.title ?? "");
  const [body, setBody] = useState(story?.whatDidYouDo ?? "");
  const [photo, setPhoto] = useState<PhotoState>({ ...emptyPhoto, alt: story?.imageAlt ?? "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (!story) {
    return (
      <Screen>
        <TopBar back />
        <Title>This story is not yours to edit.</Title>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar back title="Out There" />
      <Title>Edit the story</Title>
      <Muted>The title and the story stay one piece. A photo is optional.</Muted>
      <Field label="Title" value={title} onChangeText={setTitle} />
      <Field label="The story" value={body} onChangeText={setBody} multiline />
      <PhotoDraft context="story" existingUrl={story.imageUrl} existingAlt={story.imageAlt} onChange={setPhoto} />
      <ErrorNote>{error}</ErrorNote>
      <Button
        label={pending ? "Saving" : "Save the story"}
        disabled={pending}
        onPress={async () => {
          const held = photoHold(photo);
          if (held) {
            setError(held);
            return;
          }
          setPending(true);
          const message = await updateStory(story.id, {
            title,
            body,
            mediaId: photo.mediaId || undefined,
            imageAlt: photo.alt,
            clearImage: photo.clear,
          });
          setPending(false);
          if (message) setError(message);
          else router.back();
        }}
      />
    </Screen>
  );
}
