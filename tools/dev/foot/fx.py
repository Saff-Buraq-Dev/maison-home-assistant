import json, datetime as dt
now = dt.datetime.now(dt.timezone.utc)
def iso(d): return d.strftime('%Y-%m-%dT%H:%MZ')
def team(id, name, logo): return {"id": id, "displayName": name, "logos": [{"href": logo}]}
L = lambda id: f"https://a.espncdn.com/i/teamlogos/soccer/500/{id}.png"
def ev(eid, d, league, slug, home, away, hs=None, as_=None, state="post", clock="90'", detail="FT"):
    return {"id": eid, "date": iso(d), "league": {"name": league, "slug": slug}, "seasonType": {"abbreviation": "Regular Season"},
      "competitions": [{"venue": {"fullName": "Old Trafford"}, "status": {"displayClock": clock, "type": {"state": state, "name": "STATUS_FULL_TIME" if state=="post" else "STATUS_X", "shortDetail": detail}},
        "competitors": [{"homeAway": "home", "team": home, "score": None if hs is None else {"displayValue": str(hs)}},
                        {"homeAway": "away", "team": away, "score": None if as_ is None else {"displayValue": str(as_)}}]}]}
MU = team("360", "Manchester United", L(360))
mu_res = {"team": {"logo": L(360)}, "events": [
  ev("1", now-dt.timedelta(days=1), "UEFA Champions League", "uefa.champions", team("2572","Como",L(2572)), MU, 4, 1),
  ev("2", now-dt.timedelta(days=4), "Premier League", "eng.1", team("357","Leeds United",L(357)), MU, 1, 1),
  ev("3", now-dt.timedelta(days=12), "Premier League", "eng.1", MU, team("367","Tottenham Hotspur",L(367)), 2, 1),
  ev("9", now-dt.timedelta(minutes=67), "Premier League", "eng.1", MU, team("364","Liverpool",L(364)), 2, 1, "in", "67'", "67'"),
]}
mu_fx = {"events": [ev("4", now+dt.timedelta(days=3, hours=2), "Premier League", "eng.1", MU, team("359","Arsenal",L(359)), state="pre"),
                    ev("5", now+dt.timedelta(days=8), "FA Cup", "eng.fa", team("331","Brighton",L(331)), MU, state="pre")]}
TUN = team("659", "Tunisia", "https://a.espncdn.com/i/teamlogos/countries/500/tun.png")
tun_res = {"team": {"logo": "https://a.espncdn.com/i/teamlogos/countries/500/tun.png"}, "events": [
  ev("11", now-dt.timedelta(days=24), "Africa Cup of Nations Qualifying", "caf.nations_qual", TUN, team("1","Botswana",""), 2, 2),
  ev("12", now-dt.timedelta(days=28), "Africa Cup of Nations Qualifying", "caf.nations_qual", TUN, team("2","Uganda",""), 1, 1),
  ev("13", now-dt.timedelta(days=118), "FIFA World Cup", "fifa.world", team("3","Netherlands",""), TUN, 1, 3)]}
summary = {"header": {"competitions": [{"status": {"displayClock": "68'", "type": {"state": "in", "shortDetail": "68'"}},
  "competitors": [{"team": {"displayName": "Manchester United"}, "score": "2"}, {"team": {"displayName": "Liverpool"}, "score": "1"}]}]},
  "keyEvents": [{"scoringPlay": True, "clock": {"displayValue": "12'"}, "team": {"displayName": "Manchester United"}, "type": {"text": "Goal"}, "participants": [{"athlete": {"displayName": "Bruno Fernandes"}}]},
                {"scoringPlay": True, "clock": {"displayValue": "40'"}, "team": {"displayName": "Liverpool"}, "type": {"text": "Goal"}, "participants": [{"athlete": {"displayName": "Mohamed Salah"}}]},
                {"scoringPlay": True, "clock": {"displayValue": "61'"}, "team": {"displayName": "Manchester United"}, "type": {"text": "Penalty - Scored"}, "participants": [{"athlete": {"displayName": "Bryan Mbeumo"}}]}]}
std = {"data": {"competition_label": "Ligue 1", "rows": [{"rank": i+1, "team_name": n, "team_logo_url": "", "points": 14-i, "played": 6, "goal_diff": 5-i, "form": "LWWW", "is_club": n=="Club Africain"} for i, n in enumerate(["US Ben Guerdane","ES Tunis","US Monastirienne","Progrès Sakiet","Club Africain","JS Omrane","CS Sfaxien","Étoile du Sahel"])]}}
pl = {"children": [{"standings": {"entries": [{"team": {"id": str(100+i) if i!=12 else "360", "shortDisplayName": n, "logos": [{"href": ""}]}, "stats": [{"name":"rank","displayValue":str(i+1)},{"name":"points","displayValue":str(25-i)},{"name":"gamesPlayed","displayValue":"8"},{"name":"pointDifferential","displayValue":str(10-i)}]} for i, n in enumerate(["Man City","Arsenal","Liverpool","Chelsea","Aston Villa","Newcastle","Spurs","Brighton","Brentford","Fulham","Everton","West Ham","Man United","Bournemouth","Wolves","Leeds","Burnley","Forest","Palace","Sunderland"])]}}]}
json.dump({"mu_res": mu_res, "mu_fx": mu_fx, "tun_res": tun_res, "tun_fx": {"events": []}, "ca": {"events": []}, "summary": summary, "std": std, "pl": pl}, open("fx.json","w"))
# CA sensors
def caline(d, opp, comp, home, cs, os_, st, el, crest): return "|".join([d.strftime('%Y-%m-%dT%H:%M'), opp, comp, home, cs, os_, st, el, crest])
ca = {
 "sensor.club_africain_a_venir_1": caline(now+dt.timedelta(days=2,hours=20), "TP Mazembe", "CAF Champions League", "1", "", "", "", "", "https://media.api-sports.io/football/teams/6435.png"),
 "sensor.club_africain_a_venir_2": caline(now+dt.timedelta(days=6), "CA Bizertin", "Ligue 1", "1", "", "", "NS", "", "https://media.api-sports.io/football/teams/981.png"),
 "sensor.club_africain_a_venir_3": caline(now+dt.timedelta(days=9), "Progrès Sakiet Eddaïer", "Ligue 1", "0", "", "", "", "", "/api/platform/v1/ticketing/crests/x.png"),
 "sensor.club_africain_resultat_1": caline(now-dt.timedelta(days=5), "TP Mazembe", "CAF Champions League", "0", "1", "1", "FT", "90", "https://media.api-sports.io/football/teams/6435.png"),
 "sensor.club_africain_resultat_2": caline(now-dt.timedelta(days=12), "US Ben Guerdane", "Ligue 1", "0", "1", "2", "", "", "https://media.api-sports.io/football/teams/986.png"),
 "sensor.club_africain_resultat_3": caline(now-dt.timedelta(days=32), "ES Zarzis", "Ligue professionnelle 1", "1", "1", "0", "FT", "90", "https://media.api-sports.io/football/teams/989.png"),
}
json.dump(ca, open("ca.json","w"), ensure_ascii=False)
