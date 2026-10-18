# Go Solo

Native iOS and Android doorway into the same Go Solo community as the website.

Go Solo, Not Alone.

## What this is

The live website is the PHP application at [gosolo.co.network](https://gosolo.co.network). Members, writing, waypoints, and conversations already live in its MySQL database. This app is another door into that house. It does not open a second database, and the phone never connects to MySQL.

```
iOS app
        \
         HTTPS JSON  ·  /api/v1 on the existing PHP site
        /              (the same accounts, roles, and contact rules)
Android app
```

Sign-in uses the existing member account. The API returns a short-lived access token and a rotating refresh token. The app keeps those in the iOS Keychain or Android Keystore (session storage on the web preview, cleared when the tab closes). The website's `gosolo` session cookie is not the mobile credential.

Without `EXPO_PUBLIC_API_URL`, the app runs a clearly labeled on-device preview so the rooms can be walked. That preview is not the community. Leave the address blank until the PHP files below are uploaded. The live site does not serve `/api/v1` until then.

## Shared rooms

Home, Campfire, Waypoints, Out There, My Garden, Seeds, Reading Room, Skill Swap, SAME introductions, Conversations, notifications, and a small steward desk. Public words come from the website's steward copy, with the same emergency sentences the app ships.

Seed status codes stay `active`, `resting`, and `completed`. The screen may say Growing, On Hold, and Grown.

## Put the doorway on the website

The upload notes are in [host/README.md](host/README.md). In short: paste `host/sql/update-api.sql` in phpMyAdmin, then replace `public_html/app/api.php` and `public_html/app/bootstrap.php` with the copies in `host/app/`. Leave `config.php` where it is.

`supabase/migrations/0004_mobile_doorway.sql` is not the live database. Do not run it against the PHP site.

## Run

```bash
npm install
cp .env.example .env
npm run web
```

`npm run ios` needs macOS. `npm run android` needs an emulator or device. Store binaries are built with EAS (`eas.json`), not by committing `ios/` or `android/`.

## Checks

```bash
npm test
npm run typecheck
```
