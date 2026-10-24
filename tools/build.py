#!/usr/bin/env python3
"""Assemble les cartes de www/maison-cards/ en un seul module pour HACS : dist/maison-home-assistant.js

- chaque fichier est isolé dans son propre bloc (pas de collision de noms entre fichiers) ;
- chaque customElements.define(...) est protégé (pas d'erreur si la carte est déjà chargée) ;
- la version vient du fichier VERSION.
Usage : python3 tools/build.py [--check]   (--check : échoue si dist/ n'est pas à jour)
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "www" / "maison-cards"
OUT = ROOT / "dist" / "maison-home-assistant.js"
ORDER = ["maison-cards.js", "maison-devices.js", "maison-prayer.js", "maison-foot.js"]
DEFINE = re.compile(r'(?<![\w.])customElements\.define\(\s*"([\w-]+)"\s*,\s*(\w+)\s*\)')

def build() -> str:
    version = (ROOT / "VERSION").read_text().strip()
    parts = [f"/* maison-home-assistant v{version} — fichier généré par tools/build.py, ne pas éditer.\n"
             f"   Sources : www/maison-cards/ — https://github.com/Saff-Buraq-Dev/maison-home-assistant */\n"]
    for name in ORDER:
        code = (SRC / name).read_text(encoding="utf-8")
        code = DEFINE.sub(lambda m: f'(customElements.get("{m.group(1)}") || customElements.define("{m.group(1)}", {m.group(2)}))', code)
        parts.append(f"\n/* ===== {name} ===== */\n{{\n{code.rstrip()}\n}}\n")
    parts.append(f'\nconsole.info("%c MAISON-HOME-ASSISTANT %c v{version} ", "background:#6d7cff;color:#fff;border-radius:4px 0 0 4px;padding:2px 6px", "background:#1b1f45;color:#fff;border-radius:0 4px 4px 0;padding:2px 6px");\n')
    return "".join(parts)

if __name__ == "__main__":
    out = build()
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != out:
            sys.exit("dist/maison-home-assistant.js n'est pas à jour : lancer python3 tools/build.py et committer.")
        print("dist à jour")
    else:
        OUT.parent.mkdir(exist_ok=True)
        OUT.write_text(out, encoding="utf-8")
        print(f"écrit {OUT.relative_to(ROOT)} ({len(out.encode())} octets)")
