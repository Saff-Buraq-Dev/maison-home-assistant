# Home Assistant — Maison Gharbi

Code et configuration personnalisés du Home Assistant de la maison (Laval) :
tableau de bord mural pour tablette, cartes custom, automatisations, helpers et intégrations.

> Home Assistant 2026.10 · HAOS 18.3 · thème « Frosted Glass Dark » · police Inter

## Arborescence

| Dossier | Contenu |
|---|---|
| `dashboards/tableau-mural/` | Tableau de bord « Tableau mural » : `dashboard.json` (source de vérité, format de stockage HA) et `views/` (une vue par fichier YAML, lisible, générée) |
| `www/maison-cards/` | Cartes Lovelace custom (JavaScript, sans dépendance) |
| `resources/` | Ressources de tableau de bord (modules custom, police, cartes HACS requises) |
| `automations/` | Automatisations, une par fichier |
| `helpers/` | Entrées créées via l'interface (template, min_max…) avec leurs champs |
| `integrations/` | Intégrations configurées par l'interface (ex. Scrape du calendrier du Club Africain) |
| `templates/` | Modèles Jinja réutilisés |
| `tools/dev/` | Bancs d'essai des cartes (Playwright + données simulées) |
| `tools/generators/` | Scripts Python ayant servi à générer les vues du tableau |
| `docs/` | Architecture, sources de données, déploiement |

## Cartes custom

| Fichier | Cartes | Rôle |
|---|---|---|
| `maison-cards.js` | `maison-hero-card`, `maison-stat-card`, `maison-energy-card`, `maison-lights-card`, `maison-3d-card` | En-tête (heure, météo, prévisions, pastilles), tuiles KPI, énergie du jour, lumières, maison 3D |
| `maison-devices.js` | `maison-devices-card` | Liste compacte d'équipements (états, mesures, interrupteurs, jauges de pile) |
| `maison-prayer.js` | `maison-prayer-card` | Horaires des prières (ISNA, calcul local) et compte à rebours |
| `maison-foot.js` | `maison-foot-card`, `maison-foot-team-card` | Football : Tunisie, Club Africain, Manchester United (résultats, prochains matchs, direct) |

## Onglets du tableau mural

Accueil · Maison 3D · Climat · Énergie · Voitures · Foot · Système — détail dans [`docs/architecture.md`](docs/architecture.md).

## Installation des cartes (HACS)
HACS → ⋮ → Dépôts personnalisés → `https://github.com/Saff-Buraq-Dev/maison-home-assistant`, type **Tableau de bord** →
installer « Maison – cartes du tableau mural ». Prérequis : `card-mod` et `apexcharts-card` (HACS).

## Déployer une modification

Voir [`docs/deploiement.md`](docs/deploiement.md).
