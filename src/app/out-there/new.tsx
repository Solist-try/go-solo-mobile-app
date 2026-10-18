import { router } from "expo-router";
import { useState } from "react";
import { Image } from "react-native";
import { Body, Button, ErrorNote, Field, Muted, Screen, Title, TopBar } from "@/components/ui";
import { pickPhoto } from "@/components/media";
import { useCommunity } from "@/state/community";

const PROMPTS = ["What did you try?", "What surprised you?", "What happened next?", "Would you do it again?"];

export default function NewStory() {
  const { publishStory, draft, saveDraft, clearDraft } = useCommunity();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState(draft("story"));
  const [imageUri, setImageUri] = useState("");
  const [alt, setAlt] = useState("");
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
      {imageUri ? <Image source={{ uri: imageUri }} style={{ width: 160, height: 120, borderRadius: 16 }} accessibilityLabel={alt || "Chosen photo"} /> : null}
      <Button label="Choose a photo" tone="quiet" onPress={async () => {
        const asset = await pickPhoto();
        if (asset) setImageUri(asset.uri);
      }} />
      {imageUri ? <Field label="Alt text" value={alt} onChangeText={setAlt} /> : null}
      <ErrorNote>{error}</ErrorNote>
      <Button
        label="Share the story"
        onPress={async () => {
          await saveDraft("story", body);
          const message = await publishStory({ title, body, imageUrl: imageUri || undefined, imageAlt: alt || undefined });
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
