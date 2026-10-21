# Privacy

This describes the Go Solo mobile app as built. It is the note behind the in-app Privacy screen. It does not claim end-to-end encryption, anonymity, or zero data collection.

## Data

| Data | Purpose | Where it lives | Linked to the member | Retention |
| --- | --- | --- | --- | --- |
| Email, password, session | Sign in to the existing account | The PHP site checks the password. The device stores only the access and refresh tokens in the Keychain or Keystore. The database stores hashes of those tokens. | Yes | Tokens are revoked on sign-out and when the account is deleted. Refresh tokens expire after 30 days. |
| Profile, garden, seeds, posts, stories, skill swaps, SAME | The community itself | The same MySQL database as the website | Yes | Deleting the account runs `DELETE FROM users`. Rows that belong to that member go with the database cascades. An introduction is removed if either person deletes their account. A conversation is removed if the person who opened it deletes their account. |
| Conversations and temporary chairs | Private contact the member chose | Same database, readable by the two participants through the existing PHP rules | Yes | Removed with the member where the row is theirs. |
| Photos | Optional picture on a post, a story, a reply, or the garden | The website upload folder, after the server checks the file. The phone path is not stored. | Yes | The member can remove a photo they uploaded. Account deletion removes rows that belong to them. |
| Reading notes | A private reflection on a Reading Room article | `reading_notes`, readable only by that member | Yes | Cleared when the member empties the note, or when the account is deleted. |
| Push token | Not collected by this build | `push_devices` can hold a token if a later build sends one. This build does not request notification permission and does not send a token. In-app notices stay in `notices`. | No | — |
| Drafts | Recover an unsent note | On the device only | Yes | Deleted when the member signs out. |
| Last public copy | Keep the app understandable offline | On the device, without private messages | The cached garden is not stored with this copy | Replaced on the next successful refresh. |
| Product analytics | None by default | Not sent | No | The app does not include a third-party analytics or crash SDK. |

## Processors

The PHP site and its host store the community data and send password-reset letters with the website's existing mail. The app does not add another account system.

## Deletion

Account deletion asks the member to type DELETE, the same confirmation the website uses, then deletes that user on the server. It is immediate. There is no grace period and no export. See the Account screen for what shared rows may remain.

## Notifications

In-app notes stay short. They do not include a private message body or a seed title. This build does not register the phone for alerts, and it does not send them.

## Permissions

The camera is requested only when the member taps Take a photo. Choosing a photo uses the system picker and does not ask for the whole library first. The file is uploaded to the house, which checks it before keeping it. Notification permission is not requested.
