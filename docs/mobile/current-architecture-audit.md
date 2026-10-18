# Current architecture audit

Audit date: 18 October 2026.

This note is the record required before the mobile companion is treated as finished. It separates what was read in the current PHP source, what was observed on the public site, and what was not verified.

The specification that asked for this audit was cut off mid-sentence in section 25. Requirements after that cut are not treated as present.

## Sources

| Source | Status |
| --- | --- |
| `Solist-try/Go-solo-web`, branch `cursor/reading-map-ad4b`, commit `836453e` (18 Oct 2026, 06:13 UTC), folder `php/` | Current PHP application source. Read locally. Not modified by this audit. |
| Public site `https://gosolo.co.network` | Observed over HTTPS. Apache, `PHP/8.4.26`, session cookie `gosolo`. `INSTALL.md` is public, 7184 bytes, last-modified 18 Oct 2026 06:30 UTC, which matches that source. |
| `https://gosolo.co.network/api/v1` | Returns the website's HTML 404. No JSON API is deployed. |
| `config.php` on the server | Not read. Database password and the live database name for the public host are unverified. |
| Live SQL server | Not connected. Engine version, which `schema_updates` keys are applied, and row counts are unverified. |
| `host/` in this mobile repository | A proposed PHP doorway written for upload. It is not production until it is on the host and the SQL paste has been run. |
| `supabase/` in this mobile repository, and `main` of `Go-solo-web` where that branch is still Next.js | Historical. Do not install them. Do not point the app at them. |

`INSTALL.md` in the PHP source describes the steward trial host `steward.gosolo.co.network` and a database name used on that account. The public site that answers today is `gosolo.co.network`, with the same application shape. Whether those two hostnames share one database was not verified, because that fact lives only in server `config.php`.

No database password, signing secret, or live session identifier is copied here.

## How to read the labels

- **Production code:** in the PHP commit above, and exercised by the public site's HTML routes.
- **Production, but gated:** code that runs only after an additive SQL file has been pasted. The PHP checks for the table or column. Whether the live database has that paste is unverified.
- **Proposed, not deployed:** the mobile JSON doorway in this repository's `host/` folder.
- **Historical:** Supabase, Next.js, WordPress, BuddyPress. Not the running house.
- **Unverified:** stated only when the source or the public HTTP response did not prove it.

## 1. PHP version

The application refuses to boot below PHP 8.2 (`index.php`).

The public site reports `PHP/8.4.26`.

## 2. SQL engine and version

`sql/SCHEMA.md` and `sql/install.sql` specify MySQL or MariaDB, InnoDB, `utf8mb4` / `utf8mb4_unicode_ci`.

The live engine version was not queried. MySQL is not open on the public internet. `INSTALL.md` says imports happen in phpMyAdmin from inside the hosting account, with host `localhost` when the site and the database share an account.

## 3. Directory structure

Production tree inside `php/`:

- `index.php` — front controller
- `app/` — PHP functions (bootstrap, routes, auth, pages, desk, rooms, talk, life, pins, path, writing, copy, helpers). Not a public URL.
- `views/` — PHP templates, including `layout.php` and error pages
- `sql/` — `install.sql`, additive `update-*.sql`, `SCHEMA.md`
- `assets/css/site.css`, `assets/js/`
- `uploads/` — avatars, covers, reading images
- `config.example.php` — shape of `config.php`, which exists only on the server
- `.htaccess` — sends unknown paths to `index.php` and forbids `app/`, `sql/`, and `config.php`

There is no `composer.json`, no Node server, and no separate API framework in the production tree.

## 4. Application entry points

`index.php` checks the PHP version, then loads `app/bootstrap.php` and `app/routes.php`.

Bootstrap loads `config.php`, starts the session, loads helpers, writing, auth, and copy, then opens the database. A database failure renders `views/errors/database.php`. A missing `config.php` renders `views/errors/setup.php`.

## 5. Routing conventions

`dispatch()` in `app/routes.php` matches the request method and `request_path()` against `route_table()`.

Placeholders look like `{slug}` and `{id}`. Unmatched paths call `not_found()`.

Every POST route in that table runs `csrf_check()` before the handler. GET routes do not.

## 6. Controllers and request handlers

There is no controller class layer. Each route names a function: `page_*` for the public house, `room_*` for discussions, `desk_*` for the steward desk, `life_*`, `pin_*`, and `path_*` for the later rooms.

Handlers redirect and render. They are not JSON endpoints.

## 7. Models, repositories, and database helpers

There is no model or repository layer.

`app/helpers.php` provides `db()`, `q()`, `one()`, `exec_sql()`, and `count_of()` on a PDO MySQL connection. Queries use placeholders. Pages call those helpers directly, or call a function in `talk.php`, `life.php`, `rooms.php`, `path.php`, or `pin.php` that does.

## 8. Template and view system

`view()` renders a PHP file in `views/` inside `views/layout.php`. Copy comes from `site_text()`, which reads `app/defaults.json` and then the `settings` table. Steward edits in the desk override the defaults.

## 9. Authentication system

Accounts are rows in `users`. A member signs in with email and `password_hash`.

`attempt_login()` looks up the email, checks `password_verify`, refuses `suspended` and `banned`, regenerates the session id, and stores `user_id` in `$_SESSION`.

`current_user()` loads that id once per request and caches it. A status other than `active` clears the session.

The same `users` row is the account on the website. There is no second user table.

## 10. Session behavior

Session name: `gosolo`.

Cookie parameters set in bootstrap: 30 days, `HttpOnly`, `SameSite=Lax`, `Secure` when HTTPS is on. The public response matches that.

`current_user()` is static for the request. Anything that sets `user_id` after the first call does not refresh that cache. The website does not need to. A JSON doorway has to set the member before `touch_last_seen()` calls `current_user()`, or it will keep seeing nobody.

The website session cookie is the website credential. It is not, by itself, a mobile credential that should live in ordinary app storage.

## 11. Password hashing and reset

New passwords use `password_hash($password, PASSWORD_DEFAULT)`. The seed hash in `install.sql` is bcrypt. Minimum length on change is 8 characters. A change requires the current password (`page_account_save`).

Forgot-password calls `send_reset()`. It stores only `sha256` of a random token in `password_resets`, expires it after two hours, deletes older tokens for that user, and sends a link to `/reset?token=...`. Unknown emails get the same outward result: the function returns without sending. `INSTALL.md` says some hosts block `mail()`, and a steward can set a password from the desk if the letter never arrives.

Passwords are not migrated to another provider.

## 12. CSRF protection

Bootstrap stores a random `csrf` value in the session. Forms print it with `csrf_field()`. POST routes call `csrf_check()` and reject a mismatch with HTTP 419.

A mobile JSON client cannot reuse that form token as its long-lived credential. The proposed doorway does not accept the session cookie as API authorization.

## 13. Authorization and ownership

Pages call `require_user()` or check `current_user()`. Stewards use `require_steward()` (`admin` or `moderator`). A few desk actions use `require_admin()` and the founder role `admin` alone.

Ownership is checked in the handler that writes: a story update is limited to `user_id`, a conversation reply uses `talk_participant` and `talk_can_reply`, a block is per member. Hidden campfire posts, stories, and comments stay visible to the author and to a steward (`SCHEMA.md`).

Private conversation eligibility is `talk_public_state()` plus `talk_shared_context()`. The client does not get to declare that a context is valid. Sharing a waypoint is not a context. The first matching context in `talk_shared_context()` is the one the server uses.

## 14. Member roles

`users.role`: `member`, `moderator`, `admin`.

`users.status`: `active`, `suspended`, `banned`. Anyone who is not `active` is signed out.

## 15. Steward and admin

`is_steward()` is `admin` or `moderator`. The desk lives under `/steward` and is not a public route.

`admin` is the founder role. The last `admin` cannot delete their own account (`page_account_delete`). Moderators can use the desk. Some actions say only the founder can change them (`require_admin()`).

Steward-only tables include `moderator_notes` and `warnings`. Those notes are not a member API.

## 16. Current SQL tables

From `install.sql` and `SCHEMA.md`. Additive files create the same tables with `IF NOT EXISTS` for an older database.

People and garden: `users`, `profiles`, `password_resets`, `support_preferences`, `help_requests`, `help_offers`, `growing_seeds`, `planted_seeds`, `life_seasons`, `journey_hides`.

Community rooms: `waypoints`, `waypoint_members`, `waypoint_posts`, `waypoint_readings`, `seeds`, `campfire_posts`, `stories`, `comments`, `content_images`, `readings`, `reading_categories`.

Introductions and skills: `same_requests`, `same_matches`, `skill_offers`, `skill_requests`, `skill_links`, `skill_parts`, `outcomes`, `lifecycle_events`, `private_notes`.

Contact and care: `conversations`, `conversation_participants`, `conversation_messages`, `member_blocks`, `reports`, `notices`, `pin_hides`, `warnings`, `moderator_notes`, `contact_messages`, `activity`, `settings`, `schema_updates`.

`planted_seeds` in production is `(user_id, seed_id, created_at)` only. It has no status, goal, or reflection column. Status for a seed a member names lives on `growing_seeds`: `active`, `resting`, `grown`, `archived`.

`private_notes.context_type` is `same` or `skill`. There is no reading-note table and no "save for later" table.

There is no push-token table and no device-session table in the production schema.

## 17. Foreign keys and indexes

`install.sql` declares InnoDB primary keys, unique slugs and emails, and named foreign keys. `SCHEMA.md` describes the deletion behavior:

- Deleting a user cascades rows that belong to that person, including participant rows, notices, and journey hides.
- An introduction (`same_matches`) is removed if either person is deleted, because both user foreign keys are on that row.
- A conversation is removed if the person who opened it is deleted.
- `lifecycle_events.user_id`, seed `status_by`, skill `status_by`, introduction `closed_by`, conversation `closed_by`, and report `acted_by` use `ON DELETE SET NULL`.
- `pin_hides` go away with the member and with the post.
- `private_notes.context_id` is not a foreign key, because it can point at a match or a skill link.
- Conversation `context_id` is not a foreign key, for the same reason.

The live database's actual indexes were not dumped.

## 18. Migration and schema-update mechanism

There is no runtime migrator. The steward pastes a file in phpMyAdmin.

`install.sql` is for a new database and drops tables if imported again. Do not import it over a live house.

Additive files, each safe to paste twice, record a key in `schema_updates`:

| File | Key | What it adds |
| --- | --- | --- |
| `update-rooms.sql` | `rooms-2026-10-08` | Discussions, replies, `stories.body`, reading links, `content_images` |
| `update-content.sql` | `content-2026-10-08` | Per-waypoint sitting and discussion lines |
| `update-talk.sql` | `talk-2026-10-08`, `talk-choice-2026-10-08` | Conversations, blocks, communication choices |
| `update-life.sql` | `life-2026-10-08` | Skill and introduction lifecycles, seasons, outcomes, history |
| `update-pins.sql` | `pins-2026-10-08` | One pin per room, featured reading order, `pin_hides` |
| `update-feature.sql` | `feature-2026-10-18` | Optional featured reading on a waypoint |
| `update-path.sql` | `path-2026-10-09` | `conversations.expires_at`, `keep_chair`, skill consent |

PHP feature flags (`rooms_ready()`, `conversations_ready()`, `life_ready()`, `path_ready()`, `table_has_column()`) hide buttons until the matching table or column exists. Which of these keys are present on the live database was not verified.

`host/sql/update-api.sql` is **proposed**. It adds `api_tokens`, `api_attempts`, `conversation_messages.client_key`, and status, goal, and reflection columns on `planted_seeds`. Those columns are not in the production `install.sql`. Do not treat them as current schema.

## 19. Upload and image storage

`store_upload()` accepts one multipart image, at most 2 MB, and only if `getimagesize()` reports JPEG, PNG, WebP, or GIF. The file is stored under `uploads/{folder}/` with a random name. The database stores that path, not the original filename.

Folders used by the site include `avatars`, `covers`, and `reading`. `content_images` can attach a photograph to a post, story, or conversation. `uploads/.htaccess` refuses to execute PHP.

There is no object store and no Supabase bucket.

## 20. Rich-text sanitization

`sanitize_writing()` in `app/writing.php` keeps `p`, `br`, `strong`, `em`, `ul`, `ol`, `li`, `blockquote`, and `a`. Anything else is dropped. Empty writing is rejected. Length is capped at 20,000 characters before cleaning.

Plain text is wrapped into paragraphs. This is the production allow-list. A mobile composer should not invent a wider one.

## 21. Notification system

`notices` is an in-app line for one member: `body` (clipped to 255 characters), optional `href`, `read_at`. `notify()` inserts a row unless `life_notice_allowed()` refuses it.

`/notices` lists the latest 30 and marks them read.

There is no push provider, no device token, and no email notification fan-out in this code. Restrained notices are the production notification system.

## 22. Email delivery

Password reset uses PHP `mail()`. The subject and body come from `settings` (`email_reset_subject`, `email_reset_body`), with `{name}` and `{link}`. The From address is `founder_email` in settings, defaulting to the founder address in code.

No other mail provider appears in the PHP source.

## 23. Logging and error handling

Member-visible failures use `flash()` and a redirect, or a short HTML error page. SQL exceptions on boot show the database error view, not a stack trace.

`log_activity()` writes a short steward-facing line to `activity`.

There is no application log framework and no analytics SDK in the PHP tree. The proposed JSON doorway logs a one-line `error_log` and returns a fixed sentence. It must not return SQL text, paths, or exception messages. That rule is a requirement for the doorway, not a claim that every current HTML page was re-tested for it.

## 24. Steward-managed content registry

`settings.setting_key` / `setting_value` holds words, colours, image paths, and the reset-mail template. `site_text()` falls back to `app/defaults.json`.

The desk edits that registry at `/steward/content` and `/steward/settings`. Reading articles, waypoints, seeds, and pins are their own tables, edited from the desk, not from the phone.

The mobile app should merge those lines over its emergency copy. It should not ship a second authoritative wording store.

## 25. Privacy and visibility

Public pages include the home page, about, seeds, reading, waypoints, privacy, and terms.

Campfire, Out There, member gardens, conversations, and the desk require a signed-in member, as the routes call `require_user()` or equivalent.

`profiles.conversations_pref` is exactly `anyone`, `context`, or `none`. The visible sentences are "Anyone can start a conversation with me", "Only through shared context", and "No private conversations at this time". `none` is the stored value for the third sentence. `talk_public_state()` can return the word `paused` when the other person is not available. That is a computed state, not a fourth stored preference.

`conversations_held` is a steward hold. Separate pause flags exist for introductions, seed support, and skill interest.

`show_location` hides location on the garden. `grown_visibility` on a growing seed is `garden` or `private`.

Private conversation notes are for the two participants. A steward sees context after a report and opens the notes only with a recorded look (`SCHEMA.md`).

## 26. Reports, blocks, and moderation

`reports` stores `reporter_id`, `target_type`, `target_id`, `reason`, and `status` `pending`, `reviewed`, or `dismissed`. Targets include conversation. The desk acts at `/steward/reports`.

`member_blocks` is one direction: the blocker stops private contact with the blocked member. `talk_blocked()` treats a block in either direction as enough to refuse contact. A block overrides an introduction.

Campfire posts, stories, comments, and discussions use `hidden`. Stewards pin one welcome per room when the pins update is present. A member can set that welcome aside in `pin_hides`.

`warnings` are visible to the member. `moderator_notes` are desk-only.

## 27. Account deletion and export

`page_account_delete()` requires the POST field `confirm` to be the exact word `DELETE`. It refuses to remove the last `admin`. It then runs `DELETE FROM users` and logs out.

There is no export page and no grace period. `SCHEMA.md` is the description of what cascades and what is set null. Suspending a member keeps their rows.

The proposed doorway follows that same word and the same delete. An earlier mobile draft asked for the display name. That draft is superseded by this website rule.

## 28. Member features that the routes implement

Signed-out: home, about, contact, privacy, terms, seed shelf, Out There list and story, campfire list and post, waypoint list and chair, reading list and article, join, login, forgot password, reset.

Signed-in: profile and edit, another member's garden, plant or leave a shelf seed, growing-seed page, notes, conversation compose and thread, communication preference, taking space, season, trust pauses, unblock, introduction reply, skill-link reply, outcomes, hide a journey row, hide a pin, notices, account password, account delete.

Skill offers and requests are posted from the seed shelf. SAME requests are opened by a member. SAME matches are suggested by a steward. A temporary chair (`expires_at`, `keep_chair`) opens after both people accept a skill link or an introduction, when `update-path.sql` is present. That chair is a dated conversation. It is not a voice or video room.

## 29. Incomplete or placeholder behavior

These are real gaps in the current house, not missing mobile screens:

- A feature whose SQL file has not been pasted stays hidden. Live paste state is unverified.
- Password reset depends on PHP `mail()`.
- There is no JSON API on the public host.
- There is no saved-reading table, no private note on a Reading Room article, and no estimated reading time column.
- There is no push transport.
- `planted_seeds` cannot store a status or a reflection until a column exists. Growing seeds can.
- Skill listing status, when `update-life.sql` is present, moves only along `life_skill_transition()`: `open` to `paused`, `completed`, or `archived`; `paused` back to `open` or onward; `completed` to `open` or `archived`; `archived` back to `open`.
- Story rows with an empty `body` still render the older fields `what_i_did`, `expectations`, `what_happened`, and `would_do_again`. New stories use `body`.

The proposed doorway in `host/` covers sign-in, the shell, and many writes, and it is not deployed. It does not yet upload a phone photo through `store_upload()`, does not edit or delete a campfire post, does not change a skill listing along `life_skill_transition()`, and does not return Reading Room to Waypoint links. Those are gaps against the mobile companion spec, not proof that the website lacks the underlying tables.

## 30. Existing mobile-responsive behavior

`views/layout.php` sets `width=device-width`. `assets/css/site.css` uses one layout breakpoint, `min-width: 860px`, to widen the hero, cards, reading shelf, and steward desk. Below that width the site is a single column.

That is a responsive website. It is not the native companion.

## What the mobile repository must not treat as current

- `supabase/migrations/0004_mobile_doorway.sql` and any Supabase client. Historical.
- Next.js or Node as the community backend. Historical.
- WordPress, BuddyPress, WordPress users, and WordPress REST. Not in this PHP tree.
- A second member database, or SQL credentials inside the app.
- The proposed `api_tokens` and planted-seed columns, until `host/sql/update-api.sql` has been pasted on the live database.
- The assumption that every `schema_updates` key is already on the live server.

## Mobile companion, after this audit

The app remains the Expo codebase in this repository. It shares members, writing, and permissions only by calling the PHP house. The next API work has to follow the tables and functions named above, and it has to stay undeployed in conversation until the files are uploaded.

Sections of the companion spec after the cut in section 25 were not in the request, so they are not audited here and not implemented from guesswork.
