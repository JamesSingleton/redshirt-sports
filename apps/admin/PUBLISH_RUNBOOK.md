# Weekly Top 25 rankings publish

Publishing is manual from the admin **Rankings** desk.

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
- Publish and unpublish also expire the public web rankings cache tags. Admin needs `CACHE_REVALIDATE_SECRET` (same value as web; not the Sanity secret) and `NEXT_PUBLIC_SITE_URL` pointing at the live web host (e.g. `www.redshirtsports.xyz` — scheme optional). Falls back to `https://www.redshirtsports.com` if unset.
- Do not reassign ballots to or from a week that still has published rankings — unpublish first.
