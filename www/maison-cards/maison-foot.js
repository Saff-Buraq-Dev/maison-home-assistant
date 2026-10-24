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

  if (!customElements.get("maison-foot-card")) customElements.define("maison-foot-card", MaisonFootCard);
  if (!customElements.get("maison-foot-team-card")) customElements.define("maison-foot-team-card", MaisonFootTeamCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((c) => c.type === "maison-foot-card"))
    window.customCards.push(
      { type: "maison-foot-card", name: "Maison – Foot (accueil)", description: "Derniers résultats, prochains matchs et direct" },
      { type: "maison-foot-team-card", name: "Maison – Foot (équipe)", description: "Fiche détaillée d'une équipe" });
})();
