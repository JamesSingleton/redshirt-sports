import json, os, re, html
from layout import *
DATA = json.load(open(os.path.join(os.path.dirname(__file__), "teams_data.json")))
def _div(r):
    c = r.get("c") or {}; d = c.get("d")
    if d == "D1": return c.get("sub") or "D-I"
    return {"D2": "D-II", "D3": "D-III", "NAIA": "NAIA"}.get(d, "Unassigned")
ORDER = ["FBS", "FCS", "D-I", "D-II", "D-III", "NAIA", "Unassigned"]
LABEL = {"D-I": "D-I (no football)", "Unassigned": "No conference set"}
def _initials(s):
    w = [x for x in re.split(r"[\s\-]+", s) if x and x[0].isalpha() and x.lower() not in ("of", "the", "at")]
    return "".join(x[0] for x in w[:3]).upper()
def card_(r):
    e = html.escape; name = r.get("s") or r["n"]; nick = r.get("k") or ""; dv = _div(r)
    conf = (r.get("c") or {}).get("c") or "—"; sl = r["sl"]
    logo = (f'<img src="{e(r["img"])}?w=96&h=96&fit=max" alt="" width="48" height="48" loading="lazy" class="size-12 shrink-0 object-contain">'
            if r.get("img") else f'<span class="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-muted font-display text-sm font-bold text-muted-foreground" aria-hidden="true">{_initials(name)}</span>')
    hay = e(f'{r["n"]} {name} {nick} {conf}'.lower())
    return (f'<li data-team data-div="{dv}" data-q="{hay}"><a href="/college/teams/{e(sl)}" title="/college/teams/{e(sl)}" '
            f'class="group flex h-full items-center gap-3 rounded-xl border bg-card p-3 shadow-xs transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">'
            f'{logo}<span class="min-w-0 flex-1"><span class="block truncate font-semibold leading-tight group-hover:underline">{e(name)} <span class="font-normal text-muted-foreground">{e(nick)}</span></span>'
            f'<span class="mt-0.5 block truncate text-xs text-muted-foreground">{e(conf)} · {LABEL.get(dv, dv)}</span></span>'
            f'</a></li>')
def teams_page():
    rows = sorted(DATA, key=lambda r: (r.get("s") or r["n"]).lower())
    groups = {}
    for r in rows:
        L = (r.get("s") or r["n"])[0].upper(); groups.setdefault(L if L.isalpha() else "#", []).append(r)
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    jump = "".join((f'<li><a href="#letter-{L}" class="inline-flex size-8 items-center justify-center rounded-md text-sm font-semibold hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">{L}</a></li>' if L in groups
                    else f'<li><span class="inline-flex size-8 items-center justify-center rounded-md text-sm text-muted-foreground/40" aria-hidden="true">{L}</span></li>') for L in letters)
    secs = "".join(f'<section data-group aria-labelledby="letter-{L}" class="scroll-mt-24"><h2 id="letter-{L}" class="sticky top-14 z-10 -mx-1 mb-3 border-b bg-background/95 px-1 py-2 font-display text-2xl font-extrabold uppercase backdrop-blur lg:top-16">{L}</h2>'
                   f'<ul class="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,17rem),1fr))]">{"".join(card_(r) for r in rs)}</ul></section>' for L, rs in groups.items())
    counts = {d: sum(1 for r in rows if _div(r) == d) for d in ORDER}
    chip = lambda v, t, n, on=False: (f'<button type="button" data-filter="{v}" aria-pressed="{str(on).lower()}" class="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground">'
                                      f'{t}<span class="text-xs opacity-70 tabular-nums">{n}</span></button>')
    chips = chip("all", "All", len(rows), True) + "".join(chip(d, LABEL.get(d, d), counts[d]) for d in ORDER if counts[d])
    js = '''<script>(()=>{const q=document.getElementById("team-q"),items=[...document.querySelectorAll("[data-team]")],chips=[...document.querySelectorAll("[data-filter]")],out=document.getElementById("team-count"),none=document.getElementById("team-none");let f="all";
const run=()=>{const t=q.value.trim().toLowerCase();let n=0;items.forEach(li=>{const ok=(f==="all"||li.dataset.div===f)&&(!t||li.dataset.q.includes(t));li.hidden=!ok;if(ok)n++;});
document.querySelectorAll("[data-group]").forEach(s=>s.hidden=!s.querySelector("[data-team]:not([hidden])"));out.textContent=n+(n===1?" school":" schools");none.hidden=n>0;};
q.addEventListener("input",run);chips.forEach(c=>c.addEventListener("click",()=>{f=c.dataset.filter;chips.forEach(x=>x.setAttribute("aria-pressed",x===c));run();}));run();})();</script>'''
    body = f'''<!-- DATA SOURCE / INCLUSION RULE: a school is listed if it has EVER been ranked in our FBS or FCS Top 25 (app database)
 OR is mentioned in a published article (Sanity). This mockup only has the Sanity half: project 8pbt9f8w / dataset production
 (published perspective), read-only GROQ via MCP on 2026-10-19:
 *[_type=="school" && count(*[_type=="post" && references(^._id)]) > 0]  ({len(rows)} schools). The app must union in ranked schools from the DB.
 Conference = football conferenceAffiliation (else first); division = conference->division (D1 split into FBS/FCS via
 conference.sportSubdivisionAffiliations for football). Logos = school.image (Sanity CDN). -->
{header("")}
<a href="#teams-grid" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:shadow">Skip to teams</a>
<div class="border-b bg-gradient-to-b from-muted/60 to-background"><div class="mx-auto max-w-site px-4 pt-5 pb-6 lg:px-6">
 <nav aria-label="Breadcrumb"><ol class="flex items-center gap-1 text-xs text-muted-foreground"><li><a href="index.html" class="hover:text-foreground">Home</a></li><li aria-hidden="true">{icon("chev-right","size-3")}</li><li><a href="#" class="hover:text-foreground">College</a></li><li aria-hidden="true">{icon("chev-right","size-3")}</li><li><span aria-current="page" class="text-foreground">Teams</span></li></ol></nav>
 <h1 class="mt-3 font-display text-[2.4rem] font-extrabold uppercase leading-none lg:text-headline-lg">College Teams</h1>
 <p class="mt-2 max-w-2xl text-muted-foreground">Every school we've covered. Pick a team for its news and rankings across football and basketball.</p>
</div></div>
<main id="main" class="mx-auto min-w-0 max-w-site overflow-x-clip px-4 lg:px-6">
 <div class="sticky top-14 z-20 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur lg:top-16 lg:-mx-6 lg:px-6">
  <div class="flex min-w-0 flex-col gap-3 md:flex-row md:items-center">
   <div class="relative md:w-80"><label for="team-q" class="sr-only">Search schools</label><span class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">{icon("search")}</span>
    <input id="team-q" type="search" autocomplete="off" placeholder="Search schools, nicknames, conferences" class="border-input h-9 w-full rounded-md border bg-transparent pl-8 pr-3 text-sm shadow-xs placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"></div>
   <div role="group" aria-label="Filter by division" class="flex min-w-0 max-w-full gap-2 overflow-x-auto p-0.5 pb-1 md:pb-0.5">{chips}</div>
   <p class="text-sm text-muted-foreground md:ml-auto" aria-live="polite"><span id="team-count">{len(rows)} schools</span></p>
  </div>
  <nav aria-label="Jump to letter" class="mt-2 overflow-x-auto"><ul class="flex gap-0.5">{jump}</ul></nav>
 </div>
 <div id="teams-grid" class="grid gap-8 py-6">{secs}<p id="team-none" hidden class="rounded-xl border border-dashed p-8 text-center text-muted-foreground">No schools match. Try another name or clear the filter.</p></div>
</main>{footer()}{mobile_sheet()}{js}'''
    return page("College Teams", body, path="/college/teams")
