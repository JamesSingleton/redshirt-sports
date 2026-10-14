# Vote

Credentialed-voter app for `vote.redshirtsports.com`. Local dev is port **3002**. Web stays on 3000 and admin on 3001.

Localhost ports do not share Clerk cookies. Sign in on `http://localhost:3002/sign-in` with the Clerk development instance. Production sessions are shared across `www`, `vote.`, and `admin.` via `AUTHORIZED_PARTIES` in `@redshirt-sports/auth/authorized-parties`.

Milestone 0b is this shell: the routes from §17.7 and a shared button. The ballot editor, invites, and history are Milestone 5. Voting on www stays at `/vote` until that milestone, which also adds the legacy 301.
