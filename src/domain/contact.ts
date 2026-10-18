import type { ContactContext, World } from "./types";
import { decideContact, sameMessagingReady, type ContactFacts } from "./policy";

export function contextsBetween(world: World, viewerId: string, targetId: string): ContactContext[] {
  const contexts: ContactContext[] = [];
  if (
    world.seedSupports.some(
      (item) =>
        (item.ownerId === viewerId && item.supporterId === targetId) ||
        (item.ownerId === targetId && item.supporterId === viewerId),
    )
  ) {
    contexts.push("seed-support");
  }
  if (
    world.connections.some(
      (item) =>
        item.status !== "declined" &&
        item.status !== "archived" &&
        ((item.fromUserId === viewerId && item.toUserId === targetId) ||
          (item.fromUserId === targetId && item.toUserId === viewerId)),
    )
  ) {
    contexts.push("skill-swap");
  }
  if (
    world.partnerships.some(
      (item) =>
        item.status === "matched" &&
        sameMessagingReady(item.seekerConsent, item.partnerConsent) &&
        ((item.seekerId === viewerId && item.partnerId === targetId) ||
          (item.seekerId === targetId && item.partnerId === viewerId)),
    )
  ) {
    contexts.push("same");
  }

  const posts = [
    ...world.campfire.map((post) => ({
      id: post.id,
      authorId: post.authorId,
      kind: post.waypointId ? ("waypoint-discussion" as const) : ("campfire" as const),
    })),
    ...world.stories.map((post) => ({ id: post.id, authorId: post.authorId, kind: "out-there" as const })),
  ];
  for (const comment of world.comments) {
    const post = posts.find((item) => item.id === comment.targetId);
    if (!post) continue;
    const pair =
      (comment.authorId === viewerId && post.authorId === targetId) ||
      (comment.authorId === targetId && post.authorId === viewerId);
    if (pair && !contexts.includes(post.kind)) contexts.push(post.kind);
  }

  if (
    world.conversations.some(
      (item) =>
        item.status === "accepted" &&
        ((item.requesterId === viewerId && item.recipientId === targetId) ||
          (item.requesterId === targetId && item.recipientId === viewerId)),
    )
  ) {
    contexts.push("existing-conversation");
  }
  return contexts;
}

export function contactBetween(world: World, viewerId: string, targetId: string) {
  const target = world.profiles.find((profile) => profile.id === targetId);
  const facts: ContactFacts = {
    viewerId,
    targetId,
    targetPreference: target?.communicationPreference ?? "contextual",
    targetTakingSpace: Boolean(target?.takingSpace),
    viewerBlockedTarget: world.blocks.some((block) => block.blockerId === viewerId && block.blockedId === targetId),
    targetBlockedViewer: world.blocks.some((block) => block.blockerId === targetId && block.blockedId === viewerId),
    contexts: contextsBetween(world, viewerId, targetId),
  };
  return decideContact(facts);
}
