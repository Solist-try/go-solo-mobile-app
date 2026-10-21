import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { SEEDS, WAYPOINTS } from "@/domain/fallback-catalog";
import { defaultContent } from "@/domain/content";
import { contactBetween } from "@/domain/contact";
import { createId } from "@/domain/format";
import { parseSessionWindow, pushAllowed, pushCopy, sameMessagingReady, seedAcceptsSupport } from "@/domain/policy";
import {
  CHECK_IN_FREQUENCIES,
  SUPPORT_WITH,
  emptyWorld,
  type CommunicationPreference,
  type LifeSeed,
  type Profile,
  type SeedStatus,
  type SkillConnection,
  type World,
} from "@/domain/types";
import { createSecureStorage } from "./secure-storage";
import { fail, ok, type ApiResult } from "./result";
import type { MediaRecord } from "./contract";
import {
  blankProfile,
  fullCapabilities,
  type CampfireInput,
  type Repository,
  type Shell,
  type StoryInput,
} from "./contract";

const secure = createSecureStorage();
const AUTH_KEY = "gosolo.preview.auth";
const SESSION_KEY = "gosolo.preview.session";
const WORLD_KEY = "gosolo.preview.world";
const previewFiles = new Map<string, MediaRecord>();

type AuthRow = { id: string; email: string; salt: string; hash: string };

let world: World = emptyWorld();
let userId: string | null = null;
const recentWrites: number[] = [];

function shell(): Shell {
  const profile = world.profiles.find((item) => item.id === userId) ?? null;
  return {
    profile: profile ? { ...profile, email: profile.email } : null,
    content: defaultContent(),
    seeds: SEEDS.filter((seed) => !seed.archived),
    waypoints: WAYPOINTS.filter((waypoint) => !waypoint.archived),
    world: {
      ...world,
      profiles: world.profiles.map((profile) =>
        profile.id === userId ? profile : { ...profile, email: "" },
      ),
    },
    capabilities: fullCapabilities(),
  };
}

async function persist() {
  await AsyncStorage.setItem(WORLD_KEY, JSON.stringify(world));
  if (userId) await secure.setItem(SESSION_KEY, userId);
  else await secure.removeItem(SESSION_KEY);
}

async function load() {
  const raw = await AsyncStorage.getItem(WORLD_KEY);
  if (raw) {
    try {
      world = { ...emptyWorld(), ...JSON.parse(raw) };
    } catch {
      world = emptyWorld();
    }
  }
  userId = await secure.getItem(SESSION_KEY);
}

async function authRows(): Promise<AuthRow[]> {
  const raw = await secure.getItem(AUTH_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as AuthRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveAuth(rows: AuthRow[]) {
  await secure.setItem(AUTH_KEY, JSON.stringify(rows));
}

async function hashPassword(password: string, salt: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
}

function requireUser(): ApiResult<Profile> {
  const profile = world.profiles.find((item) => item.id === userId);
  if (!profile) return fail("unauthorized", "Sign in to continue.");
  if (profile.status === "suspended") return fail("forbidden", "This account is paused. Write to the steward if you need help.");
  return ok(profile);
}

function throttle() {
  const now = Date.now();
  while (recentWrites.length && now - recentWrites[0] > 60_000) recentWrites.shift();
  if (recentWrites.length >= 20) return false;
  recentWrites.push(now);
  return true;
}

function notify(targetId: string, kind: Parameters<typeof pushCopy>[0], href?: string) {
  const target = world.profiles.find((item) => item.id === targetId);
  if (!target) return;
  const prefs = target.notificationPrefs;
  if (!pushAllowed(prefs, kind, false)) return;
  if (kind === "reply" && !target.notifyReplies) return;
  const copy = pushCopy(kind);
  world.notifications.unshift({
    id: createId(),
    userId: targetId,
    title: copy.title,
    body: copy.body,
    href,
    read: false,
    createdAt: new Date().toISOString(),
    category: kind,
  });
}

async function done(): Promise<ApiResult<Shell>> {
  await persist();
  return ok(shell());
}

export function createPreviewRepository(): Repository {
  return {
    mode: "preview",
    async restore() {
      await load();
      return ok(shell());
    },
    async signIn(email, password) {
      await load();
      const row = (await authRows()).find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
      if (!row) return fail("unauthorized", "That email and password do not match.");
      const hash = await hashPassword(password, row.salt);
      if (hash !== row.hash) return fail("unauthorized", "That email and password do not match.");
      userId = row.id;
      return done();
    },
    async signUp(email, password, displayName) {
      await load();
      const normalized = email.trim().toLowerCase();
      if (!normalized.includes("@")) return fail("validation", "Enter the email you want to use.");
      if (password.length < 8) return fail("validation", "Use at least 8 characters.");
      const rows = await authRows();
      if (rows.some((item) => item.email === normalized)) {
        return fail("conflict", "An account with that email already exists. Try signing in.");
      }
      const id = createId();
      const salt = createId();
      rows.push({ id, email: normalized, salt, hash: await hashPassword(password, salt) });
      await saveAuth(rows);
      const profile = blankProfile(id, normalized);
      profile.displayName = displayName.trim();
      profile.emailVerified = true;
      world.profiles.push(profile);
      userId = id;
      const result = await done();
      if (result.ok) result.data.needsVerification = false;
      return result;
    },
    async signOut() {
      userId = null;
      await secure.removeItem(SESSION_KEY);
    },
    async requestPasswordReset(email) {
      const rows = await authRows();
      if (!rows.some((item) => item.email === email.trim().toLowerCase())) {
        return ok(null);
      }
      return ok(null);
    },
    async updatePassword(current, next) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      if (next.length < 8) return fail("validation", "Use at least 8 characters.");
      const rows = await authRows();
      const row = rows.find((item) => item.id === gate.data.id);
      if (!row) return fail("unauthorized", "Sign in to continue.");
      if ((await hashPassword(current, row.salt)) !== row.hash) return fail("validation", "The current password does not match.");
      row.salt = createId();
      row.hash = await hashPassword(next, row.salt);
      await saveAuth(rows);
      return ok(null);
    },
    async resendVerification() {
      return ok(null);
    },
    async deleteAccount(confirm) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      if (confirm.trim() !== "DELETE") return fail("validation", "Type DELETE to close the account.");
      const id = gate.data.id;
      world.profiles = world.profiles.filter((item) => item.id !== id);
      world.userSeeds = world.userSeeds.filter((item) => item.userId !== id);
      world.memberships = world.memberships.filter((item) => item.userId !== id);
      world.stories = world.stories.filter((item) => item.authorId !== id);
      world.campfire = world.campfire.filter((item) => item.authorId !== id);
      world.comments = world.comments.filter((item) => item.authorId !== id);
      world.offers = world.offers.filter((item) => item.userId !== id);
      world.requests = world.requests.filter((item) => item.userId !== id);
      world.notifications = world.notifications.filter((item) => item.userId !== id);
      world.partnerships = world.partnerships.map((item) =>
        item.partnerId === id ? { ...item, partnerId: null, status: "seeking" as const } : item,
      );
      world.partnerships = world.partnerships.filter((item) => item.seekerId !== id);
      const rows = (await authRows()).filter((item) => item.id !== id);
      await saveAuth(rows);
      userId = null;
      await persist();
      return ok(null);
    },
    async refresh() {
      await load();
      return ok(shell());
    },
    async updateProfile(patch) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      Object.assign(gate.data, patch, { id: gate.data.id, email: gate.data.email, role: gate.data.role });
      return done();
    },
    async setInterests(ids) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      gate.data.interests = ids;
      return done();
    },
    async uploadAvatar(uri) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      previewFiles.set("avatar", { id: "avatar", url: uri, alt: "", context: "profile" });
      gate.data.avatarUrl = uri;
      return done();
    },
    async uploadMedia(input) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      const id = input.context === "profile" ? "avatar" : createId();
      const media: MediaRecord = { id, url: input.uri, alt: input.alt ?? "", context: input.context };
      previewFiles.set(id, media);
      if (input.context === "profile") gate.data.avatarUrl = input.uri;
      input.onProgress?.(1);
      await persist();
      return ok(media);
    },
    async removeMedia(id) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      previewFiles.delete(id);
      if (id === "avatar") gate.data.avatarUrl = "";
      await persist();
      return ok(null);
    },
    async readingNote(slug) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      const body = (await AsyncStorage.getItem(`gosolo.preview.note.${gate.data.id}.${slug}`)) ?? "";
      return ok({ body });
    },
    async saveReadingNote(slug, body) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      const key = `gosolo.preview.note.${gate.data.id}.${slug}`;
      if (!body.trim()) await AsyncStorage.removeItem(key);
      else await AsyncStorage.setItem(key, body.trim());
      return ok({ body: body.trim() });
    },
    async plantSeed(seedId, goal) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      const seed = SEEDS.find((item) => item.id === seedId);
      if (!seed) return fail("not_found", "That seed is not in the garden.");
      world.userSeeds.unshift({
        id: createId(),
        userId: gate.data.id,
        seedId,
        title: seed.title,
        status: "active",
        goal: goal.trim(),
        startedAt: new Date().toISOString(),
        checkIns: [],
      });
      return done();
    },
    async setSeedStatus(userSeedId, status: SeedStatus) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      const row = world.userSeeds.find((item) => item.id === userSeedId && item.userId === gate.data.id);
      if (!row) return fail("not_found", "That seed is not yours.");
      row.status = status;
      return done();
    },
    async addSeedReflection(userSeedId, note) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      const row = world.userSeeds.find((item) => item.id === userSeedId && item.userId === gate.data.id);
      if (!row) return fail("not_found", "That seed is not yours.");
      if (!note.trim()) return fail("validation", "Write a few words, or leave it for later.");
      row.checkIns.push({ id: createId(), at: new Date().toISOString(), note: note.trim(), userId: gate.data.id });
      return done();
    },
    async offerSeedSupport(userSeedId, note) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      const row = world.userSeeds.find((item) => item.id === userSeedId);
      if (!row) return fail("not_found", "That seed is not here.");
      if (row.userId === gate.data.id) return fail("validation", "This one is already yours.");
      if (!seedAcceptsSupport(row.status)) return fail("forbidden", "This seed is not taking new support.");
      world.seedSupports.unshift({
        id: createId(),
        userSeedId,
        ownerId: row.userId,
        supporterId: gate.data.id,
        note: note.trim(),
        status: "offered",
        createdAt: new Date().toISOString(),
      });
      notify(row.userId, "seed", "/garden");
      return done();
    },
    async saveGrowing(seeds: LifeSeed[]) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      gate.data.growing = seeds;
      return done();
    },
    async saveHelp(kind, titles, note) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      if (kind === "growing") gate.data.helpGrowing = titles;
      else {
        gate.data.helpPlant = titles;
        if (note !== undefined) gate.data.helpPlantNote = note;
      }
      return done();
    },
    async joinWaypoint(id) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      if (!WAYPOINTS.some((item) => item.id === id)) return fail("not_found", "That waypoint is not here.");
      if (!world.memberships.some((item) => item.userId === gate.data.id && item.waypointId === id)) {
        world.memberships.push({ userId: gate.data.id, waypointId: id, joinedAt: new Date().toISOString() });
      }
      return done();
    },
    async leaveWaypoint(id) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      world.memberships = world.memberships.filter((item) => !(item.userId === gate.data.id && item.waypointId === id));
      return done();
    },
    async publishCampfire(input: CampfireInput) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      if (!input.body.trim()) return fail("validation", "Write something before you share it.");
      if (!throttle()) return fail("rate_limited", "That is a little fast. Wait a moment, then try again.");
      const file = input.mediaId ? previewFiles.get(input.mediaId) : undefined;
      world.campfire.unshift({
        id: createId(),
        authorId: gate.data.id,
        section: input.section,
        kind: input.kind,
        title: input.title.trim(),
        body: input.body.trim(),
        waypointId: input.waypointId,
        imageUrl: file?.url,
        imageAlt: input.imageAlt,
        createdAt: new Date().toISOString(),
      });
      return done();
    },
    async publishStory(input: StoryInput) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      if (!input.title.trim() || !input.body.trim()) return fail("validation", "A story needs a title and what happened.");
      const file = input.mediaId ? previewFiles.get(input.mediaId) : undefined;
      world.stories.unshift({
        id: createId(),
        authorId: gate.data.id,
        title: input.title.trim(),
        whatDidYouDo: input.body.trim(),
        expecting: "",
        actuallyHappened: "",
        wouldDoAgain: "yes",
        imageUrl: file?.url,
        imageAlt: input.imageAlt,
        createdAt: new Date().toISOString(),
      });
      return done();
    },
    async updateStory(id, input) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      const story = world.stories.find((item) => item.id === id && item.authorId === gate.data.id);
      if (!story) return fail("forbidden", "You can edit a story you wrote.");
      story.title = input.title.trim();
      story.whatDidYouDo = input.body.trim();
      const file = input.mediaId ? previewFiles.get(input.mediaId) : undefined;
      if (input.clearImage || file) {
        story.imageUrl = file?.url;
        story.imageAlt = input.imageAlt;
      } else if (input.imageAlt !== undefined) {
        story.imageAlt = input.imageAlt;
      }
      return done();
    },
    async comment(targetType, targetId, body, mediaId, imageAlt) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      if (!body.trim()) return fail("validation", "Write a reply first.");
      const list = targetType === "campfire" ? world.campfire : world.stories;
      const target = list.find((item) => item.id === targetId && !item.hidden);
      if (!target) return fail("not_found", "That conversation is not here.");
      if ("locked" in target && target.locked) return fail("forbidden", "This conversation is closed.");
      const file = mediaId ? previewFiles.get(mediaId) : undefined;
      world.comments.push({
        id: createId(),
        authorId: gate.data.id,
        targetType,
        targetId,
        body: body.trim(),
        imageUrl: file?.url,
        imageAlt,
        createdAt: new Date().toISOString(),
      });
      if (target.authorId !== gate.data.id) notify(target.authorId, "reply", `/${targetType}/${targetId}`);
      return done();
    },
    async react(targetType, targetId, kind) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      world.reactions = world.reactions.filter(
        (item) => !(item.userId === gate.data.id && item.targetType === targetType && item.targetId === targetId),
      );
      if (kind) {
        world.reactions.push({ id: createId(), userId: gate.data.id, targetType, targetId, kind });
      }
      return done();
    },
    async offerSkill(skill, description) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      if (!skill.trim()) return fail("validation", "Name the skill.");
      world.offers.unshift({
        id: createId(),
        userId: gate.data.id,
        skill: skill.trim(),
        description: description.trim(),
        createdAt: new Date().toISOString(),
        status: "open",
      });
      return done();
    },
    async requestSkill(skill, description) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      if (!skill.trim()) return fail("validation", "Name the skill.");
      world.requests.unshift({
        id: createId(),
        userId: gate.data.id,
        skill: skill.trim(),
        description: description.trim(),
        createdAt: new Date().toISOString(),
        status: "open",
      });
      return done();
    },
    async expressInterest(input) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      if (input.toUserId === gate.data.id) return fail("validation", "That one is yours.");
      const decision = contactBetween(world, gate.data.id, input.toUserId);
      const connection: SkillConnection = {
        id: createId(),
        fromUserId: gate.data.id,
        toUserId: input.toUserId,
        offerId: input.offerId,
        requestId: input.requestId,
        note: input.note.trim(),
        createdAt: new Date().toISOString(),
        status: "interest",
      };
      world.connections.unshift(connection);
      if (!decision.allowed && gate.data.communicationPreference) {
        notify(input.toUserId, "skill", "/skill-swaps");
      } else {
        notify(input.toUserId, "skill", "/skill-swaps");
      }
      return done();
    },
    async setSwapStatus(id, status, reflection) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      const row = world.connections.find((item) => item.id === id);
      if (!row || (row.fromUserId !== gate.data.id && row.toUserId !== gate.data.id)) {
        return fail("forbidden", "That exchange is not yours.");
      }
      row.status = status;
      if (reflection) row.reflection = reflection.trim();
      return done();
    },
    async openSame(seedId, goal) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      if (!goal.trim()) return fail("validation", "Say what you would like to grow.");
      world.partnerships.unshift({
        id: createId(),
        seedId,
        seekerId: gate.data.id,
        partnerId: null,
        goal: goal.trim(),
        status: "seeking",
        createdAt: new Date().toISOString(),
        checkIns: [],
        seekerConsent: null,
        partnerConsent: null,
      });
      return done();
    },
    async consentSame(id, decision) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      const row = world.partnerships.find((item) => item.id === id);
      if (!row || !row.partnerId) return fail("not_found", "That introduction is not ready.");
      if (row.seekerId === gate.data.id) row.seekerConsent = decision;
      else if (row.partnerId === gate.data.id) row.partnerConsent = decision;
      else return fail("forbidden", "This introduction is not yours.");
      if (decision === "declined") row.status = "seeking";
      const other = row.seekerId === gate.data.id ? row.partnerId : row.seekerId;
      notify(other, "same", "/same");
      return done();
    },
    async setCommunication(preference: CommunicationPreference) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      gate.data.communicationPreference = preference;
      if (preference !== "none") gate.data.takingSpace = false;
      return done();
    },
    async startConversation(input) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      const decision = contactBetween(world, gate.data.id, input.targetId);
      if (!decision.allowed) return fail("forbidden", decision.message);
      if (!input.note.trim()) return fail("validation", "Write a short opening note.");
      const existing = world.conversations.find(
        (item) =>
          item.status !== "declined" &&
          item.status !== "closed" &&
          ((item.requesterId === gate.data.id && item.recipientId === input.targetId) ||
            (item.requesterId === input.targetId && item.recipientId === gate.data.id)),
      );
      if (existing) return fail("conflict", "There is already a conversation here.");
      const id = createId();
      world.conversations.unshift({
        id,
        contextType: input.contextType,
        contextId: input.contextId,
        contextLabel: input.contextLabel,
        requesterId: gate.data.id,
        recipientId: input.targetId,
        status: "request",
        mutedBy: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      world.messages.push({
        id: createId(),
        conversationId: id,
        authorId: gate.data.id,
        body: input.note.trim(),
        createdAt: new Date().toISOString(),
      });
      notify(input.targetId, "request", `/conversations/${id}`);
      return done();
    },
    async sendMessage(conversationId, body, clientKey) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      if (!throttle()) return fail("rate_limited", "That is a little fast. Wait a moment, then try again.");
      if (world.messages.some((item) => item.clientKey === clientKey)) return done();
      const conversation = world.conversations.find((item) => item.id === conversationId);
      if (!conversation) return fail("not_found", "That conversation is not here.");
      const mine = conversation.requesterId === gate.data.id || conversation.recipientId === gate.data.id;
      if (!mine) return fail("forbidden", "You do not have access to that.");
      if (conversation.status !== "accepted") return fail("forbidden", "This conversation is not open.");
      const other = conversation.requesterId === gate.data.id ? conversation.recipientId : conversation.requesterId;
      if (world.blocks.some((block) => (block.blockerId === gate.data.id && block.blockedId === other) || (block.blockerId === other && block.blockedId === gate.data.id))) {
        return fail("forbidden", "A private conversation is not available right now.");
      }
      const otherProfile = world.profiles.find((item) => item.id === other);
      if (otherProfile?.takingSpace) return fail("forbidden", "A private conversation is not available right now.");
      if (!body.trim()) return fail("validation", "Write a note first.");
      world.messages.push({
        id: createId(),
        conversationId,
        authorId: gate.data.id,
        body: body.trim(),
        createdAt: new Date().toISOString(),
        clientKey,
      });
      conversation.updatedAt = new Date().toISOString();
      const muted = conversation.mutedBy.includes(other);
      if (!muted) notify(other, "message", `/conversations/${conversationId}`);
      return done();
    },
    async chooseInteraction(conversationId, choice, phrase) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      const conversation = world.conversations.find((item) => item.id === conversationId);
      if (!conversation) return fail("not_found", "That conversation is not here.");
      const mine = conversation.requesterId === gate.data.id || conversation.recipientId === gate.data.id;
      if (!mine) return fail("forbidden", "You do not have access to that.");
      if (choice === "decline") conversation.status = "declined";
      else if (choice === "space") {
        conversation.status = "space";
        gate.data.takingSpace = true;
      } else if (conversation.status === "request" && conversation.recipientId === gate.data.id) {
        conversation.status = "accepted";
      }
      conversation.updatedAt = new Date().toISOString();
      world.messages.push({
        id: createId(),
        conversationId,
        authorId: gate.data.id,
        body: phrase,
        createdAt: new Date().toISOString(),
      });
      const other = conversation.requesterId === gate.data.id ? conversation.recipientId : conversation.requesterId;
      notify(other, choice === "decline" ? "request" : "message", `/conversations/${conversationId}`);
      return done();
    },
    async setConversationFlag(conversationId, flag) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      const conversation = world.conversations.find((item) => item.id === conversationId);
      if (!conversation) return fail("not_found", "That conversation is not here.");
      if (conversation.requesterId !== gate.data.id && conversation.recipientId !== gate.data.id) {
        return fail("forbidden", "You do not have access to that.");
      }
      if (flag === "mute" && !conversation.mutedBy.includes(gate.data.id)) conversation.mutedBy.push(gate.data.id);
      if (flag === "unmute") conversation.mutedBy = conversation.mutedBy.filter((id) => id !== gate.data.id);
      if (flag === "archive") conversation.status = "archived";
      if (flag === "restore" && conversation.status === "archived") conversation.status = "accepted";
      if (flag === "close") conversation.status = "closed";
      return done();
    },
    async report(input) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      if (input.reason.trim().length < 8) return fail("validation", "Say a little about what happened.");
      world.reports.unshift({
        id: createId(),
        reporterId: gate.data.id,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason.trim(),
        status: "open",
        createdAt: new Date().toISOString(),
      });
      return done();
    },
    async block(blockedId) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      if (blockedId === gate.data.id) return fail("validation", "That is your own garden.");
      if (!world.blocks.some((item) => item.blockerId === gate.data.id && item.blockedId === blockedId)) {
        world.blocks.push({ id: createId(), blockerId: gate.data.id, blockedId, createdAt: new Date().toISOString() });
      }
      return done();
    },
    async unblock(blockedId) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      world.blocks = world.blocks.filter((item) => !(item.blockerId === gate.data.id && item.blockedId === blockedId));
      return done();
    },
    async markNotifications() {
      const gate = requireUser();
      if (!gate.ok) return gate;
      world.notifications.forEach((item) => {
        if (item.userId === gate.data.id) item.read = true;
      });
      return done();
    },
    async dismissPin(targetType, targetId) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      world.dismissedPins.push({ userId: gate.data.id, targetType, targetId });
      return done();
    },
    async revealPins() {
      const gate = requireUser();
      if (!gate.ok) return gate;
      world.dismissedPins = world.dismissedPins.filter((item) => item.userId !== gate.data.id);
      return done();
    },
    async stewardModerate(input) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      if (gate.data.role !== "admin") return fail("forbidden", "This desk is for stewards.");
      const list = input.kind === "campfire" ? world.campfire : world.stories;
      const row = list.find((item) => item.id === input.id);
      if (!row) return fail("not_found", "That post is not here.");
      if (input.hidden !== undefined) row.hidden = input.hidden;
      if (input.pinned) {
        list.forEach((item) => {
          const sameScope =
            input.kind === "story" ||
            (input.kind === "campfire" && (item as { waypointId?: string }).waypointId === (row as { waypointId?: string }).waypointId);
          if (sameScope) item.pinned = false;
        });
        row.pinned = true;
      }
      if (input.pinned === false) row.pinned = false;
      return done();
    },
    async proposeSession(input) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      const decision = contactBetween(world, gate.data.id, input.memberId);
      if (!decision.allowed) return fail("forbidden", decision.message);
      if (input.contextType === "same") {
        const intro = world.partnerships.find((item) => item.id === input.contextId);
        if (!intro || !sameMessagingReady(intro.seekerConsent, intro.partnerConsent)) {
          return fail("forbidden", "Both people need to accept the introduction first.");
        }
      }
      const window = parseSessionWindow(input.startsAt, input.endsAt);
      if (!window) return fail("validation", "Choose a time that begins soon and ends within a day.");
      input = { ...input, startsAt: window.startsAt, endsAt: window.endsAt };
      world.sessions.unshift({
        id: createId(),
        contextType: input.contextType,
        contextId: input.contextId,
        memberA: gate.data.id,
        memberB: input.memberId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        aAgreed: true,
        bAgreed: false,
        continuationA: null,
        continuationB: null,
        status: "proposed",
        createdAt: new Date().toISOString(),
      });
      notify(input.memberId, "session", "/conversations");
      return done();
    },
    async agreeSession(id) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      const row = world.sessions.find((item) => item.id === id);
      if (!row) return fail("not_found", "That session is not here.");
      if (row.memberA === gate.data.id) row.aAgreed = true;
      else if (row.memberB === gate.data.id) row.bAgreed = true;
      else return fail("forbidden", "This session is not yours.");
      row.status = row.aAgreed && row.bAgreed ? "scheduled" : "proposed";
      return done();
    },
    async answerContinuation(id, agree) {
      const gate = requireUser();
      if (!gate.ok) return gate;
      const row = world.sessions.find((item) => item.id === id);
      if (!row) return fail("not_found", "That session is not here.");
      if (row.memberA === gate.data.id) row.continuationA = agree;
      else if (row.memberB === gate.data.id) row.continuationB = agree;
      else return fail("forbidden", "This session is not yours.");
      if (!agree || (row.continuationA === true && row.continuationB === true)) row.status = "completed";
      return done();
    },
    async registerPushToken() {
      return ok(null);
    },
  };
}

export function supportLabel(id: string) {
  return SUPPORT_WITH.find((item) => item.id === id)?.label ?? id;
}

export function frequencyLabel(id?: string) {
  return CHECK_IN_FREQUENCIES.find((item) => item.id === id)?.label ?? "";
}
