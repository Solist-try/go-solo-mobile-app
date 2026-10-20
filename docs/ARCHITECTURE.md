# Architecture

The live Go Solo community is the PHP site and its MySQL database. The phone talks to that site over HTTPS. It does not run PHP, and it does not open a database connection.

## Request path

1. `POST /api/v1/session` checks the existing member email and password. The reply is a 15-minute access token and a 30-day refresh token. Only their SHA-256 hashes are stored, in `api_tokens`.
2. Later requests send `Authorization: Bearer` and the same value in `X-Go-Solo-Authorization`, because some shared hosts drop the Authorization header. The website session cookie is ignored.
3. `POST /api/v1/session/refresh` rotates the pair. Reusing a revoked refresh token revokes the whole family.
4. The API loads the same PHP functions the website uses for contact, blocks, chairs, and steward checks. A private conversation is allowed only when that code says the two members may talk. Sitting in the same waypoint is not enough.
5. Campfire posts and waypoint discussions have separate numeric ids, so the API prefixes them `c-` and `w-`.
6. A photo is uploaded as a file to `POST /api/v1/media`. The server uses the website's image check and stores its own path. A `file://` path is rejected. Publish sends that media id.
7. A reading note is private to the member, in `reading_notes`. `push_devices` can remember a phone later. This build does not ask for notification permission and does not send a token. Named reactions are not stored.

## Visibility

Public, including while signed out: steward-managed homepage copy, the seed catalog, waypoint descriptions, and the Reading Room.

Member-only: profiles, campfire, Out There, comments, gardens, skill swaps, SAME, notices, and conversations. Other members' email addresses are left off the payload.

## Copy

The API returns the steward-edited lines it can read from the website settings. The app merges those over the emergency copy and keeps the last good public copy on the device. Display labels do not change permission checks or status codes.

## What the app does not do

- No second member database.
- No direct SQL connection.
- No WebView of the website.
- No claim of end-to-end encryption.
- No popularity ranking, reaction totals, read receipts, or last-seen on screen.
- No separate session calendar. A temporary chair is the conversation's existing expiry, and both people keep it from that conversation.
