# Mobile audit

The website is the product. The phone is a companion. It reaches the same PHP application and the same SQL database. It does not get its own business rules.

Inspected website source: `Solist-try/Go-solo-web`, branch `cursor/reading-map-ad4b`, commit `836453e`, under `php/`. The mobile doorway in this repository is `host/app/api.php`. It is loaded by the site bootstrap and is meant to call the functions below. Where it writes SQL itself, that is named as a gap, not as a second design.

Website pages are listed in `route_table()` in `php/app/routes.php`. Every POST on the website runs `csrf_check()` against the session token from `csrf_field()`. The mobile doorway does not use that cookie. It authenticates with a bearer token, then sets `$_SESSION['user_id']` so `current_user()` can run.

## Current authentication flow

Accounts live in `users` (`email`, `password_hash`, `role`, `status`) and `profiles`.

- Join is `page_join()`. The name is clipped to 80 characters, the email must pass `valid_email()`, the password must be at least 8 characters, and the email must be unused. The password is stored with `password_hash()`. When conversations are installed, join also requires `conversations_pref` of `anyone`, `context`, or `none` and sets `conversations_choice_made`. The role is `member` and the status is `active`. The session id is regenerated and `$_SESSION['user_id']` is set.
- Sign-in is `attempt_login()`. Eight failures in the PHP session stop further tries. `password_verify()` checks `users.password_hash`. `suspended` returns the resting message. `banned` returns the closed message. A match regenerates the session and sets `last_seen_at`.
- `current_user()` loads the user and profile. If `status` is not `active`, the session is cleared. `require_user()` redirects to `/login`. `touch_last_seen()` updates `last_seen_at` at most every 15 minutes.
- Password recovery is `send_reset()`. It looks up an active user, stores `hash('sha256', $token)` in `password_resets` with a two-hour expiry, and sends the link with PHP `mail()`. `page_reset()` checks `reset_user_id()`, requires 8 characters, writes a new `password_hash`, and deletes that user's reset rows.
- Changing the password while signed in is `page_account_save()` with `action=password`. It requires `password_verify()` of the current password, then the same 8-character rule.
- Changing email is the same function with `action=email`, through `valid_email()` and a uniqueness check.
- Closing an account is `page_account_delete()`. The body must contain the exact word `DELETE`. The last `admin` cannot delete themselves. The row is removed with `DELETE FROM users`. Cascades remove the rows that point at that user.

The doorway already checks the same hash and the same status words in `api_login()`, calls `send_reset()` for recovery, and uses the same `DELETE` confirmation in `api_delete()`. It does not call `attempt_login()` or `page_join()`, because those functions write the website session and redirect. The check itself must stay `password_verify()` on `users.password_hash`. A second password store would be a second product.

Mobile sign-in adds `api_tokens` and `api_attempts` (`host/sql/update-api.sql`). Those tables are not in `php/sql/install.sql`. They hold hashes of access and refresh tokens. They are a credential for the phone, not a second account.

## Current upload system

One pipeline, in `php/app/helpers.php` and `php/app/writing.php`.

- `upload_problem($field)` reads `$_FILES`. It rejects a PHP upload error, a file over `2_000_000` bytes, and a file `getimagesize` does not recognize as JPEG, PNG, WebP, or GIF.
- `store_upload($field, $folder)` repeats those checks. The folder is chosen by the caller. The stored name is `{folder}/` plus 16 hex characters from `random_bytes` plus an extension taken from the image type. The original filename is not used. The file lands in `php/uploads/{folder}/`.
- `take_upload($field)` is the writing-room wrapper. It always stores in `covers`.
- `remember_image()` inserts `content_images`. `release_images()` deletes those rows. `forget_upload()` deletes a file only when the path matches `/uploads/covers/{name}`.
- `php/uploads/.htaccess` refuses to execute PHP. The directory is still on the public web root. The random name is not an access check.

The website does not resize, strip EXIF, or make a thumbnail.

The doorway's `POST /api/v1/media` calls `upload_problem()` and `store_upload()`. That is the right reuse. It must not grow a second validator. Conversation images stay off the phone: the website can store `content_images.parent_type = conversation`, but the file URL is public.

## Current Conversation system

Installed when `conversations_ready()` is true: the `conversations` table exists, and `profiles` has `conversations_pref`, `conversations_choice_made`, and `conversations.status`.

Tables: `conversations`, `conversation_participants`, `conversation_messages`, `member_blocks`. Context types on `conversations.context_type` are `seed`, `skill`, `introduction`, `waypoint`, `campfire`, `story`, and `member`. Status is `requested`, `open`, or `declined`. Participants have `archived`, `muted`, `served`, and `keep_chair`.

The rules that decide whether two people may talk:

- `talk_pref()` reads `profiles.conversations_pref` (`anyone`, `context`, or `none`). The default is `context`.
- `talk_blocked()` reads `member_blocks` in either direction.
- `talk_held()` reads `profiles.conversations_held`.
- `talk_public_state()` returns `none`, `paused`, or `ready`. `ready` requires an active other person, no block, neither person holding or set to `none`, no declined pair, and either their preference is `anyone` or it is `context` and a verified shared context exists.
- `talk_shared_context()` is the verified context. It looks, in order, at an active growing seed open to support, a help request, an open skill offer, an open skill request, a `same_matches` row in an introduction status, a `skill_links` row, then a campfire, story, or waypoint post the two people have both written on (`talk_latest_exchange()`). Sitting in the same waypoint is not a context.
- `talk_subject()` checks the caller is allowed to use that specific row, including `life_seed_accepts_support()` and `life_skill_accepts_interest()`.
- `page_talk_compose()` and `page_talk_start()` both require `talk_public_state() === 'ready'` and a non-empty opening note. `talk_create()` inserts the conversation as `requested`, both participants, and the opening message. A declined pair is not reopened.
- `talk_participant()` is the only read check. `talk_can_reply()` also requires status `open`, not closed, not expired (`path_expired()`), and neither person held or set to `none`.
- `life_talk_action()` mutes, archives, and closes. `path_keep_chair()` extends a temporary chair. `path_open_chair()` opens one when both people have consented to a skill link or an introduction.

`private_notes` is not a conversation and not a reading notebook. `page_notes()` inserts a note for a `same` or `skill` context and notifies the other person through `note_partner()`.

The doorway already calls `talk_shared_context()`, `talk_public_state()`, `talk_subject()`, `talk_create()`, `talk_load()`, `talk_participant()`, `talk_can_reply()`, `talk_messages()`, `life_talk_action()`, and `path_keep_chair()`. New conversation behavior has to go through those functions. Sharing a waypoint must not become a reason to message.

## Current Seed implementation

The catalog is `seeds` (`slug`, `title`, `description`, `prompt`, `kind`, `category`, `archived`). `kind` is `practice`, `same`, or `skill-swap`.

- A practice seed is planted with `page_seed_begin()`, which `INSERT IGNORE`s `planted_seeds`. It refuses `kind = same` and the skill-swap slug.
- A SAME seed is `page_seed_open()`. It inserts `same_requests` (`user_id`, `seed_id`, `note`, `status = open`) once. Matching is steward work: `desk_same_suggest()` and `desk_same_status()` write `same_matches`.
- Skill swap listings are `page_skill_post()` into `skill_offers` or `skill_requests` (`title`, `detail`, `archived`). When life tables exist, status changes go through `life_skill_post()` and `life_skill_transition()`. Interest opens a conversation through `talk_subject('skill', ...)`, not a new message table. Consent on `skill_links` calls `path_skill_post()`.
- A member's own seed, not from the catalog, is `growing_seeds` (`title`, `status`, `looking_for_support`, `grown_visibility`, `reflection`). Status is `active`, `resting`, `grown`, or `archived`. Legal moves are `life_seed_transition()`. Support is offered only when `life_seed_accepts_support()` is true: status `active`, `looking_for_support` set, and `pause_seed_support` off.
- What another person sees is `life_visible_seeds()` and `life_seed_public()`. Archived seeds stay hidden. A grown seed is public only when `grown_visibility` is `garden`. `journey_hides` can hide one seed, story, or waypoint from a garden.

`host/sql/update-api.sql` adds `goal`, `status`, and `reflection` on `planted_seeds`. Those columns are not in `php/sql/install.sql`. The website's planted row is only `user_id`, `seed_id`, and `created_at`. Phone features for a planted seed should not invent a second life cycle. The life cycle that exists is `growing_seeds` plus `life_seed_transition()`.

## Current Waypoint implementation

`waypoints` holds the steward-written room: `slug`, `title`, `description`, copy columns, `cover_path`, `featured_reading_id`, `archived`. Membership is `waypoint_members`. Discussion is `waypoint_posts`. A reading is linked only by `waypoint_readings` or `featured_reading_id`, which the steward saves in `desk_waypoint_readings()` and `desk_waypoint_save()`.

- `page_waypoint()` shows a room. An archived room is visible to a steward only.
- `sits_with()` is the membership check. `can_speak_here()` is steward or member. `room_discussion_save()` uses that before inserting a `waypoint_posts` row. Replies use `save_reply(..., 'waypoint', ...)`.
- Joining and leaving are `page_waypoint_join()` and `page_waypoint_leave()`.
- `life_visible_waypoints()` hides a waypoint the member has put in `journey_hides`.

The doorway's campfire-with-waypoint path already calls `sits_with()` before inserting `waypoint_posts`. It should keep using that check rather than a mobile-only membership rule. A discussion the phone starts is still a `waypoint_posts` row, not a campfire row with a different id space. The API prefixes ids `w-` and `c-` only in JSON, because the two tables both use numeric ids.

## Current Reading Room implementation

Public catalog. `page_reading()` lists `reading_categories` and `readings` with `status = published`. `page_reading_show()` loads one published article by `slug`. Featured articles are `readings.featured` and `featured_order`, maintained from the steward desk (`desk_pin_feature()`).

There is no member notebook on the website. `readings` has no note column. `private_notes` notifies another person and only accepts `same` or `skill`.

`reading_notes` in `host/sql/update-api.sql` is not a website table. It was added for the phone. It is not a business capability the website already had. Further reading-note behavior should not grow a second article store. Articles stay `readings`. Links to a waypoint stay `waypoint_readings` and `featured_reading_id`. The phone must not infer a waypoint from a category or a keyword.

## Current notification system

`notify()` inserts `notices` (`user_id`, `body` clipped to 255, `href` clipped to 255, `created_at`). `life_notice_allowed()` drops non-essential notices when `profiles.mute_notices` is set. Conversation, profile, steward, and account links still pass. A notice whose href is a conversation is also dropped when that participant row is `muted` or `archived`.

`page_notices()` lists the latest 30 and sets `read_at`. `notify_stewards()` writes the same table for every active admin and moderator. Reports call it.

There is no device token, no APNs, and no FCM in the website. `push_devices` in the mobile SQL file is not a website capability, and this app does not ask for notification permission. In-app notices are the notification system. New notice copy should go through `notify()`, so `life_notice_allowed()` still applies.

## Current Garden implementation

The garden is the profile, not a separate product area.

- `page_profile()` and `page_member()` render it. Another member's location is shown only when `profiles.show_location` is set. `author_visible()` hides a suspended or banned member from other people.
- `page_profile_save()` calls `save_garden()` and then the avatar upload. `save_garden()` writes `display_name`, `bio`, `location`, `contact_frequency`, `check_in_style`, and `show_location`. Frequency must be one of `frequency_choices()`. Style must be one of `style_choices()`. Supports are replaced in `support_preferences` from `support_choices()`. Help titles are replaced in `help_requests` and `help_offers` by `replace_titles()`.
- Personal seeds on the garden go through `page_growing()` or, when installed, `life_growing_post()`.
- `life_trust_lines()`, `life_season_label()`, and `life_public_outcomes()` decide what of season, trust, and outcomes another member can see. `show_trust` and `life_season_public` are the switches. Pauses are `pause_introductions`, `pause_seed_support`, and `pause_skill_interest`.

`api_profile()` updates the profile columns with its own SQL. It does not call `save_garden()`, so it does not apply `frequency_choices()`, `style_choices()`, or the support and help replacement. That is a parallel write. The next change to garden editing should call `save_garden()` or the same choice lists, not add a third set of frequencies.

## Current moderation implementation

Stewards are `users.role` of `admin` or `moderator`. `require_steward()` and `is_steward()` enforce it. `require_admin()` is the founder-only gate. The desk is the `/steward/...` routes in `route_table()`.

- Reports are `make_report()` into `reports`, then `notify_stewards()`. Resolution is `desk_report_action()`, `hide_reported()`, and `delete_reported()`.
- Hide, pin, and lock of stories, campfire posts, and comments are `content_flag()` and `desk_*_action()`. Pins also use `pin_set()` and `pin_hides` for a member hiding a welcome pin.
- Member status (`active`, `suspended`, `banned`) is `change_member_status()` from `desk_member_save()`. Deleting another member is `desk_member_delete()`.
- `warnings` and `moderator_notes` are desk records. Warnings are for the member. Moderator notes are not a member API.
- Conversation review on the desk is `desk_conversations()` and `desk_conversation()`. A steward does not get a normal participant row by being a steward.

`api_report()` inserts `reports` itself and does not call `make_report()`, so it does not notify stewards. `api_steward()` calls `pin_set()` for pin changes. Steward actions on the phone should keep calling `require_steward()`-class checks and the desk functions, not a smaller mobile role.

## Current account settings

Signed-in account page: `page_account()`, `page_account_save()`, `page_account_delete()`.

Communication preference: `page_talk_preference()` writes `profiles.conversations_pref`. Taking space: `life_space_post()` writes `conversations_held`. Season: `life_season_post()`. Trust pauses: `life_trust_post()`. Unblock: `page_talk_unblock()`.

Site-wide copy and the reset email live in `settings`, read by `setting()` and written from `desk_settings_save()`. Members do not edit that table.

The doorway's account delete matches the `DELETE` word and the last-admin rule. Password change matches the current-password check. Email change on the website is not a separate mobile product. If the phone changes an email, it should use the same `valid_email()` and uniqueness check as `page_account_save()`.

## Current SQL tables

From `php/sql/install.sql`. This is the house schema.

| Area | Tables |
| --- | --- |
| Account | `users`, `profiles`, `password_resets`, `settings`, `support_preferences` |
| Waypoints | `waypoints`, `waypoint_members`, `waypoint_posts`, `waypoint_readings` |
| Seeds and help | `seeds`, `planted_seeds`, `growing_seeds`, `help_requests`, `help_offers` |
| SAME | `same_requests`, `same_matches` |
| Skills | `skill_offers`, `skill_requests`, `skill_links`, `skill_parts` |
| Writing | `stories`, `campfire_posts`, `comments`, `content_images`, `pin_hides` |
| Reading | `reading_categories`, `readings` |
| Contact | `conversations`, `conversation_participants`, `conversation_messages`, `member_blocks`, `private_notes` |
| Care | `notices`, `reports`, `warnings`, `moderator_notes`, `contact_messages`, `activity` |
| Life | `life_seasons`, `outcomes`, `lifecycle_events`, `journey_hides` |
| Bookkeeping | `schema_updates` |

Not in that file, added only by `host/sql/update-api.sql` for the phone doorway: `api_tokens`, `api_attempts`, `reading_notes`, `push_devices`, plus `conversation_messages.client_key` and `planted_seeds.goal`, `status`, and `reflection`. Those are not a reason to invent matching website features. `reading_notes` and `push_devices` in particular are not existing business capabilities.

## Current image handling

| Use | Function | Stored |
| --- | --- | --- |
| Story, campfire, waypoint discussion, reply | `take_upload('image')` then `remember_image()` | `content_images` (`parent_type` `story`, `campfire`, `waypoint`, `comment`) in `/uploads/covers/` |
| Conversation message | same, only if the enum contains `conversation` | `content_images` in `/uploads/covers/` |
| Garden photo | `store_upload('avatar', 'avatars')` from `page_profile_save()` | `profiles.avatar_path`. Clearing it sets the column to `''` and leaves the old file |
| Reading cover | steward desk `store_upload('image', 'reading')` | `readings.image_path`, `reading_categories.image_path` |
| Waypoint cover | `desk_waypoint_save()` | `waypoints.cover_path` |
| Legacy story | `stories.image_path` | used when `rooms_ready()` is false. Current story save writes `content_images` and leaves `image_path` empty |

`safe_media_path()` allows `/uploads/avatars/`, `/uploads/covers/`, `/uploads/reading/`, `/assets/images/`, and an `http(s)` URL up to 255 characters. A `file://` path does not pass. Ownership of an attached image is `content_images.user_id`. Deleting a story, campfire post, or discussion releases the rows and unlinks covers paths.

Seeds, skill offers, and skill requests have no image column. Do not add phone-only image columns for them.

## Current permissions

- Guest: public pages, published reading, seed catalog, campfire and stories that are not hidden and whose author is `active`, waypoints that are not archived.
- Member: `require_user()`. Status must be `active`.
- Speak in a waypoint: `can_speak_here()` (member of `waypoint_members`, or steward).
- Edit or remove your post: `owns_writing()` (`user_id` matches). A steward also passes `can_moderate_writing()`.
- See a hidden post: `can_see_hidden()` (author or steward).
- See a hidden comment: `visible_comments()` (not hidden, or author, or steward, and the author is active or is you or you are a steward).
- Start a conversation: `talk_public_state() === 'ready'` and `talk_subject()` for that row.
- Read a conversation: `talk_participant()`.
- Steward desk: `require_steward()`. Some saves are `require_admin()`.
- Report: a signed-in member, through `make_report()`, with a non-empty reason and an allowed `target_type`.

`users.role` has no mobile-only value. Do not add one.

## Current visibility rules

- Hidden writing (`stories.hidden`, `campfire_posts.hidden`, `waypoint_posts.hidden`, `comments.hidden`) is author-or-steward.
- An archived waypoint is steward-only.
- A draft reading (`readings.status = draft`) is not on `page_reading_show()`.
- Another garden's location follows `profiles.show_location`.
- Another garden's seeds follow `life_visible_seeds()`.
- Another garden's stories and waypoints follow `life_visible_stories()` and `life_visible_waypoints()` (`journey_hides`).
- Season text follows `life_season_public`. Trust lines follow `show_trust`.
- Outcomes shown on a garden are `life_public_outcomes()`.
- Email is not part of another member's garden. `page_member()` does not print it.
- Conversation bodies are participant-only. A report puts the conversation on the steward desk through the desk routes, not through the public shell.
- Blocks remove the public conversation state in `talk_public_state()`.
- `mute_notices` and per-conversation `muted` change notices, not the existence of the message.

The phone shell must keep these filters. A signed-out payload can carry the public catalog and published reading. It should not carry conversations, notices, or other people's email.

## Current shared helper/services that should be reused

Call these. Do not re-code the rule beside them.

| Need | Use |
| --- | --- |
| Database | `db()`, `q()`, `one()`, `exec_sql()` |
| Signed-in member | `current_user()`, `require_user()` after the bearer token has set the session |
| Steward | `is_steward()`, `require_steward()`, `is_admin()` |
| Password | `password_verify()`, `password_hash()`, `send_reset()`, `reset_user_id()` |
| Text | `clip()`, `valid_email()`, `sanitize_writing()`, `post_text()` when the body is form-shaped |
| Upload | `upload_problem()`, `store_upload()`, `remember_image()`, `release_images()`, `forget_upload()`, `safe_media_path()` |
| Writing rooms | `rooms_ready()`, `sits_with()`, `can_speak_here()`, `save_reply()`, `author_visible()`, `can_see_hidden()`, `visible_comments()`, `owns_writing()` |
| Waypoint copy | `waypoint_line()`, `waypoint_sitting()` |
| Talk | `conversations_ready()`, `talk_public_state()`, `talk_shared_context()`, `talk_subject()`, `talk_create()`, `talk_participant()`, `talk_can_reply()`, `talk_messages()`, `talk_blocked()`, `life_talk_action()` |
| Chairs | `path_ready()`, `path_open_chair()`, `path_keep_chair()`, `path_expired()` |
| Seeds | `life_seed_transition()`, `life_seed_accepts_support()`, `life_visible_seeds()`, `life_skill_transition()`, `life_skill_accepts_interest()` |
| Garden | `save_garden()`, `frequency_choices()`, `style_choices()`, `support_choices()`, `user_supports()`, `life_trust_lines()`, `life_season_label()` |
| Notices | `notify()`, `life_notice_allowed()`, `notify_stewards()` |
| Reports | `make_report()` |
| Pins | `pin_set()`, `pin_hide_post()`, `pin_arrange()` |
| Copy | `setting()`, `site_text()` |
| Schema probes | `table_has_column()`, `column_type_has()`, `path_table()`, `rooms_ready()`, `life_ready()`, `conversations_ready()` |

Page functions that `redirect()` and read `$_POST` (`page_join()`, `room_story_save()`, `page_talk_start()`) are not services. The reusable piece is the function they call. If a rule exists only inside a page function, extract or call that rule. Do not copy it into `api.php` as a second version.

Known places the doorway already bypasses a helper, to be closed by calling the helper rather than by adding a new one:

- `api_profile()` does not call `save_garden()`.
- `api_report()` does not call `make_report()`, so stewards are not notified.
- `api_campfire()` and `api_story()` insert rows directly. They do call `sits_with()` and `sanitize_writing()`. Image attach must keep using `store_upload()`.
- `reading_notes` and `push_devices` are not website services.
