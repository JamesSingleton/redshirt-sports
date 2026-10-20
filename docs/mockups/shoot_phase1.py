"""Phase-1 reference shots (no-accounts build in ./phase1/): desktop 1440x900 @1x, tablet 820x1180 @2x, mobile 390x844 @2x,
plus dark desktop for rankings/ballots and the mega-nav/sheet states. Output: phase1/screenshots/. Full-page shots get -full."""
import asyncio, pathlib, sys
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).parent / "phase1"
OUT = ROOT / "screenshots"; OUT.mkdir(parents=True, exist_ok=True)
PAGES = [("index","home"),("article","article"),("news","news"),("division-news","division-news"),("team","team-hub"),
         ("rankings","rankings"),("ballots","ballots"),("ballots-by-voter","ballots-by-voter"),("rankings-voters","rankings-voters"),
         ("rankings-history","rankings-history"),("rankings-methodology","rankings-methodology"),("rankings-index","rankings-index")]
VP = [("desktop",1440,900,1),("tablet",820,1180,2),("mobile",390,844,2)]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        async def shot(f, name, w, h, s, q="", full=True):
            pg = await b.new_page(viewport={"width": w, "height": h}, device_scale_factor=s)
            await pg.goto((ROOT / f"{f}.html").as_uri() + q); await pg.wait_for_timeout(250)
            sw = await pg.evaluate("document.documentElement.scrollWidth")
            bad = await pg.evaluate("[...document.images].filter(i=>!i.complete||i.naturalWidth===0).length")
            print(name, w, "scrollWidth", sw, "OVERFLOW" if sw > w else "", "BROKEN-IMG" if bad else "")
            await pg.screenshot(path=str(OUT / f"{name}.png"))
            if full: await pg.screenshot(path=str(OUT / f"{name}-full.png"), full_page=True)
            await pg.close()
        for f, name in PAGES:
            for vn, w, h, s in VP: await shot(f, f"{name}-{vn}", w, h, s)
        for f, name in [("rankings","rankings"),("ballots","ballots")]:
            await shot(f, f"{name}-desktop-dark", 1440, 900, 1, "?dark", full=False)
        await shot("index", "nav-mega-desktop", 1440, 900, 1, "?mega-open", full=False)
        await shot("index", "nav-sheet-mobile", 390, 844, 2, "?menu-open", full=False)
        await b.close()
asyncio.run(main())
