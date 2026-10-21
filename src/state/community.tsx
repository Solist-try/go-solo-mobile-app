import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { defaultContent, type SiteContent } from "@/domain/content";
import { createId } from "@/domain/format";
import { readingCategoryForIntentions } from "@/domain/policy";
import { READINGS } from "@/domain/fallback-readings";
import {
  emptyWorld,
  type CommunicationPreference,
  type LifeSeed,
  type Profile,
  type ReactionKind,
  type SeedStatus,
  type SkillConnection,
  type World,
} from "@/domain/types";
import { createLiveRepository, liveConfigured } from "@/api/live";
import { createPreviewRepository } from "@/api/preview";
import type { CampfireInput, MediaRecord, MediaUpload, Repository, Shell, StoryInput } from "@/api/contract";
import type { Report } from "@/domain/types";

type Draft = { id: string; kind: string; body: string; updatedAt: string };

type CommunityValue = {
  ready: boolean;
  offline: boolean;
  mode: "live" | "preview";
  user: Profile | null;
  content: SiteContent;
  shell: Shell;
  readings: typeof READINGS;
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, displayName: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<string | null>;
  updatePassword: (current: string, next: string) => Promise<string | null>;
  resendVerification: () => Promise<string | null>;
  deleteAccount: (confirm: string) => Promise<string | null>;
  updateProfile: (patch: Partial<Profile>) => Promise<string | null>;
  setInterests: (ids: string[]) => Promise<string | null>;
  uploadAvatar: (uri: string, mime: string) => Promise<string | null>;
  plantSeed: (seedId: string, goal: string) => Promise<string | null>;
  setSeedStatus: (userSeedId: string, status: SeedStatus) => Promise<string | null>;
  addSeedReflection: (userSeedId: string, note: string) => Promise<string | null>;
  offerSeedSupport: (userSeedId: string, note: string) => Promise<string | null>;
  saveGrowing: (seeds: LifeSeed[]) => Promise<string | null>;
  saveHelp: (kind: "growing" | "plant", titles: string[], note?: string) => Promise<string | null>;
  joinWaypoint: (id: string) => Promise<string | null>;
  leaveWaypoint: (id: string) => Promise<string | null>;
  publishCampfire: (input: CampfireInput) => Promise<string | null>;
  publishStory: (input: StoryInput) => Promise<string | null>;
  updateStory: (id: string, input: StoryInput) => Promise<string | null>;
  uploadMedia: (input: MediaUpload) => Promise<{ media: MediaRecord } | { error: string }>;
  removeMedia: (id: string) => Promise<string | null>;
  readingNote: (slug: string) => Promise<{ body: string } | { error: string; code: string }>;
  saveReadingNote: (slug: string, body: string) => Promise<{ body: string } | { error: string; code: string }>;
  comment: (targetType: "campfire" | "out-there", targetId: string, body: string, mediaId?: string, imageAlt?: string) => Promise<string | null>;
  react: (targetType: "campfire" | "out-there", targetId: string, kind: ReactionKind | null) => Promise<string | null>;
  offerSkill: (skill: string, description: string) => Promise<string | null>;
  requestSkill: (skill: string, description: string) => Promise<string | null>;
  expressInterest: (input: { offerId?: string; requestId?: string; toUserId: string; note: string }) => Promise<string | null>;
  setSwapStatus: (id: string, status: SkillConnection["status"], reflection?: string) => Promise<string | null>;
  openSame: (seedId: string, goal: string) => Promise<string | null>;
  consentSame: (id: string, decision: "accepted" | "declined") => Promise<string | null>;
  setCommunication: (preference: CommunicationPreference) => Promise<string | null>;
  startConversation: (input: {
    targetId: string;
    contextType: World["conversations"][number]["contextType"];
    contextId: string;
    contextLabel: string;
    note: string;
  }) => Promise<string | null>;
  sendMessage: (conversationId: string, body: string, clientKey: string) => Promise<string | null>;
  chooseInteraction: (conversationId: string, choice: "continue" | "keep-in-touch" | "space" | "decline") => Promise<string | null>;
  setConversationFlag: (conversationId: string, flag: "mute" | "unmute" | "archive" | "restore" | "close") => Promise<string | null>;
  report: (input: { targetType: Report["targetType"]; targetId: string; reason: string }) => Promise<string | null>;
  block: (userId: string) => Promise<string | null>;
  unblock: (userId: string) => Promise<string | null>;
  markNotifications: () => Promise<string | null>;
  dismissPin: (targetType: "campfire" | "out-there" | "waypoint", targetId: string) => Promise<string | null>;
  revealPins: () => Promise<string | null>;
  stewardModerate: (input: { kind: "campfire" | "story"; id: string; hidden?: boolean; pinned?: boolean }) => Promise<string | null>;
  proposeSession: (input: { contextType: "skill-swap" | "same"; contextId: string; memberId: string; startsAt: string; endsAt: string }) => Promise<string | null>;
  agreeSession: (id: string) => Promise<string | null>;
  answerContinuation: (id: string, agree: boolean) => Promise<string | null>;
  registerPushToken: (token: string, platform: string) => Promise<string | null>;
  nameOf: (id?: string) => string;
  readingSuggestion: string;
  unread: number;
  saveDraft: (kind: string, body: string) => Promise<void>;
  clearDraft: (kind: string) => Promise<void>;
  draft: (kind: string) => string;
};

const fallbackShell: Shell = {
  profile: null,
  content: defaultContent(),
  seeds: [],
  waypoints: [],
  world: emptyWorld(),
  capabilities: {
    conversations: false,
    blocks: false,
    reports: false,
    seedSupport: false,
    sessions: false,
    dismissals: false,
    communicationColumn: false,
  },
};

const CommunityContext = createContext<CommunityValue | null>(null);

function draftKey(userId: string) {
  return `gosolo.drafts.${userId}`;
}

export function CommunityProvider({ children }: { children: ReactNode }) {
  const repoRef = useRef<Repository | null>(null);
  const [shell, setShell] = useState<Shell>(fallbackShell);
  const [ready, setReady] = useState(false);
  const [offline, setOffline] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  useEffect(() => {
    const repo = liveConfigured() ? createLiveRepository() : createPreviewRepository();
    repoRef.current = repo;
    repo.restore().then((result) => {
      if (result.ok) setShell(result.data);
      setReady(true);
    });
    const subscription = NetInfo.addEventListener((state) => setOffline(state.isConnected === false));
    return () => subscription();
  }, []);

  useEffect(() => {
    const userId = shell.profile?.id;
    if (!userId) {
      setDrafts([]);
      return;
    }
    AsyncStorage.getItem(draftKey(userId)).then((raw) => {
      if (!raw) return;
      try {
        setDrafts(JSON.parse(raw) as Draft[]);
      } catch {
        setDrafts([]);
      }
    });
  }, [shell.profile?.id]);

  async function apply(result: Awaited<ReturnType<Repository["refresh"]>>) {
    if (result.ok) setShell(result.data);
    return result.ok ? null : result.error.message;
  }

  const value = useMemo<CommunityValue>(() => {
    const repo = () => {
      if (!repoRef.current) throw new Error("The community is still opening.");
      return repoRef.current;
    };
    const user = shell.profile;
    return {
      ready,
      offline,
      mode: repoRef.current?.mode ?? (liveConfigured() ? "live" : "preview"),
      user,
      content: shell.content,
      shell,
      readings: shell.readings?.length ? shell.readings : READINGS,
      refresh: async () => {
        await apply(await repo().refresh());
      },
      signIn: async (email, password) => apply(await repo().signIn(email, password)),
      signUp: async (email, password, displayName) => apply(await repo().signUp(email, password, displayName)),
      signOut: async () => {
        if (user) await AsyncStorage.removeItem(draftKey(user.id));
        setDrafts([]);
        await repo().signOut();
        const restored = await repo().restore();
        if (restored.ok) setShell(restored.data);
      },
      requestPasswordReset: async (email) => {
        const result = await repo().requestPasswordReset(email);
        return result.ok ? null : result.error.message;
      },
      updatePassword: async (current, next) => {
        const result = await repo().updatePassword(current, next);
        return result.ok ? null : result.error.message;
      },
      resendVerification: async () => {
        const result = await repo().resendVerification();
        return result.ok ? null : result.error.message;
      },
      deleteAccount: async (confirm) => {
        const result = await repo().deleteAccount(confirm);
        if (!result.ok) return result.error.message;
        const restored = await repo().restore();
        if (restored.ok) setShell(restored.data);
        return null;
      },
      updateProfile: async (patch) => apply(await repo().updateProfile(patch)),
      setInterests: async (ids) => apply(await repo().setInterests(ids)),
      uploadAvatar: async (uri, mime) => apply(await repo().uploadAvatar(uri, mime)),
      uploadMedia: async (input) => {
        const result = await repo().uploadMedia(input);
        if (!result.ok) return { error: result.error.message };
        if (input.context === "profile") {
          const refreshed = await repo().refresh();
          if (refreshed.ok) setShell(refreshed.data);
        }
        return { media: result.data };
      },
      removeMedia: async (id) => {
        const result = await repo().removeMedia(id);
        if (!result.ok) return result.error.message;
        if (id === "avatar") {
          const refreshed = await repo().refresh();
          if (refreshed.ok) setShell(refreshed.data);
        }
        return null;
      },
      readingNote: async (slug) => {
        const result = await repo().readingNote(slug);
        if (!result.ok) return { error: result.error.message, code: result.error.code };
        return { body: result.data.body };
      },
      saveReadingNote: async (slug, body) => {
        const result = await repo().saveReadingNote(slug, body);
        if (!result.ok) return { error: result.error.message, code: result.error.code };
        return { body: result.data.body };
      },
      plantSeed: async (seedId, goal) => apply(await repo().plantSeed(seedId, goal)),
      setSeedStatus: async (id, status) => apply(await repo().setSeedStatus(id, status)),
      addSeedReflection: async (id, note) => apply(await repo().addSeedReflection(id, note)),
      offerSeedSupport: async (id, note) => apply(await repo().offerSeedSupport(id, note)),
      saveGrowing: async (seeds) => apply(await repo().saveGrowing(seeds)),
      saveHelp: async (kind, titles, note) => apply(await repo().saveHelp(kind, titles, note)),
      joinWaypoint: async (id) => apply(await repo().joinWaypoint(id)),
      leaveWaypoint: async (id) => apply(await repo().leaveWaypoint(id)),
      publishCampfire: async (input) => apply(await repo().publishCampfire(input)),
      publishStory: async (input) => apply(await repo().publishStory(input)),
      updateStory: async (id, input) => apply(await repo().updateStory(id, input)),
      comment: async (targetType, targetId, body, mediaId, imageAlt) =>
        apply(await repo().comment(targetType, targetId, body, mediaId, imageAlt)),
      react: async (targetType, targetId, kind) => apply(await repo().react(targetType, targetId, kind)),
      offerSkill: async (skill, description) => apply(await repo().offerSkill(skill, description)),
      requestSkill: async (skill, description) => apply(await repo().requestSkill(skill, description)),
      expressInterest: async (input) => apply(await repo().expressInterest(input)),
      setSwapStatus: async (id, status, reflection) => apply(await repo().setSwapStatus(id, status, reflection)),
      openSame: async (seedId, goal) => apply(await repo().openSame(seedId, goal)),
      consentSame: async (id, decision) => apply(await repo().consentSame(id, decision)),
      setCommunication: async (preference) => apply(await repo().setCommunication(preference)),
      startConversation: async (input) => apply(await repo().startConversation(input)),
      sendMessage: async (conversationId, body, clientKey) => apply(await repo().sendMessage(conversationId, body, clientKey)),
      chooseInteraction: async (conversationId, choice) => {
        const phrase = shell.content.mobile?.interaction[choice] ?? choice;
        return apply(await repo().chooseInteraction(conversationId, choice, phrase));
      },
      setConversationFlag: async (id, flag) => apply(await repo().setConversationFlag(id, flag)),
      report: async (input) => apply(await repo().report(input)),
      block: async (id) => apply(await repo().block(id)),
      unblock: async (id) => apply(await repo().unblock(id)),
      markNotifications: async () => apply(await repo().markNotifications()),
      dismissPin: async (targetType, targetId) => apply(await repo().dismissPin(targetType, targetId)),
      revealPins: async () => apply(await repo().revealPins()),
      stewardModerate: async (input) => apply(await repo().stewardModerate(input)),
      proposeSession: async (input) => apply(await repo().proposeSession(input)),
      agreeSession: async (id) => apply(await repo().agreeSession(id)),
      answerContinuation: async (id, agree) => apply(await repo().answerContinuation(id, agree)),
      registerPushToken: async (token, platform) => {
        const result = await repo().registerPushToken(token, platform);
        return result.ok ? null : result.error.message;
      },
      nameOf: (id) => shell.world.profiles.find((profile) => profile.id === id)?.displayName || "A member",
      readingSuggestion: readingCategoryForIntentions(user?.intentions ?? []),
      unread: shell.world.notifications.filter((item) => item.userId === user?.id && !item.read).length,
      saveDraft: async (kind, body) => {
        if (!user) return;
        const next = [...drafts.filter((item) => item.kind !== kind), { id: createId(), kind, body, updatedAt: new Date().toISOString() }];
        setDrafts(next);
        await AsyncStorage.setItem(draftKey(user.id), JSON.stringify(next));
      },
      clearDraft: async (kind) => {
        if (!user) return;
        const next = drafts.filter((item) => item.kind !== kind);
        setDrafts(next);
        await AsyncStorage.setItem(draftKey(user.id), JSON.stringify(next));
      },
      draft: (kind) => drafts.find((item) => item.kind === kind)?.body ?? "",
    };
  }, [drafts, offline, ready, shell]);

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>;
}

export function useCommunity() {
  const value = useContext(CommunityContext);
  if (!value) throw new Error("useCommunity must be used within CommunityProvider");
  return value;
}
