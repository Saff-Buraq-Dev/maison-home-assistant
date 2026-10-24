# Déploiement

## Mécanique (HACS + releases GitHub)
```
www/maison-cards/*.js ──tools/build.py──▶ dist/maison-home-assistant.js ──tag vX.Y.Z──▶ release GitHub ──▶ HACS ──▶ Home Assistant
```
1. Modifier les cartes dans `www/maison-cards/` (jamais `dist/` à la main).
2. Tester : `tools/dev/` (voir son README).
3. Incrémenter `VERSION` (ex. 1.1.0 → 1.2.0) puis `python3 tools/build.py`.
4. `git commit` puis `git tag v$(cat VERSION) && git push && git push --tags`.
5. L'action GitHub *Release* vérifie la syntaxe, que `dist/` est à jour et que le tag = `VERSION`, puis publie la release.
6. Dans HA : HACS → « Maison – cartes du tableau mural » → Mettre à jour (ou l'entité `update.*` correspondante),
   puis rafraîchissement forcé de la tablette. HACS change le paramètre `?hacstag=` de la ressource, ce qui vide le cache.

HACS installe `dist/maison-home-assistant.js` dans `/config/www/community/maison-home-assistant/` et enregistre
la ressource `/hacsfiles/maison-home-assistant/maison-home-assistant.js`. Le dépôt doit être **public**
(HACS ne lit pas les dépôts privés).

## Le paquet
`tools/build.py` assemble les 4 fichiers en un module : chaque fichier dans son propre bloc,
chaque `customElements.define` protégé (charger deux fois le paquet ne provoque pas d'erreur).

## Tableau de bord
Mode *stockage* : `dashboards/tableau-mural/dashboard.json` en est une copie. Les modifications se font dans HA
(modifications ciblées), puis on réexporte `dashboard.json` et on régénère `views/`.

## Historique
Jusqu'à la v1.0, les cartes étaient des ressources « en ligne » (URI data:) publiées directement dans HA ;
elles sont remplacées par la ressource HACS à partir de la v1.1.0.
