# Capability audit

Inspected before this change. The PHP source is `Solist-try/Go-solo-web`, branch `cursor/reading-map-ad4b`, commit `836453e`. The mobile doorway is `host/app/api.php` in this repository. Names below are the ones in that code. Nothing here is inferred from a framework the house does not use.

## Image uploads

The website has one member upload pipeline.

- `upload_problem($field)` in `php/app/helpers.php` reads `$_FILES`. It rejects a PHP upload error, a file over `2_000_000` bytes, and anything `getimagesize` does not recognize as JPEG, PNG, WebP, or GIF. The messages are `msg_picture_failed` and `msg_picture_size`.
- `store_upload($field, $folder)` repeats those checks. The folder is chosen by the caller, never by the original filename. The stored name is `{folder}/` plus `bin2hex(random_bytes(8))` plus an extension taken from the image type, not from the client. The file is moved to `php/uploads/{folder}/`.
- `take_upload($field)` in `php/app/writing.php` calls both, and always stores in `covers`.
- `remember_image()` inserts `content_images`. `forget_upload()` deletes a file only when the path matches `/uploads/covers/{filename}`. `release_images()` deletes the rows and returns the paths. Story, campfire, and waypoint removal then call `forget_upload`.
- Profile photos are different. `page_profile_save()` in `php/app/site.php` uses `store_upload('avatar', 'avatars')` and writes `profiles.avatar_path`. Removing a photo sets that column to an empty string. The old file is left on disk.
- `php/uploads/.htaccess` refuses to execute `.php`, `.phtml`, and `.php[0-9]`. The folder is still under the public web root. Knowing the URL is enough to fetch the file. There is no per-request authorization on the file itself.
- There is no resize, no thumbnail column, no thumbnail file, and no EXIF strip. Orientation is whatever the camera wrote. `safe_media_path()` allows `/uploads/avatars/`, `/uploads/covers/`, `/uploads/reading/`, `/assets/images/`, and an `http(s)` URL up to 255 characters.

Callers that already accept a member photo:

| Place | Field | Folder | Row |
| --- | --- | --- | --- |
| Out There story | `image` | `covers` | `content_images` `parent_type = story`. `stories.image_path` is left empty when rooms are installed. |
| Campfire post | `image` | `covers` | `content_images` `parent_type = campfire` |
| Waypoint discussion | `image` | `covers` | `content_images` `parent_type = waypoint` |
| Reply | `image` | `covers` | `content_images` `parent_type = comment` |
| Conversation message | `image` | `covers` | `content_images` `parent_type = conversation`, only if that enum value exists |
| Garden photo | `avatar` | `avatars` | `profiles.avatar_path` |
| Reading Room covers | desk only | `reading` | `readings.image_path`, `reading_categories.image_path` |

`content_images` columns are `id`, `user_id`, `parent_type` (`story`, `campfire`, `waypoint`, `comment`, `conversation`), `parent_id`, `path`, `alt`, `created_at`. `parent_id` is not a foreign key. Ownership is `user_id`. There is no thumbnail column and no privacy column. A seed, a skill offer, and a skill request have no image column.

The mobile API, before this change, did not call `store_upload`. `POST /api/v1/campfire` and the story routes returned a validation error when `imageUrl` was present. The app stored nothing, including no `file://` path. That refusal was a missing doorway, not a rule of the website.

## Authentication and abuse limits

Website pages use `require_user()` and the PHP session. The mobile doorway does not trust that cookie. `api_prepare()` hashes the bearer token, finds an unexpired `api_tokens` row of kind `access`, and sets `$_SESSION['user_id']` for the existing user loader. Access tokens last 15 minutes. Refresh tokens last 30 days, rotate, and a reused refresh token revokes the family.

Sign-in failures are counted in `api_attempts` (8 in 15 minutes per email). There is no upload counter. CSRF on the website is the session plus same-site form posts. The API uses the bearer token instead of a CSRF cookie. Account standing still comes from `users.status`: `api_member()` only proceeds for a signed-in user, and the user loader already limits who counts as signed in.

## Notes

`private_notes` is not a reading notebook. `context_type` is `same` or `skill`. `page_notes()` inserts a row and notifies the other person. Re-using it for a Reading Room reflection would show that reflection to someone else.

`moderator_notes` are steward desk notes.

`readings` and `reading_categories` hold the articles. `waypoint_readings` links an article to a waypoint. There is no member reflection column and no saved-reading table.

The app was storing a reading note in AsyncStorage under `gosolo.reading-note.{userId}.{slug}` and saying the house could not keep it.

## Notifications

`notices` is the in-app tray: `user_id`, `body` (255), `href` (255), `read_at`, `created_at`. `notify()` inserts a row. `life_notice_allowed()` skips non-essential notices when `profiles.mute_notices` is set, and skips a conversation the member has muted or archived (`conversation_participants.muted`, `archived`).

The API already returns those notices and can mark them read at `POST /api/v1/notices/read`.

There is no device-token table, no APNs or FCM credential, and no push sender. `registerPushToken` on the phone returned “not on this house yet” and was not called from any screen. The app does not ask for notification permission.

## What was missing, and what stays a choice

Missing, and now added, because the website already had the behavior or the member-only data had nowhere to live:

- `POST /api/v1/media`, `GET /api/v1/media/{id}`, and `DELETE /api/v1/media/{id}` call the existing `upload_problem` and `store_upload` checks. `POST /api/v1/media/remove` does the same removal, because the rest of this doorway uses POST. Profile removal uses the id `avatar`.
- Campfire, waypoint discussions, stories, story edits, and replies take `mediaId` and attach the pending `content_images` row. They reject `imageUrl`, so a `file://`, `content://`, or `ph://` value cannot become the stored path.
- A profile photo uses the same upload and writes `profiles.avatar_path`.
- `reading_notes` is a new private table, one row per member per article. It is not `private_notes`.
- `push_devices` is a new table, with `POST /api/v1/devices` and `DELETE /api/v1/devices`. The app still does not request notification permission and does not send a token. Nothing is delivered until a sender exists.

Not added, on purpose:

- Seed images and skill images. Those tables have no image column.
- Conversation images. The website can store one, but the file is a public URL. Private delivery is not built, so the mobile doorway refuses that context.
- A thumbnail column. The website has nowhere to read one. When PHP GD is available, the API re-encodes JPEG, PNG, and WebP, corrects JPEG orientation, and limits the long side to 2000 pixels. GIF is kept after `getimagesize` says it is a GIF, because re-encoding would drop animation. If GD is missing, the validated original is stored, which is what the website already does.
- Phone alerts. Registering a token from a screen would collect a device identifier this house cannot use yet.

Security notes that remain true after the change:

- Uploaded files stay in the public `uploads` directory. The name is unguessable. It is not an access-control check. That matches the website.
- A pending photo uses `content_images.parent_id = 0` until publish. Rows still unattached after two days are removed for that member on a later upload.
- The extra pixel limit (8000 on a side, 24 million pixels) is stricter than `store_upload`. The byte limit is the same 2 MB.
