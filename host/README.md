# Upload this doorway to the PHP site

The live house is the PHP site in `public_html`. These files extend that house. They do not replace `config.php`, and they do not create a second database.

The app stays in preview until this is uploaded and `EXPO_PUBLIC_API_URL` is set. `https://gosolo.co.network/api/v1` is not live until these steps are done.

## 1. Paste the SQL

In phpMyAdmin, select the site database and run `host/sql/update-api.sql`.

That adds `api_tokens`, `api_attempts`, an optional `client_key` on conversation messages, and status, goal, and reflection columns on planted seeds. A second paste is safe. It records `api-2026-10-18` in `schema_updates`.

Do not run `supabase/migrations/0004_mobile_doorway.sql`. That file is not this database.

## 2. Upload two PHP files

Replace these files on the host:

- `public_html/app/api.php`
- `public_html/app/bootstrap.php`

Use the copies in `host/app/`. Leave `config.php`, `index.php`, and the rest of `app/` as they are. `index.php` already loads `bootstrap.php`, and the new bootstrap answers `/api/v1` and then stops.

## 3. Point the app at the house

```bash
EXPO_PUBLIC_API_URL=https://gosolo.co.network
EXPO_PUBLIC_SITE_URL=https://gosolo.co.network
```

A signed-out `GET /api/v1` should return JSON with `"ok": true` and a public shell. `GET /api/v1/version` should say `"house": "php"`.

The phone sends the access token as `Authorization: Bearer` and again as `X-Go-Solo-Authorization`. If a correct password signs in and the next request says to sign in again, the host is dropping both headers. Add this above the other rewrite rules in `public_html/.htaccess`:

```apache
RewriteCond %{HTTP:Authorization} .
RewriteRule ^ - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
```

## What the doorway does

- Same member accounts. Password checks use the existing `users.password_hash`.
- Access tokens last 15 minutes. Refresh tokens last 30 days, rotate on use, and a reused refresh token revokes that family.
- Eight wrong passwords for one email in 15 minutes is enough. The counter is `api_attempts`.
- Contact, blocks, chairs, and steward actions call the PHP functions the website already uses.
- A phone photo is refused, with the draft left on the device. Add the picture on the website.
- Deleting an account requires the display name and then `DELETE FROM users`.
