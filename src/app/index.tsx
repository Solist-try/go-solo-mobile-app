import { Redirect, router } from "expo-router";
import { Banner, Body, Button, Card, Muted, Screen, Subtitle, TextLink, Title } from "@/components/ui";
import { useCommunity } from "@/state/community";

export default function Welcome() {
  const { user, content, mode, offline } = useCommunity();
  if (user && !user.emailVerified) return <Redirect href="/verify-email" />;
  if (user && !user.onboardingComplete) return <Redirect href="/onboarding" />;
  if (user) return <Redirect href="/home" />;
  const copy = content.mobile!;

  return (
    <Screen>
      {offline ? <Banner>You are offline. Public words already on this device are still here.</Banner> : null}
      {mode === "preview" ? (
        <Banner>Preview on this device. Add the Supabase address to enter the same community as the website.</Banner>
      ) : null}
      <Muted>{content.heroTagline}</Muted>
      <Title>{content.heroTitle}</Title>
      <Subtitle>{content.heroSubhead}</Subtitle>
      <Body>{content.heroSupport}</Body>
      <Body>{content.belief}</Body>
      <Body>{content.beliefSecond}</Body>
      <Button label={content.heroPrimary} onPress={() => router.push("/join")} />
      <Button label="Sign in" tone="quiet" onPress={() => router.push("/sign-in")} />
      <Subtitle>{content.howTitle}</Subtitle>
      <Muted>{content.howIntro}</Muted>
      {content.steps.map((step) => (
        <Card key={step.name} tone="sage">
          <Subtitle>
            {step.mark} {step.name}
          </Subtitle>
          <Body>{step.body}</Body>
        </Card>
      ))}
      <Card tone="gold">
        <Subtitle>{copy.communityNote}</Subtitle>
        {content.philosophyParagraphs.map((paragraph) => (
          <Body key={paragraph}>{paragraph}</Body>
        ))}
        <Muted>{content.philosophyClose}</Muted>
      </Card>
      <TextLink label="About" onPress={() => router.push("/about")} />
      <TextLink label="Reading Room" onPress={() => router.push("/reading-room")} />
      <TextLink label="Waypoints" onPress={() => router.push("/waypoints-preview")} />
      <TextLink label="Privacy and policies" onPress={() => router.push("/policies")} />
      <TextLink label="Contact" onPress={() => router.push("/contact")} />
    </Screen>
  );
}
