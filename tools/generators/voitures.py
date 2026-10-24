import json
PIC = "ha-card { border-radius: 24px !important; overflow: hidden; background: radial-gradient(120% 120% at 50% 0%, rgba(109,124,255,.25), transparent 65%), linear-gradient(160deg,#171c3a,#0e1128) !important; border: 1px solid rgba(255,255,255,.08) !important; }"
def stat(e, n, i, c, **kw):
    d = {"type": "custom:maison-stat-card", "entity": e, "name": n, "icon": i, "color": c, "grid_options": {"columns": 6, "rows": 2}}
    d.update(kw); return d
def car(name, p, img, specific_title, specific):
    return {"type": "grid", "column_span": 2, "cards": [
        {"type": "heading", "heading": name, "heading_style": "title", "icon": "mdi:car-side",
         "badges": [{"type": "entity", "entity": f"sensor.{p}_derniere_interrogation", "show_state": True, "show_icon": True, "icon": "mdi:update", "state_content": "last_changed"}]},
        {"type": "picture-entity", "entity": f"lock.{p}_door_lock", "name": name, "image": img, "show_state": True, "show_name": True,
         "fit_mode": "contain", "tap_action": {"action": "more-info"}, "grid_options": {"columns": "full", "rows": 4}, "card_mod": {"style": PIC}},
        stat(f"sensor.{p}_fuel_level", "Essence", "mdi:gas-station", "sun", max=100, max_label="du réservoir"),
        stat(f"sensor.{p}_total_driving_range", "Autonomie", "mdi:map-marker-distance", "ocean", decimals=0),
        stat(f"sensor.{p}_odometer", "Odomètre", "mdi:counter", "slate", decimals=0),
        stat(f"sensor.{p}_car_battery_level", "Batterie 12 V", "mdi:car-battery", "mint", max=100, max_label="de charge"),
        {"type": "tile", "entity": f"lock.{p}_door_lock", "name": "Portes", "features": [{"type": "lock-commands"}], "grid_options": {"columns": 12}},
        {"type": "custom:maison-devices-card", "devices": [
            {"entity": f"switch.{p}_climate", "name": "Climatisation à distance", "icon": "mdi:air-conditioner", "states": {"on": "En marche", "off": "Arrêtée"}},
            {"entity": f"binary_sensor.{p}_tire_pressure_all", "name": "Pneus", "icon": "mdi:car-tire-alert", "states": {"off": "Pression normale", "on": "Pression basse !"}, "tone": {"off": "good", "on": "bad"}},
            {"entity": f"sensor.{p}_dtc_count", "name": "Codes d'anomalie", "icon": "mdi:engine-outline", "states": {"0": "Aucun"}, "tone": {"0": "good"}},
            {"entity": f"sensor.{p}_geocoded_location", "name": "Position", "icon": "mdi:map-marker", "more_info": f"device_tracker.{p}_location"}]},
        {"type": "heading", "heading": specific_title, "heading_style": "subtitle", "icon": "mdi:star-outline"},
        {"type": "custom:maison-devices-card", "devices": specific}]}
niro_spec = [
    {"entity": "sensor.niro_ev_battery_level", "name": "Batterie hybride", "icon": "mdi:battery-charging-medium", "show_state": False,
     "metrics": [{"entity": "sensor.niro_ev_battery_level", "decimals": 0}, {"entity": "sensor.niro_ev_range", "prefix": "Autonomie élec. ", "decimals": 0}]},
    {"entity": "switch.niro_ev_charging", "name": "Recharge", "icon": "mdi:ev-station", "states": {"on": "En cours", "off": "Arrêtée"},
     "metrics": [{"entity": "sensor.niro_estimated_station_charge_duration", "prefix": "Borne : ", "decimals": 0}]}]
carn_spec = [
    {"entity": "sensor.carnival_last_service", "name": "Dernier entretien", "icon": "mdi:wrench-clock", "show_state": False,
     "metrics": [{"entity": "sensor.carnival_last_service", "prefix": "À ", "decimals": 0}]},
    {"entity": "sensor.carnival_next_service", "name": "Prochain entretien", "icon": "mdi:calendar-wrench", "show_state": False,
     "metrics": [{"entity": "sensor.carnival_next_service", "prefix": "À ", "decimals": 0}]}]
secs = [car("Niro", "niro", "/api/image/serve/52b119fd105f29a179d5065442a55180/original", "Propre à la Niro (hybride rechargeable)", niro_spec),
        car("Carnival", "carnival", "/api/image/serve/24ebc4ea7044b2804ae0fccfda9e3f9d/original", "Propre à la Carnival", carn_spec)]
t = "config['views'][4]['sections'] = " + json.dumps(secs, ensure_ascii=False).replace("true", "True").replace("false", "False")
open("voit_t.txt", "w").write(t); print(t)
