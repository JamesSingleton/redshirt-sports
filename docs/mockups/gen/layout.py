from ui import *

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

def wordmark(cls="text-[1.7rem]", light=False):
    return f'<a href="index.html" class="font-display {cls} font-extrabold uppercase italic leading-none tracking-tight {"text-ink-foreground" if light else "text-foreground"}">Redshirt<span class="text-primary">Sports</span></a>'

def ticker():
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

def mega():
    cols = ""
    for sport, divs in SPORTS:
        links = "".join(f'<li><a href="#" class="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">{d}{icon("chev-right","size-3.5 opacity-40")}</a></li>' for d in divs)
        cols += f'<div><div class="kicker mb-2 text-primary">{sport}</div><ul class="grid gap-0.5">{links}</ul><div class="mt-3 flex flex-wrap gap-1.5">{badge("News","outline")}{badge("Rankings","outline")}{badge("Bracket Challenge","outline")}{badge("Transfer Portal","outline")}{badge("Recruiting","outline")}{badge("Teams","outline")}</div></div>'
    return f'''<div data-slot="navigation-menu-viewport" class="absolute inset-x-0 top-full z-40 hidden border-b bg-popover shadow-lg [.mega-open_&]:block">
  <div class="mx-auto flex max-w-site items-center gap-3 border-b px-6 py-2.5 text-sm"><a href="#" title="/college" class="font-semibold hover:underline">College hub{icon("chev-right","size-3.5 inline opacity-60")}</a><span class="font-mono text-xs text-muted-foreground">/college</span><span class="ml-auto text-xs text-muted-foreground">High School: future level (<span class="font-mono">/high-school</span>, not built)</span></div>
  <div class="mx-auto grid max-w-site grid-cols-[1fr_1fr_1fr_1.1fr] gap-8 px-6 py-6">{cols}
   <div class="rounded-xl border bg-muted/50 p-4"><div class="kicker mb-2 text-muted-foreground">Featured</div>{photo("Promo image placeholder","aspect-[16/9]")}<div class="mt-3 font-display text-lg font-bold uppercase leading-tight">FCS Bracket Challenge 2026</div><p class="mt-1 text-sm text-muted-foreground">Pick all 23 games. Create a group for your friends. (example promo)</p></div>
  </div></div>'''

def header(active="College Football", app="web"):
    nav = "".join(f'<button class="inline-flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2.5 text-sm font-semibold {"text-foreground" if s==active else "text-muted-foreground"} hover:bg-accent hover:text-accent-foreground" aria-haspopup="true">{s}{icon("chev-down","size-3.5 opacity-60")}</button>' for s,_ in SPORTS)
    extra = "".join(f'<a href="#" class="{"hidden 2xl:block" if x=="Podcasts" else "hidden xl:block" if x=="Teams" else ""} shrink-0 whitespace-nowrap px-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground">{x}</a>' for x in ["Rankings","Bracket Challenge","Teams","Podcasts"])
    return f'''<header class="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
 <div class="relative">
  <div class="mx-auto flex h-14 max-w-site items-center gap-3 px-4 lg:h-16 lg:px-6">
    <button class="lg:hidden -ml-1 inline-flex size-9 items-center justify-center rounded-md hover:bg-accent" aria-label="Open menu">{icon("menu","size-5")}</button>
    {wordmark("text-[1.45rem] lg:text-[1.8rem]")}
    <nav class="ml-6 hidden items-center lg:flex" aria-label="Sports">{nav}<span class="mx-2 h-5 w-px bg-border"></span>{extra}</nav>
    <div class="ml-auto flex items-center gap-1.5">
      {button("", "ghost", "icon", "search", attrs='aria-label="Search"')}
      {button("", "ghost", "icon", "moon", cls="hidden md:inline-flex", attrs='aria-label="Toggle theme"')}
      {button("Follow teams", "outline", "sm", "star", cls="hidden md:inline-flex")}
      {button("Sign in", "default", "sm")}
    </div>
  </div>
  {mega()}
 </div>
</header>'''

def footer():
    cols = [("Sports",["College Football","Men's Basketball","Women's Basketball"]),("Redshirt",["Rankings","Bracket Challenge","Newsletters","Podcasts"]),("Company",["About","Staff","Contact","Advertise","Careers"]),("Policies",["Privacy","Terms","Ethics","Corrections","Accessibility"])]
    c = "".join(f'<div><div class="kicker mb-3 text-ink-foreground/60">{t}</div><ul class="grid gap-2 text-sm">{"".join(f"<li><a href=# class=hover:underline>{l}</a></li>" for l in ls)}</ul></div>' for t,ls in cols)
    return f'''<footer class="mt-16 bg-ink text-ink-foreground pb-20 lg:pb-0"><div class="mx-auto grid max-w-site gap-10 px-4 py-12 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:px-6">
  <div>{wordmark("text-2xl", light=True)}<p class="mt-3 max-w-xs text-sm text-ink-foreground/70">Independent coverage of FCS, D-II, D-III and college basketball. (mockup)</p></div>{c}</div></footer>'''

def bottom_nav(active=0):
    items=[("home","Home"),("list","Rankings"),("trophy","Brackets"),("news","Following"),("user","Me")]
    b="".join(f'<a href="#" class="flex flex-1 flex-col items-center gap-0.5 pt-2 text-[11px] font-medium {"text-primary" if i==active else "text-muted-foreground"}">{icon(ic,"size-5")}{t}</a>' for i,(ic,t) in enumerate(items))
    return f'<nav class="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Primary">{b}</nav>'

def mobile_sheet():
    groups="".join(f'<div class="py-3"><div class="kicker mb-2 text-primary">{s}</div><div class="grid grid-cols-2 gap-1">{"".join(f"<a href=# class=\'rounded-md px-2 py-2 text-sm hover:bg-accent\'>{d}</a>" for d in ds)}</div></div>' for s,ds in SPORTS)
    return f'''<div class="fixed inset-0 z-50 hidden [.menu-open_&]:block"><div class="absolute inset-0 bg-black/50"></div>
<div data-slot="sheet-content" class="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col gap-2 overflow-y-auto border-r bg-background p-5 shadow-lg">
  <div class="flex items-center justify-between">{wordmark("text-xl")}{button("", "ghost", "icon-sm", "x", attrs='aria-label="Close"')}</div>
  {input_("Search Redshirt Sports", "mt-3", "search")}
  <div class="mt-2 rounded-lg border bg-muted/40 p-3"><div class="text-sm font-semibold">Your teams</div><div class="mt-2 flex flex-wrap gap-1.5">{badge(team_mark("MSU","size-4")+" Montana State","outline","gap-1.5")}{badge(team_mark("NOVA","size-4")+" Villanova","outline","gap-1.5")}{badge(icon("plus","size-3")+"Add","secondary")}</div></div>
  <div class="divide-y">{groups}</div>
  {separator()}
  <div class="grid gap-1 text-sm">{"".join(f"<a href=# class=\'rounded-md px-2 py-2 hover:bg-accent\'>{x}</a>" for x in ["Bracket Challenge","Newsletters","Podcasts","About"])}</div>
</div></div>'''

def ribbon(path=None):
    p = f' · <span class="font-mono normal-case tracking-normal text-foreground">{path}</span>' if path else ""
    return f'<div class="bg-muted text-muted-foreground border-b text-center text-[10px] font-semibold uppercase tracking-widest py-1">Mockup · example data, not real{p}</div>'

def page(title, body, css="css/app.css", extra_head="", path=None):
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title} · Redshirt Sports (mockup)</title><link rel="stylesheet" href="{css}">{extra_head}
<script>const q=new URLSearchParams(location.search);["dark","mega-open","menu-open"].forEach(c=>q.has(c)&&document.documentElement.classList.add(c));</script>
</head><body class="min-h-dvh">{ribbon(path)}{body}</body></html>'''
