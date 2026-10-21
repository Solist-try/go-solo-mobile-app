import assert from "node:assert/strict";
import test from "node:test";
import { deviceLocalPath } from "./media.ts";

test("a phone path is not a stored photo", () => {
  assert.equal(deviceLocalPath("file:///tmp/photo.jpg"), true);
  assert.equal(deviceLocalPath("content://media/external/images/1"), true);
  assert.equal(deviceLocalPath("ph://asset-1"), true);
  assert.equal(deviceLocalPath("assets-library://asset/1"), true);
  assert.equal(deviceLocalPath("https://gosolo.co.network/uploads/covers/ab.jpg"), false);
  assert.equal(deviceLocalPath(""), false);
});
