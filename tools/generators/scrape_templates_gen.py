import json
PAT = r'\{"id":"([0-9a-f-]{36})","opponent":"([^"]*)","opponent_crest":(?:"([^"]*)"|null),"starts_at":"([^"]*)","competition":(?:"([^"]*)"|null),"venue":(?:"[^"]*"|null),"sport_category":(?:"([^"]*)"|null),"custom_title":(?:"[^"]*"|null),"gender":(?:"([^"]*)"|null),"age_group":(?:"([^"]*)"|null),.*?"is_home":(true|false),.*?"ca_score":(null|\d+),"opp_score":(null|\d+),"live_status":(?:"([^"]*)"|null),"live_elapsed":(null|\d+)'
def tpl(kind, k):
    pat = PAT.replace('\\', '\\\\')
    lst = "(ns.up | sort)" if kind == 'up' else "(ns.past | sort(reverse=true))"
    return ("{% set u = value | replace('\\\\\"', '\"') %}"
      "{% set live = ['1H','HT','2H','ET','BT','P','LIVE','INT','SUSP'] %}"
      "{% set ns = namespace(ids=[], up=[], past=[]) %}"
      "{% for r in u | regex_findall('" + pat + "') %}"
      "{% if r[0] not in ns.ids and r[5] == 'Football' and r[6] not in ['female','feminin','women'] and r[7] in ['', 'Senior'] %}"
      "{% set ns.ids = ns.ids + [r[0]] %}"
      "{% set line = [r[3][:16], r[1], r[4], '1' if r[8] == 'true' else '0', r[9] | replace('null',''), r[10] | replace('null',''), r[11], r[12] | replace('null',''), r[2]] | join('|') %}"
      "{% if r[11] in live or (r[9] == 'null' and as_datetime(r[3]) > now() - timedelta(hours=4)) %}{% set ns.up = ns.up + [line] %}"
      "{% elif r[9] != 'null' %}{% set ns.past = ns.past + [line] %}{% endif %}"
      "{% endif %}{% endfor %}"
      "{% set l = " + lst + " %}{{ l[" + str(k) + "] if l | length > " + str(k) + " else 'aucun' }}")
sensors = [("CA match 0", 'up', 0), ("CA match +1", 'up', 1), ("CA match +2", 'up', 2),
           ("CA match -1", 'past', 0), ("CA match -2", 'past', 1), ("CA match -3", 'past', 2)]
json.dump([{"name": n, "tpl": tpl(kd, k)} for n, kd, k in sensors], open('sensors.json', 'w'), ensure_ascii=False, indent=1)
print(tpl('up', 0))
