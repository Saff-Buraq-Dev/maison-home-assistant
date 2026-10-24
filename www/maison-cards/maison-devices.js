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
  if (!customElements.get("maison-devices-card")) customElements.define("maison-devices-card", MaisonDevicesCard);
  window.customCards = window.customCards || [];
  if (window.customCards.some((c) => c.type === "maison-devices-card")) return;
  window.customCards.push({ type: "maison-devices-card", name: "Maison – Équipements", description: "Liste compacte d'équipements avec interrupteurs" });
})();
