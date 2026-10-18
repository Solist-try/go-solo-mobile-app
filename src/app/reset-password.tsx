import { useState } from "react";
import { Body, Button, ErrorNote, Field, Screen, Title, TopBar } from "@/components/ui";
import { useCommunity } from "@/state/community";

export default function ResetPassword() {
  const { updatePassword } = useCommunity();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function submit() {
    const message = await updatePassword(current, password);
    if (message) setError(message);
    else setSaved(true);
  }

  return (
    <Screen>
      <TopBar back title="New password" />
      <Title>A new password.</Title>
      <Body>The reset letter opens the website. If you already know the current password, you can replace it here. Use at least 8 characters.</Body>
      {saved ? <Body>Saved. You can sign in with it now.</Body> : null}
      <Field label="Current password" value={current} onChangeText={setCurrent} secure />
      <Field label="New password" value={password} onChangeText={setPassword} secure />
      <ErrorNote>{error}</ErrorNote>
      <Button label="Save password" onPress={submit} />
    </Screen>
  );
}
