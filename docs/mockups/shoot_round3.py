"""Round-3 Phase-1 shots (changed pages). desktop 1440x900@1, tablet 820x1180@2, mobile 390x844@2; -full = full page."""
import asyncio, pathlib
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).parent / "phase1"; OUT = ROOT / "screenshots"
VP = [("desktop",1440,900,1),("tablet",820,1180,2),("mobile",390,844,2)]
PAGES = [("index","home"),("article","article"),("news","news"),("division-news","division-news"),("conference-news","conference-news"),
         ("team","team-hub"),("news-loading","news-loading"),("rankings-loading","rankings-loading")]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        async def shot(f, name, w, h, s, q="", full=True):
            pg = await b.new_page(viewport={"width":w,"height":h}, device_scale_factor=s, reduced_motion="reduce")
            await pg.goto((ROOT/f"{f}.html").as_uri()+q); await pg.wait_for_load_state("networkidle"); await pg.wait_for_timeout(250)
            sw = await pg.evaluate("document.documentElement.scrollWidth")
            print(name, w, sw, "OVERFLOW" if sw > w else "")
            await pg.screenshot(path=str(OUT/f"{name}.png"))
            if full: await pg.screenshot(path=str(OUT/f"{name}-full.png"), full_page=True)
            await pg.close()
        for f, n in PAGES:
            for vn, w, h, s in VP: await shot(f, f"{n}-{vn}", w, h, s)
        await shot("division-news", "division-news-combobox-desktop", 1440, 900, 1, "?combo-open", False)
        await shot("division-news", "division-news-combobox-mobile", 390, 844, 2, "?combo-open", False)
        await b.close()
asyncio.run(main())
