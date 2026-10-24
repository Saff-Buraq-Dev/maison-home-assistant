# CLAUDE.md — contexte du projet « maison-home-assistant »

Code et configuration du Home Assistant de Safouene (maison à Laval, QC). Répondre **en français**.
Le dépôt reflète ce qui tourne dans HA ; toute modification faite dans HA doit être réexportée ici (et inversement).

## Instance
- HA 2026.10, HAOS 18.3, URL locale `http://192.168.68.67:8123`. Fuseau America/Toronto.
- Accès via le serveur MCP `ha-mcp-server` (outils `ha_*`). Les écritures exigent un `BestPracticeKey`
  (lire `ha_get_skill_guide`, la clé change chaque heure) ; passer `MandatoryBPS=false` ensuite.
- Le tableau `tableau-mural` est en mode stockage. Éditer par `python_transform`/`patch` ciblés avec `config_hash` frais
  (l'utilisateur modifie parfois le tableau en parallèle : relire le hash en cas de conflit, repérer les sections par leur titre,
  respecter l'ordre qu'il a choisi). Ne jamais remplacer toute la config.

## Cartes custom (`www/maison-cards/`) — déployées par HACS
Sources dans `www/maison-cards/`, paquet généré `dist/maison-home-assistant.js` (`python3 tools/build.py`, ne jamais l'éditer),
version dans `VERSION`. Publication : commit → tag `vX.Y.Z` → l'action *Release* crée la release → HACS propose la mise à jour.
Détails : `docs/deploiement.md`. Toujours `node --check` et tester avec `tools/dev/` (Playwright + hass simulé) avant de tagger.
- `maison-cards.js` : hero (heure, météo + prévisions 5 j via `weather/subscribe_forecast`, pastilles), stat, energy, lights, 3d
- `maison-devices.js` : liste d'équipements · `maison-prayer.js` : prières · `maison-foot.js` : foot (accueil + fiches)
- Club Africain : ESPN n'a pas de logo → écusson officiel `https://clubafricain.com/ca-crest.png` (repli api-sports 988).

## Style (à respecter partout)
- Fond verre : `radial-gradient(120% 120% at 100% 0%, <accent>, transparent 60%), linear-gradient(160deg,#171c3a,#0e1128)`,
  bordure `1px solid rgba(255,255,255,.08)`, rayon **24px**, ombre `0 20px 40px -24px rgba(0,0,0,.7)`, texte `#eef1ff`.
- Police **Inter** ; libellés 11.5px/700/majuscules/letter-spacing .1em/opacité .6 ; chiffres `tabular-nums`.
- Cartes natives stylées via `card_mod` (mêmes valeurs + variables de police). Les tuiles d'encre de l'imprimante gardent leurs couleurs.
- Thème des vues : « Frosted Glass Dark ». Les vues sont de type `sections`.

## Préférences de l'utilisateur
- Pastilles de lumières : toucher = **dialogue natif** (more-info), bouton ⏻ = basculer.
- Énergie en **kWh depuis minuit** (pas de W abstraits) ; distinguer total maison (`sensor.meter00_power`) vs Hilo.
- Fuite d'eau `unknown` = « Sec ». Consignes Hilo à 5 °C : voulues. Serrure « coincée » : ignorer. Déshumidificateur Midea : ignorer.
- Prières : ISNA, Asr standard. Lumière SdB haut : ne jamais toucher une lumière déjà allumée ; nuit 22 h–6 h à 10 % ; avertissement à 5 %.
- Ne rien défaire sans demander ; proposer des variantes côte à côte quand il hésite.

## Sources de données
- Foot : ESPN (MU 360, Tunisie 659, Club Africain 18816 pour la CAF) depuis le navigateur ;
  Club Africain = intégration **Scrape** sur `clubafricain.com/news/calendar` (6 capteurs `sensor.club_africain_a_venir_{1..3}` /
  `resultat_{1..3}`, format « date|adversaire|compét|dom|butsCA|butsAdv|statut|minute|logo »), classement via
  `clubafricain.com/api/platform/v1/agenda/standings?...league_id=202`. API-Football gratuit écarté.
- Énergie : Hilo (thermostats, chauffe-eau, compteur), Hydro-Québec (facturation, ~1 jour de retard),
  helpers `sensor.puissance_chauffage_hilo`, `sensor.puissance_appareils_hilo`, `sensor.puissance_autres_appareils`.

## À faire / idées en attente
- Maison 3D : refaire à partir du fichier Sweet Home 3D (RDC : salon, entrée, bureaux Saff/Meriem en L, corridor, cuisine,
  salle à manger, SdB, chambre des maîtres ; ≈ 11,1 × 7,5 m) — fichier .sh3d pas encore fourni.
- Présence de la famille (≈5 iPhones) puis automatisation « maison vide » (baisser le chauffage) ; zone home à 100 m.
- Adhan sur enceinte (Alexa compliqué ; enceinte Google/Sonos recommandée) + intégration Islamic Prayer Times.
- Notifications de but ; System Monitor ; Kiosk Mode pour la tablette ; mise en place de git + déploiement `/config/www`.
