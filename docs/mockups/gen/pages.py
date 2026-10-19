from layout import *

def rankings_widget(n=10, show_tabs=True):
    rows = "".join(f'''<li class="flex items-center gap-3 py-2"><span class="w-5 text-right font-display text-lg font-bold tabular">{i+1}</span>{team_mark(a)}<div class="min-w-0 flex-1"><div class="truncate text-sm font-semibold">{nm}</div><div class="text-xs text-muted-foreground">{r} · {c}</div></div><span class="w-9 text-right">{movement(MOVES[i])}</span></li>''' for i,(a,nm,c,r) in enumerate(TEAMS[:n]))
    return card(card_header("FCS Top 25", "Week 7 · example data", tabs(["FCS","FBS","D-II","D-III"],0,"h-8 text-xs") if show_tabs else button("All","ghost","xs",icon_right="chev-right")) + card_content(f'<ol class="divide-y">{rows}</ol>', "pt-2") + card_footer(f'<div class="flex w-full gap-2">{button("Full poll","outline","sm",cls="flex-1")}{button("Ballots","ghost","sm","eye",cls="flex-1")}</div>',"pt-3"), "gap-0")

def bracket_cta():
    return f'''<div class="relative overflow-hidden rounded-xl border bg-ink p-5 text-ink-foreground">
 <div class="absolute -right-8 -top-8 size-40 rounded-full bg-primary/30 blur-2xl"></div>
 <div class="relative"><div class="kicker text-primary">Bracket Challenge</div>
 <div class="mt-1 font-display text-3xl font-extrabold uppercase leading-none">FCS 2026</div>
 <p class="mt-2 text-sm text-ink-foreground/75">24 teams · 23 picks · groups with friends. Opens after selection day (example).</p>
 <div class="mt-4 flex gap-2">{button("Make your picks","default","sm",icon_right="chev-right")}{button("Create group","ghost","sm",cls="text-ink-foreground hover:bg-white/10 hover:text-ink-foreground")}</div></div></div>'''

def newsletter_card(compact=False):
    return card(card_header("The Redshirt Daily","One email, every weekday morning. Plus poll release alerts.") + card_content(f'<div class="flex gap-2">{input_("you@example.com")}{button("Subscribe")}</div><div class="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground"><label class="flex items-center gap-1.5">{checkbox(True)}Daily</label><label class="flex items-center gap-1.5">{checkbox(True)}Poll release</label><label class="flex items-center gap-1.5">{checkbox(False)}My teams</label></div>',"pb-5 pt-3"),"gap-0")

STORIES = [
 ("FCS","Example headline: Title race tightens as two unbeaten teams meet next week","Placeholder dek describing the story in one sentence for layout purposes.","Writer One","2h"),
 ("Rankings","Example: What changed in this week's Top 25 and why voters moved","Placeholder dek.","Writer Two","3h"),
 ("D-II","Example feature headline about a program's rebuild","Placeholder dek.","Writer Three","5h"),
 ("Basketball","Example preseason storyline headline for women's hoops","Placeholder dek.","Writer Four","6h"),
 ("FCS","Example analysis: Three things the committee will weigh","Placeholder dek.","Writer One","8h"),
 ("D-III","Example notebook: Around the conferences in Week 7","Placeholder dek.","Writer Five","9h"),
 ("Podcast","Example episode: Poll reaction and bracket outlook","Placeholder dek.","Host One","10h"),
]

def river_item(s, i, mobile_compact=False):
    k,h,d,w,t = s
    return f'''<article class="group grid grid-cols-[1fr_7.5rem] gap-4 py-4 sm:grid-cols-[1fr_11rem]">
  <div class="min-w-0"><div class="kicker text-primary">{k}</div><h3 class="mt-1 font-display text-headline-sm font-bold group-hover:underline decoration-2 underline-offset-2">{h}</h3>
  <p class="mt-1 hidden text-sm text-muted-foreground sm:block">{d}</p>
  <div class="mt-2 flex items-center gap-2 text-xs text-muted-foreground">{avatar("".join(x[0] for x in w.split()),"size-5")}{w}<span>·</span>{t} ago<button class="ml-auto opacity-60 hover:opacity-100" aria-label="Save">{icon("bookmark","size-4")}</button></div></div>
  {photo("Photo","aspect-[4/3]","rounded-md")}
</article>'''

def follow_prompt():
    chips = "".join(badge(team_mark(a,"size-4")+" "+n,"outline","gap-1.5 py-1 px-2 text-[13px] cursor-pointer hover:bg-accent") for a,n,_,_ in TEAMS[:5])
    return f'''<div class="mx-auto max-w-site px-4 pt-4 lg:px-6"><div class="flex flex-col gap-3 rounded-xl border border-primary/25 bg-accent/50 px-4 py-3 sm:flex-row sm:items-center">
 <div class="flex items-center gap-2 text-sm font-semibold">{icon("star","size-4 text-primary")}Follow your teams to personalize Redshirt</div>
 <div class="-mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1 sm:flex-wrap">{chips}{badge(icon("plus","size-3")+"More","secondary","py-1")}</div>
 <button class="self-end text-muted-foreground hover:text-foreground sm:self-auto" aria-label="Dismiss">{icon("x")}</button></div></div>'''

def home():
    lead = f'''<article class="group">
  {photo("Lead photo placeholder","aspect-[16/9] lg:aspect-[2/1]","rounded-xl")}
  <div class="kicker mt-4 text-primary">FCS · Analysis (example)</div>
  <h1 class="mt-1 font-display text-headline font-extrabold uppercase lg:text-headline-lg group-hover:underline decoration-4 underline-offset-4">Example lead headline: The unbeaten showdown that could decide the No. 1 seed</h1>
  <p class="mt-3 max-w-2xl text-base text-muted-foreground lg:text-lg">Placeholder dek for the lead story. Two short lines that summarize why this matters this week.</p>
  <div class="mt-3 flex items-center gap-2 text-sm text-muted-foreground">{avatar("WO","size-6")}<span class="font-medium text-foreground">Writer One</span>·<span>1h ago</span>·<span>6 min read</span></div>
</article>'''
    secondary = "".join(f'''<article class="group grid grid-cols-[6.5rem_1fr] gap-3 border-b pb-4 last:border-0">{photo("Photo","aspect-[4/3]","rounded-lg")}<div><div class="kicker text-primary">{s[0]}</div><h2 class="mt-1 font-display text-lg font-bold leading-tight group-hover:underline">{s[1]}</h2><div class="mt-1 text-xs text-muted-foreground">{s[3]} · {s[4]} ago</div></div></article>''' for s in STORIES[1:6])
    river = "".join(river_item(s,i) for i,s in enumerate(STORIES))
    body = f'''{ticker()}{header()}{follow_prompt()}
<main class="mx-auto max-w-site px-4 lg:px-6">
 <section class="grid gap-6 pt-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-8">
   {lead}
   <div class="grid content-start gap-4 lg:border-l lg:pl-8"><div class="kicker text-muted-foreground">Top stories</div>{secondary}</div>
 </section>
 <div class="my-8 flex justify-center">{ad(970,90,"Ad · 970×90 desktop / 320×100 mobile · space reserved")}</div>
 <section class="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
   <div><div class="flex items-center justify-between border-b pb-3"><h2 class="font-display text-2xl font-extrabold uppercase">Latest</h2>{tabs(["For you","All","FCS","D-II","D-III","Hoops"],0,"hidden sm:inline-flex")}</div><div class="divide-y">{river}</div><div class="pt-4">{button("Load more stories","outline","default",cls="w-full")}</div></div>
   <aside class="grid content-start gap-6">{rankings_widget()}{bracket_cta()}{ad(300,250)}{newsletter_card()}</aside>
 </section>
</main>{footer()}{bottom_nav(0)}{mobile_sheet()}'''
    return page("Home", body, path="/")

def article():
    para = lambda t: f'<p>{t}</p>'
    body_text = "".join([
      para("This is placeholder body copy for the article template. It shows the reading measure, line height and serif body face. No facts, quotes or statistics in this mockup are real."),
      para("A second paragraph continues the placeholder text so the rhythm of the page is visible. Editors would write the answer-first lede here: who, what, when, and why it matters."),
      '<h2 class="font-display text-3xl font-bold uppercase not-prose mt-8 mb-2">Example subhead</h2>',
      para("More placeholder copy. Links to <a href='#' class='text-primary underline underline-offset-2'>team hubs</a> and <a href='#' class='text-primary underline underline-offset-2'>the current poll</a> show internal linking style."),
    ])
    inline_poll = f'''<div class="not-prose my-6 rounded-xl border bg-card p-4"><div class="flex items-center justify-between"><div class="kicker text-primary">Poll embed · FCS Top 5 (example)</div><a href="#" class="text-xs font-medium text-primary">Full poll →</a></div><ol class="mt-2 divide-y">{"".join(f"<li class='flex items-center gap-3 py-1.5 text-sm'><span class='w-4 font-display text-base font-bold'>{i+1}</span>{team_mark(a,'size-6')}<span class='flex-1 font-medium'>{n}</span>{movement(MOVES[i])}</li>" for i,(a,n,_,_) in enumerate(TEAMS[:5]))}</ol></div>'''
    up_next = f'''<section class="mt-12 border-t-4 border-primary pt-4" aria-label="Up next"><div class="kicker text-muted-foreground">Up next · keeps scrolling</div>
      <div class="mt-3 grid grid-cols-[1fr_8rem] gap-4 sm:grid-cols-[1fr_12rem]"><div><div class="kicker text-primary">Rankings</div><h2 class="font-display text-headline-sm font-bold sm:text-headline">{STORIES[1][1]}</h2><p class="mt-1 text-sm text-muted-foreground">Next article loads in place as you reach the end (URL and analytics update).</p></div>{photo("Photo","aspect-[4/3]")}</div></section>'''
    rail = f'''<aside class="hidden content-start gap-6 lg:grid"><div class="sticky top-24 grid gap-6">{ad(300,250)}{rankings_widget(5, False)}{card(card_header("More from Writer One")+card_content("".join(f"<a href=# class='block border-b py-2.5 text-sm font-semibold last:border-0 hover:underline'>{s[1]}</a>" for s in STORIES[2:5]),"pb-3"),"gap-0")}</div></aside>'''
    body = f'''{ticker()}{header()}
<main class="mx-auto max-w-site px-4 lg:px-6">
 <nav class="flex items-center gap-1 pt-5 text-xs text-muted-foreground" aria-label="Breadcrumb"><a href="#">College Football</a>{icon("chev-right","size-3")}<a href="#">FCS</a>{icon("chev-right","size-3")}<span class="text-foreground">News</span></nav>
 <div class="grid gap-10 pt-4 lg:grid-cols-[minmax(0,1fr)_300px]">
  <article>
   <div class="kicker text-primary">FCS · Analysis (example)</div>
   <h1 class="mt-2 max-w-4xl font-display text-[2.4rem] font-extrabold uppercase leading-[0.98] lg:text-headline-lg">Example article headline set in the condensed display face for impact</h1>
   <p class="mt-4 max-w-3xl font-serif text-xl text-muted-foreground">Placeholder dek in the serif face. One or two sentences that set up the story without repeating the headline.</p>
   <div class="mt-5 flex flex-wrap items-center gap-3 border-y py-3">
     {avatar("WO","size-10")}<div class="text-sm"><div class="font-semibold">By <a href="#" class="hover:underline">Writer One</a> {badge("Follow","outline","ml-1 cursor-pointer")}</div><div class="text-muted-foreground">Oct 14, 2026 · 6 min read · Updated 1h ago</div></div>
     <div class="ml-auto flex gap-1">{button("","outline","icon-sm","bookmark",attrs='aria-label="Save"')}{button("","outline","icon-sm","share",attrs='aria-label="Share"')}</div>
   </div>
   <figure class="mt-6">{photo("Hero photo placeholder · 1920×1080 source","aspect-video","rounded-xl")}<figcaption class="mt-2 text-xs text-muted-foreground">Caption placeholder. Photo: Credit placeholder</figcaption></figure>
   <div class="mx-auto mt-8 max-w-prose font-serif text-[1.15rem] leading-[1.7] [&_p]:mb-5">
     {body_text}
     <div class="not-prose my-6 flex justify-center">{ad(300,250,"In-article ad · 300×250 · reserved (no CLS)")}</div>
     {para("Placeholder copy after the ad. Ads sit between paragraphs in fixed-height containers so text never jumps.")}
     {inline_poll}
     {para("Closing placeholder paragraph.")}
     <div class="not-prose mt-6 flex flex-wrap gap-2">{badge("Montana State (example)","secondary")}{badge("Big Sky","secondary")}{badge("FCS Playoffs","secondary")}</div>
     <div class="not-prose mt-8">{card(card_content(f'<div class="flex flex-col gap-3 sm:flex-row sm:items-center"><div class="flex-1"><div class="font-display text-xl font-bold uppercase">Get Montana State news (example)</div><p class="text-sm text-muted-foreground">Follow the team for a personalized feed, newsletter and alerts.</p></div>{button("Follow team","default","default","star")}</div>',"py-5"))}</div>
   </div>
   {up_next}
  </article>
  {rail}
 </div>
</main>{footer()}{bottom_nav(0)}'''
    return page("Article", body, path="/college/football/news/example-article-slug")

def pts(i):  # example points for 25 voters
    return max(0, 625 - i*24 - (i*i)//3)

# ---------------- Bracket ----------------
SEEDS = TEAMS[:8]; UNS = TEAMS[8:24]
R1 = [(UNS[2*i], UNS[2*i+1]) for i in range(8)]
R1_PICK = [0,1,0,0,1,0,1,0]
R2_ORDER = [0,7,3,4,1,6,2,5]   # seed index faced by R1 winner i
def slot(team, seed=None, picked=False, tbd=False, lost=False):
    if tbd:
        return f'<div class="flex h-8 items-center gap-2 px-2 text-xs text-muted-foreground/70 italic">Winner of earlier game</div>'
    a,n,_,_ = team
    st = "bg-accent text-accent-foreground font-semibold" if picked else ("text-muted-foreground" if lost else "")
    return f'<button class="flex h-8 w-full items-center gap-2 px-2 text-left text-[13px] {st} hover:bg-accent/70"><span class="w-4 text-right text-[11px] text-muted-foreground tabular">{seed or ""}</span>{team_mark(a,"size-5")}<span class="truncate flex-1">{n}</span>{icon("check","size-3.5 text-primary") if picked else ""}</button>'
def game(top, bot, label, cls=""):
    return f'<div class="w-full overflow-hidden rounded-md border bg-card shadow-xs {cls}"><div class="flex items-center justify-between border-b bg-muted/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"><span>{label}</span><span>Sat · TBD</span></div>{top}<div class="h-px bg-border"></div>{bot}</div>'

def bracket_data():
    r1 = []; r1w=[]
    for i,(t,b) in enumerate(R1):
        p=R1_PICK[i]; w = t if p==0 else b; r1w.append(w)
        r1.append(game(slot(t,picked=p==0,lost=p==1),slot(b,picked=p==1,lost=p==0),f"R1 · G{i+1}"))
    r2=[]; r2w=[]
    for i in range(8):
        s=R2_ORDER[i]; seedt=SEEDS[s]; w=r1w[i]
        pick_seed = i not in (3,6)
        r2w.append(seedt if pick_seed else w)
        r2.append(game(slot(seedt,s+1,picked=pick_seed,lost=not pick_seed),slot(w,picked=not pick_seed,lost=pick_seed),f"R2 · G{i+1}"))
    qf=[]; qfw=[]
    for i in range(4):
        t,b=r2w[2*i],r2w[2*i+1]
        if i<3: qfw.append(t); qf.append(game(slot(t,picked=True),slot(b,lost=True),f"QF {i+1}"))
        else: qfw.append(None); qf.append(game(slot(t),slot(b),f"QF {i+1}"))
    sf=[game(slot(qfw[0],picked=True),slot(qfw[1],lost=True),"SF 1"), game(slot(qfw[2]),slot(None,tbd=True),"SF 2")]
    f=[game(slot(qfw[0]),slot(None,tbd=True),"Championship","ring-2 ring-gold/60")]
    return r1,r2,qf,sf,f

def bracket():
    r1,r2,qf,sf,f = bracket_data()
    def col(title, games, w="w-[192px]"):
        return f'<div class="flex {w} shrink-0 flex-col"><div class="kicker mb-2 text-center text-muted-foreground">{title}</div><div class="flex flex-1 flex-col justify-around gap-2">{"".join(games)}</div></div>'
    champion = f'<div class="flex w-[170px] shrink-0 flex-col justify-center"><div class="rounded-xl border-2 border-gold/70 bg-card p-3 text-center"><div class="kicker text-gold">{icon("trophy","size-4 inline")} Champion</div><div class="mt-2 text-sm text-muted-foreground">Pick the final to crown a champion</div><div class="mt-3 text-left text-xs font-medium">Tiebreaker: total points in the final</div>{input_("e.g. 48","mt-1 h-8")}</div></div>'
    desktop = f'<div class="hidden overflow-x-auto pb-4 md:block"><div class="flex h-[730px] min-w-[1180px] gap-5">{col("First round",r1)}{col("Second round",r2)}{col("Quarterfinals",qf)}{col("Semifinals",sf)}{col("Final",f)}{champion}</div></div>'
    mobile = f'''<div class="md:hidden">
<div class="-mx-4 sticky top-14 z-20 border-b bg-background/95 px-4 py-2 backdrop-blur">{tabs(["R1 8/8","R2 8/8","QF 3/4","SF 1/2","Final"],1,"w-full text-xs",full=True)}</div>
<div class="mt-3 grid gap-3">{"".join(r2)}</div>
<div class="h-24"></div>
<div class="fixed inset-x-0 bottom-16 z-30 border-t bg-background/95 px-4 py-3 backdrop-blur"><div class="flex items-center gap-3"><div class="flex-1"><div class="flex justify-between text-xs font-medium"><span>20 of 23 picks</span><span class="text-muted-foreground">Locks in 3d 4h</span></div>{progress(87,"mt-1.5")}</div>{button("Save","default","sm")}</div></div>
</div>'''
    side = f'''<aside class="grid content-start gap-4">
 {card(card_header("Your entry","Example entry · not submitted")+card_content(f'<div class="flex justify-between text-sm"><span>Picks</span><span class="font-semibold tabular">20 / 23</span></div>{progress(87,"mt-2")}<div class="mt-4 grid gap-2">{alert("3 picks remaining","Quarterfinal 4, Semifinal 2 and the Final still need picks.","brand","alert")}</div>',"pt-3")+card_footer(f'<div class="flex w-full gap-2">{button("Save picks","default","default",cls="flex-1")}{button("","outline","icon","share",attrs="aria-label=Share")}</div>',"pt-4"),"gap-0")}
 {card(card_header("Your groups")+card_content("".join(f'<div class="flex items-center gap-3 border-b py-2.5 last:border-0">{avatar(g[:2].upper(),"size-8","bg-secondary text-secondary-foreground")}<div class="flex-1"><div class="text-sm font-semibold">{g}</div><div class="text-xs text-muted-foreground">{m} members · example</div></div>{icon("chev-right","size-4 text-muted-foreground")}</div>' for g,m in [("Office Pool (example)",14),("Big Sky Diehards (example)",37)]) + f'<div class="mt-3 flex gap-2">{button("Create group","secondary","sm",cls="flex-1")}{button("Join with code","outline","sm",cls="flex-1")}</div>',"pb-5 pt-2"),"gap-0")}
 {card(card_content(f'<div class="flex items-center gap-3"><span class="flex size-9 items-center justify-center rounded-full bg-accent text-primary">{icon("bell")}</span><div class="flex-1 text-sm"><div class="font-semibold">Lock reminder</div><div class="text-muted-foreground">Email + push 24h and 1h before lock</div></div>{switch(True)}</div>',"py-4"))}
</aside>'''
    strip = (card(card_content(f'<div class="flex items-center gap-4"><div class="flex-1"><div class="flex justify-between text-sm"><span class="font-semibold">Your entry · 20 / 23 picks</span><span class="text-muted-foreground">not submitted</span></div>{progress(87,"mt-2")}<div class="mt-2 text-xs text-muted-foreground">Still needed: QF 4, SF 2, Final · tiebreaker</div></div>{button("Save picks")}</div>',"py-4"))
      + card(card_content(f'<div class="flex items-center gap-3">{avatar("OP","size-9","bg-secondary text-secondary-foreground")}<div class="flex-1 text-sm"><div class="font-semibold">Office Pool (example)</div><div class="text-muted-foreground">14 members · +1 more group</div></div>{button("Create group","secondary","sm")}{button("Join","outline","sm")}</div>',"py-4"))
      + card(card_content(f'<div class="flex items-center gap-3"><span class="flex size-9 items-center justify-center rounded-full bg-accent text-primary">{icon("bell")}</span><div class="flex-1 text-sm"><div class="font-semibold">Lock reminders</div><div class="text-muted-foreground">Email + push 24h and 1h before lock</div></div>{switch(True)}</div>',"py-4")))
    body = f'''{header()}
<main class="mx-auto max-w-site px-4 lg:px-6">
 <div class="flex flex-wrap items-end justify-between gap-4 pt-6"><div><div class="kicker text-primary">Bracket Challenge</div><h1 class="font-display text-[2.4rem] font-extrabold uppercase leading-none lg:text-headline-lg">FCS 2026</h1><p class="mt-1 text-sm text-muted-foreground">24 teams · seeds 1–8 have first-round byes · picks lock at first kickoff (example)</p></div>
 <div class="hidden items-center gap-3 rounded-xl border bg-card px-4 py-2 md:flex">{icon("lock","size-4 text-muted-foreground")}<div class="text-sm"><div class="font-semibold">Locks in 3d 04h 12m</div><div class="text-xs text-muted-foreground">Sat, Nov 28 · 12:00 PM PT (example)</div></div></div></div>
 {underline_tabs(["Bracket","My picks","Leaderboard","Groups","Rules"],1,"mt-5")}
 <div class="hidden gap-4 pt-5 md:grid md:grid-cols-3">{strip}</div><div class="min-w-0 pt-5">{desktop}{mobile}</div><div class="hidden">{side}</div>
</main>{bottom_nav(2)}'''
    return page("Bracket Challenge · My picks", body, path="/college/football/bracket-challenge/fcs/2026/my-bracket")

def vote_header():
    return f'''<header class="sticky top-0 z-30 border-b bg-background/95 backdrop-blur"><div class="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
 <a href="#" class="flex items-center gap-2"><span class="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">{icon("vote","size-4")}</span><span class="font-display text-xl font-extrabold uppercase italic leading-none">Redshirt<span class="text-primary">Vote</span></span></a>
 {badge("vote.redshirtsports.com","muted","hidden sm:inline-flex font-mono")}
 <nav class="ml-6 hidden gap-1 md:flex">{button("Ballots","ghost","sm")}{button("History","ghost","sm")}{button("Profile","ghost","sm")}</nav>
 <div class="ml-auto flex items-center gap-2"><span class="hidden text-sm text-muted-foreground sm:inline">Example Voter</span>{avatar("EV","size-8","bg-primary/15 text-primary")}</div></div></header>'''

def ballot():
    filled = 23
    rows = ""
    for i in range(25):
        if i < filled:
            a,n,c,r = TEAMS[i if i not in (5,6) else (11 if i==5 else 5)]
            warn = i == 12
            rows += f'''<li class="group flex items-center gap-2 rounded-lg border bg-card px-2 py-1.5 shadow-xs {"ring-2 ring-primary/50 bg-accent/40 shadow-md -rotate-[0.4deg]" if i==3 else ""}">
<span class="cursor-grab text-muted-foreground" aria-label="Drag to reorder">{icon("grip","size-4")}</span>
<span class="w-6 text-right font-display text-lg font-bold tabular">{i+1}</span>{team_mark(a,"size-7")}
<div class="min-w-0 flex-1"><div class="truncate text-sm font-semibold">{n}</div><div class="text-xs text-muted-foreground">{c} · last week #{i+1 if MOVES[i] is None else i+1+(MOVES[i] or 0)} (example)</div></div>
{badge(icon("alert","size-3")+"Note?","outline","border-amber-500/50 text-amber-700 dark:text-amber-400") if warn else ""}
<div class="hidden items-center gap-0.5 sm:flex">{button("","ghost","icon-sm","up",attrs='aria-label="Move up"')}{button("","ghost","icon-sm","down",attrs='aria-label="Move down"')}</div>
{button("","ghost","icon-sm","x",cls="text-muted-foreground",attrs='aria-label="Remove"')}</li>'''
        else:
            rows += f'<li class="flex h-[50px] items-center gap-2 rounded-lg border border-dashed px-2 text-sm text-muted-foreground"><span class="w-4"></span><span class="w-6 text-right font-display text-lg font-bold">{i+1}</span><span>Drop a team here or tap + in the list</span></li>'
    pool = "".join(f'''<li class="flex items-center gap-3 border-b px-1 py-2 last:border-0 {"opacity-50" if j<3 else ""}">{team_mark(a,"size-7")}<div class="flex-1 min-w-0"><div class="truncate text-sm font-medium">{n}</div><div class="text-xs text-muted-foreground">{c} · {r} (example)</div></div>{badge("On ballot","secondary") if j<3 else button("","outline","icon-sm","plus",attrs='aria-label="Add"')}</li>''' for j,(a,n,c,r) in enumerate(TEAMS[:3]+[("ETA","Example Team A","Example Conf","4-2"),("ETB","Example Team B","Example Conf","4-2"),("ETC","Example Team C","Example Conf","3-3"),("ETD","Example Team D","Example Conf","3-3"),("ETE","Example Team E","Example Conf","3-3")]))
    body = f'''{vote_header()}
<main class="mx-auto max-w-6xl px-4 pb-28">
 <div class="pt-6"><div class="flex flex-wrap items-center gap-2">{badge('<span class="size-1.5 rounded-full bg-live"></span>Window open',"outline","gap-1.5")}{badge("FCS Top 25","secondary")}{badge("Week 7 · 2026","secondary")}</div>
 <h1 class="mt-2 font-display text-[2.2rem] font-extrabold uppercase leading-none lg:text-headline">Your FCS ballot</h1>
 <p class="mt-1 text-sm text-muted-foreground">Due Mon, Oct 12 · 12:00 PM ET (9:00 AM PT) · autosaved 30s ago · example</p></div>
 <div class="mt-4 grid gap-2 sm:grid-cols-2">{alert("2 spots left","Rank 25 teams to submit. You can edit until the window closes.","brand","info")}{alert("Optional note suggested","You moved No. 13 eight spots from last week. Add a short note for the transparency page (optional).","default","alert")}</div>
 <div class="mt-4 md:hidden">{tabs(["Ballot 23/25","Add teams"],0,"w-full",full=True)}</div>
 <div class="mt-5 grid gap-6 md:grid-cols-[minmax(0,1fr)_340px]">
  <section aria-label="Your ballot"><div class="mb-2 flex items-center justify-between"><h2 class="font-display text-xl font-bold uppercase">Ranking</h2><div class="flex gap-2">{button("Copy last week","outline","sm")}{button("Clear","ghost","sm")}</div></div><ol class="grid gap-1.5">{rows}</ol></section>
  <aside class="hidden md:block"><div class="sticky top-20">{card(card_header("Eligible teams","FCS teams for 2026 · search or filter")+card_content(f'{input_("Search teams","","search")}<div class="mt-2 flex gap-1.5">{badge("All","default")}{badge("Big Sky","outline")}{badge("MVFC","outline")}{badge("CAA","outline")}{badge("More","outline")}</div><ul class="mt-2">{pool}</ul>',"pb-4 pt-3"),"gap-0")}</div></aside>
 </div>
</main>
<div class="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur"><div class="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3"><div class="flex-1"><div class="flex justify-between text-xs font-medium"><span>23 of 25 ranked</span><span class="text-muted-foreground">Draft saved</span></div>{progress(92,"mt-1.5")}</div>{button("Preview","outline","default",cls="hidden sm:inline-flex")}{button("Submit ballot","default","default","check",attrs="disabled")}</div></div>'''
    return page("Ballot · Redshirt Vote", body, path="vote.redshirtsports.com/ballot/fcs/2026/week-7")

def team():
    hist = [12,9,8,6,5,4,2]
    w,h = 420,190
    pts_ = " ".join(f"{20+i*(w-40)/(len(hist)-1):.0f},{10+(r-1)*(h-20)/13:.0f}" for i,r in enumerate(hist))
    dots = "".join(f'<circle cx="{20+i*(w-40)/(len(hist)-1):.0f}" cy="{10+(r-1)*(h-20)/13:.0f}" r="4" class="fill-primary"/><text x="{20+i*(w-40)/(len(hist)-1):.0f}" y="{10+(r-1)*(h-20)/13-9:.0f}" text-anchor="middle" class="fill-foreground text-[11px] font-semibold">{r}</text>' for i,r in enumerate(hist))
    chart = f'<svg viewBox="0 0 {w} {h+20}" class="w-full" role="img" aria-label="Poll rank by week (example)"><line x1="20" x2="{w-20}" y1="10" y2="10" class="stroke-border"/><line x1="20" x2="{w-20}" y1="{h-10}" y2="{h-10}" class="stroke-border"/><polyline points="{pts_}" fill="none" class="stroke-primary" stroke-width="2.5"/>{dots}{"".join(f"<text x={20+i*(w-40)/(len(hist)-1):.0f} y={h+12} text-anchor=middle class=\'fill-muted-foreground text-[10px]\'>{lbl}</text>" for i,lbl in enumerate(["Pre","W1","W2","W3","W4","W5","W6"]))}</svg>'
    links = "".join(f'<a href="#" class="group flex items-center gap-3 rounded-lg border bg-card p-3 hover:bg-accent"><span class="flex size-9 items-center justify-center rounded-md bg-muted">{icon(ic,"size-4")}</span><div class="flex-1"><div class="text-sm font-semibold">{t}</div><div class="text-xs text-muted-foreground">Opens on example-athletics.edu</div></div>{icon("ext","size-4 text-muted-foreground group-hover:text-foreground")}</a>' for ic,t in [("clock","Official schedule & scores"),("users","Roster"),("list","Stats"),("star","Tickets")])
    river = "".join(river_item(s,i) for i,s in enumerate(STORIES[:5]))
    writers = "".join(f'<div class="flex items-center gap-3 py-2">{avatar(i,"size-9")}<div class="flex-1"><div class="text-sm font-semibold">{n}</div><div class="text-xs text-muted-foreground">Beat writer · example</div></div>{button("Follow","outline","xs")}</div>' for i,n in [("WO","Writer One"),("WT","Writer Two")])
    body = f'''{ticker()}{header()}
<div class="border-b bg-gradient-to-b from-muted/60 to-background">
 <div class="mx-auto max-w-site px-4 pt-6 lg:px-6">
  <nav class="flex items-center gap-1 text-xs text-muted-foreground" aria-label="Breadcrumb"><a href="#">College Football</a>{icon("chev-right","size-3")}<a href="#">FCS</a>{icon("chev-right","size-3")}<span>Teams</span></nav>
  <div class="mt-4 flex flex-wrap items-center gap-4">{team_mark("MSU","size-16 lg:size-20 text-base")}
   <div class="flex-1"><div class="kicker text-muted-foreground">Big Sky · FCS (example)</div><h1 class="font-display text-[2.4rem] font-extrabold uppercase leading-none lg:text-headline-lg">Montana State</h1>
   <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">{badge("No. 2 in Redshirt FCS Top 25","default")}{badge("6-0 (example)","secondary")}{badge("Example State, MT","outline")}</div></div>
   <div class="flex gap-2">{button("Following","secondary","default","check")}{button("","outline","icon","bell",attrs='aria-label="Alerts"')}</div></div>
  {underline_tabs(["Overview","News","Rankings","Bracket history","Staff coverage","Links"],0,"mt-6 border-b-0")}
 </div></div>
<main class="mx-auto max-w-site px-4 lg:px-6">
 <div class="grid gap-8 pt-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
  <div><div class="grid gap-4 sm:grid-cols-[1.4fr_1fr]"><article>{photo("Lead photo placeholder","aspect-video","rounded-xl")}<div class="kicker mt-3 text-primary">Team news</div><h2 class="font-display text-headline-sm font-bold sm:text-headline">Example team headline for the hub lead slot</h2></article>
   {card(card_header("Poll history","Redshirt FCS Top 25 · 2026 (example)")+card_content(chart,"pb-4 pt-2"),"gap-0")}</div>
   <div class="mt-6 flex items-center justify-between border-b pb-3"><h2 class="font-display text-2xl font-extrabold uppercase">Latest</h2>{button("All team news","link","sm",icon_right="chev-right")}</div><div class="divide-y">{river}</div></div>
  <aside class="grid content-start gap-6">
   <div><div class="kicker mb-2 text-muted-foreground">Official links</div><div class="grid gap-2">{links}</div><p class="mt-2 text-xs text-muted-foreground">Redshirt doesn't host schedules, scores or rosters. These open the school's site.</p></div>
   {card(card_header("Beat writers")+card_content(writers,"pb-4 pt-1"),"gap-0")}
   {ad(300,250)}
   {card(card_header("Bracket history","Redshirt Bracket Challenge")+card_content('<div class="text-sm text-muted-foreground">Example: Seeded in 2025 FCS bracket; most-picked champion in example groups.</div>',"pb-5 pt-2"),"gap-0")}
  </aside>
 </div>
</main>{footer()}{bottom_nav(3)}'''
    return page("Montana State (example) · Team hub", body)
