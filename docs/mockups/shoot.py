from playwright.sync_api import sync_playwright
import os, sys
base = "file://" + os.path.abspath(os.path.dirname(__file__))
out = os.path.join(os.path.dirname(__file__), "screenshots")
D = {"width": 1440, "height": 900}; M = {"width": 390, "height": 844}
pages = [("home","index.html"),("article","article.html"),("rankings","rankings.html"),("bracket","bracket.html"),
         ("bracket-picks","bracket-picks.html"),("ballot-vote","ballot.html"),("team-hub","team.html"),("ballots","ballots.html"),
         ("news","news.html"),("division-news","division-news.html"),("transfer-portal","transfer-portal.html"),("recruiting","recruiting.html"),("portal-tracker","portal-tracker.html")]
shots = []
for n,f in pages:
    shots += [(f"{n}-desktop", f, D, ""), (f"{n}-mobile", f, M, "")]
shots += [("home-desktop-dark","index.html",D,"?dark"),("nav-mega-desktop","index.html",D,"?mega-open"),("nav-sheet-mobile","index.html",M,"?menu-open"),("ballots-desktop-dark","ballots.html",D,"?dark")]
full = {"home-desktop","article-desktop","rankings-desktop","team-hub-desktop","ballots-desktop","news-desktop","division-news-desktop","transfer-portal-desktop","recruiting-desktop","portal-tracker-desktop"}
only = set(sys.argv[1:])
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", args=["--no-sandbox"])
    for name, f, vp, q in shots:
        if only and not any(name.startswith(o) for o in only): continue
        mobile = vp["width"] < 500
        ctx = b.new_context(viewport=vp, device_scale_factor=2 if mobile else 1, is_mobile=mobile, has_touch=mobile)
        pg = ctx.new_page(); pg.goto(f"{base}/{f}{q}"); pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(250)
        pg.screenshot(path=f"{out}/{name}.png")
        if name in full: pg.screenshot(path=f"{out}/{name}-full.png", full_page=True)
        ctx.close()
    b.close()
print("done")
