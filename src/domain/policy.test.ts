import assert from "node:assert/strict";
import test from "node:test";
import {
  bothAgreedToAnotherSession,
  continuationIsNeutral,
  decideContact,
  pushCopy,
  redactError,
  sameMessagingReady,
  seedAcceptsSupport,
} from "./policy.ts";

test("contextual contact requires a real shared context", () => {
  const denied = decideContact({
    viewerId: "a",
    targetId: "b",
    targetPreference: "contextual",
    targetTakingSpace: false,
    viewerBlockedTarget: false,
    targetBlockedViewer: false,
    contexts: [],
  });
  assert.equal(denied.allowed, false);

  const allowed = decideContact({
    viewerId: "a",
    targetId: "b",
    targetPreference: "contextual",
    targetTakingSpace: false,
    viewerBlockedTarget: false,
    targetBlockedViewer: false,
    contexts: ["seed-support"],
  });
  assert.equal(allowed.allowed, true);
});

test("sharing a waypoint is not enough to start a conversation", () => {
  const decision = decideContact({
    viewerId: "a",
    targetId: "b",
    targetPreference: "contextual",
    targetTakingSpace: false,
    viewerBlockedTarget: false,
    targetBlockedViewer: false,
    contexts: [],
  });
  assert.equal(decision.allowed, false);
});

test("a block overrides anyone", () => {
  const decision = decideContact({
    viewerId: "a",
    targetId: "b",
    targetPreference: "anyone",
    targetTakingSpace: false,
    viewerBlockedTarget: false,
    targetBlockedViewer: true,
    contexts: ["campfire"],
  });
  assert.equal(decision.allowed, false);
  assert.equal(decision.message.includes("blocked"), false);
});

test("none for now refuses private contact without calling it permanent", () => {
  const decision = decideContact({
    viewerId: "a",
    targetId: "b",
    targetPreference: "none",
    targetTakingSpace: false,
    viewerBlockedTarget: false,
    targetBlockedViewer: false,
    contexts: ["same"],
  });
  assert.equal(decision.allowed, false);
});

test("same introduction cannot message until both people consent", () => {
  assert.equal(sameMessagingReady(null, null), false);
  assert.equal(sameMessagingReady("accepted", null), false);
  assert.equal(sameMessagingReady("accepted", "declined"), false);
  assert.equal(sameMessagingReady("accepted", "accepted"), true);
});

test("a resting or completed seed does not take new support", () => {
  assert.equal(seedAcceptsSupport("active"), true);
  assert.equal(seedAcceptsSupport("resting"), false);
  assert.equal(seedAcceptsSupport("completed"), false);
});

test("another session happens only when both people agree", () => {
  assert.equal(bothAgreedToAnotherSession({ continuationA: true, continuationB: null }), false);
  assert.equal(bothAgreedToAnotherSession({ continuationA: true, continuationB: false }), false);
  assert.equal(bothAgreedToAnotherSession({ continuationA: true, continuationB: true }), true);
  assert.equal(continuationIsNeutral({ continuationA: true, continuationB: null }), true);
});

test("push text does not carry a message body or a seed title", () => {
  const copy = pushCopy("message");
  assert.equal(copy.body.includes("password"), false);
  assert.equal(JSON.stringify(pushCopy("seed")).toLowerCase().includes("seed title"), false);
  assert.equal(pushCopy("message").body.length < 80, true);
});

test("database failures stay private", () => {
  const hidden = redactError('relation "public.conversations" does not exist');
  assert.equal(hidden.code, "unavailable");
  assert.equal(hidden.message.toLowerCase().includes("relation"), false);
  assert.equal(hidden.message.toLowerCase().includes("conversations"), false);
  const password = redactError("password should be at least 8 characters");
  assert.equal(password.message.includes("at least 8"), true);
});
