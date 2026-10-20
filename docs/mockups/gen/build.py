import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from pages import home, article, bracket, ballot
from pages5 import rankings, rankings_index, ballots_page, ballots_by_voter, rankings_voters, rankings_history, rankings_methodology
from pages3 import tracker, variants
from pages4 import college_hub
from pages6 import teams_page
from pages7 import news_index as news7, division_news as divnews7, conference_news, team_hub as team7, news_loading, rankings_loading
from pages2 import bracket_page, news_index, division_news, portal_page, recruiting_page, team_hub
out = os.path.join(os.path.dirname(__file__), "..", "phase1" if os.environ.get("RS_PHASE1") == "1" else "")
os.makedirs(out, exist_ok=True)
PHASE1_PAGES = {"index","article","news","division-news","team","rankings","rankings-index","ballots","ballots-by-voter","rankings-voters","rankings-history","rankings-methodology","teams","conference-news","news-loading","rankings-loading"}
for name, fn in [("index", home), ("article", article), ("rankings", rankings), ("rankings-index", rankings_index), ("bracket", bracket_page), ("bracket-picks", bracket),
                 ("ballot", ballot), ("team", team7), ("ballots", ballots_page), ("news", news7), ("division-news", divnews7),
                 ("transfer-portal", portal_page), ("recruiting", recruiting_page), ("portal-tracker", tracker), ("portal-row-variants", variants), ("college", college_hub),
                 ("ballots-by-voter", ballots_by_voter), ("rankings-voters", rankings_voters), ("rankings-history", rankings_history), ("rankings-methodology", rankings_methodology), ("teams", teams_page), ("conference-news", conference_news), ("news-loading", news_loading), ("rankings-loading", rankings_loading)]:
    if os.environ.get("RS_PHASE1") == "1" and name not in PHASE1_PAGES: continue
    open(os.path.join(out, f"{name}.html"), "w").write(fn())
print("built")
