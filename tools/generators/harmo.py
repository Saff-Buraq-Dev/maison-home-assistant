F = "'Inter','SF Pro Display','Segoe UI',Roboto,sans-serif"
FV = "--ha-font-family-body:" + F + "; --ha-font-family-heading:" + F + "; --mdc-typography-font-family:" + F + "; --paper-font-common-base_-_font-family:" + F + "; --primary-font-family:" + F + "; font-family:" + F + " !important;"
BG = "background: radial-gradient(120% 120% at 100% 0%, ACC, transparent 60%), linear-gradient(160deg,#171c3a,#0e1128) !important; border-radius: 24px !important; border: 1px solid rgba(255,255,255,.08) !important; box-shadow: 0 20px 40px -24px rgba(0,0,0,.7) !important; color: #eef1ff;"
LBL = "font-family:" + F + " !important; font-size: 11.5px !important; font-weight: 700 !important; letter-spacing: .1em !important; text-transform: uppercase; opacity: .6; color: #eef1ff !important;"
ACC = {'weather-forecast': 'rgba(6,182,212,.16)'}
for v in config['views']:
    for sec in v.get('sections', []):
        for c in sec.get('cards', []):
            t = c.get('type', '')
            if t.startswith('custom:maison'):
                continue
            acc = ACC.get(t, 'rgba(109,124,255,.18)')
            g = BG.replace('ACC', acc)
            if t == 'heading':
                css = "ha-card { " + FV + " color:#eef1ff; } .title p, .title { font-weight: " + ('700' if c.get('heading_style') == 'title' else '600') + " !important; letter-spacing: -.01em; }"
            elif t == 'tile':
                css = "ha-card { " + FV + " " + g + " } .primary, .name { font-weight: 600 !important; font-size: 14px !important; } .secondary, .state { font-size: 12px !important; opacity: .7; font-variant-numeric: tabular-nums; }"
            elif t == 'picture-entity':
                css = "ha-card { " + FV + " border-radius: 24px !important; overflow: hidden; background: radial-gradient(120% 120% at 50% 0%, rgba(109,124,255,.25), transparent 65%), linear-gradient(160deg,#171c3a,#0e1128) !important; border: 1px solid rgba(255,255,255,.08) !important; box-shadow: 0 20px 40px -24px rgba(0,0,0,.7) !important; } .footer { font-family:" + F + " !important; font-weight: 600; font-size: 14px; letter-spacing: .02em; background: linear-gradient(0deg, rgba(14,17,40,.85), transparent) !important; padding: 14px 18px !important; }"
            elif t == 'custom:apexcharts-card':
                css = "ha-card { " + FV + " " + g + " } #header__title, #header__title span { " + LBL + " }"
                ac = c.setdefault('apex_config', {})
                ch = ac.setdefault('chart', {})
                ch['fontFamily'] = F
                ch['foreColor'] = '#c7cdf5'
            elif t in ('statistics-graph', 'calendar', 'todo-list', 'weather-forecast'):
                css = "ha-card { " + FV + " " + g + " } .card-header, .card-header .name, h1.card-header { " + LBL + " padding-bottom: 4px !important; }"
            else:
                css = "ha-card { " + FV + " " + g + " }"
            c['card_mod'] = {'style': css}
