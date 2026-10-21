import { Linking } from "react-native";
import { Body, Button, Screen, Title, TopBar } from "@/components/ui";
import { useCommunity } from "@/state/community";

export default function Contact() {
  const { content } = useCommunity();
  const email = content.founderEmail;
  return (
    <Screen>
      <TopBar back title="Contact" />
      <Title>Contact</Title>
      <Body>{content.founderLetter[0]}</Body>
      <Button label={`Write to ${email}`} onPress={() => void Linking.openURL(`mailto:${email}?subject=Go%20Solo`)} />
      <Body>Ask for a copy of your account here if you need one. There is no automatic export yet.</Body>
    </Screen>
  );
}
