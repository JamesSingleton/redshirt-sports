"""Labeled duplicate set for scoring duplicate checks at intake.

players.csv : 20,000 existing players, names sampled from real college player
              names (first and last drawn separately, by frequency).
queries.csv : 400 re-entries of existing players (label = original id) and
              400 genuinely new players (label = empty).

Run: python3 -I generate.py <workdir>/espn-cache.json, where the cache is the
one score-player-suggestions.py leaves in its workdir. Then, from this folder,
psql -d redshirt_perf -f score.sql, -f candidates.sql, and python3 -I tiers.py.
"""

import csv
import json
import random
import sys
from collections import Counter
from pathlib import Path

random.seed(7)
HERE = Path(__file__).parent
cache = json.loads(Path(sys.argv[1]).read_text())
real = sorted({h["name"] for hits in cache.values() for h in hits})

SUFFIXES = {"Jr.", "Sr.", "II", "III", "IV"}
firsts, lasts = Counter(), Counter()
for name in real:
    words = name.split()
    if words[-1] in SUFFIXES:
        words = words[:-1]
    if len(words) < 2:
        continue
    firsts[words[0]] += 1
    lasts[" ".join(words[1:])] += 1

first_pool = list(firsts.elements())
last_pool = list(lasts.elements())
SPORTS = ["football"] * 5 + ["mens-basketball"] * 3 + ["womens-basketball"] * 2
STATES = ["TX", "FL", "GA", "CA", "OH", "PA", "NC", "AL", "LA", "IL", "VA", "MI"]
N = 20000


def person():
    suffix = random.choice(["Jr.", "II", "III"]) if random.random() < 0.06 else ""
    return {
        "first": random.choice(first_pool),
        "last": random.choice(last_pool),
        "suffix": suffix,
        "sport": random.choice(SPORTS),
        "school": f"school-{random.randrange(400)}",
        "hs": 2019 + random.randrange(7),
        "state": random.choice(STATES),
    }


players = []
for i in range(1, N + 1):
    p = person()
    p["id"] = i
    players.append(p)

NICK = {
    "Michael": "Mike", "Christopher": "Chris", "Jonathan": "Jon", "Joshua": "Josh",
    "Matthew": "Matt", "Nicholas": "Nick", "Anthony": "Tony", "William": "Will",
    "Robert": "Rob", "Daniel": "Dan", "Benjamin": "Ben", "Zachary": "Zach",
    "Joseph": "Joe", "Samuel": "Sam", "Alexander": "Alex", "Jacob": "Jake",
    "Timothy": "Tim", "Thomas": "Tom", "Andrew": "Drew", "Jeremiah": "Jay",
    "Nathaniel": "Nate", "Cameron": "Cam", "Dominic": "Dom", "Isaiah": "Zay",
    "Kenneth": "Kenny", "Gregory": "Greg", "Edward": "Eddie", "Richard": "Rich",
}
NICK.update({v: k for k, v in list(NICK.items())})


def typo(word):
    if len(word) < 4:
        return word
    i = random.randrange(1, len(word) - 1)
    op = random.choice(["swap", "drop", "double", "sub"])
    if op == "swap":
        return word[:i] + word[i + 1] + word[i] + word[i + 2:]
    if op == "drop":
        return word[:i] + word[i + 1:]
    if op == "double":
        return word[:i] + word[i] + word[i:]
    return word[:i] + random.choice("aeiou") + word[i + 1:]


def initials(first):
    if len(first) == 2 and first.isupper():
        return f"{first[0]}.{first[1]}."
    if "." in first:
        return first.replace(".", "")
    return None


def variant(p):
    """How a second editor might enter the same player."""
    kinds = ["nickname", "typo_last", "typo_first", "suffix", "initials", "hyphen", "apostrophe", "exact"]
    random.shuffle(kinds)
    for kind in kinds:
        q = dict(p)
        if kind == "nickname" and p["first"] in NICK:
            q["first"] = NICK[p["first"]]
        elif kind == "typo_last":
            q["last"] = typo(p["last"])
        elif kind == "typo_first":
            q["first"] = typo(p["first"])
        elif kind == "suffix":
            q["suffix"] = "" if p["suffix"] else "Jr."
        elif kind == "initials" and initials(p["first"]):
            q["first"] = initials(p["first"])
        elif kind == "hyphen" and (" " in p["last"] or "-" in p["last"]):
            q["last"] = p["last"].replace("-", " ") if "-" in p["last"] else p["last"].replace(" ", "-", 1)
        elif kind == "apostrophe" and ("'" in p["first"] or "'" in p["last"]):
            q["first"], q["last"] = p["first"].replace("'", ""), p["last"].replace("'", "")
        elif kind == "exact":
            pass
        else:
            continue
        # The second entry carries what the editor knew: same sport always,
        # often the same school and class.
        q["school"] = p["school"] if random.random() < 0.7 else f"school-{random.randrange(400)}"
        q["hs"] = p["hs"] if random.random() < 0.8 else ""
        q["kind"] = kind
        return q
    return None


queries = []
for p in random.sample(players, 600):
    q = variant(p)
    if q:
        q["label"] = p["id"]
        queries.append(q)
    if len(queries) == 400:
        break
for _ in range(400):
    q = person()
    q["kind"] = "new"
    q["label"] = ""
    queries.append(q)


def write(name, rows, fields):
    with open(HERE / name, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)


write("players.csv", players, ["id", "first", "last", "suffix", "sport", "school", "hs", "state"])
for i, q in enumerate(queries, 1):
    q["qid"] = i
write("queries.csv", queries, ["qid", "first", "last", "suffix", "sport", "school", "hs", "kind", "label"])
print(len(players), "players;", Counter(q["kind"] for q in queries))
print("distinct firsts", len(firsts), "lasts", len(lasts))
