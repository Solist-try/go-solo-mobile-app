import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Body, Button, ErrorNote, Field, Muted, Screen, Title, TopBar } from "@/components/ui";
import { seedAcceptsSupport } from "@/domain/policy";
import { useCommunity } from "@/state/community";

export default function SeedDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const community = useCommunity();
  const seed = community.shell.seeds.find((item) => item.id === id);
  const planted = community.shell.world.userSeeds.find((item) => item.seedId === id && item.userId === community.user?.id);
  const [goal, setGoal] = useState(planted?.goal ?? "");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  if (!seed) {
    return (
      <Screen>
        <TopBar back />
        <Title>This seed is not here.</Title>
      </Screen>
    );
  }
  const others = community.shell.world.userSeeds.filter((item) => item.seedId === seed.id && item.userId !== community.user?.id);
  return (
    <Screen>
      <TopBar back title="Seed" />
      <Title>{seed.title}</Title>
      <Body>{seed.description}</Body>
      <Muted>{seed.prompt}</Muted>
      <Muted>{seed.timeframe}</Muted>
      {planted ? (
        <>
          <Muted>Status: {community.content.mobile!.seedStatus[planted.status] ?? planted.status}</Muted>
          <Field label="Optional reflection" value={note} onChangeText={setNote} multiline />
          <Button label="Save reflection" tone="quiet" onPress={async () => setError((await community.addSeedReflection(planted.id, note)) ?? "")} />
          <Button label="Growing" onPress={() => void community.setSeedStatus(planted.id, "active")} />
          <Button label="On hold" tone="quiet" onPress={() => void community.setSeedStatus(planted.id, "resting")} />
          <Button label="Grown" tone="quiet" onPress={() => void community.setSeedStatus(planted.id, "completed")} />
        </>
      ) : (
        <>
          <Field label="What would you like this to become?" value={goal} onChangeText={setGoal} multiline />
          <Button label="Plant this seed" onPress={async () => setError((await community.plantSeed(seed.id, goal)) ?? "")} />
        </>
      )}
      <ErrorNote>{error}</ErrorNote>
      {community.shell.capabilities.seedSupport ? (
        <>
          <Title>Support</Title>
          {others.map((item) => (
            <CardNote
              key={item.id}
              title={community.nameOf(item.userId)}
              open={seedAcceptsSupport(item.status)}
              onOffer={async () => setError((await community.offerSeedSupport(item.id, "I can help tend this.")) ?? "")}
            />
          ))}
        </>
      ) : (
        <Muted>Offering support is saved once the shared database update is applied.</Muted>
      )}
    </Screen>
  );
}

function CardNote({ title, open, onOffer }: { title: string; open: boolean; onOffer: () => void }) {
  return (
    <>
      <Body>{title}</Body>
      {open ? <Button label="Offer support" tone="quiet" onPress={onOffer} /> : <Muted>Not taking new support.</Muted>}
    </>
  );
}
