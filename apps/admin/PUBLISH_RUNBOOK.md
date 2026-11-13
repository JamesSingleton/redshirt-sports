# Weekly Top 25 rankings publish

Regular-season weeks publish automatically at **9 AM Central every Monday** for polls with **Auto-publish** on (Polls page). Preseason, Final Rankings, and polls with Auto-publish off are published by hand from the admin **Rankings** desk.

## Auto-publish

- Web cron `/api/cron/rankings` (Vercel, Mondays 14:00 and 15:00 UTC; whichever is 9 AM Central publishes, the other no-ops). Needs `CRON_SECRET` on web, the same one the ratings cron uses.
- It publishes each auto-publish poll's current voting week once. A week that is already published or has no ballots is skipped.
- Turn Auto-publish off for a poll that stops before its sport does (FCS at the playoffs), before that Monday.
- The dashboard's Panel readiness rows (and the Polls page, under each switch) show what the next run will do: "Auto-publishes Week 10 · Mon, Nov 9, 9:00 AM CST", or why it won't (off, already published, Preseason/Final Rankings publish manually). Once the week due to publish is open for voting and still has no ballots, it turns into a red warning that the run will skip it.

## Missed ballots and lockout

- Every publish (manual or auto) records a miss for each assigned voter with no ballot that week.
- **3 unexcused misses in a season** removes the voter from that poll (shown as Locked out on the dashboard).
- On the dashboard's **Missed ballots** card: click a missed week to excuse it (with an optional note); excused weeks don't count. Excusing doesn't reinstate; use **Reinstate** for that. A reinstated voter stays on until their next miss.
- **Excuse ahead** (button on each poll's panel): when a voter tells you before the week publishes, pick them and one of the next three unpublished weeks. It shows as a dashed "(ahead)" chip, publishes as an excused miss, and disappears if they vote anyway. Click the chip to edit the note or **Remove excuse** until that week publishes.
- Unpublishing a week drops its unexcused misses (ballots reopen); re-publishing records them again and clears any voter whose ballot came in.

## Before voting week opens

1. Confirm seasons/weeks are loaded (Development loaders if needed).
2. Confirm schools are synced and Top 25 eligibility is set in Sanity.
3. On **Polls**, ensure the poll is active.
4. On **Voters**, confirm credentialed voters are assigned to the correct poll(s).

## After voting closes

1. Open **Rankings**.
2. Select poll → year → week.
3. **Preview**:
   - Check assigned vs submitted counts.
   - Nudge missing voters if needed.
   - Review tallied Top 25 + ORV.
4. **Publish** once.
5. Verify the public rankings page for that sport, division, year, and week.
6. Spot-check voter breakdown on that page.

## Notes

- Re-publishing replaces rankings for that poll and week.
- Prefer a single publish after the ballot window closes.
- Publishing locks voter ballot edits for that poll and week.
- **Unpublish** removes rankings rows only. Ballots stay. Voters can edit again only while that poll week is still the current **voting week** (and before you publish again). Unpublishing an older week does not reopen edits on the live voting week.
- Publish and unpublish also expire the public web rankings cache tags. Admin needs `CACHE_REVALIDATE_SECRET` (same value as web; not the Sanity secret) and `NEXT_PUBLIC_SITE_URL` pointing at the live web host (e.g. `www.redshirtsports.com` — scheme optional). Falls back to `https://www.redshirtsports.com` if unset.
- Do not reassign ballots to or from a week that still has published rankings — unpublish first.
