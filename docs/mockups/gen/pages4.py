"""v1.6: /college level hub (level → sport URL structure). EXAMPLE DATA ONLY."""
from layout import *
from pages import rankings_widget, newsletter_card, river_item
from pages2 import crumbs, path_tabs, most_read, MORE

SPORT_CARDS = [
 ("Football", "/college/football", ["FBS","FCS","D-II","D-III","NAIA"], MORE[0:3], "FCS Top 25 · Week 7 (example)"),
 ("Men's Basketball", "/college/mens-basketball", ["D-I","D-II","D-III"], [MORE[3], MORE[6], MORE[1]], "Preseason poll · coming soon (example)"),
 ("Women's Basketball", "/college/womens-basketball", ["D-I","D-II","D-III"], [MORE[3], MORE[5], MORE[2]], "Preseason poll · coming soon (example)"),
]

def sport_card(name, href, divs, stories, poll):
    items = "".join(f'<li class="border-b py-2.5 last:border-0"><div class="kicker text-primary">{s[0]}</div><a href="#" class="mt-0.5 block font-display text-[1.05rem] font-bold leading-tight hover:underline">{s[1]}</a><div class="mt-1 text-xs text-muted-foreground">{s[3]} · {s[4]} ago</div></li>' for s in stories)
    chips = "".join(badge(d, "outline", "h-6 px-2 text-xs") for d in divs)
    links = "".join(f'<a href="{href}/{p}" title="{href}/{p}" class="rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground">{t}</a>' for t, p in [("News","news"),("Rankings","rankings"),("Bracket","bracket-challenge"),("Portal","transfer-portal"),("Recruiting","recruiting")])
    return f'''<section class="flex min-w-0 flex-col rounded-xl border bg-card">
 <a href="{href}" title="{href}" class="group flex items-center justify-between gap-2 border-b px-4 py-3"><div><div class="kicker text-muted-foreground">College</div><h2 class="font-display text-2xl font-extrabold uppercase leading-none group-hover:underline">{name}</h2></div><span class="font-mono text-[11px] text-muted-foreground">{href}</span></a>
 <div class="flex flex-wrap gap-1 px-4 pt-3">{chips}</div>
 <ul class="flex-1 px-4 pt-1">{items}</ul>
 <div class="mx-4 mb-3 flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs">{icon("list","size-3.5 text-primary")}<span class="font-medium">{poll}</span></div>
 <nav class="flex flex-wrap gap-0.5 border-t px-2 py-2">{links}</nav>
</section>'''

def college_hub():
    band = f'''<div class="border-b bg-gradient-to-b from-muted/60 to-background"><div class="mx-auto max-w-site px-4 pt-5 lg:px-6">{crumbs(["Home","College"])}
<div class="mt-3 flex flex-wrap items-end justify-between gap-3"><div><div class="kicker text-primary">Level hub</div><h1 class="font-display text-[2.6rem] font-extrabold uppercase leading-none lg:text-headline-lg">College</h1><p class="mt-2 max-w-2xl text-sm text-muted-foreground">Every college sport Redshirt covers, in one place. Sports live under this level: <span class="font-mono">/college/{{sport}}</span>.</p></div>
<div class="flex gap-2">{button("Follow teams","outline","sm","star")}</div></div>
{path_tabs([("Overview","/college"),("Football","/college/football"),("Men's Basketball","/college/mens-basketball"),("Women's Basketball","/college/womens-basketball"),("All college news","/college/news")],0,"mt-5 border-b-0")}</div></div>'''
    cards = "".join(sport_card(*c) for c in SPORT_CARDS)
    river = "".join(river_item(s, i) for i, s in enumerate(MORE[2:8]))
    future = f'''<div class="flex flex-col gap-2 rounded-xl border border-dashed p-4 text-sm sm:flex-row sm:items-center"><div class="flex items-center gap-2 font-semibold">{icon("info","size-4 text-muted-foreground")}Other levels</div><p class="text-muted-foreground">High School is a planned future level at <span class="font-mono">/high-school/football</span>. Not built yet; the path is reserved.</p></div>'''
    body = f'''{ticker()}{header()}{band}
<main class="mx-auto max-w-site px-4 lg:px-6">
 <div class="grid gap-4 pt-6 lg:grid-cols-3">{cards}</div>
 <div class="mt-4">{future}</div>
 <div class="my-8 flex justify-center">{ad(970,90,"Ad · 970×90 / 320×100 · reserved")}</div>
 <div class="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
  <div><div class="flex items-center justify-between border-b pb-3"><h2 class="font-display text-2xl font-extrabold uppercase">Latest in college</h2><a href="/college/news" title="/college/news" class="text-sm font-semibold text-primary hover:underline">All college news →</a></div><div class="divide-y">{river}</div>
   <div class="pt-4">{button("More college news","outline","default",cls="w-full")}</div></div>
  <aside class="grid content-start gap-6">{rankings_widget(10)}{most_read()}{ad(300,250)}{newsletter_card()}</aside>
 </div>
</main>{footer()}{bottom_nav(0)}'''
    return page("College", body, path="/college")
