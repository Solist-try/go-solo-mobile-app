export const INTENTIONS = [
  { id: "starting-over", label: "Starting over" },
  { id: "meeting-people", label: "Building friendships" },
  { id: "first-time-alone", label: "Living independently" },
  { id: "confidence", label: "Growing confidence" },
  { id: "connection", label: "Finding community" },
  { id: "curiosity", label: "Exploring what comes next" },
  { id: "prefer-not", label: "Prefer not to say" },
  { id: "adventure", label: "More adventure" },
  { id: "accountability", label: "Accountability" },
] as const;

export const INTERESTS = [
  { id: "travel", label: "Travel" },
  { id: "books", label: "Books" },
  { id: "creativity", label: "Creativity" },
  { id: "nature", label: "Nature" },
  { id: "learning", label: "Learning" },
  { id: "cooking", label: "Cooking" },
  { id: "walking", label: "Walking" },
  { id: "diy", label: "DIY" },
  { id: "personal-growth", label: "Personal Growth" },
] as const;

export const SEED_CATEGORIES = [
  { id: "adventure", label: "Adventure", line: "Go somewhere you have been postponing." },
  { id: "connection", label: "Connection", line: "Reach toward someone without turning it into a performance." },
  { id: "creativity", label: "Creativity", line: "Make something that does not need an audience." },
  { id: "home", label: "Home", line: "Shape the place where your life actually happens." },
  { id: "growth", label: "Growth", line: "Begin the thing at the size of one hour." },
  { id: "wellbeing", label: "Wellbeing", line: "Give your days a little more room to breathe." },
  { id: "practical-life", label: "Practical Life", line: "Meals, money, repairs, and the routines that hold a week together." },
  { id: "relationships", label: "Relationships", line: "A friend, a coffee, a local group, a way back into community." },
] as const;

export const CAMPFIRE_SECTIONS = [
  { id: "general", label: "General", line: "Whatever is actually in the room." },
  { id: "growing", label: "Growing", line: "The stretch of trying something new." },
  { id: "solo-living", label: "Solo Living", line: "The practical, tender work of a life of your own." },
  { id: "deep-thoughts", label: "Deep Thoughts", line: "Slower sentences. Nothing to solve." },
] as const;

export const CAMPFIRE_KINDS = [
  { id: "question", label: "Question" },
  { id: "thought", label: "Thought" },
  { id: "reflection", label: "Reflection" },
  { id: "daily-life", label: "Daily life" },
  { id: "story", label: "Story" },
  { id: "celebration", label: "Celebration" },
  { id: "challenge", label: "Challenge" },
] as const;

export const REACTIONS = [
  { id: "inspired", label: "Inspired me" },
  { id: "relate", label: "I relate" },
  { id: "perspective", label: "Interesting perspective" },
] as const;

export const WOULD_AGAIN = [
  { id: "yes", label: "Yes" },
  { id: "maybe", label: "Maybe, differently" },
  { id: "not-this-way", label: "Not in this way" },
] as const;

export const SUPPORT_WITH = [
  { id: "accountability", label: "Accountability" },
  { id: "starting-over", label: "Starting Over" },
  { id: "connection", label: "Connection" },
  { id: "confidence", label: "Confidence" },
  { id: "medical", label: "Medical Buddy" },
  { id: "practical-life", label: "Practical Life" },
] as const;

export const CHECK_IN_FREQUENCIES = [
  { id: "daily", label: "Daily" },
  { id: "several-weekly", label: "Several times per week" },
  { id: "weekly", label: "Weekly" },
  { id: "fortnightly", label: "Every two weeks" },
  { id: "monthly", label: "Monthly" },
  { id: "as-needed", label: "As needed" },
] as const;

export const CHECK_IN_STYLES = [
  { id: "messages", label: "Messages" },
  { id: "voice", label: "Voice Notes" },
  { id: "video", label: "Video Calls" },
  { id: "email", label: "Email" },
  { id: "any", label: "Any Format" },
] as const;

export const COMMUNICATION_CHOICES = [
  { id: "anyone", label: "Anyone can start a conversation with me", recommended: false },
  { id: "contextual", label: "Only through shared context", recommended: true },
  { id: "none", label: "No private conversations at this time", recommended: false },
] as const;

export type IntentionId = (typeof INTENTIONS)[number]["id"];
export type SeedCategory = (typeof SEED_CATEGORIES)[number]["id"];
export type SeedKind = "practice" | "same" | "skill-swap";
export type CampfireSection = (typeof CAMPFIRE_SECTIONS)[number]["id"];
export type CampfireKind = (typeof CAMPFIRE_KINDS)[number]["id"];
export type ReactionKind = (typeof REACTIONS)[number]["id"];
export type WouldAgain = (typeof WOULD_AGAIN)[number]["id"];
export type SeedStatus = "active" | "resting" | "completed";
export type MemberRole = "member" | "admin";
export type MemberStatus = "active" | "suspended" | "deactivated";
export type CommunicationPreference = "anyone" | "contextual" | "none";
export type ContactContext =
  | "seed-support"
  | "skill-swap"
  | "same"
  | "campfire"
  | "out-there"
  | "waypoint-discussion"
  | "existing-conversation";

export type LifeSeed = {
  id: string;
  name: string;
  status: "active" | "resting" | "completed";
  since: string;
  lookingForSupport: boolean;
};

export type Profile = {
  id: string;
  email: string;
  displayName: string;
  bio: string;
  location: string;
  avatarUrl: string;
  intentions: string[];
  interests: string[];
  onboardingComplete: boolean;
  onboardingStep: string | null;
  emailVerified: boolean;
  showLocation: boolean;
  showWaypoints: boolean;
  notifyReplies: boolean;
  notifyWaypoints: boolean;
  notifyCheckins: boolean;
  notificationPrefs: NotificationPrefs;
  communicationPreference: CommunicationPreference;
  takingSpace: boolean;
  createdAt: string;
  role: MemberRole;
  status: MemberStatus;
  growing: LifeSeed[];
  helpGrowing: string[];
  helpPlant: string[];
  helpPlantNote: string;
  supportWith: string[];
  checkInFrequency: string;
  checkInStyle: string;
  sameNotes: string;
};

export type NotificationPrefs = {
  conversations: boolean;
  messages: boolean;
  seeds: boolean;
  skills: boolean;
  same: boolean;
  replies: boolean;
  notices: boolean;
};

export type Waypoint = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  focus: string[];
  colour?: "sage" | "clay" | "gold" | "mist";
  icon?: string;
  archived?: boolean;
};

export type Seed = {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: SeedCategory;
  kind: SeedKind;
  timeframe: string;
  waypoints: string[];
  difficulty?: "gentle" | "steady" | "brave";
  archived?: boolean;
};

export type CheckIn = {
  id: string;
  at: string;
  note: string;
  userId?: string;
};

export type UserSeed = {
  id: string;
  userId: string;
  seedId: string;
  title?: string;
  status: SeedStatus;
  goal: string;
  startedAt: string;
  checkIns: CheckIn[];
  lookingForSupport?: boolean;
};

export type Membership = {
  userId: string;
  waypointId: string;
  joinedAt: string;
};

export type Partnership = {
  id: string;
  seedId: string;
  seekerId: string;
  partnerId: string | null;
  goal: string;
  status: "seeking" | "matched";
  createdAt: string;
  checkIns: CheckIn[];
  seekerConsent: "accepted" | "declined" | null;
  partnerConsent: "accepted" | "declined" | null;
};

export type SkillOffer = {
  id: string;
  userId: string;
  skill: string;
  description: string;
  createdAt: string;
  status?: "open" | "paused" | "completed" | "archived";
};

export type SkillRequest = {
  id: string;
  userId: string;
  skill: string;
  description: string;
  createdAt: string;
  status?: "open" | "paused" | "completed" | "archived";
};

export type SkillConnection = {
  id: string;
  fromUserId: string;
  toUserId: string;
  offerId?: string;
  requestId?: string;
  note: string;
  createdAt: string;
  status: "interest" | "accepted" | "declined" | "paused" | "completed" | "archived";
  reflection?: string;
};

export type OutTherePost = {
  id: string;
  authorId: string;
  title: string;
  whatDidYouDo: string;
  expecting: string;
  actuallyHappened: string;
  wouldDoAgain: WouldAgain;
  seedId?: string;
  waypointId?: string;
  imageUrl?: string;
  imageAlt?: string;
  createdAt: string;
  hidden?: boolean;
  pinned?: boolean;
  featured?: boolean;
  example?: boolean;
};

export type CampfirePost = {
  id: string;
  authorId: string;
  section: CampfireSection;
  kind: CampfireKind;
  title: string;
  body: string;
  waypointId?: string;
  seedId?: string;
  outThereId?: string;
  imageUrl?: string;
  imageAlt?: string;
  createdAt: string;
  hidden?: boolean;
  pinned?: boolean;
  featured?: boolean;
  locked?: boolean;
  example?: boolean;
};

export type Comment = {
  id: string;
  authorId: string;
  targetType: "out-there" | "campfire";
  targetId: string;
  body: string;
  imageUrl?: string;
  imageAlt?: string;
  createdAt: string;
  hidden?: boolean;
};

export type Reaction = {
  id: string;
  userId: string;
  targetType: "out-there" | "campfire";
  targetId: string;
  kind: ReactionKind;
};

export type AppNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
  category?: string;
};

export type ConversationStatus = "request" | "accepted" | "declined" | "closed" | "archived" | "space";

export type Conversation = {
  id: string;
  contextType: ContactContext | "direct";
  contextId: string;
  contextLabel: string;
  requesterId: string;
  recipientId: string;
  status: ConversationStatus;
  mutedBy: string[];
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  authorId: string;
  body: string;
  imageUrl?: string;
  imageAlt?: string;
  createdAt: string;
  clientKey?: string;
};

export type Block = {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
};

export type Report = {
  id: string;
  reporterId: string;
  targetType: "campfire" | "comment" | "out-there" | "message" | "conversation" | "member";
  targetId: string;
  reason: string;
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
};

export type SeedSupport = {
  id: string;
  userSeedId: string;
  ownerId: string;
  supporterId: string;
  note: string;
  status: "offered" | "closed";
  createdAt: string;
};

export type PrivateSession = {
  id: string;
  contextType: "skill-swap" | "same";
  contextId: string;
  memberA: string;
  memberB: string;
  startsAt: string;
  endsAt: string;
  aAgreed: boolean;
  bAgreed: boolean;
  continuationA: boolean | null;
  continuationB: boolean | null;
  status: "proposed" | "scheduled" | "declined" | "completed";
  createdAt: string;
};

export type DismissedPin = {
  userId: string;
  targetType: "campfire" | "out-there" | "waypoint";
  targetId: string;
};

export type World = {
  profiles: Profile[];
  userSeeds: UserSeed[];
  memberships: Membership[];
  partnerships: Partnership[];
  offers: SkillOffer[];
  requests: SkillRequest[];
  connections: SkillConnection[];
  stories: OutTherePost[];
  campfire: CampfirePost[];
  comments: Comment[];
  reactions: Reaction[];
  notifications: AppNotification[];
  conversations: Conversation[];
  messages: Message[];
  blocks: Block[];
  reports: Report[];
  seedSupports: SeedSupport[];
  sessions: PrivateSession[];
  dismissedPins: DismissedPin[];
};

export type Capabilities = {
  conversations: boolean;
  blocks: boolean;
  reports: boolean;
  seedSupport: boolean;
  sessions: boolean;
  dismissals: boolean;
  communicationColumn: boolean;
};

export function emptyWorld(): World {
  return {
    profiles: [],
    userSeeds: [],
    memberships: [],
    partnerships: [],
    offers: [],
    requests: [],
    connections: [],
    stories: [],
    campfire: [],
    comments: [],
    reactions: [],
    notifications: [],
    conversations: [],
    messages: [],
    blocks: [],
    reports: [],
    seedSupports: [],
    sessions: [],
    dismissedPins: [],
  };
}

export function defaultNotificationPrefs(): NotificationPrefs {
  return {
    conversations: true,
    messages: true,
    seeds: true,
    skills: true,
    same: true,
    replies: true,
    notices: true,
  };
}

export function labelOf(list: readonly { id: string; label: string }[], id?: string) {
  if (!id) return "";
  return list.find((item) => item.id === id)?.label ?? id;
}
