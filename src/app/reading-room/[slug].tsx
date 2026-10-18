import { useLocalSearchParams } from "expo-router";
import { Share } from "react-native";
import { Body, Button, Screen, Title, TopBar } from "@/components/ui";
import { useCommunity } from "@/state/community";

export default function ReadingDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { readings } = useCommunity();
  const reading = readings.find((item) => item.slug === slug);
  const site = (process.env.EXPO_PUBLIC_SITE_URL || process.env.EXPO_PUBLIC_API_URL || "").replace(/\/$/, "");
  if (!reading) {
    return (
      <Screen>
        <TopBar back />
        <Title>This reading is not here.</Title>
      </Screen>
    );
  }
  return (
    <Screen>
      <TopBar back title="Reading Room" />
      <Title>{reading.title}</Title>
      <Body>{reading.standfirst}</Body>
      {reading.paragraphs.map((paragraph) => (
        <Body key={paragraph}>{paragraph}</Body>
      ))}
      <Button
        label="Share"
        tone="quiet"
        onPress={() =>
          void Share.share({
            message: site ? `${site}/reading/${reading.slug}` : `gosolo://reading-room/${reading.slug}`,
          })
        }
      />
    </Screen>
  );
}
