/* Djob · logique de l'application. Données : data.json, sorties.json, config.json. */
const SITE = "https://djondozy.github.io/offres-emploi/";
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const okUrl = u => typeof u === "string" && /^https?:\/\//.test(u);
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch { return d } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch { } } };

/* ---------- Icônes ---------- */
const I = (id, cls = "h-4 w-4", sw = 1.75) => `<svg class="${cls} flex-none fill-none stroke-current" stroke-width="${sw}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const IWA = (cls = "h-[18px] w-[18px]") => `<svg class="${cls} flex-none" aria-hidden="true"><use href="#i-wa"/></svg>`;
const SVGP = p => `<svg class="h-5 w-5 fill-none stroke-current" stroke-width="1.6" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const CATS = {
  "Manger": SVGP('<path d="M7 3v8a2 2 0 0 0 2 2v8M11 3v8M7 7h4M17 3c-2 2-2 6 0 8v10"/>'),
  "Plage & détente": SVGP('<path d="M2 17c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2M2 21c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2"/><circle cx="12" cy="8" r="3"/>'),
  "Culture": SVGP('<path d="M3 21h18M5 21V10M10 21V10M14 21V10M19 21V10M2 10l10-6 10 6z"/>'),
  "Sorties & spectacles": SVGP('<path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z"/><path d="M10 7v12"/>'),
  "Escapade": SVGP('<path d="M3 17h18M5 17V9l4-4h6l4 4v8"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>'),
  "Nature": SVGP('<path d="M11 20A7 7 0 0 1 4 13c0-6 7-9 16-9 0 9-3 16-9 16zM4 20c4-4 7-6 11-8"/>'),
};

/* ---------- Référentiels ---------- */
const ZONES = { cotonou: "Cotonou et environs", benin: "Ailleurs au Bénin", region: "Sous-région", distance: "À distance" };
const NIVEAUX = [["sans", "Sans diplôme"], ["bepc", "BEPC"], ["bac", "BAC"], ["lic", "BAC+2 / Licence"], ["master", "BAC+5 / Master"]];
const CONTRATS = [["cdi", "CDI"], ["cdd", "CDD"], ["stage", "Stage"], ["volont", "Volontariat"], ["autre", "Autre"]];
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const PALETTE = [["#EFF6F1", "#0B5533"], ["#FDF6E3", "#7A5200"], ["#FEF3F2", "#9F1F16"], ["#F4F3EF", "#3A3A37"], ["#EEF4F8", "#1F4F66"]];
const SUGG = ["Comptable", "Chauffeur", "Commercial", "Stage", "Parakou", "ONG", "Santé"];
const ZL = { debut: "Débutants", bientot: "Ferme bientôt", nouveau: "Nouvelles", stage: "Stages", horscot: "Hors de Cotonou", ...ZONES };
const STATUTS = [["envoyee", "Dossier envoyé"], ["relance", "Relancé"], ["entretien", "Entretien prévu"], ["retenu", "Retenu(e) !"], ["non", "Pas retenu(e)"]];

/* ---------- État ---------- */
let all = [], maj = null, lieux = [], events = [], CFG = { whatsapp: "", email: "", formulaires: {}, services: [] };
let view = "accueil", seg = "gardees", panelOpen = false, shown = 25, weekIds = [], sinceIds = [];
const F = { q: "", zone: "tout", niv: new Set(), sect: new Set(), contrat: "", ville: "", tri: "recent" };
const SF = { cat: "Tout", cheap: false, zone: "" };
let saved = store.get("djob-saved", []), checks = store.get("djob-checks", {}), apps = store.get("djob-apps", {}), alerts = store.get("djob-alerts", []);
const lastVisit = store.get("djob-last", null);

/* ---------- Dates et textes ---------- */
const today = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t };
const D = s => { const d = new Date(s + "T12:00:00"); d.setHours(0, 0, 0, 0); return d };
const daysLeft = o => o.dateLimite ? Math.round((D(o.dateLimite) - today()) / 864e5) : null;
const isOpen = o => { const n = daysLeft(o); return n === null || n >= 0 };
const addedTs = o => o.ajoute ? new Date(o.ajoute).getTime() : 0;
const isToday = o => o.ajoute && Date.now() - addedTs(o) < 26 * 36e5;
const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const hay = o => o._h || (o._h = norm([o.titre, o.employeur, o.ville, o.secteur, o.contrat, o.niveau, o.resume, ...(o.postes || []).map(p => p.nom), ...(o.profil || [])].join(" ")));
const left = n => n === 0 ? "Dernier jour" : n === 1 ? "Ferme demain" : `Plus que ${n} jours`;
const shortDate = s => { const d = D(s); return `${d.getDate()} ${MOIS[d.getMonth()]}` };
const longDate = s => { const d = D(s); return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()].replace(".", "")}` };
const ago = o => { const t = addedTs(o); if (!t) return ""; const m = (Date.now() - t) / 6e4; if (m < 60) return "à l'instant"; const h = m / 60; if (h < 24) return `il y a ${Math.round(h)} h`; const d = Math.round(h / 24); return d === 1 ? "hier" : `il y a ${d} jours` };
const dayKey = o => { const t = addedTs(o); if (!t) return "Plus tôt"; const d = new Date(t); d.setHours(0, 0, 0, 0); const n = Math.round((today() - d) / 864e5); return n <= 0 ? "Aujourd'hui" : n === 1 ? "Hier" : n < 7 ? "Cette semaine" : "Plus tôt" };
const initials = s => { const w = String(s).replace(/\(.*?\)/g, "").replace(/[^\p{L}\p{N}\s'-]/gu, " ").split(/\s+/).filter(x => x && !/^(de|du|des|la|le|les|l'|d'|et|pour|via|au|aux|sa|sarl|s\.a\.|inc|avec)$/i.test(x)); return ((w[0] || "?")[0] + ((w[1] || "")[0] || "")).toUpperCase() };
const hashN = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h };
const pl = (n, w) => `${n} ${w}${n > 1 ? "s" : ""}`;
const avatar = (o, size = "h-11 w-11 text-[13px]") => { const [b, f] = PALETTE[hashN(o.employeur) % PALETTE.length]; return `<div class="${size} grid flex-none place-items-center rounded-xl font-semibold tracking-[-0.02em]" style="background:${b};color:${f}" aria-hidden="true">${esc(initials(o.employeur))}</div>` };
function levels(o) {
  const n = norm(o.niveau), s = new Set();
  if (/sans diplome|aucun diplome|certificat|cap\b/.test(n)) s.add("sans"); if (/bepc/.test(n)) s.add("bepc");
  if (/\bbac\b/.test(n.replace(/bac\s*\+\s*\d/g, ""))) s.add("bac"); if (/bac\s*\+\s*[234]|licence/.test(n)) s.add("lic");
  if (/bac\s*\+\s*5|master|ingenieur/.test(n)) s.add("master"); if (/du bepc a la licence/.test(n)) { s.add("bepc"); s.add("bac"); s.add("lic") }
  if (/diplome/.test(n) && !s.size) s.add("lic"); return s
}
const contratKey = o => { const c = norm(o.contrat); return /cdi/.test(c) ? "cdi" : /cdd/.test(c) ? "cdd" : /stage/.test(c) ? "stage" : /volont/.test(c) ? "volont" : "autre" };
const cityOf = o => { const v = String(o.ville || "").split(/[,(]| et | ou /)[0].trim(); return o.zone === "distance" ? "À distance" : v.replace(/^Glo-Djigbé.*/, "Glo-Djigbé") };
const waNum = n => { const d = String(n || "").replace(/\D/g, ""); return d ? (d.startsWith("229") ? d : "229" + d) : "" };

/* ---------- Gabarits partagés ---------- */
const empty = (title, text, action = "") => `<div class="rounded-2xl px-6 py-16 text-center ring-1 ring-inset ring-line sm:py-20"><h3 class="text-lg font-semibold tracking-[-0.02em]">${title}</h3><p class="mx-auto mt-2 max-w-[46ch] leading-relaxed text-ink-muted">${text}</p>${action}</div>`;
const note = (icon, tone, title, text) => { const t = { brand: ["bg-brand-50", "stroke-brand-600"], amber: ["bg-signal-amberbg", "stroke-signal-amber"], plain: ["bg-paper-warm ring-1 ring-line", "stroke-ink-muted"] }[tone]; return `<aside class="note ${t[0]} text-ink-soft"><svg class="mt-0.5 h-5 w-5 flex-none fill-none ${t[1]}" stroke-width="1.75" aria-hidden="true"><use href="#i-${icon}"/></svg><p><b>${title}</b>${text}</p></aside>` };
const keepBtn = (id, k) => `<button type="button" class="icon-btn ${k ? "text-ink" : ""}" data-keep="${esc(id)}" aria-pressed="${k}" aria-label="${k ? "Retirer de mon carnet" : "Garder cette offre"}"><svg class="h-5 w-5 ${k ? "fill-ink stroke-ink" : "fill-none stroke-current"}" stroke-width="1.75" aria-hidden="true"><use href="#i-heart"/></svg></button>`;

function row(o) {
  const n = daysLeft(o), k = saved.includes(o.id), a = apps[o.id], wk = weekIds.includes(o.id), pv = o.id === "preview";
  const dl = n === null ? `<span class="inline-flex items-center gap-1.5">${I("clock")}Sans date limite</span>`
    : n <= 3 ? `<span class="inline-flex items-center gap-1.5 font-medium text-signal-red">${I("clock")}${left(n)}</span>`
      : `<span class="inline-flex items-center gap-1.5">${I("clock")}Jusqu'au ${shortDate(o.dateLimite)}</span>`;
  const tags = [wk && `<span class="tag-amber">Offre de la semaine</span>`, a && `<span class="tag-ink">Postulé</span>`, o.debutant && `<span class="tag-brand">Débutants bienvenus</span>`, o.publieSurDjob && `<span class="tag-neutral">Publiée sur Djob</span>`].filter(Boolean).join("");
  return `<article class="group relative flex gap-4 px-4 py-5 transition-colors duration-150 sm:gap-5 sm:px-6 sm:py-6 ${pv ? "" : "cursor-pointer hover:bg-paper-warm"}" ${pv ? "" : `data-id="${esc(o.id)}" tabindex="0" role="button" aria-label="${esc(o.titre)}, ${esc(o.employeur)}"`}>
    ${avatar(o)}
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-1.5 text-[13px] text-ink-muted"><span class="truncate">${esc(o.employeur)}</span>${pv ? "" : `<span aria-hidden="true">·</span><span class="whitespace-nowrap">${ago(o)}</span>`}</div>
      <h3 class="mt-1 line-clamp-2 text-[16.5px] font-semibold leading-snug tracking-[-0.018em]">${esc(o.titre)}</h3>
      <div class="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-ink-muted"><span class="inline-flex items-center gap-1.5">${I("pin")}${esc(o.ville)}</span><span class="inline-flex items-center gap-1.5">${I("bag")}${esc(o.contrat)}</span>${o.nbPostes > 1 ? `<span class="inline-flex items-center gap-1.5">${I("users")}${o.nbPostes} postes</span>` : ""}${dl}</div>
      ${tags ? `<div class="mt-3 flex flex-wrap gap-1.5">${tags}</div>` : ""}
    </div>
    ${pv ? "" : `<div class="-mr-2 -mt-2 flex-none">${keepBtn(o.id, k)}</div>`}
  </article>`;
}
const listBox = rows => `<div class="divide-y divide-line overflow-hidden rounded-2xl bg-white ring-1 ring-line">${rows.map(row).join("")}</div>`;

/* ---------- Accueil ---------- */
function greet() {
  const h = new Date().getHours(), d = new Date().getDay();
  const g = h < 12 ? (d === 1 ? "Bonjour, et bonne semaine" : "Bonjour") : h < 18 ? "Bon après-midi" : "Bonsoir";
  let up = "";
  if (maj) { const m = new Date(maj); if (!isNaN(m)) up = m.toDateString() === new Date().toDateString() ? ` · Liste mise à jour ce matin à ${m.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : ` · Mise à jour le ${m.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}` }
  $("#hello").innerHTML = `<span class="h-1.5 w-1.5 rounded-full bg-brand-500"></span>${g}${up}`;
}
const TIPS_ACC = [["debut", "Débutants bienvenus", o => o.debutant, "sans expérience exigée"], ["bientot", "Ça ferme bientôt", o => { const n = daysLeft(o); return n !== null && n <= 3 }, "à saisir dans les 3 jours"], ["stage", "Stages et volontariats", o => ["stage", "volont"].includes(contratKey(o)), "pour mettre un pied dedans"], ["horscot", "Hors de Cotonou", o => o.zone !== "cotonou", "ailleurs au Bénin et autour"]];
function renderHome() {
  greet();
  const postes = all.reduce((s, o) => s + (o.nbPostes || 1), 0), t = all.filter(isToday).length, v = new Set(all.map(cityOf)).size;
  $("#numbers").innerHTML = [[all.length, "offres ouvertes"], [postes, "postes à pourvoir"], [t, "ajoutées aujourd'hui"], [v, "villes"]].map(([n, l], i) =>
    `<div class="flex flex-col-reverse py-7 sm:py-9 ${i % 2 ? "pl-5 border-l border-line" : ""} ${i > 1 ? "border-t border-line sm:border-t-0" : ""} ${i === 2 ? "sm:pl-6 sm:border-l" : ""} ${i ? "sm:pl-6" : ""}"><dt class="mt-1.5 text-sm text-ink-muted">${l}</dt><dd class="num text-3xl font-semibold tracking-[-0.045em] sm:text-[40px] sm:leading-none">${n}</dd></div>`).join("");
  const src = {}; all.forEach(o => { const n = o.source?.nom; if (n) src[n] = (src[n] || 0) + 1 });
  const names = Object.keys(src).sort((a, b) => src[b] - src[a]).slice(0, 8);
  $("#readfor").innerHTML = names.length ? `Sources lues ce matin : <span class="text-ink-soft">${names.map(esc).join(", ")}</span> et d'autres.` : "";
  $("#popular").innerHTML = `<span class="mr-1">Recherches fréquentes</span>` + SUGG.map(s => `<button type="button" class="min-h-[40px] rounded-full px-2.5 font-medium text-ink-soft transition-colors hover:bg-paper-sunk hover:text-ink" data-sugg="${esc(s)}">${esc(s)}</button>`).join("");
  const fresh = [...all].sort((a, b) => addedTs(b) - addedTs(a)).slice(0, 5);
  $("#homeJobs").innerHTML = fresh.length ? listBox(fresh) : empty("Les annonces arrivent", "La liste se remplit chaque matin.");
  $("#tiles").innerHTML = TIPS_ACC.map(([k, t, f, s]) => `<button type="button" class="card-hover group flex items-center justify-between gap-4 p-5 text-left" data-goto="${k}"><span><span class="block font-semibold tracking-[-0.015em]">${t}</span><span class="mt-0.5 block text-sm text-ink-muted"><span class="num">${all.filter(f).length}</span> ${s}</span></span><span class="text-ink-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink">${I("arrow", "h-5 w-5")}</span></button>`).join("");
  $("#homeServices").innerHTML = (CFG.services || []).slice(0, 3).map(svcCard).join("");
  $("#recruitMock").innerHTML = row({ id: "preview", titre: "Le poste que vous proposez", employeur: "Votre entreprise", ville: "Cotonou", contrat: "CDI", nbPostes: 2, dateLimite: null, debutant: true, publieSurDjob: true });
  $("#homeSortir").innerHTML = lieux.filter(l => ["chez-tranquille", "plage-fidjrosse", "ganvie", "grand-popo"].includes(l.id)).map(l => `<button type="button" class="group flex min-h-[64px] w-full items-center justify-between gap-4 py-4 text-left" data-place="${esc(l.id)}"><span><span class="block font-medium">${esc(l.nom)}</span><span class="block text-sm text-ink-muted">${esc(l.ville)} · ${esc(l.prix)}</span></span><span class="text-ink-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink">${I("arrow", "h-5 w-5")}</span></button>`).join("");
  $("#faqHome").innerHTML = faqHTML(FAQ.slice(0, 5));
}

/* ---------- Offres : filtres ---------- */
const activeCount = () => F.niv.size + F.sect.size + (Object.keys(ZONES).includes(F.zone) ? 1 : 0);
const zoneMatch = (o, z) => z === "tout" || (z === "debut" ? o.debutant : z === "bientot" ? (daysLeft(o) !== null && daysLeft(o) <= 3) : z === "nouveau" ? (isToday(o) || sinceIds.includes(o.id)) : z === "horscot" ? o.zone !== "cotonou" : z === "stage" ? ["stage", "volont"].includes(contratKey(o)) : o.zone === z);
function match(o, f = F) { const q = norm(f.q.trim()); return zoneMatch(o, f.zone) && (!f.niv.size || [...levels(o)].some(l => f.niv.has(l))) && (!f.sect.size || f.sect.has(o.secteur)) && (!f.contrat || contratKey(o) === f.contrat) && (!f.ville || cityOf(o) === f.ville) && (!q || q.split(/\s+/).every(w => hay(o).includes(w))) }
function sorted(rows) { const by = { urgence: (a, b) => (daysLeft(a) ?? 999) - (daysLeft(b) ?? 999) || addedTs(b) - addedTs(a), recent: (a, b) => addedTs(b) - addedTs(a) || (daysLeft(a) ?? 999) - (daysLeft(b) ?? 999), postes: (a, b) => (b.nbPostes || 1) - (a.nbPostes || 1) }; return rows.sort(by[F.tri]) }
const chipsHTML = (list, isOn, attr) => list.map(([k, l, n]) => `<button type="button" class="chip" data-${attr}="${esc(k)}" aria-pressed="${isOn(k)}">${esc(l)}${n != null ? ` <small>${n}</small>` : ""}</button>`).join("");
function renderFilters() {
  const cnt = f => all.filter(f).length, ac = activeCount();
  const q = [["tout", "Toutes"], ["nouveau", "Nouvelles"], ["debut", "Débutants bienvenus"], ["bientot", "Ferme bientôt"], ["stage", "Stages"], ["horscot", "Hors de Cotonou"]];
  $("#quick").innerHTML = `<button type="button" class="chip ${panelOpen || ac ? "!ring-ink" : ""}" data-toggle-panel aria-expanded="${panelOpen}">${I("filter")}Filtres${ac ? ` <span class="num ml-0.5 rounded-full bg-ink px-1.5 text-[11px] leading-[18px] text-white">${ac}</span>` : ""}</button><span class="mx-1 hidden w-px self-stretch bg-line sm:block" aria-hidden="true"></span>` + q.map(([k, l]) => `<button type="button" class="chip" data-z="${k}" aria-pressed="${F.zone === k}">${l}</button>`).join("");
  $("#f-contrat-sel").innerHTML = `<option value="">Tous les contrats</option>` + CONTRATS.map(([k, l]) => [k, l, cnt(o => contratKey(o) === k)]).filter(x => x[2]).map(([k, l, n]) => `<option value="${k}" ${F.contrat === k ? "selected" : ""}>${l} (${n})</option>`).join("");
  const v = {}; all.forEach(o => { const c = cityOf(o); v[c] = (v[c] || 0) + 1 });
  $("#f-ville").innerHTML = `<option value="">Toutes les villes</option>` + Object.keys(v).sort((a, b) => v[b] - v[a]).map(c => `<option value="${esc(c)}" ${F.ville === c ? "selected" : ""}>${esc(c)} (${v[c]})</option>`).join("");
  $("#f-tri").value = F.tri;
  $("#panel").hidden = !panelOpen; if (!panelOpen) return;
  $("#f-niv").innerHTML = chipsHTML(NIVEAUX.map(([k, l]) => [k, l, cnt(o => levels(o).has(k))]), k => F.niv.has(k), "niv");
  const s = {}; all.forEach(o => s[o.secteur] = (s[o.secteur] || 0) + 1);
  $("#f-sect").innerHTML = chipsHTML(Object.keys(s).sort((a, b) => s[b] - s[a]).map(k => [k, k, s[k]]), k => F.sect.has(k), "sect");
  $("#f-zone").innerHTML = chipsHTML(Object.entries(ZONES).map(([k, l]) => [k, l, cnt(o => o.zone === k)]).filter(x => x[2]), k => F.zone === k, "zz");
}

const TIPS = [["Le bon nom de fichier", "Nommez votre CV « NOM-Prénom-Poste.pdf ». Le recruteur le retrouve en deux secondes."], ["Un seul PDF", "Quand l'avis demande plusieurs pièces, regroupez-les dans un seul PDF, dans l'ordre de la liste."], ["L'objet du mail compte", "Recopiez exactement l'objet demandé, référence comprise. Beaucoup de dossiers sont triés sur ce seul détail."], ["N'attendez pas le dernier jour", "Les boîtes mail saturent la veille de la clôture. Envoyez deux ou trois jours avant."], ["Relancez, poliment", "Sans nouvelles après une semaine, un court message de relance montre votre motivation."], ["Gardez vos pièces prêtes", "CIP, IFU, casier judiciaire, acte de naissance : scannez-les une fois pour toutes."]];
const scam = () => note("shield", "amber", "Un employeur ne vous demande jamais d'argent.", "Frais de dossier, de test ou de « réservation de place » : c'est une arnaque. Passez votre chemin.");
const tipBox = () => { const [t, x] = TIPS[new Date().getDate() % TIPS.length]; return note("bulb", "brand", `Le conseil du jour · ${esc(t)}`, esc(x)) };

function relaxOpts() {
  const out = [], cp = () => ({ ...F, niv: new Set(F.niv), sect: new Set(F.sect) });
  const add = (id, label, mut) => { const f = cp(); mut(f); const n = all.filter(o => match(o, f)).length; if (n) out.push([id, label, n]) };
  if (F.q.trim()) add("q", `« ${F.q.trim()} »`, f => { f.q = "" });
  if (F.zone !== "tout") add("zone", ZL[F.zone] || F.zone, f => { f.zone = "tout" });
  if (F.contrat) add("contrat", CONTRATS.find(x => x[0] === F.contrat)?.[1] || F.contrat, f => { f.contrat = "" });
  if (F.ville) add("ville", F.ville, f => { f.ville = "" });
  F.niv.forEach(k => add("niv:" + k, NIVEAUX.find(x => x[0] === k)?.[1] || k, f => { f.niv.delete(k) }));
  F.sect.forEach(k => add("sect:" + k, k, f => { f.sect.delete(k) }));
  return out.sort((a, b) => b[2] - a[2]).slice(0, 4);
}
function relax(id) { const [k, v] = id.split(":"); if (k === "q") { F.q = ""; $("#q").value = "" } else if (k === "zone") F.zone = "tout"; else if (k === "contrat") F.contrat = ""; else if (k === "ville") F.ville = ""; else if (k === "niv") F.niv.delete(v); else if (k === "sect") F.sect.delete(v); shown = 25; renderOffers() }
function noResults() {
  const opts = relaxOpts();
  const chips = opts.length ? opts.map(([id, l, n]) => `<button type="button" class="chip" data-relax="${esc(id)}">Sans ${esc(l)} <small>${pl(n, "offre")}</small></button>`).join("")
    : SUGG.filter(s => norm(s) !== norm(F.q.trim())).slice(0, 5).map(s => `<button type="button" class="chip" data-sugg="${esc(s)}">${esc(s)}</button>`).join("");
  return `<div class="rounded-2xl px-6 py-16 text-center ring-1 ring-inset ring-line sm:py-20"><h3 class="text-lg font-semibold tracking-[-0.02em]">Rien pour cette recherche aujourd'hui</h3><p class="mx-auto mt-2 max-w-[46ch] leading-relaxed text-ink-muted">${opts.length ? "Retirez un critère pour voir des offres proches." : "Essayez un mot plus simple, ou l'une de ces recherches fréquentes."}</p><div class="mt-6 flex flex-wrap justify-center gap-2">${chips}</div><div class="mt-6 flex flex-wrap justify-center gap-2"><button type="button" class="btn-primary btn-sm" data-reset>Tout afficher</button><button type="button" class="btn-secondary btn-sm" data-add-alert>${I("bell")}Me prévenir</button></div></div>`;
}
function renderOffers() {
  renderFilters();
  const rows = sorted(all.filter(o => match(o)));
  const postes = rows.reduce((s, o) => s + (o.nbPostes || 1), 0);
  $("#count").innerHTML = rows.length ? `<span class="num">${pl(rows.length, "offre")}</span><span class="num text-base font-normal tracking-normal text-ink-muted">${pl(postes, "poste")} à pourvoir</span>` : (all.length ? "Aucune offre" : "");
  const plain = F.zone === "tout" && !F.niv.size && !F.sect.size && !F.contrat && !F.ville && !F.q;
  $("#alertBtn").hidden = plain || !rows.length;
  if (!all.length) { $("#list").innerHTML = empty("Pas d'offre ouverte ce matin", "Revenez demain : la liste est mise à jour chaque jour."); return }
  if (!rows.length) { $("#list").innerHTML = noResults(); return }
  const vis = rows.slice(0, shown), group = F.tri === "recent";
  const parts = []; let cur = null, buf = [];
  const flush = () => { if (buf.length) parts.push(listBox(buf)); buf = [] };
  vis.forEach((o, i) => {
    if (group) { const k = dayKey(o); if (k !== cur) { flush(); parts.push(`<h2 class="${parts.length ? "pt-8" : ""} pb-1 text-[13px] font-medium text-ink-muted">${k}</h2>`); cur = k } }
    buf.push(o); if (i === 5) { flush(); parts.push(tipBox()) } if (i === 13) { flush(); parts.push(scam()) }
  });
  flush(); if (vis.length < 14) parts.push(scam());
  if (rows.length > shown) parts.push(`<div class="flex justify-center pt-4"><button type="button" class="btn-secondary" data-more>Voir ${Math.min(25, rows.length - shown)} offres de plus</button></div>`);
  $("#list").innerHTML = `<div class="space-y-3">${parts.join("")}</div>`;
}

/* ---------- Accompagnement et formulaires ---------- */
const svcCard = s => `<article class="card flex flex-col p-7">
  <p class="text-[13px] font-medium text-brand-600">${esc(s.pour)}</p>
  <h3 class="mt-2 text-xl font-semibold tracking-[-0.025em]">${esc(s.nom)}</h3>
  <p class="mt-3 leading-relaxed text-ink-muted">${esc(s.desc)}</p>
  <ul class="mb-7 mt-5 space-y-2.5 text-[15px] text-ink-soft">${(s.inclus || []).map(x => `<li class="flex gap-2.5">${I("check", "mt-1 h-4 w-4 text-brand-600", 2)}<span>${esc(x)}</span></li>`).join("")}</ul>
  <div class="mt-auto flex items-center justify-between gap-4 border-t border-line pt-5"><span><span class="block font-semibold">${s.prix ? esc(s.prix) : "Tarif sur demande"}</span><span class="block text-sm text-ink-muted">${esc(s.duree || "")}</span></span><button type="button" class="btn-secondary btn-sm" data-book="${esc(s.id)}">Réserver</button></div>
</article>`;
function renderServices() {
  $("#services").innerHTML = (CFG.services || []).map(svcCard).join("");
  $("#c-service").innerHTML = (CFG.services || []).map(s => `<option value="${esc(s.nom)}">${esc(s.nom)}</option>`).join("") + `<option value="Je ne sais pas encore">Je ne sais pas encore, conseillez-moi</option>`;
  $("[data-wa-coach]").hidden = !CFG.whatsapp; $("[data-wa-ad]").hidden = !CFG.whatsapp;
}
function formData(id) { const f = $(id), o = {}; if (!f) return o; f.querySelectorAll("input,select,textarea").forEach(e => { if (e.name) o[e.name] = e.type === "checkbox" ? e.checked : e.value.trim() }); return o }
async function sendGoogle(key, data) {
  const g = CFG.formulaires?.[key]; if (!g || !g.action || !g.champs) return false;
  const body = new URLSearchParams(); Object.entries(g.champs).forEach(([k, entry]) => { if (data[k] != null) body.append(entry, data[k]) });
  try { await fetch(g.action, { method: "POST", mode: "no-cors", body }); return true } catch { return false }
}
const waLink = text => { const n = waNum(CFG.whatsapp); return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null };
const adText = d => `Bonjour Djob, je souhaite publier une annonce :\n\n• Poste : ${d.titre}\n• Entreprise : ${d.employeur}\n• Postes : ${d.nb}\n• Ville : ${d.ville}\n• Contrat : ${d.contrat}\n• Niveau : ${d.niveau}\n• Expérience : ${d.experience}\n• Salaire : ${d.salaire || "non précisé"}\n• Date limite : ${d.dateLimite || "non précisée"}\n• Postuler par ${d.mode} : ${d.valeur}\n• Pièces : ${(d.pieces || "").replace(/\n/g, ", ") || "non précisées"}\n\nMissions et profil :\n${d.description}\n\nContact : ${d.contact}, ${d.contact2}\nJe confirme que le recrutement est gratuit pour les candidats.`;
const coachText = d => `Bonjour Djob, je souhaite être accompagné(e).\n\n• Nom : ${d.nom}\n• WhatsApp : ${d.tel}\n• Besoin : ${d.service}\n• Poste visé : ${d.poste || "-"}\n• Disponibilités : ${d.dispo || "-"}\n• Ville : ${d.ville || "-"}\n\n${d.message || ""}`;
function adPreview() {
  if (!$("#adForm")) return; const d = formData("#adForm");
  $("#adPreview").innerHTML = row({ id: "preview", titre: d.titre || "Intitulé du poste", employeur: d.employeur || "Votre entreprise", ville: d.ville || "Ville", contrat: d.contrat, nbPostes: +d.nb || 1, dateLimite: d.dateLimite || null, debutant: d.experience === "Débutant accepté", publieSurDjob: true });
  $("#a-val-lbl").textContent = { email: "Adresse e-mail", tel: "Numéro de téléphone", depot: "Adresse du dépôt", lien: "Lien (https://…)" }[$("#a-mode").value];
}
function validate(form) {
  let ok = true;
  form.querySelectorAll("[required]").forEach(e => {
    const bad = e.type === "checkbox" ? !e.checked : !e.value.trim();
    if (e.type === "checkbox") e.parentElement.classList.toggle("text-signal-red", bad); else e.classList.toggle("invalid", bad);
    e.setAttribute("aria-invalid", bad); if (bad && ok) { ok = false; e.focus() }
  }); return ok;
}
const done = (title, text, extra = "") => `<div class="rounded-3xl bg-brand-50 px-6 py-14 text-center sm:col-span-2"><span class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-brand-600 ring-1 ring-brand-100">${I("check", "h-6 w-6", 2)}</span><h3 class="mt-5 text-2xl font-semibold tracking-[-0.03em]">${title}</h3><p class="mx-auto mt-2 max-w-[44ch] leading-relaxed text-ink-muted">${text}</p>${extra}</div>`;
async function submitAd(e) {
  e.preventDefault(); const f = $("#adForm"); if (!validate(f)) { $("#adMsg").textContent = "Il manque quelques informations, signalées en rouge."; return }
  const d = formData("#adForm"); d.date = new Date().toISOString();
  if (await sendGoogle("annonce", d)) { f.outerHTML = done("Merci, c'est bien reçu.", "On relit votre annonce : elle sera en ligne d'ici 24 h. Vous pourrez la partager dès qu'elle apparaît.", `<button type="button" class="btn-secondary mt-6" data-view="offres">Voir les offres</button>`); return }
  const l = waLink(adText(d)); if (l) { open(l, "_blank"); return }
  $("#adMsg").innerHTML = `Le dépôt en ligne ouvre très bientôt. En attendant, votre annonce est prête à être copiée. <button type="button" class="link" id="copyAd">Copier l'annonce</button>`;
  $("#copyAd").onclick = () => copy(adText(d));
}
async function submitCoach(e) {
  e.preventDefault(); const f = $("#coachForm"); if (!validate(f)) { $("#coachMsg").textContent = "Indiquez au moins votre nom et votre numéro WhatsApp."; return }
  const d = formData("#coachForm"); d.date = new Date().toISOString();
  if (await sendGoogle("accompagnement", d)) { f.outerHTML = done(`Merci ${esc(d.nom.split(" ")[0])}.`, `On vous écrit sur WhatsApp au ${esc(d.tel)} très vite pour en parler.`); return }
  const l = waLink(coachText(d)); if (l) { open(l, "_blank"); return }
  $("#coachMsg").textContent = "Les réservations en ligne ouvrent très bientôt. Gardez cette page de côté et revenez dans quelques jours.";
}

/* ---------- Sortir ---------- */
const budget = b => b === 0 ? `<span class="text-sm font-medium text-brand-600">Gratuit</span>` : `<span class="text-sm font-semibold tracking-wider" aria-label="Budget ${b} sur 3">${"F".repeat(b)}<span class="text-line-strong">${"F".repeat(3 - b)}</span></span>`;
const imgTag = (src, alt, cls) => `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" class="${cls}" onerror="this.remove()">`;
function placeCard(l) {
  const ic = CATS[l.categorie] || CATS.Culture, im = l.img;
  return `<button type="button" class="group text-left" data-place="${esc(l.id)}">
    <div class="relative aspect-[4/3] overflow-hidden rounded-2xl bg-paper-sunk">${im?.url ? imgTag(im.url, im.legende || l.nom, "h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]") : `<div class="grid h-full place-items-center text-ink-faint">${ic}</div>`}${im?.illustration ? `<span class="absolute bottom-2.5 right-2.5 rounded-full bg-black/45 px-2 py-0.5 text-[11px] text-white backdrop-blur">Photo d'illustration</span>` : ""}</div>
    <div class="mt-4 flex items-center justify-between gap-3 text-[13px] text-ink-muted"><span class="inline-flex items-center gap-1.5">${ic.replace('h-5 w-5', 'h-4 w-4')}${esc(l.categorie)}</span>${budget(l.budget)}</div>
    <h3 class="mt-1.5 text-lg font-semibold tracking-[-0.02em] group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">${esc(l.nom)}</h3>
    <p class="text-sm text-ink-muted">${esc(l.quartier)}${l.zone === "escapade" ? "" : " · " + esc(l.ville)}</p>
    <p class="mt-2 line-clamp-2 text-[15px] leading-relaxed text-ink-soft">${esc(l.resume)}</p>
  </button>`;
}
const credit = im => im?.url ? `<p class="mt-2 text-xs text-ink-faint">${im.illustration ? "Photo d'illustration" + (im.legende ? ` (${esc(im.legende)})` : "") + " · " : ""}${esc(im.auteur)}, <a class="underline underline-offset-2" href="${esc(im.lien)}" target="_blank" rel="noopener">Wikimedia Commons</a>, ${esc(im.licence)}</p>` : "";
function renderSortir() {
  const t = today(), ev = events.filter(e => D(e.fin || e.debut) >= t).sort((a, b) => a.debut.localeCompare(b.debut));
  $("#events").innerHTML = ev.length ? ev.map(e => {
    const d = D(e.debut), on = d <= t;
    return `<button type="button" class="card-hover flex w-[290px] flex-none snap-start gap-4 p-5 text-left" data-event="${esc(e.id)}"><div class="w-14 flex-none text-center"><div class="num text-[28px] font-semibold leading-none tracking-[-0.04em]">${on ? "●" : d.getDate()}</div><div class="mt-1.5 text-xs font-medium uppercase tracking-wide ${on ? "text-brand-600" : "text-ink-muted"}">${on ? "En cours" : MOIS[d.getMonth()]}</div></div><div class="min-w-0 border-l border-line pl-4"><h3 class="line-clamp-2 font-semibold leading-snug tracking-[-0.015em]">${esc(e.titre)}</h3><p class="mt-1 text-sm text-ink-muted">${esc(e.lieu)}${e.fin && e.fin !== e.debut ? ` · jusqu'au ${shortDate(e.fin)}` : ""}</p><span class="tag-neutral mt-3">${esc(e.type)}</span></div></button>`
  }).join("") : `<div class="w-full">${empty("Le calendrier se remplit", "Les prochains événements arrivent avec la mise à jour de la semaine.")}</div>`;
  const cats = ["Tout", ...Object.keys(CATS).filter(c => lieux.some(l => l.categorie === c))];
  $("#s-cat").innerHTML = cats.map(c => `<button type="button" class="chip" data-scat="${esc(c)}" aria-pressed="${SF.cat === c}">${esc(c)} <small>${c === "Tout" ? lieux.length : lieux.filter(l => l.categorie === c).length}</small></button>`).join("");
  $("#s-more").innerHTML = `<button type="button" class="chip" data-scheap aria-pressed="${SF.cheap}">Petit budget</button><button type="button" class="chip" data-szone="cotonou" aria-pressed="${SF.zone === "cotonou"}">À Cotonou</button><button type="button" class="chip" data-szone="escapade" aria-pressed="${SF.zone === "escapade"}">Hors de Cotonou</button>`;
  const rows = lieux.filter(l => (SF.cat === "Tout" || l.categorie === SF.cat) && (!SF.cheap || l.budget <= 1) && (!SF.zone || l.zone === SF.zone));
  $("#places").innerHTML = rows.length ? rows.map(placeCard).join("") : `<div class="sm:col-span-2 lg:col-span-3">${empty("Aucune adresse avec ces filtres", "Essayez une autre catégorie.")}</div>`;
}
const mapsUrl = l => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`${l.nom} ${l.quartier} ${l.ville} Bénin`);

/* ---------- Fiche (panneau latéral / feuille mobile) ---------- */
const sheetHead = label => `<div class="sticky top-0 z-10 bg-white/90 backdrop-blur-xl"><div class="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line-strong lg:hidden" aria-hidden="true"></div><div class="flex items-center justify-between gap-4 px-6 py-3 lg:px-8 lg:py-4"><span class="text-[13px] font-medium text-ink-muted">${label}</span><button type="button" class="icon-btn -mr-2" data-close aria-label="Fermer">${I("x", "h-5 w-5")}</button></div></div>`;
const fact = (k, v, wide) => `<div class="rounded-xl p-4 ring-1 ring-inset ring-line ${wide ? "col-span-2" : ""}"><dt class="text-[13px] text-ink-muted">${k}</dt><dd class="mt-1 font-medium leading-snug">${esc(v)}</dd></div>`;
const secTitle = t => `<h3 class="text-[13px] font-medium text-ink-muted">${t}</h3>`;
const src = (s, pre, post) => `<p class="mt-10 border-t border-line pt-6 text-sm leading-relaxed text-ink-muted">${pre} ${okUrl(s?.url) ? `<a class="link font-normal" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.nom)}</a>` : esc(s?.nom)}${post}</p>`;
function showSheet(hash, push, title) { const d = $("#dlg"); if (!d.open) d.showModal(); $("#sheet").scrollTop = 0; if (hash && push && location.hash !== "#" + hash) history.pushState(null, "", "#" + hash); document.title = `${title} · Djob`; $("#sheet").dataset.hash = hash || "" }
function closeSheet() { const d = $("#dlg"); if (d.open) d.close() }

function openPlace(id, push = true) {
  const l = lieux.find(x => x.id === id); if (!l) return; const ic = CATS[l.categorie] || CATS.Culture;
  const link = SITE + "#s-" + l.id, share = `${l.nom} (${l.ville}) : ${l.resume}\nSur Djob : ${link}`;
  $("#sheet").innerHTML = sheetHead(`<span class="inline-flex items-center gap-1.5">${ic.replace('h-5 w-5', 'h-4 w-4')}${esc(l.categorie)}</span>`) + `<div class="px-6 pb-10 lg:px-8">
    <h2 id="dTitle" class="text-[28px] font-semibold leading-tight tracking-[-0.035em]">${esc(l.nom)}</h2>
    <p class="mt-1 text-ink-muted">${esc(l.quartier)}${l.zone === "escapade" ? "" : " · " + esc(l.ville)}</p>
    ${l.img?.url ? `<div class="mt-6 aspect-[16/10] overflow-hidden rounded-2xl bg-paper-sunk">${imgTag(l.img.url, l.img.legende || l.nom, "h-full w-full object-cover")}</div>${credit(l.img)}` : ""}
    <dl class="mt-6 grid grid-cols-2 gap-2">${fact("Budget", l.prix)}${fact(l.infos ? "Bon à savoir" : "Ville", l.infos || l.ville)}</dl>
    <p class="mt-6 text-[16.5px] leading-relaxed text-ink-soft">${esc(l.resume)}</p>
    ${l.aEssayer?.length ? `<div class="mt-8">${secTitle(l.categorie === "Manger" ? "À goûter" : "À faire")}<ul class="prose-djob mt-3 text-ink-soft">${l.aEssayer.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
    ${l.conseil ? `<div class="mt-8">${note("bulb", "brand", "Notre conseil", esc(l.conseil))}</div>` : ""}
    <div class="mt-8 grid gap-2 sm:grid-cols-2"><a class="btn-primary sm:col-span-2" href="${mapsUrl(l)}" target="_blank" rel="noopener">${I("pin")}Y aller avec Google Maps</a><a class="btn-wa" href="https://wa.me/?text=${encodeURIComponent(share)}" target="_blank" rel="noopener">${IWA()}Proposer à un ami</a><button type="button" class="btn-secondary" data-copy="${esc(link)}">${I("copy")}Copier le lien</button></div>
    ${src(l.source, "Infos vérifiées sur", ". Prix et horaires peuvent changer : appelez avant de vous déplacer.")}</div>`;
  showSheet("s-" + l.id, push, l.nom);
}
function openEvent(id) {
  const e = events.find(x => x.id === id); if (!e) return;
  $("#sheet").innerHTML = sheetHead(esc(e.type)) + `<div class="px-6 pb-10 lg:px-8">
    <h2 id="dTitle" class="text-[28px] font-semibold leading-tight tracking-[-0.035em]">${esc(e.titre)}</h2>
    <p class="mt-1 text-ink-muted">${esc(e.lieu)}</p>
    <div class="mt-6 flex items-center gap-3 rounded-xl bg-paper-sunk px-4 py-3.5 font-medium">${I("cal", "h-5 w-5 text-ink-muted")}<span>${e.fin && e.fin !== e.debut ? `Du ${longDate(e.debut)} au ${longDate(e.fin)}` : `Le ${longDate(e.debut)}`}${e.heure ? ` à ${esc(e.heure)}` : ""}</span></div>
    <dl class="mt-2 grid grid-cols-2 gap-2">${fact("Prix", e.prix || "Voir les organisateurs")}${fact("Lieu", e.lieu)}</dl>
    <p class="mt-6 text-[16.5px] leading-relaxed text-ink-soft">${esc(e.resume)}</p>
    <a class="btn-wa mt-8 w-full" href="https://wa.me/?text=${encodeURIComponent(`${e.titre}, ${e.lieu}. On y va ? ${SITE}#sortir`)}" target="_blank" rel="noopener">${IWA()}Proposer à un ami</a>
    ${src(e.source, "Source :", ". Vérifiez les détails auprès des organisateurs.")}</div>`;
  showSheet(null, false, e.titre);
}

const copyRow = (label, v) => `<div><p class="text-[13px] text-ink-muted">${label}</p><div class="mt-1.5 flex items-center gap-2 rounded-xl bg-white p-1.5 pl-4 ring-1 ring-line"><code class="min-w-0 flex-1 break-all font-sans text-[15px] font-medium">${esc(v)}</code><button type="button" class="btn-secondary btn-sm min-h-[36px] px-3.5" data-copy="${esc(v)}">Copier</button></div></div>`;
function mailText(o) { return `Madame, Monsieur,\n\nSuite à votre avis de recrutement pour le poste de ${o.titre.replace(/^\d+\s+postes?\s+/i, "")}${o.employeur ? ` (${o.employeur})` : ""}, je vous adresse ma candidature.\n\nVous trouverez en pièce jointe mon dossier complet${o.pieces?.length ? ` : ${o.pieces.map(p => p.toLowerCase()).join(", ")}` : ""}.\n\nJe reste à votre disposition pour un entretien à votre convenance.\n\nVeuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.\n\n[Prénom NOM]\n[Téléphone / WhatsApp]` }
function howTo(o) {
  const p = o.postuler || {}, box = c => `<div class="mt-3 space-y-4 rounded-2xl bg-paper-warm p-5 ring-1 ring-line">${c}</div>`, small = t => `<p class="text-sm leading-relaxed text-ink-muted">${t}</p>`;
  if (p.mode === "email") return box(`${copyRow("Envoyez votre dossier à", p.valeur)}${p.copie ? copyRow("En copie (obligatoire)", p.copie) : ""}${p.objet ? copyRow("Objet du mail", p.objet) : ""}
    ${p.depot ? small(esc(p.depot) + (p.tel ? ` · tél. ${esc(p.tel)}` : "")) : p.tel ? small(`Une question ? Téléphone / WhatsApp : ${esc(p.tel)}`) : ""}
    <details class="group rounded-xl bg-white ring-1 ring-line"><summary class="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 px-4 text-[15px] font-medium [&::-webkit-details-marker]:hidden">Votre mail de candidature, prêt à copier${I("chev", "h-4 w-4 text-ink-muted transition-transform group-open:rotate-180")}</summary><div class="px-4 pb-4"><div class="mailbox">${esc(mailText(o))}</div><button type="button" class="btn-primary btn-sm mt-3" data-copy="${esc(mailText(o))}">${I("copy")}Copier le mail</button></div></details>`);
  if (p.mode === "tel") return box(`${copyRow("Appelez ou écrivez sur WhatsApp", p.valeur)}${p.email ? copyRow("Ou par e-mail", p.email) : ""}${p.note ? small(esc(p.note)) : ""}<a class="btn-wa w-full" href="https://wa.me/${waNum(p.valeur)}?text=${encodeURIComponent(`Bonjour, je vous contacte pour l'offre « ${o.titre} ». Je suis intéressé(e) et disponible pour en parler. Merci !`)}" target="_blank" rel="noopener">${IWA()}Écrire sur WhatsApp</a>`);
  if (p.mode === "depot") return box(`<div><p class="text-[13px] text-ink-muted">Déposez votre dossier</p><p class="mt-1 font-medium">${esc(p.valeur)}</p></div>${p.horaires ? small(esc(p.horaires)) : ""}${p.objet ? small(esc(p.objet)) : ""}`);
  if (p.mode === "lien" && okUrl(p.valeur)) return box(`${small("La candidature se fait à partir de l'annonce d'origine.")}<a class="btn-primary w-full" href="${esc(p.valeur)}" target="_blank" rel="noopener">${esc(p.libelle || "Voir l'avis et postuler")}${I("arrow")}</a>`);
  return `<p class="mt-3 text-ink-muted">Voir l'annonce d'origine.</p>`;
}
function openOffer(id, push = true) {
  const o = all.find(x => x.id === id); if (!o) return;
  const n = daysLeft(o), k = saved.includes(o.id), ch = checks[o.id] || [], a = apps[o.id];
  const link = SITE + "#" + o.id, shareTxt = `${o.titre} · ${o.employeur} (${o.ville})${o.dateLimite ? `, jusqu'au ${longDate(o.dateLimite)}` : ""}.\nToutes les infos ici : ${link}`;
  const hot = n !== null && n <= 3;
  $("#sheet").innerHTML = sheetHead(esc(o.secteur || "Offre d'emploi")) + `<div class="px-6 pb-10 lg:px-8">
    <div class="flex items-center gap-3">${avatar(o, "h-12 w-12 text-sm")}<p class="text-ink-muted">${esc(o.employeur)}</p></div>
    <h2 id="dTitle" class="mt-4 text-[28px] font-semibold leading-tight tracking-[-0.035em]">${esc(o.titre)}</h2>
    <div class="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl px-4 py-3.5 ${hot ? "bg-signal-redbg text-signal-red" : "bg-paper-sunk"}">${I("clock", "h-5 w-5 " + (hot ? "" : "text-ink-muted"))}<span class="font-medium">${n !== null ? `Jusqu'au ${longDate(o.dateLimite)} · ${left(n).toLowerCase()}` : "Pas de date limite annoncée"}</span>${n !== null ? `<button type="button" class="link ml-auto text-sm font-medium ${hot ? "!text-signal-red decoration-signal-red/40" : ""}" data-ics="${esc(o.id)}">Me le rappeler</button>` : ""}</div>
    <dl class="mt-2 grid grid-cols-2 gap-2">${fact("Où", o.ville)}${fact("Contrat", o.contrat)}${fact("Niveau", o.niveau)}${fact("Expérience", o.experience)}${o.salaire ? fact("Salaire", o.salaire, true) : ""}</dl>
    <p class="mt-7 text-[16.5px] leading-relaxed text-ink-soft">${esc(o.resume)}</p>
    ${o.postes?.length ? `<div class="mt-8">${secTitle("Les postes")}<ul class="mt-3 divide-y divide-line border-y border-line">${o.postes.map(p => `<li class="flex justify-between gap-4 py-3"><span>${esc(p.nom)}</span><span class="num font-medium">${p.nombre ?? ""}</span></li>`).join("")}</ul></div>` : ""}
    ${o.profil?.length ? `<div class="mt-8">${secTitle("Ce qu'on attend de vous")}<ul class="prose-djob mt-3 text-ink-soft">${o.profil.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
    ${o.pieces?.length ? `<div class="mt-8">${secTitle(`Votre dossier · <span class="num">${ch.length}/${o.pieces.length}</span> prêt${ch.length > 1 ? "s" : ""}`)}<ul class="mt-2">${o.pieces.map((x, i) => `<li><label class="flex min-h-[44px] cursor-pointer items-start gap-3 py-2"><input type="checkbox" class="peer mt-0.5 h-5 w-5 flex-none rounded accent-ink" data-ck="${i}" ${ch.includes(i) ? "checked" : ""}><span class="leading-relaxed text-ink-soft peer-checked:text-ink-faint peer-checked:line-through">${esc(x)}</span></label></li>`).join("")}</ul></div>` : ""}
    <div class="mt-8">${secTitle("Comment postuler")}${howTo(o)}</div>
    ${a ? `<div class="mt-6 flex items-center gap-3 rounded-xl bg-brand-50 px-4 py-3.5 text-brand-700">${I("check", "h-5 w-5", 2)}<span class="font-medium">Postulé le ${new Date(a.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}. Suivez-la dans votre carnet.</span></div>` : ""}
    <div class="mt-6 grid grid-cols-2 gap-2">
      ${a ? "" : `<button type="button" class="btn-primary col-span-2" data-apply="${esc(o.id)}">${I("check", "h-4 w-4", 2)}J'ai postulé</button>`}
      <a class="btn-wa col-span-2" href="https://wa.me/?text=${encodeURIComponent(shareTxt)}" target="_blank" rel="noopener">${IWA()}Envoyer à un ami</a>
      <button type="button" class="btn-secondary" data-keep="${esc(o.id)}" aria-pressed="${k}"><svg class="h-4 w-4 ${k ? "fill-ink stroke-ink" : "fill-none stroke-current"}" stroke-width="1.75" aria-hidden="true"><use href="#i-heart"/></svg>${k ? "Gardée" : "Garder"}</button>
      <button type="button" class="btn-secondary" data-copy="${esc(link)}">${I("copy")}Copier le lien</button>
    </div>
    <div class="mt-8">${note("spark", "plain", "Envie d'un coup de pouce ?", `On peut relire votre CV ou vous préparer à l'entretien pour ce poste. <button type="button" class="link" data-book="cv">Se faire accompagner</button>`)}</div>
    ${src(o.source, "Annonce repérée sur", `${o.publie ? `, publiée le ${longDate(o.publie)}` : ""}. Vérifiez l'avis officiel avant d'envoyer votre dossier.`)}</div>`;
  $("#sheet").dataset.cur = o.id; showSheet(o.id, push, o.titre);
}

/* ---------- Carnet ---------- */
function badge() { const n = saved.filter(id => all.some(o => o.id === id)).length + Object.keys(apps).length; $$("[data-badge]").forEach(b => { b.hidden = !n; b.textContent = n }) }
const ser = f => ({ q: f.q, zone: f.zone, niv: [...f.niv], sect: [...f.sect], contrat: f.contrat, ville: f.ville, tri: f.tri });
const deser = s => ({ q: s.q || "", zone: s.zone || "tout", niv: new Set(s.niv || []), sect: new Set(s.sect || []), contrat: typeof s.contrat === "string" ? s.contrat : (s.contrat || [])[0] || "", ville: s.ville || "", tri: s.tri || "recent" });
const goBtn = (label, v = "offres") => `<button type="button" class="btn-primary btn-sm mt-6" data-view="${v}">${label}</button>`;
function renderMoi() {
  $$("[data-seg]").forEach(b => b.setAttribute("aria-selected", b.dataset.seg === seg));
  const body = $("#moiBody");
  if (seg === "gardees") {
    const rows = saved.map(id => all.find(o => o.id === id)).filter(Boolean);
    body.innerHTML = rows.length ? listBox(rows) : empty("Rien de gardé pour l'instant", "Touchez le cœur d'une offre pour la mettre de côté et la retrouver ici.", goBtn("Parcourir les offres"));
  } else if (seg === "postulees") {
    const ids = Object.keys(apps).sort((a, b) => (apps[b].date || "").localeCompare(apps[a].date || ""));
    body.innerHTML = ids.length ? `<div class="grid gap-3 md:grid-cols-2">${ids.map(id => {
      const a = apps[id], o = all.find(x => x.id === id) || a.snap || { titre: id, employeur: "" };
      const days = Math.floor((Date.now() - new Date(a.date)) / 864e5), relance = a.statut === "envoyee" && days >= 7;
      return `<article class="card flex flex-col gap-4 p-5 sm:p-6">
        <div class="flex items-start justify-between gap-4"><div class="min-w-0"><p class="truncate text-[13px] text-ink-muted">${esc(o.employeur)}</p><h3 class="mt-0.5 font-semibold leading-snug tracking-[-0.015em]">${esc(o.titre)}</h3></div>${all.some(x => x.id === id) ? `<button type="button" class="btn-ghost btn-sm -mr-2 -mt-1.5" data-id="${esc(id)}">Revoir</button>` : `<span class="tag-neutral">Offre close</span>`}</div>
        <div class="flex flex-wrap items-center justify-between gap-3 text-sm text-ink-muted"><span>Postulé le ${new Date(a.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</span><label><span class="sr-only">Où en êtes-vous ?</span><select class="input min-h-[40px] w-auto rounded-full py-0 text-sm font-medium" data-statut="${esc(id)}">${STATUTS.map(([k, l]) => `<option value="${k}" ${a.statut === k ? "selected" : ""}>${l}</option>`).join("")}</select></label></div>
        ${relance ? note("clock", "amber", `Cela fait ${days} jours.`, "Un petit message de relance poli peut faire la différence.") : ""}
        ${a.statut === "entretien" ? note("spark", "brand", "Bonne nouvelle !", `Envie d'arriver prêt(e) ? <button type="button" class="link" data-book="entretien">Préparer l'entretien avec nous</button>`) : ""}
        ${a.statut === "retenu" ? note("check", "brand", "Félicitations !", "Vous l'avez mérité.") : ""}
        <label><span class="sr-only">Notes</span><textarea class="input min-h-0 bg-paper-warm text-sm" data-note="${esc(id)}" rows="2" placeholder="Une note : nom du contact, date d'entretien…">${esc(a.note || "")}</textarea></label>
        <button type="button" class="self-start text-sm text-ink-muted underline decoration-line-strong underline-offset-4 hover:text-signal-red" data-unapply="${esc(id)}">Retirer de la liste</button>
      </article>`
    }).join("")}</div>` : empty("Aucune candidature notée", "Quand vous postulez, touchez « J'ai postulé » sur la fiche de l'offre. Vous suivrez ici où vous en êtes.", goBtn("Trouver une offre"));
  } else {
    body.innerHTML = alerts.length ? `<div class="divide-y divide-line overflow-hidden rounded-2xl bg-white ring-1 ring-line">${alerts.map((al, i) => {
      const f = deser(al.f), rows = all.filter(o => match(o, f)), nw = rows.filter(o => addedTs(o) > (al.seen || 0)).length;
      return `<div class="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"><div class="min-w-0"><p class="flex flex-wrap items-center gap-2 font-medium">${esc(al.label)}${nw ? `<span class="tag-brand">${pl(nw, "nouvelle")}</span>` : ""}</p><p class="mt-0.5 text-sm text-ink-muted">${pl(rows.length, "offre")} ouverte${rows.length > 1 ? "s" : ""}</p></div><div class="flex flex-none items-center gap-1"><button type="button" class="btn-secondary btn-sm" data-run-alert="${i}">Voir</button><button type="button" class="icon-btn" data-del-alert="${i}" aria-label="Supprimer l'alerte">${I("x", "h-[18px] w-[18px]")}</button></div></div>`
    }).join("")}</div>` : empty("Aucune alerte", "Faites une recherche (par exemple « comptable » à Parakou), puis touchez « Me prévenir des nouvelles offres ».", goBtn("Faire une recherche"));
  }
}

/* ---------- Conseils et FAQ ---------- */
const GUIDE = [
  ["Votre dossier béninois, prêt d'avance", "Les pièces qu'on vous demande presque toujours", `<p>La plupart des avis au Bénin demandent les mêmes documents. Les avoir déjà scannés vous fait gagner des jours.</p><ul><li><b>CIP</b> (Certificat d'Identification Personnelle) : il remplace de nombreuses pièces d'état civil ; il se demande auprès de l'ANIP.</li><li><b>Acte de naissance sécurisé</b> : également délivré via l'ANIP.</li><li><b>IFU</b> (Identifiant Fiscal Unique) : demandé surtout pour les prestations et l'intérim.</li><li><b>Casier judiciaire</b> de moins de 3 mois : pensez à le renouveler.</li><li><b>Diplômes et attestations</b> : des copies nettes, légalisées pour la fonction publique.</li></ul>`],
  ["Un CV qui se lit en 30 secondes", "Ce que le recruteur regarde vraiment", `<ul><li>Une page, deux au maximum avec plus de 10 ans d'expérience.</li><li>En haut : nom, numéro WhatsApp, e-mail, ville.</li><li>Pour chaque poste : ce que vous avez fait et un résultat concret (« 40 clients suivis », « caisse tenue sans écart pendant 2 ans »).</li><li>Adaptez le titre du CV au poste visé.</li><li>Une adresse e-mail sérieuse : prenom.nom@…</li></ul>`],
  ["La lettre et le mail de candidature", "Court, personnel, sans fautes", `<p>Trois paragraphes suffisent : pourquoi ce poste, ce que vous apportez (avec un exemple), votre disponibilité. Faites relire par quelqu'un.</p><div class="mailbox mt-4">Madame, Monsieur,

Suite à votre avis de recrutement pour le poste de [poste], je vous adresse ma candidature. Vous trouverez en pièce jointe mon dossier complet.

Je reste disponible pour un entretien à votre convenance.

Veuillez agréer, Madame, Monsieur, mes salutations distinguées.
[Prénom NOM] · [téléphone]</div>`],
  ["Postuler par téléphone ou WhatsApp", "Pour les petites entreprises et les boutiques", `<ul><li>Appelez entre 9 h et 17 h, dans un endroit calme.</li><li>Présentez-vous en une phrase : prénom, poste visé, où vous avez vu l'offre, quartier où vous habitez.</li><li>Sur WhatsApp, un message clair et poli, sans abréviations. Pas de vocal de 3 minutes au premier contact.</li></ul>`],
  ["Réussir l'entretien", "Se préparer la veille, arriver serein", `<ul><li>Relisez l'offre et renseignez-vous sur l'entreprise.</li><li>Préparez trois exemples concrets de ce que vous avez réussi.</li><li>Arrivez 10 à 15 minutes en avance, avec une copie de votre CV.</li><li>À la fin, posez une question sur le poste.</li><li>Le soir même, un court message de remerciement fait bonne impression.</li></ul>`],
  ["Repérer une arnaque", "Les signaux qui ne trompent pas", `<ul><li>L'employeur vous demande de l'argent : frais de dossier, de formation, de visite médicale, de « réservation ».</li><li>Le salaire promis est très élevé pour peu d'efforts, ou il faut recruter d'autres personnes.</li><li>Pas de nom d'entreprise, pas d'adresse, seulement un numéro WhatsApp étranger.</li><li>On vous demande une photo « en pied » ou des informations sans rapport avec le poste.</li></ul>`]
];
const FAQ = [
  ["Les offres sont-elles vraiment gratuites ?", "Oui. Consulter les offres et postuler ne coûte rien, sans inscription. Seul l'accompagnement personnalisé (CV, entretien…) est payant, et il reste facultatif."],
  ["Est-ce que Djob transmet mon CV ?", "Non. Vous postulez directement auprès de l'employeur, avec les coordonnées indiquées sur chaque offre."],
  ["D'où viennent les offres ?", "Des sites d'emploi béninois, des avis officiels, des organisations internationales, des cabinets de recrutement, de LinkedIn, et des recruteurs qui publient directement sur Djob. Chaque fiche indique sa source."],
  ["Comment se passe l'accompagnement ?", "Vous choisissez un service et laissez votre numéro. Un conseiller vous écrit sur WhatsApp pour convenir du tarif et du moment. Vous ne payez qu'une fois d'accord."],
  ["Je recrute : comment publier ?", "Remplissez le formulaire « Publier une annonce ». C'est gratuit. On vérifie chaque annonce avant de la mettre en ligne, en général sous 24 h."],
  ["Les adresses de « Sortir » sont-elles sponsorisées ?", "Non, aucune adresse n'a payé pour apparaître."],
  ["Puis-je installer Djob comme une application ?", "Oui. Sur Android, menu de Chrome puis « Ajouter à l'écran d'accueil ». Sur iPhone, Partager puis « Sur l'écran d'accueil »."]
];
const acc = (summary, body, open = false) => `<details class="group"${open ? " open" : ""}><summary class="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">${summary}<span class="grid h-8 w-8 flex-none place-items-center rounded-full ring-1 ring-line transition-transform duration-200 group-open:rotate-180">${I("chev", "h-4 w-4 text-ink-muted")}</span></summary><div class="pb-6 pr-12 leading-relaxed text-ink-muted">${body}</div></details>`;
const faqHTML = list => list.map(([q, a]) => acc(`<h3 class="text-[16.5px] font-medium tracking-[-0.01em]">${esc(q)}</h3>`, `<p>${esc(a)}</p>`)).join("");
function renderGuide() {
  $("#guide").innerHTML = GUIDE.map(([t, s, body], i) => acc(`<div class="flex gap-5"><span class="num pt-0.5 text-sm text-ink-faint">0${i + 1}</span><div><h3 class="text-[17px] font-semibold tracking-[-0.015em]">${esc(t)}</h3><p class="mt-0.5 text-sm text-ink-muted">${esc(s)}</p></div></div>`, `<div class="prose-djob pl-[38px] text-ink-soft">${body}</div>`, i === 0)).join("");
  $("#faq").innerHTML = faqHTML(FAQ);
}

/* ---------- Actions ---------- */
let tt; function toast(m) { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => t.hidden = true, 2400) }
async function copy(txt, btn) {
  try {
    await navigator.clipboard.writeText(txt);
    if (btn && /^Copier$/.test(btn.textContent.trim())) { const o = btn.innerHTML; btn.textContent = "Copié"; setTimeout(() => btn.innerHTML = o, 1600) } else toast("Copié");
  } catch { toast("Sélectionnez le texte pour le copier") }
}
function refresh() { badge(); if (view === "offres") renderOffers(); if (view === "moi") renderMoi(); if (view === "accueil") renderHome() }
function toggleKeep(id) { saved = saved.includes(id) ? saved.filter(x => x !== id) : [...saved, id]; store.set("djob-saved", saved); toast(saved.includes(id) ? "Gardée dans votre carnet" : "Retirée de votre carnet"); refresh(); if ($("#dlg").open && $("#sheet").dataset.cur === id) { const st = $("#sheet").scrollTop; openOffer(id, false); $("#sheet").scrollTop = st } }
function apply(id) { const o = all.find(x => x.id === id); apps[id] = { date: new Date().toISOString(), statut: "envoyee", note: "", snap: { titre: o.titre, employeur: o.employeur } }; store.set("djob-apps", apps); toast("Bravo, c'est envoyé. Bonne chance !"); refresh(); const st = $("#sheet").scrollTop; openOffer(id, false); $("#sheet").scrollTop = st }
function ics(o) {
  const r = new Date(D(o.dateLimite).getTime() - 2 * 864e5), rd = `${r.getFullYear()}${String(r.getMonth() + 1).padStart(2, "0")}${String(r.getDate()).padStart(2, "0")}`; const t = s => String(s).replace(/[,;\\]/g, m => "\\" + m).replace(/\n/g, "\\n");
  const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Djob//FR", "BEGIN:VEVENT", `UID:${o.id}@djob`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`, `DTSTART;VALUE=DATE:${rd}`, `SUMMARY:${t("Djob · Envoyer ma candidature : " + o.titre)}`, `DESCRIPTION:${t(`${o.employeur}. Date limite : ${longDate(o.dateLimite)}. ${SITE}#${o.id}`)}`, "BEGIN:VALARM", "TRIGGER:PT9H", "ACTION:DISPLAY", "DESCRIPTION:Candidature à envoyer", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([body], { type: "text/calendar" })); a.download = `rappel-${o.id}.ics`; document.body.appendChild(a); a.click(); a.remove(); toast("Rappel créé 2 jours avant la date limite");
}
function alertLabel() { const p = []; if (F.q) p.push(`« ${F.q.trim()} »`); if (F.zone !== "tout") p.push(ZL[F.zone]); F.niv.forEach(k => p.push(NIVEAUX.find(x => x[0] === k)[1])); F.sect.forEach(s => p.push(s)); if (F.contrat) p.push(CONTRATS.find(x => x[0] === F.contrat)[1]); if (F.ville) p.push(F.ville); return p.join(" · ") || "Toutes les offres" }
function addAlert() { const label = alertLabel(); if (alerts.some(a => a.label === label)) { toast("Cette alerte existe déjà"); return } alerts.push({ label, f: ser(F), seen: Date.now() }); store.set("djob-alerts", alerts); toast("Alerte créée, retrouvez-la dans votre carnet") }
function resetFilters() { F.zone = "tout"; F.niv.clear(); F.sect.clear(); F.contrat = ""; F.ville = ""; F.q = ""; $("#q").value = ""; shown = 25 }
function setView(v, push = true) {
  view = v;
  $$(".view").forEach(s => { const on = s.id === "v-" + v; s.hidden = !on; if (on) { s.classList.remove("animate-rise"); void s.offsetWidth; s.classList.add("animate-rise") } });
  $$("[data-view]").forEach(b => { if (b.closest("nav")) b.setAttribute("aria-current", b.dataset.view === v ? "page" : "false") });
  if (v === "accueil") renderHome(); if (v === "offres") renderOffers(); if (v === "sortir") renderSortir(); if (v === "moi") renderMoi(); if (v === "publier") adPreview();
  window.scrollTo({ top: 0 });
  if (push) { const h = v === "accueil" ? "" : "#" + v; if (location.hash !== h) history.pushState(null, "", h || location.pathname) }
}
function goto(k) { resetFilters(); F.zone = k; panelOpen = false; setView("offres") }
function book(id) { closeSheet(); setView("accompagnement"); const s = (CFG.services || []).find(x => x.id === id); if (s) $("#c-service").value = s.nom; setTimeout(() => $("#reserver")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60) }

/* ---------- Événements ---------- */
document.addEventListener("click", e => {
  const t = e.target, on = s => t.closest(s);
  let el;
  if (el = on("[data-keep]")) { e.stopPropagation(); toggleKeep(el.dataset.keep); return }
  if (el = on("[data-copy]")) { copy(el.dataset.copy, el); return }
  if (el = on("[data-apply]")) { apply(el.dataset.apply); return }
  if (el = on("[data-ics]")) { ics(all.find(o => o.id === el.dataset.ics)); return }
  if (el = on("[data-book]")) { book(el.dataset.book); return }
  if (on("[data-close]")) { closeSheet(); return }
  if (el = on("[data-view]")) { e.preventDefault(); closeSheet(); setView(el.dataset.view); return }
  if (el = on("[data-goto]")) { goto(el.dataset.goto); return }
  if (on("[data-share-site]")) { const txt = "Djob : toutes les offres d'emploi du Bénin, mises à jour chaque matin. Gratuit. " + SITE; if (navigator.share) navigator.share({ title: "Djob", text: txt, url: SITE }).catch(() => { }); else copy(SITE); return }
  if (on("[data-wa-ad]")) { if (!validate($("#adForm"))) return; const l = waLink(adText(formData("#adForm"))); if (l) open(l, "_blank"); return }
  if (on("[data-wa-coach]")) { if (!validate($("#coachForm"))) return; const l = waLink(coachText(formData("#coachForm"))); if (l) open(l, "_blank"); return }
  if (on("[data-toggle-panel]")) { panelOpen = !panelOpen; renderFilters(); return }
  if (on("[data-reset]")) { resetFilters(); renderOffers(); return }
  if (el = on("[data-relax]")) { relax(el.dataset.relax); return }
  if (on("[data-more]")) { shown += 25; renderOffers(); return }
  if (on("#alertBtn") || on("[data-add-alert]")) { addAlert(); return }
  if (el = on("[data-sugg]")) { resetFilters(); F.q = el.dataset.sugg; $("#q").value = F.q; setView("offres"); return }
  if (el = on("[data-z]")) { F.zone = el.dataset.z; shown = 25; renderOffers(); return }
  if (el = on("[data-zz]")) { F.zone = F.zone === el.dataset.zz ? "tout" : el.dataset.zz; shown = 25; renderOffers(); return }
  for (const [attr, set] of [["niv", F.niv], ["sect", F.sect]]) { const b = on(`[data-${attr}]`); if (b) { const k = b.dataset[attr]; set.has(k) ? set.delete(k) : set.add(k); shown = 25; renderOffers(); return } }
  if (el = on("[data-scat]")) { SF.cat = el.dataset.scat; renderSortir(); return }
  if (on("[data-scheap]")) { SF.cheap = !SF.cheap; renderSortir(); return }
  if (el = on("[data-szone]")) { SF.zone = SF.zone === el.dataset.szone ? "" : el.dataset.szone; renderSortir(); return }
  if (el = on("[data-place]")) { openPlace(el.dataset.place); return }
  if (el = on("[data-event]")) { openEvent(el.dataset.event); return }
  if (el = on("[data-seg]")) { seg = el.dataset.seg; renderMoi(); return }
  if (el = on("[data-run-alert]")) { const al = alerts[+el.dataset.runAlert]; Object.assign(F, deser(al.f)); $("#q").value = F.q; al.seen = Date.now(); store.set("djob-alerts", alerts); panelOpen = false; setView("offres"); return }
  if (el = on("[data-del-alert]")) { alerts.splice(+el.dataset.delAlert, 1); store.set("djob-alerts", alerts); renderMoi(); toast("Alerte supprimée"); return }
  if (el = on("[data-unapply]")) { delete apps[el.dataset.unapply]; store.set("djob-apps", apps); refresh(); return }
  if ((el = on("[data-id]")) && el.dataset.id !== "preview") { openOffer(el.dataset.id); return }
});
document.addEventListener("keydown", e => {
  const tg = e.target, typing = /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName);
  if ((e.key === "Enter" || e.key === " ") && tg.dataset?.id && tg.getAttribute("role") === "button") { e.preventDefault(); openOffer(tg.dataset.id); return }
  if (!typing && !$("#dlg").open && (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"))) { e.preventDefault(); if (view !== "offres") setView("offres"); $("#q").focus() }
});
document.addEventListener("change", e => {
  const t = e.target;
  if (t.id === "f-ville") { F.ville = t.value; shown = 25; renderOffers(); return }
  if (t.id === "f-contrat-sel") { F.contrat = t.value; shown = 25; renderOffers(); return }
  if (t.id === "f-tri") { F.tri = t.value; renderOffers(); return }
  if (t.dataset.statut) { apps[t.dataset.statut].statut = t.value; store.set("djob-apps", apps); if (t.value === "retenu") toast("Félicitations !"); renderMoi(); return }
  if (t.dataset.ck != null && $("#sheet").contains(t)) {
    const id = $("#sheet").dataset.cur, i = +t.dataset.ck, cur = new Set(checks[id] || []); t.checked ? cur.add(i) : cur.delete(i); checks[id] = [...cur]; store.set("djob-checks", checks);
    const o = all.find(x => x.id === id); const h = t.closest("ul")?.previousElementSibling; if (h && o) h.innerHTML = `Votre dossier · <span class="num">${checks[id].length}/${o.pieces.length}</span> prêt${checks[id].length > 1 ? "s" : ""}`;
    if (o && checks[id].length === o.pieces.length) toast("Dossier complet. Vous êtes prêt(e)."); return
  }
  if (t.closest("#adForm")) adPreview();
});
document.addEventListener("input", e => {
  const t = e.target;
  if (t.dataset.note) { apps[t.dataset.note].note = t.value; store.set("djob-apps", apps) }
  if (t.classList.contains("invalid") && t.value.trim()) { t.classList.remove("invalid"); t.removeAttribute("aria-invalid") }
  if (t.closest("#adForm")) adPreview();
});
let tq; $("#q").addEventListener("input", e => { clearTimeout(tq); tq = setTimeout(() => { F.q = e.target.value; shown = 25; renderOffers() }, 160) });
$("#homeSearch").addEventListener("submit", e => { e.preventDefault(); resetFilters(); F.q = $("#hq").value; $("#q").value = F.q; setView("offres") });
$("#adForm").addEventListener("submit", submitAd); $("#coachForm").addEventListener("submit", submitCoach);
$("#dlg").addEventListener("close", () => { document.title = "Djob · Les offres d'emploi du Bénin"; const h = $("#sheet").dataset.hash; if (h && location.hash === "#" + h) history.pushState(null, "", view === "accueil" ? location.pathname : "#" + view) });
$("#dlg").addEventListener("click", e => { if (e.target === e.currentTarget) closeSheet() });

function route() {
  const h = decodeURIComponent(location.hash.slice(1));
  if (["offres", "sortir", "moi", "conseils", "apropos", "accompagnement", "publier"].includes(h)) { closeSheet(); setView(h, false) }
  else if (h.startsWith("s-") && lieux.some(l => "s-" + l.id === h)) { if (view !== "sortir") setView("sortir", false); openPlace(h.slice(2), false) }
  else if (h && all.some(o => o.id === h)) { if (view !== "offres") setView("offres", false); openOffer(h, false) }
  else { closeSheet(); setView("accueil", false) }
}
window.addEventListener("popstate", route);
function stamp() { if (!maj) return; const d = new Date(maj); if (isNaN(d)) return; const same = d.toDateString() === new Date().toDateString(); $("#maj").textContent = `Dernière mise à jour ${same ? "aujourd'hui" : "le " + d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} à ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.` }
function contactBlock() { const p = []; if (CFG.whatsapp) p.push(`WhatsApp : <span class="font-medium text-ink">${esc(CFG.whatsapp)}</span>`); if (CFG.email) p.push(`e-mail : <span class="font-medium text-ink">${esc(CFG.email)}</span>`); $("#contact").innerHTML = p.length ? `<h2 class="mt-16 text-2xl font-semibold tracking-[-0.03em]">Nous écrire</h2><p class="mt-4 text-lg leading-relaxed text-ink-soft">${p.join(" · ")}. Pour signaler une offre douteuse, une erreur, ou simplement dire bonjour.</p>` : "" }

/* ---------- Démarrage ---------- */
greet(); renderGuide();
const getJ = (u, d) => fetch(u, { cache: "no-cache" }).then(r => r.ok ? r.json() : d).catch(() => d);
Promise.all([fetch("data.json", { cache: "no-cache" }).then(r => { if (!r.ok) throw 0; return r.json() }), getJ("sorties.json", { lieux: [], evenements: [] }), getJ("config.json", CFG)]).then(([d, s, c]) => {
  all = (d.offres || []).filter(isOpen); maj = d.derniereMaj; lieux = s.lieux || []; events = s.evenements || []; CFG = Object.assign(CFG, c || {});
  if (lastVisit) sinceIds = all.filter(o => addedTs(o) > lastVisit).map(o => o.id); store.set("djob-last", Date.now());
  weekIds = all.filter(o => Date.now() - addedTs(o) < 7 * 864e5 && (daysLeft(o) === null || daysLeft(o) >= 2)).sort((a, b) => (b.nbPostes || 1) - (a.nbPostes || 1)).slice(0, 2).map(o => o.id);
  renderServices(); contactBlock(); stamp(); badge(); route();
}).catch(() => {
  const err = empty("La liste n'a pas pu se charger", "Vérifiez votre connexion, puis rechargez la page.", `<button type="button" class="btn-primary btn-sm mt-6" onclick="location.reload()">Recharger</button>`);
  $("#homeJobs").innerHTML = $("#list").innerHTML = err; setView("accueil", false);
});
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => { }));
