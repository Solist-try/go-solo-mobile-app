import { router } from "expo-router";
import { Body, Card, Screen, TextLink, Title } from "@/components/ui";
import { SEED_CATEGORIES } from "@/domain/types";
import { useCommunity } from "@/state/community";

export default function Seeds() {
  const { shell, content } = useCommunity();
  return (
    <Screen>
      <Title>Seeds</Title>
      <Body>{content.seedsIntro}</Body>
      {SEED_CATEGORIES.map((category) => {
        const seeds = shell.seeds.filter((seed) => seed.category === category.id);
        if (!seeds.length) return null;
        return (
          <Card key={category.id}>
            <Title>{category.label}</Title>
            <Body>{category.line}</Body>
            {seeds.map((seed) => (
              <TextLink key={seed.id} label={seed.title} onPress={() => router.push(`/seeds/${seed.id}`)} />
            ))}
          </Card>
        );
      })}
    </Screen>
  );
}
