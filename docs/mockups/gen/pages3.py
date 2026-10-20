"""Transfer Portal tracker (/transfer-portal), v1.7 redesign. Flow inspired by On3's Transfer Portal
wire (header row + row cards + LAST -> NEW school chain), rebuilt in our tokens.
EXAMPLE DATA ONLY: every player is a fictional placeholder; school tiles are neutral initials."""
import zlib
from layout import *
from pages2 import short, crumbs

ui_tri = '<svg viewBox="0 0 8 10" class="h-2.5 w-2 shrink-0 fill-foreground" aria-hidden="true"><path d="M0 0 8 5 0 10z"/></svg>'

SCH = {  # abbr -> (name, conf, division)  (real school names, placeholder tiles, example data)
 "SIU":("Southern Illinois","MVFC","FCS"),"MSU":("Montana State","Big Sky","FCS"),"UCD":("UC Davis","Big Sky","FCS"),
 "YSU":("Youngstown State","MVFC","FCS"),"NDSU":("North Dakota State","MVFC","FCS"),"LEH":("Lehigh","Patriot","FCS"),
 "FUR":("Furman","SoCon","FCS"),"MER":("Mercer","SoCon","FCS"),"ACU":("Abilene Christian","UAC","FCS"),
 "URI":("Rhode Island","CAA","FCS"),"NOVA":("Villanova","CAA","FCS"),"APSU":("Austin Peay","UAC","FCS"),
 "UCA":("Central Arkansas","UAC","FCS"),"IDHO":("Idaho","Big Sky","FCS"),"SAC":("Sacramento State","Big Sky","FCS"),
 "ETA":("Example Tech","Example Conf","D-II"),"ETB":("Example State","Example Conf","D-II"),"ETC":("Example College","Example Conf","D-III"),
 "ETJ":("Example JC","Example JC Conf","JUCO"),"UNI":("Northern Iowa","MVFC","FCS"),"ILST":("Illinois State","MVFC","FCS"),
}
def hue(a): return zlib.crc32(a.encode()) % 360

def tile(a, state="past", caption=None, size="size-10"):
    """state: past (faded) | current (full) | undecided (dashed ?) | more (+N)"""
    if state == "undecided":
        t = f'<span class="flex {size} items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/40 bg-muted/50 font-display text-lg font-bold text-muted-foreground" title="Undecided">?</span>'
    elif state == "more":
        t = f'<span class="flex {size} items-center justify-center rounded-md border bg-muted font-display text-sm font-bold text-muted-foreground opacity-60" title="Earlier stops">{a}</span>'
    else:
        n = SCH[a][0]
        t = f'<span class="school-tile flex {size} items-center justify-center rounded-md border font-display text-[11px] font-bold tracking-wide {"opacity-50 saturate-50" if state=="past" else "shadow-xs"}" style="--h:{hue(a)}" title="{n} (placeholder tile)">{a}</span>'
    cap = f'<span class="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{caption}</span>' if caption else ""
    return f'<span class="relative flex shrink-0">{t}{cap}</span>'

def chain(stops, status, caption=None, size="size-10"):
    """stops: schools in order (oldest -> latest). Committed: last = new school.
    Entered: last = current school, then '?'. Withdrawn: last = school they return to."""
    tiles = []
    if status == "Committed":
        tiles = [(a, "past") for a in stops[:-1]] + [(stops[-1], "current")]
    elif status == "Entered":
        tiles = [(a, "past") for a in stops[:-1]] + [(stops[-1], "current"), ("?", "undecided")]
    else:
        tiles = [(a, "past") for a in stops[:-1]] + [(stops[-1], "current")]
    if len(tiles) > 4:  # keep 4 tiles max: "+N" then the last 3
        tiles = [(f"+{len(tiles)-3}", "more")] + tiles[-3:]
    out = []
    for k, (a, st) in enumerate(tiles):
        last = k == len(tiles) - 1
        out.append(tile(a, st, caption if last else None, size))
        if not last: out.append(ui_tri)
    names = " → ".join(SCH[a][0] for a in stops) + (" → undecided" if status == "Entered" else "")
    return f'<div class="flex flex-wrap items-center gap-x-2 gap-y-6" role="img" aria-label="School path: {names}">{"".join(out)}</div>'

STATUS = {"Committed": "bg-new/12 text-new border-new/25", "Entered": "bg-up/12 text-up border-up/25", "Withdrawn": "bg-muted text-muted-foreground border-border"}
def status_badge(s): return f'<span class="inline-flex h-6 items-center rounded-md border px-2 text-xs font-semibold {STATUS[s]}">{s}</span>'

# (name, pos, class, elig, ht, wt, stops, status, date, caption, story)
ENTRIES = [
 ("Example Player A","QB","R-Jr","2 yrs","6-2","215",["SIU","MSU"],"Committed","Oct 12",None,"Example: Why the Bobcats went after a portal QB"),
 ("Example Player B","WR","So","3 yrs","5-11","185",["UCD"],"Entered","Oct 11",None,None),
 ("Example Player C","LB","Sr","1 yr","6-1","230",["ETA","YSU","NDSU"],"Committed","Oct 10","Grad transfer","Example: Bison add a veteran linebacker"),
 ("Example Player D","OL","Jr","2 yrs","6-5","305",["LEH"],"Withdrawn","Oct 9","Returning","Example: Lineman returns to Lehigh"),
 ("Example Player E","CB","R-So","3 yrs","6-0","180",["FUR","MER"],"Committed","Oct 8",None,"Example: Mercer lands in-conference transfer"),
 ("Example Player F","RB","Jr","2 yrs","5-10","200",["ETJ","ACU"],"Entered","Oct 8","Visit Oct 18","Example: UAC portal roundup, Week 7"),
 ("Example Player G","DE","Gr","1 yr","6-4","255",["ETC","ETB","URI","NOVA"],"Committed","Oct 7","Signed","Example: Villanova's defensive line rebuild"),
 ("Example Player H","S","Jr","2 yrs",None,None,["APSU","UCA"],"Committed","Oct 6",None,None),
 ("Example Player I","TE","R-Sr","1 yr","6-4","240",["ETJ","ETA","IDHO","SAC","UNI"],"Committed","Oct 5",None,"Example: Northern Iowa's sixth-year tight end"),
 ("Example Player J","DT","So","3 yrs","6-3","295",["ILST","ETB"],"Entered","Oct 4",None,None),
]

LBL = "text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
def head_row():
    """Shares .portal-grid with the rows; same px-4 and 1px (transparent) border, so columns can't drift."""
    return f'''<div class="portal-grid portal-head rounded-lg border border-transparent bg-muted/60 px-4 py-2" aria-hidden="true">
<div class="[grid-area:player] {LBL}">Player</div><div class="[grid-area:pos] {LBL}">Pos</div>
<div class="[grid-area:info] hidden {LBL} @min-[56rem]/portal:block">Ht / Wt · Class</div>
<div class="[grid-area:status] {LBL}">Status</div><div class="[grid-area:chain] {LBL}">Last <span class="tracking-normal">→</span> New</div>
<div class="[grid-area:story] {LBL}"><span class="@min-[56rem]/portal:hidden sr-only">Story</span><span class="hidden @min-[56rem]/portal:inline">Story</span></div></div>'''

def portal_row(e, size="size-10"):
    n,pos,cl,el,ht,wt,stops,s,d,cap,story = e
    origin = stops[-1] if s != "Committed" else stops[-2]
    on, oc, od = SCH[origin]
    ini = "".join(w[0] for w in n.split()[-2:])
    hw = f'{ht} / {wt}' if ht else "—"
    story_html = (f'''<a href="#" title="{story}" class="hidden items-center gap-1 text-xs font-semibold text-primary hover:underline @min-[56rem]/portal:inline-flex">{icon("news","size-3.5")}Story</a>
<a href="#" title="{story}" aria-label="Redshirt story: {story}" class="hidden size-9 items-center justify-center rounded-md text-primary hover:bg-accent @min-[40rem]/portal:inline-flex @min-[56rem]/portal:hidden">{icon("news","size-4")}</a>
<a href="#" class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary @min-[40rem]/portal:hidden">{icon("news","size-3.5")}Read the Redshirt story{icon("chev-right","size-3")}</a>'''
        if story else '<span class="hidden text-xs text-muted-foreground @min-[56rem]/portal:inline" title="No Redshirt story linked (optional)">—</span>')
    return f'''<li class="portal-grid rounded-xl border bg-card px-4 py-3 shadow-xs transition-colors hover:bg-muted/40 {"pb-6" if cap else ""}">
 <div class="[grid-area:player] flex min-w-0 items-center gap-3">{avatar(ini,"size-10","bg-secondary text-secondary-foreground")}
  <div class="min-w-0"><a href="#" class="block truncate font-display text-lg font-bold leading-tight text-primary hover:underline">{n}</a>
   <div class="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"><span class="@min-[40rem]/portal:truncate">{on} · {oc}</span><span class="shrink-0 rounded border px-1 text-[10px] font-semibold">{od}</span></div>
   <div class="mt-0.5 text-xs text-muted-foreground @min-[40rem]/portal:truncate @min-[56rem]/portal:hidden"><b class="font-semibold text-foreground @min-[40rem]/portal:hidden">{pos} · </b>{hw} · {cl} · {el} left</div></div></div>
 <div class="[grid-area:pos] hidden font-display text-base font-bold @min-[40rem]/portal:block">{pos}</div>
 <div class="[grid-area:info] hidden text-xs @min-[56rem]/portal:block"><div class="font-semibold tabular">{hw}</div><div class="mt-0.5 text-muted-foreground"><span class="rounded border px-1 text-[10px] font-semibold">{cl}</span> {el} left</div></div>
 <div class="[grid-area:status] grid justify-items-end gap-1 @min-[40rem]/portal:justify-items-start">{status_badge(s)}<span class="text-[11px] text-muted-foreground tabular">{d}<span class="hidden @min-[40rem]/portal:inline">, 2026</span></span></div>
 <div class="[grid-area:chain] min-w-0 rounded-lg bg-muted/40 px-2.5 py-2 {"pb-6" if cap else ""} @min-[40rem]/portal:bg-transparent @min-[40rem]/portal:p-0">{chain(stops, s, cap, size)}</div>
 <div class="[grid-area:story] min-w-0 {"" if story else "hidden @min-[56rem]/portal:block"}">{story_html}</div>
</li>'''

def tracker_list(entries, cls=""):
    return f'<div class="@container/portal grid gap-2 {cls}">{head_row()}<ol class="grid gap-2">{"".join(portal_row(e) for e in entries)}</ol></div>'

def count_card(label, v, chip, tone):
    return f'<div class="rounded-xl border border-t-2 bg-card px-4 py-3 shadow-xs {tone}"><div class="{LBL}">{label}</div><div class="mt-1 font-display text-4xl font-extrabold leading-none tabular">{v}</div><span class="mt-2 inline-flex rounded border bg-muted/50 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{chip}</span></div>'

def filter_bar():
    tabs_ = [("All","354",True),("Entered","214",False),("Committed","131",False),("Withdrawn","9",False)]
    seg = "".join(f'<a href="{"/transfer-portal?division=fcs" if t=="All" else "/transfer-portal?division=fcs&status="+t.lower()}" class="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-semibold whitespace-nowrap {"bg-background text-foreground shadow-sm" if a else "text-muted-foreground hover:text-foreground"}">{t}<span class="text-xs font-medium text-muted-foreground tabular">{c}</span></a>' for t, c, a in tabs_)
    sel = lambda v, active=False: select_(v, "h-9 " + ("border-primary/50 bg-accent/40 font-semibold" if active else ""))
    return f'''<div class="grid grid-cols-[minmax(0,1fr)] gap-3 rounded-xl border bg-card p-3 shadow-xs">
<div class="flex flex-wrap items-center gap-2"><nav class="flex min-w-0 max-w-full overflow-x-auto rounded-lg bg-muted p-[3px]" aria-label="Status">{seg}</nav>
<div class="ml-auto hidden w-64 md:block">{input_("Search player or school","","search")}</div></div>
<div class="hidden flex-wrap items-center gap-2 md:flex">{sel("2026")}{sel("Football",True)}{sel("FCS",True)}{sel("All conferences")}{sel("All positions")}<span class="ml-auto text-xs text-muted-foreground">Sort</span>{sel("Newest first")}</div>
<div class="grid grid-cols-2 gap-2 md:hidden">{button("Filters · 2","outline","default","list",cls="w-full")}{select_("Newest first","w-full min-w-0")}</div>
<div class="flex flex-wrap items-center gap-2 text-xs"><span class="text-muted-foreground">Showing 1–10 of 354</span>{badge("Football "+icon("x","size-3"),"secondary")}{badge("FCS "+icon("x","size-3"),"secondary")}<a href="#" class="font-medium text-primary hover:underline">Clear</a><span class="ml-auto hidden font-mono text-[11px] text-muted-foreground lg:block">/transfer-portal?division=fcs</span></div></div>'''

def legend():
    return f'''<div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground"><span class="flex items-center gap-1.5">{tile("SIU","past",size="size-5")}{ui_tri}{tile("MSU","current",size="size-5")} past stops faded, current or new school full</span>
<span class="flex items-center gap-1.5">{tile("?","undecided",size="size-5")} undecided</span><span>Tiles are placeholders (initials), not school logos · example data</span></div>'''

def tracker():
    counts = f'''<div class="grid grid-cols-2 gap-3 md:grid-cols-4">{count_card("Tracked","354","FCS · 2026","border-t-foreground/70")}{count_card("Entered","214","60% undecided","border-t-up")}{count_card("Committed","131","37% of tracked","border-t-new")}{count_card("Withdrawn","9","2.5% returned","border-t-muted-foreground")}</div>'''
    note = f'<p class="flex items-center gap-1.5 text-[11px] text-muted-foreground">{icon("info","size-3.5 shrink-0")}Editor-maintained from Redshirt reporting, not every portal entry. Rows link to a Redshirt story when there is one.</p>'
    rail = f'''<aside class="hidden content-start gap-6 xl:grid">{card(card_header("Latest portal stories")+card_content("".join(f'<a href="#" class="block border-b py-2.5 text-sm font-semibold leading-snug last:border-0 hover:underline">{e[10]}</a>' for e in [x for x in ENTRIES if x[10]][:5]),"pb-3 pt-1"),"gap-0")}{ad(300,250)}{card(card_content(f'<div class="flex items-center gap-3"><span class="flex size-9 items-center justify-center rounded-full bg-accent text-primary">{icon("bell")}</span><div class="flex-1 text-sm"><div class="font-semibold">Portal alerts</div><div class="text-muted-foreground">When a team you follow gains or loses a player</div></div>{switch(False)}</div>',"py-4"))}</aside>'''
    body = f'''{ticker()}{header()}
<main class="mx-auto max-w-site px-4 lg:px-6">
 <div class="pt-5">{crumbs(["Transfer Portal","Tracker"])}
  <div class="mt-3 flex flex-wrap items-end justify-between gap-3"><h1 class="font-display text-[2.6rem] font-extrabold uppercase leading-[0.9] md:text-[3.4rem]">2026 Football<span class="block text-muted-foreground">Transfer Portal</span></h1>
  <div class="flex gap-2">{button("Portal news","outline","sm",icon_right="chev-right")}{button("Portal alerts","default","sm","bell")}</div></div>
  <p class="mt-2 text-xs text-muted-foreground">Example data · fictional players</p></div>
 <div class="grid gap-8 pt-5 xl:grid-cols-[minmax(0,1fr)_300px]">
  <div class="grid min-w-0 grid-cols-1 content-start gap-4">{filter_bar()}{counts}{legend()}{tracker_list(ENTRIES)}{note}<div class="pt-2">{pagination(1,36)}</div></div>
  {rail}
 </div>
</main>{footer()}{bottom_nav(0)}'''
    return page("Transfer Portal Tracker", body, path="/transfer-portal?division=fcs")

def variants():
    V = [("1 stop · entered, destination not set", ("Example Player K","WR","Fr","4 yrs","6-0","175",["SAC"],"Entered","Oct 12",None,None)),
         ("1 stop · withdrawn, returning", ("Example Player L","OL","Jr","2 yrs","6-6","310",["LEH"],"Withdrawn","Oct 11","Returning","Example: Lineman returns")),
         ("2 stops · committed", ("Example Player M","QB","R-Jr","2 yrs","6-3","220",["SIU","MSU"],"Committed","Oct 10",None,"Example: Portal QB story")),
         ("2 stops · uncommitted (?) with caption", ("Example Player N","RB","So","3 yrs","5-9","195",["ETJ","ACU"],"Entered","Oct 9","Visit Oct 18",None)),
         ("3 stops · committed with caption", ("Example Player O","LB","Sr","1 yr","6-1","230",["ETA","YSU","NDSU"],"Committed","Oct 8","Grad transfer","Example: Veteran linebacker")),
         ("3 stops · uncommitted", ("Example Player P","CB","Jr","2 yrs","5-11","182",["ETC","URI"],"Entered","Oct 7",None,None)),
         ("4 stops · committed", ("Example Player Q","DE","Gr","1 yr","6-4","255",["ETC","ETB","URI","NOVA"],"Committed","Oct 6","Signed","Example: D-line rebuild")),
         ("5+ stops · collapses to +N and the last 3", ("Example Player R","TE","R-Sr","1 yr","6-4","240",["ETJ","ETA","IDHO","SAC","UNI"],"Committed","Oct 5",None,"Example: Sixth-year tight end")),
         ("4 stops · withdrawn after two moves", ("Example Player S","S","Sr","1 yr",None,None,["ETB","APSU","UCA"],"Withdrawn","Oct 4","Returning",None))]
    blocks = "".join(f'<section class="grid gap-2"><h2 class="{LBL}">{t}</h2><div class="@container/portal grid gap-2"><ol class="grid gap-2">{portal_row(e)}</ol></div></section>' for t, e in V)
    body = f'''{ticker()}{header()}
<main class="mx-auto max-w-site px-4 pb-12 lg:px-6">
 <div class="pt-5">{crumbs(["Transfer Portal","Tracker","Row variants"])}<h1 class="mt-3 font-display text-[2.3rem] font-extrabold uppercase leading-none">Portal row variants</h1>
 <p class="mt-2 max-w-3xl text-sm text-muted-foreground">Design reference (not a public page). Each row uses the same <span class="font-mono">.portal-grid</span> as the tracker; resize to see the card (&lt; 640px list width), tablet and desktop layouts. Example data, fictional players, placeholder tiles.</p></div>
 <div class="mt-5 grid gap-5">{legend()}<div class="@container/portal">{head_row()}</div>{blocks}</div>
</main>{footer()}'''
    return page("Portal row variants", body, path="(design reference) portal-row-variants.html")
