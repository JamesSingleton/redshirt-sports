## 15. External links instead of a sports-data product

Redshirt does **not** ingest schedules, scores, standings, box scores or play-by-play. Building and licensing that stack is expensive and commodity. Hubs instead show curated **outbound links** to authoritative sources, and editorial coverage (recaps, previews, analysis) lives in Sanity articles.

### 15.1 What hubs show

| Hub | On-site | Outbound (editor-managed URLs on the Sanity doc) |
|---|---|---|
| Team | News, Redshirt poll history, bracket appearances, beat writers (`person` beats), next poll week teaser | Official athletics site, schedule, roster, stats, tickets, conference page |
| Conference | News, member teams, poll snapshot of conference teams | Conference standings, schedule, official site |
| Division / sport | News, rankings, bracket challenge CTAs | NCAA.com / CFP / relevant scoreboards |
| Article | Full body | Inline links as the writer chooses |

```ts
// Sanity school (excerpt)
defineField({
  name: "links", type: "object",
  fields: [
    defineField({ name: "officialSite", type: "url" }),
    defineField({ name: "scheduleUrl", type: "url", description: "Official schedule / scoreboard" }),
    defineField({ name: "rosterUrl", type: "url" }),
    defineField({ name: "statsUrl", type: "url" }),
    defineField({ name: "ticketsUrl", type: "url" }),
  ],
});
```

Render with `OutboundLinkCard` (opens in a new tab, `rel="noopener noreferrer"`, clear "Opens on {host}" label). Do not iframe third-party scoreboards.

### 15.2 What not to do

- Do not scrape ESPN unofficial JSON endpoints for production features.
- Do not add `games` / `players` tables "just in case" — they will rot unused. If a future product needs them, add them in a new major version with a full ingestion design.
- Do not block publishing an article because a schedule URL is missing; links are optional.

### 15.3 Optional later: manual "key dates" only

If editors want a tiny "this week" strip without a feed, add a Sanity object `keyDates[]` on the division hub (date, label, link). That is still editorial content, not a sports-data product.
