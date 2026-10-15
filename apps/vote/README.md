# apps/vote

Invite-only voter app for `vote.redshirtsports.com`. Local dev serves it on **port 3002**. Web stays on 3000 and admin stays on 3001.

## Local Clerk sessions

`www`, `vote`, and `admin` share a Clerk session cookie on `redshirtsports.com` in production. Three localhost ports do not share cookies. Sign in again on each port against the Clerk **development** instance (`pk_test_` / `sk_test_`). `authorizedParties` includes `http://localhost:3000`, `:3001`, and `:3002`.

Set `NEXT_PUBLIC_VOTE_URL` to the origin this app is served from. Staff-only links and invite URLs read that variable. Do not hard-code the vote host in a page.

Voting pages that still live at `/vote` on www stay there until the legacy 301 ships with the move. This app does not add new voting surfaces to www.
