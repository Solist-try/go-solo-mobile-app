import type {
  CommunicationPreference,
  ContactContext,
  Conversation,
  NotificationPrefs,
  PrivateSession,
  SeedStatus,
} from "./types";

export type ContactFacts = {
  viewerId: string;
  targetId: string;
  targetPreference: CommunicationPreference;
  targetTakingSpace: boolean;
  viewerBlockedTarget: boolean;
  targetBlockedViewer: boolean;
  contexts: ContactContext[];
};

export type ContactDecision = {
  allowed: boolean;
  /** Safe to show the viewer. Never names a hidden preference or a block they did not create. */
  message: string;
};

const UNAVAILABLE = "A private conversation is not available right now.";

export function decideContact(facts: ContactFacts): ContactDecision {
  if (!facts.viewerId || facts.viewerId === facts.targetId) {
    return { allowed: false, message: UNAVAILABLE };
  }
  if (facts.viewerBlockedTarget) {
    return { allowed: false, message: "You have blocked this member. You can unblock them in settings." };
  }
  if (facts.targetBlockedViewer || facts.targetTakingSpace || facts.targetPreference === "none") {
    return { allowed: false, message: UNAVAILABLE };
  }
  if (facts.targetPreference === "anyone") {
    return { allowed: true, message: "" };
  }
  const qualifying = facts.contexts.filter((context) => context !== ("waypoint-membership" as ContactContext));
  if (qualifying.length === 0) {
    return { allowed: false, message: UNAVAILABLE };
  }
  return { allowed: true, message: "" };
}

export function sameMessagingReady(seekerConsent: string | null, partnerConsent: string | null) {
  return seekerConsent === "accepted" && partnerConsent === "accepted";
}

export function seedAcceptsSupport(status: SeedStatus | "active" | "resting") {
  return status === "active";
}

export function bothAgreedToAnotherSession(session: Pick<PrivateSession, "continuationA" | "continuationB">) {
  return session.continuationA === true && session.continuationB === true;
}

export function continuationIsNeutral(session: Pick<PrivateSession, "continuationA" | "continuationB">) {
  const answers = [session.continuationA, session.continuationB];
  const yes = answers.filter((answer) => answer === true).length;
  return yes < 2;
}

export type PushKind = "message" | "request" | "seed" | "skill" | "same" | "reply" | "session" | "notice";

export function pushCopy(kind: PushKind): { title: string; body: string } {
  switch (kind) {
    case "message":
      return { title: "Go Solo", body: "There is a new note in a conversation." };
    case "request":
      return { title: "Go Solo", body: "Someone would like to start a conversation." };
    case "seed":
      return { title: "Go Solo", body: "Someone offered support." };
    case "skill":
      return { title: "Go Solo", body: "Someone is interested in a skill swap." };
    case "same":
      return { title: "Go Solo", body: "There is news about an introduction." };
    case "reply":
      return { title: "Go Solo", body: "Someone replied to something you shared." };
    case "session":
      return { title: "Go Solo", body: "A session you both accepted is coming up." };
    case "notice":
      return { title: "Go Solo", body: "There is a community note for you." };
  }
}

export function pushAllowed(prefs: NotificationPrefs, kind: PushKind, muted: boolean) {
  if (muted) return false;
  if (kind === "message") return prefs.messages;
  if (kind === "request") return prefs.conversations;
  if (kind === "seed") return prefs.seeds;
  if (kind === "skill") return prefs.skills;
  if (kind === "same") return prefs.same;
  if (kind === "reply") return prefs.replies;
  if (kind === "session") return prefs.conversations;
  return prefs.notices;
}

export function redactError(message: string | undefined | null): { code: string; message: string } {
  const raw = (message ?? "").trim();
  const lower = raw.toLowerCase();
  if (!raw) return { code: "server", message: "Something got in the way. Please try again." };
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return { code: "unauthorized", message: "That email and password do not match." };
  }
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return { code: "conflict", message: "An account with that email already exists. Try signing in." };
  }
  if (lower.includes("email not confirmed")) {
    return { code: "unauthorized", message: "Confirm your email first, then come back." };
  }
  if (lower.includes("password")) {
    return { code: "validation", message: "Use at least 8 characters." };
  }
  if (lower.includes("jwt") || lower.includes("not authenticated") || lower.includes("permission denied")) {
    return { code: "forbidden", message: "You do not have access to that." };
  }
  if (
    lower.includes("does not exist") ||
    lower.includes("schema cache") ||
    lower.includes("could not find") ||
    lower.includes("relation")
  ) {
    return { code: "unavailable", message: "That part of the community is not available yet." };
  }
  if (lower.includes("row-level security") || lower.includes("violates")) {
    return { code: "forbidden", message: "That could not be saved." };
  }
  if (lower.includes("too many") || lower.includes("rate")) {
    return { code: "rate_limited", message: "That is a little fast. Wait a moment, then try again." };
  }
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("failed to")) {
    return { code: "offline", message: "The connection dropped. Nothing was published." };
  }
  return { code: "server", message: "Something got in the way. Please try again." };
}

export function safeLink(href: string) {
  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function readingCategoryForIntentions(intentions: string[]) {
  if (intentions.includes("starting-over")) return "starting-over";
  if (intentions.includes("first-time-alone")) return "independent-living";
  if (intentions.includes("connection") || intentions.includes("meeting-people")) return "connection";
  if (intentions.includes("adventure")) return "out-there";
  if (intentions.includes("confidence")) return "reflections";
  return "living-well";
}

export function conversationPair(conversation: Pick<Conversation, "requesterId" | "recipientId">, userId: string) {
  return conversation.requesterId === userId || conversation.recipientId === userId;
}
