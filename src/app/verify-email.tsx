import { Body, Button, ErrorNote, Screen, Title } from "@/components/ui";
import { useState } from "react";
import { useCommunity } from "@/state/community";

export default function VerifyEmail() {
  const { user, resendVerification, mode } = useCommunity();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  return (
    <Screen>
      <Title>Confirm your email.</Title>
      <Body>The letter goes to {user?.email || "your inbox"}. Come back after you confirm it. The same confirmation works on the website.</Body>
      {mode === "preview" ? <Body>Preview marks the address confirmed when the account is created.</Body> : null}
      {note ? <Body>{note}</Body> : null}
      <ErrorNote>{error}</ErrorNote>
      <Button
        label="Send the letter again"
        onPress={async () => {
          const message = await resendVerification();
          if (message) setError(message);
          else setNote("Sent, if the address still needs confirming.");
        }}
      />
    </Screen>
  );
}
