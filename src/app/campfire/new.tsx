import { router } from "expo-router";
import { useState } from "react";
import { Image } from "react-native";
import { Body, Button, Choice, ErrorNote, Field, Muted, Screen, Title, TopBar } from "@/components/ui";
import { pickPhoto } from "@/components/media";
import { CAMPFIRE_KINDS, CAMPFIRE_SECTIONS } from "@/domain/types";
import { useCommunity } from "@/state/community";

export default function NewCampfire() {
  const { publishCampfire, draft, saveDraft, clearDraft, content } = useCommunity();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState(draft("campfire"));
  const [section, setSection] = useState<(typeof CAMPFIRE_SECTIONS)[number]["id"]>("general");
  const [kind, setKind] = useState<(typeof CAMPFIRE_KINDS)[number]["id"]>("thought");
  const [imageUri, setImageUri] = useState("");
  const [alt, setAlt] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    await saveDraft("campfire", body);
    const message = await publishCampfire({ section, kind, title, body, imageUrl: imageUri || undefined, imageAlt: alt || undefined });
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
      <Title>{content.mobile!.pullUpAChair}</Title>
      <Body>Bold, italic, a list, a quote, or a plain link are enough. Photos stay small.</Body>
      <Muted>Use **bold**, *italic*, a line starting with -, or a line starting with 1.</Muted>
      {CAMPFIRE_SECTIONS.map((item) => (
        <Choice key={item.id} label={item.label} hint={item.line} selected={section === item.id} onPress={() => setSection(item.id)} />
      ))}
      {CAMPFIRE_KINDS.map((item) => (
        <Choice key={item.id} label={item.label} selected={kind === item.id} onPress={() => setKind(item.id)} />
      ))}
      <Field label="Title" value={title} onChangeText={setTitle} />
      <Field label="What do you want to say?" value={body} onChangeText={setBody} multiline />
      {imageUri ? <Image source={{ uri: imageUri }} style={{ width: 160, height: 120, borderRadius: 16 }} accessibilityLabel={alt || "Chosen photo"} /> : null}
      <Button
        label="Choose a photo"
        tone="quiet"
        onPress={async () => {
          const asset = await pickPhoto();
          if (asset) setImageUri(asset.uri);
        }}
      />
      {imageUri ? <Field label="Alt text" value={alt} onChangeText={setAlt} /> : null}
      {imageUri ? (
        <Button
          label="Remove photo"
          tone="quiet"
          onPress={() => {
            setImageUri("");
            setAlt("");
          }}
        />
      ) : null}
      <ErrorNote>{error}</ErrorNote>
      {error ? <Muted>The draft is still on this device.</Muted> : null}
      <Button label={pending ? "Sharing" : "Share it"} onPress={() => void submit()} disabled={pending} />
    </Screen>
  );
}
