"""v1.4 mockups: bracket view (MarchArena-inspired), ballot breakdown, news index, division news,
transfer portal hub, recruiting hub, sport-agnostic team hub. EXAMPLE DATA ONLY."""
import random
from layout import *
from pages import rankings_widget, newsletter_card, river_item, STORIES, bracket_cta, pts

SHORT = {"North Dakota State":"N. Dakota St.","South Dakota State":"S. Dakota St.","Sacramento State":"Sacramento St.",
 "Southern Illinois":"S. Illinois","Incarnate Word":"Incarnate Word","Tarleton State":"Tarleton St.","Illinois State":"Illinois St.",
 "Abilene Christian":"Abilene Chr.","Northern Iowa":"N. Iowa","Youngstown State":"Youngstown St.","Central Arkansas":"C. Arkansas",
 "William & Mary":"Wm. & Mary","Montana State":"Montana St.","Rhode Island":"Rhode Island","Austin Peay":"Austin Peay","SE Missouri":"SE Missouri"}
def short(n): return SHORT.get(n, n)

def crumbs(items):
    parts = []
    for i, t in enumerate(items):
        parts.append(f'<span class="text-foreground">{t}</span>' if i == len(items)-1 else f'<a href="#" class="hover:text-foreground">{t}</a>{icon("chev-right","size-3")}')
    return f'<nav class="flex flex-wrap items-center gap-1 text-xs text-muted-foreground" aria-label="Breadcrumb">{"".join(parts)}</nav>'

def path_tabs(items, active, cls=""):
    """Underline tabs whose items are real paths (shown as title attr)."""
    out = []
    for i, (t, href) in enumerate(items):
        st = "border-primary text-foreground" if i == active else "border-transparent text-muted-foreground hover:text-foreground"
        out.append(f'<a href="{href}" title="{href}" class="border-b-2 px-1 pb-3 pt-1 text-sm font-semibold whitespace-nowrap {st}">{t}</a>')
    return f'<nav class="flex gap-6 overflow-x-auto border-b {cls}">{"".join(out)}</nav>'

def chip_links(items, active=None):
    return '<div class="-mx-1 flex gap-1.5 overflow-x-auto px-1">' + "".join(
        badge(t, "default" if t == active else "outline", "h-7 px-2.5 text-[13px] cursor-pointer" + ("" if t == active else " hover:bg-accent")) for t in items) + '</div>'

# =====================================================================
# Bracket view (MarchArena-inspired): two halves converge on a centre final, compact cards,
# connector lines, persistent matchup panel on the right. FCS 24 (seeds 1–8 have byes).
# =====================================================================
W, G, RH = 112, 9, 24          # card width, column gap, row height
CH = RH*2 + 3                    # card height incl. borders/divider
S = 146                          # vertical slot per R2 game
TOP = 34

def team_row(t, seed, state="", pct=None, mine=False):
    """state: 'win' | 'lose' | '' ; mine: user's pick (left accent bar)."""
    if t is None:
        return f'<div class="flex h-6 items-center px-1.5 text-[11px] italic text-muted-foreground/70">TBD</div>'
    a, n, _, _ = t
    st = {"win": "bg-up/10 font-semibold", "lose": "text-muted-foreground"}.get(state, "")
    bar = '<span class="absolute inset-y-0.5 left-0 w-0.5 rounded-full bg-primary"></span>' if mine else ""
    p = f'<span class="ml-auto text-[10px] tabular {"font-bold" if state=="win" else "text-muted-foreground"}">{pct}%</span>' if pct is not None else ""
    return f'<div class="relative flex h-6 items-center gap-1 pl-1.5 pr-1.5 {st}" title="{n}">{bar}<span class="w-3 shrink-0 text-right text-[9.5px] text-muted-foreground tabular">{seed or ""}</span><span class="min-w-0 truncate font-display text-[13.5px] leading-none tracking-tight">{short(n)}</span>{p}</div>'

def gcard(x, y, top, bot, selected=False, label=None):
    ring = "ring-2 ring-primary" if selected else ""
    lab = f'<div class="absolute -top-4 left-0 right-0 text-center text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>' if label else ""
    return f'<div class="absolute overflow-visible" style="left:{x}px;top:{y-CH/2:.0f}px;width:{W}px">{lab}<div class="overflow-hidden rounded-md border bg-card shadow-xs {ring}">{top}<div class="h-px bg-border"></div>{bot}</div></div>'

def bracket_canvas(mobile=False):
    rng = random.Random(7)
    seeds = {i+1: TEAMS[i] for i in range(8)}
    uns = TEAMS[8:24]
    halves = [[1, 8, 5, 4], [2, 7, 6, 3]]
    cols_left = [0, 1, 2, 3]; cols_right = [8, 7, 6, 5]
    X = lambda c: 8 + c*(W+G)
    els, lines = [], []
    def elbow(x1, y1, x2, y2):
        mx = (x1 + x2) / 2
        lines.append(f'<path d="M{x1},{y1:.0f} H{mx:.0f} V{y2:.0f} H{x2}" />')
    sf_y = TOP + 2*S
    winners_qf = []
    sel_done = False
    for h, order in enumerate(halves):
        cols = cols_left if h == 0 else cols_right
        right = h == 1
        r2y = [TOP + (i+0.5)*S for i in range(4)]
        r2w = []
        for i, sd in enumerate(order):
            u1, u2 = uns[(h*4+i)*2], uns[(h*4+i)*2+1]
            w1 = rng.random() < 0.55
            p1 = rng.randint(52, 78) if w1 else rng.randint(30, 49)
            r1w = u1 if w1 else u2
            y1 = r2y[i] + 0  # R1 sits level with its R2 game
            els.append(gcard(X(cols[0]), y1, team_row(u1, None, "win" if w1 else "lose", p1, mine=w1),
                             team_row(u2, None, "lose" if w1 else "win", 100-p1, mine=not w1 and i % 2 == 0),
                             label="First round" if i == 0 else None))
            # R1 → bottom row of R2
            ax = X(cols[0]) + (0 if right else W); bx = X(cols[1]) + (W if right else 0)
            elbow(ax, y1, bx, r2y[i] + RH/2)
            seed_wins = not (i == 2 and h == 0) and not (i == 3 and h == 1)
            ps = rng.randint(70, 93)
            sel = (h == 0 and i == 0)
            els.append(gcard(X(cols[1]), r2y[i], team_row(seeds[sd], sd, "win" if seed_wins else "lose", ps, mine=True),
                             team_row(r1w, None, "lose" if seed_wins else "win", 100-ps), label="Second round" if i == 0 else None))
            r2w.append((seeds[sd], sd) if seed_wins else (r1w, None))
        qfy = [(r2y[0]+r2y[1])/2, (r2y[2]+r2y[3])/2]
        for j in range(2):
            for k in (0, 1):
                ax = X(cols[1]) + (0 if right else W); bx = X(cols[2]) + (W if right else 0)
                elbow(ax, r2y[2*j+k], bx, qfy[j])
            a, b = r2w[2*j], r2w[2*j+1]
            pa = rng.randint(55, 80)
            sel = (h == 0 and j == 0) and not mobile
            els.append(gcard(X(cols[2]), qfy[j], team_row(a[0], a[1], "", pa, mine=True), team_row(b[0], b[1], "", 100-pa),
                             selected=sel, label="Quarterfinals" if j == 0 else None))
            winners_qf.append(a)
        for j in range(2):
            ax = X(cols[2]) + (0 if right else W); bx = X(cols[3]) + (W if right else 0)
            elbow(ax, qfy[j], bx, sf_y)
        els.append(gcard(X(cols[3]), sf_y, team_row(None, None), team_row(None, None), label="Semifinal"))
        ax = X(cols[3]) + (0 if right else W); bx = X(4) + (W if right else 0)
        elbow(ax, sf_y, bx, sf_y)
    els.append(gcard(X(4), sf_y, team_row(None, None), team_row(None, None), label="Championship"))
    champ = f'<div class="absolute text-center" style="left:{X(4)-4}px;top:{sf_y+CH/2+14:.0f}px;width:{W+8}px"><div class="rounded-md border border-gold/60 bg-card px-2 py-2"><div class="kicker text-[10px] text-gold">{icon("trophy","size-3 inline -mt-0.5")} Champion</div><div class="mt-1 text-[11px] text-muted-foreground">Your pick: <span class="font-semibold text-foreground">N. Dakota St.</span></div><div class="text-[10px] text-muted-foreground">Most picked: 41% (example)</div></div></div>'
    region = lambda x, t, al: f'<div class="absolute top-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground" style="left:{x}px;width:{4*W+3*G}px;text-align:{al}">{t}</div>'
    width = X(8) + W + 8; height = TOP + 4*S + 10
    labels = region(X(0), "Top half · seeds 1, 8, 4, 5", "left") + region(X(5), "Bottom half · seeds 2, 7, 3, 6", "right")
    svg = f'<svg class="pointer-events-none absolute inset-0 stroke-border" width="{width}" height="{height}" fill="none" stroke-width="1.5">{"".join(lines)}</svg>'
    return f'<div class="relative" style="width:{width}px;height:{height}px">{svg}{labels}{"".join(els)}{champ}</div>', width, height

def matchup_panel(compact=False):
    a = TEAMS[0]; b = TEAMS[7]
    def big(t, seed, rank, rec, win=False):
        return f'''<div class="flex items-center gap-3 rounded-lg px-3 py-3 {"bg-up/10" if win else ""}">{team_mark(t[0],"size-11 text-[11px]")}
<div class="min-w-0 flex-1"><div class="flex items-center gap-2"><span class="inline-flex h-5 min-w-5 items-center justify-center rounded bg-ink px-1 text-[11px] font-bold text-ink-foreground">{seed}</span><span class="truncate font-display text-lg font-bold uppercase">{t[1]}</span></div>
<div class="text-xs text-muted-foreground">{t[2]} · {rec} (admin-entered) · Redshirt FCS No. {rank}</div></div>
<div class="text-right"><div class="font-display text-3xl font-extrabold tabular">{ 68 if win else 32 }%</div><div class="text-[10px] uppercase tracking-wide text-muted-foreground">of entries</div></div></div>'''
    dist = f'''<div class="px-4 pb-4"><div class="flex justify-between text-xs"><span>{short(a[1])} (1)</span><span>{short(b[1])} (8)</span></div>
<div class="mt-1.5 flex h-2 overflow-hidden rounded-full bg-muted"><div class="bg-primary" style="width:68%"></div><div class="bg-chart-2" style="width:32%"></div></div>
<div class="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>68%</span><span>32%</span></div>
<p class="mt-2 text-xs text-muted-foreground">Pick share across all entries (our data). In your groups: 9 of 14 picked {short(a[1])}.</p></div>'''
    sec = lambda t, right="": f'<div class="flex items-center justify-between border-t px-4 pb-2 pt-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground"><span>{t}</span><span class="text-foreground">{right}</span></div>'
    yours = f'''<div class="flex items-center gap-3 px-4 pb-4">{team_mark(a[0],"size-7")}<div class="flex-1 text-sm"><div class="font-semibold">You picked {a[1]}</div><div class="text-xs text-muted-foreground">Worth 8 pts if correct (QF, example scoring)</div></div>{badge("Pending","outline")}</div>'''
    cov = "".join(f'<a href="#" class="flex gap-3 border-b px-4 py-2.5 last:border-0 hover:bg-accent/50"><div class="ph-photo size-12 shrink-0 rounded"></div><div class="min-w-0"><div class="kicker text-[10px] text-primary">Preview</div><div class="text-sm font-semibold leading-snug">{h}</div></div></a>' for h in ["Example preview: Three keys for the quarterfinal","Example: How the two teams got here"])
    groups = "".join(f'<div class="flex items-center gap-2 px-4 py-1.5 text-sm"><span class="w-5 font-display font-bold tabular">{r}</span><span class="flex-1 truncate">{n}</span><span class="tabular text-muted-foreground">{p} pts</span></div>' for r,n,p in [(1,"Example Entry A",112),(2,"You",104),(3,"Example Entry B",98)])
    return f'''<aside class="flex flex-col border-l bg-background {"" if compact else "h-full overflow-y-auto"}">
{sec("Matchup", "Quarterfinal 1 · Sat (example)")}
<div class="px-1">{big(a,1,1,"11-1",True)}<div class="flex items-center gap-3 px-4 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground"><span class="h-px flex-1 bg-border"></span>vs<span class="h-px flex-1 bg-border"></span></div>{big(b,8,9,"9-3")}</div>
{sec("Pick distribution")}{dist}
{sec("Your pick")}{yours}
{sec("Redshirt coverage")}<div>{cov}</div>
{sec("Office Pool (example)", '<a href="#" class="normal-case tracking-normal text-primary">Leaderboard →</a>')}<div class="pb-4">{groups}</div>
<p class="border-t px-4 py-3 text-[11px] text-muted-foreground">Results are entered by Redshirt staff. No live scores or external stats on this page.</p>
</aside>'''

def bracket_page():
    canvas, w, h = bracket_canvas()
    canvas_m, _, _ = bracket_canvas(mobile=True)
    nav_items = ["Bracket","My picks","Leaderboard","Groups","Rules"]
    sub = f'''<div class="border-b bg-background"><div class="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
<div><div class="kicker text-primary">Bracket Challenge · College Football</div><h1 class="font-display text-[1.9rem] font-extrabold uppercase leading-none">FCS 2026</h1></div>
<nav class="flex gap-5 text-sm font-semibold">{"".join(f'<a href="#" class="border-b-2 pb-1 {"border-primary text-foreground" if i==0 else "border-transparent text-muted-foreground hover:text-foreground"}">{t}</a>' for i,t in enumerate(nav_items))}</nav>
<div class="ml-auto flex items-center gap-2"><span class="text-xs text-muted-foreground">Viewing</span>{tabs(["Results + my picks","Most picked","Actual only"],0,"h-8 text-xs")}{button("","outline","icon-sm","share",attrs='aria-label="Share"')}</div></div></div>'''
    legend = '<div class="flex flex-wrap items-center gap-4 px-6 pb-3 text-[11px] text-muted-foreground"><span class="flex items-center gap-1.5"><span class="h-3 w-5 rounded-sm bg-up/15"></span>Winner (staff-entered)</span><span class="flex items-center gap-1.5"><span class="h-3 w-0.5 rounded-full bg-primary"></span>Your pick</span><span class="flex items-center gap-1.5"><span class="tabular font-semibold text-foreground">68%</span>share of entries picking that team</span><span class="flex items-center gap-1.5"><span class="size-3 rounded-sm ring-2 ring-primary"></span>Selected matchup</span><span class="ml-auto">Your entry: 104 pts · 21st of 3,412 (example)</span></div>'
    desktop = f'''<div class="hidden lg:block">{sub}
<div class="grid grid-cols-[minmax(0,1fr)_320px]" style="height:calc(100dvh - 4rem - 4.7rem - 21px)">
 <div class="overflow-auto bg-muted/50"><div class="pt-3">{legend}</div><div class="flex justify-center pb-8">{canvas}</div></div>
 {matchup_panel()}
</div></div>'''
    sub_m = f'''<div class="border-b bg-background px-4 pt-3"><div class="kicker text-primary">Bracket Challenge</div><div class="flex items-end justify-between"><h1 class="font-display text-[1.7rem] font-extrabold uppercase leading-none">FCS 2026</h1>{button("","outline","icon-sm","share",attrs='aria-label="Share"')}</div>
<nav class="mt-2 flex gap-5 overflow-x-auto text-sm font-semibold">{"".join(f'<a href="#" class="whitespace-nowrap border-b-2 pb-2 {"border-primary" if i==0 else "border-transparent text-muted-foreground"}">{t}</a>' for i,t in enumerate(nav_items[:4]))}</nav></div>'''
    mobile = f'''<div class="lg:hidden">{sub_m}
<div class="border-b bg-background px-4 py-2">{tabs(["Top half","Bottom half","Final"],0,"w-full text-xs",full=True)}</div>
<div class="h-[340px] overflow-auto bg-muted/50"><div style="width:{w*0.8:.0f}px;height:{h*0.8:.0f}px"><div class="origin-top-left" style="transform:scale(.8)">{canvas_m}</div></div></div>
<div class="flex items-center justify-between border-b px-4 py-2 text-[11px] text-muted-foreground"><span>Pinch or drag to explore · tap a game</span><span>104 pts · 21st</span></div>
{matchup_panel(compact=True)}<div class="h-16"></div></div>'''
    body = f"{header()}{desktop}{mobile}{bottom_nav(2)}"
    return page("FCS 2026 Bracket Challenge", body, path="/college/football/bracket-challenge/fcs/2026")

# =====================================================================
# News index and division news
# =====================================================================
MORE = STORIES + [("FBS","Example headline about an FBS program's schedule change","Placeholder dek.","Writer Two","11h"),
                  ("Transfer Portal","Example: Portal storyline headline for an FCS program","Placeholder dek.","Writer Six","12h"),
                  ("Recruiting","Example: Commitment story headline (example)","Placeholder dek.","Writer Three","13h")]

def most_read():
    return card(card_header("Most read", "Past 24 hours") + card_content('<ol class="grid gap-0">' + "".join(f'<li class="flex gap-3 border-b py-2.5 last:border-0"><span class="font-display text-2xl font-extrabold leading-none text-primary tabular">{i+1}</span><a href="#" class="text-sm font-semibold leading-snug hover:underline">{s[1]}</a></li>' for i, s in enumerate(MORE[2:7])) + '</ol>', "pb-3 pt-2"), "gap-0")

def top_grid():
    lead = MORE[0]; subs = MORE[1:4]
    return f'''<section class="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
<article class="group">{photo("Lead photo placeholder","aspect-[16/9]","rounded-xl")}<div class="kicker mt-3 text-primary">{lead[0]} · Analysis</div><h2 class="mt-1 font-display text-headline font-extrabold uppercase group-hover:underline">{lead[1]}</h2><p class="mt-2 text-muted-foreground">{lead[2]}</p><div class="mt-2 text-xs text-muted-foreground">{lead[3]} · {lead[4]} ago</div></article>
<div class="grid content-start gap-4">{"".join(f'<article class="group grid grid-cols-[7rem_1fr] gap-3 border-b pb-4 last:border-0">{photo("Photo","aspect-[4/3]","rounded-lg")}<div><div class="kicker text-primary">{s[0]}</div><h3 class="mt-1 font-display text-lg font-bold leading-tight group-hover:underline">{s[1]}</h3><div class="mt-1 text-xs text-muted-foreground">{s[3]} · {s[4]} ago</div></div></article>' for s in subs)}</div></section>'''

def news_index():
    divs = ["All","FBS","FCS","Division II","Division III","NAIA"]
    river = "".join(river_item(s, i) for i, s in enumerate(MORE[3:10]))
    body = f'''{ticker()}{header()}
<main class="mx-auto max-w-site px-4 lg:px-6">
 <div class="pt-5">{crumbs(["College","Football","News"])}<div class="mt-3 flex flex-wrap items-end justify-between gap-3"><h1 class="font-display text-[2.4rem] font-extrabold uppercase leading-none lg:text-headline-lg">College Football News</h1>{button("Follow College Football","outline","sm","star")}</div>
 <div class="mt-4">{chip_links(divs,"All")}</div><p class="mt-2 text-[11px] text-muted-foreground">Division chips are links to <span class="font-mono">/college/football/{{division}}/news</span> (paths, not filters).</p></div>
 <div class="mt-5">{top_grid()}</div>
 <div class="my-8 flex justify-center">{ad(970,90,"Ad · 970×90 / 320×100 · reserved")}</div>
 <div class="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
  <div><div class="flex items-center justify-between border-b pb-3"><h2 class="font-display text-2xl font-extrabold uppercase">Latest</h2><span class="text-xs text-muted-foreground">Page 1 of 48</span></div><div class="divide-y">{river}</div>
   <div class="grid gap-3 pt-4">{button("Load more stories","outline","default",cls="w-full")}{pagination(1,48)}</div></div>
  <aside class="grid content-start gap-6">{most_read()}{rankings_widget(10)}{ad(300,250)}{newsletter_card()}</aside>
 </div>
</main>{footer()}{bottom_nav(0)}'''
    return page("College Football News", body, path="/college/football/news")

def division_news():
    confs = ["All conferences","Big Sky","CAA","MVFC","SoCon","Patriot","UAC","Southland","Big South-OVC"]
    river = "".join(river_item(s, i) for i, s in enumerate([MORE[i % len(MORE)] for i in range(4, 12)]))
    band = f'''<div class="border-b bg-gradient-to-b from-muted/60 to-background"><div class="mx-auto max-w-site px-4 pb-0 pt-5 lg:px-6">{crumbs(["College","Football","FCS","News"])}
<div class="mt-3 flex flex-wrap items-end justify-between gap-3"><div><div class="kicker text-primary">Football Championship Subdivision</div><h1 class="font-display text-[2.4rem] font-extrabold uppercase leading-none lg:text-headline-lg">FCS News</h1></div>{"" if PHASE1 else '<div class="flex gap-2">'+button("Following FCS","secondary","sm","check")+button("","outline","icon-sm","bell",attrs='aria-label="Alerts"')+'</div>'}</div>
{path_tabs([("Home","/college/football/fcs"),("News","/college/football/fcs/news"),("Rankings","/college/football/rankings/fcs"),*([] if PHASE1 else [("Bracket Challenge","/college/football/bracket-challenge/fcs"),("Transfer Portal","/college/football/transfer-portal")]),("Conferences","/college/football/conferences")],1,"mt-5 border-b-0")}</div></div>'''
    body = f'''{ticker()}{header()}{band}
<main class="mx-auto max-w-site px-4 lg:px-6">
 <div class="pt-4">{chip_links(confs,"All conferences")}<p class="mt-2 text-[11px] text-muted-foreground">Conference chips link to <span class="font-mono">/college/football/conferences/{{conf}}</span>.</p></div>
 <div class="grid gap-8 pt-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
  <div><div class="flex items-center justify-between border-b pb-3"><h2 class="font-display text-2xl font-extrabold uppercase">Page 2</h2><span class="text-xs text-muted-foreground">Stories 25–48 of 1,130 (example)</span></div><div class="divide-y">{river}</div>
   <div class="pt-4">{pagination(2,48)}</div>
   <p class="mt-3 text-center text-[11px] text-muted-foreground">Canonical: <span class="font-mono">/college/football/fcs/news?page=2</span> · page 1 has no parameter</p></div>
  <aside class="grid content-start gap-6">{rankings_widget(10, False)}{bracket_cta()}{ad(300,250)}{most_read()}</aside>
 </div>
</main>{footer()}{bottom_nav(0)}'''
    return page("FCS News · Page 2", body, path="/college/football/fcs/news?page=2")

# =====================================================================
# Transfer portal and recruiting hubs (article-driven)
# =====================================================================
def storyline_cards(items):
    return '<div class="grid gap-3 sm:grid-cols-3">' + "".join(f'''<a href="#" class="group rounded-xl border bg-card p-4 hover:bg-accent/40"><div class="kicker text-primary">Storyline</div><div class="mt-1 font-display text-xl font-bold uppercase leading-tight group-hover:underline">{t}</div><p class="mt-1 text-sm text-muted-foreground">{d}</p><div class="mt-3 flex items-center gap-2 text-xs text-muted-foreground">{icon("news","size-3.5")}{n} stories · updated {u}</div></a>''' for t, d, n, u in items) + '</div>'

def hub_band(kicker, title, dek, tabs_items, active, follow_label):
    return f'''<div class="border-b bg-ink text-ink-foreground"><div class="mx-auto max-w-site px-4 pt-5 lg:px-6"><nav class="flex items-center gap-1 text-xs text-ink-foreground/60">College{icon("chev-right","size-3")}Football{icon("chev-right","size-3")}<span class="text-ink-foreground">{title}</span></nav>
<div class="mt-3 flex flex-wrap items-end justify-between gap-3"><div><div class="kicker text-primary">{kicker}</div><h1 class="font-display text-[2.4rem] font-extrabold uppercase leading-none lg:text-headline-lg">{title}</h1><p class="mt-2 max-w-2xl text-sm text-ink-foreground/75">{dek}</p></div>
<div class="flex gap-2">{button(follow_label,"default","sm","bell")}</div></div>
<nav class="mt-5 flex gap-6 overflow-x-auto">{"".join(f'<a href="#" class="whitespace-nowrap border-b-2 pb-3 text-sm font-semibold {"border-primary text-ink-foreground" if i==active else "border-transparent text-ink-foreground/60 hover:text-ink-foreground"}">{t}</a>' for i,t in enumerate(tabs_items))}</nav></div></div>'''

def tracker_table(rows, kind="portal"):
    st = {"Entered":"outline","Committed":"default","Withdrawn":"muted","Signed":"secondary"}
    trs = "".join(f'''<tr class="border-b hover:bg-muted/50"><td class="p-2 pl-4 font-medium">{n}</td><td class="p-2 text-muted-foreground">{p}</td>
<td class="hidden p-2 sm:table-cell"><div class="flex items-center gap-2">{team_mark(fa,"size-5 text-[7px]")}<span class="truncate">{short(f)}</span></div></td>
<td class="p-2"><div class="flex items-center gap-2">{team_mark(ta,"size-5 text-[7px]") if ta else '<span class="size-5"></span>'}<span class="truncate">{short(to) if to else "—"}</span></div></td>
<td class="p-2">{badge(s, st[s])}</td><td class="hidden p-2 text-muted-foreground md:table-cell">{d}</td><td class="p-2 pr-4 text-right"><a href="#" class="text-xs font-medium text-primary hover:underline">Story</a></td></tr>''' for n,p,fa,f,ta,to,s,d in rows)
    head_from = "From" if kind == "portal" else "High school"
    return f'''<div class="overflow-x-auto rounded-xl border bg-card"><table class="w-full text-sm"><thead><tr class="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground"><th class="h-9 p-2 pl-4">Name</th><th class="p-2">Pos</th><th class="hidden p-2 sm:table-cell">{head_from}</th><th class="p-2">{"To" if kind=="portal" else "Committed to"}</th><th class="p-2">Status</th><th class="hidden p-2 md:table-cell">Date</th><th class="p-2 pr-4"></th></tr></thead><tbody>{trs}</tbody></table>
<div class="flex flex-wrap items-center gap-3 border-t px-4 py-2.5 text-[11px] text-muted-foreground">{icon("info","size-3.5")}Editor-maintained in Sanity, not exhaustive. Rows link to a Redshirt story when there is one. Last updated Oct 13 (example).<a href="#" class="ml-auto font-medium text-primary">Full list →</a></div></div>'''

def portal_page():
    rows = [("Example Player A","QB","SIU","S. Illinois","MSU","Montana State","Committed","Oct 12"),
            ("Example Player B","WR","UCD","UC Davis",None,None,"Entered","Oct 11"),
            ("Example Player C","LB","YSU","Youngstown State","NDSU","North Dakota State","Committed","Oct 10"),
            ("Example Player D","OL","LEH","Lehigh",None,None,"Withdrawn","Oct 9"),
            ("Example Player E","CB","FUR","Furman","MER","Mercer","Committed","Oct 8")]
    river = "".join(river_item(("Transfer Portal",) + s[1:], i) for i, s in enumerate(MORE[1:6]))
    lead = MORE[8]
    body = f'''{ticker()}{header()}{hub_band("Hub · article-driven","Transfer Portal","Every Redshirt story on players moving in and out of FCS, D-II and D-III programs. Follow a team to get its portal news first.",["All","FCS","D-II","D-III","Storylines","Tracker"],0,"Portal alerts")}
<main class="mx-auto max-w-site px-4 lg:px-6">
 <div class="grid grid-cols-1 gap-8 pt-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
  <div class="grid min-w-0 grid-cols-1 content-start gap-8">
   <article class="group grid gap-4 sm:grid-cols-[1.3fr_1fr]">{photo("Lead photo placeholder","aspect-video","rounded-xl")}<div><div class="kicker text-primary">Transfer Portal · Analysis</div><h2 class="mt-1 font-display text-headline font-extrabold uppercase group-hover:underline">{lead[1]}</h2><p class="mt-2 text-sm text-muted-foreground">Placeholder dek for the lead portal story.</p><div class="mt-2 text-xs text-muted-foreground">Writer Six · 1h ago</div></div></article>
   <section><div class="mb-3 flex items-center justify-between"><h2 class="font-display text-2xl font-extrabold uppercase">Storylines</h2>{button("All storylines","link","sm",icon_right="chev-right")}</div>
    {storyline_cards([("FCS → FBS moves","Placeholder: who is leaving for the FBS and what it means.",14,"2h"),("Big Sky window","Placeholder: conference-wide portal roundup.",9,"5h"),("Quarterback carousel","Placeholder: starting QBs on the move.",11,"1d")])}</section>
   <section><div class="mb-3 flex items-center justify-between"><h2 class="font-display text-2xl font-extrabold uppercase">Tracker</h2>{button("Full tracker","outline","sm",icon_right="chev-right")}</div>{__import__("pages3").tracker_list(__import__("pages3").ENTRIES[:4])}<p class="mt-2 text-[11px] text-muted-foreground">Latest four entries. Story links appear when Redshirt has a story on the player; not every entry has one. The full tracker with filters lives at <span class="font-mono">/transfer-portal</span>.</p></section>
   <section><div class="flex items-center justify-between border-b pb-3"><h2 class="font-display text-2xl font-extrabold uppercase">Latest portal news</h2></div><div class="divide-y">{river}</div><div class="pt-4">{pagination(1,12)}</div></section>
  </div>
  <aside class="grid content-start gap-6">
   {card(card_header("Your teams in the portal","From teams you follow")+card_content("".join(f'<a href="#" class="flex items-center gap-3 border-b py-2.5 last:border-0">{team_mark(a,"size-8")}<div class="flex-1"><div class="text-sm font-semibold">{n}</div><div class="text-xs text-muted-foreground">{k} portal stories this month (example)</div></div>{icon("chev-right","size-4 text-muted-foreground")}</a>' for a,n,k in [("MSU","Montana State",4),("NOVA","Villanova",2)]),"pb-3 pt-1"),"gap-0")}
   {card(card_header("Key dates","Editor-entered (example)")+card_content('<ul class="grid gap-2 text-sm">'+"".join(f'<li class="flex justify-between"><span>{a}</span><span class="text-muted-foreground">{b}</span></li>' for a,b in [("Window opens","Example date"),("Window closes","Example date"),("Spring window","Example date")])+'</ul>',"pb-5 pt-2"),"gap-0")}
   {ad(300,250)}{newsletter_card()}
  </aside>
 </div>
</main>{footer()}{bottom_nav(0)}'''
    return page("Transfer Portal", body, path="/college/football/transfer-portal")

def recruiting_page():
    commits = [("MSU","Montana State","Example Recruit A","QB","Example High School, MT"),("NDSU","North Dakota State","Example Recruit B","OL","Example High School, ND"),
               ("NOVA","Villanova","Example Recruit C","WR","Example High School, PA"),("UM","Montana","Example Recruit D","DE","Example High School, WA")]
    cc = '<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">' + "".join(f'''<a href="#" class="group overflow-hidden rounded-xl border bg-card hover:bg-accent/40">{photo("Commit photo","aspect-[16/9]","rounded-none")}<div class="p-3"><div class="flex items-center gap-2">{team_mark(a,"size-6 text-[7px]")}<span class="kicker text-primary">Commit · {short(sn)}</span></div><div class="mt-1 font-display text-lg font-bold uppercase leading-tight group-hover:underline">{p} commits to {short(sn)} (example)</div><div class="mt-1 text-xs text-muted-foreground">{pos} · {hs}</div></div></a>''' for a, sn, p, pos, hs in commits) + '</div>'
    rows = [("Example Recruit A","QB","ETA","Example HS",'MSU','Montana State',"Committed","Oct 12"),("Example Recruit B","OL","ETB","Example HS","NDSU","North Dakota State","Committed","Oct 10"),("Example Recruit E","RB","ETC","Example HS","SDSU","South Dakota State","Signed","Oct 2")]
    river = "".join(river_item(("Recruiting",) + s[1:], i) for i, s in enumerate(MORE[2:6]))
    body = f'''{ticker()}{header()}{hub_band("Hub · article-driven","Recruiting","Commitments, signing day and recruiting storylines across FCS, D-II and D-III, told through Redshirt reporting.",["All","Commits","Signing day","Storylines","By team"],0,"Commit alerts")}
<main class="mx-auto max-w-site px-4 lg:px-6">
 <section class="pt-6"><div class="mb-3 flex items-center justify-between"><h2 class="font-display text-2xl font-extrabold uppercase">Latest commitments coverage</h2>{button("All commit stories","link","sm",icon_right="chev-right")}</div>{cc}</section>
 <div class="grid grid-cols-1 gap-8 pt-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
  <div class="grid min-w-0 grid-cols-1 content-start gap-8">
   <div class="relative overflow-hidden rounded-xl border bg-ink p-5 text-ink-foreground"><div class="absolute -right-10 -top-10 size-44 rounded-full bg-primary/30 blur-2xl"></div><div class="relative grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"><div><div class="kicker text-primary">Package · Signing day</div><div class="mt-1 font-display text-3xl font-extrabold uppercase leading-none">Signing Day 2026 (example)</div><p class="mt-2 text-sm text-ink-foreground/75">Placeholder: class roundups by conference, team-by-team stories and analysis.</p></div>{button("Open package","default","sm",icon_right="chev-right")}</div></div>
   <section><h2 class="mb-3 font-display text-2xl font-extrabold uppercase">Storylines</h2>{storyline_cards([("In-state battles","Placeholder: programs competing for the same region.",7,"1d"),("Junior college pipeline","Placeholder: JUCO additions to watch.",5,"3d"),("Walk-on to scholarship","Placeholder: development stories.",4,"1w")])}</section>
   <section><div class="mb-3 flex items-center justify-between"><h2 class="font-display text-2xl font-extrabold uppercase">Commits list</h2>{select_("All teams","h-8 text-xs")}</div>{tracker_table(rows,"recruiting")}</section>
   <section><div class="border-b pb-3"><h2 class="font-display text-2xl font-extrabold uppercase">Latest recruiting news</h2></div><div class="divide-y">{river}</div><div class="pt-4">{pagination(1,9)}</div></section>
  </div>
  <aside class="grid content-start gap-6">{most_read()}{ad(300,250)}{card(card_content(f'<div class="flex items-center gap-3"><span class="flex size-9 items-center justify-center rounded-full bg-accent text-primary">{icon("star")}</span><div class="flex-1 text-sm"><div class="font-semibold">Follow your team</div><div class="text-muted-foreground">Commit stories go to your For you feed and My Teams email.</div></div></div>',"py-4"))}{newsletter_card()}</aside>
 </div>
</main>{footer()}{bottom_nav(0)}'''
    return page("Recruiting", body, path="/college/football/recruiting")

# =====================================================================
# Sport-agnostic team hub: /college/teams/montana-state-bobcats/football
# =====================================================================
def team_hub():
    hist = [12,9,8,6,5,4,2]; w,h = 420,190
    X = lambda i: 20+i*(w-40)/(len(hist)-1); Y = lambda r: 10+(r-1)*(h-20)/13
    chart = f'<svg viewBox="0 0 {w} {h+20}" class="w-full" role="img" aria-label="Poll rank by week (example)"><line x1="20" x2="{w-20}" y1="10" y2="10" class="stroke-border"/><line x1="20" x2="{w-20}" y1="{h-10}" y2="{h-10}" class="stroke-border"/><polyline points="{" ".join(f"{X(i):.0f},{Y(r):.0f}" for i,r in enumerate(hist))}" fill="none" class="stroke-primary" stroke-width="2.5"/>' + "".join(f'<circle cx="{X(i):.0f}" cy="{Y(r):.0f}" r="4" class="fill-primary"/><text x="{X(i):.0f}" y="{Y(r)-9:.0f}" text-anchor="middle" class="fill-foreground text-[11px] font-semibold">{r}</text>' for i,r in enumerate(hist)) + "".join(f'<text x="{X(i):.0f}" y="{h+12}" text-anchor="middle" class="fill-muted-foreground text-[10px]">{l}</text>' for i,l in enumerate(["Pre","W1","W2","W3","W4","W5","W6"])) + '</svg>'
    links = "".join(f'<a href="#" class="group flex items-center gap-3 rounded-lg border bg-card p-3 hover:bg-accent"><span class="flex size-9 items-center justify-center rounded-md bg-muted">{icon(ic,"size-4")}</span><div class="flex-1"><div class="text-sm font-semibold">{t}</div><div class="text-xs text-muted-foreground">Opens on example-athletics.edu</div></div>{icon("ext","size-4 text-muted-foreground group-hover:text-foreground")}</a>' for ic,t in [("clock","Football schedule & scores"),("users","Football roster"),("list","Stats"),("star","Tickets")])
    river = "".join(river_item(s, i) for i, s in enumerate(STORIES[:5]))
    sports = [("Overview","/college/teams/montana-state-bobcats"),("Football","/college/teams/montana-state-bobcats/football"),("Men's Basketball","/college/teams/montana-state-bobcats/mens-basketball"),("Women's Basketball","/college/teams/montana-state-bobcats/womens-basketball"),("All news","/college/teams/montana-state-bobcats/news")]
    sub = [("Overview","/college/teams/montana-state-bobcats/football"),("News","/college/teams/montana-state-bobcats/football/news"),("Rankings","/college/teams/montana-state-bobcats/football/rankings")]
    other = card(card_header("Other Bobcats sports")+card_content("".join(f'<a href="#" class="flex items-center gap-3 border-b py-2.5 last:border-0">{icon(ic,"size-4 text-muted-foreground")}<div class="flex-1"><div class="text-sm font-semibold">{t}</div><div class="text-xs text-muted-foreground">{d}</div></div>{icon("chev-right","size-4 text-muted-foreground")}</a>' for ic,t,d in [("trophy","Men's Basketball","Latest: example headline · Division I"),("trophy","Women's Basketball","Latest: example headline · Division I")]),"pb-3 pt-1"),"gap-0")
    body = f'''{ticker()}{header()}
<div class="border-b bg-gradient-to-b from-muted/60 to-background">
 <div class="mx-auto max-w-site px-4 pt-5 lg:px-6">{crumbs(["Teams","Montana State Bobcats","Football"])}
  <div class="mt-4 flex flex-wrap items-center gap-4">{team_mark("MSU","size-16 lg:size-20 text-base")}
   <div class="flex-1"><div class="kicker text-muted-foreground">Big Sky · Bozeman, MT (example)</div><h1 class="font-display text-[2.4rem] font-extrabold uppercase leading-none lg:text-headline-lg">Montana State Bobcats</h1>
   <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">{badge("Football: No. 2 FCS Top 25","default")}{badge("6-0 (admin-entered)","secondary")}{badge("Men's hoops: D-I","outline")}</div></div>
   <div class="flex gap-2 {"hidden" if PHASE1 else ""}">{button("Following","secondary","default","check")}{button("","outline","icon","bell",attrs='aria-label="Alerts"')}</div></div>
  {path_tabs(sports,1,"mt-6 border-b-0")}
 </div></div>
<div class="border-b bg-background"><div class="mx-auto flex max-w-site items-center gap-2 px-4 py-2 lg:px-6"><span class="mr-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Football</span>{"".join(badge(t,"secondary" if i==0 else "outline","h-7 px-2.5 cursor-pointer") for i,(t,_) in enumerate(sub))}<span class="ml-auto hidden font-mono text-[11px] text-muted-foreground sm:block">/college/teams/montana-state-bobcats/football</span></div></div>
<main class="mx-auto max-w-site px-4 lg:px-6">
 <div class="grid grid-cols-1 gap-8 pt-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
  <div><div class="grid gap-4 sm:grid-cols-[1.4fr_1fr]"><article>{photo("Lead photo placeholder","aspect-video","rounded-xl")}<div class="kicker mt-3 text-primary">Bobcats football</div><h2 class="font-display text-headline-sm font-bold sm:text-headline">Example team headline for the hub lead slot</h2></article>
   {card(card_header("Poll history","Redshirt FCS Top 25 · 2026 (example)")+card_content(chart,"pb-4 pt-2"),"gap-0")}</div>
   <div class="mt-6 flex items-center justify-between border-b pb-3"><h2 class="font-display text-2xl font-extrabold uppercase">Latest football</h2>{button("All football news","link","sm",icon_right="chev-right")}</div><div class="divide-y">{river}</div><div class="pt-4">{pagination(1,22)}</div></div>
  <aside class="grid content-start gap-6">
   <div><div class="kicker mb-2 text-muted-foreground">Official links</div><div class="grid gap-2">{links}</div><p class="mt-2 text-xs text-muted-foreground">Redshirt doesn't host schedules, scores or rosters. These open the school's site.</p></div>
   {other}{ad(300,250)}
   {"" if PHASE1 else card(card_header("Bracket history","Redshirt Bracket Challenge")+card_content('<div class="text-sm text-muted-foreground">Example: Seeded in the 2025 FCS bracket; most-picked champion in example groups.</div>',"pb-5 pt-2"),"gap-0")}
  </aside>
 </div>
</main>{footer()}{bottom_nav(3)}'''
    return page("Montana State Bobcats Football (example)", body, path="/college/teams/montana-state-bobcats/football")
