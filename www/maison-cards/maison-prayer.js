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
  if (!customElements.get("maison-prayer-card")) customElements.define("maison-prayer-card", MaisonPrayerCard);
  window.maisonPrayTimes = prayTimes;
  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c.type === "maison-prayer-card"))
    window.customCards.push({ type: "maison-prayer-card", name: "Maison – Prières", description: "Horaires des prières et compte à rebours" });
})();
