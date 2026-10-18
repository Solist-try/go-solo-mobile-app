import AsyncStorage from "@react-native-async-storage/async-storage";
import { SEEDS, WAYPOINTS } from "@/domain/fallback-catalog";
import { CONTENT_CACHE_KEY, mergeContent } from "@/domain/content";
import { emptyWorld, type Profile } from "@/domain/types";
import type { Reading } from "@/domain/fallback-readings";
import { createSecureStorage } from "./secure-storage";
import { fail, ok, type ApiError, type ApiResult } from "./result";
import {
  blankProfile,
  emptyCapabilities,
  type CampfireInput,
  type Repository,
  type Shell,
  type StoryInput,
} from "./contract";

const TOKEN_KEY = "gosolo.php.tokens";

type Tokens = { access: string; refresh: string };

const ERROR_CODES = new Set<ApiError["code"]>([
  "validation",
  "unauthorized",
  "forbidden",
  "not_found",
  "conflict",
  "rate_limited",
  "offline",
  "unavailable",
  "server",
]);

function origin() {
  return (process.env.EXPO_PUBLIC_API_URL ?? "").trim().replace(/\/$/, "");
}

export function liveConfigured() {
  return origin().startsWith("https://");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeProfile(value: unknown): Profile | null {
  if (!isRecord(value) || (typeof value.id !== "string" && typeof value.id !== "number")) return null;
  const id = String(value.id);
  const base = blankProfile(id, typeof value.email === "string" ? value.email : "");
  const role = value.role === "admin" || value.role === "moderator" ? "admin" : "member";
  const status = value.status === "suspended" ? "suspended" : value.status === "banned" || value.status === "deactivated" ? "deactivated" : "active";
  const preference = value.communicationPreference === "anyone" || value.communicationPreference === "none" ? value.communicationPreference : "contextual";
  const growing = Array.isArray(value.growing)
    ? value.growing.flatMap((item) => {
        if (!isRecord(item) || typeof item.name !== "string") return [];
        const statusName = item.status === "resting" ? "resting" : item.status === "completed" || item.status === "grown" || item.status === "archived" ? "completed" : "active";
        return [
          {
            id: String(item.id ?? ""),
            name: item.name,
            status: statusName as Profile["growing"][number]["status"],
            since: typeof item.since === "string" ? item.since : "",
            lookingForSupport: Boolean(item.lookingForSupport),
          },
        ];
      })
    : [];
  return {
    ...base,
    displayName: typeof value.displayName === "string" ? value.displayName : "",
    bio: typeof value.bio === "string" ? value.bio : "",
    location: typeof value.location === "string" ? value.location : "",
    avatarUrl: typeof value.avatarUrl === "string" ? value.avatarUrl : "",
    intentions: strings(value.intentions),
    interests: strings(value.interests),
    onboardingComplete: Boolean(value.onboardingComplete),
    onboardingStep: typeof value.onboardingStep === "string" ? value.onboardingStep : null,
    emailVerified: value.emailVerified !== false,
    showLocation: value.showLocation !== false,
    showWaypoints: value.showWaypoints !== false,
    notifyReplies: value.notifyReplies !== false,
    notifyWaypoints: Boolean(value.notifyWaypoints),
    notifyCheckins: value.notifyCheckins !== false,
    notificationPrefs: { ...base.notificationPrefs, ...(isRecord(value.notificationPrefs) ? value.notificationPrefs : {}) },
    communicationPreference: preference,
    takingSpace: Boolean(value.takingSpace),
    createdAt: typeof value.createdAt === "string" && value.createdAt ? value.createdAt : base.createdAt,
    role,
    status,
    growing,
    helpGrowing: strings(value.helpGrowing),
    helpPlant: strings(value.helpPlant),
    helpPlantNote: typeof value.helpPlantNote === "string" ? value.helpPlantNote : "",
    supportWith: strings(value.supportWith),
    checkInFrequency: typeof value.checkInFrequency === "string" ? value.checkInFrequency : "",
    checkInStyle: typeof value.checkInStyle === "string" ? value.checkInStyle : "",
    sameNotes: typeof value.sameNotes === "string" ? value.sameNotes : "",
  };
}

function capabilitiesOf(value: unknown) {
  const row = isRecord(value) ? value : {};
  const base = emptyCapabilities();
  (Object.keys(base) as (keyof typeof base)[]).forEach((key) => {
    if (typeof row[key] === "boolean") base[key] = row[key];
  });
  return base;
}

function adopt(data: unknown): Shell {
  const row = isRecord(data) ? data : {};
  const worldIn = isRecord(row.world) ? row.world : {};
  const world = { ...emptyWorld(), ...worldIn };
  world.profiles = (Array.isArray(world.profiles) ? world.profiles : []).flatMap((item) => {
    const profile = normalizeProfile(item);
    return profile ? [profile] : [];
  });
  return {
    profile: normalizeProfile(row.profile),
    content: mergeContent(row.content),
    seeds: Array.isArray(row.seeds) ? row.seeds : [],
    waypoints: Array.isArray(row.waypoints) ? row.waypoints : [],
    world,
    capabilities: capabilitiesOf(row.capabilities),
    needsVerification: false,
    contactIds: strings(row.contactIds),
    readings: Array.isArray(row.readings) ? (row.readings as Reading[]) : [],
  };
}

function unwrapShell(data: unknown) {
  if (isRecord(data) && isRecord(data.shell)) return data.shell;
  return data;
}

function codeFrom(value: unknown, status: number): ApiError["code"] {
  if (typeof value === "string" && ERROR_CODES.has(value as ApiError["code"])) return value as ApiError["code"];
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 422) return "validation";
  if (status === 429) return "rate_limited";
  if (status === 503) return "unavailable";
  return "server";
}

async function cachedShell(): Promise<Shell | null> {
  const raw = await AsyncStorage.getItem(CONTENT_CACHE_KEY);
  if (!raw) return null;
  try {
    return {
      profile: null,
      content: mergeContent(JSON.parse(raw)),
      seeds: SEEDS,
      waypoints: WAYPOINTS,
      world: emptyWorld(),
      capabilities: emptyCapabilities(),
      fromCache: true,
      contactIds: [],
      readings: [],
    };
  } catch {
    return null;
  }
}

async function remember(shell: Shell) {
  await AsyncStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(shell.content)).catch(() => undefined);
  return shell;
}

const PHOTO = "A photo from the phone is added on the website for now. Your words are still here.";

export function createLiveRepository(): Repository {
  if (!liveConfigured()) throw new Error("The PHP house address is not configured.");
  const storage = createSecureStorage();
  const base = origin();
  let tokens: Tokens | null = null;
  let loading: Promise<void> | null = null;
  let refreshFlight: Promise<boolean> | null = null;

  async function ensureTokens() {
    if (!loading) {
      loading = (async () => {
        const raw = await storage.getItem(TOKEN_KEY);
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw) as Partial<Tokens>;
          if (typeof parsed.access === "string" && typeof parsed.refresh === "string") {
            tokens = { access: parsed.access, refresh: parsed.refresh };
          }
        } catch {
          tokens = null;
        }
      })();
    }
    await loading;
  }

  async function saveTokens(next: Tokens) {
    tokens = next;
    await storage.setItem(TOKEN_KEY, JSON.stringify(next));
  }

  async function clearTokens() {
    tokens = null;
    await storage.removeItem(TOKEN_KEY);
  }

  async function call(path: string, options: { method?: string; body?: unknown; auth?: boolean; retry?: boolean } = {}): Promise<ApiResult<unknown>> {
    await ensureTokens();
    const headers: Record<string, string> = { Accept: "application/json" };
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    if (options.auth !== false && tokens?.access) {
      headers.Authorization = `Bearer ${tokens.access}`;
      headers["X-Go-Solo-Authorization"] = tokens.access;
    }
    let response: Response;
    try {
      response = await fetch(`${base}/api/v1${path}`, {
        method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        credentials: "omit",
      });
    } catch {
      return fail("offline", "The connection dropped. Nothing was published.");
    }
    if (response.status === 401 && options.auth !== false && options.retry !== false && tokens?.refresh) {
      const rotated = await rotate();
      if (rotated) return call(path, { ...options, retry: false });
    }
    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }
    const row = isRecord(payload) ? payload : null;
    if (!response.ok || !row || row.ok !== true) {
      const error = isRecord(row?.error) ? row.error : null;
      const message = typeof error?.message === "string" ? error.message : "That did not finish. The words are still here.";
      return fail(codeFrom(error?.code, response.status), message);
    }
    return ok(row.data);
  }

  async function rotate() {
    if (!tokens?.refresh) return false;
    if (refreshFlight) return refreshFlight;
    const refresh = tokens.refresh;
    refreshFlight = (async () => {
      const result = await call("/session/refresh", { body: { refresh }, auth: false, retry: false });
      const row = result.ok ? result.data : null;
      if (!isRecord(row) || typeof row.access !== "string" || typeof row.refresh !== "string") {
        await clearTokens();
        return false;
      }
      await saveTokens({ access: row.access, refresh: row.refresh });
      return true;
    })().finally(() => {
      refreshFlight = null;
    });
    return refreshFlight;
  }

  async function shell(path: string, body?: unknown): Promise<ApiResult<Shell>> {
    const result = await call(path, body === undefined ? { method: "GET" } : { body });
    if (!result.ok) return result;
    return ok(await remember(adopt(unwrapShell(result.data))));
  }

  async function open(): Promise<ApiResult<Shell>> {
    const result = await shell("");
    if (result.ok) return result;
    if (result.error.code === "unauthorized") {
      const guest = await call("", { method: "GET", auth: false, retry: false });
      if (guest.ok) return ok(await remember(adopt(guest.data)));
    }
    if (result.error.code === "offline" || result.error.code === "server") {
      const cached = await cachedShell();
      if (cached) return ok(cached);
    }
    return result;
  }

  async function session(path: string, body: unknown): Promise<ApiResult<Shell>> {
    const result = await call(path, { body, auth: false, retry: false });
    if (!result.ok) return result;
    const row = isRecord(result.data) ? result.data : null;
    if (!row || typeof row.access !== "string" || typeof row.refresh !== "string") {
      return fail("server", "The house did not finish signing in.");
    }
    await saveTokens({ access: row.access, refresh: row.refresh });
    return ok(await remember(adopt(row.shell)));
  }

  function words(input: { imageUrl?: string }) {
    return Boolean(input.imageUrl);
  }

  return {
    mode: "live",
    restore: open,
    refresh: open,
    signIn(email, password) {
      return session("/session", { email: email.trim(), password });
    },
    signUp(email, password, displayName) {
      if (password.length < 8) return Promise.resolve(fail("validation", "Use at least 8 characters."));
      return session("/join", { name: displayName.trim(), email: email.trim(), password });
    },
    async signOut() {
      if (tokens?.refresh) await call("/session/end", { body: { refresh: tokens.refresh }, retry: false });
      await clearTokens();
    },
    async requestPasswordReset(email) {
      const result = await call("/forgot", { body: { email: email.trim() }, auth: false, retry: false });
      return result.ok ? ok(null) : result;
    },
    async updatePassword(current, next) {
      if (next.length < 8) return fail("validation", "Use at least 8 characters.");
      const result = await call("/password", { body: { current, next } });
      return result.ok ? ok(null) : result;
    },
    resendVerification() {
      return Promise.resolve(fail("unavailable", "This house does not send a confirmation letter. You can sign in with the email you joined with."));
    },
    async deleteAccount(confirm) {
      const result = await call("/account/delete", { body: { confirm } });
      if (!result.ok) return result;
      await clearTokens();
      return ok(null);
    },
    updateProfile(patch) {
      return shell("/profile", {
        displayName: patch.displayName,
        bio: patch.bio,
        location: patch.location,
        showLocation: patch.showLocation,
        checkInFrequency: patch.checkInFrequency,
        checkInStyle: patch.checkInStyle,
      });
    },
    async setInterests() {
      return open();
    },
    uploadAvatar() {
      return Promise.resolve(fail("unavailable", "A profile photo is added on the website for now."));
    },
    plantSeed(seedId, goal) {
      return shell("/seeds/plant", { seedId, goal });
    },
    setSeedStatus(id, status) {
      return shell(id.startsWith("planted-") ? "/seeds/status" : "/growing/status", { id, status });
    },
    addSeedReflection(id, note) {
      if (!note.trim()) return Promise.resolve(fail("validation", "Write a few words, or leave it for later."));
      return shell(id.startsWith("planted-") ? "/seeds/status" : "/growing/status", { id, note });
    },
    offerSeedSupport(id, note) {
      if (id.startsWith("planted-")) {
        return Promise.resolve(fail("unavailable", "Support is offered when someone marks a seed they are growing as open to help."));
      }
      return shell("/seeds/support", { id, note });
    },
    saveGrowing(seeds) {
      return shell("/growing", { seeds });
    },
    saveHelp(kind, titles) {
      return shell("/help", { kind, titles });
    },
    joinWaypoint(id) {
      return shell("/waypoints/join", { id });
    },
    leaveWaypoint(id) {
      return shell("/waypoints/leave", { id });
    },
    publishCampfire(input: CampfireInput) {
      if (words(input)) return Promise.resolve(fail("validation", PHOTO));
      return shell("/campfire", { title: input.title, body: input.body, waypointId: input.waypointId ?? "" });
    },
    publishStory(input: StoryInput) {
      if (words(input)) return Promise.resolve(fail("validation", PHOTO));
      return shell("/stories", { title: input.title, body: input.body });
    },
    updateStory(id, input) {
      if (words(input)) return Promise.resolve(fail("validation", PHOTO));
      return shell("/stories/update", { id, title: input.title, body: input.body });
    },
    comment(targetType, targetId, body) {
      return shell("/comments", { targetType, targetId, body });
    },
    react() {
      return Promise.resolve(fail("unavailable", "Named reactions are not part of this house."));
    },
    offerSkill(skill, description) {
      return shell("/skills", { action: "offer", skill, description });
    },
    requestSkill(skill, description) {
      return shell("/skills", { action: "request", skill, description });
    },
    expressInterest(input) {
      return shell("/skills", {
        action: "interest",
        kind: input.requestId ? "request" : "offer",
        id: input.requestId || input.offerId || "",
        note: input.note,
      });
    },
    setSwapStatus(id, status) {
      if (status === "accepted" || status === "declined") {
        return shell("/skills", { action: "consent", id, status });
      }
      return Promise.resolve(fail("unavailable", "Pausing or finishing an exchange stays with the conversation on the website."));
    },
    openSame(seedId, goal) {
      return shell("/same", { seedId, goal });
    },
    consentSame(id, decision) {
      return shell("/same/consent", { id, decision });
    },
    setCommunication(preference) {
      return shell("/communication", { preference });
    },
    startConversation(input) {
      return shell("/conversations", { targetId: input.targetId, note: input.note });
    },
    sendMessage(conversationId, body, clientKey) {
      return shell("/conversations/message", { conversationId, body, clientKey });
    },
    chooseInteraction(conversationId, choice, phrase) {
      return shell("/conversations/choice", { conversationId, choice, phrase });
    },
    setConversationFlag(conversationId, flag) {
      return shell("/conversations/flag", { conversationId, flag });
    },
    report(input) {
      return shell("/reports", input);
    },
    block(userId) {
      return shell("/blocks", { userId });
    },
    unblock(userId) {
      return shell("/blocks/remove", { userId });
    },
    markNotifications() {
      return shell("/notices/read", {});
    },
    dismissPin(targetType, targetId) {
      return shell("/pins/hide", { targetType, targetId });
    },
    revealPins() {
      return shell("/pins/reveal", {});
    },
    stewardModerate(input) {
      return shell("/steward", input);
    },
    proposeSession() {
      return Promise.resolve(fail("unavailable", "A chair opens when you both agree to an exchange or an introduction. It is not a separate calendar."));
    },
    agreeSession(id) {
      return shell("/sessions/keep", { id });
    },
    answerContinuation(id, agree) {
      if (!agree) return Promise.resolve(fail("unavailable", "Leaving the chair to close is enough. Nothing else is sent."));
      return shell("/sessions/keep", { id });
    },
    registerPushToken() {
      return Promise.resolve(fail("unavailable", "Phone notifications are not on this house yet. In-app notes still work."));
    },
  };
}
