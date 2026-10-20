"""Round-3 Phase-1 pages: news archive, division news (conference combobox), conference news, single-page team, loading skeletons.
Conference names: Sanity 8pbt9f8w/production (read-only, 2026-10-19), football FCS conferences. Stories are EXAMPLE DATA."""
import json, os
from layout import *
from pages import rankings_widget, STORIES, most_read_card
from pages2 import crumbs, MORE, most_read

# FCS football conferences from Sanity (name, short, slug, published posts referencing it)
FCS_CONFS = [("Southern Conference","SoCon","southern-conference",122),("Missouri Valley Football Conference","MVFC","missouri-valley-football-conference",83),
 ("Northeast Conference","NEC","northeast-conference",42),("Coastal Athletic Association","CAA","coastal-athletic-association",38),
 ("Mid-Eastern Athletic Conference","MEAC","mid-eastern-athletic-conference",37),("Southwestern Athletic Conference","SWAC","southwestern-athletic-conference",32),
 ("Pioneer Football League","Pioneer","pioneer-football-league",30),("Ivy League","Ivy League","ivy-league",28),("Big Sky Conference","Big Sky","big-sky-conference",24),
 ("Patriot League","Patriot","patriot-league",24),("Big South - OVC Football Association","OVC-Big South","big-south-ovc-football-association",20),
 ("United Athletic Conference","UAC","united-athletic-conference",15),("FCS Independents","FCS Independents","fcs-independents",11),
 ("Southland Conference","Southland","southland-conference",10),("Ohio Valley Conference","Ohio Valley","ohio-valley-conference",7)]
MORE = [s for s in MORE if s[0] not in ("Transfer Portal","Recruiting")] * 2
SCHOOLS = {r["sl"]: r for r in json.load(open(os.path.join(os.path.dirname(__file__), "teams_data.json")))}

def h1(t, kicker=None, dek=None):
    k = f'<div class="kicker text-primary">{kicker}</div>' if kicker else ""
    d = f'<p class="mt-2 max-w-2xl text-muted-foreground">{dek}</p>' if dek else ""
    return f'{k}<h1 class="font-display text-[2.4rem] font-extrabold uppercase leading-none lg:text-headline-lg">{t}</h1>{d}'

def archive_row(s, time):
    k, h, d, w, t = s
    return f'''<li><article class="group grid grid-cols-[4.5rem_1fr_5.5rem] items-start gap-3 py-3 sm:grid-cols-[5.5rem_1fr_7rem] sm:gap-4">
 <time class="pt-0.5 text-xs font-medium tabular text-muted-foreground" datetime="2026-10-19">{time}</time>
 <div class="min-w-0"><div class="kicker text-primary">{k}</div><h3 class="mt-0.5 font-semibold leading-snug group-hover:underline"><a href="#" class="after:absolute after:inset-0 relative">{h}</a></h3><div class="mt-1 text-xs text-muted-foreground">{w}</div></div>
 {photo("Thumbnail","aspect-[4/3]","rounded-md")}</article></li>'''

def date_group(label, stories, times):
    return f'<section aria-labelledby="d-{label[:3].lower()}"><h3 id="d-{label[:3].lower()}" class="sticky top-14 z-10 border-b bg-background/95 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground backdrop-blur lg:top-16">{label}</h3><ol class="divide-y">{"".join(archive_row(s, t) for s, t in zip(stories, times))}</ol></section>'

def select_filter(id_, label, value, opts):
    o = "".join(f'<option{" selected" if x == value else ""}>{x}</option>' for x in opts)
    return f'<div class="grid gap-1"><label for="{id_}" class="text-xs font-semibold text-muted-foreground">{label}</label><select id="{id_}" class="border-input h-9 rounded-md border bg-background px-2.5 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">{o}</select></div>'

def archive_body(base, page_n=1, total=48):
    lead = MORE[0]
    compact_lead = f'''<article class="group grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-[14rem_1fr]">{photo("Lead photo placeholder","aspect-[16/9]","rounded-lg")}
<div><div class="kicker text-primary">Latest · {lead[0]}</div><h2 class="mt-1 font-display text-2xl font-extrabold uppercase leading-tight group-hover:underline"><a href="#">{lead[1]}</a></h2><p class="mt-1 line-clamp-2 text-sm text-muted-foreground">{lead[2]}</p><div class="mt-2 text-xs text-muted-foreground">{lead[3]} · {lead[4]} ago</div></div></article>'''
    s = [MORE[i % len(MORE)] for i in range(1, 15)]
    groups = (date_group("Today · Mon, Oct 19", s[0:5], ["2:41 PM","1:10 PM","11:32 AM","9:05 AM","7:00 AM"]) +
              date_group("Yesterday · Sun, Oct 18", s[5:10], ["9:48 PM","6:15 PM","4:02 PM","1:30 PM","10:00 AM"]) +
              date_group("Sat, Oct 17", s[10:14], ["11:58 PM","8:20 PM","5:45 PM","12:00 PM"]))
    return compact_lead, groups

def filter_bar(division="All divisions", conf="All conferences", typ="All types", show_div=True, show_conf=True):
    divs = ["All divisions","FBS","FCS","Division II","Division III","NAIA"]
    confs = ["All conferences"] + [c[0] for c in FCS_CONFS]
    types = ["All types","News","Analysis","Feature","Rankings","Podcast","Opinion"]
    f = (select_filter("f-div","Division",division,divs) if show_div else "") + (select_filter("f-conf","Conference",conf,confs) if show_conf else "") + select_filter("f-type","Type",typ,types) + select_filter("f-sort","Sort","Newest first",["Newest first","Oldest first"])
    return f'''<form role="search" aria-label="Filter stories" class="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/40 p-3">{f}
<div class="grid flex-1 gap-1 basis-56"><label for="f-q" class="text-xs font-semibold text-muted-foreground">Search headlines</label><div class="relative"><span class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">{icon("search")}</span><input id="f-q" type="search" placeholder="e.g. playoff, Big Sky" class="border-input h-9 w-full rounded-md border bg-background pl-8 pr-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"></div></div>
{button("Apply","default","default")}</form>
<p class="mt-2 text-[11px] text-muted-foreground">Division and conference selects navigate to the real folder routes (<span class="font-mono">/college/football/news/fcs/big-sky-conference</span>); type, sort and search use query params. Pagination: <span class="font-mono">?page=n</span>.</p>'''

def archive_layout(title_html, crumbs_items, base, filters, page_n, total, aside, path, title, count_text, top_extra=""):
    lead, groups = archive_body(base, page_n, total)
    body = f'''{header()}
<main id="main" class="mx-auto max-w-site px-4 lg:px-6">
 <div class="border-b pb-5 pt-5">{crumbs(crumbs_items)}<div class="mt-3">{title_html}</div>{top_extra}</div>
 <div class="pt-5">{filters}</div>
 <div class="grid gap-8 pt-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
  <div><h2 class="sr-only">Stories</h2>{lead if page_n == 1 else ""}
   <div class="mt-6 flex items-center justify-between"><p class="text-sm text-muted-foreground" aria-live="polite">{count_text}</p><span class="text-xs text-muted-foreground">Page {page_n} of {total}</span></div>
   <div class="mt-2 grid gap-6">{groups}</div>
   <nav aria-label="Pagination" class="pt-6">{pagination(page_n, total)}</nav>
   <p class="mt-3 text-center text-[11px] text-muted-foreground">Canonical: <span class="font-mono">{base}{"" if page_n == 1 else f"?page={page_n}"}</span> · page 1 has no parameter</p></div>
  <aside class="grid content-start gap-6" aria-label="Sidebar">{aside}</aside>
 </div>
</main>{footer()}'''
    return page(title, body, path=path)

def news_index():
    return archive_layout(h1("College Football News", "Archive", "Every College Football story, newest first."), ["College","Football","News"], "/college/football/news",
        filter_bar(), 1, 48, most_read() + rankings_widget(10) + ad(300,250), "/college/football/news", "College Football News", "1,142 stories (example)")

def conf_picker(active=None):
    top = FCS_CONFS[:5]
    chips = "".join(f'<a href="#" title="/college/football/news/fcs/{sl}" {"aria-current=\"page\"" if s == active else ""} class="inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring {"border-primary bg-primary text-primary-foreground" if s == active else ""}">{s}</a>' for n, s, sl, _ in top)
    opts = "".join(f'<li role="option" aria-selected="{str(s == active).lower()}"><a href="#" title="/college/football/news/fcs/{sl}" class="flex items-center justify-between gap-3 rounded-sm px-2 py-1.5 text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"><span>{n}</span><span class="text-xs text-muted-foreground">{s}</span></a></li>' for n, s, sl, _ in sorted(FCS_CONFS))
    return f'''<div class="mt-4 flex flex-wrap items-center gap-2">
 <div class="relative"><button type="button" id="conf-trigger" aria-haspopup="listbox" aria-expanded="false" aria-controls="conf-pop" class="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none">{icon("list","size-4")}{active and dict((c[1],c[0]) for c in FCS_CONFS)[active] or "All conferences"}<span class="text-xs text-muted-foreground">({len(FCS_CONFS)})</span>{icon("chev-down","size-4 opacity-60")}</button>
  <div id="conf-pop" data-slot="popover-content" class="absolute left-0 top-full z-30 mt-1 hidden w-80 max-w-[calc(100vw-2rem)] rounded-md border bg-popover p-0 shadow-lg [.combo-open_&]:block">
   <div data-slot="command" class="flex flex-col"><div class="flex items-center gap-2 border-b px-3">{icon("search","size-4 opacity-50")}<label for="conf-q" class="sr-only">Search conferences</label><input id="conf-q" type="search" placeholder="Search conferences…" class="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"></div>
   <ul role="listbox" aria-label="FCS conferences" class="max-h-72 overflow-y-auto p-1"><li><a href="#" title="/college/football/news/fcs" class="flex rounded-sm px-2 py-1.5 text-sm font-semibold hover:bg-accent">All FCS conferences</a></li>{opts}</ul></div></div></div>
 <span class="text-xs text-muted-foreground">Popular:</span>{chips}
</div>
<script>(()=>{{const t=document.getElementById("conf-trigger"),q=document.getElementById("conf-q"),h=document.documentElement;const set=o=>{{h.classList.toggle("combo-open",o);t.setAttribute("aria-expanded",o);if(o)q.focus();}};t.addEventListener("click",()=>set(!h.classList.contains("combo-open")));
q.addEventListener("input",()=>document.querySelectorAll("#conf-pop [role=option]").forEach(li=>li.hidden=!li.textContent.toLowerCase().includes(q.value.toLowerCase())));addEventListener("keydown",e=>{{if(e.key==="Escape"&&h.classList.contains("combo-open")){{set(false);t.focus();}}}});
if(h.classList.contains("combo-open"))t.setAttribute("aria-expanded","true");}})();</script>'''

def division_news():
    return archive_layout(h1("FCS Football News", "Football Championship Subdivision"), ["College","Football","News","FCS"], "/college/football/news/fcs",
        filter_bar(show_div=False, show_conf=False), 2, 48, most_read() + rankings_widget(10, False) + ad(300,250), "/college/football/news/fcs?page=2", "FCS News · Page 2",
        "Stories 25–48 of 1,130 (example)", conf_picker())

def conference_news():
    mates = [r for r in SCHOOLS.values() if (r.get("c") or {}).get("c") == "Big Sky"]
    team_links = "".join(f'<li><a href="teams.html" title="/college/teams/{r["sl"]}" class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"><img src="{r["img"]}?w=48" alt="" width="24" height="24" class="size-6 object-contain">{r.get("s") or r["n"]}</a></li>' for r in sorted(mates, key=lambda r: r.get("s") or r["n"]))
    teams_card = card(card_header("Big Sky teams", "Schools we cover") + card_content(f'<ul class="grid grid-cols-2 gap-0.5 lg:grid-cols-1">{team_links}</ul>', "pb-4 pt-2"), "gap-0")
    return archive_layout(h1("Big Sky Football News", "FCS · Big Sky Conference"), ["College","Football","News","FCS","Big Sky"], "/college/football/news/fcs/big-sky-conference",
        filter_bar(show_div=False, show_conf=False), 1, 9, most_read() + teams_card + ad(300,250), "/college/football/news/fcs/big-sky-conference", "Big Sky Football News",
        "212 stories (example)", conf_picker("Big Sky"))

def team_hub():
    r = SCHOOLS["montana-state-bobcats"]; name = f'{r["s"]} {r["k"]}'
    hist = [12,9,8,6,5,4,2]; w,h = 420,150
    X = lambda i: 20+i*(w-40)/(len(hist)-1); Y = lambda v: 12+(v-1)*(h-30)/13
    spark = (f'<svg viewBox="0 0 {w} {h+8}" class="w-full" role="img" aria-label="FCS Top 25 rank by week, 2026 (example): Preseason 12, then 9, 8, 6, 5, 4, now 2">'
        + f'<polyline points="{" ".join(f"{X(i):.0f},{Y(v):.0f}" for i,v in enumerate(hist))}" fill="none" class="stroke-primary" stroke-width="2.5"/>'
        + "".join(f'<circle cx="{X(i):.0f}" cy="{Y(v):.0f}" r="3.5" class="fill-primary"/><text x="{X(i):.0f}" y="{Y(v)-8:.0f}" text-anchor="middle" class="fill-foreground text-[11px] font-semibold">{v}</text>' for i,v in enumerate(hist))
        + "".join(f'<text x="{X(i):.0f}" y="{h+4}" text-anchor="middle" class="fill-muted-foreground text-[10px]">{l}</text>' for i,l in enumerate(["Pre","W1","W2","W3","W4","W5","W6"])) + '</svg>')
    def news_list(stories, n=4):
        return '<ol class="divide-y">' + "".join(f'<li><article class="group grid grid-cols-[1fr_6rem] gap-3 py-3"><div><div class="kicker text-primary">{s[0]}</div><h4 class="mt-0.5 font-semibold leading-snug group-hover:underline"><a href="#">{s[1]}</a></h4><div class="mt-1 text-xs text-muted-foreground">{s[3]} · {s[4]} ago</div></div>{photo("Thumbnail","aspect-[4/3]","rounded-md")}</article></li>' for s in stories[:n]) + '</ol>'
    def sec(id_, title, inner, more=None):
        m = f'<a href="#" title="{more}" class="text-sm font-semibold text-primary hover:underline">All {title.lower()} news{icon("chev-right","size-3.5 inline")}</a>' if more else ""
        return f'<section id="{id_}" aria-labelledby="{id_}-h" class="scroll-mt-24 border-t pt-6"><div class="mb-4 flex items-center justify-between gap-3"><h2 id="{id_}-h" class="font-display text-3xl font-extrabold uppercase leading-none"><a href="#{id_}" class="hover:underline">{title}</a></h2>{m}</div>{inner}</section>'
    lead = MORE[0]
    latest = f'''<div class="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]"><article class="group">{photo("Lead photo placeholder","aspect-video","rounded-xl")}<div class="kicker mt-3 text-primary">Football · Big Sky</div><h3 class="mt-1 font-display text-headline-sm font-bold group-hover:underline sm:text-headline"><a href="#">Example: Bobcats climb to No. 2 after road win</a></h3><p class="mt-1 text-sm text-muted-foreground">{lead[2]}</p></article>{news_list(MORE[1:], 4)}</div>'''
    rank_card = f'''<div class="grid gap-4 sm:grid-cols-[12rem_1fr]"><div class="rounded-xl border bg-card p-4"><div class="kicker text-muted-foreground">FCS Top 25 · Week 7</div><div class="mt-1 font-display text-6xl font-extrabold leading-none">No. 2</div><div class="mt-2 flex items-center gap-2 text-sm">{movement(2)}<span class="text-muted-foreground">from No. 4 · 512 pts · on 22 of 22 ballots</span></div><a href="#" title="/college/football/rankings/fcs" class="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">Full FCS Top 25</a></div>
<div class="rounded-xl border bg-card p-4"><div class="flex items-center justify-between"><h3 class="text-sm font-semibold">Rank history · 2026</h3><span class="text-xs text-muted-foreground">Best: No. 2 · Low: No. 12</span></div>{spark}</div></div>'''
    football = rank_card + f'<h3 class="mt-6 text-sm font-bold uppercase tracking-widest text-muted-foreground">Football news</h3>' + news_list(MORE[2:], 4)
    mbb = news_list(MORE[4:], 3); wbb = news_list(MORE[6:], 3)
    links = "".join(f'<li><a href="#" class="group flex items-center gap-3 rounded-lg border bg-card p-3 hover:bg-accent"><span class="flex size-9 items-center justify-center rounded-md bg-muted">{icon(ic,"size-4")}</span><span class="flex-1"><span class="block text-sm font-semibold">{t}</span><span class="block text-xs text-muted-foreground">{d}</span></span>{icon("ext","size-4 text-muted-foreground")}<span class="sr-only">(opens school site)</span></a></li>' for ic,t,d in [("star","Official athletics site","msubobcats.com (example)"),("users","Social","X · Facebook"),("list","Conference","Big Sky Conference")])
    info = f'''<div class="grid gap-6 md:grid-cols-2"><dl class="grid grid-cols-[8rem_1fr] gap-y-2 rounded-xl border bg-card p-4 text-sm"><dt class="text-muted-foreground">School</dt><dd>{r["n"]}</dd><dt class="text-muted-foreground">Nickname</dt><dd>{r["k"]}</dd><dt class="text-muted-foreground">Football</dt><dd>FCS · Big Sky</dd><dt class="text-muted-foreground">Basketball</dt><dd>Division I · Big Sky</dd></dl><ul class="grid content-start gap-2">{links}</ul></div><p class="mt-3 text-xs text-muted-foreground">Redshirt doesn't host rosters, scores or schedules.</p>'''
    jump = "".join(f'<li><a href="#{i}" class="rounded-md px-2 py-1 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">{t}</a></li>' for i,t in [("latest","Latest"),("football","Football"),("mens-basketball","Men's Basketball"),("womens-basketball","Women's Basketball"),("info","Info & links")])
    body = f'''{header()}
<div class="border-b bg-gradient-to-b from-muted/60 to-background"><div class="mx-auto max-w-site px-4 py-5 lg:px-6">{crumbs(["Teams", name])}
 <div class="mt-4 flex flex-wrap items-center gap-4"><img src="{r["img"]}?w=160" alt="" width="80" height="80" class="size-16 object-contain lg:size-20">
  <div class="flex-1"><div class="kicker text-muted-foreground">Big Sky · FCS football · D-I basketball</div><h1 class="font-display text-[2.4rem] font-extrabold uppercase leading-none lg:text-headline-lg">{name}</h1>
  <div class="mt-2 flex flex-wrap gap-2">{badge("Football: No. 2 FCS Top 25","default")}</div></div></div>
 <nav aria-label="On this page" class="mt-4 flex items-center gap-2"><span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Jump to</span><ul class="flex gap-1 overflow-x-auto">{jump}</ul></nav>
</div></div>
<main id="main" class="mx-auto max-w-site px-4 lg:px-6"><div class="grid gap-8 pt-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
 <div class="grid gap-10">{sec("latest","Latest",latest)}{sec("football","Football",football,"/college/football/news")}{sec("mens-basketball","Men's Basketball",mbb,"/college/mens-basketball/news")}{sec("womens-basketball","Women's Basketball",wbb,"/college/womens-basketball/news")}{sec("info","Info & links",info)}</div>
 <aside class="grid content-start gap-6" aria-label="Sidebar"><div class="lg:sticky lg:top-24 grid gap-6">{most_read()}{ad(300,250)}</div></aside>
</div></main>{footer()}'''
    return page(f"{name} (example)", body, path="/college/teams/montana-state-bobcats")

SK = "bg-accent animate-pulse motion-reduce:animate-none rounded-md"
def sk(cls): return f'<div data-slot="skeleton" class="{SK} {cls}"></div>'
def loading_wrap(inner):
    return f'''{header()}<main id="main" aria-busy="true" aria-live="polite" class="mx-auto max-w-site px-4 lg:px-6"><span class="sr-only" role="status">Loading…</span><div aria-hidden="true">{inner}</div></main>{footer()}'''
def news_loading():
    rows = "".join(f'<div class="grid grid-cols-[4.5rem_1fr_5.5rem] gap-3 border-b py-3 sm:grid-cols-[5.5rem_1fr_7rem]">{sk("h-3 w-14")}<div class="grid gap-2">{sk("h-3 w-20")}{sk("h-4 w-full")}{sk("h-4 w-2/3")}</div>{sk("aspect-[4/3] w-full")}</div>' for _ in range(8))
    inner = f'''<div class="border-b pb-5 pt-5">{sk("h-3 w-40")}{sk("mt-4 h-10 w-80 max-w-full")}{sk("mt-3 h-4 w-96 max-w-full")}</div>
<div class="pt-5">{sk("h-[4.25rem] w-full rounded-xl")}</div>
<div class="grid gap-8 pt-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"><div><div class="grid gap-4 rounded-xl border p-4 sm:grid-cols-[14rem_1fr]">{sk("aspect-[16/9] w-full")}<div class="grid content-start gap-2">{sk("h-3 w-24")}{sk("h-6 w-full")}{sk("h-6 w-3/4")}</div></div>{sk("mt-6 h-4 w-40")}<div class="mt-2">{rows}</div></div>
<div class="grid content-start gap-6">{sk("h-80 w-full rounded-xl")}{sk("h-96 w-full rounded-xl")}</div></div>'''
    return page("News · loading state", loading_wrap(inner), path="/college/football/news (loading.tsx)")
def rankings_loading():
    rows = "".join(f'<div class="grid grid-cols-[2.5rem_2rem_1fr_4rem_4rem] items-center gap-3 border-b px-4 py-2.5 md:grid-cols-[2.5rem_2rem_1fr_5rem_5rem_8rem]">{sk("h-5 w-6")}{sk("size-7 rounded-full")}{sk("h-4 w-40 max-w-full")}{sk("h-4 w-10")}{sk("h-4 w-8")}{sk("hidden h-2 w-full md:block")}</div>' for _ in range(25))
    inner = f'''<div class="pt-5">{sk("h-3 w-48")}{sk("mt-4 h-3 w-32")}{sk("mt-2 h-10 w-64")}{sk("mt-3 h-4 w-72 max-w-full")}<div class="mt-5 flex gap-2">{sk("h-9 w-28")}{sk("h-9 w-28")}</div>
<div class="mt-5 flex gap-6 border-b pb-3">{"".join(sk("h-4 w-16") for _ in range(5))}</div></div>
<div class="mt-6 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"><div class="overflow-hidden rounded-xl border">{rows}</div><div class="grid content-start gap-6">{sk("h-64 w-full rounded-xl")}{sk("h-64 w-full rounded-xl")}</div></div>'''
    return page("Rankings · loading state", loading_wrap(inner), path="/college/football/rankings/fcs (loading.tsx)")
