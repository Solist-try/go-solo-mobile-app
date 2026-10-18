import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SEEDS, WAYPOINTS } from "@/domain/fallback-catalog";
import { CONTENT_CACHE_KEY, defaultContent, mergeContent } from "@/domain/content";
import { createId } from "@/domain/format";
import { parseSessionWindow, redactError } from "@/domain/policy";
import {
  CHECK_IN_FREQUENCIES,
  SUPPORT_WITH,
  defaultNotificationPrefs,
  emptyWorld,
  type CampfirePost,
  type CampfireSection,
  type CampfireKind,
  type Comment,
  type LifeSeed,
  type OutTherePost,
  type Profile,
  type ReactionKind,
  type Seed,
  type SeedStatus,
  type Waypoint,
  type World,
  type WouldAgain,
} from "@/domain/types";
import { createSecureStorage } from "./secure-storage";
import { fail, ok, type ApiResult } from "./result";
import {
  blankProfile,
  emptyCapabilities,
  type CampfireInput,
  type Repository,
  type Shell,
  type StoryInput,
} from "./contract";

type Row = Record<string, unknown>;

function isRemoteMedia(value: string) {
  return value.startsWith("https://") || value.startsWith("http://");
}

function sniffImage(bytes: ArrayBuffer) {
  const view = new Uint8Array(bytes.slice(0, 16));
  if (view.length >= 3 && view[0] === 0xff && view[1] === 0xd8 && view[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (view.length >= 8 && view[0] === 0x89 && view[1] === 0x50 && view[2] === 0x4e && view[3] === 0x47) return { mime: "image/png", ext: "png" };
  if (
    view.length >= 12 &&
    view[0] === 0x52 &&
    view[1] === 0x49 &&
    view[2] === 0x46 &&
    view[3] === 0x46 &&
    view[8] === 0x57 &&
    view[9] === 0x45 &&
    view[10] === 0x42 &&
    view[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  if (view.length >= 12 && view[4] === 0x66 && view[5] === 0x74 && view[6] === 0x79 && view[7] === 0x70) {
    const brand = String.fromCharCode(view[8], view[9], view[10], view[11]);
    if (brand === "heic" || brand === "heix" || brand === "mif1" || brand === "msf1") return { mime: "image/heic", ext: "heic" };
  }
  return null;
}

async function storedPhoto(db: SupabaseClient, userId: string, uri?: string, _mime?: string) {
  if (!uri) return { path: null as string | null };
  if (isRemoteMedia(uri)) return { path: uri };
  let bytes: ArrayBuffer;
  try {
    const response = await fetch(uri);
    bytes = await response.arrayBuffer();
  } catch {
    return { error: "The photo could not be read. Your words are still here." };
  }
  if (bytes.byteLength > 8 * 1024 * 1024) return { error: "That photo is too large. Your words are still here." };
  const kind = sniffImage(bytes);
  if (!kind) return { error: "That file is not a photo this room can keep. Your words are still here." };
  const path = `${userId}/${createId()}.${kind.ext}`;
  const uploaded = await db.storage.from("member-media").upload(path, bytes, { contentType: kind.mime, upsert: false });
  if (uploaded.error) return { error: "The photo could not be saved. Your words are still here." };
  return { path };
}

async function attachSignedMedia(db: SupabaseClient, world: World) {
  const paths = new Set<string>();
  for (const post of [...world.campfire, ...world.stories]) {
    if (post.imageUrl && !isRemoteMedia(post.imageUrl)) paths.add(post.imageUrl);
  }
  const signed = new Map<string, string>();
  await Promise.all(
    [...paths].map(async (path) => {
      const result = await db.storage.from("member-media").createSignedUrl(path, 60 * 60);
      if (result.data?.signedUrl) signed.set(path, result.data.signedUrl);
    }),
  );
  for (const post of [...world.campfire, ...world.stories]) {
    if (!post.imageUrl || isRemoteMedia(post.imageUrl)) continue;
    post.imageUrl = signed.get(post.imageUrl);
  }
  for (const message of world.messages) {
    if (message.imageUrl && !isRemoteMedia(message.imageUrl)) message.imageUrl = undefined;
  }
}

function configured() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const site = process.env.EXPO_PUBLIC_SITE_URL ?? "";
  return { url, key, site, ready: url.startsWith("https://") && key.length > 20 };
}

let client: SupabaseClient | null = null;

function supabase() {
  const env = configured();
  if (!env.ready) return null;
  if (!client) {
    client = createClient(env.url, env.key, {
      auth: {
        storage: createSecureStorage(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

export function liveConfigured() {
  return configured().ready;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function preference(value: unknown): Profile["communicationPreference"] {
  return value === "anyone" || value === "none" || value === "contextual" ? value : "contextual";
}

function mapProfile(row: Row, interests: string[] = []): Profile {
  const base = blankProfile(asString(row.id), asString(row.email));
  return {
    ...base,
    displayName: asString(row.display_name),
    bio: asString(row.bio),
    location: asString(row.location),
    avatarUrl: asString(row.avatar_url),
    intentions: asArray(row.intentions),
    interests,
    onboardingComplete: Boolean(row.onboarding_complete),
    onboardingStep: asString(row.onboarding_step) || null,
    emailVerified: Boolean(row.email_verified),
    showLocation: row.show_location !== false,
    showWaypoints: row.show_waypoints !== false,
    notifyReplies: row.notify_replies !== false,
    notifyWaypoints: Boolean(row.notify_waypoints),
    notifyCheckins: row.notify_checkins !== false,
    notificationPrefs: {
      ...defaultNotificationPrefs(),
      ...(row.notification_prefs && typeof row.notification_prefs === "object" ? (row.notification_prefs as Profile["notificationPrefs"]) : {}),
    },
    communicationPreference: preference(row.communication_preference),
    takingSpace: Boolean(row.taking_space),
    createdAt: asString(row.created_at, base.createdAt),
    role: row.role === "admin" ? "admin" : "member",
    status: row.status === "suspended" || row.status === "deactivated" ? row.status : "active",
    helpPlantNote: asString(row.help_plant_note),
    checkInFrequency: asString(row.contact_frequency),
    checkInStyle: asString(row.contact_style),
  };
}

function hideEmail(profile: Profile, viewerId: string | null) {
  return profile.id === viewerId ? profile : { ...profile, email: "" };
}

function mergeCatalog(remoteSeeds: Seed[], remoteWaypoints: Waypoint[]) {
  const seeds = new Map(SEEDS.map((seed) => [seed.id, seed]));
  remoteSeeds.forEach((seed) => seeds.set(seed.id, { ...seeds.get(seed.id), ...seed }));
  const waypoints = new Map(WAYPOINTS.map((waypoint) => [waypoint.id, waypoint]));
  remoteWaypoints.forEach((waypoint) => waypoints.set(waypoint.id, { ...waypoints.get(waypoint.id), ...waypoint }));
  return {
    seeds: [...seeds.values()].filter((seed) => !seed.archived),
    waypoints: [...waypoints.values()].filter((waypoint) => !waypoint.archived),
  };
}

async function optional(query: PromiseLike<{ data: unknown; error: { message: string } | null }>) {
  const result = await query;
  if (result.error) return { rows: [] as Row[], ok: false };
  return { rows: (Array.isArray(result.data) ? result.data : []) as Row[], ok: true };
}

function fromError<T>(error: { message?: string } | null): ApiResult<T> {
  const mapped = redactError(error?.message);
  return fail(mapped.code as "server", mapped.message);
}

async function loadShell(db: SupabaseClient, userId: string | null): Promise<Shell> {
  const contentResult = await db.from("site_content").select("document").eq("id", "site").maybeSingle();
  const content = mergeContent(contentResult.data?.document ?? null);
  await AsyncStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(content)).catch(() => undefined);

  const [seedRows, waypointRows] = await Promise.all([
    db.from("seeds").select("*"),
    db.from("waypoints").select("*"),
  ]);
  const catalog = mergeCatalog(
    ((seedRows.data ?? []) as Row[]).map(
      (row): Seed => ({
        id: asString(row.id),
        title: asString(row.title),
        description: asString(row.description),
        prompt: asString(row.prompt),
        category: asString(row.category, "growth") as Seed["category"],
        kind: asString(row.kind, "practice") as Seed["kind"],
        timeframe: asString(row.timeframe),
        waypoints: asArray(row.waypoints),
        difficulty: asString(row.difficulty) as Seed["difficulty"],
        archived: Boolean(row.archived),
      }),
    ),
    ((waypointRows.data ?? []) as Row[]).map(
      (row): Waypoint => ({
        id: asString(row.id),
        slug: asString(row.slug),
        name: asString(row.name),
        summary: asString(row.summary),
        description: asString(row.description),
        focus: asArray(row.focus),
        colour: asString(row.colour) as Waypoint["colour"],
        archived: Boolean(row.archived),
      }),
    ),
  );

  const capabilities = emptyCapabilities();
  const world = emptyWorld();
  if (!userId) {
    return { profile: null, content, ...catalog, world, capabilities };
  }

  const [profiles, interests, memberships, userSeeds, partnerships, offers, requests, connections, stories, campfire, comments, reactions, notifications, helpRequests, helpOffers, preferences] =
    await Promise.all([
      db.from("profiles").select("*"),
      db.from("user_interests").select("user_id, interest_slug"),
      db.from("user_waypoints").select("*"),
      db.from("user_seeds").select("*"),
      db.from("same_partnerships").select("*"),
      db.from("skill_offers").select("*"),
      db.from("skill_requests").select("*"),
      db.from("skill_connections").select("*"),
      db.from("out_there_posts").select("*").order("created_at", { ascending: false }).limit(40),
      db.from("campfire_posts").select("*").order("created_at", { ascending: false }).limit(40),
      db.from("comments").select("*").order("created_at", { ascending: false }).limit(80),
      db.from("reactions").select("*"),
      db.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(40),
      db.from("seed_help_requests").select("user_id, title"),
      db.from("seed_help_offers").select("user_id, title"),
      db.from("same_preferences").select("*"),
    ]);

  const interestMap = new Map<string, string[]>();
  ((interests.data ?? []) as Row[]).forEach((row) => {
    const id = asString(row.user_id);
    interestMap.set(id, [...(interestMap.get(id) ?? []), asString(row.interest_slug)]);
  });
  const helpGrowing = new Map<string, string[]>();
  const helpPlant = new Map<string, string[]>();
  ((helpRequests.data ?? []) as Row[]).forEach((row) => {
    const id = asString(row.user_id);
    const title = asString(row.title).trim();
    if (title) helpGrowing.set(id, [...(helpGrowing.get(id) ?? []), title]);
  });
  ((helpOffers.data ?? []) as Row[]).forEach((row) => {
    const id = asString(row.user_id);
    const title = asString(row.title).trim();
    if (title) helpPlant.set(id, [...(helpPlant.get(id) ?? []), title]);
  });

  const growing = new Map<string, LifeSeed[]>();
  ((userSeeds.data ?? []) as Row[]).forEach((row) => {
    const owner = asString(row.user_id);
    if (!asString(row.seed_id)) {
      const name = asString(row.title).trim();
      if (!name) return;
      growing.set(owner, [
        ...(growing.get(owner) ?? []),
        {
          id: asString(row.id),
          name,
          status: asString(row.status) === "resting" ? "resting" : "active",
          since: asString(row.created_at) || asString(row.started_at),
          lookingForSupport: Boolean(row.looking_for_support),
        },
      ]);
      return;
    }
    world.userSeeds.push({
      id: asString(row.id),
      userId: owner,
      seedId: asString(row.seed_id),
      title: asString(row.title) || undefined,
      status: (asString(row.status, "active") as SeedStatus) || "active",
      goal: asString(row.goal),
      startedAt: asString(row.created_at) || asString(row.started_at),
      checkIns: Array.isArray(row.check_ins) ? (row.check_ins as World["userSeeds"][number]["checkIns"]) : [],
      lookingForSupport: Boolean(row.looking_for_support),
    });
  });

  world.profiles = ((profiles.data ?? []) as Row[]).map((row) => {
    const profile = mapProfile(row, interestMap.get(asString(row.id)) ?? []);
    profile.growing = growing.get(profile.id) ?? [];
    profile.helpGrowing = helpGrowing.get(profile.id) ?? [];
    profile.helpPlant = helpPlant.get(profile.id) ?? [];
    const prefs = ((preferences.data ?? []) as Row[]).filter((item) => asString(item.user_id) === profile.id);
    profile.supportWith = prefs.map((item) => asString(item.support_type)).filter(Boolean);
    profile.sameNotes = asString(prefs.find((item) => asString(item.notes))?.notes);
    if (profile.communicationPreference) capabilities.communicationColumn = row.communication_preference !== undefined || true;
    return hideEmail(profile, userId);
  });
  if (((profiles.data ?? []) as Row[]).some((row) => "communication_preference" in row)) {
    capabilities.communicationColumn = true;
  }

  world.memberships = ((memberships.data ?? []) as Row[]).map((row) => ({
    userId: asString(row.user_id),
    waypointId: asString(row.waypoint_id),
    joinedAt: asString(row.joined_at),
  }));
  world.partnerships = ((partnerships.data ?? []) as Row[]).map((row) => ({
    id: asString(row.id),
    seedId: asString(row.seed_id),
    seekerId: asString(row.seeker_id),
    partnerId: asString(row.partner_id) || null,
    goal: asString(row.goal),
    status: asString(row.status) === "matched" ? "matched" : "seeking",
    createdAt: asString(row.created_at),
    checkIns: [],
    seekerConsent: row.seeker_consent === "accepted" || row.seeker_consent === "declined" ? row.seeker_consent : null,
    partnerConsent: row.partner_consent === "accepted" || row.partner_consent === "declined" ? row.partner_consent : null,
  }));
  world.offers = ((offers.data ?? []) as Row[]).map((row) => ({
    id: asString(row.id),
    userId: asString(row.user_id),
    skill: asString(row.skill),
    description: asString(row.description),
    createdAt: asString(row.created_at),
    status: "open",
  }));
  world.requests = ((requests.data ?? []) as Row[]).map((row) => ({
    id: asString(row.id),
    userId: asString(row.user_id),
    skill: asString(row.skill),
    description: asString(row.description),
    createdAt: asString(row.created_at),
  }));
  world.connections = ((connections.data ?? []) as Row[]).map((row) => ({
    id: asString(row.id),
    fromUserId: asString(row.from_user_id),
    toUserId: asString(row.to_user_id),
    offerId: asString(row.offer_id) || undefined,
    requestId: asString(row.request_id) || undefined,
    note: asString(row.note),
    createdAt: asString(row.created_at),
    status: (asString(row.status, "interest") || "interest") as World["connections"][number]["status"],
    reflection: asString(row.reflection) || undefined,
  }));
  world.stories = ((stories.data ?? []) as Row[]).map(
    (row): OutTherePost => ({
      id: asString(row.id),
      authorId: asString(row.author_id) || asString(row.user_id),
      title: asString(row.title),
      whatDidYouDo: asString(row.what_did_you_do) || asString(row.what_i_did),
      expecting: asString(row.expecting) || asString(row.expectations),
      actuallyHappened: asString(row.actually_happened) || asString(row.what_happened),
      wouldDoAgain: (asString(row.would_do_again, "yes") as WouldAgain) || "yes",
      seedId: asString(row.seed_id) || undefined,
      waypointId: asString(row.waypoint_id) || undefined,
      imageUrl: asString(row.image_url) || undefined,
      imageAlt: asString(row.image_alt) || undefined,
      createdAt: asString(row.created_at),
      hidden: Boolean(row.hidden),
      pinned: Boolean(row.pinned),
      featured: Boolean(row.featured),
    }),
  );
  world.campfire = ((campfire.data ?? []) as Row[]).map(
    (row): CampfirePost => ({
      id: asString(row.id),
      authorId: asString(row.author_id) || asString(row.user_id),
      section: asString(row.section, "general") as CampfireSection,
      kind: asString(row.kind, "thought") as CampfireKind,
      title: asString(row.title),
      body: asString(row.body) || asString(row.content),
      waypointId: asString(row.waypoint_id) || undefined,
      seedId: asString(row.seed_id) || undefined,
      outThereId: asString(row.out_there_id) || undefined,
      imageUrl: asString(row.image_url) || undefined,
      imageAlt: asString(row.image_alt) || undefined,
      createdAt: asString(row.created_at),
      hidden: Boolean(row.hidden),
      pinned: Boolean(row.pinned),
      featured: Boolean(row.featured),
      locked: Boolean(row.locked),
    }),
  );
  world.comments = ((comments.data ?? []) as Row[]).map(
    (row): Comment => ({
      id: asString(row.id),
      authorId: asString(row.author_id),
      targetType: asString(row.target_type) === "out-there" ? "out-there" : "campfire",
      targetId: asString(row.target_id),
      body: asString(row.body),
      createdAt: asString(row.created_at),
    }),
  );
  world.reactions = ((reactions.data ?? []) as Row[]).map((row) => ({
    id: asString(row.id),
    userId: asString(row.user_id),
    targetType: asString(row.target_type) === "out-there" ? "out-there" : "campfire",
    targetId: asString(row.target_id),
    kind: asString(row.kind) as ReactionKind,
  }));
  world.notifications = ((notifications.data ?? []) as Row[]).map((row) => ({
    id: asString(row.id),
    userId: asString(row.user_id),
    title: asString(row.title),
    body: asString(row.body),
    href: asString(row.href) || undefined,
    read: Boolean(row.read),
    createdAt: asString(row.created_at),
  }));

  const [conversations, messages, blocks, reports, supports, sessions, pins] = await Promise.all([
    optional(db.from("conversations").select("*")),
    optional(db.from("conversation_messages").select("*").order("created_at", { ascending: true }).limit(200)),
    optional(db.from("blocks").select("*")),
    optional(db.from("reports").select("*")),
    optional(db.from("seed_supports").select("*")),
    optional(db.from("session_requests").select("*")),
    optional(db.from("dismissed_pins").select("*")),
  ]);
  capabilities.conversations = conversations.ok;
  capabilities.blocks = blocks.ok;
  capabilities.reports = reports.ok;
  capabilities.seedSupport = supports.ok;
  capabilities.sessions = sessions.ok;
  capabilities.dismissals = pins.ok;
  world.conversations = conversations.rows.map((row) => ({
    id: asString(row.id),
    contextType: asString(row.context_type, "direct") as World["conversations"][number]["contextType"],
    contextId: asString(row.context_id),
    contextLabel: asString(row.context_label),
    requesterId: asString(row.requester_id),
    recipientId: asString(row.recipient_id),
    status: asString(row.status, "request") as World["conversations"][number]["status"],
    mutedBy: asArray(row.muted_by),
    createdAt: asString(row.created_at),
    updatedAt: asString(row.updated_at),
  }));
  world.messages = messages.rows.map((row) => ({
    id: asString(row.id),
    conversationId: asString(row.conversation_id),
    authorId: asString(row.author_id),
    body: asString(row.body),
    imageUrl: asString(row.image_url) || undefined,
    imageAlt: asString(row.image_alt) || undefined,
    createdAt: asString(row.created_at),
    clientKey: asString(row.client_key) || undefined,
  }));
  world.blocks = blocks.rows.map((row) => ({
    id: asString(row.id),
    blockerId: asString(row.blocker_id),
    blockedId: asString(row.blocked_id),
    createdAt: asString(row.created_at),
  }));
  world.reports = reports.rows.map((row) => ({
    id: asString(row.id),
    reporterId: asString(row.reporter_id),
    targetType: asString(row.target_type) as World["reports"][number]["targetType"],
    targetId: asString(row.target_id),
    reason: asString(row.reason),
    status: asString(row.status, "open") as World["reports"][number]["status"],
    createdAt: asString(row.created_at),
  }));
  world.seedSupports = supports.rows.map((row) => ({
    id: asString(row.id),
    userSeedId: asString(row.user_seed_id),
    ownerId: asString(row.owner_id),
    supporterId: asString(row.supporter_id),
    note: asString(row.note),
    status: asString(row.status) === "closed" ? "closed" : "offered",
    createdAt: asString(row.created_at),
  }));
  world.sessions = sessions.rows.map((row) => ({
    id: asString(row.id),
    contextType: asString(row.context_type) === "same" ? "same" : "skill-swap",
    contextId: asString(row.context_id),
    memberA: asString(row.member_a),
    memberB: asString(row.member_b),
    startsAt: asString(row.starts_at),
    endsAt: asString(row.ends_at),
    aAgreed: Boolean(row.a_agreed),
    bAgreed: Boolean(row.b_agreed),
    continuationA: typeof row.continuation_a === "boolean" ? row.continuation_a : null,
    continuationB: typeof row.continuation_b === "boolean" ? row.continuation_b : null,
    status: asString(row.status, "proposed") as World["sessions"][number]["status"],
    createdAt: asString(row.created_at),
  }));
  world.dismissedPins = pins.rows.map((row) => ({
    userId: asString(row.user_id),
    targetType: asString(row.target_type) as World["dismissedPins"][number]["targetType"],
    targetId: asString(row.target_id),
  }));
  await attachSignedMedia(db, world);

  const profile = world.profiles.find((item) => item.id === userId) ?? null;
  return { profile, content, ...catalog, world, capabilities };
}

async function cachedShell(): Promise<Shell | null> {
  const raw = await AsyncStorage.getItem(CONTENT_CACHE_KEY);
  if (!raw) return null;
  try {
    const content = mergeContent(JSON.parse(raw));
    return {
      profile: null,
      content,
      seeds: SEEDS,
      waypoints: WAYPOINTS,
      world: emptyWorld(),
      capabilities: emptyCapabilities(),
      fromCache: true,
    };
  } catch {
    return null;
  }
}

function redirect(next: string) {
  const site = configured().site.replace(/\/$/, "");
  if (!site) return undefined;
  return `${site}/auth/callback?next=${encodeURIComponent(next)}`;
}

async function afterAuth(db: SupabaseClient): Promise<ApiResult<Shell>> {
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) return fromError(error ?? { message: "not authenticated" });
  await db.from("profiles").upsert({
    id: data.user.id,
    email: data.user.email ?? "",
    email_verified: Boolean(data.user.email_confirmed_at),
  });
  try {
    return ok(await loadShell(db, data.user.id));
  } catch {
    const cached = await cachedShell();
    if (cached) return ok(cached);
    return fail("offline", "The connection dropped. Nothing was published.");
  }
}

async function mutate(db: SupabaseClient, error: { message: string } | null): Promise<ApiResult<Shell>> {
  if (error) return fromError(error);
  return afterAuth(db);
}

export function createLiveRepository(): Repository {
  const db = supabase();
  if (!db) throw new Error("Supabase is not configured");

  return {
    mode: "live",
    async restore() {
      const { data } = await db.auth.getSession();
      if (!data.session) {
        const cached = await cachedShell();
        return ok(cached ?? (await loadShell(db, null)));
      }
      return afterAuth(db);
    },
    async signIn(email, password) {
      const { error } = await db.auth.signInWithPassword({ email: email.trim(), password });
      if (error) return fromError(error);
      return afterAuth(db);
    },
    async signUp(email, password, displayName) {
      if (password.length < 8) return fail("validation", "Use at least 8 characters.");
      const { data, error } = await db.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: redirect("/onboarding"), data: { display_name: displayName.trim() } },
      });
      if (error) return fromError(error);
      if (!data.session || !data.user) {
        return ok({
          profile: null,
          content: defaultContent(),
          seeds: SEEDS,
          waypoints: WAYPOINTS,
          world: emptyWorld(),
          capabilities: emptyCapabilities(),
          needsVerification: true,
        });
      }
      await db.from("profiles").update({ display_name: displayName.trim() }).eq("id", data.user.id);
      const shell = await afterAuth(db);
      if (shell.ok) shell.data.needsVerification = false;
      return shell;
    },
    async signOut() {
      await db.auth.signOut({ scope: "global" });
    },
    async requestPasswordReset(email) {
      const { error } = await db.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirect("/reset-password") });
      if (error) return fromError(error);
      return ok(null);
    },
    async updatePassword(password) {
      if (password.length < 8) return fail("validation", "Use at least 8 characters.");
      const { error } = await db.auth.updateUser({ password });
      if (error) return fromError(error);
      return ok(null);
    },
    async resendVerification() {
      const { data } = await db.auth.getUser();
      if (!data.user?.email) return fail("unauthorized", "Sign in to continue.");
      const { error } = await db.auth.resend({
        type: "signup",
        email: data.user.email,
        options: { emailRedirectTo: redirect("/onboarding") },
      });
      if (error) return fromError(error);
      return ok(null);
    },
    async deleteAccount() {
      const { error } = await db.rpc("delete_own_account");
      if (error) return fromError(error);
      await db.auth.signOut({ scope: "local" });
      return ok(null);
    },
    refresh() {
      return afterAuth(db);
    },
    async updateProfile(patch) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const row: Row = {};
      if (patch.displayName !== undefined) row.display_name = patch.displayName;
      if (patch.bio !== undefined) row.bio = patch.bio;
      if (patch.location !== undefined) row.location = patch.location;
      if (patch.avatarUrl !== undefined) row.avatar_url = patch.avatarUrl;
      if (patch.intentions !== undefined) row.intentions = patch.intentions;
      if (patch.onboardingComplete !== undefined) row.onboarding_complete = patch.onboardingComplete;
      if (patch.onboardingStep !== undefined) row.onboarding_step = patch.onboardingStep;
      if (patch.showLocation !== undefined) row.show_location = patch.showLocation;
      if (patch.showWaypoints !== undefined) row.show_waypoints = patch.showWaypoints;
      if (patch.notifyReplies !== undefined) row.notify_replies = patch.notifyReplies;
      if (patch.notifyWaypoints !== undefined) row.notify_waypoints = patch.notifyWaypoints;
      if (patch.notifyCheckins !== undefined) row.notify_checkins = patch.notifyCheckins;
      if (patch.helpPlantNote !== undefined) row.help_plant_note = patch.helpPlantNote;
      if (patch.checkInFrequency !== undefined) row.contact_frequency = patch.checkInFrequency;
      if (patch.checkInStyle !== undefined) row.contact_style = patch.checkInStyle;
      if (patch.communicationPreference !== undefined) row.communication_preference = patch.communicationPreference;
      if (patch.takingSpace !== undefined) row.taking_space = patch.takingSpace;
      if (patch.notificationPrefs !== undefined) row.notification_prefs = patch.notificationPrefs;
      if (patch.supportWith !== undefined || patch.sameNotes !== undefined) {
        await db.from("same_preferences").delete().eq("user_id", data.user.id);
        const types = patch.supportWith ?? [];
        if (types.length || patch.sameNotes) {
          await db.from("same_preferences").insert(
            (types.length ? types : [null]).map((type) => ({
              user_id: data.user.id,
              support_type: type ? (SUPPORT_WITH.find((item) => item.id === type)?.label ?? type) : null,
              frequency: patch.checkInFrequency
                ? (CHECK_IN_FREQUENCIES.find((item) => item.id === patch.checkInFrequency)?.label ?? patch.checkInFrequency)
                : null,
              notes: patch.sameNotes ?? null,
            })),
          );
        }
      }
      if (Object.keys(row).length) {
        let { error } = await db.from("profiles").update(row).eq("id", data.user.id);
        if (error && /column/.test(error.message.toLowerCase())) {
          delete row.onboarding_step;
          delete row.communication_preference;
          delete row.taking_space;
          delete row.notification_prefs;
          if (Object.keys(row).length === 0) return fromError(error);
          const retry = await db.from("profiles").update(row).eq("id", data.user.id);
          error = retry.error;
        }
        if (error) return fromError(error);
      }
      return afterAuth(db);
    },
    async setInterests(ids) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      await db.from("user_interests").delete().eq("user_id", data.user.id);
      if (ids.length) {
        const { error } = await db.from("user_interests").insert(ids.map((interest_slug) => ({ user_id: data.user.id, interest_slug })));
        if (error) return fromError(error);
      }
      return afterAuth(db);
    },
    async uploadAvatar(uri, mime) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const response = await fetch(uri);
      const bytes = await response.arrayBuffer();
      const path = `${data.user.id}/${createId()}`;
      const uploaded = await db.storage.from("avatars").upload(path, bytes, { contentType: mime, upsert: true });
      if (uploaded.error) return fail("server", "The photo could not be saved. Your words are still here.");
      const url = db.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      const { error } = await db.from("profiles").update({ avatar_url: url }).eq("id", data.user.id);
      return mutate(db, error);
    },
    async plantSeed(seedId, goal) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const seed = SEEDS.find((item) => item.id === seedId);
      const { error } = await db.from("user_seeds").insert({
        user_id: data.user.id,
        seed_id: seedId,
        title: seed?.title ?? "",
        goal: goal.trim(),
        status: "active",
      });
      if (error) return fail("server", "This seed could not be planted in the shared garden.");
      return afterAuth(db);
    },
    async setSeedStatus(userSeedId, status) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const { error } = await db.from("user_seeds").update({ status }).eq("id", userSeedId).eq("user_id", data.user.id);
      return mutate(db, error);
    },
    async addSeedReflection(userSeedId, note) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const existing = await db.from("user_seeds").select("check_ins").eq("id", userSeedId).eq("user_id", data.user.id).maybeSingle();
      const checkIns = Array.isArray(existing.data?.check_ins) ? existing.data.check_ins : [];
      checkIns.push({ id: createId(), at: new Date().toISOString(), note: note.trim(), userId: data.user.id });
      const { error } = await db.from("user_seeds").update({ check_ins: checkIns }).eq("id", userSeedId).eq("user_id", data.user.id);
      return mutate(db, error);
    },
    async offerSeedSupport(userSeedId, note) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const seed = await db.from("user_seeds").select("id, user_id, status").eq("id", userSeedId).maybeSingle();
      if (!seed.data) return fail("not_found", "That seed is not here.");
      if (seed.data.status !== "active") return fail("forbidden", "This seed is not taking new support.");
      const { error } = await db.from("seed_supports").insert({
        user_seed_id: userSeedId,
        owner_id: seed.data.user_id,
        supporter_id: data.user.id,
        note: note.trim(),
        status: "offered",
      });
      return mutate(db, error);
    },
    async saveGrowing(seeds) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      await db.from("user_seeds").delete().eq("user_id", data.user.id).is("seed_id", null);
      const rows = seeds
        .filter((seed) => seed.name.trim())
        .map((seed) => ({
          user_id: data.user!.id,
          seed_id: null,
          title: seed.name.trim(),
          status: seed.status === "resting" ? "resting" : "active",
          looking_for_support: Boolean(seed.lookingForSupport),
          goal: "",
          started_at: seed.since || new Date().toISOString(),
        }));
      if (rows.length) {
        const { error } = await db.from("user_seeds").insert(rows);
        if (error) return fromError(error);
      }
      return afterAuth(db);
    },
    async saveHelp(kind, titles, note) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const table = kind === "growing" ? "seed_help_requests" : "seed_help_offers";
      await db.from(table).delete().eq("user_id", data.user.id);
      const unique = [...new Set(titles.map((title) => title.trim()).filter(Boolean))];
      if (unique.length) {
        const { error } = await db.from(table).insert(unique.map((title) => ({ user_id: data.user!.id, title })));
        if (error) return fromError(error);
      }
      if (note !== undefined) {
        await db.from("profiles").update({ help_plant_note: note }).eq("id", data.user.id);
      }
      return afterAuth(db);
    },
    async joinWaypoint(id) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const { error } = await db.from("user_waypoints").insert({ user_id: data.user.id, waypoint_id: id });
      if (error && !error.message.toLowerCase().includes("duplicate")) return fromError(error);
      return afterAuth(db);
    },
    async leaveWaypoint(id) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const { error } = await db.from("user_waypoints").delete().eq("user_id", data.user.id).eq("waypoint_id", id);
      return mutate(db, error);
    },
    async publishCampfire(input: CampfireInput) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const image = await storedPhoto(db, data.user.id, input.imageUrl, input.imageMime);
      if ("error" in image) return fail("validation", image.error ?? "The photo could not be saved. Your words are still here.");
      const { error } = await db.from("campfire_posts").insert({
        author_id: data.user.id,
        user_id: data.user.id,
        section: input.section,
        kind: input.kind,
        title: input.title.trim(),
        body: input.body.trim(),
        content: input.body.trim(),
        waypoint_id: input.waypointId ?? null,
        image_url: image.path,
        image_alt: image.path ? input.imageAlt ?? null : null,
      });
      return mutate(db, error);
    },
    async publishStory(input: StoryInput) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const image = await storedPhoto(db, data.user.id, input.imageUrl, input.imageMime);
      if ("error" in image) return fail("validation", image.error ?? "The photo could not be saved. Your words are still here.");
      const { error } = await db.from("out_there_posts").insert({
        author_id: data.user.id,
        user_id: data.user.id,
        title: input.title.trim(),
        what_did_you_do: input.body.trim(),
        what_i_did: input.body.trim(),
        expecting: "",
        actually_happened: "",
        would_do_again: "yes",
        image_url: image.path,
        image_alt: image.path ? input.imageAlt ?? null : null,
      });
      return mutate(db, error);
    },
    async updateStory(id, input) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const patch: Row = {
        title: input.title.trim(),
        what_did_you_do: input.body.trim(),
        what_i_did: input.body.trim(),
      };
      if (input.clearImage) {
        patch.image_url = null;
        patch.image_alt = null;
      } else if (input.imageUrl && !isRemoteMedia(input.imageUrl)) {
        const image = await storedPhoto(db, data.user.id, input.imageUrl, input.imageMime);
        if ("error" in image) return fail("validation", image.error ?? "The photo could not be saved. Your words are still here.");
        patch.image_url = image.path;
        patch.image_alt = input.imageAlt ?? null;
      } else if (input.imageAlt !== undefined) {
        patch.image_alt = input.imageAlt;
      }
      const { error } = await db.from("out_there_posts").update(patch).eq("id", id).eq("author_id", data.user.id);
      return mutate(db, error);
    },
    async comment(targetType, targetId, body) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const { error } = await db.from("comments").insert({
        author_id: data.user.id,
        target_type: targetType,
        target_id: targetId,
        body: body.trim(),
      });
      return mutate(db, error);
    },
    async react(targetType, targetId, kind) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      if (!kind) {
        const { error } = await db.from("reactions").delete().eq("user_id", data.user.id).eq("target_type", targetType).eq("target_id", targetId);
        return mutate(db, error);
      }
      const { error } = await db.from("reactions").upsert(
        { user_id: data.user.id, target_type: targetType, target_id: targetId, kind },
        { onConflict: "user_id,target_type,target_id" },
      );
      return mutate(db, error);
    },
    async offerSkill(skill, description) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const { error } = await db.from("skill_offers").insert({ user_id: data.user.id, skill: skill.trim(), description: description.trim() });
      return mutate(db, error);
    },
    async requestSkill(skill, description) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const { error } = await db.from("skill_requests").insert({ user_id: data.user.id, skill: skill.trim(), description: description.trim() });
      return mutate(db, error);
    },
    async expressInterest(input) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const { error } = await db.from("skill_connections").insert({
        from_user_id: data.user.id,
        to_user_id: input.toUserId,
        offer_id: input.offerId ?? null,
        request_id: input.requestId ?? null,
        note: input.note.trim(),
      });
      return mutate(db, error);
    },
    async setSwapStatus(id, status, reflection) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const patch: Row = { status };
      if (reflection !== undefined) patch.reflection = reflection;
      const { error } = await db.from("skill_connections").update(patch).eq("id", id);
      return mutate(db, error);
    },
    async openSame(seedId, goal) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const { error } = await db.from("same_partnerships").insert({
        seeker_id: data.user.id,
        seed_id: seedId,
        goal: goal.trim(),
        status: "seeking",
        partner_id: null,
      });
      return mutate(db, error);
    },
    async consentSame(id, decision) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const current = await db.from("same_partnerships").select("seeker_id, partner_id").eq("id", id).maybeSingle();
      if (!current.data) return fail("not_found", "That introduction is not here.");
      const column = current.data.seeker_id === data.user.id ? "seeker_consent" : "partner_consent";
      if (current.data.seeker_id !== data.user.id && current.data.partner_id !== data.user.id) {
        return fail("forbidden", "This introduction is not yours.");
      }
      const { error } = await db.from("same_partnerships").update({ [column]: decision }).eq("id", id);
      return mutate(db, error);
    },
    async setCommunication(preference) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const { error } = await db.from("profiles").update({ communication_preference: preference, taking_space: false }).eq("id", data.user.id);
      return mutate(db, error);
    },
    async startConversation(input) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const created = await db
        .from("conversations")
        .insert({
          requester_id: data.user.id,
          recipient_id: input.targetId,
          context_type: input.contextType,
          context_id: input.contextId,
          context_label: input.contextLabel,
          status: "request",
        })
        .select("id")
        .single();
      if (created.error) return fromError(created.error);
      const { error } = await db.from("conversation_messages").insert({
        conversation_id: created.data.id,
        author_id: data.user.id,
        body: input.note.trim(),
      });
      return mutate(db, error);
    },
    async sendMessage(conversationId, body, clientKey) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const existing = await db.from("conversation_messages").select("id").eq("client_key", clientKey).maybeSingle();
      if (existing.data) return afterAuth(db);
      const { error } = await db.from("conversation_messages").insert({
        conversation_id: conversationId,
        author_id: data.user.id,
        body: body.trim(),
        client_key: clientKey,
      });
      return mutate(db, error);
    },
    async chooseInteraction(conversationId, choice, phrase) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const note = await db.from("conversation_messages").insert({
        conversation_id: conversationId,
        author_id: data.user.id,
        body: phrase,
      });
      if (note.error) return fromError(note.error);
      const status = choice === "decline" ? "declined" : choice === "space" ? "space" : "accepted";
      if (choice === "space") await db.from("profiles").update({ taking_space: true }).eq("id", data.user.id);
      const { error } = await db.from("conversations").update({ status, updated_at: new Date().toISOString() }).eq("id", conversationId);
      return mutate(db, error);
    },
    async setConversationFlag(conversationId, flag) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const current = await db.from("conversations").select("muted_by, status").eq("id", conversationId).maybeSingle();
      if (!current.data) return fail("not_found", "That conversation is not here.");
      const muted = new Set(asArray(current.data.muted_by));
      let status = asString(current.data.status);
      if (flag === "mute") muted.add(data.user.id);
      if (flag === "unmute") muted.delete(data.user.id);
      if (flag === "archive") status = "archived";
      if (flag === "restore") status = "accepted";
      if (flag === "close") status = "closed";
      const { error } = await db.from("conversations").update({ muted_by: [...muted], status }).eq("id", conversationId);
      return mutate(db, error);
    },
    async report(input) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const { error } = await db.from("reports").insert({
        reporter_id: data.user.id,
        target_type: input.targetType,
        target_id: input.targetId,
        reason: input.reason.trim(),
      });
      return mutate(db, error);
    },
    async block(blockedId) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const { error } = await db.from("blocks").insert({ blocker_id: data.user.id, blocked_id: blockedId });
      return mutate(db, error);
    },
    async unblock(blockedId) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const { error } = await db.from("blocks").delete().eq("blocker_id", data.user.id).eq("blocked_id", blockedId);
      return mutate(db, error);
    },
    async markNotifications() {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const { error } = await db.from("notifications").update({ read: true }).eq("user_id", data.user.id).eq("read", false);
      return mutate(db, error);
    },
    async dismissPin(targetType, targetId) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const { error } = await db.from("dismissed_pins").insert({ user_id: data.user.id, target_type: targetType, target_id: targetId });
      return mutate(db, error);
    },
    async revealPins() {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const { error } = await db.from("dismissed_pins").delete().eq("user_id", data.user.id);
      return mutate(db, error);
    },
    async stewardModerate(input) {
      const table = input.kind === "campfire" ? "campfire_posts" : "out_there_posts";
      const patch: Row = {};
      if (input.hidden !== undefined) patch.hidden = input.hidden;
      if (input.pinned !== undefined) patch.pinned = input.pinned;
      const { error } = await db.from(table).update(patch).eq("id", input.id);
      return mutate(db, error);
    },
    async proposeSession(input) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const window = parseSessionWindow(input.startsAt, input.endsAt);
      if (!window) return fail("validation", "Choose a time that begins soon and ends within a day.");
      const { error } = await db.from("session_requests").insert({
        context_type: input.contextType,
        context_id: input.contextId,
        member_a: data.user.id,
        member_b: input.memberId,
        starts_at: window.startsAt,
        ends_at: window.endsAt,
        a_agreed: true,
        b_agreed: false,
        status: "proposed",
      });
      return mutate(db, error);
    },
    async agreeSession(id) {
      const { error } = await db.rpc("agree_session", { session_id: id });
      return mutate(db, error);
    },
    async answerContinuation(id, agree) {
      const { error } = await db.rpc("answer_session_continuation", { session_id: id, agree });
      return mutate(db, error);
    },
    async registerPushToken(token, platform) {
      const { data } = await db.auth.getUser();
      if (!data.user) return fail("unauthorized", "Sign in to continue.");
      const { error } = await db.from("push_tokens").upsert(
        { user_id: data.user.id, token, platform },
        { onConflict: "user_id,token" },
      );
      if (error) return fromError(error);
      return ok(null);
    },
  };
}
