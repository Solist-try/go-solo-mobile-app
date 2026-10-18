import { router } from "expo-router";
import { Body, Card, Muted, Screen, TextLink, Title } from "@/components/ui";
import { GardenBody } from "@/components/garden-body";
import { useCommunity } from "@/state/community";

export default function MyGarden() {
  const { user } = useCommunity();
  if (!user) return null;
  return (
    <Screen>
      <Title>My Garden</Title>
      <Body>My life here. What you are tending, where you are sitting, and how people may reach you.</Body>
      <GardenBody profileId={user.id} />
      <Card>
        <Muted>Tend this garden</Muted>
        <TextLink label="Edit your garden" onPress={() => router.push("/tend")} />
        <TextLink label="Account" onPress={() => router.push("/account")} />
        <TextLink label="Communication" onPress={() => router.push("/settings")} />
      </Card>
    </Screen>
  );
}
