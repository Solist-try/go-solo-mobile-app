import { Body, Screen, Title, TopBar } from "@/components/ui";
import { useCommunity } from "@/state/community";

export default function Policies() {
  const { content } = useCommunity();
  return (
    <Screen>
      <TopBar back title="Policies" />
      <Title>Privacy</Title>
      <Body>
        Go Solo stores the account, garden, writing, and conversations you choose to create, in the same database as the website. The app keeps the sign-in token in the device keychain or keystore. It does not claim end-to-end encryption, anonymity, or zero data collection.
      </Body>
      <Title>Community</Title>
      {content.manifesto.map((line) => (
        <Body key={line}>{line}</Body>
      ))}
      <Body>Difference is not harm. Boundaries and respect can coexist. Report something that should not be in the room, and a steward reads it in context.</Body>
      <Title>Terms</Title>
      <Body>One membership covers the website and the apps. You can delete the account from Account. Shared moderation records may remain.</Body>
      <Title>Safety</Title>
      <Body>You can report a post, a reply, a story, a conversation, or a message, and you can block a member. A block stops new contact. The other person is not notified.</Body>
    </Screen>
  );
}
