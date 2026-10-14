import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from pages import home, article, rankings, bracket, ballot
from pages3 import tracker
from pages2 import bracket_page, ballots_page, news_index, division_news, portal_page, recruiting_page, team_hub
out = os.path.join(os.path.dirname(__file__), "..")
for name, fn in [("index", home), ("article", article), ("rankings", rankings), ("bracket", bracket_page), ("bracket-picks", bracket),
                 ("ballot", ballot), ("team", team_hub), ("ballots", ballots_page), ("news", news_index), ("division-news", division_news),
                 ("transfer-portal", portal_page), ("recruiting", recruiting_page), ("portal-tracker", tracker)]:
    open(os.path.join(out, f"{name}.html"), "w").write(fn())
print("built")
