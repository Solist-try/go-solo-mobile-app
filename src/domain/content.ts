export type HowStep = {
  mark: string;
  name: string;
  body: string;
  href: string;
  hrefLabel: string;
};

export type SiteContent = {
  contentRevision: number;
  heroTagline: string;
  heroTitle: string;
  heroSubhead: string;
  heroSupport: string;
  heroPrimary: string;
  heroSecondary: string;
  phrases: string[];
  balanceIntro: string;
  balanceItems: string[];
  howTitle: string;
  howIntro: string;
  steps: HowStep[];
  seedsIntro: string;
  manifesto: string[];
  belief: string;
  beliefSecond: string;
  philosophyTitle: string;
  philosophyParagraphs: string[];
  philosophyClose: string;
  founderName: string;
  founderBio: string;
  founderLetter: string[];
  founderEmail: string;
  mobile?: MobileCopy;
};

export type MobileCopy = {
  welcomeHello: string;
  welcomeBody: string;
  beginLabel: string;
  maybeLater: string;
  connectionNote: string[];
  arriveCampfire: string;
  arriveGarden: string;
  arriveReading: string;
  seedStatus: Record<string, string>;
  interaction: Record<string, string>;
  pinnedLabels: Record<string, string>;
  emptyCampfire: string;
  emptyWaypoints: string;
  emptyStories: string;
  emptyGarden: string;
  emptySeeds: string;
  emptyConversations: string;
  campfireWelcome: string;
  pullUpAChair: string;
  shareIt: string;
  aroundTheTable: string;
  communityNote: string;
};

export function defaultMobileCopy(): MobileCopy {
  return {
    welcomeHello: "Hello, vagabond.",
    welcomeBody: "Welcome to Go Solo. You do not need to have everything figured out. Take your time.",
    beginLabel: "Begin",
    maybeLater: "Maybe later",
    connectionNote: [
      "Not every interaction becomes a friendship.",
      "Difference does not make someone bad.",
      "You may continue, keep in touch, take space, or decline.",
      "Boundaries and respect can coexist.",
    ],
    arriveCampfire: "Visit Campfire",
    arriveGarden: "Visit My Garden",
    arriveReading: "Explore Reading Room",
    seedStatus: {
      active: "Growing",
      resting: "On Hold",
      completed: "Grown",
    },
    interaction: {
      continue: "I’d like to continue. I’ve appreciated our exchange and would be glad to spend some more time with it.",
      "keep-in-touch": "Let’s keep in touch. There’s no need to arrange anything right now, but I’d be happy to leave the door open.",
      space: "I’m taking a little space. Thank you for the time we’ve shared. I’m stepping back from new or ongoing conversations for now.",
      decline: "Thank you for reaching out. I don’t think I’d like to continue, but I’m glad our paths crossed. I wish you well.",
    },
    pinnedLabels: {
      campfire: "Welcome Note",
      waypoint: "Start Here",
      story: "Featured",
      reading: "Featured Reading",
      community: "Community Note",
    },
    emptyCampfire: "The fire is lit. Pull up a chair when you have something to share.",
    emptyWaypoints: "A waypoint is a chair for a topic, not a crowd to perform for.",
    emptyStories: "Out There is for something you actually tried. Nothing is listed yet.",
    emptyGarden: "This garden is still being tended.",
    emptySeeds: "A seed is a tiny future. Nothing is planted yet.",
    emptyConversations: "No conversations yet. They begin from a shared context, when both people are willing.",
    campfireWelcome: "First Log by the Fire",
    pullUpAChair: "Pull up a chair.",
    shareIt: "Share it",
    aroundTheTable: "Around the Table",
    communityNote: "Community Note",
  };
}

export function defaultContent(): SiteContent {
  return {
    contentRevision: 5,
    heroTagline: "Go Solo, Not Alone",
    heroTitle: "Hello, Vagabond.",
    heroSubhead: "Your life doesn't have to wait.",
    heroSupport: "Go Solo helps people build meaningful lives on their own terms.",
    heroPrimary: "Join Go Solo",
    heroSecondary: "Learn More",
    phrases: ["Try the thing.", "Take the trip.", "Paint the room orange."],
    balanceIntro: "Sometimes the thing is",
    balanceItems: [
      "Taking a trip.",
      "Going to a bar alone.",
      "Cooking for one.",
      "Learning a practical skill.",
      "Creating a routine.",
      "Starting over.",
      "Making a new friend.",
    ],
    howTitle: "How Go Solo Works",
    howIntro: "Life gets bigger one small step at a time.",
    steps: [
      { mark: "🌱", name: "Find a Seed", body: "Choose something new to try.", href: "/seeds", hrefLabel: "Browse seeds" },
      { mark: "🚶", name: "Go Out There", body: "Try it in real life.", href: "/out-there", hrefLabel: "Read what people tried" },
      { mark: "🔥", name: "Return to Campfire", body: "Share your story.", href: "/campfire", hrefLabel: "Visit the campfire" },
      { mark: "🧭", name: "Visit a Waypoint", body: "Connect with people exploring similar parts of life.", href: "/waypoints", hrefLabel: "See the waypoints" },
    ],
    seedsIntro: "Tiny futures you can plant now.",
    manifesto: [
      "Go Solo helps people build lives that work, whether or not somebody else shows up.",
      "Living alone is not the problem. Living on hold is.",
      "You can live alone without being alone.",
    ],
    belief: "Living alone is not the problem.",
    beliefSecond: "Living on hold is.",
    philosophyTitle: "A supportive companion.",
    philosophyParagraphs: [
      "Many parts of modern life are designed around pairs, families or groups.",
      "Go Solo is a home base for people building a life that works whether or not somebody else shows up.",
      "Adventure is one expression of independence. Everyday life is another.",
    ],
    philosophyClose: "Support comes first. Action comes second. Adventure comes later.",
    founderName: "Marge Aliaga",
    founderBio: "I've always been a friendly person, but I haven't always been well connected. Go Solo began after I was turned away from a bar for arriving alone.",
    founderLetter: [
      "Go Solo is intentionally founder-led. If you have a question, an idea, feedback, or simply want to say hello, I'd genuinely love to hear from you.",
    ],
    founderEmail: "marge@gosolo.co.network",
    mobile: defaultMobileCopy(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function mergeContent(stored: unknown): SiteContent {
  const base = defaultContent();
  if (!isRecord(stored)) return base;
  const mobileStored = isRecord(stored.mobile) ? stored.mobile : {};
  const mobile = { ...defaultMobileCopy(), ...mobileStored } as SiteContent["mobile"];
  if (isRecord(mobileStored.seedStatus)) mobile!.seedStatus = { ...defaultMobileCopy().seedStatus, ...(mobileStored.seedStatus as Record<string, string>) };
  if (isRecord(mobileStored.interaction)) mobile!.interaction = { ...defaultMobileCopy().interaction, ...(mobileStored.interaction as Record<string, string>) };
  if (isRecord(mobileStored.pinnedLabels)) mobile!.pinnedLabels = { ...defaultMobileCopy().pinnedLabels, ...(mobileStored.pinnedLabels as Record<string, string>) };
  if (Array.isArray(mobileStored.connectionNote)) mobile!.connectionNote = mobileStored.connectionNote.filter((item) => typeof item === "string");
  const steps = Array.isArray(stored.steps)
    ? stored.steps.flatMap((step) => {
        if (!isRecord(step) || typeof step.name !== "string") return [];
        return [
          {
            mark: typeof step.mark === "string" ? step.mark : "",
            name: step.name,
            body: typeof step.body === "string" ? step.body : "",
            href: typeof step.href === "string" ? step.href : "",
            hrefLabel: typeof step.hrefLabel === "string" ? step.hrefLabel : "",
          },
        ];
      })
    : base.steps;
  return {
    ...base,
    ...Object.fromEntries(Object.entries(stored).filter(([key, value]) => key !== "mobile" && value !== undefined && key in base)),
    steps: steps.length ? steps : base.steps,
    phrases: Array.isArray(stored.phrases) ? stored.phrases.filter((item) => typeof item === "string") : base.phrases,
    balanceItems: Array.isArray(stored.balanceItems) ? stored.balanceItems.filter((item) => typeof item === "string") : base.balanceItems,
    manifesto: Array.isArray(stored.manifesto) ? stored.manifesto.filter((item) => typeof item === "string") : base.manifesto,
    philosophyParagraphs: Array.isArray(stored.philosophyParagraphs)
      ? stored.philosophyParagraphs.filter((item) => typeof item === "string")
      : base.philosophyParagraphs,
    founderLetter: Array.isArray(stored.founderLetter) ? stored.founderLetter.filter((item) => typeof item === "string") : base.founderLetter,
    mobile,
  };
}

export const CONTENT_CACHE_KEY = "gosolo.content.v1";
