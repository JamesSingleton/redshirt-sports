from ui import *
import os
PHASE1 = os.environ.get("RS_PHASE1") == "1"   # phase-1 build: no accounts (no sign-in/follow/notify/saved/personalization)
A = "../" if PHASE1 else ""                     # asset prefix (phase-1 pages live in ./phase1/)

TEAMS = [  # (abbr, name, conf, record) — EXAMPLE DATA ONLY
 ("NDSU","North Dakota State","MVFC","6-0"),("MSU","Montana State","Big Sky","6-0"),("SDSU","South Dakota State","MVFC","5-1"),
 ("UM","Montana","Big Sky","5-1"),("NOVA","Villanova","CAA","5-1"),("UIW","Incarnate Word","Southland","5-1"),
 ("SAC","Sacramento State","Big Sky","5-1"),("UCD","UC Davis","Big Sky","4-2"),("IDHO","Idaho","Big Sky","4-2"),
 ("SIU","Southern Illinois","MVFC","4-2"),("LEH","Lehigh","Patriot","5-1"),("TAR","Tarleton State","UAC","5-1"),
 ("MER","Mercer","SoCon","5-1"),("URI","Rhode Island","CAA","4-2"),("ILST","Illinois State","MVFC","4-2"),
 ("ACU","Abilene Christian","UAC","4-2"),("RICH","Richmond","CAA","4-2"),("UNI","Northern Iowa","MVFC","3-3"),
 ("FUR","Furman","SoCon","4-2"),("YSU","Youngstown State","MVFC","4-2"),("UCA","Central Arkansas","UAC","4-2"),
 ("W&M","William & Mary","CAA","3-3"),("HC","Holy Cross","Patriot","4-2"),("APSU","Austin Peay","UAC","4-2"),("SEMO","SE Missouri","Big South-OVC","4-2"),
]
MOVES = [0,0,1,-1,2,0,3,-2,1,-3,4,None,0,2,-1,-4,1,None,0,-2,3,-1,None,2,-3]

SPORTS = [("College Football", ["FBS","FCS","Division II","Division III","NAIA"]),
          ("Men's Basketball", ["Division I","Division II","Division III"]),
          ("Women's Basketball", ["Division I","Division II","Division III"])]

def wordmark(cls="h-6 lg:h-7", light=False):
    """Real logos from Sanity Global Settings (settings.footerLogo / settings.footerLogoDarkMode, 2931x485 SVG).
    light=True: always the dark-mode (white) wordmark, for the always-dark footer."""
    w = lambda h: round(h * 2931 / 485)
    if light:
        return f'<a href="index.html" class="inline-flex shrink-0"><img src="{A}brand/footer-logo-dark.svg" alt="Redshirt Sports" width="{w(32)}" height="32" class="{cls} w-auto"></a>'
    return (f'<a href="index.html" class="inline-flex shrink-0">'
            f'<img src="{A}brand/footer-logo.svg" alt="Redshirt Sports" width="{w(28)}" height="28" fetchpriority="high" class="{cls} w-auto dark:hidden">'
            f'<img src="{A}brand/footer-logo-dark.svg" alt="Redshirt Sports" width="{w(28)}" height="28" fetchpriority="high" class="{cls} hidden w-auto dark:block"></a>')

def ticker():
    if PHASE1: return ""   # ticker data: out of Phase 1
    items = ["FCS Top 25 · Week 7 released — No. 1 example team holds (example)",
             "Bracket Challenge: FCS 2026 opens after selection day (example)",
             "Ballots due Monday noon ET for voters (example)",
             "Top story: Example headline about a conference title race",
             "D-II poll: two new teams enter the rankings (example)"]
    seg = "".join(f'<li class="flex items-center gap-2 whitespace-nowrap"><span class="size-1.5 rounded-full bg-primary"></span><a href="#" class="hover:underline">{t}</a></li>' for t in items)
    return f'''<div class="bg-ink text-ink-foreground text-xs" aria-label="Top stories and poll updates">
  <div class="mx-auto flex h-9 max-w-site items-center gap-4 px-4 lg:px-6">
    <span class="kicker shrink-0 rounded-sm bg-primary px-2 py-0.5 text-[11px] text-primary-foreground">Top 25 &amp; Top Stories</span>
    <ul class="flex min-w-0 flex-1 items-center gap-6 overflow-hidden [mask-image:linear-gradient(90deg,#000_85%,transparent)]">{seg}</ul>
    <div class="hidden shrink-0 items-center gap-1 md:flex"><button class="rounded p-1 hover:bg-white/10" aria-label="Previous">{icon("chev-left","size-3.5")}</button><button class="rounded p-1 hover:bg-white/10" aria-label="Pause">❚❚</button><button class="rounded p-1 hover:bg-white/10" aria-label="Next">{icon("chev-right","size-3.5")}</button></div>
  </div></div>'''

SLUG = {"College Football":("football","fb"),"Men's Basketball":("mens-basketball","mbb"),"Women's Basketball":("womens-basketball","wbb")}
DSLUG = {"FBS":"fbs","FCS":"fcs","Division I":"d1","Division II":"d2","Division III":"d3","NAIA":"naia"}
def _lk(label, path, bold=False, href="#"):
    return f'<li><a href="{href}" title="{path}" class="flex items-center justify-between rounded-md px-2 py-1.5 text-sm {"font-semibold " if bold else ""}hover:bg-accent hover:text-accent-foreground">{label}{icon("chev-right","size-3.5 opacity-40")}</a></li>'
def mega():
    """One panel per sport trigger, only that sport's links. Open state: html.mega-fb / mega-mbb / mega-wbb (?mega-open = football)."""
    panels = ""
    for sport, divs in SPORTS:
        sl, k = SLUG[sport]; base = f"/college/{sl}"
        main = _lk(f"All {sport} news", f"{base}/news") + _lk("Rankings", f"{base}/rankings") + ("" if PHASE1 else _lk("Transfer Portal", f"{base}/transfer-portal"))
        divl = "".join(_lk(d + " news", f"{base}/news/{DSLUG[d]}") for d in divs)
        panels += (f'<div id="mega-{k}" role="region" aria-label="{sport} menu" class="hidden [.mega-{k}_&]:block">'
          f'<div class="mx-auto flex max-w-site items-center gap-3 border-b px-6 py-2.5 text-sm"><a href="#" title="{base}" class="font-semibold hover:underline">{sport} hub{icon("chev-right","size-3.5 inline opacity-60")}</a><span class="font-mono text-xs text-muted-foreground">{base}</span></div>'
          f'<div class="mx-auto grid max-w-site grid-cols-[1fr_1fr_1fr_1.1fr] gap-8 px-6 py-6">'
          f'<div><div class="kicker mb-2 text-primary">{sport}</div><ul class="grid gap-0.5">{main}</ul></div>'
          f'<div><div class="kicker mb-2 text-muted-foreground">By division</div><ul class="grid gap-0.5">{divl}</ul></div>'
          f'<div><div class="kicker mb-2 text-muted-foreground">Teams</div><ul class="grid gap-0.5">{_lk("All teams A–Z","/college/teams",True,"teams.html")}</ul><p class="mt-2 px-2 text-xs text-muted-foreground">Every school we cover. Team pages live at <span class="font-mono">/college/teams/[school]</span>.</p></div>'
          f'<div class="rounded-xl border bg-muted/50 p-4"><div class="kicker mb-2 text-muted-foreground">Latest Top 25</div>{photo("Poll graphic placeholder","aspect-[16/9]")}<div class="mt-3 font-display text-lg font-bold uppercase leading-tight">{sport} Top 25 (example)</div><p class="mt-1 text-sm text-muted-foreground">This week\'s poll and every ballot. (example promo)</p></div>'
          f'</div></div>')
    return f'<div data-slot="navigation-menu-viewport" class="absolute inset-x-0 top-full z-40 hidden border-b bg-popover shadow-lg [.mega-fb_&]:block [.mega-mbb_&]:block [.mega-wbb_&]:block">{panels}</div>'

def header(active="College Football", app="web"):
    nav = "".join(f'<button class="inline-flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2.5 text-sm font-semibold {"text-foreground" if s==active else "text-muted-foreground"} hover:bg-accent hover:text-accent-foreground" aria-expanded="false" aria-controls="mega-{SLUG[s][1]}" data-mega="{SLUG[s][1]}">{s}{icon("chev-down","size-3.5 opacity-60")}</button>' for s,_ in SPORTS)
    extra = "".join(f'<a href="{"teams.html" if x=="Teams" else "#"}" title="{"/college/teams" if x=="Teams" else ""}" class="{"hidden 2xl:block" if x=="Podcasts" else ""} shrink-0 whitespace-nowrap px-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground">{x}</a>' for x in ["Rankings","Teams","Podcasts"])
    return f'''<header class="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
 <div class="relative">
  <div class="mx-auto flex h-14 max-w-site items-center gap-3 px-4 lg:h-16 lg:px-6">
    <button class="lg:hidden -ml-1 inline-flex size-9 items-center justify-center rounded-md hover:bg-accent" aria-label="Open menu">{icon("menu","size-5")}</button>
    {wordmark("h-6 lg:h-7")}
    <nav class="ml-6 hidden items-center lg:flex" aria-label="Sports">{nav}<span class="mx-2 h-5 w-px bg-border"></span>{extra}</nav>
    <div class="ml-auto flex items-center gap-1.5">
      {button("", "ghost", "icon", "search", attrs='aria-label="Search"')}
      {button("", "ghost", "icon", "moon", cls="hidden md:inline-flex", attrs='aria-label="Toggle theme"')}
      {"" if PHASE1 else button("Follow teams", "outline", "sm", "star", cls="hidden md:inline-flex")}
      {"" if PHASE1 else button("Sign in", "default", "sm")}
    </div>
  </div>
  {mega()}
 </div>
</header>'''

def footer():
    cols = [("Sports",["College Football","Men's Basketball","Women's Basketball"]),("Redshirt",["Rankings","Teams","Podcasts"]),("Company",["About","Staff","Contact","Advertise","Careers"]),("Policies",["Privacy","Terms","Ethics","Corrections","Accessibility"])]
    c = "".join(f'<div><div class="kicker mb-3 text-ink-foreground/60">{t}</div><ul class="grid gap-2 text-sm">{"".join(f"<li><a href={"teams.html" if l=="Teams" else "#"} class=hover:underline>{l}</a></li>" for l in ls)}</ul></div>' for t,ls in cols)
    return f'''<footer class="mt-16 bg-ink text-ink-foreground pb-20 lg:pb-0"><div class="mx-auto grid max-w-site gap-10 px-4 py-12 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:px-6">
  <div>{wordmark("h-8", light=True)}<p class="mt-3 max-w-xs text-sm text-ink-foreground/70">Independent coverage of FCS, D-II, D-III and college basketball. (mockup)</p></div>{c}</div></footer>'''

def bottom_nav(active=0):
    if PHASE1: return ""   # Following / Me need accounts
    items=[("home","Home"),("list","Rankings"),("trophy","Brackets"),("news","Following"),("user","Me")]
    b="".join(f'<a href="#" class="flex flex-1 flex-col items-center gap-0.5 pt-2 text-[11px] font-medium {"text-primary" if i==active else "text-muted-foreground"}">{icon(ic,"size-5")}{t}</a>' for i,(ic,t) in enumerate(items))
    return f'<nav class="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Primary">{b}</nav>'

def your_teams():
    return f'''<div class="mt-2 rounded-lg border bg-muted/40 p-3"><div class="text-sm font-semibold">Your teams</div><div class="mt-2 flex flex-wrap gap-1.5">{badge(team_mark("MSU","size-4")+" Montana State","outline","gap-1.5")}{badge(team_mark("NOVA","size-4")+" Villanova","outline","gap-1.5")}{badge(icon("plus","size-3")+"Add","secondary")}</div></div>'''

def mobile_sheet():
    groups = ""
    for i, (sp, ds) in enumerate(SPORTS):
        sl, k = SLUG[sp]; base = f"/college/{sl}"
        links = [(f"All {sp} news", f"{base}/news"), ("Rankings", f"{base}/rankings")] + ([] if PHASE1 else [("Transfer Portal", f"{base}/transfer-portal")]) + [(d + " news", f"{base}/news/{DSLUG[d]}") for d in ds]
        li = "".join(f'<a href="#" title="{p}" class="rounded-md px-2 py-2 text-sm hover:bg-accent">{t}</a>' for t, p in links)
        groups += (f'<details class="group py-1"{" open" if i == 0 else ""}><summary class="flex cursor-pointer list-none items-center justify-between rounded-md px-2 py-2.5 font-display text-base font-bold uppercase tracking-wide hover:bg-accent [&::-webkit-details-marker]:hidden">{sp}{icon("chev-down","size-4 opacity-60 transition-transform group-open:rotate-180")}</summary>'
                   f'<div class="grid grid-cols-2 gap-1 pb-2 pl-2">{li}</div></details>')
    srch = input_("Search Redshirt Sports", "mt-3", "search").replace("<input ", '<input id="sheet-search" type="search" ', 1)
    more = "".join(f'<a href="#" class="rounded-md px-2 py-2 hover:bg-accent">{x}</a>' for x in ["Podcasts", "About", "Contact"])
    return (f'<div class="fixed inset-0 z-50 hidden [.menu-open_&]:block"><div class="absolute inset-0 bg-black/50" data-close-menu></div>'
      f'<div data-slot="sheet-content" role="dialog" aria-modal="true" aria-label="Site menu" class="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col gap-2 overflow-y-auto border-r bg-background p-5 shadow-lg">'
      f'<div class="flex items-center justify-between">{wordmark("h-6")}{button("", "ghost", "icon-sm", "x", attrs="aria-label=\"Close menu\" data-close-menu")}</div>'
      f'<label class="sr-only" for="sheet-search">Search Redshirt Sports</label>{srch}'
      f'<nav aria-label="Sports" class="divide-y">{groups}</nav>{separator()}'
      f'<div class="grid gap-1 text-sm"><a href="teams.html" class="flex items-center justify-between rounded-md px-2 py-2 font-semibold hover:bg-accent">All teams A–Z<span class="font-mono text-xs font-normal text-muted-foreground">/college/teams</span></a>{more}</div>'
      f'</div></div>')

def ribbon(path=None):
    p = f' · <span class="font-mono normal-case tracking-normal text-foreground">{path}</span>' if path else ""
    return f'<div class="bg-muted text-muted-foreground border-b text-center text-[10px] font-semibold uppercase tracking-widest py-1">Mockup · example data, not real{p}</div>'

NAV_JS = '["dark","combo-open","menu-open","mega-fb","mega-mbb","mega-wbb"].forEach(c=>q.has(c)&&document.documentElement.classList.add(c));q.has("mega-open")&&document.documentElement.classList.add("mega-fb");\naddEventListener("DOMContentLoaded",()=>{const h=document.documentElement,ks=["fb","mbb","wbb"],sync=()=>document.querySelectorAll("[data-mega]").forEach(b=>b.setAttribute("aria-expanded",h.classList.contains("mega-"+b.dataset.mega)));\ndocument.querySelectorAll("[data-mega]").forEach(b=>b.addEventListener("click",()=>{const on=h.classList.contains("mega-"+b.dataset.mega);ks.forEach(k=>h.classList.remove("mega-"+k));if(!on)h.classList.add("mega-"+b.dataset.mega);sync();}));\ndocument.querySelectorAll(\'[aria-label="Open menu"]\').forEach(b=>b.addEventListener("click",()=>h.classList.add("menu-open")));document.querySelectorAll("[data-close-menu]").forEach(b=>b.addEventListener("click",()=>h.classList.remove("menu-open")));\naddEventListener("keydown",e=>{if(e.key==="Escape"){ks.forEach(k=>h.classList.remove("mega-"+k));h.classList.remove("menu-open");sync();}});sync();});</script>'

def page(title, body, css=None, extra_head="", path=None):
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title} · Redshirt Sports (mockup)</title><link rel="stylesheet" href="{css or A + "dist/app.css"}">{extra_head}
<script>const q=new URLSearchParams(location.search);{NAV_JS}
</head><body class="min-h-dvh">{ribbon(path)}{body}{"" if "sheet-content" in body else mobile_sheet()}</body></html>'''
