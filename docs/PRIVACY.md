# Privacy

This describes the Go Solo mobile app as built. It is the note behind the in-app Privacy screen. It does not claim end-to-end encryption, anonymity, or zero data collection.

## Data

| Data | Purpose | Where it lives | Linked to the member | Retention |
| --- | --- | --- | --- | --- |
| Email, password, session | Sign in to the existing account | Supabase Auth. The device stores only the session in the Keychain or Keystore. | Yes | Until the member deletes the account or signs out. Sign-out revokes the refresh token. |
| Profile, garden, seeds, posts, stories, skill swaps, SAME | The community itself | The same Postgres database as the website | Yes | Removed with the account where the row is owned by that profile. Partner rows may remain with the person cleared. Steward moderation notes are not automatically erased. |
| Conversations and session times | Private contact the member chose | Same database, readable only by the two participants | Yes | Removed when the account is deleted, because those rows reference the profile. |
| Photos | Avatar, optional post image | Avatars use the public avatar bucket. Post photos use the private `member-media` bucket and a short-lived link. Conversation photos are not uploaded. | Yes | Removed with the owning record when the account goes. |
| Push token | Deliver a generic note | `push_tokens`, only if the member allows notifications | Yes | Until sign-out deletion of the account, or the member removes the token. |
| Drafts | Recover an unsent note | On the device only | Yes | Deleted when the member signs out. |
| Last public copy | Keep the app understandable offline | On the device, without private messages | The cached garden is the member's own | Replaced on the next successful refresh. |
| Product analytics | None by default | Not sent | No | The app does not include a third-party analytics or crash SDK. |

## Processors

Supabase hosts Auth, Postgres, Storage, and, if push is allowed, the Expo push token is registered with Expo's push service only after the member turns notifications on. Password-reset letters use the website's existing mail path.

## Deletion

Account deletion calls the database function `delete_own_account`. It is immediate. There is no grace period in the current schema. See the Account screen for what shared rows may remain.

## Notifications

Default push text is generic. It does not include a message body or a seed title. In-app notes use the same restraint.

## Permissions

The camera and photo library are requested only when the member chooses a picture. Notifications are requested only from Settings.
