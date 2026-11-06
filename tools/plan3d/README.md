# Du plan Sweet Home 3D à la carte 3D

Chaîne utilisée pour `plans/*.sh3d` et `dist/maison-{rdc,sousol}.glb`. Elle a besoin des jars de Sweet Home 3D
(`/Applications/Sweet Home 3D.app/Contents/app/*.jar`, non versionnés) et du catalogue `eTeksScopia.sh3t`.

1. `Build.java` : relit les plans d'origine (`plans/*-original.sh3d`) et reconstruit murs, pièces, ouvertures et meubles
   avec l'API de Sweet Home 3D, puis écrit `plans/rdc.sh3d` et `plans/sousol.sh3d`.
2. `V.java` : contrôle les angles, les surfaces et les chevauchements. `R.java` : rendu photo (`-Dj3d.rend=noop`).
3. `E.java` : exporte chaque étage en OBJ, murs pleine hauteur (`E plan.sh3d dossier 250`), et `rooms.json` (polygones repris dans `MC_DEFAULT_FLOORS`).
4. `pack.mjs` : convertit en GLB compressés (`obj2gltf`, `gltf-transform`, `meshoptimizer`).
5. `vendor.js` : `esbuild vendor.js --bundle --minify --format=iife` produit `dist/maison-3d-vendor.js` (three.js).

Si un plan est retouché dans Sweet Home 3D : l'enregistrer dans `plans/`, puis relancer les étapes 3 et 4.
