import { useState } from "react";
import { Redirect, router } from "expo-router";
import { Body, Button, ErrorNote, Field, Screen, TextLink, Title, TopBar } from "@/components/ui";
import { useCommunity } from "@/state/community";

export default function Join() {
  const { user, signUp, mode } = useCommunity();
  if (user && !user.emailVerified) return <Redirect href="/verify-email" />;
  if (user && !user.onboardingComplete) return <Redirect href="/onboarding" />;
  if (user) return <Redirect href="/home" />;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!name.trim()) {
      setError("A name helps people sit with you.");
      return;
    }
    setPending(true);
    setError((await signUp(email, password, name)) ?? "");
    setPending(false);
  }

  return (
    <Screen>
      <TopBar back title="Join" />
      <Title>Join Go Solo.</Title>
      <Body>One account, shared with the website. You do not need a separate mobile membership.</Body>
      {mode === "preview" ? <Body>This preview keeps the account on this device until Supabase is connected.</Body> : null}
      <Field label="Name" value={name} onChangeText={setName} />
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <Field label="Password" value={password} onChangeText={setPassword} secure />
      <ErrorNote>{error}</ErrorNote>
      <Button label={pending ? "Creating" : "Create account"} onPress={submit} disabled={pending} />
      <TextLink label="I already have an account" onPress={() => router.push("/sign-in")} />
    </Screen>
  );
}
