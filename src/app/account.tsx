import { useState } from "react";
import { router } from "expo-router";
import { Body, Button, ErrorNote, Field, Muted, Screen, Title, TopBar } from "@/components/ui";
import { useCommunity } from "@/state/community";

const FACTS = [
  "Deleting an account removes the sign-in immediately. The house has no grace period.",
  "The profile, and the posts, stories, comments, seeds, and offers tied to it, are removed with the account.",
  "An introduction is removed if either person deletes their account. A conversation opened by this account is removed with it.",
  "A steward’s moderation record is not automatically erased.",
  "Mobile sign-in tokens are revoked because the account itself is deleted.",
  "There is no export file. You can ask for a copy from the contact page.",
];

export default function Account() {
  const { user, updatePassword, deleteAccount, signOut, content } = useCommunity();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  if (!user) return null;
  return (
    <Screen>
      <TopBar back title="Account" />
      <Title>Account</Title>
      <Body>{user.email}</Body>
      <Field label="Current password" value={currentPassword} onChangeText={setCurrentPassword} secure />
      <Field label="New password" value={password} onChangeText={setPassword} secure />
      <Button
        label="Update password"
        onPress={async () => setError((await updatePassword(currentPassword, password)) ?? "")}
      />
      <Title>Delete this account</Title>
      {FACTS.map((fact) => (
        <Body key={fact}>{fact}</Body>
      ))}
      <Muted>This follows the house rule: the account row is deleted, and rows that belong to it go with it. It is immediate.</Muted>
      <Field label="Type DELETE to confirm" value={confirm} onChangeText={setConfirm} autoCapitalize="characters" />
      <ErrorNote>{error}</ErrorNote>
      <Button
        label="Delete account"
        tone="ink"
        onPress={async () => {
          if (confirm.trim() !== "DELETE") {
            setError("Type DELETE to close the account.");
            return;
          }
          const message = await deleteAccount(confirm.trim());
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
