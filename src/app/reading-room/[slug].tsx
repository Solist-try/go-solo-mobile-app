import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Share } from "react-native";
import { Body, Button, Card, ErrorNote, Field, Muted, Screen, Subtitle, Title, TopBar } from "@/components/ui";
import { useCommunity } from "@/state/community";

function noteKey(userId: string, slug: string) {
  return `gosolo.reading-note.${userId}.${slug}`;
}

export default function ReadingDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { readings, user, readingNote, saveReadingNote } = useCommunity();
  const reading = readings.find((item) => item.slug === slug);
  const site = (process.env.EXPO_PUBLIC_SITE_URL || process.env.EXPO_PUBLIC_API_URL || "").replace(/\/$/, "");
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [kept, setKept] = useState<"account" | "phone" | "">("");
  const [showSeed, setShowSeed] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !reading) return;
    let cancel = false;
    const slug = reading.slug;
    const localKey = noteKey(user.id, slug);
    void (async () => {
      const local = (await AsyncStorage.getItem(localKey)) ?? "";
      const result = await readingNote(slug);
      if (cancel) return;
      if ("body" in result && result.body) {
        setSavedNote(result.body);
        setKept("account");
        await AsyncStorage.setItem(localKey, result.body);
        return;
      }
      if (local) {
        setSavedNote(local);
        setKept("phone");
      }
    })();
    return () => {
      cancel = true;
    };
  }, [user, reading, readingNote]);

  if (!reading) {
    return (
      <Screen>
        <TopBar back />
        <Title>This reading is not here.</Title>
      </Screen>
    );
  }

  const article = reading;
  const waypoint = article.waypoints?.[0];

  async function saveNote(fromPhone = "") {
    if (!user) {
      router.push("/sign-in");
      return;
    }
    const text = (fromPhone || note).trim();
    if (!text) {
      setError("Write a few words, or leave it for later.");
      return;
    }
    const result = await saveReadingNote(article.slug, text);
    await AsyncStorage.setItem(noteKey(user.id, article.slug), text);
    setSavedNote(text);
    setNote("");
    if ("error" in result) {
      setKept("phone");
      setError(result.code === "offline" ? "The house did not answer. This copy is on the phone." : result.error);
      return;
    }
    setKept("account");
    setError("");
  }

  return (
    <Screen>
      <TopBar back title="Reading Room" />
      <Title>{article.title}</Title>
      <Body>{article.standfirst}</Body>
      {article.paragraphs.map((paragraph) => (
        <Body key={paragraph}>{paragraph}</Body>
      ))}
      <Button
        label="Share"
        tone="quiet"
        onPress={() =>
          void Share.share({
            message: site ? `${site}/reading/${article.slug}` : `gosolo://reading-room/${article.slug}`,
          })
        }
      />

      <Card tone="mist">
        <Subtitle>What did this bring up for you?</Subtitle>
        {savedNote ? (
          <>
            <Muted>{kept === "account" ? "Saved with your account. Only you can read it." : "Saved on this phone until the house can keep it."}</Muted>
            <Body>{savedNote}</Body>
            {kept === "phone" ? (
              <Button
                label="Keep it with your account"
                tone="quiet"
                onPress={() => {
                  void saveNote(savedNote);
                }}
              />
            ) : null}
          </>
        ) : (
          <>
            <Field label="A private note" value={note} onChangeText={setNote} multiline />
            <Muted>This stays with your account. It is not posted to the campfire.</Muted>
            <Button label="Save a note" tone="quiet" onPress={() => void saveNote()} />
          </>
        )}
        <Button
          label="Bring this to Campfire"
          onPress={() => router.push(user ? `/campfire/new?reading=${article.slug}` : "/sign-in")}
        />
        {waypoint ? (
          <>
            <Muted>Continue the conversation</Muted>
            <Body>{waypoint.name}</Body>
            <Muted>{waypoint.discussions === 1 ? "1 discussion" : `${waypoint.discussions} discussions`}</Muted>
            <Button label="Take a seat" tone="quiet" onPress={() => router.push(`/waypoints/${waypoint.slug}`)} />
          </>
        ) : null}
        {showSeed ? (
          <>
            <Body>A seed is a tiny future. Would you like to grow something from this?</Body>
            <Button label="Plant a seed" tone="quiet" onPress={() => router.push(user ? "/seeds" : "/sign-in")} />
            <Button label="Maybe later" tone="quiet" onPress={() => setShowSeed(false)} />
          </>
        ) : null}
        <ErrorNote>{error}</ErrorNote>
      </Card>
    </Screen>
  );
}
