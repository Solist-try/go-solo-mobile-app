import type {
  CampfireKind,
  CampfirePost,
  CampfireSection,
  Capabilities,
  Comment,
  CommunicationPreference,
  Conversation,
  LifeSeed,
  Membership,
  Message,
  NotificationPrefs,
  OutTherePost,
  Partnership,
  PrivateSession,
  Profile,
  Reaction,
  ReactionKind,
  Report,
  Seed,
  SeedStatus,
  SeedSupport,
  SkillConnection,
  SkillOffer,
  SkillRequest,
  UserSeed,
  Waypoint,
  WouldAgain,
} from "@/domain/types";
import { defaultNotificationPrefs, emptyWorld, type Block, type DismissedPin, type World } from "@/domain/types";
import type { SiteContent } from "@/domain/content";

export type Shell = {
  profile: Profile | null;
  content: SiteContent;
  seeds: Seed[];
  waypoints: Waypoint[];
  world: World;
  capabilities: Capabilities;
  needsVerification?: boolean;
  fromCache?: boolean;
};

export type StoryInput = {
  title: string;
  body: string;
  imageUrl?: string;
  imageAlt?: string;
  clientKey?: string;
};

export type CampfireInput = {
  section: CampfireSection;
  kind: CampfireKind;
  title: string;
  body: string;
  waypointId?: string;
  imageUrl?: string;
  imageAlt?: string;
  clientKey?: string;
};

export type Repository = {
  mode: "live" | "preview";
  restore(): Promise<import("./result").ApiResult<Shell>>;
  signIn(email: string, password: string): Promise<import("./result").ApiResult<Shell>>;
  signUp(email: string, password: string, displayName: string): Promise<import("./result").ApiResult<Shell>>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<import("./result").ApiResult<null>>;
  updatePassword(password: string): Promise<import("./result").ApiResult<null>>;
  resendVerification(): Promise<import("./result").ApiResult<null>>;
  deleteAccount(): Promise<import("./result").ApiResult<null>>;
  refresh(): Promise<import("./result").ApiResult<Shell>>;
  updateProfile(patch: Partial<Profile>): Promise<import("./result").ApiResult<Shell>>;
  setInterests(ids: string[]): Promise<import("./result").ApiResult<Shell>>;
  uploadAvatar(uri: string, mime: string): Promise<import("./result").ApiResult<Shell>>;
  plantSeed(seedId: string, goal: string): Promise<import("./result").ApiResult<Shell>>;
  setSeedStatus(userSeedId: string, status: SeedStatus): Promise<import("./result").ApiResult<Shell>>;
  addSeedReflection(userSeedId: string, note: string): Promise<import("./result").ApiResult<Shell>>;
  offerSeedSupport(userSeedId: string, note: string): Promise<import("./result").ApiResult<Shell>>;
  saveGrowing(seeds: LifeSeed[]): Promise<import("./result").ApiResult<Shell>>;
  saveHelp(kind: "growing" | "plant", titles: string[], note?: string): Promise<import("./result").ApiResult<Shell>>;
  joinWaypoint(id: string): Promise<import("./result").ApiResult<Shell>>;
  leaveWaypoint(id: string): Promise<import("./result").ApiResult<Shell>>;
  publishCampfire(input: CampfireInput): Promise<import("./result").ApiResult<Shell>>;
  publishStory(input: StoryInput): Promise<import("./result").ApiResult<Shell>>;
  updateStory(id: string, input: StoryInput): Promise<import("./result").ApiResult<Shell>>;
  comment(targetType: "campfire" | "out-there", targetId: string, body: string): Promise<import("./result").ApiResult<Shell>>;
  react(targetType: "campfire" | "out-there", targetId: string, kind: ReactionKind | null): Promise<import("./result").ApiResult<Shell>>;
  offerSkill(skill: string, description: string): Promise<import("./result").ApiResult<Shell>>;
  requestSkill(skill: string, description: string): Promise<import("./result").ApiResult<Shell>>;
  expressInterest(input: { offerId?: string; requestId?: string; toUserId: string; note: string }): Promise<import("./result").ApiResult<Shell>>;
  setSwapStatus(id: string, status: SkillConnection["status"], reflection?: string): Promise<import("./result").ApiResult<Shell>>;
  openSame(seedId: string, goal: string): Promise<import("./result").ApiResult<Shell>>;
  consentSame(id: string, decision: "accepted" | "declined"): Promise<import("./result").ApiResult<Shell>>;
  setCommunication(preference: CommunicationPreference): Promise<import("./result").ApiResult<Shell>>;
  startConversation(input: {
    targetId: string;
    contextType: Conversation["contextType"];
    contextId: string;
    contextLabel: string;
    note: string;
  }): Promise<import("./result").ApiResult<Shell>>;
  sendMessage(conversationId: string, body: string, clientKey: string): Promise<import("./result").ApiResult<Shell>>;
  chooseInteraction(
    conversationId: string,
    choice: "continue" | "keep-in-touch" | "space" | "decline",
    phrase: string,
  ): Promise<import("./result").ApiResult<Shell>>;
  setConversationFlag(
    conversationId: string,
    flag: "mute" | "unmute" | "archive" | "restore" | "close",
  ): Promise<import("./result").ApiResult<Shell>>;
  report(input: { targetType: Report["targetType"]; targetId: string; reason: string }): Promise<import("./result").ApiResult<Shell>>;
  block(userId: string): Promise<import("./result").ApiResult<Shell>>;
  unblock(userId: string): Promise<import("./result").ApiResult<Shell>>;
  markNotifications(): Promise<import("./result").ApiResult<Shell>>;
  dismissPin(targetType: DismissedPin["targetType"], targetId: string): Promise<import("./result").ApiResult<Shell>>;
  revealPins(): Promise<import("./result").ApiResult<Shell>>;
  stewardModerate(input: { kind: "campfire" | "story"; id: string; hidden?: boolean; pinned?: boolean }): Promise<import("./result").ApiResult<Shell>>;
  proposeSession(input: { contextType: "skill-swap" | "same"; contextId: string; memberId: string; startsAt: string; endsAt: string }): Promise<import("./result").ApiResult<Shell>>;
  agreeSession(id: string): Promise<import("./result").ApiResult<Shell>>;
  answerContinuation(id: string, agree: boolean): Promise<import("./result").ApiResult<Shell>>;
  registerPushToken(token: string, platform: string): Promise<import("./result").ApiResult<null>>;
};

export type { Block, CampfirePost, Comment, Membership, Message, NotificationPrefs, OutTherePost, Partnership, PrivateSession, Profile, Reaction, Seed, SeedSupport, SkillConnection, SkillOffer, SkillRequest, UserSeed, Waypoint, World, WouldAgain };

export function fullCapabilities(): Capabilities {
  return {
    conversations: true,
    blocks: true,
    reports: true,
    seedSupport: true,
    sessions: true,
    dismissals: true,
    communicationColumn: true,
  };
}

export function emptyCapabilities(): Capabilities {
  return {
    conversations: false,
    blocks: false,
    reports: false,
    seedSupport: false,
    sessions: false,
    dismissals: false,
    communicationColumn: false,
  };
}

export function blankProfile(id: string, email: string): Profile {
  return {
    id,
    email,
    displayName: "",
    bio: "",
    location: "",
    avatarUrl: "",
    intentions: [],
    interests: [],
    onboardingComplete: false,
    onboardingStep: null,
    emailVerified: false,
    showLocation: true,
    showWaypoints: true,
    notifyReplies: true,
    notifyWaypoints: false,
    notifyCheckins: true,
    notificationPrefs: defaultNotificationPrefs(),
    communicationPreference: "contextual",
    takingSpace: false,
    createdAt: new Date().toISOString(),
    role: "member",
    status: "active",
    growing: [],
    helpGrowing: [],
    helpPlant: [],
    helpPlantNote: "",
    supportWith: [],
    checkInFrequency: "",
    checkInStyle: "",
    sameNotes: "",
  };
}

export { emptyWorld };
