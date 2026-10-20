"""Phase-1 teams page + nav-open shots. Output: phase1/screenshots/."""
import asyncio, pathlib
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).parent / "phase1"; OUT = ROOT / "screenshots"
VP = {"desktop":(1440,900,1),"tablet":(820,1180,2),"mobile":(390,844,2)}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        async def shot(f, name, vp, q="", full=False):
            w,h,s = VP[vp]; pg = await b.new_page(viewport={"width":w,"height":h}, device_scale_factor=s)
            await pg.goto((ROOT/f"{f}.html").as_uri()+q); await pg.wait_for_load_state("networkidle"); await pg.wait_for_timeout(300)
            sw = await pg.evaluate("document.documentElement.scrollWidth")
            bad = await pg.evaluate("[...document.images].filter(i=>i.complete&&i.naturalWidth===0).length")
            print(name, w, "scrollWidth", sw, "OVERFLOW" if sw>w else "", f"BROKEN-IMG {bad}" if bad else "")
            await pg.screenshot(path=str(OUT/f"{name}.png"), full_page=full); await pg.close()
        for vp in VP:
            await shot("teams", f"teams-{vp}", vp); await shot("teams", f"teams-{vp}-full", vp, full=True)
        await shot("teams", "nav-open-desktop", "desktop", "?mega-fb")
        await shot("teams", "nav-open-desktop-mbb", "desktop", "?mega-mbb")
        await shot("teams", "nav-open-tablet", "tablet", "?menu-open")
        await shot("teams", "nav-open-mobile", "mobile", "?menu-open")
        await shot("index", "nav-mega-desktop", "desktop", "?mega-fb")
        await shot("index", "nav-sheet-mobile", "mobile", "?menu-open")
        await b.close()
asyncio.run(main())
