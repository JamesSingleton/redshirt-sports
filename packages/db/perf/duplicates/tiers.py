import csv
from collections import defaultdict, Counter
byq=defaultdict(list)
for r in csv.DictReader(open("cands.csv")): byq[r["qid"]].append(r)
allq={r["qid"]:(r["kind"],r["label"]) for r in csv.DictReader(open("queries.csv"))}
b=lambda v: v=="1"
def run(t_show, t_ctx_show, t_block, t_ctx_block):
    res=Counter(); missed=Counter()
    for qid,(kind,label) in allq.items():
        cands=byq.get(qid,[])
        def ctx(c): return b(c["same_sport"]) and (b(c["same_school"]) or b(c["same_hs"]))
        shown=[c for c in cands if float(c["sim"])>=t_show or (float(c["sim"])>=t_ctx_show and ctx(c))][:8]
        likely=[c for c in shown if float(c["sim"])>=t_block or (float(c["sim"])>=t_ctx_block and ctx(c))]
        if kind=="new":
            res["new"]+=1; res["new_shown"]+=bool(shown); res["new_blocked"]+=bool(likely); res["new_list"]+=len(shown)
        else:
            res["dup"]+=1
            res["dup_shown"]+=any(c["id"]==label for c in shown)
            hit=any(c["id"]==label for c in likely); res["dup_blocked"]+=hit
            if not hit: missed[kind]+=1
    return res, missed
print("show(alone/ctx) block(alone/ctx) | dup in list | dup in 'likely' (blocks save) | new shown any | new blocked | avg list (new) | dups not flagged likely")
for show in [(0.3,0.3),(0.5,0.3),(0.6,0.3)]:
  for block in [(0.8,0.4),(0.8,0.5),(0.9,0.4),(0.7,0.4),(1.01,0.4)]:
    r,m=run(*show,*block)
    print(f"{show} {block} | {r['dup_shown']}/{r['dup']} | {r['dup_blocked']}/{r['dup']} | {r['new_shown']}/{r['new']} | {r['new_blocked']}/{r['new']} | {r['new_list']/r['new']:.2f} | {dict(m)}")
