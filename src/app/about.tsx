import { Body, Screen, Title, TopBar } from "@/components/ui";
import { useCommunity } from "@/state/community";

export default function About() {
  const { content } = useCommunity();
  return (
    <Screen>
      <TopBar back title="About" />
      <Title>{content.heroTagline}</Title>
      <Body>{content.founderBio}</Body>
      {content.founderLetter.map((paragraph) => (
        <Body key={paragraph}>{paragraph}</Body>
      ))}
      <Body>{content.founderName}</Body>
      {content.philosophyParagraphs.map((paragraph) => (
        <Body key={paragraph}>{paragraph}</Body>
      ))}
    </Screen>
  );
}
