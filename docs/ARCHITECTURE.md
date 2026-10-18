# Architecture

The authoritative Go Solo community is the Next.js site and its Supabase Postgres database. Historical WordPress files are not the current system, and there is no PHP codebase to extend.

## Request path

1. The member signs in with Supabase Auth. Access tokens are short-lived. Refresh tokens are rotated by the Auth server and can be revoked with a global sign-out.
2. Reads and writes go through PostgREST over HTTPS. The app uses the anon key only.
3. Row-level security applies the same ownership rules as the website: a member updates their own profile, plants their own seeds, and cannot appoint a SAME partner. A steward match remains a steward action because of the existing database trigger.
4. New mobile tables, when migration `0004` is applied, add server checks the website did not need yet:
   - `can_contact` refuses a private conversation when either person has blocked the other, when the recipient is taking space, when they have chosen no private conversations at this time, or when contextual contact has no qualifying context.
   - Sharing a waypoint is not a qualifying context.
   - Messages are visible only to the two participants. Stewards do not get a general inbox.
   - Message and report inserts are rate-limited in the database.
   - Another private session is inserted only when both people agree.

## Visibility

Public, including while signed out: steward-managed homepage copy, the seed catalog, waypoint descriptions, and the Reading Room.

Member-only, because that is what the current policies allow: profiles, campfire, Out There, comments, gardens, skill swaps, SAME, notifications, and conversations.

The app strips other members' email addresses before they reach the screen. The current website policy still returns that column to any signed-in member. Tightening that without breaking the website's `select *` needs a follow-up on the web client.

## Copy

`site_content` id `site` is the same document the website edits. The app merges it over emergency fallbacks and caches the last good document on the device. Display labels do not change permission checks or status codes.

## What the app does not do

- No second member database.
- No direct SQL connection.
- No WebView of the website.
- No claim of end-to-end encryption.
- No popularity ranking, reaction totals, read receipts, or last-seen.
- No custom video service. A session, when enabled, is a time both people agreed to. They choose how to meet.
