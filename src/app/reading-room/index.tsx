import { router } from "expo-router";
import { Body, Card, Screen, TextLink, Title, TopBar } from "@/components/ui";
import { READING_CATEGORIES } from "@/domain/fallback-readings";
import { useCommunity } from "@/state/community";

export default function ReadingRoom() {
  const { readings, content } = useCommunity();
  return (
    <Screen>
      <TopBar back title="Reading Room" />
      <Title>Reading Room</Title>
      <Body>A practical library. Not a news feed.</Body>
      {READING_CATEGORIES.map((category) => (
        <Card key={category.id}>
          <Title>{category.title}</Title>
          <Body>{category.line}</Body>
          {readings
            .filter((item) => item.category === category.id)
            .map((reading) => (
              <TextLink key={reading.slug} label={reading.title} onPress={() => router.push(`/reading-room/${reading.slug}`)} />
            ))}
        </Card>
      ))}
      <Body>{content.philosophyClose}</Body>
    </Screen>
  );
}
