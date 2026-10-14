"""v1.5: Transfer Portal tracker (/transfer-portal). On3-wire-inspired row cards built on named grid areas.
EXAMPLE DATA ONLY: players are fictional placeholders."""
from layout import *
from pages2 import short, crumbs, most_read

# (name, pos, class, elig, ht, wt, from_abbr, from_name, from_conf, to_abbr, to_name, status, date, division, story)
ENTRIES = [
 ("Example Player A","QB","R-Jr","2 yrs","6-2","215","SIU","Southern Illinois","MVFC","MSU","Montana State","Committed","Oct 12","FCS","Example: Why the Bobcats went after a portal QB"),
 ("Example Player B","WR","So","3 yrs","5-11","185","UCD","UC Davis","Big Sky",None,None,"Entered","Oct 11","FCS",None),
 ("Example Player C","LB","Sr","1 yr",None,None,"YSU","Youngstown State","MVFC","NDSU","North Dakota State","Committed","Oct 10","FCS","Example: Bison add a veteran linebacker"),
 ("Example Player D","OL","Jr","2 yrs","6-5","305","LEH","Lehigh","Patriot",None,None,"Withdrawn","Oct 9","FCS","Example: Lineman returns to Lehigh"),
 ("Example Player E","CB","R-So","3 yrs","6-0","180","FUR","Furman","SoCon","MER","Mercer","Committed","Oct 8","FCS","Example: Mercer lands in-conference transfer"),
 ("Example Player F","RB","Fr","4 yrs","5-10","200","ACU","Abilene Christian","UAC",None,None,"Entered","Oct 8","FCS","Example: UAC portal roundup, Week 7"),
 ("Example Player G","DE","Gr","1 yr","6-4","255","URI","Rhode Island","CAA","NOVA","Villanova","Committed","Oct 7","FCS","Example: Villanova's defensive line rebuild"),
 ("Example Player H","S","Jr","2 yrs",None,None,"APSU","Austin Peay","UAC","UCA","Central Arkansas","Committed","Oct 6","FCS","Example: Central Arkansas adds a safety"),
]
ST = {"Entered": ("outline", "border-new/50 text-new"), "Committed": ("default", ""), "Withdrawn": ("muted", "")}

def school(abbr, name, conf, muted=False):
    return f'<div class="flex min-w-0 items-center gap-2">{team_mark(abbr,"size-7 text-[8px]")}<div class="min-w-0"><div class="truncate text-sm font-semibold {"text-muted-foreground" if muted else ""}">{short(name)}</div><div class="truncate text-[11px] text-muted-foreground">{conf}</div></div></div>'

def portal_row(e, highlight=False):
    n,pos,cl,el,ht,wt,fa,fn,fc,ta,tn,s,d,div,story = e
    v, extra = ST[s]
    initials = "".join(w[0] for w in n.split()[-2:])
    hw = f' · {ht} / {wt}' if ht else ""
    if s == "Committed":
        dest = school(ta, tn, "")
    elif s == "Entered":
        dest = f'<div class="flex items-center gap-2"><span class="flex size-7 items-center justify-center rounded-full border border-dashed text-xs font-bold text-muted-foreground">?</span><span class="text-sm text-muted-foreground">Undecided</span></div>'
    else:
        dest = f'<div class="flex items-center gap-2 text-sm text-muted-foreground">{icon("chev-left","size-4")}Returning</div>'
    return f'''<li class="portal-row rounded-xl border bg-card px-4 py-3 shadow-xs transition-colors hover:bg-accent/30 {"ring-2 ring-primary/40" if highlight else ""}">
 <span class="[grid-area:avatar] self-start lg:self-center">{avatar(initials,"size-10 lg:size-11","bg-secondary text-secondary-foreground")}</span>
 <div class="[grid-area:name] min-w-0 truncate"><span class="font-display text-lg font-bold leading-none">{n}</span></div>
 <div class="[grid-area:meta] flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground"><span class="font-semibold text-foreground lg:hidden">{pos}</span><span class="lg:hidden">·</span><span>{cl} · {el} left{hw}</span>{badge(div,"muted","h-5 px-1.5 text-[10px]")}</div>
 <div class="[grid-area:pos] hidden font-display text-base font-bold lg:block">{pos}</div>
 <div class="[grid-area:schools] grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-lg bg-muted/40 px-2 py-1.5 lg:bg-transparent lg:p-0">{school(fa,fn,fc,muted=True)}<span class="text-muted-foreground">{icon("chev-right","size-4")}</span>{dest}</div>
 <div class="[grid-area:status] justify-self-end lg:justify-self-start">{badge(s, v, extra)}</div>
 <div class="[grid-area:date] text-xs text-muted-foreground tabular lg:pl-0.5"><span class="lg:hidden">{"Committed" if s=="Committed" else ("Withdrew" if s=="Withdrawn" else "Entered")} </span>{d}, 2026</div>
 {f'<a href="#" title="{story}" class="[grid-area:story] inline-flex items-center justify-self-end gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-accent">{icon("news","size-3.5")}Story{icon("chev-right","size-3")}</a>' if story else '<span class="[grid-area:story] justify-self-end px-2 py-1 text-xs text-muted-foreground" title="No Redshirt story linked (story is optional)">No story yet</span>'}
</li>'''

def head_row():
    lab = lambda area, t, cls="": f'<div class="[grid-area:{area}] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground {cls}">{t}</div>'
    return f'<div class="portal-row-head px-4 pb-1">{lab("avatar","")}{lab("name","Player")}{lab("pos","Pos")}{lab("schools","Previous → New")}{lab("status","Status · date")}{lab("story","Redshirt story","text-right")}</div>'

def stat(label, v, sub):
    return f'<div class="rounded-xl border bg-card px-4 py-3"><div class="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div><div class="mt-0.5 font-display text-3xl font-extrabold leading-none tabular">{v}</div><div class="mt-1 text-[11px] text-muted-foreground">{sub}</div></div>'

def filters_desktop():
    sel = lambda lbl, val, active=False: f'<div class="grid gap-1"><span class="text-[11px] font-medium text-muted-foreground">{lbl}</span>{select_(val, "w-full " + ("border-primary/60 bg-accent/40" if active else ""))}</div>'
    return f'''<div class="grid grid-cols-7 items-end gap-2 rounded-xl border bg-card p-3">
{sel("Sport","Football",True)}{sel("Division","FCS",True)}{sel("Status","All statuses")}{sel("Position","All positions")}{sel("Conference","All conferences")}
<div class="grid gap-1"><span class="text-[11px] font-medium text-muted-foreground">School</span>{input_("Search schools","","search")}</div>{sel("Sort","Newest first")}</div>
<div class="mt-2 flex flex-wrap items-center gap-2 text-xs"><span class="text-muted-foreground">Showing 1–8 of 131 · </span>{badge("Football "+icon("x","size-3"),"secondary")}{badge("FCS "+icon("x","size-3"),"secondary")}<a href="#" class="font-medium text-primary hover:underline">Clear all</a><span class="ml-auto font-mono text-[11px] text-muted-foreground">/transfer-portal?division=fcs</span></div>'''

def tracker():
    rows = "".join(portal_row(e) for i, e in enumerate(ENTRIES))
    stats = f'<div class="grid grid-cols-3 gap-3">{stat("Entered","214","still undecided")}{stat("Committed","131","61% of tracked")}{stat("Withdrawn","9","returned to school")}</div>'
    note = f'<p class="flex items-center gap-1.5 text-[11px] text-muted-foreground">{icon("info","size-3.5")}Editor-maintained from Redshirt reporting; not every portal entry. Rows link to a Redshirt story when there is one. Counts are for the current filters (example data).</p>'
    rail = f'''<aside class="hidden content-start gap-6 lg:grid">{card(card_header("Latest portal stories")+card_content("".join(f'<a href="#" class="block border-b py-2.5 text-sm font-semibold leading-snug last:border-0 hover:underline">{e[14]}</a>' for e in [x for x in ENTRIES if x[14]][:5]),"pb-3 pt-1"),"gap-0")}{ad(300,250)}{card(card_content(f'<div class="flex items-center gap-3"><span class="flex size-9 items-center justify-center rounded-full bg-accent text-primary">{icon("bell")}</span><div class="flex-1 text-sm"><div class="font-semibold">Portal alerts</div><div class="text-muted-foreground">Followed teams: entries and commitments</div></div>{switch(True)}</div>',"py-4"))}</aside>'''
    mobile_filters = f'''<div class="flex items-center gap-2 lg:hidden">{button("Filters · 2","outline","default","list",cls="flex-1")}{select_("Newest","flex-1")}</div>
<div class="-mx-4 flex gap-1.5 overflow-x-auto px-4 lg:hidden">{badge("Football "+icon("x","size-3"),"secondary","h-7")}{badge("FCS "+icon("x","size-3"),"secondary","h-7")}{"".join(badge(t,"outline","h-7") for t in ["Committed","QB","Big Sky"])}</div>'''
    body = f'''{ticker()}{header()}
<main class="mx-auto max-w-site px-4 lg:px-6">
 <div class="pt-5">{crumbs(["Transfer Portal","Tracker"])}
  <div class="mt-3 flex flex-wrap items-end justify-between gap-3"><div><div class="kicker text-primary">Transfer Portal · Football · 2026</div><h1 class="font-display text-[2.3rem] font-extrabold uppercase leading-none lg:text-headline-lg">Portal Tracker</h1></div>
  <div class="hidden gap-2 lg:flex">{button("Portal news","outline","sm",icon_right="chev-right")}{button("Portal alerts","default","sm","bell")}</div></div></div>
 <div class="grid gap-8 pt-5 lg:grid-cols-[minmax(0,1fr)_300px]">
  <div class="grid min-w-0 grid-cols-1 content-start gap-4">
   <div class="hidden lg:block">{filters_desktop()}</div>
   {mobile_filters}
   {stats}
   {note}
   {head_row()}
   <ol class="grid gap-2">{rows}</ol>
   <div class="pt-2">{pagination(1,17)}</div>
  </div>
  {rail}
 </div>
</main>{footer()}{bottom_nav(0)}'''
    return page("Transfer Portal Tracker", body, path="/transfer-portal?division=fcs")
