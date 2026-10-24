# Bancs d'essai

Rendu des cartes hors Home Assistant avec Chromium (Playwright) et un objet `hass` simulé.

```bash
pip install playwright && playwright install chromium
python shot3.py "$PWD/hero.html"          # en-tête d'accueil → hero.png
python pshot.py                           # prières à 15 h, 21 h 30 et 2 h 10 → p1..p3.png
cd foot && python fx.py && python run.py  # cartes foot avec données simulées (dont un match en direct) → foot.png
```
Les requêtes ESPN / clubafricain.com sont interceptées et remplacées par les données de `foot/fx.py`.
