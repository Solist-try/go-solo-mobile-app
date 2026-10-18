import type { Seed, Waypoint } from "./types";

export const WAYPOINTS: Waypoint[] = [
  {
    id: "independence-lab",
    slug: "independence-lab",
    name: "Independence Lab",
    summary: "Home systems, life administration, and the skills that make a week hold.",
    description:
      "For the practical side of living on your own. Home systems, budgeting, cooking, routines, repairs, and the confidence that comes from trusting your own hands.",
    focus: [
      "Home systems",
      "Life administration",
      "Self-reliance",
      "Budgeting",
      "Cooking",
      "Routines",
      "Confidence",
      "Practical skills",
    ],
  },
  {
    id: "solo-among-others",
    slug: "solo-among-others",
    name: "Solo Among Others",
    summary: "Belonging, friendship, and the courage to be with other people.",
    description:
      "For connection that does not require a couple or a crowd. Friendship, community, social confidence, and experiences you can share.",
    focus: [
      "Belonging",
      "Friendship",
      "Connection",
      "Community",
      "Social confidence",
      "Shared experiences",
    ],
  },
  {
    id: "emotional-clarity",
    slug: "emotional-clarity",
    name: "Emotional Clarity",
    summary: "Transitions, starting over, and the meaning you make of them.",
    description:
      "For the seasons when a life is changing. Identity, grief, resilience, and the slower work of starting again.",
    focus: ["Transitions", "Identity", "Personal growth", "Starting over", "Grief", "Resilience", "Meaning"],
  },
];

export const SEEDS: Seed[] = [
  {
    id: "learning-spanish",
    title: "Learning Spanish",
    description: "A language, begun at the size of one conversation.",
    prompt:
      "Spend the first hour on Spanish. Ask for one small thing you actually need, or trade an hour with someone who already speaks it.",
    category: "growth",
    kind: "skill-swap",
    timeframe: "Over time",
    waypoints: ["solo-among-others"],
  },
  {
    id: "building-confidence",
    title: "Building confidence",
    description: "A stretch you do not have to take alone.",
    prompt: "Name one thing you would like to feel more able to do. Find someone to grow it with you.",
    category: "growth",
    kind: "same",
    timeframe: "Over time",
    waypoints: ["emotional-clarity", "independence-lab"],
  },
  {
    id: "making-local-friends",
    title: "Making local friends",
    description: "A few people nearby, met more than once.",
    prompt: "Choose one local place you can return to. Say hello. Go again.",
    category: "relationships",
    kind: "practice",
    timeframe: "Over time",
    waypoints: ["solo-among-others"],
  },
  {
    id: "walk-unknown",
    title: "Walk a street you don't know",
    description: "A small adventure that asks nothing of anyone else.",
    prompt:
      "Choose a neighborhood you always pass through. Walk it slowly for forty minutes. Notice one thing you would tell a friend.",
    category: "adventure",
    kind: "practice",
    timeframe: "An afternoon",
    waypoints: ["solo-among-others"],
  },
  {
    id: "ticket-for-one",
    title: "Buy a ticket for one",
    description: "Stop waiting for a date that makes the outing make sense.",
    prompt:
      "Book something small that happens this month: a train, a film, a talk. Go alone on purpose.",
    category: "adventure",
    kind: "practice",
    timeframe: "One outing",
    waypoints: ["emotional-clarity", "solo-among-others"],
  },
  {
    id: "local-yes",
    title: "Say yes to a listing",
    description: "One local yes, even if nobody else's calendar is free.",
    prompt:
      "Pick one local event you would usually skip because no one else is free. Put it on the calendar.",
    category: "adventure",
    kind: "practice",
    timeframe: "This week",
    waypoints: ["solo-among-others"],
  },
  {
    id: "weekly-hello",
    title: "SAME",
    description:
      "A seed grows faster when someone else helps tend it. Choose something you'd like to move towards and find someone to grow alongside.",
    prompt: "Name what you would like to grow, and find someone to tend it with you.",
    category: "connection",
    kind: "same",
    timeframe: "Over time",
    waypoints: ["solo-among-others", "independence-lab"],
  },
  {
    id: "neighbor",
    title: "A conversation without an agenda",
    description: "Be a person in the world for a few minutes.",
    prompt:
      "Speak to someone nearby — a neighbor, a barista, a person at the same class — with no plan to become friends. Just be there.",
    category: "connection",
    kind: "practice",
    timeframe: "Once",
    waypoints: ["solo-among-others"],
  },
  {
    id: "skill-swap",
    title: "Skill Swap",
    description:
      "Offer what you know. Ask for what you'd like to learn. Help somebody else's seed grow while growing your own.",
    prompt: "Learn something. Teach something. Crochet, Spanish, gardening, budgeting, writing, DIY. Small is perfect.",
    category: "connection",
    kind: "skill-swap",
    timeframe: "Over time",
    waypoints: ["solo-among-others", "independence-lab"],
  },
  {
    id: "imperfect-making",
    title: "Make something imperfect",
    description: "An hour of making that is not for praise.",
    prompt:
      "Spend an hour making something you will not show for approval. A page, a photo, a melody, a crooked sketch.",
    category: "creativity",
    kind: "practice",
    timeframe: "An hour",
    waypoints: ["emotional-clarity"],
  },
  {
    id: "museum-sentence",
    title: "Leave with one sentence",
    description: "Stay in a room until language arrives.",
    prompt:
      "Visit a museum, a gallery, or even a shop window with real attention. Stay until one sentence arrives. Write it down before you leave.",
    category: "creativity",
    kind: "practice",
    timeframe: "An outing",
    waypoints: ["solo-among-others", "emotional-clarity"],
  },
  {
    id: "orange-corner",
    title: "Change one corner",
    description: "The room does not have to wait for a different life.",
    prompt:
      "Paint, move, or dress one corner of home in a color you have been waiting to deserve. Orange is allowed.",
    category: "creativity",
    kind: "practice",
    timeframe: "A weekend hour",
    waypoints: ["independence-lab"],
  },
  {
    id: "morning-system",
    title: "One system that makes morning kinder",
    description: "Not a new personality. One kinder setup.",
    prompt:
      "Design a single tiny home system: the bag by the door, the pan that lives out, the light you turn on first. Use it for seven days.",
    category: "home",
    kind: "practice",
    timeframe: "One week",
    waypoints: ["independence-lab"],
  },
  {
    id: "meal-for-you",
    title: "Cook the meal you were saving",
    description: "Stop reserving the good meal for company.",
    prompt:
      "Make a meal you usually postpone until someone else is there. Set a place. Eat it while it is hot.",
    category: "home",
    kind: "practice",
    timeframe: "An evening",
    waypoints: ["independence-lab"],
  },
  {
    id: "room-for-this-life",
    title: "Arrange the room for the life you have",
    description: "Let the furniture tell the truth.",
    prompt:
      "Move one piece of furniture so the room fits how you actually live, not how you thought you would.",
    category: "home",
    kind: "practice",
    timeframe: "An afternoon",
    waypoints: ["independence-lab", "emotional-clarity"],
  },
  {
    id: "first-hour",
    title: "The first hour of a postponed skill",
    description: "You do not need a plan for the whole craft.",
    prompt:
      "Learn only the first hour of something you have been waiting to start properly. Stop when the hour ends.",
    category: "growth",
    kind: "practice",
    timeframe: "One hour",
    waypoints: ["emotional-clarity"],
  },
  {
    id: "unsent-letter",
    title: "Write the unsent letter",
    description: "A private conversation with the part of you that keeps waiting.",
    prompt:
      "Write to the version of you who keeps waiting. You do not have to send it. You do have to be specific.",
    category: "growth",
    kind: "practice",
    timeframe: "An evening",
    waypoints: ["emotional-clarity"],
  },
  {
    id: "one-witness",
    title: "One goal, one witness",
    description: "A goal with a person beside it, not a scoreboard.",
    prompt:
      "Name a goal that matters this month. Ask one person to witness it with you. Weekly, briefly, without advice unless you ask.",
    category: "growth",
    kind: "same",
    timeframe: "This month",
    waypoints: ["emotional-clarity", "independence-lab"],
  },
  {
    id: "table-for-one",
    title: "A table with good light",
    description: "A meal out that is the plan, not the waiting room.",
    prompt:
      "Eat one meal out, alone, somewhere with kind light. Stay for the whole meal. Order the thing you want.",
    category: "wellbeing",
    kind: "practice",
    timeframe: "One meal",
    waypoints: ["solo-among-others"],
  },
  {
    id: "walk-no-podcast",
    title: "A walk with no soundtrack",
    description: "Let the day be slightly ordinary.",
    prompt:
      "Walk for thirty minutes without headphones. Let the day be slightly boring. See what shows up.",
    category: "wellbeing",
    kind: "practice",
    timeframe: "Thirty minutes",
    waypoints: ["emotional-clarity"],
  },
  {
    id: "phone-in-another-room",
    title: "An evening in another room from your phone",
    description: "Give one evening back to your hands.",
    prompt:
      "Put your phone in another room for one evening. Do something with your hands. Notice the shape of the time.",
    category: "wellbeing",
    kind: "practice",
    timeframe: "One evening",
    waypoints: ["independence-lab", "emotional-clarity"],
  },
  {
    id: "weekly-meals",
    title: "Create a weekly meal plan",
    description: "Five dinners decided before you are hungry and tired.",
    prompt:
      "Write five dinners you can actually cook. Note what you already have. Shop once. Cook the first one this week.",
    category: "practical-life",
    kind: "practice",
    timeframe: "This week",
    waypoints: ["independence-lab"],
  },
  {
    id: "household-repair",
    title: "Learn a basic household repair",
    description: "One small fix that makes the home yours to keep.",
    prompt:
      "Choose one simple repair: a loose handle, a dripping tap, a bulb, a wobbly chair. Learn the step, do the step, and keep the tool where you can find it.",
    category: "practical-life",
    kind: "practice",
    timeframe: "An afternoon",
    waypoints: ["independence-lab"],
  },
  {
    id: "refresh-home",
    title: "Refresh one area of your home",
    description: "A corner that has been waiting for a person to care for it.",
    prompt:
      "Pick one surface, shelf, or corner. Clear it, clean it, and put back only what belongs in the life you are living now.",
    category: "practical-life",
    kind: "practice",
    timeframe: "An afternoon",
    waypoints: ["independence-lab"],
  },
  {
    id: "budget-month",
    title: "Review your monthly finances",
    description: "A plain look at what comes in and what goes out.",
    prompt:
      "Set aside an hour. List this month's income and the bills that must be paid. Notice one number you want to change, and one that can stay.",
    category: "practical-life",
    kind: "practice",
    timeframe: "One hour",
    waypoints: ["independence-lab"],
  },
  {
    id: "sunday-reset",
    title: "Create a Sunday reset ritual",
    description: "A short sequence that makes Monday less of a surprise.",
    prompt:
      "Choose three tasks that take less than an hour together: a look at the week, a meal plan, and one surface in the home. Do them this Sunday, in the same order.",
    category: "practical-life",
    kind: "practice",
    timeframe: "Sunday",
    waypoints: ["independence-lab"],
  },
  {
    id: "old-friend",
    title: "Reach out to an old friend",
    description: "A specific note, sent before you talk yourself out of it.",
    prompt:
      "Write to one person you miss. Mention a real memory. Ask one simple question. Send it today.",
    category: "relationships",
    kind: "practice",
    timeframe: "Today",
    waypoints: ["solo-among-others"],
  },
  {
    id: "coffee-invite",
    title: "Invite someone for coffee",
    description: "An hour, a place, and a time. That is the whole invitation.",
    prompt:
      "Ask one person to meet you for coffee or a walk in the next two weeks. Offer two times. Let a no be information, not a verdict.",
    category: "relationships",
    kind: "practice",
    timeframe: "Two weeks",
    waypoints: ["solo-among-others"],
  },
  {
    id: "local-group",
    title: "Join a local group",
    description: "A room where you can show up more than once.",
    prompt:
      "Find one local group that meets in person: a class, a club, a volunteer shift, a walking group. Go once. Decide later whether you will go again.",
    category: "relationships",
    kind: "practice",
    timeframe: "This month",
    waypoints: ["solo-among-others"],
  },
  {
    id: "reconnect",
    title: "Reconnect with your community",
    description: "Return to a place where people already know your face.",
    prompt:
      "Go back to one place you have drifted from: a shop, a class, a neighbour, a faith community, a team. Say hello and stay long enough to be seen.",
    category: "relationships",
    kind: "practice",
    timeframe: "This week",
    waypoints: ["solo-among-others", "emotional-clarity"],
  },
];


export function getSeed(id: string) {
  return SEEDS.find((seed) => seed.id === id);
}

export function getWaypoint(idOrSlug: string) {
  return WAYPOINTS.find((waypoint) => waypoint.id === idOrSlug || waypoint.slug === idOrSlug);
}
