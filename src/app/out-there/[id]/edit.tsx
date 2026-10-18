import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Button, ErrorNote, Field, Muted, Screen, Title, TopBar } from "@/components/ui";
import { pickPhoto } from "@/components/media";
import { QuietPhoto } from "@/components/photo";
import { useCommunity } from "@/state/community";

export default function EditStory() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { shell, user, updateStory } = useCommunity();
  const story = shell.world.stories.find((item) => item.id === id && item.authorId === user?.id);
  const [title, setTitle] = useState(story?.title ?? "");
  const [body, setBody] = useState(story?.whatDidYouDo ?? "");
  const [imageUri, setImageUri] = useState("");
  const [imageMime, setImageMime] = useState("");
  const [alt, setAlt] = useState(story?.imageAlt ?? "");
  const [cleared, setCleared] = useState(false);
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

  const shown = imageUri || (!cleared ? story.imageUrl : "");

  return (
    <Screen>
      <TopBar back title="Out There" />
      <Title>Edit the story</Title>
      <Muted>The title and the story stay one piece. A photo is optional.</Muted>
      <Field label="Title" value={title} onChangeText={setTitle} />
      <Field label="The story" value={body} onChangeText={setBody} multiline />
      <QuietPhoto uri={shown} alt={alt} />
      <Button
        label="Choose a different photo"
        tone="quiet"
        onPress={async () => {
          const asset = await pickPhoto();
          if (!asset) return;
          setImageUri(asset.uri);
          setImageMime(asset.mimeType ?? "image/jpeg");
          setCleared(false);
        }}
      />
      {shown ? <Field label="Alt text" value={alt} onChangeText={setAlt} /> : null}
      {shown ? (
        <Button
          label="Remove photo"
          tone="quiet"
          onPress={() => {
            setImageUri("");
            setImageMime("");
            setAlt("");
            setCleared(true);
          }}
        />
      ) : null}
      <ErrorNote>{error}</ErrorNote>
      <Button
        label={pending ? "Saving" : "Save the story"}
        disabled={pending}
        onPress={async () => {
          setPending(true);
          const message = await updateStory(story.id, {
            title,
            body,
            imageUrl: imageUri || undefined,
            imageMime: imageMime || undefined,
            imageAlt: alt,
            clearImage: cleared && !imageUri,
          });
          setPending(false);
          if (message) setError(message);
          else router.back();
        }}
      />
    </Screen>
  );
}
