import json
def dev(devices): return {"type": "custom:maison-devices-card", "devices": devices}
def H(t, i, sub=False): return {"type": "heading", "heading": t, "heading_style": "subtitle" if sub else "title", "icon": i}
def stat(n, i, c, **kw):
    d = {"type": "custom:maison-stat-card", "name": n, "icon": i, "color": c, "grid_options": {"columns": 12, "rows": 2}}; d.update(kw); return d
kpi = {"type": "grid", "column_span": 4, "cards": [
  stat("Mises à jour", "mdi:package-up", "violet", compute="updates", navigation_path="/config/updates", secondary="Touchez pour les voir"),
  stat("Internet ↓", "mdi:download-network", "ocean", entity="sensor.x55_vitesse_de_telechargement", decimals=1, secondary_entity="sensor.x55_vitesse_de_telechargement_montant", secondary_prefix="↑ "),
  stat("Home Assistant", "mdi:home-assistant", "mint", entity="update.home_assistant_core_update", attribute="installed_version", unit="", secondary="Home Assistant OS 18.3"),
  stat("Hilo", "mdi:router-network", "sun", entity="sensor.hilo_gateway", unit="", states={"on": "En ligne", "off": "Hors ligne"}, secondary_entity="sensor.notifications_hilo", secondary_prefix="Notifications : ", secondary_unit=""),
]}
conn = {"type": "grid", "column_span": 2, "cards": [H("Connectivité", "mdi:lan"), dev([
  {"entity": "binary_sensor.bibliotheque_x55_etat_du_reseau_etendu_wan", "name": "Internet", "icon": "mdi:web", "states": {"on": "Connecté", "off": "Coupé"}, "tone": {"on": "good", "off": "bad"},
   "metrics": [{"entity": "sensor.x55_vitesse_de_telechargement", "prefix": "↓ ", "decimals": 0}]},
  {"entity": "binary_sensor.zigbee2mqtt_bridge_connection_state", "name": "Pont Zigbee", "icon": "mdi:zigbee", "states": {"on": "Connecté", "off": "Déconnecté"}, "tone": {"on": "good", "off": "bad"},
   "metrics": [{"entity": "sensor.zigbee2mqtt_bridge_version", "prefix": "v"}]},
  {"entity": "sensor.800_series_long_range_usb_controller_statut", "name": "Contrôleur Z-Wave", "icon": "mdi:z-wave", "states": {"ready": "Prêt"}, "tone": {"ready": "good"}},
  {"entity": "sensor.serrure_etat_du_noeud", "name": "Serrure (Z-Wave)", "icon": "mdi:lock-smart", "states": {"alive": "Active", "dead": "Hors ligne", "asleep": "En veille"}, "tone": {"alive": "good", "dead": "bad"}},
  {"entity": "sensor.hilo_gateway", "name": "Passerelle Hilo", "icon": "mdi:router-network", "states": {"on": "En ligne", "off": "Hors ligne"}, "tone": {"on": "good", "off": "bad"}},
  {"entity": "sensor.niro_data", "name": "Kia Connect", "icon": "mdi:car-connected", "states": {"on": "Connecté", "off": "Déconnecté"}, "tone": {"on": "good", "off": "bad"},
   "metrics": [{"entity": "sensor.niro_derniere_interrogation", "prefix": "Mise à jour "}]},
  {"entity": "sensor.local_ip", "name": "Adresse Home Assistant", "icon": "mdi:ip-network", "tone": {"192.168.68.67": "info"}},
])]}
batt_cfg = {"warn_below": 40, "bad_below": 20}
batt = {"type": "grid", "column_span": 2, "cards": [H("Batteries", "mdi:battery-heart-variant"), dev([
  {"entity": "sensor.serrure_battery_level", "name": "Serrure d'entrée", "icon": "mdi:lock", "gauge": batt_cfg},
  {"entity": "sensor.salle_technique_water_leak_battery", "name": "Détecteur de fuite", "icon": "mdi:water-alert", "gauge": batt_cfg},
  {"entity": "sensor.sous_sol_humidity_battery", "name": "Capteur salle familiale", "icon": "mdi:thermometer", "gauge": batt_cfg},
  {"entity": "sensor.serrure_button_battery", "name": "Bouton d'entrée", "icon": "mdi:gesture-tap-button", "gauge": batt_cfg},
  {"entity": "sensor.saff_iphone_battery_level", "name": "iPhone Saff", "icon": "mdi:cellphone", "gauge": batt_cfg},
  {"entity": "sensor.niro_car_battery_level", "name": "Niro (12 V)", "icon": "mdi:car-battery", "gauge": batt_cfg},
  {"entity": "sensor.carnival_car_battery_level", "name": "Carnival (12 V)", "icon": "mdi:car-battery", "gauge": batt_cfg},
])]}
maint = {"type": "grid", "column_span": 2, "cards": [H("Maintenance", "mdi:wrench-cog"), H("Sauvegardes", "mdi:backup-restore", True), dev([
  {"entity": "sensor.backup_last_successful_automatic_backup", "name": "Dernière sauvegarde réussie", "icon": "mdi:cloud-check", "tone_on": "good", "tone": {}},
  {"entity": "sensor.backup_next_scheduled_automatic_backup", "name": "Prochaine sauvegarde", "icon": "mdi:calendar-clock"},
  {"entity": "sensor.backup_backup_manager_state", "name": "Gestionnaire", "icon": "mdi:cog-sync", "states": {"idle": "En attente", "create_backup": "Sauvegarde en cours…", "restore_backup": "Restauration…"}, "tone": {"idle": "good", "create_backup": "warn"}},
]), H("Versions", "mdi:tag-outline", True), dev([
  {"entity": "update.home_assistant_core_update", "name": "Home Assistant", "icon": "mdi:home-assistant", "attribute": "installed_version", "tone": {"off": "info", "on": "warn"}},
  {"entity": "update.home_assistant_operating_system_update", "name": "Système d'exploitation", "icon": "mdi:linux", "attribute": "installed_version", "tone": {"off": "info", "on": "warn"}},
  {"entity": "update.zigbee2mqtt_mise_a_jour", "name": "Zigbee2MQTT", "icon": "mdi:zigbee", "attribute": "installed_version", "tone": {"off": "info", "on": "warn"}},
  {"entity": "update.z_wave_js_ui_mise_a_jour", "name": "Z-Wave JS UI", "icon": "mdi:z-wave", "attribute": "installed_version", "tone": {"off": "info", "on": "warn"}},
])]}
ink = lambda c, n, col: {"type": "tile", "entity": f"sensor.epson_et_3850_series_{c}_ink", "name": n, "color": col, "features": [{"type": "bar-gauge", "min": 0, "max": 100}], "grid_options": {"columns": 6}}
prn = {"type": "grid", "column_span": 2, "cards": [H("Imprimante Epson", "mdi:printer"), dev([
  {"entity": "sensor.epson_et_3850_series", "name": "EPSON ET-3850", "icon": "mdi:printer", "states": {"idle": "Prête", "printing": "Impression…", "stopped": "Arrêtée"}, "tone": {"idle": "good", "printing": "info", "stopped": "warn"}}]),
  ink("black", "Noir", "grey"), ink("cyan", "Cyan", "cyan"), ink("magenta", "Magenta", "pink"), ink("yellow", "Jaune", "yellow")]}
secs = [kpi, conn, batt, maint, prn]
json.dump(secs, open("sys.json", "w"), ensure_ascii=False)
t = "config['views'][5]['sections'] = " + json.dumps(secs, ensure_ascii=False).replace("true", "True").replace("false", "False")
open("sys_t.txt", "w").write(t)
print(len(t))
