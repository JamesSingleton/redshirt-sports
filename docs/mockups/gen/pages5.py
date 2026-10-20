"""v1.7 rankings + ballots mockups: Poll, Ballots (matrix, unfiltered), Ballots by voter,
Voters, History, Methodology. EXAMPLE DATA ONLY (22 example voters)."""
from layout import *
import ui
from pages2 import short, crumbs, path_tabs
from polldata import *

ui.ICONS.update({
 "download": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
 "grid": '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
 "chart": '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
 "book": '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
})

BASE = "/college/football/rankings/fcs"
WK = f"{BASE}/2026/week-7"
TABS = [("Poll", BASE), ("Ballots", f"{WK}/ballots"), ("Voters", f"{BASE}/voters"), ("History", f"{BASE}/history"), ("Methodology", "/college/football/rankings/methodology")]

def nm(t): return POOL[t][1]
def ab(t): return POOL[t][0]
def tm(t, cls="size-6 text-[7px]"): return team_mark(ab(t), cls)

def poll_head(active, title, crumb, meta, actions=None):
    acts = actions if actions is not None else f'{select_("2026")}{select_("Week 7")}{button("","outline","icon","share",attrs=chr(97)+"ria-label=\"Share\"")}'
    return f'''<div class="pt-5">{crumbs(crumb)}
<div class="mt-3 flex flex-wrap items-end justify-between gap-4"><div><div class="kicker text-primary">Redshirt Sports Poll · FCS</div>
<h1 class="font-display text-[2.3rem] font-extrabold uppercase leading-none lg:text-headline-lg">{title}</h1>
<p class="mt-2 text-sm text-muted-foreground">{meta}</p></div>
<div class="flex flex-wrap items-center gap-2">{acts}</div></div></div>
{path_tabs(TABS, active, "mt-5")}'''

def seg(items, active):
    """Segmented links (shadcn Tabs look, but each item is a real URL)."""
    out = "".join(f'<a href="{h}" title="{h}" class="inline-flex h-[calc(100%-1px)] items-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap {"bg-background text-foreground shadow-sm dark:bg-input/30" if i==active else "text-muted-foreground hover:text-foreground"}">{icon(ic,"size-3.5")}{t}</a>' for i, (t, h, ic) in enumerate(items))
    return f'<nav class="bg-muted inline-flex h-9 w-fit items-center rounded-lg p-[3px]" aria-label="Ballot views">{out}</nav>'

BVIEWS = [("All ballots", f"{WK}/ballots", "grid"), ("By voter", f"{WK}/ballots/by-voter", "users")]

def diff_chip(d, rv=False):
    if rv: return '<span class="inline-flex min-w-9 justify-center rounded px-1 text-[10px] font-bold text-new bg-new/10">RV</span>'
    if d == 0: return '<span class="inline-flex min-w-9 justify-center rounded px-1 text-[10px] font-semibold text-muted-foreground">=</span>'
    c = "text-up bg-up/10" if d > 0 else "text-down bg-down/10"
    return f'<span class="inline-flex min-w-9 justify-center rounded px-1 text-[10px] font-bold tabular {c}" aria-label="{abs(d)} spots {"above" if d>0 else "below"} consensus">{"+" if d>0 else "−"}{abs(d)}</span>'

def ballots_cta(compact=False):
    faces = "".join(f'<span class="-ml-2 first:ml-0 rounded-full ring-2 ring-card">{avatar(VOTERS[i]["ini"],"size-8")}</span>' for i in range(6))
    if compact:
        return f'''<a href="{WK}/ballots" class="flex items-center gap-3 rounded-xl border border-primary/30 bg-accent/50 p-3"><span class="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">{icon("grid","size-5")}</span>
<span class="flex-1"><span class="block font-display text-lg font-bold uppercase leading-tight">See all {N} ballots</span><span class="block text-xs text-muted-foreground">Every voter's full Top 25, outliers flagged</span></span>{icon("chev-right","size-5 text-primary")}</a>'''
    return card(f'''<div class="grid gap-4 p-5"><div class="flex items-center gap-2"><span class="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">{icon("grid","size-5")}</span><div><div class="kicker text-primary">Ballot transparency</div><div class="font-display text-2xl font-extrabold uppercase leading-none">See all {N} ballots</div></div></div>
<p class="text-sm text-muted-foreground">Every voter's full Top 25 for Week 7, side by side, with outlier picks flagged. Published with the poll, never before.</p>
<div class="flex items-center gap-3">{faces}<span class="text-xs text-muted-foreground">+{N-6} more voters</span></div>
<a href="{WK}/ballots" class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90">Open the full ballot breakdown {icon("chev-right")}</a>
<div class="flex items-center justify-between text-xs"><a href="{WK}/ballots/by-voter" class="font-medium text-primary hover:underline">Browse by voter</a><a href="#" class="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">{icon("download","size-3.5")}CSV + hash</a></div></div>''', "border-primary/30 bg-accent/30 gap-0")

# ------------------------------------------------------------------ Poll tab
def rankings():
    rows = ""
    for t in TOP:
        r = NOW["rank"][t]; prev = prev_rank(t); on = NOW["on"][t]; f = NOW["fpv"][t]
        rows += f'''<tr class="border-b transition-colors hover:bg-muted/50 {"bg-accent/30" if t==1 and not PHASE1 else ""}">
<td class="p-2 pl-4 text-right font-display text-xl font-bold tabular">{r}</td><td class="p-2 w-12">{movement(move(t))}</td>
<td class="p-2"><div class="flex items-center gap-3">{team_mark(ab(t),"size-8")}<div><a href="#" class="font-semibold hover:underline">{nm(t)}</a> <span class="text-xs text-muted-foreground">{f"({f})" if f else ""}</span><div class="text-xs text-muted-foreground sm:hidden">{POOL[t][3]} · {POOL[t][2]}</div><div class="text-xs text-muted-foreground lg:hidden">On {on} of {N} ballots</div></div>{badge(icon("star","size-3")+"Following","outline","ml-1 hidden text-primary border-primary/40 lg:inline-flex") if t==1 and not PHASE1 else ""}</div></td>
<td class="hidden p-2 text-muted-foreground sm:table-cell">{POOL[t][3]}</td><td class="hidden p-2 text-muted-foreground md:table-cell">{POOL[t][2]}</td>
<td class="p-2 text-right font-semibold tabular">{NOW["pts"][t]:,}</td><td class="hidden p-2 text-right text-muted-foreground tabular md:table-cell">{prev or "—"}</td>
<td class="hidden p-2 pr-4 lg:table-cell"><div class="flex items-center justify-end gap-2"><span class="text-xs tabular {"font-semibold" if on==N else "text-muted-foreground"}">On {on} of {N}</span><div class="flex h-1.5 w-16 overflow-hidden rounded-full bg-muted"><div class="{"bg-chart-2" if on==N else "bg-chart-2/60"}" style="width:{on/N*100:.0f}%"></div></div></div></td></tr>'''
    table = f'''<div data-slot="table-container" class="relative w-full overflow-x-auto rounded-xl border bg-card"><table data-slot="table" class="w-full caption-bottom text-sm">
<caption class="px-4 py-3 text-left text-xs text-muted-foreground">Example data. {N} voters × 25-to-1 points (max {N*25}). First-place votes in parentheses. <b class="font-semibold text-foreground">On X of {N} ballots</b> = how many voters ranked the team anywhere from 1 to 25 this week. <a href="{TABS[4][1]}" class="text-primary hover:underline">How it works</a></caption>
<thead class="[&_tr]:border-b"><tr class="text-left text-xs uppercase tracking-wide text-muted-foreground"><th class="h-10 p-2 pl-4 text-right">Rk</th><th class="p-2">±</th><th class="p-2">Team</th><th class="hidden p-2 sm:table-cell">Record</th><th class="hidden p-2 md:table-cell">Conf</th><th class="p-2 text-right">Pts</th><th class="hidden p-2 text-right md:table-cell">Prev</th><th class="hidden p-2 pr-4 text-right lg:table-cell" title="Number of the {N} ballots that ranked this team">On ballots</th></tr></thead>
<tbody>{rows}</tbody></table></div>'''
    li = lambda inner: f'<li class="flex items-center gap-2 border-b py-2 text-sm last:border-0">{inner}</li>'
    orv = card(card_header("Others receiving votes", "Points > 0, outside the Top 25") + card_content("<ul>" + "".join(li(f'{tm(t)}<span class="flex-1 truncate font-medium">{nm(t)}</span><span class="text-xs text-muted-foreground tabular">on {NOW["on"][t]} of {N}</span><span class="w-12 text-right font-semibold tabular">{NOW["pts"][t]} pts</span>') for t in ORV) + "</ul>", "pb-4 pt-2"), "gap-0")
    def now_txt(t):
        return f'<span class="block text-xs text-muted-foreground">This week: receiving votes · {NOW["pts"][t]} pts</span>' if NOW["pts"][t] else '<span class="block text-xs text-muted-foreground">This week: no votes</span>'
    drop = card(card_header("Dropped out of the Top 25", "Ranked in Week 6, not in Week 7") + card_content("<ul>" + "".join(li(f'{tm(t)}<span class="min-w-0 flex-1"><span class="block truncate font-medium">{nm(t)}</span>{now_txt(t)}</span><span class="text-right"><span class="block text-[10px] uppercase tracking-wide text-muted-foreground">Last week</span><b class="font-display text-lg tabular">No. {PREV["rank"][t]}</b></span>') for t in DROPPED) + "</ul>", "pb-4 pt-2"), "gap-0")
    def last_txt(t):
        r = PREV["rank"][t]
        return f'<b class="font-display text-lg tabular">No. {r}</b>' if r <= 25 else f'<b class="text-sm tabular">RV · {PREV["pts"][t]} pts</b>'
    gone = card(card_header("No longer receiving votes", "Had points in Week 6, none in Week 7") + card_content("<ul>" + "".join(li(f'{tm(t)}<span class="min-w-0 flex-1"><span class="block truncate font-medium">{nm(t)}</span><span class="block text-xs text-muted-foreground">This week: 0 points</span></span><span class="text-right"><span class="block text-[10px] uppercase tracking-wide text-muted-foreground">Last week</span>{last_txt(t)}</span>') for t in NO_LONGER) + "</ul>", "pb-4 pt-2"), "gap-0")
    mv = sorted(TOP, key=lambda t: -abs(move(t) or 0))[:5]
    movers = card(card_header("Biggest movers","Week 7 vs Week 6 (example)") + card_content("".join(f'<div class="flex items-center gap-2 border-b py-2 text-sm last:border-0">{tm(t)}<span class="flex-1 truncate font-medium">{nm(t)}</span>{movement(move(t))}</div>' for t in mv),"pb-4 pt-2"),"gap-0")
    notify = card(card_content(f'<div class="flex items-center gap-3"><span class="flex size-9 items-center justify-center rounded-full bg-accent text-primary">{icon("bell")}</span><div class="flex-1 text-sm"><div class="font-semibold">Poll release alerts</div><div class="text-muted-foreground">Email or push when the FCS Top 25 publishes</div></div>{switch(False)}</div>',"py-4"))
    head = poll_head(0, 'FCS Top 25 <span class="text-muted-foreground">· Week 7</span>', ["College","Football","Rankings","FCS"],
        f'Released Oct 13, 2026 · {N} voters · {N} ballots counted · <a href="{TABS[4][1]}" class="text-primary underline-offset-2 hover:underline">Methodology</a> · Example data',
        f'{select_("2026")}{select_("Week 7")}{button("","outline","icon","share",attrs=chr(97)+"ria-label=\"Share\"")}{"" if PHASE1 else button("Notify me","default","default","bell")}')
    body = f'''{ticker()}{header()}
<main class="mx-auto max-w-site px-4 lg:px-6">{head}
 <div class="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_340px]">
  <div class="grid content-start gap-4"><div class="lg:hidden">{ballots_cta(True)}</div>{table}
   <div class="flex flex-wrap gap-4 text-xs text-muted-foreground"><span class="flex items-center gap-1">{movement(2)} moved up</span><span class="flex items-center gap-1">{movement(-2)} moved down</span><span class="flex items-center gap-1">{movement(None)} newly ranked</span><span class="flex items-center gap-1">{movement(0)} unchanged</span></div>
   </div>
  <aside class="grid content-start gap-6"><div class="hidden lg:block">{ballots_cta()}</div>{movers}{"" if PHASE1 else notify}{ad(300,250)}</aside>
 </div>
 <section class="pt-8" aria-label="Beyond the Top 25"><h2 class="font-display text-2xl font-extrabold uppercase">Beyond the Top 25</h2><div class="mt-3 grid gap-4 md:grid-cols-3">{orv}{drop}{gone}</div></section>
</main>{footer()}{bottom_nav(1)}'''
    return page("FCS Top 25", body, path=BASE)

# ------------------------------------------------------------------ Ballots: matrix (default, unfiltered)
def tone(r):
    if r is None: return "text-muted-foreground/50"
    if r <= 5: return "bg-primary/85 text-primary-foreground font-bold"
    if r <= 10: return "bg-primary/55 text-primary-foreground font-semibold"
    if r <= 15: return "bg-primary/30 font-semibold"
    if r <= 20: return "bg-primary/15"
    return "bg-primary/7"

def ballots_page():
    rk = [{t: k+1 for k, t in enumerate(BALLOTS[CUR][v])} for v in range(N)]
    nout = 0; rows = ""
    for k, t in enumerate(TOP + ORV):
        cells = ""
        got = [rk[v].get(t) for v in range(N)]
        for v in range(N):
            r = got[v]; o = cell_out(v, t); nout += o
            cells += f'<td class="p-0"><div class="mx-auto flex h-7 w-[32px] items-center justify-center text-[11px] tabular {tone(r)} {"ring-2 ring-inset ring-gold" if o else ""}" title="{VOTERS[v]["name"]}: {nm(t)} {("#"+str(r)) if r else "unranked"}">{r or "–"}</div></td>'
        g = [x for x in got if x]
        spread = f'{min(g)}–{max(g)}' if g else "–"
        div = "border-t-2 border-foreground/30" if k == 25 else ""
        rkcell = f'{k+1}' if k < 25 else '<span class="text-[10px] text-muted-foreground">RV</span>'
        rows += f'<tr class="group border-b {div}"><th scope="row" class="sticky left-0 z-10 bg-card p-0 pl-3 text-right font-display text-base font-bold tabular group-hover:bg-muted">{rkcell}</th><td class="sticky left-9 z-10 border-r bg-card px-2 group-hover:bg-muted"><div class="flex w-24 items-center gap-2 sm:w-36">{tm(t,"size-5 text-[7px]")}<span class="truncate text-[13px] font-semibold">{short(nm(t))}</span></div></td><td class="px-2 text-right text-xs font-semibold tabular">{NOW["pts"][t]}</td><td class="hidden px-2 text-right text-xs text-muted-foreground tabular sm:table-cell">{NOW["fpv"][t] or ""}</td>{cells}<td class="border-l px-2 text-center text-[11px] text-muted-foreground tabular">{len(g)}/{N}</td><td class="px-2 text-center text-[11px] text-muted-foreground tabular">{spread}</td></tr>'
    th = "sticky top-0 z-20 bg-card"
    vh = "".join(f'<th scope="col" class="{th} p-0 pb-1 align-bottom"><a href="{WK}/ballots/{VOTERS[v]["slug"]}" title="{VOTERS[v]["name"]} · {VOTERS[v]["outlet"]}" class="mx-auto flex h-[88px] w-[32px] items-end justify-center hover:text-foreground"><span class="text-[10px] font-medium text-muted-foreground [writing-mode:vertical-rl] rotate-180">{VOTERS[v]["name"].replace("Example ","")}</span></a></th>' for v in range(N))
    hc = "text-[10px] uppercase text-muted-foreground"
    matrix = f'''<div class="rounded-xl border bg-card"><div class="relative max-h-[760px] overflow-auto rounded-t-xl" tabindex="0" aria-label="Ballot matrix, scrolls both ways"><table class="w-max min-w-full border-collapse text-sm">
<caption class="sr-only">Ranks given by each of the {N} voters (columns) to each team (rows). Example data.</caption>
<thead><tr class="border-b"><th class="{th} left-0 z-30 pl-3 text-right {hc}">Rk</th><th class="{th} left-9 z-30 border-r px-2 text-left {hc}">Team</th><th class="{th} px-2 text-right {hc}">Pts</th><th class="{th} hidden px-2 text-right {hc} sm:table-cell">1st</th>{vh}<th class="{th} border-l px-2 text-center {hc}">On</th><th class="{th} px-2 text-center {hc}">Range</th></tr></thead>
<tbody>{rows}</tbody></table></div>
<div class="flex flex-wrap items-center gap-4 border-t px-4 py-2.5 text-[11px] text-muted-foreground"><span>Cell = rank that voter gave the team</span>{"".join(f'<span class="flex items-center gap-1"><span class="size-3 rounded-sm {tone(r)}"></span>{l}</span>' for r,l in [(3,"1–5"),(8,"6–10"),(13,"11–15"),(18,"16–20"),(23,"21–25")])}<span class="flex items-center gap-1"><span class="size-3 rounded-sm ring-2 ring-inset ring-gold"></span>Outlier: ≥{OUT_GAP} spots from consensus, or leaves off a top-{OUT_OMIT} team</span><span>RV = others receiving votes · On = ballots ranking the team</span><span class="ml-auto">Example data</span></div></div>'''
    toolbar = f'''<div class="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
{input_("Find a team","w-56","search")}
<span class="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm">{icon("users","size-4 text-muted-foreground")}All {N} voters</span>
{select_("Columns: voter name","h-9")}
<label class="flex items-center gap-2 text-sm">{switch(False)} Outliers only</label><label class="flex items-center gap-2 text-sm">{switch(True)} Show RV</label>
<span class="ml-auto text-xs text-muted-foreground">No filter applied. Highlighting voters writes <span class="font-mono">?voters=</span> (canonical stays this URL).</span></div>'''
    # outliers + distribution
    outl = []
    for v in range(N):
        rows_, om, gap, _ = voter_rows(v)
        outl += [(v, x["team"], x["rank"], x["cons"]) for x in rows_ if x["out"]] + [(v, t, None, NOW["rank"][t]) for t in om]
    outl.sort(key=lambda o: -abs((o[2] or 26) - o[3]))
    top_out = "".join(f'<li class="flex flex-wrap items-center gap-x-2 gap-y-0.5 border-b py-2 text-sm last:border-0"><a href="{WK}/ballots/{VOTERS[v]["slug"]}" class="font-medium hover:underline">{VOTERS[v]["name"]}</a><span class="text-muted-foreground">ranked</span>{tm(tt,"size-5 text-[7px]")}<span class="truncate font-semibold">{short(nm(tt))}</span><span class="ml-auto whitespace-nowrap tabular">{("No. "+str(r)) if r else "unranked"} <span class="text-muted-foreground">vs No. {c}</span></span></li>' for v, tt, r, c in outl[:5])
    outcard = card(card_header("Biggest outliers", f"{len(outl)} flagged picks across {N} ballots", f'<a href="{WK}/ballots/by-voter" class="text-xs font-medium text-primary hover:underline">By voter</a>') + card_content(f'<ul>{top_out}</ul>', "pb-4 pt-2"), "gap-0")
    t = 1; recv = [rk[v].get(t) for v in range(N)]
    hist = [sum(1 for r in recv if r == k) for k in range(1, 26)]; mx = max(hist) or 1
    bars = "".join(f'<div class="flex flex-1 flex-col items-center justify-end gap-0.5"><span class="text-[9px] tabular text-muted-foreground">{c or ""}</span><div class="w-full rounded-t-sm {"bg-primary" if c else "bg-muted"}" style="height:{max(3, c/mx*64):.0f}px"></div><span class="text-[9px] tabular text-muted-foreground">{k+1 if k<9 or (k+1)%5==0 else ""}</span></div>' for k, c in enumerate(hist))
    got = sorted(r for r in recv if r)
    stat = lambda l, v: f'<div><div class="text-[10px] uppercase tracking-wide text-muted-foreground">{l}</div><div class="font-display text-xl font-bold tabular">{v}</div></div>'
    dist = card(card_header(f"Vote distribution · {nm(t)}", f"Ranks received on {N} ballots (example)", select_("Montana St.","h-8 text-xs")) + card_content(f'<div class="flex h-24 items-end gap-0.5">{bars}</div><div class="mt-3 grid grid-cols-4 gap-2">{stat("Consensus", NOW["rank"][t])}{stat("Median", got[len(got)//2])}{stat("High", got[0])}{stat("Low", got[-1])}</div>', "pb-5 pt-3"), "gap-0")
    unan = sum(1 for t in TOP if NOW["on"][t] == N)
    sbox = lambda l, v, d: f'<div class="rounded-xl border bg-card p-3 sm:p-4"><div class="text-[11px] uppercase tracking-wide text-muted-foreground sm:text-xs">{l}</div><div class="font-display text-2xl font-extrabold tabular sm:text-3xl">{v}</div><div class="text-xs text-muted-foreground">{d}</div></div>'
    stats = f'<p class="text-sm text-muted-foreground sm:hidden"><b class="text-foreground">{N} of {N}</b> ballots · <b class="text-foreground">{unan}</b> teams on every ballot · <b class="text-foreground">{len(outl)}</b> outlier picks</p><div class="hidden grid-cols-2 gap-3 sm:grid lg:grid-cols-4">{sbox("Ballots counted", f"{N} of {N}", "every panel voter submitted")}{sbox("On every ballot", unan, "teams ranked by all voters")}{sbox("First-place votes", f"{NOW["fpv"][TOP[0]]} / {N}", short(nm(TOP[0])) + " (example)")}{sbox("Outlier picks", len(outl), f"≥{OUT_GAP} spots or top-{OUT_OMIT} omission")}</div>'
    head = poll_head(1, "FCS Week 7 Ballots", ["College","Football","Rankings","FCS","2026","Week 7","Ballots"],
        f'{N} voters · every ballot published at release · 25-to-1 scoring · <a href="#" class="text-primary hover:underline">Download CSV</a> · hash <span class="font-mono text-xs">9f2c…e1</span> · example data')
    body = f'''{ticker()}{header()}
<main class="mx-auto max-w-site px-4 lg:px-6">{head}
 <div class="flex flex-wrap items-center justify-between gap-3 pt-5">{seg(BVIEWS,0)}<span class="text-xs text-muted-foreground lg:hidden">Swipe the grid for all {N} voters →</span></div>
 <div class="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4">{stats}<div class="hidden lg:block">{toolbar}</div>
  <div class="flex items-center gap-2 lg:hidden">{input_("Find a team","flex-1","search")}{button("Filters","outline","default","list")}</div>
  {matrix}
  <div class="grid gap-4 lg:grid-cols-2">{outcard}{dist}</div></div>
</main>{footer()}{bottom_nav(1)}'''
    return page("FCS Week 7 Ballots", body, path=f"{WK}/ballots")

# ------------------------------------------------------------------ Ballots: by voter
def voter_card(v, mobile=False):
    rows, om, gap, nout = voter_rows(v)
    V = VOTERS[v]
    items = "".join(f'<li class="flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-[13px] {"bg-gold/15 ring-1 ring-inset ring-gold" if x["out"] else ""}"><span class="w-5 text-right font-display text-sm font-bold tabular">{x["rank"]}</span>{tm(x["team"],"size-5 text-[7px]")}<span class="flex-1 truncate">{short(nm(x["team"]))}</span>{diff_chip(x["diff"], x["cons"]>25)}</li>' for x in rows)
    omit = f'<p class="text-xs"><span class="font-semibold text-foreground">Left off:</span> ' + ", ".join(f'{nm(t)} (consensus No. {NOW["rank"][t]})' for t in om) + '</p>' if om else '<p class="text-xs text-muted-foreground">Ranked every consensus top-15 team.</p>'
    agree = sum(1 for x in rows if x["cons"] <= 25)
    return card(f'''<div class="flex items-start gap-3 px-5 pt-5">{avatar(V["ini"],"size-10")}<div class="min-w-0 flex-1"><a href="/people/{V["slug"]}" class="font-semibold hover:underline">{V["name"]}</a><div class="truncate text-xs text-muted-foreground">{V["outlet"]} · {V["role"]}</div></div>
<a href="{WK}/ballots/{V["slug"]}" class="inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-medium hover:bg-accent">Ballot {icon("chev-right","size-3")}</a></div>
<div class="flex flex-wrap gap-1.5 px-5 pt-3">{badge(f"Avg. gap {gap:.1f} spots","secondary")}{badge(f"{nout} outlier{'s' if nout!=1 else ''}","outline","border-gold" if nout else "")}{badge(f"{agree} of 25 in the consensus Top 25","outline")}{badge("No. 1: "+short(nm(rows[0]["team"])),"outline")}</div>
<ol class="grid grid-cols-2 grid-flow-col grid-rows-[repeat(13,auto)] gap-x-3 px-4 pt-3 {"" if not mobile else ""}" aria-label="{V["name"]} full ballot">{items}</ol>
<div class="mt-3 grid gap-1 border-t px-5 py-3 text-muted-foreground">{omit}<p class="text-xs">Voter note: "Placeholder note explaining a ranking choice (example)."</p></div>''', "gap-0")

def ballots_by_voter():
    stats = {v: voter_rows(v) for v in range(N)}
    order = sorted(range(N), key=lambda v: (-stats[v][3], -stats[v][2]))   # sort: most outliers
    lst = "".join(f'<li><a href="#{VOTERS[v]["slug"]}" class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted {"bg-muted" if k<6 else ""}">{avatar(VOTERS[v]["ini"],"size-6")}<span class="min-w-0 flex-1"><span class="block truncate font-medium">{VOTERS[v]["name"]}</span><span class="block truncate text-[11px] text-muted-foreground">{VOTERS[v]["outlet"]}</span></span><span class="text-[11px] tabular text-muted-foreground">{stats[v][2]:.1f}</span>{"<span class=\'size-2 rounded-full bg-gold\' title=\'Has outliers\'></span>" if stats[v][3] else "<span class=\'size-2\'></span>"}</a></li>' for k, v in enumerate(order))
    aside = card(f'''<div class="grid gap-3 p-4"><div class="flex items-center justify-between"><div class="font-display text-lg font-bold uppercase">All {N} voters</div><span class="text-[10px] uppercase tracking-wide text-muted-foreground">Avg. gap</span></div>
<ul class="grid gap-0.5">{lst}</ul><p class="text-[11px] text-muted-foreground"><span class="mr-1 inline-block size-2 rounded-full bg-gold"></span>has outlier picks · gap = average spots from consensus</p></div>''', "gap-0 lg:sticky lg:top-20")
    controls = f'''<div class="flex flex-wrap items-center gap-2">{input_("Search voters or outlets","w-full sm:w-72","search")}{select_("Sort: most outliers","h-9")}
<div class="hidden text-xs text-muted-foreground xl:block">Other sorts: closest to consensus · farthest from consensus · name A–Z · outlet</div>
<span class="ml-auto hidden text-xs text-muted-foreground sm:block">Showing 1–6 of {N} · <span class="font-mono">?q=</span> <span class="font-mono">?sort=</span> <span class="font-mono">?page=n</span></span></div>'''
    legend = f'<div class="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">Diff vs consensus: {diff_chip(3)} ranked higher {diff_chip(-2)} ranked lower {diff_chip(0)} same spot {diff_chip(0,True)} team outside the Top 25 <span class="inline-flex items-center gap-1"><span class="size-3 rounded-sm bg-gold/15 ring-1 ring-inset ring-gold"></span>outlier (≥{OUT_GAP} spots)</span></div>'
    cards_d = "".join(voter_card(v) for v in order[:6])
    cards_m = "".join(voter_card(v, True) for v in order[:2])
    head = poll_head(1, "FCS Week 7 Ballots", ["College","Football","Rankings","FCS","2026","Week 7","Ballots","By voter"],
        f'{N} voters · full 25-team ballot for each · diff vs the published consensus · example data')
    body = f'''{ticker()}{header()}
<main class="mx-auto max-w-site px-4 lg:px-6">{head}
 <div class="pt-5">{seg(BVIEWS,1)}</div>
 <div class="grid grid-cols-[minmax(0,1fr)] gap-6 pt-4 lg:grid-cols-[280px_minmax(0,1fr)]">
  <div class="hidden lg:block">{aside}</div>
  <div class="grid content-start gap-4">{controls}{legend}
   <div class="hidden gap-4 lg:grid xl:grid-cols-2">{cards_d}</div>
   <div class="grid gap-4 lg:hidden">{cards_m}</div>
   {pagination(1, 4)}</div>
 </div>
</main>{footer()}{bottom_nav(1)}'''
    return page("FCS Week 7 Ballots by voter", body, path=f"{WK}/ballots/by-voter")

# ------------------------------------------------------------------ Voters tab
DISC = {2: "Alma mater: Example University", 9: "Former SID at Example College (2018–20)", 14: "Spouse employed by Example State"}
def rankings_voters():
    outlets = len({V["outlet"] for V in VOTERS})
    sbox = lambda l, v, d: f'<div class="rounded-xl border bg-card p-3 sm:p-4"><div class="text-[11px] uppercase tracking-wide text-muted-foreground sm:text-xs">{l}</div><div class="font-display text-2xl font-extrabold tabular sm:text-3xl">{v}</div><div class="text-xs text-muted-foreground">{d}</div></div>'
    sub = sum(V["ballots"] for V in VOTERS)
    stats = f'<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">{sbox("Voters", N, "2026 FCS panel (example)")}{sbox("Outlets", outlets, "newspapers, radio, TV, digital")}{sbox("Ballots submitted", f"{sub} / {N*8}", "Preseason through Week 7")}{sbox("Disclosures", len(DISC), "shown next to each ballot")}</div>'
    rows = ""
    for v, V in enumerate(VOTERS):
        d = DISC.get(v)
        rows += f'''<tr class="border-b hover:bg-muted/50"><td class="p-2 pl-4"><div class="flex items-center gap-3">{avatar(V["ini"],"size-9")}<div><a href="/people/{V["slug"]}" class="font-semibold hover:underline">{V["name"]}</a><div class="text-xs text-muted-foreground">{V["role"]}</div></div></div></td>
<td class="p-2"><a href="#" class="inline-flex items-center gap-1 hover:underline">{V["outlet"]}{icon("ext","size-3 text-muted-foreground")}</a></td><td class="p-2 text-muted-foreground">{V["market"]}</td><td class="p-2 text-right tabular text-muted-foreground">{V["since"]}</td>
<td class="p-2 text-right tabular">{V["ballots"]}/8</td><td class="p-2 text-xs {"" if d else "text-muted-foreground"}">{d or "None disclosed"}</td>
<td class="p-2 pr-4 text-right"><div class="flex justify-end gap-1.5"><a href="{WK}/ballots/{V["slug"]}" class="inline-flex h-7 items-center rounded-md border px-2 text-xs font-medium hover:bg-accent">Week 7 ballot</a><a href="/people/{V["slug"]}" class="inline-flex h-7 items-center rounded-md px-2 text-xs font-medium text-primary hover:bg-accent">Profile</a></div></td></tr>'''
    hc = "p-2 text-left text-xs uppercase tracking-wide text-muted-foreground"
    table = f'''<div class="hidden overflow-x-auto rounded-xl border bg-card md:block"><table class="w-full text-sm"><thead><tr class="border-b"><th class="{hc} pl-4">Voter</th><th class="{hc}">Outlet / affiliation</th><th class="{hc}">Covers</th><th class="{hc} text-right">On panel since</th><th class="{hc} text-right">2026 ballots</th><th class="{hc}">Disclosures</th><th class="{hc} pr-4 text-right">Links</th></tr></thead><tbody>{rows}</tbody></table></div>'''
    mob = '<ul class="grid gap-2 md:hidden">' + "".join(f'''<li class="rounded-xl border bg-card p-3"><div class="flex items-center gap-3">{avatar(V["ini"],"size-10")}<div class="min-w-0 flex-1"><a href="/people/{V["slug"]}" class="font-semibold">{V["name"]}</a><div class="truncate text-xs text-muted-foreground">{V["outlet"]} · {V["role"]}</div></div><span class="text-xs tabular text-muted-foreground">{V["ballots"]}/8</span></div>
<div class="mt-2 flex items-center justify-between gap-2 text-xs"><span class="text-muted-foreground">{DISC.get(v, "No disclosures")}</span><span class="flex gap-1.5"><a href="{WK}/ballots/{V["slug"]}" class="rounded-md border px-2 py-1 font-medium">Ballot</a><a href="/people/{V["slug"]}" class="rounded-md px-2 py-1 font-medium text-primary">Profile</a></span></div></li>''' for v, V in enumerate(VOTERS[:8])) + f'<li>{button(f"Show all {N} voters","outline","default",cls="w-full")}</li></ul>'
    controls = f'<div class="flex flex-wrap items-center gap-2">{input_("Search voters or outlets","w-full sm:w-72","search")}{select_("All coverage areas","h-9")}{select_("Sort: name A–Z","h-9")}<span class="ml-auto hidden text-xs text-muted-foreground sm:block">Season roster: <a href="{BASE}/voters/2025" class="text-primary hover:underline">2025 panel</a></span></div>'
    note = alert("How voters are chosen", f'Invite-only: admins credential media who regularly cover FCS; no athletics-department employees; conflicts are disclosed and shown here and beside each ballot. Profiles live at <span class="font-mono">/people/{{slug}}</span>. <a href="{TABS[4][1]}" class="text-primary hover:underline">Methodology</a>', "brand", "users")
    head = poll_head(2, "FCS Poll Voters", ["College","Football","Rankings","FCS","Voters"], f'2026 panel · {N} voters · published by admins each season · example names and outlets', f'{select_("2026 panel")}')
    body = f'''{ticker()}{header()}
<main class="mx-auto max-w-site px-4 lg:px-6">{head}
 <div class="grid gap-4 pt-6">{stats}{note}{controls}{table}{mob}</div>
</main>{footer()}{bottom_nav(1)}'''
    return page("FCS Poll Voters", body, path=f"{BASE}/voters")

# ------------------------------------------------------------------ History tab
COLORS = ["stroke-chart-1","stroke-chart-2","stroke-chart-3","stroke-chart-4","stroke-chart-5","stroke-foreground"]
FILLS = ["bg-chart-1","bg-chart-2","bg-chart-3","bg-chart-4","bg-chart-5","bg-foreground"]
def line_chart(teams, w=760, h=300, compact=False):
    pl, pr, pt_, pb = 34, (16 if compact else 120), 14, 26
    W, H = w - pl - pr, h - pt_ - pb
    x = lambda i: pl + i * W / CUR
    y = lambda r: pt_ + (r - 1) * H / 24
    grid = "".join(f'<line x1="{pl}" x2="{pl+W}" y1="{y(r):.1f}" y2="{y(r):.1f}" class="stroke-border" stroke-width="1"/><text x="{pl-8}" y="{y(r)+4:.1f}" text-anchor="end" class="fill-muted-foreground text-[10px]">{r}</text>' for r in [1,5,10,15,20,25])
    xl = "".join(f'<text x="{x(i):.1f}" y="{h-6}" text-anchor="middle" class="fill-muted-foreground text-[10px]">{WK_SHORT[i]}</text>' for i in range(CUR+1))
    lines = ""
    ly = sorted([(y(history_rank(t, CUR)) + 4, c) for c, t in enumerate(teams)])
    adj = {}; last = -99
    for yy, c in ly:
        yy = max(yy, last + 13); adj[c] = yy; last = yy
    for c, t in enumerate(teams):
        pts_ = [(x(w_), y(history_rank(t, w_))) for w_ in range(CUR+1) if history_rank(t, w_)]
        d = " ".join(f'{"M" if k==0 else "L"}{px:.1f},{py:.1f}' for k, (px, py) in enumerate(pts_))
        dots = "".join(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="3.5" class="{COLORS[c]} fill-card" stroke-width="2"/>' for px, py in pts_)
        lab = "" if compact else f'<text x="{pts_[-1][0]+10:.1f}" y="{adj[c]:.1f}" class="fill-foreground text-[11px] font-semibold">{short(nm(t))} · {history_rank(t, CUR)}</text>'
        lines += f'<path d="{d}" fill="none" class="{COLORS[c]}" stroke-width="2.5" stroke-linejoin="round"/>{dots}{lab}'
    return f'<svg viewBox="0 0 {w} {h}" class="h-auto w-full" role="img" aria-label="Rank by week, example data">{grid}{xl}{lines}</svg>'

def rankings_history():
    teams = [TOP[i] for i in (0, 1, 2, 3, 6, 10)]
    legend = "".join(f'<span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"><span class="size-2.5 rounded-full {FILLS[c]}"></span>{short(nm(t))}{icon("x","size-3 text-muted-foreground")}</span>' for c, t in enumerate(teams))
    chart = card(card_header("Rank by week", "2026 season · Preseason to Week 7 · lower is better (example)", select_("Compare: 6 teams","h-8 text-xs")) + card_content(f'<div class="flex flex-wrap gap-1.5">{legend}<span class="inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground">{icon("plus","size-3")}Add team</span></div><div class="mt-3 hidden md:block">{line_chart(teams)}</div><div class="mt-3 md:hidden">{line_chart(teams, 360, 240, True)}</div>', "pb-5 pt-3"), "gap-0")
    no1 = "".join(f'<li class="flex items-center gap-2 border-b py-2 text-sm last:border-0"><span class="w-20 text-xs text-muted-foreground">{wk}</span>{tm(t)}<span class="flex-1 truncate font-medium">{short(nm(t))}</span><span class="text-xs tabular text-muted-foreground" title="first-place votes">{f}/{N} 1st</span></li>' for wk, t, f in reversed(NO1))
    weeks_at = {}
    for _, t, _ in NO1: weeks_at[t] = weeks_at.get(t, 0) + 1
    summ = " · ".join(f'<b class="text-foreground">{short(nm(t))}</b> {n} weeks' for t, n in sorted(weeks_at.items(), key=lambda x: -x[1]))
    past = "".join(f'<li class="grid border-b py-1.5 text-sm last:border-0"><a href="{BASE}/history/{y}" class="font-medium text-primary hover:underline">{y} season</a><span class="text-xs text-muted-foreground">Final No. 1: {tn} (example)</span></li>' for y, tn in [(2025, "Montana State"), (2024, "North Dakota State"), (2023, "South Dakota State")])
    no1card = card(card_header("No. 1 history", "Who held the top spot each week (2026, example)") + card_content(f'<p class="mb-1 text-xs text-muted-foreground">{summ}</p><ul>{no1}</ul>', "pb-4 pt-2"), "gap-0")
    pastcard = card(card_header("Past seasons", "Archived polls stay at their week URLs") + card_content(f'<ul>{past}</ul>', "pb-4 pt-2"), "gap-0")
    # week-by-week table
    seen = TOP + [t for t in range(len(POOL)) if t not in TOP and any(history_rank(t, w) for w in range(CUR+1))]
    body_rows = ""
    for t in seen:
        rs = [history_rank(t, w) for w in range(CUR+1)]
        g = [r for r in rs if r]
        cells = "".join(f'<td class="p-0.5"><div class="mx-auto flex h-7 w-10 items-center justify-center rounded text-[11px] tabular {tone(r)} {"ring-2 ring-inset ring-foreground/60" if w==CUR else ""}">{r or "–"}</div></td>' for w, r in enumerate(rs))
        body_rows += f'<tr class="group border-b"><td class="sticky left-0 z-10 border-r bg-card px-3 group-hover:bg-muted"><div class="flex w-40 items-center gap-2">{tm(t,"size-5 text-[7px]")}<a href="/college/teams/{nm(t).lower().replace(" ","-").replace("&","and")}/football/rankings" class="truncate text-[13px] font-semibold hover:underline">{short(nm(t))}</a></div></td>{cells}<td class="px-2 text-center text-xs tabular">{min(g)}</td><td class="px-2 text-center text-xs tabular text-muted-foreground">{max(g)}</td><td class="px-2 pr-4 text-center text-xs tabular text-muted-foreground">{len(g)}</td></tr>'
    hc = "sticky top-0 z-20 bg-card p-2 text-[10px] uppercase tracking-wide text-muted-foreground"
    table = f'''<div class="rounded-xl border bg-card"><div class="flex flex-wrap items-center justify-between gap-2 px-5 pt-5"><div><div class="font-display text-xl font-bold uppercase leading-none tracking-wide">Week by week</div><div class="text-sm text-muted-foreground">Every team ranked at least once in 2026 (example)</div></div>{input_("Find a team","w-48","search")}</div>
<div class="mt-3 max-h-[620px] overflow-auto"><table class="w-max min-w-full border-collapse text-sm"><thead><tr class="border-b"><th class="{hc} left-0 z-30 border-r text-left">Team</th>{"".join(f'<th class="{hc} text-center">{w}</th>' for w in WK_SHORT)}<th class="{hc} text-center">High</th><th class="{hc} text-center">Low</th><th class="{hc} pr-4 text-center">Wks</th></tr></thead><tbody>{body_rows}</tbody></table></div>
<p class="border-t px-5 py-2.5 text-[11px] text-muted-foreground">Each team links to its poll history on the team hub (<span class="font-mono">/college/teams/{{school-nickname}}/football/rankings</span>). “–” = unranked that week. Example data.</p></div>'''
    head = poll_head(3, "FCS Poll History", ["College","Football","Rankings","FCS","History"], f'Week-by-week ranks, No. 1 history and past seasons · {N} voters · example data',
        f'{select_("2026 season")}{select_("Through Week 7")}')
    body = f'''{ticker()}{header()}
<main class="mx-auto max-w-site px-4 lg:px-6">{head}
 <div class="grid grid-cols-[minmax(0,1fr)] gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_360px]">
  <div class="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6">{chart}{table}</div>
  <aside class="grid content-start gap-6">{no1card}{pastcard}{ad(300,250)}</aside>
 </div>
</main>{footer()}{bottom_nav(1)}'''
    return page("FCS Poll History", body, path=f"{BASE}/history")

# ------------------------------------------------------------------ Methodology
def rankings_methodology():
    toc = [("how","How the poll works"),("points","Points: 25 to 1"),("fpv","First-place votes"),("onballots","“On X of 22 ballots”"),("lists","Others, dropped out, no longer receiving votes"),("eligibility","Eligibility"),("window","Ballot window and automation"),("transparency","Transparency"),("outliers","Outlier policy"),("faq","FAQ")]
    tocnav = '<nav class="grid gap-0.5 text-sm" aria-label="On this page">' + "".join(f'<a href="#{i}" class="rounded-md px-2 py-1.5 {"bg-muted font-semibold text-foreground" if k==0 else "text-muted-foreground hover:text-foreground"}">{t}</a>' for k, (i, t) in enumerate(toc)) + '</nav>'
    sec = lambda id_, title, inner: f'<section id="{id_}" class="scroll-mt-24 border-b pb-8 last:border-0"><h2 class="font-display text-2xl font-extrabold uppercase">{title}</h2><div class="mt-3 grid gap-3 text-[15px] leading-relaxed text-foreground/90">{inner}</div></section>'
    tri = lambda ic, t, d: f'<div class="rounded-xl border bg-card p-4"><span class="flex size-9 items-center justify-center rounded-lg bg-accent text-primary">{icon(ic)}</span><div class="mt-3 font-display text-xl font-bold uppercase">{t}</div><p class="text-sm text-muted-foreground">{d}</p></div>'
    ptsgrid = '<div class="grid grid-cols-5 gap-1 sm:grid-cols-[repeat(13,minmax(0,1fr))]">' + "".join(f'<div class="rounded-md border bg-card px-1 py-1.5 text-center"><div class="text-[10px] text-muted-foreground">#{r}</div><div class="font-display text-base font-bold tabular">{26-r}</div></div>' for r in range(1, 26)) + '</div>'
    steps = [("Sun 08:00 ET","Window opens","Automatic (cron). Voters get an email and push with their ballot link on vote.redshirtsports.com."),
             ("Sun 18:00 ET","Reminder 1","Automatic, only to voters who haven't submitted."),
             ("Mon 09:00 ET","Reminder 2","Automatic final reminder; admins see who is outstanding."),
             ("Mon 12:00 ET","Window closes","Ballots lock automatically. Late games can extend the window; any extension is shown on the poll page."),
             ("Mon 12:01 ET","Tabulation","Points, ranks, ties, movement, outlier flags and the CSV hash are computed automatically."),
             ("Mon / Tue","Publish","An admin reviews the outlier report and publishes at the set hour. Ballots go public at the same moment.")]
    timeline = '<ol class="relative grid gap-4 border-l pl-5">' + "".join(f'<li class="relative"><span class="absolute -left-[27px] top-1 size-3 rounded-full border-2 border-primary bg-card"></span><div class="text-xs font-semibold uppercase tracking-wide text-primary">{a}</div><div class="font-semibold">{b}</div><p class="text-sm text-muted-foreground">{c}</p></li>' for a, b, c in steps) + '</ol>'
    faq = [("Why can a team with fewer first-place votes rank higher?", "Rank is decided by total points, not first-place votes. First-place votes are shown for context and only break display order when points tie."),
           ("What does “On 12 of 22 ballots” mean?", "Twelve of the 22 voters put that team somewhere in their Top 25 this week; the other ten left it off. It's a measure of how broad a team's support is, separate from points."),
           ("Can I see how a specific voter ranked my team?", "Yes. Every ballot is public at release: open Ballots for the grid of all voters, or By voter for each voter's full ballot with differences from the consensus."),
           ("Does an outlier ballot get thrown out?", "No. Outliers are flagged so readers can see them, never changed or removed. Only invalid ballots (for example, a duplicate team) can be voided, and every void is published with its reason."),
           ("How do I become a voter?", "There's no public application. Admins invite media who regularly cover the division; see Eligibility."),
           ("Why did the poll publish late this week?", "If a late game forces a window extension, the poll page shows the new close time and the reason.")]
    acc = '<div class="divide-y rounded-xl border bg-card">' + "".join(f'<details class="group px-4 py-3" {"open" if k==0 else ""}><summary class="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">{q}{icon("chev-down","size-4 text-muted-foreground transition group-open:rotate-180")}</summary><p class="pt-2 text-sm text-muted-foreground">{a}</p></details>' for k, (q, a) in enumerate(faq)) + '</div>'
    t25 = TOP[24]
    content = "".join([
      sec("how", "How the poll works", f'<p>The Redshirt Sports FCS Top 25 is voted on by a panel of {N} credentialed media members (example panel). Each voter submits a ranked ballot of 25 teams every week; points are added up and the published Top 25 is the order of total points.</p><div class="grid gap-3 sm:grid-cols-3">{tri("users", f"{N} voters", "Invite-only panel, published every season")}{tri("list", "25-to-1 points", "1st place = 25 points … 25th = 1")}{tri("eye", "Every ballot public", "Released with the poll, with outliers flagged")}</div>'),
      sec("points", "Points: 25 to 1", f'<p>A team earns <b>26 minus its rank</b> on each ballot: 25 points for a first-place vote, 24 for second, down to 1 point for 25th. A team left off a ballot gets 0 from that voter. With {N} voters the maximum is <b>{N*25} points</b> ({N} × 25).</p>{ptsgrid}<p class="text-sm text-muted-foreground"><b class="text-foreground">Ties</b> share a rank (shown as “T-12”) and the next rank is skipped. Within a tie, teams are listed by first-place votes, then alphabetically. If teams tie for 25th, all of them are included.</p>'),
      sec("fpv", "First-place votes", f'<p>The number in parentheses after a team, like <b>North Dakota State ({NOW["fpv"][TOP[0]]})</b>, is how many voters ranked it No. 1. First-place votes add no bonus points beyond the 25 already counted; they’re shown because they show how decisive the top spot is.</p>'),
      sec("onballots", f"“On X of {N} ballots”", f'<p>Replaces the old “ballot share” bar. <b>On {NOW["on"][t25]} of {N} ballots</b> means {NOW["on"][t25]} of the {N} voters ranked that team somewhere from 1 to 25, and {N-NOW["on"][t25]} left it off. It measures how <i>broad</i> a team\'s support is, which points alone can hide: a team on every ballot at No. 20 and a team on half the ballots at No. 8 can have similar totals.</p>'),
      sec("lists", "Others, dropped out, no longer receiving votes", '<ul class="grid gap-2 pl-5 [list-style:disc]"><li><b>Others receiving votes</b>: every team with points this week that isn\'t in the Top 25, by points.</li><li><b>Dropped out of the Top 25</b>: teams ranked last week that aren\'t ranked this week, with last week\'s rank (they may still be receiving votes).</li><li><b>No longer receiving votes</b>: teams that had points last week (ranked or not) and have none this week.</li></ul>'),
      sec("eligibility", "Eligibility", '<div class="grid gap-3 sm:grid-cols-2"><div class="rounded-xl border bg-card p-4"><div class="font-semibold">Voters</div><ul class="mt-1 grid gap-1 pl-5 text-sm text-muted-foreground [list-style:disc]"><li>Invite-only; admins credential media who regularly cover the division</li><li>No athletics-department employees; team broadcasters only with disclosure</li><li>Conflicts (employer, alma mater, family, paid ties) disclosed publicly</li><li>One ballot per voter per week; MFA required on the voting app</li><li>Panel published each season; missed weeks are shown</li></ul></div><div class="rounded-xl border bg-card p-4"><div class="font-semibold">Teams</div><ul class="mt-1 grid gap-1 pl-5 text-sm text-muted-foreground [list-style:disc]"><li>Any program in the division per the published eligibility list</li><li>Programs transitioning between divisions follow the rule on this page for that season</li><li>Records are entered by admins; the poll stores no game data</li></ul><p class="mt-2 text-xs text-muted-foreground">Example policy text: final wording is set by Redshirt admins.</p></div></div>'),
      sec("window", "Ballot window and automation", f'<p>The weekly cycle runs on schedules (FCS defaults shown; each poll has its own, configurable by admins):</p>{timeline}'),
      sec("transparency", "Transparency", '<ul class="grid gap-2 pl-5 [list-style:disc]"><li><b>All ballots are public</b> at the moment the poll publishes, and never before: the full grid, each voter\'s ballot and the voter roster.</li><li><b>Downloadable data</b>: ballots CSV (voter, rank, team) and results CSV with a SHA-256 hash, so anyone can re-tabulate the poll.</li><li><b>Corrections log</b>: any republish, void or window extension is listed on the poll page with the reason.</li><li><b>No early results</b>: voters and staff can\'t see aggregates before publish.</li></ul>'),
      sec("outliers", "Outlier policy", f'<p>A pick is flagged as an <b>outlier</b> when a voter ranks a team <b>{OUT_GAP} or more spots</b> away from its published rank, or <b>leaves off a team ranked in the top {OUT_OMIT}</b>. Thresholds are configuration, not code.</p><ul class="grid gap-2 pl-5 [list-style:disc]"><li>Flags are informational: outliers are highlighted (gold ring) on the ballot pages, never altered.</li><li>Voters can add a short note to explain a pick; the note is shown with the ballot.</li><li>Admins review the outlier report before publishing, and look at repeated unexplained patterns at season end when renewing the panel.</li><li>Only invalid ballots are voided, with the reason published.</li></ul>'),
      sec("faq", "FAQ", acc)])
    head = poll_head(4, "How the Top 25 works", ["College","Football","Rankings","Methodology"], f'Applies to every Redshirt Sports football poll (FBS, FCS, D-II, D-III) · FCS example shown · {N}-voter example panel', f'{select_("FCS Top 25")}')
    body = f'''{ticker()}{header()}
<main class="mx-auto max-w-site px-4 lg:px-6">{head}
 <div class="pt-4 lg:hidden">{select_("On this page: How the poll works","w-full")}</div>
 <div class="grid gap-10 pt-6 lg:grid-cols-[240px_minmax(0,1fr)_300px]">
  <aside class="hidden lg:block"><div class="sticky top-20">{tocnav}</div></aside>
  <article class="grid max-w-3xl content-start gap-8">{content}</article>
  <aside class="hidden content-start gap-6 lg:grid">{ballots_cta()}{ad(300,250)}</aside>
 </div>
</main>{footer()}{bottom_nav(1)}'''
    return page("How the FCS Top 25 works", body, path="/college/football/rankings/methodology")

# ------------------------------------------------------------------ Rankings index (phase 1): every poll for a sport
def rankings_index():
    def live(div, title, wk, released, teams, href):
        rows = "".join(f'<li class="flex items-center gap-3 border-b py-2 text-sm last:border-0"><span class="w-6 text-right font-display text-lg font-bold tabular">{i+1}</span>{tm(t)}<span class="flex-1 truncate font-medium">{nm(t)}</span>{movement(move(t))}<span class="w-14 text-right text-xs text-muted-foreground tabular">{NOW["pts"][t]:,} pts</span></li>' for i, t in enumerate(teams))
        return card(f'''<a href="{href}" class="group grid gap-4 p-5" aria-label="{title}, {wk}">
<div class="flex items-start justify-between gap-3"><div><div class="kicker text-primary">Redshirt Sports Poll · {div}</div><h2 class="font-display text-3xl font-extrabold uppercase leading-none group-hover:underline">{title}</h2>
<p class="mt-1 text-xs text-muted-foreground">{wk} · Released {released} · {N} voters</p></div>{badge("Live","default","bg-up/15 text-up border-up/30")}</div>
<ol>{rows}</ol>
<div class="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm"><span class="inline-flex items-center gap-1 font-semibold text-primary">Full Top 25 {icon("chev-right","size-4")}</span><span class="text-xs text-muted-foreground">Ballots · Voters · History</span></div></a>''', "gap-0 transition-colors hover:border-primary/40")
    def soon(div, title, note):
        return card(f'''<div class="grid gap-3 p-5" aria-disabled="true"><div class="flex items-start justify-between gap-3"><div><div class="kicker text-muted-foreground">Redshirt Sports Poll · {div}</div><h2 class="font-display text-3xl font-extrabold uppercase leading-none text-muted-foreground">{title}</h2></div>{badge("Coming soon","outline")}</div>
<p class="text-sm text-muted-foreground">{note}</p></div>''', "gap-0 border-dashed bg-muted/30 shadow-none")
    cards = (live("FCS", "FCS Top 25", "Week 7", "Oct 13, 2026", TOP[:5], f"{WK}")
             + live("FBS", "FBS Top 25", "Week 7", "Oct 13, 2026", TOP[5:10], "/college/football/rankings/fbs/2026/week-7")
             + soon("D-II", "D-II Top 25", "Shown only once the poll has a published week. Until then: hidden or this placeholder (James to decide).")
             + soon("D-III", "D-III Top 25", "Same rule as D-II."))
    body = f'''{ticker()}{header()}
<main class="mx-auto max-w-site px-4 pb-12 lg:px-6">
 <div class="pt-5">{crumbs(["College","Football","Rankings"])}
  <div class="mt-3 flex flex-wrap items-end justify-between gap-4"><div><div class="kicker text-primary">College Football</div>
  <h1 class="font-display text-[2.3rem] font-extrabold uppercase leading-none lg:text-headline-lg">Rankings</h1>
  <p class="mt-2 max-w-2xl text-sm text-muted-foreground">Every Redshirt Sports poll for this sport. Each poll is voted by a public panel; every ballot is published with the poll. Example data.</p></div>
  <a href="/college/football/rankings/methodology" class="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent">{icon("book","size-4")}How our polls work</a></div></div>
 <div class="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_340px]">
  <div class="grid content-start gap-4 md:grid-cols-2">{cards}</div>
  <aside class="grid content-start gap-6">{"" if PHASE1 else card(card_content(f'<div class="flex items-center gap-3"><span class="flex size-9 items-center justify-center rounded-full bg-accent text-primary">{icon("bell")}</span><div class="flex-1 text-sm"><div class="font-semibold">Poll release alerts</div><div class="text-muted-foreground">Email or push when a poll you follow publishes</div></div>{switch(False)}</div>',"py-4"))}{ad(300,250)}</aside>
 </div>
</main>{footer()}{bottom_nav(1)}'''
    return page("College Football Rankings", body, path="/college/football/rankings")
