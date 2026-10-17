"""shadcn/ui-style primitives rendered as static HTML (class strings mirror shadcn/ui new-york v4 components)."""
import html as _h

ICONS = {  # lucide paths (24x24, stroke)
 "search": '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
 "menu": '<path d="M4 6h16M4 12h16M4 18h16"/>',
 "bell": '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
 "bookmark": '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
 "share": '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
 "chev-down": '<path d="m6 9 6 6 6-6"/>',
 "chev-right": '<path d="m9 18 6-6-6-6"/>',
 "chev-left": '<path d="m15 18-6-6 6-6"/>',
 "up": '<path d="m18 15-6-6-6 6"/>',
 "down": '<path d="m6 9 6 6 6-6"/>',
 "grip": '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',
 "x": '<path d="M18 6 6 18M6 6l12 12"/>',
 "plus": '<path d="M5 12h14M12 5v14"/>',
 "user": '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 "home": '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>',
 "trophy": '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.7V17c0 .6-.5 1-1 1.2C7.8 18.8 7 20.2 7 22M14 14.7V17c0 .6.5 1 1 1.2 1.2.6 2 2 2 3.8M18 2H6v7a6 6 0 0 0 12 0V2z"/>',
 "list": '<path d="M10 12h11M10 18h11M10 6h11M4 10h2M4 6h1v4M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
 "news": '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>',
 "ext": '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
 "clock": '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
 "check": '<path d="M20 6 9 17l-5-5"/>',
 "alert": '<path d="m21.7 18-8-14a2 2 0 0 0-3.5 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3"/><path d="M12 9v4M12 17h.01"/>',
 "info": '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
 "moon": '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
 "star": '<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
 "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
 "vote": '<path d="m9 12 2 2 4-4"/><path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z"/><path d="M22 19H2"/>',
 "lock": '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
 "mail": '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-10 5L2 7"/>',
 "flame": '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.3.3 1.6 1.4 2.8 2.5 2.8"/>',
 "dots": '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
 "eye": '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 "minus": '<path d="M5 12h14"/>',
 "sparkle": '<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/>',
}
def icon(name, cls="size-4"):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="{cls} shrink-0" aria-hidden="true">{ICONS[name]}</svg>'

BTN_BASE = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 cursor-pointer"
BTN_V = {
 "default": "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
 "secondary": "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
 "outline": "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
 "ghost": "hover:bg-accent hover:text-accent-foreground",
 "link": "text-primary underline-offset-4 hover:underline",
 "ink": "bg-ink text-ink-foreground hover:bg-ink/90",
}
BTN_S = {"default": "h-9 px-4 py-2", "sm": "h-8 rounded-md gap-1.5 px-3", "lg": "h-10 rounded-md px-6", "icon": "size-9", "icon-sm": "size-8", "xs": "h-7 px-2.5 text-xs rounded-md"}
def _resp(base, cls):
    """If the caller hides the element at some breakpoint, drop the base display so `hidden` wins."""
    if "hidden" in cls.split():
        base = base.replace("inline-flex ", "").replace("inline-flex", "")
    return base

def button(label, variant="default", size="default", ic=None, cls="", attrs="", icon_right=None):
    inner = (icon(ic) if ic else "") + (label or "") + (icon(icon_right) if icon_right else "")
    return f'<button type="button" data-slot="button" class="{_resp(BTN_BASE, cls)} {BTN_V[variant]} {BTN_S[size]} {cls}" {attrs}>{inner}</button>'

BADGE_V = {
 "default": "border-transparent bg-primary text-primary-foreground",
 "secondary": "border-transparent bg-secondary text-secondary-foreground",
 "outline": "text-foreground",
 "destructive": "border-transparent bg-destructive text-white",
 "muted": "border-transparent bg-muted text-muted-foreground",
}
def badge(label, variant="default", cls=""):
    return f'<span data-slot="badge" class="{_resp("inline-flex", cls)} items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 {BADGE_V[variant]} {cls}">{label}</span>'

def card(inner, cls=""):
    return f'<div data-slot="card" class="bg-card text-card-foreground flex flex-col rounded-xl border shadow-xs {cls}">{inner}</div>'
def card_header(title, desc=None, action="", cls=""):
    d = f'<div data-slot="card-description" class="text-muted-foreground text-sm">{desc}</div>' if desc else ""
    return f'<div data-slot="card-header" class="flex items-start justify-between gap-2 px-5 pt-5 {cls}"><div class="grid gap-1"><div data-slot="card-title" class="font-display text-xl font-bold uppercase leading-none tracking-wide">{title}</div>{d}</div>{action}</div>'
def card_content(inner, cls=""):
    return f'<div data-slot="card-content" class="px-5 {cls}">{inner}</div>'
def card_footer(inner, cls=""):
    return f'<div data-slot="card-footer" class="flex items-center px-5 pb-5 {cls}">{inner}</div>'

def separator(cls=""):
    return f'<div data-slot="separator" role="separator" class="bg-border shrink-0 h-px w-full {cls}"></div>'

def avatar(initials, cls="size-8", tone="bg-muted text-muted-foreground"):
    return f'<span data-slot="avatar" class="relative flex {cls} shrink-0 overflow-hidden rounded-full"><span data-slot="avatar-fallback" class="{tone} flex size-full items-center justify-center rounded-full text-[0.7em] font-semibold">{initials}</span></span>'

def team_mark(abbr, cls="size-7"):
    """Neutral placeholder logo: never real marks or colors."""
    return f'<span class="{cls} inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 bg-muted font-display text-[0.62em] font-bold tracking-wide text-muted-foreground" title="Placeholder logo">{abbr}</span>'

def tabs(items, active=0, cls="", full=False):
    out = []
    for i, t in enumerate(items):
        st = "bg-background text-foreground shadow-sm dark:bg-input/30 dark:border-input" if i == active else "text-muted-foreground hover:text-foreground"
        out.append(f'<button role="tab" data-slot="tabs-trigger" aria-selected="{str(i==active).lower()}" class="inline-flex h-[calc(100%-1px)] {"flex-1" if full else ""} items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap transition {st}">{t}</button>')
    return f'<div role="tablist" data-slot="tabs-list" class="bg-muted text-muted-foreground {_resp("inline-flex", cls)} h-9 w-fit items-center justify-center rounded-lg p-[3px] {"w-full" if full else ""} {cls}">{"".join(out)}</div>'

def underline_tabs(items, active=0, cls=""):
    """Section nav variant (Tabs restyled as underline) for hubs."""
    out = []
    for i, t in enumerate(items):
        st = "border-primary text-foreground" if i == active else "border-transparent text-muted-foreground hover:text-foreground"
        out.append(f'<a href="#" class="border-b-2 px-1 pb-3 pt-1 text-sm font-semibold whitespace-nowrap {st}">{t}</a>')
    return f'<nav class="flex gap-6 overflow-x-auto border-b {cls}">{"".join(out)}</nav>'

def input_(ph, cls="", ic=None):
    if ic:
        return f'<div class="relative {cls}"><span class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">{icon(ic)}</span><input data-slot="input" placeholder="{ph}" class="border-input h-9 w-full min-w-0 rounded-md border bg-transparent pl-8 pr-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30"></div>'
    return f'<input data-slot="input" placeholder="{ph}" class="border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground outline-none dark:bg-input/30 {cls}">'

def select_(label, cls=""):
    return f'<button data-slot="select-trigger" class="border-input flex h-9 items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs dark:bg-input/30 {cls}"><span>{label}</span>{icon("chev-down","size-4 opacity-50")}</button>'

def alert(title, desc, variant="default", ic="info"):
    tone = "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90" if variant == "destructive" else ("bg-accent/60 text-foreground border-primary/30" if variant=="brand" else "bg-card text-card-foreground")
    return f'<div data-slot="alert" role="alert" class="relative w-full rounded-lg border px-4 py-3 text-sm grid grid-cols-[calc(var(--spacing)*4)_1fr] gap-x-3 gap-y-0.5 items-start {tone}">{icon(ic,"size-4 translate-y-0.5")}<div data-slot="alert-title" class="col-start-2 font-medium tracking-tight">{title}</div><div data-slot="alert-description" class="col-start-2 text-muted-foreground text-sm">{desc}</div></div>'

def progress(pct, cls=""):
    return f'<div data-slot="progress" class="bg-primary/20 relative h-2 w-full overflow-hidden rounded-full {cls}"><div class="bg-primary h-full" style="width:{pct}%"></div></div>'

def switch(on=True):
    return f'<button role="switch" aria-checked="{str(on).lower()}" data-slot="switch" class="inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs {"bg-primary" if on else "bg-input"}"><span class="bg-background block size-4 rounded-full ring-0 transition-transform {"translate-x-[calc(100%-2px)]" if on else "translate-x-0"}"></span></button>'

def checkbox(on=False):
    return f'<span role="checkbox" aria-checked="{str(on).lower()}" class="inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs {"bg-primary border-primary text-primary-foreground" if on else "border-input"}">{icon("check","size-3.5") if on else ""}</span>'

def photo(label="Photo placeholder", cls="aspect-video", rounded="rounded-lg"):
    return f'<div class="ph-photo {cls} {rounded} relative overflow-hidden" role="img" aria-label="{label}"><span class="absolute bottom-2 left-2 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span></div>'

def ad(w, h, label=None, cls=""):
    return f'<div class="ad-slot {cls} flex items-center justify-center rounded-md border border-dashed text-[10px] font-semibold uppercase tracking-widest text-muted-foreground" style="min-height:{h}px;max-width:{w}px;width:100%" aria-label="Advertisement">{label or f"Ad · {w}×{h} reserved"}</div>'

def movement(delta):
    if delta is None:
        return f'<span class="inline-flex items-center gap-0.5 text-xs font-bold text-new">NEW</span>'
    if delta == 0:
        return f'<span class="inline-flex items-center text-muted-foreground" aria-label="No change">{icon("minus","size-3.5")}</span>'
    if delta > 0:
        return f'<span class="inline-flex items-center gap-0.5 text-xs font-bold text-up tabular" aria-label="Up {delta}">{icon("up","size-3.5")}{delta}</span>'
    return f'<span class="inline-flex items-center gap-0.5 text-xs font-bold text-down tabular" aria-label="Down {-delta}">{icon("down","size-3.5")}{-delta}</span>'

esc = _h.escape

def pagination(current, total, base="?page="):
    """shadcn Pagination markup with real links (?page=n; page 1 has no param)."""
    def href(n): return "?" if n == 1 else f"{base}{n}"
    def link(n, active=False):
        st = "border bg-background shadow-xs" if active else "hover:bg-accent hover:text-accent-foreground"
        return f'<li><a href="{href(n)}" aria-current="{"page" if active else "false"}" data-slot="pagination-link" class="inline-flex size-9 items-center justify-center rounded-md text-sm font-medium {st}">{n}</a></li>'
    items = []
    prev = f'<li><a href="{href(max(1,current-1))}" class="inline-flex h-9 items-center gap-1 rounded-md px-2.5 text-sm font-medium hover:bg-accent">{icon("chev-left")}<span class="hidden sm:block">Previous</span></a></li>'
    nxt = f'<li><a href="{href(min(total,current+1))}" class="inline-flex h-9 items-center gap-1 rounded-md px-2.5 text-sm font-medium hover:bg-accent"><span class="hidden sm:block">Next</span>{icon("chev-right")}</a></li>'
    pages = [1]
    for n in range(current-1, current+2):
        if 1 < n < total: pages.append(n)
    pages.append(total)
    last = 0
    for n in pages:
        if n - last > 1: items.append('<li><span class="flex size-9 items-center justify-center text-muted-foreground">…</span></li>')
        items.append(link(n, n == current)); last = n
    return f'<nav role="navigation" aria-label="pagination" data-slot="pagination" class="mx-auto flex w-full justify-center"><ul class="flex flex-row items-center gap-1">{prev}{"".join(items)}{nxt}</ul></nav>'
