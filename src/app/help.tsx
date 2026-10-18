import { router } from "expo-router";
import { Body, Screen, TextLink, Title, TopBar } from "@/components/ui";

export default function Help() {
  return (
    <Screen>
      <TopBar back title="Help" />
      <Title>Help</Title>
      <Body>Go Solo is a home base you can leave and return to. Nothing here keeps a streak.</Body>
      <TextLink label="Privacy and community" onPress={() => router.push("/policies")} />
      <TextLink label="Contact" onPress={() => router.push("/contact")} />
      <TextLink label="Account" onPress={() => router.push("/account")} />
      <TextLink label="Communication" onPress={() => router.push("/settings")} />
    </Screen>
  );
}
