import { useState } from "react";
import { Body, Button, ErrorNote, Field, Muted, Screen, Title, TopBar } from "@/components/ui";
import { useCommunity } from "@/state/community";

export default function ForgotPassword() {
  const { requestPasswordReset, mode } = useCommunity();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit() {
    const message = await requestPasswordReset(email);
    if (message) setError(message);
    else setSent(true);
  }

  return (
    <Screen>
      <TopBar back title="Password" />
      <Title>Choose a new password.</Title>
      <Body>If this email belongs to a member, a reset letter will be sent. The link opens the same account recovery the website already uses.</Body>
      {mode === "preview" ? <Muted>Preview cannot send email. On the live community, the letter comes from Go Solo.</Muted> : null}
      {sent ? <Body>If an account exists for that email, the letter is on its way.</Body> : null}
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <ErrorNote>{error}</ErrorNote>
      <Button label="Send the letter" onPress={submit} />
    </Screen>
  );
}
