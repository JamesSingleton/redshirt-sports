"""v1.7 shared EXAMPLE poll data: 22 example voters, 8 weeks (Preseason..Week 7) of
seeded example ballots, tabulated 25-to-1. Every name, outlet and number is fake."""
import random
from layout import TEAMS

EXTRA = [(f"ET{c}", f"Example Team {c}", "Example Conf", "4-2") for c in "ABCDEFG"]
POOL = TEAMS + EXTRA                      # 32 teams; TEAMS[0..24] = Week 7 consensus order
N = 22                                    # voters on the example panel
WEEKS = ["Preseason"] + [f"Week {i}" for i in range(1, 8)]
WK_SHORT = ["Pre"] + [f"W{i}" for i in range(1, 8)]
CUR = 7

OUTLETS = [("Example Gazette","Beat writer"),("Example Radio 1450","Broadcaster"),("Example Daily","Columnist"),
 ("Example Sports Network","Analyst"),("Example Tribune","Beat writer"),("Example Pod","Podcast host"),
 ("Example Herald","Beat writer"),("Example TV 7","Sports director"),("Example Courier","Beat writer"),
 ("Example Digital","Editor"),("Example Post","Columnist"),("Example Journal","Beat writer"),
 ("Example Wire","National writer"),("Example Radio 980","Broadcaster"),("Example Times","Beat writer"),
 ("Redshirt Sports","Staff writer"),("Example Ledger","Beat writer"),("Example Network","Analyst"),
 ("Example Star","Columnist"),("Example Record","Beat writer"),("Redshirt Sports","Staff writer"),("Example Review","Editor")]
MARKETS = ["Big Sky","MVFC","CAA","UAC","SoCon","Patriot","Southland","National"]
VOTERS = [dict(n=i, name=f"Example Voter {i+1:02d}", slug=f"example-voter-{i+1:02d}",
               ini=f"V{i+1:02d}", outlet=OUTLETS[i][0], role=OUTLETS[i][1],
               market=MARKETS[(i*3) % len(MARKETS)], since=2022 + (i*7) % 5,
               ballots=CUR + 1 - (1 if i in (4, 15) else 0)) for i in range(N)]

def _strength():
    """Underlying example 'strength' order per week; week 7 = POOL order."""
    s = [list(range(len(POOL)))]
    rng = random.Random(7)
    for w in range(CUR, 0, -1):          # walk back in time
        cur = s[0][:]
        for _ in range(6):
            i = rng.randrange(0, 28); j = min(len(cur)-1, i + rng.choice([1, 2, 3, 4]))
            cur[i], cur[j] = cur[j], cur[i]
        s.insert(0, cur)
    order = s  # order[w] = list of team idx, strongest first
    # scripted storylines (example): ETB & ETE ranked last week, fall out; ETF/ETG got votes last week, none now
    def put(w, team, pos):
        o = order[w]; o.remove(team); o.insert(pos, team)
    put(CUR-1, 26, 20); put(CUR-1, 29, 23); put(CUR-1, 30, 27); put(CUR-1, 31, 28)
    for t, p in [(30, 31), (31, 30), (29, 29), (26, 28)]: put(CUR, t, p)
    put(0, 1, 0)  # Montana State No. 1 preseason (example)
    put(3, 1, 0); put(4, 1, 0)
    return order

ORDER = _strength()

def _ballots(w):
    rng = random.Random(100 + w)
    pos = {t: k for k, t in enumerate(ORDER[w])}
    out = []
    for v in range(N):
        sc = []
        for t in range(len(POOL)):
            p = pos[t]; noise = rng.gauss(0, 0.9 + p * 0.11)
            if w == CUR:                         # scripted outliers (example)
                if v == 6 and t == 1: noise = 10
                if v == 17 and t == 27: noise = -17
                if v == 11 and t == 0: noise = 6
                if v == 3 and t == 13: noise = 16
                if v == 20 and t == 9: noise = -8
            if t >= 29 and w == CUR: noise += 6   # ETE/ETF/ETG get no votes this week
            sc.append((p + noise, t))
        out.append([t for _, t in sorted(sc)[:25]])
    return out

def tabulate(ballots):
    pts = {t: 0 for t in range(len(POOL))}; fpv = {t: 0 for t in range(len(POOL))}; on = {t: 0 for t in range(len(POOL))}
    for b in ballots:
        for r, t in enumerate(b):
            pts[t] += 25 - r; on[t] += 1
        fpv[b[0]] += 1
    order = sorted([t for t in pts if pts[t] > 0], key=lambda t: (-pts[t], -fpv[t], POOL[t][1]))
    return dict(pts=pts, fpv=fpv, on=on, order=order, rank={t: k+1 for k, t in enumerate(order)})

BALLOTS = [_ballots(w) for w in range(CUR + 1)]
RES = [tabulate(b) for b in BALLOTS]
NOW, PREV = RES[CUR], RES[CUR-1]
TOP = NOW["order"][:25]
ORV = NOW["order"][25:]
PREV_TOP = PREV["order"][:25]
DROPPED = [t for t in PREV_TOP if t not in TOP]                              # ranked last week, not now
NO_LONGER = [t for t in PREV["order"] if NOW["pts"][t] == 0]                # got votes last week, none now

def prev_rank(t):
    r = PREV["rank"].get(t)
    return r if r and r <= 25 else None

def move(t):
    p = prev_rank(t)
    return None if p is None else p - NOW["rank"][t]

def history_rank(t, w):
    r = RES[w]["rank"].get(t)
    return r if r and r <= 25 else None

NO1 = [(WEEKS[w], RES[w]["order"][0], RES[w]["fpv"][RES[w]["order"][0]]) for w in range(CUR + 1)]

# --- outliers (methodology rule; thresholds are config) ---
OUT_GAP = 8; OUT_OMIT = 15
def voter_rows(v, w=CUR):
    """Full ballot with diff vs consensus. diff>0: voter ranked the team higher than consensus."""
    b = BALLOTS[w][v]; cons = RES[w]["rank"]
    rows = []
    for r, t in enumerate(b, 1):
        c = cons[t]; diff = c - r
        out = abs(diff) >= OUT_GAP
        rows.append(dict(rank=r, team=t, cons=c, diff=diff, out=out))
    omitted = [t for t in RES[w]["order"][:OUT_OMIT] if t not in b]
    ranked = [x for x in rows if x["cons"] <= 25]
    gap = sum(abs(x["diff"]) for x in ranked) / max(1, len(ranked))
    nout = sum(1 for x in rows if x["out"]) + len(omitted)
    return rows, omitted, gap, nout

def cell_out(v, t, w=CUR):
    r = {tt: k+1 for k, tt in enumerate(BALLOTS[w][v])}.get(t); c = RES[w]["rank"][t] if t in RES[w]["rank"] else 99
    if r is None: return c <= OUT_OMIT
    return abs(c - r) >= OUT_GAP

if __name__ == "__main__":
    print("top5", [(POOL[t][1], NOW["pts"][t], NOW["fpv"][t], NOW["on"][t]) for t in TOP[:5]])
    print("25th", POOL[TOP[24]][1], NOW["on"][TOP[24]])
    print("ORV", [(POOL[t][1], NOW["pts"][t]) for t in ORV])
    print("dropped", [(POOL[t][1], PREV["rank"][t], NOW["pts"][t]) for t in DROPPED])
    print("nolonger", [(POOL[t][1], PREV["rank"].get(t), PREV["pts"][t]) for t in NO_LONGER])
    print("no1", [(w, POOL[t][1], f) for w, t, f in NO1])
    print("top order equals TEAMS?", sum(1 for k,t in enumerate(TOP) if t==k))
    for v in range(N):
        rows, om, gap, n = voter_rows(v); print(VOTERS[v]["name"], round(gap,2), n, [POOL[t][1] for t in om])
