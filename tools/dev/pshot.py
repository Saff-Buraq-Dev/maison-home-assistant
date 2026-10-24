from playwright.sync_api import sync_playwright
import datetime, os
with sync_playwright() as p:
    b=p.chromium.launch()
    for name,iso in [('p1','2026-10-22T15:00:00'),('p2','2026-10-22T21:30:00'),('p3','2026-10-23T02:10:00')]:
        ctx=b.new_context(viewport={'width':800,'height':380},timezone_id='America/Toronto')
        pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.clock.install(time=datetime.datetime.fromisoformat(iso+'-04:00'))
        pg.goto('file://'+os.path.abspath('prayer.html')); pg.wait_for_timeout(300)
        pg.screenshot(path=name+'.png'); print(name,errs); ctx.close()
    b.close()
