export type ReadingCategory = {
  id: string;
  title: string;
  line: string;
  image?: string;
  imageAlt?: string;
};

export type Reading = {
  slug: string;
  category: string;
  title: string;
  standfirst: string;
  paragraphs: string[];
};

export const READING_CATEGORIES: ReadingCategory[] = [
  {
    id: "living-well",
    title: "Living Well",
    line: "A sustainable everyday life. The kitchen, the week, and a home that is actually used.",
    image: "/reading/reading-living-well.jpg",
    imageAlt: "A person cooking a simple meal beside unpacked groceries and a cup of tea.",
  },
  {
    id: "connection",
    title: "Connection",
    line: "Everyday human contact. A conversation, a meal, someone you see again.",
    image: "/reading/reading-connection.jpg",
    imageAlt: "Two people talking over coffee in a café.",
  },
  {
    id: "starting-over",
    title: "Starting Over",
    line: "Transitions and new beginnings. An unfinished room after a move, a marriage, or a life that no longer fits.",
    image: "/reading/reading-starting-over.jpg",
    imageAlt: "Half-unpacked boxes, keys on a windowsill, and a suitcase beside a bed.",
  },
  {
    id: "independent-living",
    title: "Independent Living",
    line: "Learning how to navigate a life on your own. Repairs, money, meals, and the next practical step.",
    image: "/reading/reading-independent-living.jpg",
    imageAlt: "A person fixing a wooden shelf in an apartment.",
  },
  {
    id: "out-there",
    title: "Out There",
    line: "Trips, tables, and the city you already live in.",
    image: "/reading/reading-out-there.jpg",
    imageAlt: "A person looking out a train window, with a bag on the seat.",
  },
  {
    id: "reflections",
    title: "Reflections",
    line: "Why a life gets postponed, and what makes it feel larger.",
  },
];

export const READINGS: Reading[] = [
  {
    slug: "creating-a-weekly-reset",
    category: "living-well",
    title: "Creating A Weekly Reset",
    standfirst: "A short sequence that makes the next seven days visible.",
    paragraphs: [
      "A weekly reset is not a new personality. It is a repeating hour that answers three questions: what must happen, what will I eat, and what in the home is in the way?",
      "Keep it small enough to finish. Look at the calendar. Choose five dinners. Clear one surface. If the hour runs long, the ritual will not survive a busy Sunday.",
      "Do it in the same order each week. The order is the point. You stop deciding how to begin, and you start the week already knowing the shape of it.",
    ],
  },
  {
    slug: "cooking-for-one-without-waste",
    category: "living-well",
    title: "Cooking For One Without Waste",
    standfirst: "A kitchen that feeds one person without throwing half of it away.",
    paragraphs: [
      "Cooking for one fails when every recipe assumes four plates. Buy ingredients that can cross meals: a roast chicken becomes soup, herbs go into eggs, rice becomes tomorrow's lunch.",
      "Plan five dinners, not a personality overhaul. Repeat two of them. A repeated meal is not a failure of imagination. It is how a single household stays fed.",
      "Keep a short list of meals you will actually cook on a tired night. Those are the meals that stop the expensive default. The interesting recipe can wait for a night when you have the hour.",
    ],
  },
  {
    slug: "managing-a-household-alone",
    category: "independent-living",
    title: "Managing A Household Alone",
    standfirst: "Every task in the home has one name on it. Yours.",
    paragraphs: [
      "Living alone means there is no one else to notice the bin, the bill, or the dripping tap. That is not a character flaw. It is a staffing problem with a staff of one.",
      "Split the house into a few repeating jobs rather than a constant sense of being behind. Bins. Laundry. Food. Bills. One repair. Put each job on a day you can actually keep.",
      "When something breaks, write down the next physical step: the part, the person to call, the afternoon it will happen. A household stays manageable when problems have a next action, not only a mood.",
    ],
  },
  {
    slug: "building-routines-that-stick",
    category: "independent-living",
    title: "Building Routines That Stick",
    standfirst: "A routine survives when it is attached to something you already do.",
    paragraphs: [
      "Most routines fail because they ask for a new life at 6 a.m. Attach the new action to a hinge you already have: the kettle, the walk to the door, the Sunday evening.",
      "Make the first version almost too small. A morning routine can be water, a window, and the bag by the door. If you miss a day, begin again the next day. A routine is a return, not a streak.",
      "Judge it after two weeks, not two mornings. The question is whether the week is kinder, not whether you felt inspired.",
    ],
  },
  {
    slug: "making-a-home-feel-like-yours",
    category: "living-well",
    title: "Making A Home Feel Like Yours",
    standfirst: "The room can tell the truth about the life that happens in it.",
    paragraphs: [
      "A home feels borrowed when it is arranged for a person you are waiting to become, or for guests who rarely come. Start with the chair you actually sit in and the light you use at night.",
      "Change one corner before you change the whole flat. A lamp, a table at the right height, a shelf that holds the things you use. The rest of the room can catch up.",
      "You do not need a style. You need a place that supports cooking, resting, working, and having one other person over. If a room does none of those, move one piece of furniture until it does.",
    ],
  },
  {
    slug: "organising-your-finances",
    category: "independent-living",
    title: "Organising Your Finances",
    standfirst: "A plain picture of money is a form of self-reliance.",
    paragraphs: [
      "Begin with one month, not a lifetime plan. Write what comes in. Write the bills that must leave. What remains is the money you can choose with.",
      "Name the accounts by their job: rent and bills, food, the rest. Automatic payments for the non-negotiables remove a weekly decision. The remaining money is easier to see when the essentials have already gone.",
      "Review it once a month, on a date you will remember. The review is not a verdict on your character. It is how a person living alone stays ahead of a surprise.",
    ],
  },
  {
    slug: "managing-decision-fatigue",
    category: "living-well",
    title: "Managing Decision Fatigue",
    standfirst: "A life of your own contains a surprising number of small decisions.",
    paragraphs: [
      "When you live alone, you choose the meal, the plan, the repair, and whether to go out. By evening, even a good choice can feel heavy. That weight is decision fatigue, and it is ordinary.",
      "Remove repeat decisions. A default breakfast. A weekly meal list. A Sunday look at the calendar. The point is not efficiency for its own sake. It is leaving enough attention for the choices that matter.",
      "When you are tired, choose the option you already prepared. A decided meal and a decided evening are a kindness you can give your future self.",
    ],
  },
  {
    slug: "how-adults-make-friends",
    category: "connection",
    title: "How Adults Make Friends",
    standfirst: "Adult friendship is mostly repeated contact with the same people.",
    paragraphs: [
      "Friendship after school rarely arrives as a revelation. It arrives because you were in the same room often enough to become familiar. A class, a volunteer shift, a walking group, a neighbour you keep greeting.",
      "One meeting is an introduction. The second meeting is where a person becomes specific. Invite someone again before you decide whether you are friends. Familiarity comes before closeness.",
      "You can be the one who suggests the next time. Adults are often waiting for someone else to do that. A simple invitation is not neediness. It is how a social life gets built.",
    ],
  },
  {
    slug: "reaching-out-without-feeling-awkward",
    category: "connection",
    title: "Reaching Out Without Feeling Awkward",
    standfirst: "A specific note is easier to answer than a perfect one.",
    paragraphs: [
      "Awkwardness grows in the gap between wanting to write and waiting for the right wording. Send a shorter message. Name a memory, ask one question, or offer one time to meet.",
      "You do not need a reason as large as a birthday. 'I thought of you when I walked past that bakery' is a complete reason. People are glad to be remembered in ordinary weeks.",
      "If they are slow to reply, leave the door open and go on with your week. A message is an invitation, not a test you can fail in public.",
    ],
  },
  {
    slug: "building-community-slowly",
    category: "connection",
    title: "Building Community Slowly",
    standfirst: "A community is a set of places you return to.",
    paragraphs: [
      "Community is not a crowd you join once. It is the cafe that knows your order, the class where people start to save you a seat, the neighbour you can ask for a tool.",
      "Pick one place and go back. The third visit is when faces become names. The sixth is when someone asks how you are and waits for the answer.",
      "You can belong in more than one small circle. A walking group and a neighbour and one old friend can be a whole social life. It does not have to look like a full calendar.",
    ],
  },
  {
    slug: "creating-meaningful-friendships",
    category: "connection",
    title: "Creating Meaningful Friendships",
    standfirst: "Meaning shows up when you tell the truth in small amounts.",
    paragraphs: [
      "A meaningful friendship is not a performance of having an interesting life. It is two people who know something true about each other's weeks.",
      "Share one real thing: a repair you are avoiding, a parent you miss, a meal you cooked, a plan you are nervous about. Then ask something that lets them do the same.",
      "Keep a rhythm. A monthly walk will do more than a dramatic reunion every two years. Meaning accumulates in the conversations you actually have.",
    ],
  },
  {
    slug: "staying-connected-while-living-alone",
    category: "connection",
    title: "Staying Connected While Living Alone",
    standfirst: "Solitude and contact can share a week.",
    paragraphs: [
      "Living alone does not require disappearing. It does require choosing contact, because nobody else is already in the kitchen.",
      "Decide, in advance, how you will stay in touch. One call on a weekday. One meal with someone. One message that is more than a reaction to a photo. Put them on the calendar the way you would put a bill.",
      "Connection can also be light. A neighbour, a regular class, a voice note. You do not have to host a dinner to remain a person among people.",
    ],
  },
  {
    slug: "life-after-divorce",
    category: "starting-over",
    title: "Life After Divorce",
    standfirst: "A household of one has practical work and a grief of its own.",
    paragraphs: [
      "After a divorce, the practical list and the emotional one arrive together. Keys, money, furniture, and the evening that used to have another person in it. Both lists are real. Handle one item from each, not the whole future.",
      "Rebuild the week before you rebuild an identity. Who cooks. Who the emergency contact is. Which evening has another human voice in it. A routine is a form of care while the larger story is still settling.",
      "You do not have to narrate the marriage in order to have a Tuesday. Tell a few trusted people the truth. With everyone else, you can simply be a person who lives here now.",
    ],
  },
  {
    slug: "moving-to-a-new-city",
    category: "starting-over",
    title: "Moving To A New City",
    standfirst: "A new city becomes yours through repeated errands, not a perfect first month.",
    paragraphs: [
      "The first weeks are administration: a bed, a shop, a doctor, a route to work or to the station. Do those before you judge whether you belong. Belonging is slow because the city does not know you yet.",
      "Learn one neighbourhood on foot. Find a grocery, a place to sit, and a walk you can repeat. Familiarity is the first form of home.",
      "Say yes to one recurring room: a class, a volunteer shift, a language exchange. One room, visited often, will introduce you to the city faster than a list of sights.",
    ],
  },
  {
    slug: "relocating-abroad",
    category: "starting-over",
    title: "Relocating Abroad",
    standfirst: "Another country asks for paperwork, patience, and a few people who know your name.",
    paragraphs: [
      "Start with the systems that keep you safe: registration, banking, a doctor, a way to get home at night. Adventure can wait until the ordinary machinery works.",
      "Learn the phrases that buy food, ask for help, and apologise. Use them badly. A life abroad gets larger each time you complete an errand in the local language.",
      "Find one person who will notice if you go quiet. A colleague, a neighbour, a class. Independence in a new country still needs a human thread back to the world.",
    ],
  },
  {
    slug: "starting-again-in-midlife",
    category: "starting-over",
    title: "Starting Again In Midlife",
    standfirst: "A later beginning can be practical. It does not have to look like a reinvention.",
    paragraphs: [
      "Midlife beginnings are often quieter than the story suggests. A flat of your own. A skill you can use. A friendship that is not inherited from an old life. These are substantial.",
      "Keep what still fits. A new chapter does not require throwing out every habit, friend, and object. Sort them. Some are ballast. Some are the reason the next year will work.",
      "Give the new life a weekly shape before you give it a meaning. Work, food, movement, one person. Meaning tends to arrive after the week has a floor.",
    ],
  },
  {
    slug: "rebuilding-a-social-circle",
    category: "starting-over",
    title: "Rebuilding A Social Circle",
    standfirst: "A circle is rebuilt one repeated person at a time.",
    paragraphs: [
      "After a move, a divorce, or a long retreat, the old circle may be far away or finished. Start with two kinds of people: someone from before who is still glad to hear from you, and someone new you can see in person.",
      "Be specific. 'We should get together sometime' dissolves. 'Thursday at the place near the station' can become a friendship.",
      "Expect it to be uneven. Some people will not write back. One person who does, and who you see again, is the beginning of a circle. You do not need twelve.",
    ],
  },
  {
    slug: "first-solo-trip",
    category: "out-there",
    title: "First Solo Trip",
    standfirst: "A first trip alone can be one night and a plan for dinner.",
    paragraphs: [
      "You do not need a month abroad to learn that you can travel alone. One night in a town you can get home from is a complete first trip. Book the bed. Know how you will eat. Leave a note with someone about where you are.",
      "Build a loose shape for the day: a walk, one place you want to see, and a meal. Leave the rest unscheduled. Solo travel feels larger when you are not performing an itinerary.",
      "The awkward parts are usually smaller than the weeks of waiting. A table for one. A train seat. An evening in a room that is not yours. You can do each of them once, and then you know the way.",
    ],
  },
  {
    slug: "restaurant-for-one",
    category: "out-there",
    title: "Restaurant For One",
    standfirst: "A meal out can be the plan, not a pause until someone else is free.",
    paragraphs: [
      "Choose a place where one person is ordinary: a counter, a small table, a lunch hour. Sit where you can see the room if that helps, or the window if you would rather not.",
      "Order the thing you want. Bring a book if you like having a companion object. You can also just eat. A meal does not need a second conversation to be finished.",
      "Stay for the course you ordered. Leaving early teaches your nerves that you were right to be uneasy. Staying teaches them that a table for one is a normal piece of furniture.",
    ],
  },
  {
    slug: "how-to-try-new-experiences",
    category: "out-there",
    title: "How To Try New Experiences",
    standfirst: "A new experience needs a date, a size, and a way home.",
    paragraphs: [
      "Pick something you can finish in one outing. A workshop, a museum, a class, a neighbourhood. If it requires a new personality, it will stay on the list.",
      "Decide the practical edges before you go: when it starts, what it costs, how you get back. Courage is easier when the logistics are already handled.",
      "Afterwards, tell the truth. What you expected. What happened. Whether you would do it again. That record is how a life of trying becomes knowledge, not a pile of almosts.",
    ],
  },
  {
    slug: "exploring-your-own-city",
    category: "out-there",
    title: "Exploring Your Own City",
    standfirst: "The city you live in still has streets you have never used.",
    paragraphs: [
      "Choose a neighbourhood you only pass through. Walk it for an hour. Find one place you could return to: a bakery, a gallery, a bench, a shop.",
      "Treat it as travel. Leave the usual route. Eat something there. The point is to become a visitor in a place that is already yours.",
      "Repeat one walk until it is familiar, then pick the next. A city opens by accumulation. You do not have to see all of it to stop living in a corridor between home and work.",
    ],
  },
  {
    slug: "travelling-without-waiting-for-company",
    category: "out-there",
    title: "Travelling Without Waiting For Company",
    standfirst: "Company can join a trip you have already begun.",
    paragraphs: [
      "Waiting for matching calendars can postpone a trip for years. Decide the smallest version you would still be glad you took, and book that. A weekend counts.",
      "Tell one person the dates, so someone knows you have gone. Then plan the trip for the person who is actually going: you. Meals, walks, and a pace you like.",
      "If a friend wants to come next time, there can be a next time because you know the way. The first trip does not have to be the shared one.",
    ],
  },
  {
    slug: "why-we-wait",
    category: "reflections",
    title: "Why We Wait",
    standfirst: "Waiting often looks like practicality. It is frequently a habit.",
    paragraphs: [
      "People wait for the right person, the right timing, a matching calendar, or a feeling of readiness. Each reason can be true for a particular plan. Together they can postpone a whole life.",
      "Ask of the thing you are delaying: what, exactly, is missing? If the answer is company, consider the version you can do alone. If the answer is money or skill, name the next practical step. If the answer is a feeling, the feeling may arrive after you begin.",
      "Waiting has a cost that does not show up on a calendar. It shows up as a list of days you meant to live. Beginning with one small action gives that list somewhere to go.",
    ],
  },
  {
    slug: "the-myth-of-the-right-time",
    category: "reflections",
    title: "The Myth Of The Right Time",
    standfirst: "The right time is often the week you stop arranging around it.",
    paragraphs: [
      "There is a useful right time: when the rent is paid, when you are well enough, when the train exists. There is also a mythical right time, in which every condition is comfortable and someone is free to come with you.",
      "The mythical version never quite arrives. A free evening, a small budget, and a plan that fits in one day are enough for most beginnings.",
      "Put the action on a real date. A plan without a date is still a wish. A date turns it into something you can do, postpone on purpose, or learn from.",
    ],
  },
  {
    slug: "independence-versus-isolation",
    category: "reflections",
    title: "Independence Versus Isolation",
    standfirst: "A life of your own can still have people in it.",
    paragraphs: [
      "Independence is the ability to keep a home, a week, and a set of choices. Isolation is the absence of contact. They are often spoken of as the same thing. They are not.",
      "You can cook for yourself and still have a friend for coffee. You can travel alone and still belong to a room you return to. The skill is knowing which parts of life you want to hold, and which parts you want to share.",
      "If the days have become only tasks and no voices, that is worth tending. A message, a class, a neighbour. Independence stays healthy when it includes a way back to other people.",
    ],
  },
  {
    slug: "permission-to-begin",
    category: "reflections",
    title: "Permission To Begin",
    standfirst: "You do not need a witness before you are allowed to try.",
    paragraphs: [
      "Permission is a habit dressed up as a practical concern. Who will I go with? What will people think? Is this the sort of thing a person does alone?",
      "Most of the time, the practical answer is ordinary. A class takes one. A kitchen works for one. A budget can be reviewed on a Sunday without an audience.",
      "You can still want company. Wanting it is different from waiting for it. Begin. If someone wants to come next time, there will be a next time because you already know the way.",
    ],
  },
  {
    slug: "what-makes-a-life-feel-bigger",
    category: "reflections",
    title: "What Makes A Life Feel Bigger",
    standfirst: "A larger life is not the same as a louder one.",
    paragraphs: [
      "A life feels bigger when it contains both reach and ground. A trip you took. A kitchen that works. A friend you called. A week you can see coming.",
      "Excitement is one kind of growth. Capability is another. The person who finally keeps a household routine has grown, just as the person who boards a train alone has grown.",
      "Ask of this month: what would make my actual days feel more intentional, more connected, more capable? The answer might be Poland. It might be Tuesday. Both count.",
    ],
  },
];

export function getReading(slug: string) {
  return READINGS.find((reading) => reading.slug === slug);
}

export function readingsIn(categoryId: string) {
  return READINGS.filter((reading) => reading.category === categoryId);
}
