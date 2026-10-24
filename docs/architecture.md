# Architecture

## Principes de design
- Fond « verre » commun : `radial-gradient(… accent …) + linear-gradient(160deg, #171c3a, #0e1128)`,
  bordure `1px rgba(255,255,255,.08)`, coins 24 px, ombre `0 20px 40px -24px rgba(0,0,0,.7)`, texte `#eef1ff`.
- Police **Inter** partout (ressource CSS Google Fonts + variables de police appliquées par `card_mod` sur les cartes natives).
- Petits libellés : 11,5 px, gras 700, majuscules, espacement 0,1 em, opacité 0,6.
- Les cartes natives (tuiles, graphiques, calendrier…) reçoivent le même style via `card_mod` (HACS).

## Vues
| Vue | Contenu principal |
|---|---|
| Accueil | En-tête (heure, météo + 5 jours, pastilles porte/fuite/présents/défi Hilo/intérieur/chauffe/mises à jour), Énergie du jour, Prières + agenda + liste d'achats, Lumières, Football |
| Maison 3D | Vue isométrique interactive (disposition provisoire — à refaire à partir du plan Sweet Home 3D) |
| Climat | KPI, 10 thermostats Hilo (rez-de-chaussée / sous-sol), températures des pièces 24 h |
| Énergie | KPI Hydro-Québec, prises et équipements, consommation du jour, puissance 24 h, conso 30 jours, chauffage vs extérieur, humidité |
| Voitures | Niro et Carnival (symétrique) : photo, essence, autonomie, odomètre, 12 V, portes, équipements, spécifique |
| Foot | Fiches Tunisie, Club Africain, Manchester United |
| Système | Mises à jour, Internet, versions, connectivité, batteries, sauvegardes, imprimante |

## Données énergie
- `sensor.meter00_power` : puissance totale de la maison (compteur HQ lu par la passerelle Hilo).
- `sensor.puissance_chauffage_hilo` / `sensor.puissance_appareils_hilo` (min_max) et
  `sensor.puissance_autres_appareils` (template) : ventilation chauffage / chauffe-eau / autres.
- Intégration Hydro-Québec : données de facturation du portail (décalées d'environ 1 jour).
- La carte énergie lit les statistiques 5 min du recorder (`recorder/statistics_during_period`).

## Football — sources
| Équipe | Source | Direct |
|---|---|---|
| Manchester United (ESPN 360) | API publique ESPN (`site.api.espn.com`), appelée depuis le navigateur | toutes les 30 s (`summary` : score, minute, buteurs) |
| Tunisie (ESPN 659) | ESPN | idem |
| Club Africain | Site officiel `clubafricain.com/news/calendar` lu par l'intégration **Scrape** (6 capteurs) + API de classement du club ; matchs CAF enrichis par ESPN (18816) | capteurs relus chaque minute pendant un match (automatisation + `binary_sensor.club_africain_en_direct`) |

Le site du club s'appuie sur API-Football (ligue 202 = Ligue 1 tunisienne). Le plan gratuit
d'API-Football n'a pas été retenu (saison en cours probablement inaccessible, 100 requêtes/jour).

## Prières
Calcul astronomique local (algorithme PrayTimes), méthode ISNA, Asr standard, position de `zone.home`.
Gère Isha → Fajr du lendemain, le passage de minuit et l'heure d'été. Ajustements possibles par prière (`adjust`).

## Entités clés créées
- Club Africain : `sensor.club_africain_a_venir_{1,2,3}`, `sensor.club_africain_resultat_{1,2,3}`, `binary_sensor.club_africain_en_direct`
- Salle de bain haut : `light.sdb_haut_dimmer`, `binary_sensor.sdb_haut_motion_sensor_occupancy`
- Entrée : `binary_sensor.entree_door_sensor_contact`
- Salle familiale : `light.sous_sol_dimmer`
