# Go Solo

Native iOS and Android doorway into the same Go Solo community as the website.

Go Solo, Not Alone.

## What this is

The current website (`Solist-try/Go-solo-web`) is a Next.js application on Supabase Auth, Postgres, and Storage. There is no PHP application in the organization. This app does not replace that backend and does not open a second database.

```
iOS app
        \
         HTTPS  ·  Supabase Auth + PostgREST + Storage
        /         (the same project and row-level security as the website)
Android app
```

The phone never receives database passwords. The publishable anon key identifies the project. Postgres row-level security, the SAME guard, and the policies in `supabase/migrations/0004_mobile_doorway.sql` decide what a member can read or write.

Sign-in uses the existing member account: a short-lived access token and a refresh token, kept in the iOS Keychain or Android Keystore (session storage on the web preview, cleared when the tab closes). Signing out revokes the refresh token on the server.

Without `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`, the app runs a clearly labeled on-device preview so the rooms can be walked. That preview is not the community.

## Shared rooms

Home, Campfire, Waypoints, Out There, My Garden, Seeds, Reading Room, Skill Swap, SAME introductions, Conversations, notifications, and a small steward desk. Words come from the website `site_content` row when it is available, with the same emergency copy the website ships.

Seed status codes stay `active`, `resting`, and `completed`. The screen may say Growing, On Hold, and Grown.

## Run

```bash
npm install
cp .env.example .env
npm run web
```

`npm run ios` needs macOS. `npm run android` needs an emulator or device. Store binaries are built with EAS (`eas.json`), not by committing `ios/` or `android/`.

## Database

On the existing Supabase project, run the website migrations first, then:

`supabase/migrations/0004_mobile_doorway.sql`

That file adds communication preferences, blocks, reports, conversations, seed support, and private session agreements. It does not rewrite the website tables. Until it is applied, those rooms stay closed instead of pretending a write succeeded.

## Checks

```bash
npm test
npm run typecheck
```
