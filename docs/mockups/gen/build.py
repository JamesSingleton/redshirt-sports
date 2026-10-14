import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from pages import home, article, bracket, ballot
from pages5 import rankings, ballots_page, ballots_by_voter, rankings_voters, rankings_history, rankings_methodology
from pages3 import tracker
from pages4 import college_hub
from pages2 import bracket_page, news_index, division_news, portal_page, recruiting_page, team_hub
out = os.path.join(os.path.dirname(__file__), "..")
for name, fn in [("index", home), ("article", article), ("rankings", rankings), ("bracket", bracket_page), ("bracket-picks", bracket),
                 ("ballot", ballot), ("team", team_hub), ("ballots", ballots_page), ("news", news_index), ("division-news", division_news),
                 ("transfer-portal", portal_page), ("recruiting", recruiting_page), ("portal-tracker", tracker), ("college", college_hub),
                 ("ballots-by-voter", ballots_by_voter), ("rankings-voters", rankings_voters), ("rankings-history", rankings_history), ("rankings-methodology", rankings_methodology)]:
    open(os.path.join(out, f"{name}.html"), "w").write(fn())
print("built")
