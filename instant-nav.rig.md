# instant-nav rig: redshirt-sports web

- BUILD: `cd apps/web && EXPOSE_TESTING_API=1 pnpm build` (production `next build`, never `next dev`)
- EXPOSE: `process.env.EXPOSE_TESTING_API === '1'` sets `experimental.exposeTestingApiInProductionBuild` in `apps/web/next.config.ts`. It must be set for the build and again for `next start`, which re-reads the config. `playwright.config.ts` sets it on its own `webServer`. Real production builds leave the variable unset.
- RUN: `cd apps/web && pnpm exec playwright test e2e/` after the build (every `*.instant.spec.ts`). Playwright `webServer` runs `next start -H 127.0.0.1 -p 3005`. Override with `BASE_URL` only when a server is already serving that artifact, and start that server with `EXPOSE_TESTING_API=1`.
- TEST USER: public; no authentication. State: published Sanity content and the local rankings database used by `next build`.
- DRIFT: none known for the published homepage. Draft-mode cookies are not part of this contract.
- CONTRACTS: `/` initial load (`page.goto`). Shell markers: `data-testid="site-header"` and `data-testid="home-feed"`. Rankings links inside the header menu stream after the header paints. Rankings card (`/` and a football article, both initial load): `data-testid="rankings-widget-skeleton"` is in the shell, `data-testid="rankings-widget"` and any `[data-ad-slot]` are absent under the lock, and the card renders after release. Needs a published football poll in the local rankings database.
- LOOP: build with `EXPOSE_TESTING_API=1`, run the Playwright command, edit, repeat. Stop anything already bound to port 3005 before the run. Agent limits: do not deploy.
- LIVENESS: n/a; local build and start
- WALLS: Port 3000 is often the dev server, so this rig uses 3005. `next build` needs the app env (Sanity, database, Clerk). The flag is needed at build and at start: with either one missing the lock does not engage, and a test that only asserts the shell is present still passes. Assert that streamed content is absent under the lock so that case fails instead.
