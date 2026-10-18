import { useState } from "react";
import { Body, Button, ErrorNote, Field, Screen, Title, TopBar } from "@/components/ui";
import { useCommunity } from "@/state/community";

export default function ResetPassword() {
  const { updatePassword } = useCommunity();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function submit() {
    const message = await updatePassword(password);
    if (message) setError(message);
    else setSaved(true);
  }

  return (
    <Screen>
      <TopBar back title="New password" />
      <Title>A new password.</Title>
      <Body>Use at least 8 characters. This replaces the password on the shared account.</Body>
      {saved ? <Body>Saved. You can sign in with it now.</Body> : null}
      <Field label="New password" value={password} onChangeText={setPassword} secure />
      <ErrorNote>{error}</ErrorNote>
      <Button label="Save password" onPress={submit} />
    </Screen>
  );
}
