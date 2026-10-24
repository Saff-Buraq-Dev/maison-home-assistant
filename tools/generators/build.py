import json
GLASS = "ha-card { background: radial-gradient(120% 120% at 100% 0%, rgba(109,124,255,.18), transparent 60%), linear-gradient(160deg,#171c3a,#0e1128) !important; border-radius: 24px !important; border: 1px solid rgba(255,255,255,.08) !important; box-shadow: 0 20px 40px -24px rgba(0,0,0,.7) !important; color: #eef1ff; }"
THEME = "Frosted Glass Dark"
def H(t, icon, sub=False, **kw):
    d = {"type":"heading","heading":t,"icon":icon,"heading_style":"subtitle" if sub else "title"}; d.update(kw); return d
def stat(entity=None, name="", icon="", color="violet", cols=12, **kw):
    d={"type":"custom:maison-stat-card","name":name,"icon":icon,"color":color,"grid_options":{"columns":cols,"rows":2}}
    if entity: d["entity"]=entity
    d.update(kw); return d
def apex(title, series, span="24h", extra=None, rows=None):
    d={"type":"custom:apexcharts-card","graph_span":span,
       "header":{"show":True,"title":title,"show_states":True,"colorize_states":True},
       "apex_config":{"chart":{"background":"transparent","foreColor":"#c7cdf5","height":260},
                      "theme":{"mode":"dark"},"grid":{"borderColor":"rgba(255,255,255,.07)"},
                      "legend":{"show":True},"tooltip":{"theme":"dark"},
                      "stroke":{"curve":"smooth"}},
       "series":series,"card_mod":{"style":GLASS},"grid_options":{"columns":"full"}}
    if extra: d.update(extra)
    return d
def tile(e, name=None, cols=6, feats=None, **kw):
    d={"type":"tile","entity":e,"grid_options":{"columns":cols}}
    if name: d["name"]=name
    if feats: d["features"]=feats
    d.update(kw); return d
def sec(cards, span=1, **kw):
    d={"type":"grid","column_span":span,"cards":cards}; d.update(kw); return d

thermo_rdc=[("climate.thermostat_salon","Salon"),("climate.thermostat_salle_a_manger","Salle à manger"),
 ("climate.thermostat_chambre_des_maitres","Chambre principale"),("climate.thermostat_saff","Bureau Safouene"),
 ("climate.thermostat_meriem","Bureau Meriem"),("climate.thermostat_sdb_haut","Salle de bain haut")]
thermo_ss=[("climate.thermostat_salle_familiale","Salle familiale"),("climate.thermostat_gars","Chambre Garçons"),
 ("climate.thermostat_filles","Chambre Filles"),("climate.thermostat_sdb_bas","Salle de bain bas")]
temp_series=[{"entity":e.replace("climate.","sensor.")+"_temperature","name":n} for e,n in thermo_rdc+thermo_ss]
palette=["#6d7cff","#a66bff","#ec4899","#f59e0b","#22c55e","#06b6d4","#3b82f6","#f97316","#14b8a6","#eab308"]
for s,c in zip(temp_series,palette): s.update({"color":c,"stroke_width":2,"show":{"in_header":False}})

accueil={"title":"Accueil","path":"accueil","icon":"mdi:home-heart","type":"sections","max_columns":4,"theme":THEME,
 "sections":[
  sec([{"type":"custom:maison-hero-card","name":"Safouene"}],4),
  sec([
    stat("sensor.meter00_power","Puissance maison","mdi:flash","sun"),
    stat("sensor.water_heater_power","Chauffe-eau","mdi:water-boiler","fire",secondary_entity="sensor.water_heater_temperature",secondary_prefix="Eau à "),
    stat("sensor.hydro_quebec_maison_facture_projetee","Facture projetée","mdi:cash-multiple","mint",decimals=2,secondary_entity="sensor.hydro_quebec_maison_total_facture_a_ce_jour",secondary_prefix="À ce jour : "),
    stat(None,"Thermostats en chauffe","mdi:fire","rose",compute="heating",navigation_path="/tableau-mural/climat"),
  ],4),
  sec([
    H("Météo · Laval","mdi:weather-partly-cloudy"),
    {"type":"weather-forecast","entity":"weather.laval_previsions","forecast_type":"daily","show_current":True,"show_forecast":True,"card_mod":{"style":GLASS}},
    apex("Prochaines 24 heures",[
      {"entity":"sensor.laval_previsions_horaires","name":"Température","type":"area","color":"#f59e0b","opacity":0.25,"stroke_width":3,"yaxis_id":"t",
       "data_generator":"return entity.attributes.forecast.map((i) => [new Date(i.timestamp).getTime(), i.temperature]);"},
      {"entity":"sensor.laval_previsions_horaires","name":"Pluie %","type":"column","color":"#3b82f6","opacity":0.5,"yaxis_id":"p",
       "data_generator":"return entity.attributes.forecast.map((i) => [new Date(i.timestamp).getTime(), i.precip_probability]);"}],
      "24h",{"span":{"start":"hour"},"header":{"show":True,"title":"Prochaines 24 heures","show_states":False},
             "yaxis":[{"id":"t","decimals":0},{"id":"p","opposite":True,"min":0,"max":100,"decimals":0}]}),
  ],2),
  sec([
    H("Aujourd'hui","mdi:calendar-star"),
    {"type":"calendar","entities":["calendar.gharbiz"],"initial_view":"listWeek","card_mod":{"style":GLASS}},
    H("Liste d'achats","mdi:cart-outline",True),
    {"type":"todo-list","entity":"todo.liste_dachats","card_mod":{"style":GLASS}},
  ],2),
 ]}

maison={"title":"Maison 3D","path":"maison","icon":"mdi:cube-scan","type":"panel","theme":THEME,
 "cards":[{"type":"custom:maison-3d-card","title":"Ma maison"}]}

def thermo_tiles(lst):
    return [tile(e,n,6,[{"type":"target-temperature"}],state_content=["current_temperature","hvac_action"],vertical=False) for e,n in lst]
climat={"title":"Climat","path":"climat","icon":"mdi:thermometer","type":"sections","max_columns":4,"theme":THEME,
 "sections":[
  sec([
   stat(None,"En chauffe","mdi:fire","fire",cols=12,compute="heating"),
   stat("sensor.laval_temperature","Extérieur","mdi:thermometer","ocean",cols=12,secondary_entity="sensor.laval_humidite",secondary_prefix="Humidité "),
   stat("sensor.sous_sol_humidity_humidity","Humidité sous-sol","mdi:water-percent","violet",cols=12,decimals=0,secondary_entity="sensor.sous_sol_humidity_temperature",secondary_prefix="Salle familiale "),
   stat("sensor.hilo_gateway","Passerelle Hilo","mdi:router-network","mint",cols=12,states={"on":"En ligne","off":"Hors ligne"},unit="",secondary_entity="sensor.defi_hilo",secondary_prefix="Défi : ",secondary_unit=""),
  ],4),
  sec([H("Rez-de-chaussée","mdi:home-floor-0")]+thermo_tiles(thermo_rdc),2),
  sec([H("Sous-sol","mdi:home-floor-negative-1")]+thermo_tiles(thermo_ss)+[
       tile("sensor.sous_sol_humidity_humidity","Humidité salle familiale",12,[{"type":"trend-graph","hours_to_show":24}])],2),
  sec([apex("Températures des pièces · 24 h",temp_series,"24h",{"header":{"show":True,"title":"Températures des pièces · 24 h","show_states":False}})],4),
 ]}

energie={"title":"Énergie","path":"energie","icon":"mdi:lightning-bolt","type":"sections","max_columns":4,"theme":THEME,
 "sections":[
  sec([
   stat("sensor.meter00_power","Puissance actuelle","mdi:flash","sun"),
   stat("sensor.hydro_quebec_maison_conso_totale","Conso période","mdi:counter","ocean",max="sensor.hydro_quebec_maison_conso_totale_projetee",max_label="du projeté"),
   stat("sensor.hydro_quebec_maison_facture_projetee","Facture projetée","mdi:cash-multiple","mint",decimals=2),
   stat("sensor.hydro_quebec_maison_jour_periode_facturation","Cycle de facturation","mdi:calendar-clock","violet",unit="",secondary="jours écoulés",max="sensor.hydro_quebec_maison_duree_periode_facturation",max_label="du cycle"),
   stat("sensor.hydro_quebec_maison_moyenne_quotidienne_conso","Moyenne / jour","mdi:chart-bell-curve","rose",secondary_entity="sensor.hydro_quebec_maison_moyenne_quotidienne_facture",secondary_prefix="≈ "),
   stat("sensor.hydro_quebec_maison_solde","Solde du compte","mdi:wallet","slate",decimals=2),
   stat("sensor.hydro_quebec_maison_cout_moyen_kwh","Coût moyen","mdi:currency-usd","mint",unit="$/kWh",decimals=3),
   stat("sensor.water_heater_power","Chauffe-eau","mdi:water-boiler","fire",secondary_entity="sensor.water_heater_temperature",secondary_prefix="Eau à "),
  ],4),
  sec([apex("Puissance · 24 h",[
      {"entity":"sensor.meter00_power","name":"Maison","type":"area","color":"#f59e0b","opacity":0.3,"stroke_width":2,"group_by":{"func":"avg","duration":"5min"}},
      {"entity":"sensor.water_heater_power","name":"Chauffe-eau","type":"area","color":"#ef4444","opacity":0.25,"stroke_width":2,"group_by":{"func":"avg","duration":"5min"}}],
      "24h",{"header":{"show":True,"title":"Puissance · 24 h","show_states":True,"colorize_states":True}})],2),
  sec([apex("Puissance moyenne · 7 jours",[
      {"entity":"sensor.meter00_power","name":"Moyenne horaire","type":"column","color":"#6d7cff","statistics":{"type":"mean","period":"hour"}}],
      "7d",{"header":{"show":True,"title":"Puissance moyenne · 7 jours","show_states":False}})],2),
  sec([H("Prises et équipements","mdi:power-plug"),
       tile("switch.bureau_saff_plug","Prise bureau",6,[{"type":"toggle"}]),
       tile("sensor.bureau_saff_plug_power","Prise bureau · puissance",6),
       tile("switch.water_heater","Chauffe-eau",6),
       tile("sensor.hydro_quebec_maison_etat_panne","État panne Hydro-Québec",6)],4),
 ]}

def car(name, pfx, img, ev=False):
    cards=[H(name,"mdi:car-side",tap_action={"action":"navigate","navigation_path":"/dashboard-cars"}),
      {"type":"picture-entity","entity":f"lock.{pfx}_door_lock","name":name,"image":img,"show_state":True,"grid_options":{"columns":"full","rows":4},
       "tap_action":{"action":"more-info"},"card_mod":{"style":"ha-card { border-radius: 24px !important; overflow: hidden; }"}},
      stat(f"sensor.{pfx}_fuel_level","Essence","mdi:gas-station","sun",cols=12,max=100,max_label="du réservoir"),
      stat(f"sensor.{pfx}_total_driving_range","Autonomie","mdi:map-marker-distance","ocean",cols=12)]
    if ev:
        cards.append(stat(f"sensor.{pfx}_ev_battery_level","Batterie EV","mdi:battery-charging","mint",cols=12,max=100,max_label="chargée",secondary_entity=f"sensor.{pfx}_ev_range",secondary_prefix="Autonomie électrique "))
    cards.append(stat(f"sensor.{pfx}_odometer","Odomètre","mdi:counter","slate",cols=12,decimals=0,secondary_entity=f"sensor.{pfx}_next_service",secondary_prefix="Prochain entretien : "))
    cards+= [tile(f"lock.{pfx}_door_lock","Portes",12,[{"type":"lock-commands"}]),
             tile(f"switch.{pfx}_climate","Démarrage climatisation",12 if not ev else 6)]
    if ev: cards.append(tile(f"switch.{pfx}_ev_charging","Recharge",6))
    cards.append(tile(f"sensor.{pfx}_geocoded_location","Position",12,tap_action={"action":"more-info"}))
    return sec(cards,2)
voitures={"title":"Voitures","path":"voitures","icon":"mdi:car-multiple","type":"sections","max_columns":4,"theme":THEME,
 "sections":[car("Niro","niro","/api/image/serve/52b119fd105f29a179d5065442a55180/original",True),
             car("Carnival","carnival","/api/image/serve/24ebc4ea7044b2804ae0fccfda9e3f9d/original")]}

ink=lambda c,n,col: tile(f"sensor.epson_et_3850_series_{c}_ink",n,6,[{"type":"bar-gauge","min":0,"max":100}],color=col)
systeme={"title":"Système","path":"systeme","icon":"mdi:cog-outline","type":"sections","max_columns":4,"theme":THEME,
 "sections":[
  sec([
   stat(None,"Mises à jour","mdi:package-up","violet",compute="updates",navigation_path="/config/updates"),
   stat("sensor.x55_vitesse_de_telechargement","Internet ↓","mdi:download-network","ocean",decimals=1,secondary_entity="sensor.x55_vitesse_de_telechargement_montant",secondary_prefix="↑ "),
   stat("sensor.zigbee2mqtt_bridge_version","Zigbee2MQTT","mdi:zigbee","mint",unit="",secondary="Version du pont"),
   stat("sensor.800_series_long_range_usb_controller_statut","Z-Wave","mdi:z-wave","rose",unit="",states={"ready":"Prêt"}),
  ],4),
  sec([H("Sauvegardes","mdi:backup-restore"),
       tile("sensor.backup_last_successful_automatic_backup","Dernière réussie",12),
       tile("sensor.backup_next_scheduled_automatic_backup","Prochaine",12),
       tile("sensor.backup_backup_manager_state","Gestionnaire",12)],1),
  sec([H("Batteries","mdi:battery-heart-variant"),
       tile("sensor.serrure_battery_level","Serrure",12,[{"type":"bar-gauge","min":0,"max":100}]),
       tile("sensor.salle_technique_water_leak_battery","Détecteur de fuite",12,[{"type":"bar-gauge","min":0,"max":100}]),
       tile("sensor.sous_sol_humidity_battery","Capteur sous-sol",12,[{"type":"bar-gauge","min":0,"max":100}]),
       tile("sensor.serrure_button_battery","Bouton d'entrée",12,[{"type":"bar-gauge","min":0,"max":100}]),
       tile("sensor.saff_iphone_battery_level","iPhone Saff",12,[{"type":"bar-gauge","min":0,"max":100}])],1),
  sec([H("Imprimante Epson","mdi:printer"),
       tile("sensor.epson_et_3850_series","État",12),
       ink("black","Noir","grey"),ink("cyan","Cyan","cyan"),ink("magenta","Magenta","pink"),ink("yellow","Jaune","yellow")],1),
  sec([H("Réseau","mdi:lan"),
       tile("binary_sensor.bibliotheque_x55_etat_du_reseau_etendu_wan","Connexion Internet",12),
       tile("binary_sensor.zigbee2mqtt_bridge_connection_state","Pont Zigbee",12),
       tile("sensor.serrure_etat_du_noeud","Serrure (Z-Wave)",12),
       tile("sensor.local_ip","IP Home Assistant",12)],1),
 ]}

cfg={"views":[accueil,maison,climat,energie,voitures,systeme]}
json.dump(cfg,open("config.json","w"),ensure_ascii=False)
print(len(json.dumps(cfg)))
