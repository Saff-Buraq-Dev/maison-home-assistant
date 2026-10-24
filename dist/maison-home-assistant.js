/* maison-home-assistant v1.1.0 — fichier généré par tools/build.py, ne pas éditer.
   Sources : www/maison-cards/ — https://github.com/Saff-Buraq-Dev/maison-home-assistant */

/* ===== maison-cards.js ===== */
{
/* Maison Cards v1.6 — cartes custom pour le tableau mural
   - custom:maison-3d-card   : maison isométrique 3D interactive
   - custom:maison-hero-card : en-tête horloge / météo / statut
   - custom:maison-stat-card : tuile KPI en verre                       */

const MC_FONT = "'Inter','SF Pro Display','Segoe UI',Roboto,sans-serif";

const mcNum = (hass, id) => {
  const s = hass && hass.states[id];
  if (!s) return NaN;
  const v = parseFloat(s.state);
  return isNaN(v) ? NaN : v;
};
const mcState = (hass, id) => (hass && hass.states[id] ? hass.states[id].state : undefined);
const mcFire = (node, type, detail) =>
  node.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
const mcMoreInfo = (node, entityId) => mcFire(node, "hass-more-info", { entityId });

function mcTempColor(t) {
  if (isNaN(t)) return "#6b7280";
  const stops = [
    [16, [56, 132, 255]], [19, [45, 212, 191]], [21, [74, 222, 128]],
    [23, [251, 191, 36]], [26, [248, 113, 113]],
  ];
  if (t <= stops[0][0]) return `rgb(${stops[0][1]})`;
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1], [t1, c1] = stops[i];
      const k = (t - t0) / (t1 - t0);
      const c = c0.map((v, j) => Math.round(v + (c1[j] - v) * k));
      return `rgb(${c.join(",")})`;
    }
  }
  return `rgb(${stops[stops.length - 1][1]})`;
}

/* ------------------------------------------------------------------ */
/*  Disposition par défaut de la maison (unités de grille)             */
/* ------------------------------------------------------------------ */
const MC_DEFAULT_FLOORS = [
  {
    id: "rdc", name: "Rez-de-chaussée", w: 12, d: 9,
    rooms: [
      { name: "Salon", x: 0, y: 0, w: 5, d: 4, climate: "climate.thermostat_salon", icon: "mdi:sofa" },
      { name: "Salle à manger", x: 5, y: 0, w: 3.5, d: 4, climate: "climate.thermostat_salle_a_manger", icon: "mdi:silverware-fork-knife" },
      { name: "Cuisine", x: 8.5, y: 0, w: 3.5, d: 4, icon: "mdi:stove" },
      { name: "Entrée", x: 0, y: 4, w: 3, d: 2, icon: "mdi:door",
        devices: [{ entity: "lock.serrure", kind: "lock" }] },
      { name: "Bureau Safouene", x: 0, y: 6, w: 3, d: 3, climate: "climate.thermostat_saff", icon: "mdi:desk",
        devices: [{ entity: "switch.bureau_saff_plug", kind: "switch", icon: "mdi:power-socket-us" }] },
      { name: "Bureau Meriem", x: 3, y: 4, w: 3, d: 5, climate: "climate.thermostat_meriem", icon: "mdi:laptop" },
      { name: "SdB haut", x: 6, y: 4, w: 2.5, d: 5, climate: "climate.thermostat_sdb_haut", icon: "mdi:shower" },
      { name: "Chambre principale", x: 8.5, y: 4, w: 3.5, d: 5, climate: "climate.thermostat_chambre_des_maitres", icon: "mdi:bed-king",
        devices: [{ entity: "light.decora_smart_800_series_dimmer", kind: "light" }] },
    ],
  },
  {
    id: "ss", name: "Sous-sol", w: 12, d: 9,
    rooms: [
      { name: "Salle familiale", x: 0, y: 0, w: 6, d: 5, climate: "climate.thermostat_salle_familiale", icon: "mdi:sofa-outline",
        humidity: "sensor.sous_sol_humidity_humidity",
        devices: [{ entity: "media_player.samsung_7_series_50_un50ru7100fxzc", kind: "media", icon: "mdi:television" }] },
      { name: "Bibliothèque", x: 6, y: 0, w: 3, d: 5, icon: "mdi:bookshelf",
        devices: [{ entity: "binary_sensor.bibliotheque_x55_etat_du_reseau_etendu_wan", kind: "status", icon: "mdi:router-wireless" }] },
      { name: "Technique", x: 9, y: 0, w: 3, d: 2.5, icon: "mdi:water-boiler",
        devices: [
          { entity: "binary_sensor.salle_technique_water_leak_water_leak", kind: "leak", icon: "mdi:water-alert" },
          { entity: "switch.water_heater", kind: "status", icon: "mdi:water-boiler" },
        ] },
      { name: "SdB bas", x: 9, y: 2.5, w: 3, d: 2.5, climate: "climate.thermostat_sdb_bas", icon: "mdi:shower-head" },
      { name: "Chambre Garçons", x: 0, y: 5, w: 6, d: 4, climate: "climate.thermostat_gars", icon: "mdi:bed",
        devices: [{ entity: "light.lumiere_garcons", kind: "light" }] },
      { name: "Chambre Filles", x: 6, y: 5, w: 6, d: 4, climate: "climate.thermostat_filles", icon: "mdi:bed-outline" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Maison 3D                                                          */
/* ------------------------------------------------------------------ */
class MaisonHouse3DCard extends HTMLElement {
  setConfig(config) {
    this._config = Object.assign({ floors: MC_DEFAULT_FLOORS, title: "Ma maison" }, config || {});
    this._view = this._config.default_view || "all";
    this._sig = null;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._renderShell();
  }

  set hass(hass) {
    this._hass = hass;
    const sig = this._signature();
    if (sig !== this._sig) {
      this._sig = sig;
      this._renderHouse();
    }
  }

  getCardSize() { return 12; }
  getGridOptions() { return { columns: "full", rows: "auto" }; }

  _entities() {
    const ids = [];
    for (const f of this._config.floors)
      for (const r of f.rooms) {
        if (r.climate) ids.push(r.climate);
        if (r.humidity) ids.push(r.humidity);
        for (const d of r.devices || []) ids.push(d.entity);
      }
    return ids;
  }
  _signature() {
    if (!this._hass) return "";
    return this._view + "|" + this._entities()
      .map((id) => { const s = this._hass.states[id]; return s ? s.state + (s.attributes.current_temperature ?? "") + (s.attributes.hvac_action ?? "") : "x"; })
      .join("|");
  }

  _renderShell() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; }
        ha-card { display:block; position:relative; overflow:hidden; border-radius:24px; padding:22px 24px 18px;
          background: radial-gradient(120% 90% at 50% 0%, rgba(76,94,180,.35), rgba(12,16,34,.0) 60%),
                      linear-gradient(160deg, #141a33 0%, #0b0f22 55%, #070a17 100%);
          color:#eef1ff; font-family:${MC_FONT}; border:1px solid rgba(255,255,255,.08);
          box-shadow: 0 30px 60px -20px rgba(0,0,0,.6); }
        .top { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
        h2 { margin:0; font-size:26px; font-weight:700; letter-spacing:-.02em; }
        .sub { opacity:.6; font-size:13px; margin-top:2px; }
        .tabs { display:flex; background:rgba(255,255,255,.06); border-radius:999px; padding:4px; gap:2px; }
        .tab { border:0; background:transparent; color:#c7cdf5; font:600 13px ${MC_FONT}; padding:9px 16px;
          border-radius:999px; cursor:pointer; transition:all .25s; }
        .tab.on { background:linear-gradient(135deg,#6d7cff,#a66bff); color:#fff; box-shadow:0 6px 18px -6px #7b6cff; }
        .stage { position:relative; margin-top:10px; }
        svg { width:100%; height:auto; display:block; overflow:visible; }
        .room { cursor:pointer; transition: filter .2s; }
        .room:hover { filter: brightness(1.25); }
        .overlay { position:absolute; inset:0; pointer-events:none; }
        .chip { position:absolute; transform:translate(-50%,-50%); pointer-events:auto; display:flex; flex-direction:column;
          align-items:center; gap:4px; cursor:pointer; user-select:none; -webkit-tap-highlight-color:transparent; }
        .pill { display:flex; align-items:center; gap:6px; padding:5px 10px 5px 7px; border-radius:999px;
          background:rgba(10,14,32,.72); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          border:1px solid rgba(255,255,255,.14); font-size:12.5px; font-weight:600; white-space:nowrap;
          box-shadow:0 8px 20px -10px rgba(0,0,0,.8); }
        .pill ha-icon { --mdc-icon-size:16px; }
        .temp { font-variant-numeric: tabular-nums; }
        .name { font-size:11px; font-weight:600; opacity:.85; text-shadow:0 1px 3px rgba(0,0,0,.9); white-space:nowrap; }
        .flame { color:#ff8a4c; animation: pulse 1.6s ease-in-out infinite; }
        .devs { display:flex; gap:6px; }
        .dev { width:34px; height:34px; border-radius:50%; display:grid; place-items:center; pointer-events:auto;
          background:rgba(10,14,32,.75); border:1px solid rgba(255,255,255,.16); cursor:pointer; transition: all .2s;
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
        .dev ha-icon { --mdc-icon-size:18px; }
        .dev:active { transform: scale(.9); }
        .dev.on { background: radial-gradient(circle, #ffd76a 0%, #f59e0b 70%); color:#3a2500; border-color:#ffe39a;
          box-shadow:0 0 22px 4px rgba(255,200,80,.55); }
        .dev.locked { background:linear-gradient(135deg,#22c55e,#15803d); color:#fff; border-color:#86efac;
          box-shadow:0 0 18px 2px rgba(34,197,94,.45); }
        .dev.unlocked { background:linear-gradient(135deg,#f97316,#dc2626); color:#fff; border-color:#fdba74;
          box-shadow:0 0 18px 2px rgba(249,115,22,.55); animation: pulse 1.4s infinite; }
        .dev.alert { background:linear-gradient(135deg,#ef4444,#991b1b); color:#fff; animation: pulse 1s infinite; }
        .dev.ok { color:#4ade80; }
        .dev.unk { color:#94a3b8; }
        .floorlabel { position:absolute; padding:4px 12px; border-radius:999px; background:rgba(109,124,255,.14); border:1px solid rgba(170,179,255,.25); pointer-events:none; font-size:12px; font-weight:700; letter-spacing:.14em;
          text-transform:uppercase; color:#aab3ff; opacity:.75; transform:translate(-50%,-50%); white-space:nowrap; }
        .legend { display:flex; flex-wrap:wrap; gap:14px; align-items:center; justify-content:space-between; margin-top:8px;
          font-size:12px; opacity:.85; }
        .grad { display:flex; align-items:center; gap:8px; }
        .bar { width:160px; height:8px; border-radius:6px;
          background:linear-gradient(90deg,#3884ff,#2dd4bf,#4ade80,#fbbf24,#f87171); }
        .stats { display:flex; gap:18px; }
        .stats b { font-size:15px; margin-right:4px; }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.55 } }
      </style>
      <ha-card>
        <div class="top">
          <div><h2>${this._config.title}</h2><div class="sub">Touchez une pièce pour son thermostat, une pastille pour agir</div></div>
          <div class="tabs">
            <button class="tab" data-v="all">Toute la maison</button>
            ${this._config.floors.map((f) => `<button class="tab" data-v="${f.id}">${f.name}</button>`).join("")}
          </div>
        </div>
        <div class="stage"><svg id="svg"></svg><div class="overlay" id="ov"></div></div>
        <div class="legend">
          <div class="grad"><span>16°</span><div class="bar"></div><span>26°</span></div>
          <div class="stats" id="stats"></div>
        </div>
      </ha-card>`;
    this.shadowRoot.querySelectorAll(".tab").forEach((b) =>
      b.addEventListener("click", () => { this._view = b.dataset.v; this._sig = null; this.hass = this._hass; }));
  }

  _renderHouse() {
    if (!this._hass || !this.shadowRoot) return;
    const floors = this._config.floors;
    const shown = this._view === "all" ? floors : floors.filter((f) => f.id === this._view);
    this.shadowRoot.querySelectorAll(".tab").forEach((b) => b.classList.toggle("on", b.dataset.v === this._view));

    const exploded = shown.length > 1;
    const S = exploded ? 40 : 56;          // échelle
    const WALL = exploded ? 1.1 : 1.3;     // hauteur des murs (unités)
    const C = Math.cos(Math.PI / 6), Sn = 0.5;
    // vue « toute la maison » : étages côte à côte, légèrement décalés
    const levels = [];
    let ox = 0;
    shown.forEach((f, i) => {
      levels.push({ f, z: 0, ox, oy: i * 34 });
      ox += (f.w + f.d) * C * S + 70;
    });
    let cur = levels[0];
    const iso = (x, y, z) => [cur.ox + (x - y) * C * S, cur.oy + (x + y) * Sn * S - z * S];

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const L of levels) {
      cur = L;
      const f = L.f;
      for (const [x, y, zz] of [[0, 0, WALL + 1.2], [f.w, 0, 0], [0, f.d, 0], [f.w, f.d, -0.4], [0, f.d, -0.4]]) {
        const [px, py] = iso(x, y, zz);
        minX = Math.min(minX, px); maxX = Math.max(maxX, px); minY = Math.min(minY, py); maxY = Math.max(maxY, py);
      }
    }
    const pad = 30;
    const vbX = minX - pad, vbY = minY - pad, vbW = maxX - minX + pad * 2, vbH = maxY - minY + pad * 2 + 20;
    const P = (pts) => pts.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ");
    const pct = ([px, py]) => [((px - vbX) / vbW) * 100, ((py - vbY) / vbH) * 100];

    let svg = `<defs>
      <linearGradient id="slabTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b3566"/><stop offset="1" stop-color="#1a2148"/></linearGradient>
      <linearGradient id="slabL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2250"/><stop offset="1" stop-color="#0f1433"/></linearGradient>
      <linearGradient id="slabR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#252e63"/><stop offset="1" stop-color="#141a40"/></linearGradient>
      <linearGradient id="wallA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9d2ff" stop-opacity=".30"/><stop offset="1" stop-color="#8f9cff" stop-opacity=".08"/></linearGradient>
      <linearGradient id="wallB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3e8ff" stop-opacity=".40"/><stop offset="1" stop-color="#aab4ff" stop-opacity=".10"/></linearGradient>
      <radialGradient id="lightGlow"><stop offset="0" stop-color="#ffe08a" stop-opacity=".9"/><stop offset=".55" stop-color="#ffc24d" stop-opacity=".35"/><stop offset="1" stop-color="#ffb020" stop-opacity="0"/></radialGradient>
      <radialGradient id="heatGlow"><stop offset="0" stop-color="#ff7a3d" stop-opacity=".55"/><stop offset="1" stop-color="#ff4d1a" stop-opacity="0"/></radialGradient>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="18"/></filter>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>
    </defs>`;

    let overlay = "";
    let tempSum = 0, tempN = 0, heating = 0, lightsOn = 0;

    for (const L of levels) {
      cur = L;
      const { f, z } = L;
      // ombre portée + dalle
      const sh = [iso(0, 0, z - 0.9), iso(f.w, 0, z - 0.9), iso(f.w, f.d, z - 0.9), iso(0, f.d, z - 0.9)].map(([a, b]) => [a + 10, b + 26]);
      svg += `<polygon points="${P(sh)}" fill="#000" opacity=".45" filter="url(#shadow)"/>`;
      const t = 0.35;
      svg += `<polygon points="${P([iso(0, f.d, z), iso(f.w, f.d, z), iso(f.w, f.d, z - t), iso(0, f.d, z - t)])}" fill="url(#slabL)"/>`;
      svg += `<polygon points="${P([iso(f.w, 0, z), iso(f.w, f.d, z), iso(f.w, f.d, z - t), iso(f.w, 0, z - t)])}" fill="url(#slabR)"/>`;
      svg += `<polygon points="${P([iso(0, 0, z), iso(f.w, 0, z), iso(f.w, f.d, z), iso(0, f.d, z)])}" fill="url(#slabTop)"/>`;

      const rooms = [...f.rooms].sort((a, b) => (a.x + a.y) - (b.x + b.y));
      // sols des pièces
      for (const r of rooms) {
        const cs = r.climate && this._hass.states[r.climate];
        const tcur = cs ? parseFloat(cs.attributes.current_temperature) : NaN;
        if (!isNaN(tcur)) { tempSum += tcur; tempN++; }
        const isHeat = cs && cs.attributes.hvac_action === "heating";
        if (isHeat) heating++;
        const col = mcTempColor(tcur);
        const inset = 0.06;
        const fl = [iso(r.x + inset, r.y + inset, z), iso(r.x + r.w - inset, r.y + inset, z), iso(r.x + r.w - inset, r.y + r.d - inset, z), iso(r.x + inset, r.y + r.d - inset, z)];
        const target = r.climate || (r.devices && r.devices[0] && r.devices[0].entity) || "";
        svg += `<g class="room" data-e="${target}">
          <polygon points="${P(fl)}" fill="${col}" fill-opacity="${isNaN(tcur) ? 0.16 : 0.34}" stroke="${col}" stroke-opacity=".9" stroke-width="1.6"/>`;
        const [cx, cy] = iso(r.x + r.w / 2, r.y + r.d / 2, z);
        if (isHeat) svg += `<ellipse cx="${cx}" cy="${cy}" rx="${r.w * S * 0.55}" ry="${r.d * S * 0.32}" fill="url(#heatGlow)"/>`;
        for (const d of r.devices || [])
          if (d.kind === "light" && mcState(this._hass, d.entity) === "on") {
            lightsOn++;
            svg += `<ellipse cx="${cx}" cy="${cy}" rx="${Math.max(r.w, r.d) * S * 0.75}" ry="${Math.max(r.w, r.d) * S * 0.42}" fill="url(#lightGlow)" filter="url(#soft)"/>`;
          }
        svg += `</g>`;
      }
      // murs arrière (nord / ouest) de chaque pièce
      for (const r of rooms) {
        const H = WALL;
        const north = [iso(r.x, r.y, z), iso(r.x + r.w, r.y, z), iso(r.x + r.w, r.y, z + H), iso(r.x, r.y, z + H)];
        const west = [iso(r.x, r.y, z), iso(r.x, r.y + r.d, z), iso(r.x, r.y + r.d, z + H), iso(r.x, r.y, z + H)];
        svg += `<polygon points="${P(west)}" fill="url(#wallA)" stroke="#c7d0ff" stroke-opacity=".35" stroke-width="1"/>`;
        svg += `<polygon points="${P(north)}" fill="url(#wallB)" stroke="#d9e0ff" stroke-opacity=".40" stroke-width="1"/>`;
      }
      // murs extérieurs avant (bas) pour donner le volume
      const lo = 0.32;
      svg += `<polygon points="${P([iso(0, f.d, z), iso(f.w, f.d, z), iso(f.w, f.d, z + lo), iso(0, f.d, z + lo)])}" fill="#aab6ff" fill-opacity=".22" stroke="#cfd6ff" stroke-opacity=".5"/>`;
      svg += `<polygon points="${P([iso(f.w, 0, z), iso(f.w, f.d, z), iso(f.w, f.d, z + lo), iso(f.w, 0, z + lo)])}" fill="#c3ccff" fill-opacity=".28" stroke="#cfd6ff" stroke-opacity=".5"/>`;

      // étiquette d'étage
      const [lx, ly] = pct(iso(0, 0, WALL + 1.0));
      overlay += `<div class="floorlabel" style="left:${lx}%;top:${ly}%">${f.name}</div>`;

      // pastilles
      for (const r of rooms) {
        const [px, py] = pct(iso(r.x + r.w / 2, r.y + r.d / 2, z + 0.15));
        const cs = r.climate && this._hass.states[r.climate];
        const tcur = cs ? parseFloat(cs.attributes.current_temperature) : NaN;
        const isHeat = cs && cs.attributes.hvac_action === "heating";
        const hum = r.humidity ? mcNum(this._hass, r.humidity) : NaN;
        let pill = "";
        if (cs) pill = `<div class="pill" data-e="${r.climate}">
            <ha-icon icon="${isHeat ? "mdi:fire" : r.icon || "mdi:thermometer"}" class="${isHeat ? "flame" : ""}" style="color:${isHeat ? "" : mcTempColor(tcur)}"></ha-icon>
            <span class="temp">${isNaN(tcur) ? "–" : tcur.toFixed(1) + "°"}</span>${!isNaN(hum) ? `<span style="opacity:.6;font-weight:500">· ${Math.round(hum)}%</span>` : ""}</div>`;
        const devs = (r.devices || []).map((d) => this._devHtml(d)).join("");
        overlay += `<div class="chip" style="left:${px}%;top:${py}%">
          ${pill}<div class="name">${r.name}</div>${devs ? `<div class="devs">${devs}</div>` : ""}</div>`;
      }
    }

    const svgEl = this.shadowRoot.getElementById("svg");
    svgEl.setAttribute("viewBox", `${vbX} ${vbY} ${vbW} ${vbH}`);
    svgEl.innerHTML = svg;
    const ov = this.shadowRoot.getElementById("ov");
    ov.innerHTML = overlay;

    const avg = tempN ? (tempSum / tempN).toFixed(1) + "°" : "–";
    this.shadowRoot.getElementById("stats").innerHTML =
      `<span><b>${avg}</b>moyenne</span><span><b>${heating}</b>en chauffe</span><span><b>${lightsOn}</b>lumière${lightsOn > 1 ? "s" : ""} allumée${lightsOn > 1 ? "s" : ""}</span>`;

    svgEl.querySelectorAll(".room").forEach((g) => g.addEventListener("click", () => g.dataset.e && mcMoreInfo(this, g.dataset.e)));
    ov.querySelectorAll(".pill").forEach((p) => p.addEventListener("click", (ev) => { ev.stopPropagation(); mcMoreInfo(this, p.dataset.e); }));
    ov.querySelectorAll(".dev").forEach((d) => {
      d.addEventListener("click", (ev) => { ev.stopPropagation(); this._act(d.dataset.e, d.dataset.k); });
      d.addEventListener("contextmenu", (ev) => { ev.preventDefault(); mcMoreInfo(this, d.dataset.e); });
    });
  }

  _devHtml(d) {
    const st = mcState(this._hass, d.entity);
    let cls = "", icon = d.icon;
    if (d.kind === "light") { cls = st === "on" ? "on" : ""; icon = icon || (st === "on" ? "mdi:lightbulb-on" : "mdi:lightbulb-outline"); }
    else if (d.kind === "switch") { cls = st === "on" ? "on" : ""; }
    else if (d.kind === "lock") { cls = st === "locked" ? "locked" : st === "unlocked" ? "unlocked" : "unk"; icon = st === "locked" ? "mdi:lock" : "mdi:lock-open-variant"; }
    else if (d.kind === "leak") { cls = st === "on" ? "alert" : "ok"; icon = st === "on" ? "mdi:water-alert" : "mdi:water-check"; }
    else if (d.kind === "media") { cls = st && st !== "off" && st !== "unavailable" ? "on" : ""; }
    else if (d.kind === "status") { cls = st === "on" ? "ok" : "unk"; }
    if ((st === undefined || st === "unavailable") && d.kind !== "leak") cls = "unk";
    return `<div class="dev ${cls}" data-e="${d.entity}" data-k="${d.kind}" title="${d.entity}"><ha-icon icon="${icon || "mdi:help"}"></ha-icon></div>`;
  }

  _act(entity, kind) {
    const h = this._hass, st = mcState(h, entity);
    if (kind === "light") return h.callService("light", "toggle", { entity_id: entity });
    if (kind === "switch") return h.callService("switch", "toggle", { entity_id: entity });
    if (kind === "lock") {
      if (st === "locked") { if (confirm("Déverrouiller la porte d'entrée ?")) h.callService("lock", "unlock", { entity_id: entity }); }
      else h.callService("lock", "lock", { entity_id: entity });
      return;
    }
    mcMoreInfo(this, entity);
  }
}
(customElements.get("maison-3d-card") || customElements.define("maison-3d-card", MaisonHouse3DCard));

/* ------------------------------------------------------------------ */
/*  En-tête d'accueil                                                  */
/* ------------------------------------------------------------------ */
const MC_WEATHER = {
  "clear-night": ["mdi:weather-night", "Nuit claire"], cloudy: ["mdi:weather-cloudy", "Nuageux"],
  fog: ["mdi:weather-fog", "Brouillard"], hail: ["mdi:weather-hail", "Grêle"], lightning: ["mdi:weather-lightning", "Orages"],
  "lightning-rainy": ["mdi:weather-lightning-rainy", "Orages"], partlycloudy: ["mdi:weather-partly-cloudy", "Partiellement nuageux"],
  pouring: ["mdi:weather-pouring", "Averses"], rainy: ["mdi:weather-rainy", "Pluie"], snowy: ["mdi:weather-snowy", "Neige"],
  "snowy-rainy": ["mdi:weather-snowy-rainy", "Pluie et neige"], sunny: ["mdi:weather-sunny", "Ensoleillé"],
  windy: ["mdi:weather-windy", "Venteux"], exceptional: ["mdi:alert", "Exceptionnel"],
};

const MC_DEFI = { off: "Aucun", scheduled: "Prévu", pre_cold: "Pré-refroid.", appreciation: "Préchauffe",
  pre_heat: "Préchauffe", reduction: "En cours", recovery: "Récupération", completed: "Terminé", unknown: "Inconnu" };

class MaisonHeroCard extends HTMLElement {
  setConfig(config) {
    this._config = Object.assign({
      name: "Safouene", weather: "weather.laval_previsions", condition: "sensor.laval_condition_actuelle",
      high: "sensor.laval_haute_temperature", low: "sensor.laval_basse_temperature",
      lock: "lock.serrure", door: "binary_sensor.entree_door_sensor_contact", power: "sensor.meter00_power", leak: "binary_sensor.salle_technique_water_leak_water_leak",
      challenge: "sensor.defi_hilo", home_zone: "zone.home", indoor: "sensor.sous_sol_humidity_temperature",
    }, config || {});
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
  }
  connectedCallback() { this._tick = setInterval(() => this._render(), 20000); if (this._hass) this._subFc(); }
  disconnectedCallback() { clearInterval(this._tick); if (this._unsub) { this._unsub.then((u) => u()).catch(() => {}); this._unsub = null; } }
  set hass(h) { this._hass = h; this._subFc(); this._render(); }
  _subFc() {
    if (this._unsub || !this._hass || !this._hass.connection || !this.isConnected) return;
    this._unsub = this._hass.connection.subscribeMessage((m) => { this._fc = m.forecast || []; this._render(); },
      { type: "weather/subscribe_forecast", forecast_type: "daily", entity_id: this._config.weather });
    this._unsub.catch(() => { this._unsub = null; });
  }
  getCardSize() { return 4; }
  getGridOptions() { return { columns: "full", rows: "auto" }; }

  _render() {
    const h = this._hass, c = this._config;
    if (!h || !this.shadowRoot) return;
    const now = new Date();
    const hh = now.getHours();
    const greet = hh < 5 ? "Bonne nuit" : hh < 12 ? "Bonjour" : hh < 18 ? "Bon après-midi" : "Bonsoir";
    const time = now.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit", hour12: false });
    const date = now.toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "long" });
    const w = h.states[c.weather];
    const [wIcon, wLabel] = MC_WEATHER[w ? w.state : ""] || ["mdi:weather-cloudy", w ? w.state : "—"];
    const tOut = w ? w.attributes.temperature : NaN;
    const hi = mcNum(h, c.high), lo = mcNum(h, c.low);
    const cond = mcState(h, c.condition);

    const lock = mcState(h, c.lock);
    const door = mcState(h, c.door);
    const doorTxt = door === "on" ? "ouverte" : door === "off" ? "fermée" : "";
    const leak = mcState(h, c.leak);
    const chall = mcState(h, c.challenge);
    const home = mcNum(h, c.home_zone);
    const updates = Object.values(h.states).filter((s) => s.entity_id.startsWith("update.") && s.state === "on").length;

    const pills = [
      { e: c.lock, icon: lock === "locked" ? "mdi:lock" : "mdi:lock-open-variant", label: "Porte d'entrée",
        val: lock === "locked" ? "Verrouillée" : lock === "unlocked" ? "Déverrouillée" : "—",
        sub: doorTxt ? "Porte " + doorTxt : "",
        tone: door === "on" ? "warn" : lock === "locked" ? "good" : lock === "unlocked" ? "warn" : "", act: "lock" },
      { e: c.leak, icon: leak === "on" ? "mdi:water-alert" : "mdi:water-check", label: "Fuite d'eau",
        val: leak === "on" ? "FUITE !" : "Sec", tone: leak === "on" ? "bad" : "good" },
      { e: c.home_zone, icon: "mdi:account-group", label: "Présents", val: isNaN(home) ? "—" : String(home), tone: home > 0 ? "accent2" : "" },
      { e: c.challenge, icon: "mdi:lightning-bolt-circle", label: "Défi Hilo", val: MC_DEFI[chall] || "Aucun",
        tone: chall && chall !== "off" && chall !== "completed" ? "warn" : "" },
    ];
    const thermos = Object.values(h.states).filter((s) => s.entity_id.startsWith("climate.thermostat_"));
    const temps = thermos.map((s) => parseFloat(s.attributes.current_temperature)).filter((v) => !isNaN(v));
    const avgIn = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : NaN;
    const nHeat = thermos.filter((s) => s.attributes.hvac_action === "heating").length;
    pills.push(
      { nav: "/tableau-mural/climat", icon: "mdi:home-thermometer", label: "Intérieur moyen",
        val: isNaN(avgIn) ? "—" : avgIn.toLocaleString("fr-CA", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " °C", tone: "accent2" },
      { nav: "/tableau-mural/climat", icon: "mdi:fire", label: "En chauffe",
        val: `${nHeat} / ${thermos.length || 10}`, tone: nHeat ? "heat" : "" },
    );
    const fcHtml = (this._fc || []).slice(0, 5).map((f, i) => {
      const d = new Date(f.datetime);
      const day = i === 0 && d.toDateString() === now.toDateString() ? "Auj." : d.toLocaleDateString("fr-CA", { weekday: "short" }).replace(".", "");
      const ic = (MC_WEATHER[f.condition] || ["mdi:weather-cloudy"])[0];
      const hiF = f.temperature != null ? Math.round(f.temperature) + "°" : "–";
      const loF = f.templow != null ? Math.round(f.templow) + "°" : "";
      return `<div class="fd"><div class="fn">${day}</div><ha-icon icon="${ic}"></ha-icon><div class="fh">${hiF}</div><div class="fl">${loF}</div></div>`;
    }).join("");
    if (updates) pills.push({ e: "", nav: "/config/updates", icon: "mdi:package-up", label: "Mises à jour", val: String(updates), tone: "warn" });

    const html = `
      <style>
        :host { display:block; }
        ha-card { display:block; border-radius:24px; overflow:hidden; position:relative; color:#eef1ff; font-family:${MC_FONT};
          padding:28px 30px 24px; border:1px solid rgba(255,255,255,.08);
          background: radial-gradient(90% 140% at 100% 0%, rgba(255,170,90,.30), transparent 55%),
                      radial-gradient(80% 120% at 0% 100%, rgba(80,120,255,.35), transparent 60%),
                      linear-gradient(135deg,#1b1f45 0%,#11142d 60%,#0b0d1f 100%);
          box-shadow:0 30px 60px -24px rgba(0,0,0,.7); }
        .row { display:flex; justify-content:space-between; align-items:flex-end; gap:24px; flex-wrap:wrap; }
        .time { font-size:84px; font-weight:200; letter-spacing:-.04em; line-height:.9; font-variant-numeric:tabular-nums; }
        .greet { font-size:22px; font-weight:600; margin-top:10px; }
        .date { font-size:15px; opacity:.65; text-transform:capitalize; margin-top:2px; }
        .wx { display:flex; align-items:center; gap:18px; cursor:pointer; }
        .wx ha-icon { --mdc-icon-size:76px; color:#ffd27a; filter: drop-shadow(0 6px 18px rgba(255,190,90,.55)); }
        .wt { font-size:56px; font-weight:300; line-height:1; }
        .wl { font-size:14px; opacity:.75; margin-top:4px; max-width:220px; }
        .hl { font-size:13px; opacity:.6; margin-top:2px; }
        .side { display:flex; align-items:center; gap:34px; flex-wrap:wrap; justify-content:flex-end; }
        .fc { display:flex; gap:6px; padding:10px 12px; border-radius:18px; background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.07); cursor:pointer; }
        .fd { display:flex; flex-direction:column; align-items:center; gap:4px; min-width:52px; font-variant-numeric:tabular-nums; }
        .fn { font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; opacity:.6; }
        .fd ha-icon { --mdc-icon-size:26px; color:#ffd27a; margin:2px 0; }
        .fh { font-size:15px; font-weight:700; }
        .fl { font-size:12px; opacity:.55; }
        .pills { display:grid; grid-template-columns: repeat(auto-fit, minmax(150px,1fr)); gap:10px; margin-top:22px; }
        .p { display:flex; align-items:center; gap:10px; padding:9px 11px; border-radius:16px; cursor:pointer; min-width:0;
          background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.08); transition: transform .15s, background .2s;
          backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
        .p:active { transform:scale(.97); }
        .ic { width:34px; height:34px; border-radius:11px; display:grid; place-items:center; background:rgba(255,255,255,.08); flex:none; }
        .ic ha-icon { --mdc-icon-size:19px; }
        .p > div:last-child { min-width:0; }
        .lb { font-size:10.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; opacity:.6; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .vl { font-size:15px; font-weight:700; white-space:nowrap; font-variant-numeric:tabular-nums; }
        .sb { font-size:11px; opacity:.6; white-space:nowrap; }
        .good .ic { background:linear-gradient(135deg,#22c55e,#15803d); }
        .warn .ic { background:linear-gradient(135deg,#f59e0b,#ea580c); }
        .bad { background:rgba(239,68,68,.22); border-color:rgba(239,68,68,.6); }
        .bad .ic { background:linear-gradient(135deg,#ef4444,#991b1b); animation:pulse 1s infinite; }
        .accent .ic { background:linear-gradient(135deg,#6d7cff,#a66bff); }
        .accent2 .ic { background:linear-gradient(135deg,#06b6d4,#3b82f6); }
        .heat .ic { background:linear-gradient(135deg,#fb923c,#dc2626); }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.5 } }
      </style>
      <ha-card>
        <div class="row">
          <div>
            <div class="time">${time}</div>
            <div class="greet">${greet}, ${c.name}</div>
            <div class="date">${date}</div>
          </div>
          <div class="side">
          ${fcHtml ? `<div class="fc" id="fc">${fcHtml}</div>` : ""}
          <div class="wx" id="wx">
            <ha-icon icon="${wIcon}"></ha-icon>
            <div>
              <div class="wt">${isNaN(tOut) ? "–" : Math.round(tOut) + "°"}</div>
              <div class="wl">${cond || wLabel}</div>
              <div class="hl">${!isNaN(hi) ? "↑ " + hi + "°" : ""} ${!isNaN(lo) ? "  ↓ " + lo + "°" : ""}</div>
            </div>
          </div>
          </div>
        </div>
        <div class="pills">
          ${pills.map((p, i) => `<div class="p ${p.tone}" data-i="${i}">
            <div class="ic"><ha-icon icon="${p.icon}"></ha-icon></div>
            <div><div class="lb">${p.label}</div><div class="vl">${p.val}</div>${p.sub ? `<div class="sb">${p.sub}</div>` : ""}</div></div>`).join("")}
        </div>
      </ha-card>`;
    if (html === this._last) return;
    this._last = html;
    this.shadowRoot.innerHTML = html;
    this.shadowRoot.getElementById("wx").addEventListener("click", () => mcMoreInfo(this, c.weather));
    const fcEl = this.shadowRoot.getElementById("fc");
    if (fcEl) fcEl.addEventListener("click", () => mcMoreInfo(this, c.weather));
    this.shadowRoot.querySelectorAll(".p").forEach((el) => el.addEventListener("click", () => {
      const p = pills[+el.dataset.i];
      if (p.nav) { history.pushState(null, "", p.nav); mcFire(window, "location-changed", { replace: false }); return; }
      if (p.act === "lock") {
        if (lock === "locked") { if (confirm("Déverrouiller la porte d'entrée ?")) h.callService("lock", "unlock", { entity_id: c.lock }); }
        else h.callService("lock", "lock", { entity_id: c.lock });
        return;
      }
      if (p.e) mcMoreInfo(this, p.e);
    }));
  }
}
(customElements.get("maison-hero-card") || customElements.define("maison-hero-card", MaisonHeroCard));

/* ------------------------------------------------------------------ */
/*  Tuile KPI                                                          */
/* ------------------------------------------------------------------ */
const MC_GRADIENTS = {
  violet: ["#6d7cff", "#a66bff"], ocean: ["#06b6d4", "#3b82f6"], sun: ["#f59e0b", "#ef4444"],
  mint: ["#10b981", "#22c55e"], rose: ["#ec4899", "#8b5cf6"], slate: ["#64748b", "#334155"], fire: ["#fb923c", "#dc2626"],
};

class MaisonStatCard extends HTMLElement {
  setConfig(config) {
    if (!config.entity && !config.compute) throw new Error("entity ou compute requis");
    this._config = Object.assign({ color: "violet", decimals: null }, config);
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
  }
  set hass(h) {
    this._hass = h;
    const c = this._config;
    const key = c.entity ? JSON.stringify(h.states[c.entity] && [h.states[c.entity].state, h.states[c.entity].last_updated])
      : c.compute + Object.keys(h.states).length + JSON.stringify(Object.values(h.states).filter((s) => s.entity_id.startsWith("update.") || s.entity_id.startsWith("climate.")).map((s) => s.state + s.attributes.hvac_action));
    if (key === this._key) return;
    this._key = key;
    this._render();
  }
  getCardSize() { return 2; }
  getGridOptions() { return { columns: 6, rows: 2, min_rows: 2 }; }

  _value() {
    const h = this._hass, c = this._config;
    if (c.compute === "updates") return [Object.values(h.states).filter((s) => s.entity_id.startsWith("update.") && s.state === "on").length, ""];
    if (c.compute === "indoor_avg") {
      const t = Object.values(h.states).filter((s) => s.entity_id.startsWith("climate.thermostat_"))
        .map((s) => parseFloat(s.attributes.current_temperature)).filter((v) => !isNaN(v));
      return [t.length ? (t.reduce((a, b) => a + b, 0) / t.length).toLocaleString("fr-CA", { maximumFractionDigits: 1, minimumFractionDigits: 1 }) : "—", "°C"];
    }
    if (c.compute === "heating") return [Object.values(h.states).filter((s) => s.entity_id.startsWith("climate.thermostat_") && s.attributes.hvac_action === "heating").length, "/ 10"];
    const s = h.states[c.entity];
    if (!s) return ["—", ""];
    let v = c.attribute ? s.attributes[c.attribute] : s.state;
    const unit = c.unit !== undefined ? c.unit : s.attributes.unit_of_measurement || "";
    const n = /^-?\d+(\.\d+)?$/.test(String(v).trim()) ? parseFloat(v) : NaN;
    if (!isNaN(n) && c.decimals !== null) v = n.toLocaleString("fr-CA", { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals });
    else if (!isNaN(n)) v = n.toLocaleString("fr-CA", { maximumFractionDigits: 2 });
    if (c.states && c.states[v] !== undefined) v = c.states[v];
    if (v === "unknown" || v === "unavailable") v = "—";
    return [v, unit];
  }

  _render() {
    const c = this._config, h = this._hass;
    const [v, unit] = this._value();
    const [g1, g2] = MC_GRADIENTS[c.color] || MC_GRADIENTS.violet;
    let bar = "";
    if (c.max && c.entity) {
      const n = parseFloat(h.states[c.entity] && h.states[c.entity].state);
      const max = typeof c.max === "string" ? mcNum(h, c.max) : c.max;
      if (!isNaN(n) && max) {
        const pctv = Math.max(0, Math.min(100, (n / max) * 100));
        bar = `<div class="bar"><div style="width:${pctv}%"></div></div><div class="bt">${Math.round(pctv)} % ${c.max_label || ""}</div>`;
      }
    }
    const subtitle = c.secondary_entity ? (() => {
      const s = h.states[c.secondary_entity];
      return s ? `${c.secondary_prefix || ""}${s.state}${c.secondary_unit !== undefined ? c.secondary_unit : (s.attributes.unit_of_measurement ? " " + s.attributes.unit_of_measurement : "")}` : "";
    })() : c.secondary || "";
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; height:100%; }
        ha-card { height:100%; box-sizing:border-box; border-radius:24px; padding:16px 18px; position:relative; overflow:hidden;
          font-family:${MC_FONT}; color:#eef1ff; cursor:pointer; border:1px solid rgba(255,255,255,.08);
          background: radial-gradient(120% 120% at 100% 0%, ${g1}33, transparent 60%), linear-gradient(160deg,#171c3a,#0e1128);
          display:flex; flex-direction:column; justify-content:space-between; }
        .hd { display:flex; align-items:center; justify-content:space-between; }
        .lb { font-size:11.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; opacity:.6; }
        .ic { width:36px; height:36px; border-radius:12px; display:grid; place-items:center;
          background:linear-gradient(135deg,${g1},${g2}); box-shadow:0 8px 20px -8px ${g1}; }
        .ic ha-icon { --mdc-icon-size:20px; color:#fff; }
        .v { font-size:34px; font-weight:700; letter-spacing:-.02em; line-height:1.05; font-variant-numeric:tabular-nums; }
        .u { font-size:15px; font-weight:500; opacity:.6; margin-left:4px; }
        .s { font-size:12px; opacity:.6; margin-top:2px; }
        .bar { height:6px; background:rgba(255,255,255,.08); border-radius:4px; overflow:hidden; margin-top:8px; }
        .bar div { height:100%; background:linear-gradient(90deg,${g1},${g2}); border-radius:4px; }
        .bt { font-size:11px; opacity:.55; margin-top:4px; }
      </style>
      <ha-card>
        <div class="hd"><div class="lb">${c.name || ""}</div><div class="ic"><ha-icon icon="${c.icon || "mdi:chart-box"}"></ha-icon></div></div>
        <div><div class="v">${v}<span class="u">${unit}</span></div>${subtitle ? `<div class="s">${subtitle}</div>` : ""}${bar}</div>
      </ha-card>`;
    this.shadowRoot.querySelector("ha-card").addEventListener("click", () => {
      if (c.navigation_path) { history.pushState(null, "", c.navigation_path); mcFire(window, "location-changed", { replace: false }); }
      else if (c.entity) mcMoreInfo(this, c.entity);
    });
  }
}
(customElements.get("maison-stat-card") || customElements.define("maison-stat-card", MaisonStatCard));

/* ------------------------------------------------------------------ */
/*  Énergie : consommation d'aujourd'hui (depuis minuit)               */
/* ------------------------------------------------------------------ */
const mcFmtW = (w) => isNaN(w) ? "—" : w >= 1000 ? (w / 1000).toLocaleString("fr-CA", { maximumFractionDigits: 2, minimumFractionDigits: 2 }) + " kW" : Math.round(w) + " W";
const mcAgo = (iso) => {
  if (!iso) return "";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  return h < 36 ? `il y a ${h} h` : `il y a ${Math.round(h / 24)} j`;
};
const MC_THERMOS = ["salon", "salle_a_manger", "chambre_des_maitres", "saff", "meriem", "sdb_haut",
  "salle_familiale", "gars", "filles", "sdb_bas"].map((n) => `sensor.thermostat_${n}_power`);

class MaisonEnergyCard extends HTMLElement {
  setConfig(config) {
    this._config = Object.assign({
      house: "sensor.meter00_power",
      heating: MC_THERMOS,
      water_heater: "sensor.water_heater_power",
      hq_energy: "sensor.hydro_quebec_maison_conso_totale",
      hq_projected: "sensor.hydro_quebec_maison_conso_totale_projetee",
      hq_day: "sensor.hydro_quebec_maison_jour_periode_facturation",
      hq_days: "sensor.hydro_quebec_maison_duree_periode_facturation",
      hq_daily: "sensor.hydro_quebec_maison_moyenne_quotidienne_conso",
      refresh_minutes: 5,
    }, config || {});
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    this._timer = setInterval(() => this._fetch(), this._config.refresh_minutes * 60000);
  }
  disconnectedCallback() { clearInterval(this._timer); }
  set hass(h) {
    const first = !this._hass;
    this._hass = h;
    if (first) this._fetch();
    const c = this._config;
    const key = [c.house, c.water_heater, c.hq_energy, c.hq_day].map((e) => mcState(h, e)).join("|") + (this._today ? this._today.stamp : "");
    if (key === this._key) return;
    this._key = key;
    this._render();
  }
  getCardSize() { return 7; }
  getGridOptions() { return { columns: "full", rows: "auto" }; }

  async _fetch() {
    if (!this._hass || this._busy) return;
    this._busy = true;
    const c = this._config;
    const mid = new Date(); mid.setHours(0, 0, 0, 0);
    const ids = [c.house, c.water_heater, ...c.heating];
    try {
      const res = await this._hass.callWS({
        type: "recorder/statistics_during_period", start_time: mid.toISOString(), end_time: new Date().toISOString(),
        statistic_ids: ids, period: "5minute", types: ["mean"], units: { power: "W" },
      });
      const hours = Array.from({ length: 24 }, () => ({ house: 0, heat: 0, water: 0 }));
      const add = (id, key) => (res[id] || []).forEach((p) => {
        const hr = new Date(p.start).getHours();
        if (p.mean != null) hours[hr][key] += (p.mean * 5) / 60 / 1000; // kWh
      });
      add(c.house, "house"); add(c.water_heater, "water");
      c.heating.forEach((id) => add(id, "heat"));
      hours.forEach((x) => { x.other = Math.max(0, x.house - x.heat - x.water); });
      const tot = (k) => hours.reduce((a, x) => a + x[k], 0);
      this._today = { hours, house: tot("house"), heat: tot("heat"), water: tot("water"), other: tot("other"), stamp: Date.now() };
      this._err = null;
    } catch (e) {
      this._err = e && e.message ? e.message : String(e);
    }
    this._busy = false;
    this._key = null;
    this._render();
  }

  _render() {
    const h = this._hass, c = this._config;
    if (!h || !this.shadowRoot) return;
    const nf = (n, d = 0) => isNaN(n) ? "—" : n.toLocaleString("fr-CA", { maximumFractionDigits: d, minimumFractionDigits: d });
    const t = this._today;
    const nowW = mcNum(h, c.house);
    const avgDay = mcNum(h, c.hq_daily);
    const nowHr = new Date().getHours();

    const segs = t ? [
      { label: "Chauffage", sub: "10 thermostats Hilo", icon: "mdi:radiator", col: "#fb923c", v: t.heat, e: "sensor.puissance_chauffage_hilo" },
      { label: "Chauffe-eau", sub: "Contrôleur Hilo", icon: "mdi:water-boiler", col: "#ec4899", v: t.water, e: c.water_heater },
      { label: "Autres appareils", sub: "Four, sécheuse, prises…", icon: "mdi:power-plug-outline", col: "#8b9bff", v: t.other, e: "sensor.puissance_autres_appareils" },
    ] : [];
    const segTot = segs.reduce((a, s) => a + s.v, 0) || 1;
    const maxH = t ? Math.max(0.5, ...t.hours.map((x) => x.house)) : 1;
    const pctAvg = t && avgDay ? Math.min(100, (t.house / avgDay) * 100) : 0;
    const dayFrac = ((nowHr * 60 + new Date().getMinutes()) / 1440) * 100;

    const kwh = mcNum(h, c.hq_energy), proj = mcNum(h, c.hq_projected);
    const day = mcNum(h, c.hq_day), days = mcNum(h, c.hq_days);
    const hqState = h.states[c.hq_energy];
    const upd = hqState ? hqState.attributes.last_update || hqState.last_updated : null;
    const startD = !isNaN(day) ? new Date(Date.now() - (day - 1) * 86400000).toLocaleDateString("fr-CA", { day: "numeric", month: "long" }) : "";

    const bars = t ? t.hours.map((x, i) => {
      const fut = i > nowHr;
      const hh = (v) => (v / maxH) * 100;
      return `<div class="hb ${fut ? "fut" : ""} ${i === nowHr ? "cur" : ""}" title="${i} h : ${nf(x.house, 2)} kWh">
        <div class="stk" style="height:${hh(x.house)}%">
          <span style="flex:${x.other};background:#8b9bff"></span>
          <span style="flex:${x.water};background:#ec4899"></span>
          <span style="flex:${x.heat};background:#fb923c"></span>
        </div></div>`;
    }).join("") : "";

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; }
        ha-card { display:block; border-radius:24px; padding:20px 22px; color:#eef1ff; font-family:${MC_FONT};
          border:1px solid rgba(255,255,255,.08); box-shadow:0 20px 40px -24px rgba(0,0,0,.7);
          background: radial-gradient(110% 120% at 0% 0%, rgba(251,146,60,.20), transparent 55%), linear-gradient(160deg,#171c3a,#0e1128); }
        .k { font-size:11.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; opacity:.6; }
        .head { display:flex; justify-content:space-between; align-items:flex-end; gap:16px; flex-wrap:wrap; }
        .big { font-size:48px; font-weight:700; letter-spacing:-.02em; line-height:1.05; margin-top:6px; font-variant-numeric:tabular-nums; }
        .big small { font-size:20px; font-weight:500; opacity:.6; margin-left:4px; }
        .src { font-size:12px; opacity:.55; margin-top:2px; }
        .now { text-align:right; cursor:pointer; padding:8px 12px; border-radius:14px; background:rgba(255,255,255,.05); }
        .now b { font-size:18px; display:block; font-variant-numeric:tabular-nums; }
        .now span { font-size:11px; opacity:.55; }
        .live { display:inline-block; width:7px; height:7px; border-radius:50%; background:#22c55e; margin-right:6px; vertical-align:middle; animation:ping 2s infinite; }
        .cmp { margin-top:12px; }
        .track { position:relative; height:8px; border-radius:6px; background:rgba(255,255,255,.07); }
        .fill { position:absolute; inset:0 auto 0 0; border-radius:6px; background:linear-gradient(90deg,#f59e0b,#ef4444); }
        .mark { position:absolute; top:-4px; width:2px; height:16px; background:#fff; border-radius:2px; opacity:.85; }
        .legend { display:flex; justify-content:space-between; gap:12px; font-size:11.5px; opacity:.55; margin-top:6px; }
        .chart { display:flex; align-items:flex-end; gap:3px; height:96px; margin-top:18px; }
        .hb { flex:1; height:100%; display:flex; align-items:flex-end; }
        .stk { width:100%; display:flex; flex-direction:column; border-radius:4px 4px 2px 2px; overflow:hidden; min-height:2px; }
        .stk span { display:block; min-height:0; }
        .fut .stk { opacity:.15; }
        .cur .stk { outline:1px solid rgba(255,255,255,.5); }
        .axis { display:flex; justify-content:space-between; font-size:10.5px; opacity:.45; margin-top:4px; }
        .rows { display:grid; gap:8px; margin-top:16px; }
        .r { display:flex; align-items:center; gap:12px; padding:8px 10px; border-radius:14px; cursor:pointer; background:rgba(255,255,255,.035); }
        .r:active { transform:scale(.98); }
        .dot { width:34px; height:34px; border-radius:11px; display:grid; place-items:center; flex:none; }
        .dot ha-icon { --mdc-icon-size:18px; color:#fff; }
        .nm { flex:1; min-width:0; }
        .nm b { font-size:14px; font-weight:600; display:block; }
        .nm span { font-size:11.5px; opacity:.55; }
        .vv { text-align:right; font-variant-numeric:tabular-nums; }
        .vv b { font-size:15px; display:block; }
        .vv span { font-size:11.5px; opacity:.55; }
        .sep { height:1px; background:rgba(255,255,255,.08); margin:18px 0 14px; }
        .hq { display:flex; justify-content:space-between; align-items:flex-end; gap:16px; cursor:pointer; }
        .hqv { font-size:24px; font-weight:700; font-variant-numeric:tabular-nums; }
        .hqv small { font-size:13px; font-weight:500; opacity:.6; }
        .err { font-size:12px; color:#fca5a5; margin-top:10px; }
        @keyframes ping { 0% { box-shadow:0 0 0 0 rgba(34,197,94,.6) } 70% { box-shadow:0 0 0 7px rgba(34,197,94,0) } 100% { box-shadow:0 0 0 0 rgba(34,197,94,0) } }
      </style>
      <ha-card>
        <div class="head">
          <div>
            <div class="k">Aujourd'hui · depuis minuit</div>
            <div class="big">${t ? nf(t.house, 1) : "…"}<small>kWh</small></div>
          </div>
          <div class="now" data-e="${c.house}"><span><i class="live"></i>En ce moment</span><b>${mcFmtW(nowW)}</b><span>puissance appelée</span></div>
        </div>
        ${t && avgDay ? `<div class="cmp">
          <div class="track"><div class="fill" style="width:${pctAvg}%"></div><div class="mark" style="left:calc(${dayFrac}% - 1px)"></div></div>
          <div class="legend"><span>${Math.round((t.house / avgDay) * 100)} % d'une journée moyenne (${nf(avgDay, 1)} kWh)</span><span>repère : heure actuelle</span></div>
        </div>` : ""}
        <div class="chart">${bars}</div>
        <div class="axis"><span>0 h</span><span>6 h</span><span>12 h</span><span>18 h</span><span>24 h</span></div>
        <div class="rows">
          ${segs.map((s) => `<div class="r" data-e="${s.e}">
            <div class="dot" style="background:${s.col}"><ha-icon icon="${s.icon}"></ha-icon></div>
            <div class="nm"><b>${s.label}</b><span>${s.sub}</span></div>
            <div class="vv"><b>${nf(s.v, 1)} kWh</b><span>${Math.round((s.v / segTot) * 100)} %</span></div></div>`).join("")}
        </div>
        ${this._err ? `<div class="err">Historique indisponible : ${this._err}</div>` : ""}
        <div class="sep"></div>
        <div class="k">Facture en cours · Hydro-Québec</div>
        <div class="hq" data-e="${c.hq_energy}" style="margin-top:6px">
          <div><div class="hqv">${nf(kwh)} <small>kWh depuis le ${startD}</small></div>
            <div class="src">Jour ${nf(day)} sur ${nf(days)} · ${nf(proj)} kWh prévus pour la période</div></div>
          <div class="src" style="text-align:right">Portail Hydro-Québec<br>${mcAgo(upd)}</div>
        </div>
      </ha-card>`;
    this.shadowRoot.querySelectorAll("[data-e]").forEach((el) => el.addEventListener("click", (ev) => {
      ev.stopPropagation(); mcMoreInfo(this, el.dataset.e);
    }));
  }
}
(customElements.get("maison-energy-card") || customElements.define("maison-energy-card", MaisonEnergyCard));

/* ------------------------------------------------------------------ */
/*  Lumières : pastilles                                               */
/* ------------------------------------------------------------------ */
class MaisonLightsCard extends HTMLElement {
  setConfig(config) {
    if (!config.lights || !config.lights.length) throw new Error("lights requis");
    this._config = config;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
  }
  set hass(h) {
    this._hass = h;
    const key = this._config.lights.map((l) => {
      const s = h.states[l.entity]; return s ? s.state + JSON.stringify(s.attributes.rgb_color) + s.attributes.brightness : "x";
    }).join("|");
    if (key === this._key) return;
    this._key = key;
    this._render();
  }
  getCardSize() { return 3; }
  getGridOptions() { return { columns: "full", rows: "auto" }; }

  _render() {
    const h = this._hass;
    const items = this._config.lights.map((l) => {
      const s = h.states[l.entity];
      const on = !!s && s.state === "on";
      const avail = !!s && s.state !== "unavailable";
      const rgb = on && s.attributes.rgb_color ? s.attributes.rgb_color : [255, 196, 87];
      const bri = on && s.attributes.brightness != null ? Math.round((s.attributes.brightness / 255) * 100) : null;
      return { ...l, on, avail, rgb, bri };
    });
    const nOn = items.filter((i) => i.on).length;
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; }
        ha-card { display:block; border-radius:24px; padding:20px 22px; color:#eef1ff; font-family:${MC_FONT};
          border:1px solid rgba(255,255,255,.08); box-shadow:0 20px 40px -24px rgba(0,0,0,.7);
          background: radial-gradient(120% 120% at 100% 0%, rgba(255,196,87,${nOn ? ".22" : ".06"}), transparent 60%), linear-gradient(160deg,#171c3a,#0e1128); }
        .top { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; min-height:34px; }
        .sum { font-size:13px; opacity:.7; }
        .sum b { font-size:15px; opacity:1; }
        .off { border:0; font:600 12.5px ${MC_FONT}; color:#eef1ff; background:rgba(255,255,255,.08); padding:8px 14px;
          border-radius:999px; cursor:pointer; display:${nOn ? "inline-flex" : "none"}; align-items:center; gap:6px; }
        .off ha-icon { --mdc-icon-size:16px; }
        .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(120px,1fr)); gap:18px; }
        .it { display:flex; flex-direction:column; align-items:center; gap:10px; cursor:pointer; user-select:none; -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
        .orb { position:relative; width:86px; height:86px; border-radius:50%; display:grid; place-items:center; transition: transform .15s, box-shadow .3s, background .3s;
          background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); }
        .orb ha-icon { --mdc-icon-size:34px; color:#94a3b8; }
        .it:active .orb { transform:scale(.92); }
        .on .orb { border-color:transparent; }
        .on .orb ha-icon { color:#1b1300; }
        .na { opacity:.4; }
        .pw { position:absolute; right:-6px; bottom:-6px; width:34px; height:34px; border-radius:50%; display:grid; place-items:center;
          background:#1d2347; border:2px solid #0e1128; box-shadow:0 4px 10px rgba(0,0,0,.5); cursor:pointer; }
        .pw ha-icon { --mdc-icon-size:18px !important; color:#cbd5ff !important; }
        .on .pw { background:#fff; }
        .on .pw ha-icon { color:#1b1300 !important; }
        .pw:active { transform:scale(.88); }
        .nm { font-size:13.5px; font-weight:600; text-align:center; }
        .st { font-size:11.5px; opacity:.6; margin-top:-6px; }
        .hint { font-size:11px; opacity:.4; text-align:center; margin-top:16px; }
      </style>
      <ha-card>
        <div class="top"><div class="sum"><b>${nOn}</b> allumée${nOn > 1 ? "s" : ""} sur ${items.length}</div>
          <button class="off" id="alloff"><ha-icon icon="mdi:lightbulb-group-off"></ha-icon>Tout éteindre</button></div>
        <div class="grid">
          ${items.map((i, k) => {
            const [r, g, b] = i.rgb;
            const lt = (v) => Math.min(255, v + 70);
            const style = i.on ? `background: radial-gradient(circle at 35% 30%, rgb(${lt(r)},${lt(g)},${lt(b)}), rgb(${r},${g},${b}) 70%); box-shadow: 0 0 34px 6px rgba(${r},${g},${b},.55), inset 0 -6px 14px rgba(0,0,0,.18);` : "";
            return `<div class="it ${i.on ? "on" : ""} ${i.avail ? "" : "na"}" data-k="${k}">
              <div class="orb" style="${style}"><ha-icon icon="${i.icon || (i.on ? "mdi:lightbulb-on" : "mdi:lightbulb-outline")}"></ha-icon>
                <div class="pw" data-k="${k}" title="Allumer / éteindre"><ha-icon icon="mdi:power"></ha-icon></div></div>
              <div class="nm">${i.name || i.entity}</div>
              <div class="st">${!i.avail ? "Indisponible" : i.on ? (i.bri != null ? i.bri + " %" : "Allumée") : "Éteinte"}</div></div>`;
          }).join("")}
        </div>
        <div class="hint">Toucher une lumière pour ses réglages · bouton ⏻ pour allumer ou éteindre</div>
      </ha-card>`;
    this.shadowRoot.getElementById("alloff").addEventListener("click", () =>
      h.callService("light", "turn_off", { entity_id: items.filter((i) => i.on).map((i) => i.entity) }));
    this.shadowRoot.querySelectorAll(".it").forEach((el) => {
      const it = items[+el.dataset.k];
      el.addEventListener("click", () => mcMoreInfo(this, it.entity));
    });
    this.shadowRoot.querySelectorAll(".pw").forEach((el) => {
      const it = items[+el.dataset.k];
      el.addEventListener("click", (ev) => { ev.stopPropagation(); h.callService("light", "toggle", { entity_id: it.entity }); });
    });
  }
}
(customElements.get("maison-lights-card") || customElements.define("maison-lights-card", MaisonLightsCard));

window.customCards = window.customCards || [];
window.customCards.push(
  { type: "maison-3d-card", name: "Maison 3D", description: "Vue isométrique interactive de la maison" },
  { type: "maison-hero-card", name: "Maison – Accueil", description: "Horloge, météo et statut de la maison" },
  { type: "maison-stat-card", name: "Maison – KPI", description: "Tuile de statistique en verre" },
  { type: "maison-energy-card", name: "Maison – Énergie", description: "Consommation du jour, répartition Hilo et facture Hydro-Québec" },
  { type: "maison-lights-card", name: "Maison – Lumières", description: "Pastilles de lumières" },
);
console.info("%c MAISON-CARDS %c v1.6 ", "background:#6d7cff;color:#fff;border-radius:4px 0 0 4px;padding:2px 6px", "background:#1b1f45;color:#fff;border-radius:0 4px 4px 0;padding:2px 6px");
}

/* ===== maison-devices.js ===== */
{
/* Maison Cards — custom:maison-devices-card v1.1
   Liste compacte d'équipements : icône, nom, mesures, interrupteur. */
(() => {
  const FONT = "'Inter','SF Pro Display','Segoe UI',Roboto,sans-serif";
  const fire = (node, type, detail) => node.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  const rel = (iso) => {
    const t = new Date(iso).getTime();
    if (isNaN(t)) return null;
    const m = Math.round((t - Date.now()) / 60000), a = Math.abs(m);
    const txt = a < 60 ? `${a} min` : a < 2160 ? `${Math.round(a / 60)} h` : `${Math.round(a / 1440)} j`;
    return m < 0 ? `il y a ${txt}` : `dans ${txt}`;
  };
  const fmt = (h, id, d, attr) => {
    const s = h.states[id];
    if (attr) return s && s.attributes[attr] != null ? String(s.attributes[attr]) : null;
    if (!s || s.state === "unknown" || s.state === "unavailable") return null;
    if (s.attributes.device_class === "timestamp") return rel(s.state);
    const n = /^-?\d+(\.\d+)?$/.test(String(s.state).trim()) ? parseFloat(s.state) : NaN;
    const u = s.attributes.unit_of_measurement || "";
    if (isNaN(n)) return s.state;
    if (u === "W" && n >= 1000) return (n / 1000).toLocaleString("fr-CA", { maximumFractionDigits: 2 }) + " kW";
    return n.toLocaleString("fr-CA", { maximumFractionDigits: d ?? 1 }) + (u ? " " + u : "");
  };

  class MaisonDevicesCard extends HTMLElement {
    setConfig(config) {
      if (!config.devices || !config.devices.length) throw new Error("devices requis");
      this._config = config;
      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    }
    set hass(h) {
      this._hass = h;
      const ids = this._config.devices.flatMap((d) => [d.entity, ...(d.metrics || []).map((m) => m.entity)]);
      const key = ids.map((id) => (h.states[id] ? h.states[id].state + JSON.stringify(h.states[id].attributes.installed_version || "") : "x")).join("|");
      if (key === this._key) return;
      this._key = key;
      this._render();
    }
    connectedCallback() { this._tick = setInterval(() => { if (this._hass) this._render(); }, 60000); }
    disconnectedCallback() { clearInterval(this._tick); }
    getCardSize() { return 2; }
    getGridOptions() { return { columns: "full", rows: "auto" }; }

    _render() {
      const h = this._hass;
      const items = this._config.devices.map((d) => {
        const s = h.states[d.entity];
        const st = s ? s.state : "unavailable";
        const isSwitch = d.entity.startsWith("switch.") || d.entity.startsWith("light.") || d.entity.startsWith("input_boolean.");
        const on = st === "on";
        let label = d.states && d.states[st] !== undefined ? d.states[st] : null;
        if (label === null && d.attribute) label = fmt(h, d.entity, 0, d.attribute);
        if (label === null && s && s.attributes.device_class === "timestamp") label = rel(st);
        if (label === null) label = st === "on" ? "Allumé" : st === "off" ? "Éteint" : st === "unavailable" ? "Indisponible" : st === "unknown" ? (d.unknown || "Inconnu") : st;
        const metrics = (d.metrics || []).map((m) => {
          const v = fmt(h, m.entity, m.decimals, m.attribute);
          return v === null ? null : `${m.prefix || ""}${v}`;
        }).filter(Boolean);
        let tone = d.tone_fixed ? d.tone_fixed : d.tone_on && on ? d.tone_on : d.tone && d.tone[st] ? d.tone[st] : on ? "on" : "";
        let gauge = null;
        if (d.gauge) {
          const v = parseFloat(st);
          if (!isNaN(v)) {
            const bad = d.gauge.bad_below ?? 20, warn = d.gauge.warn_below ?? 40;
            tone = v < bad ? "bad" : v < warn ? "warn" : "good";
            gauge = Math.max(0, Math.min(100, ((v - (d.gauge.min ?? 0)) / ((d.gauge.max ?? 100) - (d.gauge.min ?? 0))) * 100));
            if (label === st) label = `${Math.round(v)} %`;
          }
        }
        return { ...d, st, on, isSwitch, label, metrics, tone, gauge };
      });
      this.shadowRoot.innerHTML = `
        <style>
          :host { display:block; }
          ha-card { display:block; border-radius:24px; padding:10px; color:#eef1ff; font-family:${FONT};
            border:1px solid rgba(255,255,255,.08); box-shadow:0 20px 40px -24px rgba(0,0,0,.7);
            background: radial-gradient(120% 120% at 100% 0%, rgba(109,124,255,.14), transparent 60%), linear-gradient(160deg,#171c3a,#0e1128); }
          .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:8px; }
          .it { display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:16px; background:rgba(255,255,255,.035);
            cursor:pointer; -webkit-tap-highlight-color:transparent; min-width:0; }
          .it:active { transform:scale(.98); }
          .ic { width:38px; height:38px; border-radius:12px; display:grid; place-items:center; flex:none; background:rgba(255,255,255,.07); }
          .ic ha-icon { --mdc-icon-size:20px; color:#94a3b8; }
          .on .ic { background:linear-gradient(135deg,#f59e0b,#ef4444); box-shadow:0 6px 16px -6px #f59e0b; }
          .good .ic { background:linear-gradient(135deg,#22c55e,#15803d); }
          .bad .ic { background:linear-gradient(135deg,#ef4444,#991b1b); }
          .warn .ic { background:linear-gradient(135deg,#f59e0b,#ea580c); }
          .info .ic { background:linear-gradient(135deg,#6d7cff,#a66bff); }
          .on .ic ha-icon, .good .ic ha-icon, .bad .ic ha-icon, .warn .ic ha-icon, .info .ic ha-icon { color:#fff; }
          .gb { height:5px; border-radius:4px; background:rgba(255,255,255,.08); margin-top:6px; overflow:hidden; }
          .gb div { height:100%; border-radius:4px; background:linear-gradient(90deg,#22c55e,#4ade80); }
          .warn .gb div { background:linear-gradient(90deg,#f59e0b,#fbbf24); }
          .bad .gb div { background:linear-gradient(90deg,#ef4444,#f87171); }
          .tx { flex:1; min-width:0; }
          .nm { font-size:14px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
          .sb { font-size:12px; opacity:.6; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-variant-numeric:tabular-nums; }
          .sw { position:relative; width:44px; height:26px; border-radius:999px; background:rgba(255,255,255,.14); flex:none; transition:background .2s; }
          .sw::after { content:""; position:absolute; top:3px; left:3px; width:20px; height:20px; border-radius:50%; background:#fff; transition:transform .2s; box-shadow:0 2px 4px rgba(0,0,0,.4); }
          .on .sw { background:linear-gradient(135deg,#f59e0b,#ef4444); }
          .on .sw::after { transform:translateX(18px); }
        </style>
        <ha-card><div class="grid">
          ${items.map((i, k) => `<div class="it ${i.tone}" data-k="${k}">
            <div class="ic"><ha-icon icon="${i.icon || "mdi:power-plug"}"></ha-icon></div>
            <div class="tx"><div class="nm">${i.name || i.entity}</div>
              <div class="sb">${[i.show_state === false ? null : i.label, ...i.metrics].filter(Boolean).join(" · ")}</div>
              ${i.gauge !== null ? `<div class="gb"><div style="width:${i.gauge}%"></div></div>` : ""}</div>
            ${i.isSwitch && i.toggle !== false ? `<div class="sw" data-k="${k}" role="switch" aria-checked="${i.on}"></div>` : ""}
          </div>`).join("")}
        </div></ha-card>`;
      this.shadowRoot.querySelectorAll(".it").forEach((el) => el.addEventListener("click", () =>
        fire(this, "hass-more-info", { entityId: items[+el.dataset.k].more_info || items[+el.dataset.k].entity })));
      this.shadowRoot.querySelectorAll(".sw").forEach((el) => el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const it = items[+el.dataset.k];
        const domain = it.entity.split(".")[0];
        if (it.confirm_off && it.on && !confirm(it.confirm_off)) return;
        h.callService(domain, "toggle", { entity_id: it.entity });
      }));
    }
  }
  if (!customElements.get("maison-devices-card")) (customElements.get("maison-devices-card") || customElements.define("maison-devices-card", MaisonDevicesCard));
  window.customCards = window.customCards || [];
  if (window.customCards.some((c) => c.type === "maison-devices-card")) return;
  window.customCards.push({ type: "maison-devices-card", name: "Maison – Équipements", description: "Liste compacte d'équipements avec interrupteurs" });
})();
}

/* ===== maison-prayer.js ===== */
{
/* Maison Cards — custom:maison-prayer-card v1.0
   Horaires des prières calculés localement (algorithme PrayTimes), compte à rebours
   jusqu'à la prochaine prière, gestion Isha → Fajr du lendemain et du passage de minuit. */
(() => {
  const FONT = "'Inter','SF Pro Display','Segoe UI',Roboto,sans-serif";
  const METHODS = {
    ISNA: { fajr: 15, isha: 15 }, MWL: { fajr: 18, isha: 17 }, Egypt: { fajr: 19.5, isha: 17.5 },
    Makkah: { fajr: 18.5, isha: "90 min" }, Karachi: { fajr: 18, isha: 18 },
  };
  const NAMES = [
    { k: "fajr", n: "Fajr", ar: "الفجر", icon: "mdi:weather-night-partly-cloudy" },
    { k: "sunrise", n: "Chourouk", ar: "الشروق", icon: "mdi:weather-sunset-up", info: true },
    { k: "dhuhr", n: "Dhuhr", ar: "الظهر", icon: "mdi:white-balance-sunny" },
    { k: "asr", n: "Asr", ar: "العصر", icon: "mdi:weather-partly-cloudy" },
    { k: "maghrib", n: "Maghrib", ar: "المغرب", icon: "mdi:weather-sunset-down" },
    { k: "isha", n: "Isha", ar: "العشاء", icon: "mdi:moon-waning-crescent" },
  ];

  // ---------- astronomie ----------
  const dtr = (d) => (d * Math.PI) / 180, rtd = (r) => (r * 180) / Math.PI;
  const sin = (d) => Math.sin(dtr(d)), cos = (d) => Math.cos(dtr(d)), tan = (d) => Math.tan(dtr(d));
  const arcsin = (x) => rtd(Math.asin(x)), arccos = (x) => rtd(Math.acos(x));
  const arctan2 = (y, x) => rtd(Math.atan2(y, x)), arccot = (x) => rtd(Math.atan(1 / x));
  const fix = (a, b) => { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; };
  const julian = (y, m, d) => {
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  };
  const sunPos = (jd) => {
    const D = jd - 2451545.0;
    const g = fix(357.529 + 0.98560028 * D, 360), q = fix(280.459 + 0.98564736 * D, 360);
    const L = fix(q + 1.915 * sin(g) + 0.02 * sin(2 * g), 360);
    const e = 23.439 - 0.00000036 * D;
    const RA = arctan2(cos(e) * sin(L), cos(L)) / 15;
    return { decl: arcsin(sin(e) * sin(L)), eqt: q / 15 - fix(RA, 24) };
  };

  /** Horaires (en heures locales décimales) pour une date civile donnée. */
  function prayTimes(date, lat, lng, method, asrFactor) {
    const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
    const tz = -new Date(y, m - 1, d, 12).getTimezoneOffset() / 60;
    const jd = julian(y, m, d) - lng / (15 * 24);
    const mid = (t) => fix(12 - sunPos(jd + t).eqt, 24);
    const angleT = (angle, t, ccw) => {
      const decl = sunPos(jd + t).decl, noon = mid(t);
      const T = arccos((-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat))) / 15;
      return noon + (ccw ? -T : T);
    };
    const asrT = (f, t) => { const decl = sunPos(jd + t).decl; return angleT(-arccot(f + tan(Math.abs(lat - decl))), t); };
    let t = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, sunset: 18, isha: 18 };
    for (let i = 0; i < 2; i++) {
      const p = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v / 24]));
      t = {
        fajr: angleT(method.fajr, p.fajr, true), sunrise: angleT(0.833, p.sunrise, true),
        dhuhr: mid(p.dhuhr), asr: asrT(asrFactor, p.asr), sunset: angleT(0.833, p.sunset),
        isha: typeof method.isha === "number" ? angleT(method.isha, p.isha) : 0,
      };
    }
    if (typeof method.isha !== "number") t.isha = t.sunset + parseFloat(method.isha) / 60;
    // latitudes élevées : méthode « angle-based » si l'angle n'est jamais atteint
    const night = 24 + t.sunrise - t.sunset;
    if (isNaN(t.fajr) || t.sunrise - t.fajr > (method.fajr / 60) * night) t.fajr = t.sunrise - (method.fajr / 60) * night;
    if (typeof method.isha === "number" && (isNaN(t.isha) || t.isha - t.sunset > (method.isha / 60) * night)) t.isha = t.sunset + (method.isha / 60) * night;
    const out = {};
    for (const [k, v] of Object.entries(t)) out[k === "sunset" ? "maghrib" : k] = v + tz - lng / 15;
    return out;
  }

  const toDate = (base, hours, adjMin) => {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    return new Date(d.getTime() + Math.round((hours * 60 + (adjMin || 0)) * 60000));
  };
  const hm = (d) => d.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit", hour12: false });
  const dur = (ms) => {
    const m = Math.max(0, Math.ceil(ms / 60000));
    if (m < 1) return "maintenant";
    const h = Math.floor(m / 60), r = m % 60;
    return h ? `${h} h ${String(r).padStart(2, "0")}` : `${r} min`;
  };

  class MaisonPrayerCard extends HTMLElement {
    setConfig(config) {
      this._config = Object.assign({ method: "ISNA", asr: "standard", adjust: {}, title: "Prières" }, config || {});
      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    }
    set hass(h) {
      const first = !this._hass;
      this._hass = h;
      if (first) this._render();
    }
    connectedCallback() { this._tick = setInterval(() => this._render(), 20000); this._render(); }
    disconnectedCallback() { clearInterval(this._tick); }
    getCardSize() { return 5; }
    getGridOptions() { return { columns: "full", rows: "auto" }; }

    _day(base) {
      const c = this._config, h = this._hass;
      const lat = c.latitude ?? h.config.latitude, lng = c.longitude ?? h.config.longitude;
      const t = prayTimes(base, lat, lng, METHODS[c.method] || METHODS.ISNA, c.asr === "hanafi" ? 2 : 1);
      return NAMES.map((p) => ({ ...p, at: toDate(base, t[p.k], c.adjust[p.k]) }));
    }

    _render() {
      if (!this._hass || !this.shadowRoot || !this._hass.config) return;
      const now = new Date();
      const today = this._day(now);
      const tomorrow = this._day(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
      const yesterday = this._day(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
      const prayers = (list) => list.filter((p) => !p.info);
      // prochaine prière : aujourd'hui, sinon Fajr de demain (après Isha)
      let next = prayers(today).find((p) => p.at > now);
      const afterIsha = !next;
      if (!next) next = prayers(tomorrow)[0];
      // prière précédente : avant Fajr (après minuit), c'est Isha d'hier
      const past = prayers(today).filter((p) => p.at <= now);
      const prev = past.length ? past[past.length - 1] : prayers(yesterday).slice(-1)[0];
      const span = next.at - prev.at, done = now - prev.at;
      const pct = Math.max(0, Math.min(100, (done / span) * 100));
      const shown = afterIsha ? tomorrow : today;
      const nowCur = past.length > 0 && now - prev.at < 20 * 60000;
      let hijri = "";
      try { hijri = new Intl.DateTimeFormat("fr-CA-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }).format(now >= today.find((p) => p.k === "maghrib").at ? new Date(now.getTime() + 86400000) : now); } catch (e) { hijri = ""; }

      const html = `
        <style>
          :host { display:block; }
          ha-card { display:block; border-radius:24px; padding:20px 22px; color:#eef1ff; font-family:${FONT};
            border:1px solid rgba(255,255,255,.08); box-shadow:0 20px 40px -24px rgba(0,0,0,.7);
            background: radial-gradient(120% 120% at 100% 0%, rgba(20,184,166,.20), transparent 60%), linear-gradient(160deg,#171c3a,#0e1128); }
          .k { font-size:11.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; opacity:.6; }
          .head { display:flex; justify-content:space-between; align-items:flex-start; gap:14px; }
          .nx { font-size:30px; font-weight:700; letter-spacing:-.02em; margin-top:6px; line-height:1.1; }
          .nx span { font-weight:500; opacity:.55; font-size:18px; margin-left:6px; }
          .cd { text-align:right; }
          .cd b { display:block; font-size:30px; font-weight:700; letter-spacing:-.02em; font-variant-numeric:tabular-nums; margin-top:6px; line-height:1.1; }
          .hj { font-size:12px; opacity:.55; margin-top:4px; }
          .track { height:6px; border-radius:4px; background:rgba(255,255,255,.08); margin-top:14px; overflow:hidden; }
          .track div { height:100%; border-radius:4px; background:linear-gradient(90deg,#14b8a6,#6d7cff); }
          .tl { display:flex; justify-content:space-between; font-size:11px; opacity:.5; margin-top:4px; }
          .list { display:grid; grid-template-columns: repeat(6, 1fr); gap:8px; margin-top:16px; }
          .p { display:flex; flex-direction:column; align-items:center; gap:4px; padding:10px 4px 9px; border-radius:16px;
            background:rgba(255,255,255,.04); border:1px solid transparent; transition: background .3s; }
          .p ha-icon { --mdc-icon-size:20px; color:#94a3b8; }
          .p .n { font-size:12px; font-weight:600; }
          .p .a { font-size:11px; opacity:.45; direction:rtl; }
          .p .t { font-size:15px; font-weight:700; font-variant-numeric:tabular-nums; }
          .p.past { opacity:.38; }
          .p.info .t { font-weight:500; opacity:.7; }
          .p.next { background:linear-gradient(160deg, rgba(20,184,166,.28), rgba(109,124,255,.22)); border-color:rgba(94,234,212,.45);
            box-shadow:0 10px 24px -12px rgba(20,184,166,.7); }
          .p.next ha-icon { color:#5eead4; }
          .day { font-size:11.5px; opacity:.55; margin-top:12px; text-align:center; }
          @media (max-width: 520px) { .list { grid-template-columns: repeat(3, 1fr); } }
        </style>
        <ha-card>
          <div class="head">
            <div>
              <div class="k">${nowCur ? `C'est l'heure de ${prev.n}` : "Prochaine prière"}</div>
              <div class="nx">${next.n}${afterIsha ? "<span>demain</span>" : ""}<span>${hm(next.at)}</span></div>
              ${hijri ? `<div class="hj">${hijri}</div>` : ""}
            </div>
            <div class="cd"><div class="k">Dans</div><b>${dur(next.at - now)}</b></div>
          </div>
          <div class="track"><div style="width:${pct}%"></div></div>
          <div class="tl"><span>${prev.n} ${hm(prev.at)}</span><span>${next.n} ${hm(next.at)}</span></div>
          <div class="list">
            ${shown.map((p) => {
              const cls = [p.info ? "info" : "", p === next ? "next" : "", !afterIsha && p.at <= now ? "past" : ""].join(" ");
              return `<div class="p ${cls}"><ha-icon icon="${p.icon}"></ha-icon><div class="n">${p.n}</div><div class="a">${p.ar}</div><div class="t">${hm(p.at)}</div></div>`;
            }).join("")}
          </div>
          ${afterIsha ? `<div class="day">Horaires de demain</div>` : ""}
        </ha-card>`;
      if (html === this._last) return;
      this._last = html;
      this.shadowRoot.innerHTML = html;
    }
  }
  if (!customElements.get("maison-prayer-card")) (customElements.get("maison-prayer-card") || customElements.define("maison-prayer-card", MaisonPrayerCard));
  window.maisonPrayTimes = prayTimes;
  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c.type === "maison-prayer-card"))
    window.customCards.push({ type: "maison-prayer-card", name: "Maison – Prières", description: "Horaires des prières et compte à rebours" });
})();
}

/* ===== maison-foot.js ===== */
{
/* Maison Cards — football v1.1
   custom:maison-foot-card       : résumé pour l'accueil (résultats, prochain match, direct)
   custom:maison-foot-team-card  : fiche détaillée d'une équipe (onglet Foot)
   Sources : ESPN (Manchester United, Tunisie, matchs CAF du Club Africain — direct + buteurs)
             site officiel clubafricain.com via capteurs Home Assistant (Ligue 1 TN + coupes)
             API classement du site du club (Ligue 1 TN), ESPN (Premier League). */
(() => {
  const FONT = "'Inter','SF Pro Display','Segoe UI',Roboto,sans-serif";
  const ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer";
  const LIVE_CA = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT", "SUSP"];
  const TEAMS = {
    ca: { key: "ca", name: "Club Africain", short: "CA", espn: "18816", national: false,
      c1: "#e30613", c2: "#ffffff", glow: "rgba(227,6,19,.45)", sub: "Ligue 1 · Coupes CAF" },
    mu: { key: "mu", name: "Manchester United", short: "Man Utd", espn: "360", national: false,
      c1: "#da291c", c2: "#fbe122", glow: "rgba(218,41,28,.45)", sub: "Premier League · Europe", table: "eng.1" },
    tun: { key: "tun", name: "Tunisie", short: "Tunisie", espn: "659", national: true,
      c1: "#e70013", c2: "#f8fafc", glow: "rgba(231,0,19,.40)", sub: "Aigles de Carthage" },
  };
  const CA_CREST = "https://clubafricain.com/ca-crest.png";
  const CA_CREST_FALLBACK = "https://media.api-sports.io/football/teams/988.png";
  const CA_SENSORS = {
    up: ["sensor.club_africain_a_venir_1", "sensor.club_africain_a_venir_2", "sensor.club_africain_a_venir_3"],
    past: ["sensor.club_africain_resultat_1", "sensor.club_africain_resultat_2", "sensor.club_africain_resultat_3"],
  };
  const COMP_FR = [
    [/premier league/i, "Premier League"], [/uefa champions league|^ucl$/i, "Ligue des champions"],
    [/europa league/i, "Ligue Europa"], [/conference league/i, "Ligue Conférence"],
    [/fa cup/i, "FA Cup"], [/carabao|league cup|efl cup/i, "Coupe de la Ligue"],
    [/community shield/i, "Community Shield"], [/club friendly/i, "Match amical"],
    [/international friendly/i, "Match amical"], [/fifa world cup qual|wcq/i, "Qualif. Coupe du monde"],
    [/fifa world cup|^world cup/i, "Coupe du monde"], [/afcon qualifying|nations qualifying/i, "Qualif. CAN"],
    [/africa cup of nations|^afcon/i, "Coupe d'Afrique"], [/arab cup/i, "Coupe arabe"],
    [/caf champions league|ligue des champions de la caf/i, "Ligue des champions CAF"],
    [/confederation cup|coupe de la conf/i, "Coupe de la CAF"], [/^ligue (professionnel(le)? )?1/i, "Ligue 1"],
    [/coupe de tunisie/i, "Coupe de Tunisie"], [/super ?coupe/i, "Supercoupe"],
  ];
  const NAME_FR = { Tunisia: "Tunisie", Morocco: "Maroc", Algeria: "Algérie", Egypt: "Égypte", Libya: "Libye",
    Senegal: "Sénégal", Cameroon: "Cameroun", "Ivory Coast": "Côte d'Ivoire", Nigeria: "Nigéria", Mali: "Mali",
    "Burkina Faso": "Burkina Faso", Botswana: "Botswana", Uganda: "Ouganda", Liberia: "Libéria", Malawi: "Malawi",
    "Equatorial Guinea": "Guinée équatoriale", Guinea: "Guinée", "South Africa": "Afrique du Sud", Ghana: "Ghana",
    Japan: "Japon", Netherlands: "Pays-Bas", Sweden: "Suède", Belgium: "Belgique", Austria: "Autriche",
    Canada: "Canada", Haiti: "Haïti", France: "France", Brazil: "Brésil", Germany: "Allemagne", Spain: "Espagne",
    England: "Angleterre", Italy: "Italie", Portugal: "Portugal", Mauritania: "Mauritanie", Comoros: "Comores",
    Sudan: "Soudan", Gambia: "Gambie", Namibia: "Namibie", Tanzania: "Tanzanie", Zambia: "Zambie", Angola: "Angola",
    "Saudi Arabia": "Arabie saoudite", Qatar: "Qatar", Jordan: "Jordanie", Iraq: "Irak", Oman: "Oman", Syria: "Syrie",
    "United States": "États-Unis", Mexico: "Mexique", Argentina: "Argentine", Croatia: "Croatie", Switzerland: "Suisse" };
  const fr = (n) => NAME_FR[n] || n;
  const compFr = (n) => { if (!n) return ""; for (const [re, v] of COMP_FR) if (re.test(n)) return v; return n; };
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------- formatage ----------
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  const hm = (d) => d.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit", hour12: false });
  const dayLabel = (d) => {
    const now = new Date(), tom = new Date(now.getTime() + 86400000), yes = new Date(now.getTime() - 86400000);
    if (sameDay(d, now)) return "Aujourd'hui";
    if (sameDay(d, tom)) return "Demain";
    if (sameDay(d, yes)) return "Hier";
    const opt = { weekday: "short", day: "numeric", month: "short" };
    if (d.getFullYear() !== now.getFullYear()) opt.year = "numeric";
    return d.toLocaleDateString("fr-CA", opt).replace(/\./g, "");
  };
  const when = (d) => `${dayLabel(d)} · ${hm(d)}`;
  const countdown = (d) => {
    const ms = d - Date.now();
    if (ms <= 0) return "Coup d'envoi imminent";
    const m = Math.round(ms / 60000), h = Math.floor(m / 60), j = Math.floor(h / 24);
    if (j >= 2) return `dans ${j} jours`;
    if (h >= 1) return `dans ${h} h ${String(m % 60).padStart(2, "0")}`;
    return `dans ${m} min`;
  };

  // ---------- magasin de données partagé ----------
  const store = {
    hass: null, subs: new Set(), data: { ca: null, mu: null, tun: null }, tables: {}, live: {},
    err: {}, timer: null, lastFull: 0, busy: false, scores: {}, goalFlash: {},
    subscribe(fn) { this.subs.add(fn); this.start(); return () => this.subs.delete(fn); },
    emit() { this.subs.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } }); },
    start() { if (!this.timer) { this.refresh(true); this.timer = setInterval(() => this.refresh(false), 30000); } },
    setHass(h) {
      const old = this.hass; this.hass = h;
      const sig = (x) => x ? [...CA_SENSORS.up, ...CA_SENSORS.past].map((e) => x.states[e] && x.states[e].state).join("§") : "";
      if (sig(old) !== sig(h)) { this.buildCA(); this.emit(); }
    },
    async json(url) {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
      try { const r = await fetch(url, { signal: ctl.signal, cache: "no-store" }); if (!r.ok) throw new Error("HTTP " + r.status); return await r.json(); }
      finally { clearTimeout(t); }
    },
    norm(e, teamId) {
      const c = e.competitions && e.competitions[0]; if (!c) return null;
      const us = c.competitors.find((x) => String(x.team && x.team.id) === teamId) || c.competitors[0];
      const th = c.competitors.find((x) => x !== us) || {};
      const sc = (x) => { const s = x && x.score; const v = s == null ? null : typeof s === "object" ? s.displayValue : s; return v === "" || v == null ? null : Number(v); };
      const st = c.status || e.status || {}; const ty = st.type || {};
      let state = ty.state || "pre";
      if (/POSTPONED|CANCELED|CANCELLED|ABANDONED/.test(ty.name || "")) state = "pst";
      const logo = (t) => (t && ((t.logos && t.logos[0] && t.logos[0].href) || t.logo)) || "";
      const m = {
        id: e.id, src: "espn", slug: e.league && e.league.slug, date: new Date(e.date || c.date),
        comp: compFr((e.league && (e.league.name || e.league.abbreviation)) || ""),
        stage: e.seasonType && e.seasonType.abbreviation && !/regular/i.test(e.seasonType.abbreviation) ? e.seasonType.abbreviation : "",
        home: us.homeAway === "home",
        us: { name: fr(us.team && us.team.displayName), logo: logo(us.team), score: sc(us), so: us.shootoutScore },
        them: { name: fr(th.team && th.team.displayName), logo: logo(th.team), score: sc(th), so: th.shootoutScore },
        state, clock: st.displayClock || "", detail: ty.shortDetail || ty.detail || "",
        venue: c.venue && c.venue.fullName, goals: [],
      };
      if (state === "post" && m.us.score != null && m.them.score != null)
        m.res = m.us.score > m.them.score ? "W" : m.us.score < m.them.score ? "L" : us.winner ? "W" : th.winner ? "L" : "D";
      return m;
    },
    async loadEspn(key) {
      const T = TEAMS[key]; const now = new Date();
      const season = T.national ? now.getFullYear() : (now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1);
      const urls = [`${ESPN}/all/teams/${T.espn}/schedule?season=${season}`, `${ESPN}/all/teams/${T.espn}/schedule?fixture=true`];
      const res = await Promise.allSettled(urls.map((u) => this.json(u)));
      const map = new Map(); let logo = "";
      res.forEach((r) => { if (r.status === "fulfilled") { const j = r.value; logo = logo || (j.team && (j.team.logo || (j.team.logos && j.team.logos[0] && j.team.logos[0].href))) || "";
        (j.events || []).forEach((e) => { const m = this.norm(e, T.espn); if (m) map.set(m.id, m); }); } });
      if (!map.size && res.every((r) => r.status === "rejected")) throw res[0].reason;
      return { logo, list: [...map.values()].sort((a, b) => a.date - b.date) };
    },
    caFromSensor(id) {
      const s = this.hass && this.hass.states[id];
      if (!s || !s.state || s.state === "aucun" || s.state === "unknown" || s.state === "unavailable") return null;
      const p = s.state.split("|"); if (p.length < 9) return null;
      const [at, opp, comp, home, cs, os, status, elapsed] = p; const crest = p.slice(8).join("|");
      const date = new Date(at + ":00Z"); const num = (v) => (v === "" || v == null ? null : Number(v));
      const m = { id: "ca-" + at, src: "site", date, comp: compFr(comp), stage: (comp.match(/·\s*(J\d+)/) || [])[1] || "", home: home === "1",
        us: { name: "Club Africain", logo: "", score: num(cs) }, them: { name: opp, logo: crest && crest.startsWith("/") ? "https://clubafricain.com" + crest : crest, score: num(os) },
        state: "pre", clock: elapsed ? elapsed + "'" : "", detail: status, goals: [] };
      const age = Date.now() - date;
      if (LIVE_CA.includes(status)) m.state = "in";
      else if (status === "PST" || status === "CANC") m.state = "pst";
      else if (m.us.score != null && (status === "FT" || status === "AET" || status === "PEN" || age > 2.5 * 3600000)) m.state = "post";
      else if (age > 0 && age < 2.2 * 3600000) m.state = "in";
      if (m.state === "in" && !m.clock && age > 0) { const mn = Math.floor(age / 60000); m.clock = mn > 47 && mn < 62 ? "MT" : (mn > 62 ? Math.min(90, mn - 15) : mn) + "'"; m.approx = true; }
      if (status === "HT") m.clock = "MT";
      if (m.state === "post" && m.us.score != null && m.them.score != null) m.res = m.us.score > m.them.score ? "W" : m.us.score < m.them.score ? "L" : "D";
      return m;
    },
    buildCA() {
      const espn = this.caEspn || { logo: "", list: [] };
      const logo = CA_CREST; // ESPN n'a pas de logo pour le Club Africain (18816) : écusson officiel du club
      const list = [...CA_SENSORS.past, ...CA_SENSORS.up].map((id) => this.caFromSensor(id)).filter(Boolean);
      list.forEach((m) => {
        m.us.logo = logo;
        // enrichir avec ESPN (matchs CAF) : direct précis, buteurs, logos
        const e = espn.list.find((x) => Math.abs(x.date - m.date) < 3 * 3600000);
        if (e) {
          m.espn = e; if (!m.them.logo) m.them.logo = e.them.logo;
          if (e.state === "in" || (e.state === "post" && m.state !== "post")) Object.assign(m, { state: e.state, clock: e.clock, detail: e.detail, res: e.res, slug: e.slug, eid: e.id, approx: false, us: { ...m.us, score: e.us.score }, them: { ...m.them, score: e.them.score } });
          else { m.slug = e.slug; m.eid = e.id; }
          const lv = this.live[e.id]; if (lv) m.goals = lv.goals;
        }
      });
      list.sort((a, b) => a.date - b.date);
      this.data.ca = { logo, list };
    },
    async loadTables() {
      const y = new Date(); const s = y.getMonth() >= 6 ? y.getFullYear() : y.getFullYear() - 1;
      const tasks = [
        this.json(`https://clubafricain.com/api/platform/v1/agenda/standings?sport=football&gender=masculin&league_id=202&season=${s}`).then((j) => {
          const rows = (j.data && j.data.rows) || [];
          this.tables.ca = { name: (j.data && j.data.competition_label) || "Ligue 1", rows: rows.map((r) => ({ rank: r.rank, name: r.team_name, logo: r.team_logo_url, pts: r.points, pj: r.played, diff: r.goal_diff, form: r.form, me: !!r.is_club })) };
        }),
        this.json("https://site.api.espn.com/apis/v2/sports/soccer/eng.1/standings").then((j) => {
          const ch = j.children && j.children[0]; if (!ch) return;
          const st = (e, n) => { const x = e.stats.find((s) => s.name === n); return x ? x.displayValue : ""; };
          const rows = ch.standings.entries.map((e) => ({ rank: Number(st(e, "rank")), name: e.team.shortDisplayName || e.team.displayName, logo: e.team.logos && e.team.logos[0] && e.team.logos[0].href, pts: st(e, "points"), pj: st(e, "gamesPlayed"), diff: st(e, "pointDifferential"), me: e.team.id === "360" }));
          rows.sort((a, b) => a.rank - b.rank);
          this.tables.mu = { name: "Premier League", rows };
        }),
      ];
      await Promise.allSettled(tasks);
    },
    async refreshLive() {
      const all = ["mu", "tun"].flatMap((k) => (this.data[k] ? this.data[k].list : [])).concat(this.caEspn ? this.caEspn.list : []);
      const now = Date.now();
      const hot = all.filter((m) => m.state === "in" || (m.state === "pre" && m.date - now < 10 * 60000 && now - m.date < 3 * 3600000));
      await Promise.allSettled(hot.map(async (m) => {
        if (!m.slug) return;
        const s = await this.json(`${ESPN}/${m.slug}/summary?event=${m.id}`);
        const c = s.header && s.header.competitions && s.header.competitions[0]; if (!c) return;
        const st = c.status || {}; const ty = st.type || {};
        const sc = (side) => { const x = c.competitors.find((k) => (k.team && k.team.displayName) && fr(k.team.displayName) === side.name); return x && x.score != null && x.score !== "" ? Number(x.score) : side.score; };
        m.us.score = sc(m.us); m.them.score = sc(m.them);
        m.state = ty.state || m.state; m.clock = st.displayClock || m.clock; m.detail = ty.shortDetail || m.detail;
        const goals = (s.keyEvents || []).filter((k) => k.scoringPlay).map((k) => ({ t: (k.clock && k.clock.displayValue) || "", team: fr(k.team && k.team.displayName), who: ((k.participants || [])[0] || {}).athlete ? k.participants[0].athlete.displayName : "", og: /own goal/i.test((k.type && k.type.text) || ""), pen: /penalty/i.test((k.type && k.type.text) || "") }));
        m.goals = goals; this.live[m.id] = { goals };
        if (m.state === "post" && m.us.score != null) m.res = m.us.score > m.them.score ? "W" : m.us.score < m.them.score ? "L" : "D";
      }));
    },
    detectGoals() {
      for (const k of ["ca", "mu", "tun"]) {
        const d = this.data[k]; if (!d) continue;
        d.list.filter((m) => m.state === "in").forEach((m) => {
          const prev = this.scores[m.id];
          if (prev != null && m.us.score != null && m.us.score > prev) this.goalFlash[k] = Date.now();
          if (m.us.score != null) this.scores[m.id] = m.us.score;
        });
      }
    },
    async refresh(force) {
      if (this.busy) return; this.busy = true;
      try {
        const anyLive = ["ca", "mu", "tun"].some((k) => this.data[k] && this.data[k].list.some((m) => m.state === "in" || (m.state === "pre" && m.date - Date.now() < 10 * 60000 && Date.now() - m.date < 3 * 3600000)));
        if (force || Date.now() - this.lastFull > 10 * 60000) {
          this.lastFull = Date.now();
          const r = await Promise.allSettled([this.loadEspn("mu"), this.loadEspn("tun"), this.loadEspn("ca"), this.loadTables()]);
          if (r[0].status === "fulfilled") { this.data.mu = r[0].value; delete this.err.mu; } else this.err.mu = String(r[0].reason);
          if (r[1].status === "fulfilled") { this.data.tun = r[1].value; delete this.err.tun; } else this.err.tun = String(r[1].reason);
          if (r[2].status === "fulfilled") this.caEspn = r[2].value;
          this.buildCA();
          await this.refreshLive(); this.buildCA();
        } else if (anyLive) { await this.refreshLive(); this.buildCA(); }
        this.detectGoals();
      } catch (e) { console.warn("maison-foot", e); }
      this.busy = false; this.emit();
    },
    view(key) {
      const d = this.data[key]; if (!d) return null;
      const now = Date.now();
      const live = d.list.filter((m) => m.state === "in");
      const past = d.list.filter((m) => m.state === "post").sort((a, b) => b.date - a.date);
      const next = d.list.filter((m) => (m.state === "pre" || m.state === "pst") && m.date > now - 3 * 3600000).sort((a, b) => a.date - b.date);
      return { logo: d.logo, live, past, next, flash: this.goalFlash[key] && now - this.goalFlash[key] < 25000 };
    },
  };
  window.maisonFootStore = store;

  // ---------- éléments communs ----------
  const crest = (url, size, cls = "") => url
    ? `<img class="cr ${cls}" src="${esc(url)}" style="width:${size}px;height:${size}px" loading="lazy" onerror="if(this.dataset.fb!=='1'&&this.src.indexOf('clubafricain.com/ca-crest')>-1){this.dataset.fb='1';this.src='${CA_CREST_FALLBACK}';}else{this.style.visibility='hidden';}">`
    : `<span class="cr ph ${cls}" style="width:${size}px;height:${size}px"></span>`;
  const resLbl = { W: "V", D: "N", L: "D" };
  const scoreTxt = (m) => {
    if (m.us.score == null || m.them.score == null) return "– : –";
    const [h, a] = m.home ? [m.us.score, m.them.score] : [m.them.score, m.us.score];
    return `${h} – ${a}`;
  };
  const homeAway = (m) => (m.home ? [m.us, m.them] : [m.them, m.us]);
  const liveLabel = (m) => {
    const d = (m.detail || "").toUpperCase();
    if (d === "HT" || m.clock === "MT") return "Mi-temps";
    if (/PEN|SHOOT/.test(d)) return "Tirs au but";
    if (/ET|AET|EXTRA/.test(d) && !/SET/.test(d)) return "Prolongation " + (m.clock || "");
    return m.clock ? (m.approx ? "≈ " : "") + m.clock : "En cours";
  };
  const goalsHtml = (m, max) => {
    const g = (m.goals || []).slice(-max);
    if (!g.length) return "";
    return `<div class="goals">${g.map((x) => `<span class="gl ${x.team === m.us.name ? "mine" : ""}"><b>${esc(x.t)}</b> ${esc(x.who || x.team)}${x.pen ? " (pén.)" : ""}${x.og ? " (c.s.c.)" : ""}</span>`).join("")}</div>`;
  };

  const BASE_CSS = `
    :host { display:block; }
    ha-card { display:block; border-radius:24px; color:#eef1ff; font-family:${FONT}; overflow:hidden; position:relative;
      border:1px solid rgba(255,255,255,.08); box-shadow:0 20px 40px -24px rgba(0,0,0,.7);
      background: radial-gradient(120% 120% at 100% 0%, rgba(34,197,94,.14), transparent 60%), linear-gradient(160deg,#171c3a,#0e1128); }
    .k { font-size:11.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; opacity:.6; }
    .cr { object-fit:contain; flex:none; filter: drop-shadow(0 4px 10px rgba(0,0,0,.45)); }
    .cr.ph { display:inline-block; border-radius:50%; background:rgba(255,255,255,.1); }
    .pill { display:inline-flex; align-items:center; gap:6px; font-size:11.5px; font-weight:700; padding:3px 9px; border-radius:999px; white-space:nowrap; }
    .W { background:rgba(34,197,94,.18); color:#4ade80; } .D { background:rgba(148,163,184,.18); color:#cbd5e1; } .L { background:rgba(239,68,68,.18); color:#f87171; }
    .rb { display:inline-grid; place-items:center; width:22px; height:22px; border-radius:7px; font-size:11px; font-weight:800; }
    .rb.W { background:#16a34a; color:#fff; } .rb.D { background:#64748b; color:#fff; } .rb.L { background:#dc2626; color:#fff; }
    .livedot { width:8px; height:8px; border-radius:50%; background:#ef4444; box-shadow:0 0 0 0 rgba(239,68,68,.7); animation:ping 1.6s infinite; flex:none; }
    @keyframes ping { 0% { box-shadow:0 0 0 0 rgba(239,68,68,.7) } 70% { box-shadow:0 0 0 9px rgba(239,68,68,0) } 100% { box-shadow:0 0 0 0 rgba(239,68,68,0) } }
    .live { position:relative; border-radius:20px; padding:14px 16px; background:linear-gradient(135deg, rgba(239,68,68,.22), rgba(127,29,29,.25));
      border:1px solid rgba(248,113,113,.45); box-shadow:0 0 30px -8px rgba(239,68,68,.6) inset; }
    .live .top { display:flex; align-items:center; gap:8px; font-size:11.5px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:#fecaca; }
    .live .top .comp { margin-left:auto; font-weight:600; letter-spacing:.02em; text-transform:none; opacity:.8; color:#eef1ff; }
    .board { display:grid; grid-template-columns: 1fr auto 1fr; align-items:center; gap:10px; margin-top:10px; }
    .side { display:flex; align-items:center; gap:10px; min-width:0; font-weight:700; font-size:15px; }
    .side.r { justify-content:flex-end; text-align:right; }
    .side span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .score { font-size:34px; font-weight:800; letter-spacing:-.02em; font-variant-numeric:tabular-nums; padding:0 6px; }
    .goals { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
    .gl { font-size:11.5px; padding:3px 8px; border-radius:999px; background:rgba(255,255,255,.07); opacity:.85; }
    .gl.mine { background:rgba(74,222,128,.16); color:#bbf7d0; opacity:1; }
    .gl b { font-weight:700; margin-right:2px; }
    .flash { position:absolute; inset:0; display:grid; place-items:center; font-size:46px; font-weight:900; letter-spacing:.06em; color:#fff;
      background:radial-gradient(circle, rgba(34,197,94,.55), rgba(22,163,74,.15) 70%); animation:flash 1.2s ease-in-out infinite; pointer-events:none; border-radius:20px; }
    @keyframes flash { 0%,100% { opacity:.25 } 50% { opacity:1 } }
    .muted { opacity:.55; font-size:12px; }
  `;

  // ======================= carte accueil =======================
  class MaisonFootCard extends HTMLElement {
    setConfig(c) { this._config = Object.assign({ teams: ["tun", "ca", "mu"], navigation_path: "/tableau-mural/foot" }, c || {}); if (!this.shadowRoot) this.attachShadow({ mode: "open" }); }
    set hass(h) { store.setHass(h); if (!this._unsub) { this._unsub = store.subscribe(() => this._render()); } this._render(); }
    connectedCallback() { this._tick = setInterval(() => this._render(), 30000); if (this._config && !this._unsub && store.hass) this._unsub = store.subscribe(() => this._render()); }
    disconnectedCallback() { clearInterval(this._tick); if (this._unsub) { this._unsub(); this._unsub = null; } }
    getCardSize() { return 4; }
    getGridOptions() { return { columns: "full", rows: "auto" }; }
    _render() {
      if (!this.shadowRoot) return;
      const teams = this._config.teams.map((k) => ({ T: TEAMS[k], v: store.view(k) }));
      const lives = teams.flatMap(({ T, v }) => (v ? v.live.map((m) => ({ T, m, flash: v.flash })) : []));
      const row = ({ T, v }) => {
        if (!v) return `<div class="row"><span class="cr ph" style="width:38px;height:38px"></span><div class="nm"><b>${T.name}</b><span class="muted">${store.err[T.key] ? "Source indisponible" : "Chargement…"}</span></div></div>`;
        const last = v.past[0], nx = v.next[0], lv = v.live[0];
        const lastH = last ? `<div class="last"><span class="pill ${last.res || "D"}">${resLbl[last.res] || "–"} ${last.us.score}–${last.them.score}</span>${crest(last.them.logo, 22)}<span class="muted ell">${esc(last.them.name)}</span></div>` : `<div class="last muted">Aucun résultat</div>`;
        const nextH = lv ? `<div class="nx livepill"><span class="livedot"></span> En direct · ${esc(liveLabel(lv))}</div>`
          : nx ? `<div class="nx"><div class="when">${nx.state === "pst" ? "Reporté" : esc(when(nx.date))}</div><div class="vs">${nx.home ? "vs" : "@"} ${crest(nx.them.logo, 20)} <span class="ell">${esc(nx.them.name)}</span></div><div class="cp">${esc(nx.comp)}</div></div>`
          : `<div class="nx muted">Prochain match non annoncé</div>`;
        return `<div class="row" style="--c1:${T.c1}">${crest(v.logo, 38)}<div class="nm"><b>${T.name}</b>${lastH}</div>${nextH}</div>`;
      };
      const liveH = lives.map(({ T, m, flash }) => {
        const [h, a] = homeAway(m);
        return `<div class="live" style="--c1:${T.c1}"><div class="top"><span class="livedot"></span>En direct · ${esc(liveLabel(m))}<span class="comp">${esc(m.comp)}</span></div>
          <div class="board"><div class="side">${crest(h.logo, 34)}<span>${esc(h.name)}</span></div><div class="score">${scoreTxt(m)}</div><div class="side r"><span>${esc(a.name)}</span>${crest(a.logo, 34)}</div></div>
          ${goalsHtml(m, 4)}${flash ? `<div class="flash">BUT !</div>` : ""}</div>`;
      }).join("");
      const html = `<style>${BASE_CSS}
          ha-card { padding:16px 18px; cursor:pointer; }
          .lives { display:grid; gap:10px; margin-bottom:12px; }
          .rows { display:grid; gap:8px; }
          .row { display:grid; grid-template-columns: 38px minmax(0,1fr) minmax(0,1.05fr); align-items:center; gap:12px; padding:10px 12px; border-radius:16px;
            background:linear-gradient(90deg, color-mix(in srgb, var(--c1) 16%, transparent), rgba(255,255,255,.03) 45%); border-left:3px solid var(--c1); }
          .nm { display:flex; flex-direction:column; gap:5px; min-width:0; }
          .nm b { font-size:14.5px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
          .last { display:flex; align-items:center; gap:7px; min-width:0; }
          .ell { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; }
          .nx { display:flex; flex-direction:column; align-items:flex-end; gap:2px; text-align:right; min-width:0; }
          .nx .when { font-size:13px; font-weight:700; }
          .nx .vs { display:flex; align-items:center; gap:6px; font-size:12px; opacity:.85; max-width:100%; justify-content:flex-end; }
          .nx .cp { font-size:11px; opacity:.5; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
          .livepill { flex-direction:row; align-items:center; gap:8px; font-size:12.5px; font-weight:700; color:#fecaca; }
        </style>
        <ha-card>${liveH ? `<div class="lives">${liveH}</div>` : ""}<div class="rows">${teams.map(row).join("")}</div></ha-card>`;
      if (html === this._last) return;
      this._last = html; this.shadowRoot.innerHTML = html;
      this.shadowRoot.querySelector("ha-card").addEventListener("click", () => {
        history.pushState(null, "", this._config.navigation_path); window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
      });
    }
  }

  // ======================= fiche équipe =======================
  class MaisonFootTeamCard extends HTMLElement {
    setConfig(c) { if (!c.team || !TEAMS[c.team]) throw new Error("team: ca | mu | tun"); this._config = Object.assign({ results: 6, upcoming: 4 }, c); if (!this.shadowRoot) this.attachShadow({ mode: "open" }); }
    set hass(h) { store.setHass(h); if (!this._unsub) this._unsub = store.subscribe(() => this._render()); this._render(); }
    connectedCallback() { this._tick = setInterval(() => this._render(), 30000); if (this._config && !this._unsub && store.hass) this._unsub = store.subscribe(() => this._render()); }
    disconnectedCallback() { clearInterval(this._tick); if (this._unsub) { this._unsub(); this._unsub = null; } }
    getCardSize() { return 10; }
    getGridOptions() { return { columns: "full", rows: "auto" }; }
    _render() {
      if (!this.shadowRoot) return;
      const T = TEAMS[this._config.team], v = store.view(T.key), tb = store.tables[T.key];
      let body;
      if (!v) body = `<div class="empty">${store.err[T.key] ? "Source de données indisponible pour le moment." : "Chargement…"}</div>`;
      else {
        const formSrc = T.key === "ca" && tb && tb.rows.find((r) => r.me) && tb.rows.find((r) => r.me).form;
        const form = v.past.slice(0, 5).map((m) => m.res).reverse();
        const formH = form.length ? form.map((r) => `<span class="rb ${r}">${resLbl[r]}</span>`).join("") : "";
        const lv = v.live[0], nx = v.next[0];
        let feature;
        if (lv) {
          const [h, a] = homeAway(lv);
          feature = `<div class="live big"><div class="top"><span class="livedot"></span>En direct · ${esc(liveLabel(lv))}<span class="comp">${esc(lv.comp)}</span></div>
            <div class="board"><div class="side col">${crest(h.logo, 64)}<span>${esc(h.name)}</span></div><div class="score xl">${scoreTxt(lv)}</div><div class="side col">${crest(a.logo, 64)}<span>${esc(a.name)}</span></div></div>
            ${goalsHtml(lv, 10)}${v.flash ? `<div class="flash">BUT !</div>` : ""}</div>`;
        } else if (nx) {
          const [h, a] = homeAway(nx);
          feature = `<div class="next"><div class="k">Prochain match</div>
            <div class="board"><div class="side col">${crest(h.logo, 58)}<span>${esc(h.name)}</span></div>
              <div class="mid"><div class="cd">${nx.state === "pst" ? "Reporté" : esc(countdown(nx.date))}</div><div class="dt">${esc(when(nx.date))}</div></div>
              <div class="side col">${crest(a.logo, 58)}<span>${esc(a.name)}</span></div></div>
            <div class="meta">${esc(nx.comp)}${nx.stage ? " · " + esc(nx.stage) : ""}${nx.venue ? " · " + esc(nx.venue) : ""}</div></div>`;
        } else feature = `<div class="next"><div class="k">Prochain match</div><div class="empty">Pas encore annoncé</div></div>`;
        const line = (m, kind) => {
          const right = kind === "res"
            ? `<span class="sc ${m.res}">${m.us.score}–${m.them.score}${m.us.so != null ? ` <small>(${m.us.so}–${m.them.so} tab)</small>` : ""}</span>`
            : `<span class="tm">${m.state === "pst" ? "Reporté" : hm(m.date)}</span>`;
          return `<div class="ln"><div class="dc"><b>${esc(dayLabel(m.date))}</b><span>${esc(m.comp)}</span></div>
            <div class="op">${m.home ? '<span class="ha">DOM</span>' : '<span class="ha ext">EXT</span>'}${crest(m.them.logo, 22)}<span class="ell">${esc(m.them.name)}</span></div>${right}</div>`;
        };
        const ups = v.next.slice(lv ? 0 : 1, (lv ? 0 : 1) + this._config.upcoming);
        const res = v.past.slice(0, this._config.results);
        let table = "";
        if (tb && tb.rows.length) {
          const i = tb.rows.findIndex((r) => r.me);
          let rows = tb.rows.slice(0, 3);
          if (i >= 0) { const win = tb.rows.slice(Math.max(0, i - 2), i + 3); rows = i <= 4 ? tb.rows.slice(0, 6) : [...rows, null, ...win]; }
          table = `<div class="blk"><div class="k">Classement · ${esc(tb.name)}</div><div class="tbl">
            <div class="tr th"><span>#</span><span>Équipe</span><span>J</span><span>Diff</span><span>Pts</span></div>
            ${rows.map((r) => r ? `<div class="tr ${r.me ? "me" : ""}"><span>${r.rank}</span><span class="tn">${crest(r.logo, 18)}<span class="ell">${esc(r.name)}</span></span><span>${r.pj}</span><span>${Number(r.diff) > 0 ? "+" : ""}${r.diff}</span><span><b>${r.pts}</b></span></div>` : `<div class="tr gap"><span>⋯</span></div>`).join("")}
          </div></div>`;
        }
        body = `
          <div class="hero">${crest(v.logo, 72)}<div class="ht"><div class="tn1">${T.name}</div><div class="sub">${T.sub}</div>
            <div class="form">${formH}${formSrc && !formH ? formSrc.split("").map((c) => `<span class="rb ${c === "W" ? "W" : c === "L" ? "L" : "D"}">${resLbl[c === "W" ? "W" : c === "L" ? "L" : "D"]}</span>`).join("") : ""}</div></div></div>
          ${feature}
          ${ups.length ? `<div class="blk"><div class="k">À venir</div>${ups.map((m) => line(m, "up")).join("")}</div>` : ""}
          <div class="blk"><div class="k">Derniers résultats</div>${res.length ? res.map((m) => line(m, "res")).join("") : `<div class="empty">Aucun résultat récent</div>`}</div>
          ${table}
          <div class="src">${T.key === "ca" ? "Source : site officiel du Club Africain · direct CAF : ESPN" : "Source : ESPN"}</div>`;
      }
      const html = `<style>${BASE_CSS}
          ha-card { padding:0; background: linear-gradient(180deg, color-mix(in srgb, ${T.c1} 30%, #171c3a) 0%, #151a36 210px, #0e1128 100%); }
          .hero { position:relative; display:flex; align-items:center; gap:16px; padding:22px 20px 18px; overflow:hidden; }
          .hero::after { content:""; position:absolute; right:-40px; top:-60px; width:220px; height:220px; border-radius:50%;
            background: radial-gradient(circle, ${T.glow}, transparent 65%); pointer-events:none; }
          .hero::before { content:""; position:absolute; inset:0; background: repeating-linear-gradient(120deg, rgba(255,255,255,.035) 0 18px, transparent 18px 36px); pointer-events:none; }
          .ht { position:relative; z-index:1; min-width:0; }
          .tn1 { font-size:24px; font-weight:800; letter-spacing:-.02em; line-height:1.1; }
          .sub { font-size:12.5px; opacity:.65; margin-top:2px; }
          .form { display:flex; gap:4px; margin-top:10px; }
          .hero .cr { position:relative; z-index:1; }
          .next, .live.big { margin:0 14px 6px; }
          .next { border-radius:20px; padding:14px 16px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); }
          .side.col { flex-direction:column; justify-content:center; text-align:center; gap:8px; font-size:13.5px; }
          .side.col span { white-space:normal; line-height:1.2; }
          .mid { text-align:center; }
          .cd { font-size:18px; font-weight:800; letter-spacing:-.01em; }
          .dt { font-size:12px; opacity:.6; margin-top:3px; }
          .meta { text-align:center; font-size:11.5px; opacity:.55; margin-top:10px; }
          .score.xl { font-size:44px; }
          .blk { padding:14px 16px 4px; }
          .blk .k { margin-bottom:8px; }
          .ln { display:grid; grid-template-columns: 92px minmax(0,1fr) auto; align-items:center; gap:10px; padding:8px 10px; border-radius:12px; background:rgba(255,255,255,.035); margin-bottom:6px; }
          .ln .dc { display:flex; flex-direction:column; min-width:0; }
          .ln .dc b { font-size:12.5px; font-weight:700; text-transform:capitalize; }
          .ln .dc span { font-size:10.5px; opacity:.5; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
          .op { display:flex; align-items:center; gap:8px; min-width:0; font-size:13px; font-weight:600; }
          .ell { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; }
          .ha { font-size:9.5px; font-weight:800; letter-spacing:.06em; padding:2px 5px; border-radius:5px; background:rgba(255,255,255,.1); opacity:.8; flex:none; }
          .ha.ext { background:rgba(109,124,255,.2); }
          .sc { font-size:14px; font-weight:800; font-variant-numeric:tabular-nums; padding:3px 9px; border-radius:9px; }
          .sc.W { background:rgba(34,197,94,.18); color:#4ade80; } .sc.D { background:rgba(148,163,184,.16); color:#cbd5e1; } .sc.L { background:rgba(239,68,68,.18); color:#f87171; }
          .sc small { font-size:10px; font-weight:600; opacity:.8; }
          .tm { font-size:13px; font-weight:700; font-variant-numeric:tabular-nums; opacity:.85; }
          .tbl { border-radius:14px; overflow:hidden; background:rgba(255,255,255,.03); }
          .tr { display:grid; grid-template-columns: 26px minmax(0,1fr) 28px 40px 36px; gap:6px; align-items:center; padding:6px 10px; font-size:12.5px; font-variant-numeric:tabular-nums; }
          .tr > span:not(.tn) { text-align:center; }
          .tr.th { font-size:10.5px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; opacity:.5; }
          .tr.me { background:linear-gradient(90deg, color-mix(in srgb, ${T.c1} 35%, transparent), transparent); font-weight:700; }
          .tr.gap { padding:0 10px; opacity:.35; }
          .tn { display:flex; align-items:center; gap:7px; min-width:0; }
          .empty { opacity:.55; font-size:13px; padding:10px 0; text-align:center; }
          .src { font-size:10.5px; opacity:.35; text-align:right; padding:8px 16px 14px; }
        </style><ha-card>${body}</ha-card>`;
      if (html === this._last) return;
      this._last = html; this.shadowRoot.innerHTML = html;
    }
  }

  if (!customElements.get("maison-foot-card")) (customElements.get("maison-foot-card") || customElements.define("maison-foot-card", MaisonFootCard));
  if (!customElements.get("maison-foot-team-card")) (customElements.get("maison-foot-team-card") || customElements.define("maison-foot-team-card", MaisonFootTeamCard));
  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c.type === "maison-foot-card"))
    window.customCards.push(
      { type: "maison-foot-card", name: "Maison – Foot (accueil)", description: "Derniers résultats, prochains matchs et direct" },
      { type: "maison-foot-team-card", name: "Maison – Foot (équipe)", description: "Fiche détaillée d'une équipe" });
})();
}

console.info("%c MAISON-HOME-ASSISTANT %c v1.1.0 ", "background:#6d7cff;color:#fff;border-radius:4px 0 0 4px;padding:2px 6px", "background:#1b1f45;color:#fff;border-radius:0 4px 4px 0;padding:2px 6px");
