import json
GLASS = "ha-card { background: radial-gradient(120% 120% at 100% 0%, rgba(109,124,255,.18), transparent 60%), linear-gradient(160deg,#171c3a,#0e1128) !important; border-radius: 24px !important; border: 1px solid rgba(255,255,255,.08) !important; box-shadow: 0 20px 40px -24px rgba(0,0,0,.7) !important; color: #eef1ff; }"
def apex(title, series, height, extra=None):
    d={"type":"custom:apexcharts-card","graph_span":"24h",
       "header":{"show":True,"title":title,"show_states":False},
       "apex_config":{"chart":{"background":"transparent","foreColor":"#c7cdf5","height":height},
         "theme":{"mode":"dark"},"grid":{"borderColor":"rgba(255,255,255,.07)"},"legend":{"show":True,"position":"bottom"},
         "tooltip":{"theme":"dark"},"stroke":{"curve":"smooth"}},
       "series":series,"card_mod":{"style":GLASS},"grid_options":{"columns":"full"}}
    if extra: d.update(extra)
    return d
def thermo(e,n): return {"type":"tile","entity":e,"name":n,"vertical":False,"grid_options":{"columns":6},
    "features":[{"type":"target-temperature"}],"state_content":["current_temperature","hvac_action"]}
rdc=[("climate.thermostat_salon","Salon"),("climate.thermostat_salle_a_manger","Salle à manger"),("climate.thermostat_chambre_des_maitres","Chambre principale"),
     ("climate.thermostat_saff","Bureau Safouene"),("climate.thermostat_meriem","Bureau Meriem"),("climate.thermostat_sdb_haut","Salle de bain haut")]
ss=[("climate.thermostat_salle_familiale","Salle familiale"),("climate.thermostat_gars","Chambre Garçons"),("climate.thermostat_filles","Chambre Filles"),("climate.thermostat_sdb_bas","Salle de bain bas")]
pal=["#6d7cff","#a66bff","#ec4899","#f59e0b","#22c55e","#06b6d4","#3b82f6","#f97316","#14b8a6","#eab308"]
temp=[{"entity":e.replace("climate.","sensor.")+"_temperature","name":n,"color":c,"stroke_width":2,"show":{"in_header":False}} for (e,n),c in zip(rdc+ss,pal)]
thermos={"type":"grid","column_span":2,"cards":[
  {"type":"heading","heading":"Thermostats","heading_style":"title","icon":"mdi:thermostat"},
  {"type":"heading","heading":"Rez-de-chaussée","heading_style":"subtitle","icon":"mdi:home-floor-0"}]+[thermo(*x) for x in rdc]+[
  {"type":"heading","heading":"Sous-sol","heading_style":"subtitle","icon":"mdi:home-floor-negative-1"}]+[thermo(*x) for x in ss]}
graphs={"type":"grid","column_span":2,"cards":[
  {"type":"heading","heading":"Tendances · 24 h","heading_style":"title","icon":"mdi:chart-line"},
  apex("Températures des pièces",temp,430),
  apex("Humidité",[
    {"entity":"sensor.sous_sol_humidity_humidity","name":"Salle familiale","color":"#06b6d4","type":"area","opacity":0.25,"stroke_width":2,"group_by":{"func":"avg","duration":"10min"}},
    {"entity":"sensor.laval_humidite","name":"Extérieur","color":"#94a3b8","stroke_width":2,"curve":"stepline"}],210,
    {"yaxis":[{"min":0,"max":100,"decimals":0}]})]}
conso={"type":"grid","column_span":2,"cards":[
  {"type":"heading","heading":"Consommation","heading_style":"title","icon":"mdi:lightning-bolt","tap_action":{"action":"navigate","navigation_path":"/tableau-mural/energie"}},
  {"type":"custom:maison-energy-card"}]}
chauff={"type":"grid","column_span":2,"cards":[
  {"type":"heading","heading":"Chauffage et météo","heading_style":"title","icon":"mdi:radiator"},
  apex("Puissance de chauffage vs température extérieure",[
    {"entity":"sensor.puissance_chauffage_hilo","name":"Chauffage Hilo","type":"area","color":"#fb923c","opacity":0.3,"stroke_width":2,"yaxis_id":"w","group_by":{"func":"avg","duration":"10min"}},
    {"entity":"sensor.laval_temperature","name":"Extérieur","color":"#38bdf8","stroke_width":2,"yaxis_id":"t","curve":"stepline"}],380,
    {"yaxis":[{"id":"w","min":0,"decimals":0,"apex_config":{"title":{"text":"W"}}},{"id":"t","opposite":True,"decimals":0,"apex_config":{"title":{"text":"°C"}}}]})]}
transform = (
 "s = config['views'][2]['sections']; "
 f"config['views'][2]['sections'] = [s[0], {json.dumps(thermos, ensure_ascii=False)}, {json.dumps(graphs, ensure_ascii=False)}, {json.dumps(conso, ensure_ascii=False)}, {json.dumps(chauff, ensure_ascii=False)}]"
)
transform=transform.replace("true","True").replace("false","False")
open('climat_transform.txt','w').write(transform)
print(len(transform))
