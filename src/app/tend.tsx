import { useState } from "react";
import { Body, Button, Choice, ErrorNote, Field, Screen, Title, TopBar } from "@/components/ui";
import { CHECK_IN_FREQUENCIES, CHECK_IN_STYLES, INTERESTS, SUPPORT_WITH, type LifeSeed } from "@/domain/types";
import { createId } from "@/domain/format";
import { pickPhoto } from "@/components/media";
import { useCommunity } from "@/state/community";

export default function Tend() {
  const { user, updateProfile, setInterests, saveGrowing, saveHelp, uploadAvatar } = useCommunity();
  const [name, setName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [interests, setInterestList] = useState(user?.interests ?? []);
  const [growing, setGrowing] = useState<LifeSeed[]>(user?.growing ?? []);
  const [seedName, setSeedName] = useState("");
  const [help, setHelp] = useState("");
  const [offer, setOffer] = useState("");
  const [note, setNote] = useState(user?.helpPlantNote ?? "");
  const [error, setError] = useState("");
  if (!user) return null;

  return (
    <Screen>
      <TopBar back title="Tend" />
      <Title>Tend this garden</Title>
      <Field label="Name" value={name} onChangeText={setName} />
      <Field label="A note about you" value={bio} onChangeText={setBio} multiline />
      <Field label="Location" value={location} onChangeText={setLocation} />
      <Button
        label="Choose a profile photo"
        tone="quiet"
        onPress={async () => {
          const asset = await pickPhoto();
          if (!asset) return;
          setError((await uploadAvatar(asset.uri, asset.mimeType ?? "image/jpeg")) ?? "");
        }}
      />
      {INTERESTS.map((interest) => (
        <Choice
          key={interest.id}
          label={interest.label}
          selected={interests.includes(interest.id)}
          onPress={() =>
            setInterestList((current) =>
              current.includes(interest.id) ? current.filter((item) => item !== interest.id) : [...current, interest.id],
            )
          }
        />
      ))}
      <Field label="A seed you are growing" value={seedName} onChangeText={setSeedName} />
      <Button
        label="Add that seed"
        tone="quiet"
        onPress={() => {
          if (!seedName.trim()) return;
          setGrowing((current) => [
            ...current,
            { id: createId(), name: seedName.trim(), status: "active", since: new Date().toISOString(), lookingForSupport: false },
          ]);
          setSeedName("");
        }}
      />
      {growing.map((seed) => (
        <Body key={seed.id}>{seed.name}</Body>
      ))}
      <Field label="Help you would like" value={help} onChangeText={setHelp} />
      <Field label="Help you can offer" value={offer} onChangeText={setOffer} />
      <Field label="A note about what you can share" value={note} onChangeText={setNote} multiline />
      {SUPPORT_WITH.map((item) => (
        <Choice
          key={item.id}
          label={item.label}
          selected={user.supportWith.includes(item.id)}
          onPress={() =>
            void updateProfile({
              supportWith: user.supportWith.includes(item.id)
                ? user.supportWith.filter((id) => id !== item.id)
                : [...user.supportWith, item.id],
            })
          }
        />
      ))}
      {CHECK_IN_FREQUENCIES.map((item) => (
        <Choice key={item.id} label={item.label} selected={user.checkInFrequency === item.id} onPress={() => void updateProfile({ checkInFrequency: item.id })} />
      ))}
      {CHECK_IN_STYLES.map((item) => (
        <Choice key={item.id} label={item.label} selected={user.checkInStyle === item.id} onPress={() => void updateProfile({ checkInStyle: item.id })} />
      ))}
      <ErrorNote>{error}</ErrorNote>
      <Button
        label="Save"
        onPress={async () => {
          const message = await updateProfile({ displayName: name.trim(), bio: bio.trim(), location: location.trim(), helpPlantNote: note.trim() });
          const interestsMessage = await setInterests(interests);
          const growingMessage = await saveGrowing(growing);
          const helpMessage = await saveHelp("growing", help.split(",").map((item) => item.trim()).filter(Boolean));
          const offerMessage = await saveHelp("plant", offer.split(",").map((item) => item.trim()).filter(Boolean), note.trim());
          setError(message || interestsMessage || growingMessage || helpMessage || offerMessage || "");
        }}
      />
    </Screen>
  );
}
