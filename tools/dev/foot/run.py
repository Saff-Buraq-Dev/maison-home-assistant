import json, os
from playwright.sync_api import sync_playwright
fx = json.load(open('fx.json'))
def handler(route):
    u = route.request.url
    if 'teams/360/schedule?season' in u: b = fx['mu_res']
    elif 'teams/360/schedule?fixture' in u: b = fx['mu_fx']
    elif 'teams/659/schedule?season' in u: b = fx['tun_res']
    elif 'teams/659/schedule' in u: b = fx['tun_fx']
    elif 'teams/18816' in u: b = fx['ca']
    elif 'summary' in u: b = fx['summary']
    elif 'standings?sport' in u: b = fx['std']
    elif 'eng.1/standings' in u: b = fx['pl']
    elif u.endswith('.png') or 'api-sports' in u or 'espncdn' in u:
        return route.fulfill(status=200, content_type='image/svg+xml', body='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="#c33"/></svg>')
    else: return route.continue_()
    route.fulfill(status=200, content_type='application/json', headers={'access-control-allow-origin':'*'}, body=json.dumps(b))
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width':1460,'height':1200}, timezone_id='America/Toronto')
    pg = ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type=='error' and errs.append(m.text))
    pg.route('**/*', handler)
    pg.goto('file://'+os.path.abspath('t.html').replace('t.html','')+'t.html', wait_until='load')
    pg.wait_for_timeout(1500)
    pg.screenshot(path='foot.png', full_page=True); print(errs); b.close()
