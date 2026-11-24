"""Score player-tag suggesters against a headline answer key (portal Phase 2).

Run: python3 -I packages/db/perf/score-player-suggestions.py [workdir]
Fetches the 200 newest published posts and every school name from the public
Content Lake API, looks names up on ESPN's search (cached in workdir), and
prints recall and team checks. Results are in docs/portal-baselines.md.

Answer key (mechanical, not hand-labeled): a person named in an article's
title who ESPN's player search resolves to a college player (football, men's
or women's basketball) on one of the article's teams, or on any college team
when the article has none. Coaches and authors never resolve: ESPN's player
search returns players only.

Suggesters see title + body text and the article's teams:
  A mentions     : capitalized names, ranked by title presence then body count,
                   each resolved through ESPN to an exact-name college player.
  B team-scoped  : A, but a hit must play for one of the article's teams
                   (falls back to A when the article has no teams).
"""

import json
import re
import sys
import time
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

import tempfile

HERE = Path(sys.argv[1] if len(sys.argv) > 1 else Path(tempfile.gettempdir()) / "player-suggestions")
HERE.mkdir(parents=True, exist_ok=True)
QUERY_URL = "https://8pbt9f8w.apicdn.sanity.io/v2026-08-26/data/query/production"
POSTS_QUERY = (
    '*[_type == "post"] | order(publishedAt desc)[0...200]{_id, title, storyType,'
    ' "sport": sport->title, "teams": teams[]->{"name": coalesce(name, title), shortName, abbreviation},'
    ' "authors": authors[]->name, "body": pt::text(body)}'
)
SCHOOLS_QUERY = '*[_type == "school"]{"n": [coalesce(name, title), shortName, abbreviation]}'


def fetch_once(filename, query):
    path = HERE / filename
    if not path.exists():
        url = QUERY_URL + "?" + urllib.parse.urlencode({"query": query, "perspective": "published"})
        with urllib.request.urlopen(url, timeout=30) as r:
            path.write_bytes(r.read())
    return json.loads(path.read_text())["result"]
CACHE_PATH = HERE / "espn-cache.json"
COLLEGE = {"23": "football", "41": "mens-basketball", "54": "womens-basketball"}
TOP_K = 3
LOOKUPS_PER_POST = 8

cache = json.loads(CACHE_PATH.read_text()) if CACHE_PATH.exists() else {}


def espn(name):
    if name not in cache:
        cache[name] = espn_fetch(name)
    return cache[name]


def espn_fetch(name):
    url = "https://site.web.api.espn.com/apis/search/v2?" + urllib.parse.urlencode(
        {"query": name, "type": "player", "limit": 20}
    )
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            data = json.load(r)
    except Exception:
        data = {}
    hits = []
    for group in data.get("results", []):
        if group.get("type") != "player":
            continue
        for c in group.get("contents", []):
            uid = c.get("uid") or ""
            league = re.search(r"~l:(\d+)~", uid)
            pid = re.search(r"~a:(\d+)$", uid)
            if not league or not pid or league.group(1) not in COLLEGE:
                continue
            hits.append(
                {
                    "id": "espn:" + pid.group(1),
                    "name": c.get("displayName") or "",
                    "team": c.get("subtitle") or "",
                }
            )
    time.sleep(0.1)
    return hits


TOKEN = r"(?!(?:Jr|Sr|II|III|IV)\b)(?:[A-Z][a-z]*[A-Z]?[a-z'’\-]+|[A-Z]{2}|[A-Z]\.[A-Z]\.)"
SUFFIX = r"(?:\s(?:Jr\.|Sr\.|II|III|IV))?"
NAME = re.compile(rf"\b{TOKEN}(?:\s{TOKEN}){{1,2}}{SUFFIX}")
STOP = set(
    """The A An No Week Big Sky SoCon State University College Conference North South East West
    Northern Southern Eastern Western Central January February March April May June July August
    September October November December Monday Tuesday Wednesday Thursday Friday Saturday Sunday
    FCS FBS NCAA CFP Bowl Playoff Top Preview Recap Game Football Basketball Men Women Women's Men's
    Division Valley Missouri Ohio Coast Pacific Atlantic Mountain Sun Belt American Ivy League
    Coach Head Coordinator Quarterback Freshman Sophomore Junior Senior Redshirt Transfer Portal
    One Two Three Four Five Six Seven Eight Nine Ten First Second Third Late Touchdown Touchdowns
    Field Goal Points Win Wins Beats Past Over Scores Leads Lifts
    So But And Then Also When While After Before Since Though Although If As Both Even Only Still Yet Senior Junior Sophomore Freshman Guard Forward Center Receiver Linebacker Running Back Kicker Safety Tackle End Cornerback Defensive Offensive""".split()
)


def names(text):
    out = []
    for m in NAME.finditer(text or ""):
        tokens = re.sub(r"['’]s$", "", m.group(0)).split()
        while tokens and tokens[0] in STOP:
            tokens.pop(0)
        while tokens and tokens[-1] in STOP:
            tokens.pop()
        if len(tokens) >= 2:
            out.append(" ".join(tokens))
    return out


def norm(s):
    import unicodedata
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", re.sub(r"[^a-z ]", " ", s.lower().replace("’", "'"))).strip()


GENERIC = {"university", "of", "the", "college", "at", "state"}


def school_parts(espn_team):
    """'Massachusetts Minutemen' -> {'massachusetts minutemen', 'massachusetts'} (mascot dropped)."""
    words = norm(espn_team).split()
    return {" ".join(words[: len(words) - k]) for k in (0, 1, 2) if len(words) - k >= 1}


def team_ok(hit, post):
    teams = post.get("teams") or []
    if not teams:
        return True
    parts = school_parts(hit["team"])
    for team in teams:
        for label in (team.get("shortName"), team.get("name"), team.get("abbreviation")):
            l = norm(label)
            if not l:
                continue
            for part in parts:
                if set(part.split()) <= GENERIC:
                    continue
                if f" {part} " in f" {l} " or f" {l} " in f" {norm(hit['team'])} ":
                    return True
    return False


def resolve(name, post, scoped):
    for hit in espn(name):
        if norm(hit["name"]) != norm(name):
            continue
        if scoped and not team_ok(hit, post):
            continue
        return hit
    return None


def in_title(name, title):
    return f" {norm(name)} " in f" {norm(title)} "


def ranked_candidates(post):
    """Body names (sentence case is reliable); headline-named ones first."""
    title = post.get("title") or ""
    counts = Counter(names(post.get("body") or ""))
    return sorted(counts, key=lambda n: (in_title(n, title), counts[n]), reverse=True)


SCHOOLS = set()
ROLE = r"(?:coach|coaches|commissioner|coordinator|director|president|chancellor|announcer|analyst|reporter|writer|columnist|AD)"


def named_as_staff(name, post):
    text = (post.get("title") or "") + "\n" + (post.get("body") or "")
    n = re.escape(name)
    return bool(
        re.search(rf"\b{ROLE}\b[^.\n]{{0,25}}?\b{n}\b", text, re.I)
        or re.search(rf"\b{n}\b(?:['’]s)?\W+(?:is|was|as|,)\W+(?:[a-z-]+\W+){{0,4}}{ROLE}\b", text, re.I)
    )


def suggest(post, scoped):
    out = []
    names_ = [n for n in ranked_candidates(post) if norm(n) not in SCHOOLS and not named_as_staff(n, post)]
    for name in names_[:LOOKUPS_PER_POST]:
        hit = resolve(name, post, scoped)
        if hit and hit["id"] not in [h["id"] for h in out]:
            out.append(hit)
        if len(out) == TOP_K:
            break
    return out


def key_for(post):
    """Headline subjects: named in both title and body, resolved on ESPN."""
    title = post.get("title") or ""
    found = []
    for name in set(names(post.get("body") or "")):
        if not in_title(name, title) or named_as_staff(name, post):
            continue
        hit = resolve(name, post, scoped=True)
        if hit and hit["id"] not in [h["id"] for h in found]:
            found.append(hit)
    return found


def prefetch(posts):
    from concurrent.futures import ThreadPoolExecutor
    wanted = set()
    for post in posts:
        wanted.update(ranked_candidates(post)[:LOOKUPS_PER_POST])
        wanted.update(n for n in names(post.get("body") or "") if in_title(n, post.get("title") or ""))
    todo = sorted(n for n in wanted if n not in cache)
    print(f"prefetching {len(todo)} names", file=sys.stderr)
    def one(name):
        return name, espn_fetch(name)
    with ThreadPoolExecutor(max_workers=6) as pool:
        for i, (name, hits) in enumerate(pool.map(one, todo)):
            cache[name] = hits
            if i % 100 == 0:
                CACHE_PATH.write_text(json.dumps(cache))
    CACHE_PATH.write_text(json.dumps(cache))


def main():
    posts = fetch_once("posts.json", POSTS_QUERY)
    schools = {norm(x) for row in fetch_once("schools.json", SCHOOLS_QUERY) for x in row["n"] if x}
    SCHOOLS.update(schools)
    prefetch(posts)
    rows = []
    for i, post in enumerate(posts):
        key = key_for(post)
        a = suggest(post, scoped=False)
        b = suggest(post, scoped=True)
        rows.append({"id": post["_id"], "title": post["title"], "teams": [t.get("shortName") for t in post.get("teams") or []], "key": key, "A": a, "B": b})
        if i % 20 == 0:
            CACHE_PATH.write_text(json.dumps(cache))
            print(f"{i}/{len(posts)}", file=sys.stderr)
    CACHE_PATH.write_text(json.dumps(cache))
    (HERE / "results.json").write_text(json.dumps(rows, indent=1))

    keyed = [r for r in rows if r["key"]]
    unkeyed = [r for r in rows if not r["key"]]
    print(f"posts {len(rows)} | with a headline player {len(keyed)} | without {len(unkeyed)}")
    for m in ("A", "B"):
        found = sum(len({h["id"] for h in r["key"]} & {h["id"] for h in r[m]}) for r in keyed)
        total = sum(len(r["key"]) for r in keyed)
        first = sum(1 for r in keyed if r[m] and r[m][0]["id"] in {h["id"] for h in r["key"]})
        on_team = [team_ok(h, {"teams": [{"shortName": t} for t in r["teams"]]}) for r in rows if r["teams"] for h in r[m]]
        noise = [len(r[m]) for r in unkeyed]
        print(
            f"{m}: recall@{TOP_K} {found}/{total} = {found/total:.0%} | headline player ranked first {first}/{len(keyed)}"
            f" | suggestions on the article's teams {sum(on_team)}/{len(on_team)}"
            f" | avg suggestions on posts with no headline player {sum(noise)/len(noise):.2f}"
            f" | posts with no suggestion {sum(1 for r in rows if not r[m])}"
        )


if __name__ == "__main__":
    main()
