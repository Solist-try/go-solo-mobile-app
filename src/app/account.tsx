import { useState } from "react";
import { router } from "expo-router";
import { Body, Button, ErrorNote, Field, Muted, Screen, Title, TopBar } from "@/components/ui";
import { useCommunity } from "@/state/community";

const FACTS = [
  "Deleting an account removes the sign-in immediately. The current database has no grace period.",
  "The profile, and the posts, stories, comments, seeds, and offers tied to it, are removed with the account.",
  "A SAME introduction where you were the other person may remain, with your place cleared.",
  "A steward’s moderation record is not automatically erased.",
  "Active sessions are revoked because the account itself is deleted.",
  "There is no separate export file yet. You can ask for a copy from the contact page.",
];

export default function Account() {
  const { user, updatePassword, deleteAccount, signOut, content } = useCommunity();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  if (!user) return null;
  return (
    <Screen>
      <TopBar back title="Account" />
      <Title>Account</Title>
      <Body>{user.email}</Body>
      <Field label="New password" value={password} onChangeText={setPassword} secure />
      <Button
        label="Update password"
        onPress={async () => setError((await updatePassword(password)) ?? "")}
      />
      <Title>Delete this account</Title>
      {FACTS.map((fact) => (
        <Body key={fact}>{fact}</Body>
      ))}
      <Muted>This follows the current delete_own_account action. It is immediate.</Muted>
      <Field label="Type your name to confirm" value={confirm} onChangeText={setConfirm} />
      <ErrorNote>{error}</ErrorNote>
      <Button
        label="Delete account"
        tone="ink"
        onPress={async () => {
          if (confirm.trim() !== user.displayName.trim()) {
            setError("Type your name exactly, so this stays deliberate.");
            return;
          }
          const message = await deleteAccount();
          if (message) setError(message);
          else router.replace("/");
        }}
      />
      <Button
        label="Sign out"
        tone="quiet"
        onPress={async () => {
          await signOut();
          router.replace("/");
        }}
      />
      <Muted>Questions go to {content.founderEmail}.</Muted>
    </Screen>
  );
}
