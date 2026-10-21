import { useLocalSearchParams } from "expo-router";
import { Screen, Title, TopBar } from "@/components/ui";
import { GardenBody } from "@/components/garden-body";
import { contactBetween } from "@/domain/contact";
import { useCommunity } from "@/state/community";
import { TextLink, Muted, Button } from "@/components/ui";
import { router } from "expo-router";

export default function MemberGarden() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const community = useCommunity();
  const local = community.user && id ? contactBetween(community.shell.world, community.user.id, id) : null;
  const decision =
    community.mode === "live" && id && community.shell.contactIds
      ? {
          allowed: community.shell.contactIds.includes(id),
          message: "A private conversation is not available right now.",
        }
      : local;
  return (
    <Screen>
      <TopBar back title="Garden" />
      <Title>A garden</Title>
      <GardenBody profileId={id ?? ""} />
      {decision?.allowed ? (
        <Button label="Start a conversation" onPress={() => router.push(`/conversations/new?member=${id}`)} />
      ) : decision ? (
        <Muted>{decision.message}</Muted>
      ) : null}
      {community.user && id && community.user.id !== id ? (
        <TextLink label="Block this member" onPress={() => void community.block(id)} />
      ) : null}
    </Screen>
  );
}
