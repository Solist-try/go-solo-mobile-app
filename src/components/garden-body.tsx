import { router } from "expo-router";
import { Body, Card, Muted, TextLink } from "@/components/ui";
import { labelOf, CHECK_IN_FREQUENCIES, CHECK_IN_STYLES, SUPPORT_WITH } from "@/domain/types";
import { formatMonthYear } from "@/domain/format";
import { useCommunity } from "@/state/community";

export function GardenBody({ profileId }: { profileId: string }) {
  const { shell, user, content } = useCommunity();
  const profile = shell.world.profiles.find((item) => item.id === profileId);
  if (!profile) return <Muted>This person is not in the room.</Muted>;
  const self = profile.id === user?.id;
  const showLocation = self || profile.showLocation;
  const showWaypoints = self || profile.showWaypoints;
  const chairs = shell.world.memberships
    .filter((item) => item.userId === profile.id)
    .map((item) => shell.waypoints.find((waypoint) => waypoint.id === item.waypointId))
    .filter((item) => item);
  const seeds = [
    ...profile.growing.map((seed) => seed.name),
    ...shell.world.userSeeds.filter((seed) => seed.userId === profile.id).map((seed) => seed.title || seed.seedId),
  ];
  const stories = shell.world.stories.filter((story) => story.authorId === profile.id && !story.hidden).slice(0, 3);
  const copy = content.mobile!;

  return (
    <>
      <Body>{profile.displayName || "Unnamed"}</Body>
      {showLocation && profile.location ? <Muted>{profile.location}</Muted> : null}
      {profile.bio ? <Body>{profile.bio}</Body> : null}
      <Muted>Joined {formatMonthYear(profile.createdAt)}</Muted>
      {self ? (
        <Muted>
          Conversations: {copy && profile.communicationPreference === "none" ? "No private conversations at this time" : profile.communicationPreference === "anyone" ? "Anyone can start a conversation" : "Only through shared context"}
        </Muted>
      ) : null}
      {showWaypoints ? (
        <Card tone="mist">
          <Muted>Current waypoints</Muted>
          {chairs.length === 0 ? <Body>No chair yet.</Body> : chairs.map((waypoint) => <Body key={waypoint!.id}>{waypoint!.name}</Body>)}
        </Card>
      ) : null}
      <Card tone="sage">
        <Muted>Seeds I’m growing</Muted>
        {seeds.length === 0 ? <Body>{copy.emptySeeds}</Body> : seeds.map((name) => <Body key={name}>{name}</Body>)}
        {profile.growing.map((seed) => (
          <Muted key={seed.id}>
            {seed.name}: {copy.seedStatus[seed.status] ?? seed.status}
            {seed.lookingForSupport ? " · open to support" : ""}
          </Muted>
        ))}
      </Card>
      <Card>
        <Muted>Seeds I’d like help growing</Muted>
        {(profile.helpGrowing.length ? profile.helpGrowing : ["Nothing named yet."]).map((item) => (
          <Body key={item}>{item}</Body>
        ))}
      </Card>
      <Card tone="gold">
        <Muted>Seeds I’m happy to help plant</Muted>
        {profile.helpPlantNote ? <Body>{profile.helpPlantNote}</Body> : null}
        {(profile.helpPlant.length ? profile.helpPlant : ["Nothing named yet."]).map((item) => (
          <Body key={item}>{item}</Body>
        ))}
      </Card>
      <Card>
        <Muted>Support preferences</Muted>
        <Body>{profile.supportWith.map((id) => labelOf(SUPPORT_WITH, id)).join(", ") || "Not named yet."}</Body>
        <Muted>Preferred pace</Muted>
        <Body>{labelOf(CHECK_IN_FREQUENCIES, profile.checkInFrequency) || "Not named yet."}</Body>
        <Muted>How they show up</Muted>
        <Body>{labelOf(CHECK_IN_STYLES, profile.checkInStyle) || "Not named yet."}</Body>
      </Card>
      {stories.length ? (
        <Card>
          <Muted>Out There</Muted>
          {stories.map((story) => (
            <TextLink key={story.id} label={story.title} onPress={() => router.push(`/out-there/${story.id}`)} />
          ))}
        </Card>
      ) : null}
    </>
  );
}
