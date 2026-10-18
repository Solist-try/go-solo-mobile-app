# Privacy

This describes the Go Solo mobile app as built. It is the note behind the in-app Privacy screen. It does not claim end-to-end encryption, anonymity, or zero data collection.

## Data

| Data | Purpose | Where it lives | Linked to the member | Retention |
| --- | --- | --- | --- | --- |
| Email, password, session | Sign in to the existing account | The PHP site checks the password. The device stores only the access and refresh tokens in the Keychain or Keystore. The database stores hashes of those tokens. | Yes | Tokens are revoked on sign-out and when the account is deleted. Refresh tokens expire after 30 days. |
| Profile, garden, seeds, posts, stories, skill swaps, SAME | The community itself | The same MySQL database as the website | Yes | Deleting the account runs `DELETE FROM users`. Rows that belong to that member go with the database cascades. A conversation opened by that member goes with them. An introduction can remain for the other person. |
| Conversations and temporary chairs | Private contact the member chose | Same database, readable by the two participants through the existing PHP rules | Yes | Removed with the member where the row is theirs. |
| Photos | Optional picture on the website | The website upload folder. The app does not upload a phone photo. | Yes | Removed with the website's own deletion of that file. |
| Push token | Not collected | The app does not store a push token. In-app notices stay in `notices`. | No | — |
| Drafts | Recover an unsent note | On the device only | Yes | Deleted when the member signs out. |
| Last public copy | Keep the app understandable offline | On the device, without private messages | The cached garden is not stored with this copy | Replaced on the next successful refresh. |
| Product analytics | None by default | Not sent | No | The app does not include a third-party analytics or crash SDK. |

## Processors

The PHP site and its host store the community data and send password-reset letters with the website's existing mail. The app does not add another account system.

## Deletion

Account deletion asks the member to type their display name, then deletes that user on the server. It is immediate. There is no grace period and no export. See the Account screen for what shared rows may remain.

## Notifications

In-app notes stay short. They do not include a private message body or a seed title. Phone push is not registered.

## Permissions

The camera and photo library are requested only when the member chooses a picture. That picture is not uploaded until the website can receive it. Notifications are not requested for a push token, because this house does not store one.
