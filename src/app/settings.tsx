import { useState } from "react";
import { Body, Button, Choice, ErrorNote, Muted, Screen, Title, TopBar } from "@/components/ui";
import { useCommunity } from "@/state/community";

export default function Settings() {
  const community = useCommunity();
  const user = community.user;
  const [error, setError] = useState("");
  if (!user) return null;
  const preference = user.communicationPreference;

  return (
    <Screen>
      <TopBar back title="Settings" />
      <Title>Settings</Title>
      <Body>A few quiet controls.</Body>
      <Muted>Who may start a conversation</Muted>
      <Choice label="Anyone can start a conversation with me" selected={preference === "anyone"} onPress={() => void community.setCommunication("anyone")} />
      <Choice label="Only through shared context" hint="Recommended" selected={preference === "contextual"} onPress={() => void community.setCommunication("contextual")} />
      <Choice label="No private conversations at this time" selected={preference === "none"} onPress={() => void community.setCommunication("none")} />
      <Muted>Show location on your garden</Muted>
      <Button label={user.showLocation ? "Location is visible" : "Location is hidden"} tone="quiet" onPress={() => void community.updateProfile({ showLocation: !user.showLocation })} />
      <Button label={user.showWaypoints ? "Waypoints are visible" : "Waypoints are hidden"} tone="quiet" onPress={() => void community.updateProfile({ showWaypoints: !user.showWaypoints })} />
      <Muted>Notes</Muted>
      <Button label={user.notifyReplies ? "Replies are on" : "Replies are off"} tone="quiet" onPress={() => void community.updateProfile({ notifyReplies: !user.notifyReplies })} />
      <Button label={user.notifyWaypoints ? "Waypoint notes are on" : "Waypoint notes are off"} tone="quiet" onPress={() => void community.updateProfile({ notifyWaypoints: !user.notifyWaypoints })} />
      <Button label={user.notifyCheckins ? "Check-in notes are on" : "Check-in notes are off"} tone="quiet" onPress={() => void community.updateProfile({ notifyCheckins: !user.notifyCheckins })} />
      <Muted>Phone notifications are not on this house yet. In-app notes still work, and they stay short.</Muted>
      <Title>People you have blocked</Title>
      {community.shell.world.blocks.filter((block) => block.blockerId === user.id).map((block) => (
        <Button key={block.id} label={`Unblock ${community.nameOf(block.blockedId)}`} tone="quiet" onPress={() => void community.unblock(block.blockedId)} />
      ))}
      <Button label="Show hidden welcome notes again" tone="quiet" onPress={() => void community.revealPins()} />
      <ErrorNote>{error}</ErrorNote>
    </Screen>
  );
}
