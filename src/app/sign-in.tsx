import { useState } from "react";
import { Redirect, router } from "expo-router";
import { Banner, Body, Button, ErrorNote, Field, Screen, TextLink, Title, TopBar } from "@/components/ui";
import { useCommunity } from "@/state/community";

export default function SignIn() {
  const { user, signIn } = useCommunity();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  if (user && !user.emailVerified) return <Redirect href="/verify-email" />;
  if (user && !user.onboardingComplete) return <Redirect href="/onboarding" />;
  if (user) return <Redirect href="/home" />;

  async function submit() {
    setPending(true);
    setError((await signIn(email, password)) ?? "");
    setPending(false);
  }

  return (
    <Screen>
      <TopBar back title="Sign in" />
      <Title>Welcome back.</Title>
      <Body>The same account you use on the website.</Body>
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <Field label="Password" value={password} onChangeText={setPassword} secure />
      <ErrorNote>{error}</ErrorNote>
      <Button label={pending ? "Signing in" : "Sign in"} onPress={submit} disabled={pending} />
      <TextLink label="I forgot my password" onPress={() => router.push("/forgot-password")} />
      <TextLink label="Create an account" onPress={() => router.push("/join")} />
    </Screen>
  );
}
