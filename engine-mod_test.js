/**
 * engine-mod.js  v5.1
 * ─ Shadow DOM: isolamento CSS totale dal documento host
 * ─ Navigazione step-by-step (Avanti / Indietro)
 * ─ Validazione live ✓ verde / ✕ rosso su ogni campo
 * ─ Pagamento eredita da Anagrafica (modificabile)
 * ─ Sezione Multisito con POD aggiuntivi
 * ─ PDF identico a Modulo_energia_monosito.pdf
 */
(function (G) {
  "use strict";

  if (G.__engineMod5) return;
  G.__engineMod5 = true;

  /* ════════════════════════════════════════════════════════
     COSTANTI
  ════════════════════════════════════════════════════════ */
  const ORANGE = "#F5A01E";
  const STEPS  = [
    { id: "offerta",    lbl: "Offerta"    },
    { id: "anagrafica", lbl: "Anagrafica" },
    { id: "documento",  lbl: "Documento"  },
    { id: "tecnica",    lbl: "Tecnica"    },
    { id: "pagamento",  lbl: "Pagamento"  },
  ];

  let cur      = 0;
  let podCount = 1;
  let shadow   = null; // Shadow DOM root

  /* ════════════════════════════════════════════════════════
     CSS  (vive dentro il Shadow DOM — nessun conflitto host)
  ════════════════════════════════════════════════════════ */
  const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Overlay ── */
:host-context(body) {}
.ov {
  display: none; position: fixed; inset: 0;
  background: rgba(8,12,26,.65);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  align-items: center; justify-content: center;
  z-index: 10000; font-family: 'DM Sans', system-ui, sans-serif;
}
.ov.active { display: flex; }

/* ── Box ── */
.box {
  width: min(700px, calc(100vw - 18px)); max-height: 91vh; overflow-y: auto;
  background: #fff; border-radius: 22px; color: #0f1117;
  box-shadow: 0 32px 100px rgba(0,0,0,.35);
}
.box::-webkit-scrollbar { width: 4px; }
.box::-webkit-scrollbar-thumb { background: rgba(0,0,0,.12); border-radius: 3px; }

/* ── Header sticky ── */
.hdr {
  padding: 22px 26px 0; position: sticky; top: 0;
  background: #fff; border-radius: 22px 22px 0 0; z-index: 5;
}
.hdr h2 { font-size: 17px; font-weight: 800; letter-spacing: -.3px; margin: 0 36px 2px 0; }
.hdr p  { font-size: 11.5px; color: #7a8099; margin: 0 0 12px; }
.btn-x  {
  position: absolute; top: 14px; right: 16px;
  background: none; border: none; font-size: 19px; cursor: pointer;
  color: #7a8099; padding: 4px 7px; border-radius: 8px; line-height: 1;
  font-family: inherit;
}
.btn-x:hover { background: #f0f2f6; color: #0f1117; }

/* ── Progress ── */
.prog { padding: 0 26px 12px; }
.dots { display: flex; gap: 4px; margin-bottom: 5px; }
.dot  { flex: 1; height: 4px; border-radius: 2px; background: #e8eaf0; transition: background .28s; }
.dot.done { background: #1a7a3c; }
.dot.cur  { background: ${ORANGE}; }
.plbl { display: flex; justify-content: space-between; font-size: 10.5px; }
.plbl .name { font-weight: 700; color: #0f1117; }
.plbl .num  { color: #7a8099; }

/* ── Steps ── */
.cnt { padding: 4px 26px 0; }
.step { display: none; }
.step.active { display: block; }
.stitle {
  font-size: 13px; font-weight: 700; padding-bottom: 8px;
  border-bottom: 2.5px solid ${ORANGE}; margin-bottom: 14px;
  display: flex; align-items: center; gap: 8px;
}
.sn {
  background: ${ORANGE}; color: #fff; font-size: 11px; font-weight: 800;
  width: 22px; height: 22px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
}

/* ── Griglie ── */
.gr  { display: grid; gap: 11px; margin-bottom: 11px; }
.g1  { grid-template-columns: 1fr; }
.g2  { grid-template-columns: 1fr 1fr; }
.g3  { grid-template-columns: 1fr 1fr 1fr; }
@media (max-width: 520px) { .g2, .g3 { grid-template-columns: 1fr; } }

/* ── Campo ── */
.ef { display: flex; flex-direction: column; gap: 4px; }
.ef label {
  font-size: 10px; font-weight: 700; color: #7a8099;
  text-transform: uppercase; letter-spacing: .07em;
  display: block;
}
.ef-w { position: relative; }
.ef input, .ef select {
  width: 100%; height: 40px; padding: 0 30px 0 11px;
  border-radius: 9px; border: 1.5px solid rgba(15,17,23,.14);
  background: #fff; color: #0f1117; font-family: inherit;
  font-size: 13.5px; font-weight: 500; outline: none;
  transition: border-color .14s, box-shadow .14s;
  box-shadow: 0 1px 2px rgba(15,17,23,.05);
}
.ef input:focus, .ef select:focus {
  border-color: ${ORANGE};
  box-shadow: 0 0 0 3px rgba(245,160,30,.18);
}
.ef input::placeholder { font-style: italic; color: #b0b8cc; font-weight: 400; opacity: 1; }
.ef input.inh { background: #fffbf0; border-color: rgba(245,160,30,.45); }
.ef input[type=date] { font-size: 12px; }
.ef select { appearance: none; -webkit-appearance: none; padding-right: 28px; cursor: pointer; }
.ef-arr {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  pointer-events: none; width: 0; height: 0;
  border-left: 4px solid transparent; border-right: 4px solid transparent;
  border-top: 5px solid #7a8099;
}
/* Icona validazione */
.ei {
  position: absolute; right: 9px; top: 50%; transform: translateY(-50%);
  font-size: 13px; font-weight: 900; pointer-events: none;
  opacity: 0; transition: opacity .18s; line-height: 1;
}
.ei.ok  { color: #1a7a3c; opacity: 1; }
.ei.err { color: #c42b2b; opacity: 1; }
.ef-sw .ei { right: 26px; }
.inh-note { font-size: 10px; color: #a07010; margin-top: 1px; }

/* ── Radio ── */
.rg { display: flex; flex-wrap: wrap; gap: 6px 16px; padding: 5px 0; }
.rg label {
  font-size: 13px; font-weight: 500; color: #0f1117; cursor: pointer;
  display: flex; align-items: center; gap: 6px;
  text-transform: none; letter-spacing: 0;
}
.rg input[type=radio] { accent-color: ${ORANGE}; width: 15px; height: 15px; }
.rg-col { flex-direction: column; gap: 6px; }

/* ── Offerta cards ── */
.og { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
.oc {
  border: 1.5px solid #e8eaf0; border-radius: 10px;
  padding: 11px 13px; transition: border-color .15s, background .15s;
}
.oc:has(input:checked) { border-color: ${ORANGE}; background: rgba(245,160,30,.06); }
.oc-title {
  font-size: 9.5px; font-weight: 800; text-transform: uppercase;
  letter-spacing: .1em; color: #7a8099; margin-bottom: 7px;
}
.oi { display: flex; align-items: center; gap: 7px; margin-bottom: 5px; cursor: pointer; }
.oi input { accent-color: ${ORANGE}; width: 15px; height: 15px; flex-shrink: 0; }
.oi span  { font-size: 12.5px; font-weight: 500; }

/* ── Divisore ── */
.ehr { height: 1px; background: rgba(15,17,23,.07); margin: 4px 0 11px; }

/* ── Banner ereditato ── */
.inh-banner {
  font-size: 11.5px; color: #a07010; background: #fffbf0;
  border: 1px solid rgba(245,160,30,.35); border-radius: 8px;
  padding: 8px 12px; margin: -4px 0 12px; line-height: 1.5;
}

/* ── Azioni footer ── */
.act {
  padding: 14px 26px 20px; display: flex; gap: 10px;
  border-top: 1px solid rgba(15,17,23,.07); margin-top: 10px;
}
.act button {
  font-family: 'DM Sans', system-ui, sans-serif;
  cursor: pointer; border-radius: 11px; font-size: 14px;
  transition: filter .14s, transform .06s, background .14s;
}
.btn-next {
  flex: 1; padding: 12px; border: none;
  background: linear-gradient(135deg, ${ORANGE}, #e08a00); color: #fff;
  font-weight: 800; box-shadow: 0 4px 14px rgba(245,160,30,.38);
}
.btn-next:hover { filter: brightness(1.08); transform: translateY(-1px); }
.btn-back {
  padding: 12px 16px; border: 1.5px solid rgba(15,17,23,.13);
  background: rgba(15,17,23,.03); color: #0f1117;
  font-weight: 700; white-space: nowrap;
}
.btn-back:hover { background: rgba(15,17,23,.07); }
.btn-gen {
  flex: 2; padding: 12px; border: none;
  background: linear-gradient(135deg, #1a4a8a, #2255bb); color: #fff;
  font-weight: 800; box-shadow: 0 4px 14px rgba(26,74,138,.32);
}
.btn-gen:hover { filter: brightness(1.1); transform: translateY(-1px); }
.btn-cancel {
  padding: 12px 14px; border: 1.5px solid rgba(15,17,23,.12);
  background: transparent; color: #7a8099; font-weight: 600; font-size: 13px;
}
.btn-cancel:hover { background: rgba(15,17,23,.05); }
.btn-clear {
  padding: 12px 14px; border: 1.5px solid rgba(192,42,42,.3);
  background: rgba(192,42,42,.05); color: #c02a2a;
  font-weight: 600; font-size: 13px; white-space: nowrap;
}
.btn-clear:hover { background: rgba(192,42,42,.12); }

/* ── Multisito ── */
.ms-section { display: none; margin-top: 16px; }
.ms-section.visible { display: block; animation: fadeSlide .25s ease; }
.ms-divider { border: none; border-top: 1.5px solid #f0f0f0; margin: 20px 0 12px; }
.ms-label {
  font-size: 10px; font-weight: 700; letter-spacing: .08em;
  text-transform: uppercase; color: #999; margin-bottom: 10px;
}
@keyframes fadeSlide {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── POD list ── */
.pod-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }

/* ── POD card ── */
.pod-card {
  border: 1.5px solid #e8e8e8; border-radius: 12px;
  overflow: hidden; transition: box-shadow .18s;
}
.pod-card:focus-within { box-shadow: 0 0 0 3px rgba(245,160,30,.18); border-color: ${ORANGE}; }

.pod-card-hdr {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 14px; background: #fafafa;
  border-bottom: 1px solid #f0f0f0; cursor: pointer; user-select: none;
}
.pod-card-hdr:hover { background: #f5f5f5; }

.pod-badge {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; font-weight: 700; color: #444; letter-spacing: .03em;
}
.pod-num {
  background: ${ORANGE}; color: #fff; border-radius: 6px;
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800; flex-shrink: 0;
}
.pod-preview { font-size: 11px; color: #aaa; font-weight: 400; margin-left: 4px; }

.pod-actions { display: flex; align-items: center; gap: 6px; }
.pod-toggle {
  background: none; border: none; cursor: pointer;
  color: #aaa; font-size: 16px; padding: 2px 4px; line-height: 1;
  transition: color .15s, transform .2s; font-family: inherit;
}
.pod-toggle:hover { color: #555; }
.pod-toggle.collapsed { transform: rotate(-90deg); }
.pod-remove {
  background: none; border: 1px solid #f0c0c0; border-radius: 7px;
  cursor: pointer; color: #e05555; font-size: 12px;
  padding: 3px 8px; font-weight: 600; transition: all .15s;
  line-height: 1.4; font-family: inherit;
}
.pod-remove:hover { background: #fff0f0; border-color: #e05555; }

.pod-body { padding: 14px; display: grid; gap: 10px; }
.pod-body.collapsed { display: none; }

/* Campo dentro pod — identico a .ef con icona ✓/✕ */
.pf { display: flex; flex-direction: column; gap: 4px; }
.pf label {
  font-size: 10px; font-weight: 700; color: #999;
  text-transform: uppercase; letter-spacing: .06em; display: block;
}
.pf-w { position: relative; }
.pf input {
  width: 100%; height: 40px; padding: 0 30px 0 11px;
  border: 1.5px solid rgba(15,17,23,.14); border-radius: 9px;
  font-size: 13px; color: #2c2f3a; background: #fff;
  font-family: inherit; outline: none;
  transition: border-color .14s, box-shadow .14s;
  box-shadow: 0 1px 2px rgba(15,17,23,.05);
}
.pf input:focus { border-color: ${ORANGE}; box-shadow: 0 0 0 3px rgba(245,160,30,.18); }
.pf input:hover:not(:focus) { border-color: rgba(245,160,30,.4); }
.pf input::placeholder { font-style: italic; color: #b0b8cc; font-weight: 400; opacity: 1; }
.pf .pi {
  position: absolute; right: 9px; top: 50%; transform: translateY(-50%);
  font-size: 13px; font-weight: 900; pointer-events: none;
  opacity: 0; transition: opacity .18s; line-height: 1;
}
.pf .pi.ok  { color: #1a7a3c; opacity: 1; }
.pf .pi.err { color: #c42b2b; opacity: 1; }

.pod-radio-group { display: flex; flex-direction: column; gap: 6px; }
.pod-radio-label {
  font-size: 10px; font-weight: 700; color: #999;
  text-transform: uppercase; letter-spacing: .06em;
  display: block; margin-bottom: 4px;
}
.pod-radio-row { display: flex; gap: 18px; }
.pod-radio-col { display: flex; flex-direction: column; gap: 6px; }
.pod-radio-item {
  display: flex; align-items: flex-start; gap: 7px;
  font-size: 13px; font-weight: 500; color: #555; cursor: pointer;
}
.pod-radio-item input[type=radio] {
  accent-color: ${ORANGE}; width: 16px; height: 16px;
  margin-top: 1px; flex-shrink: 0;
}

/* ── Bottone Aggiungi POD ── */
.btn-add-pod {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 11px;
  border: 2px dashed ${ORANGE}; border-radius: 12px;
  background: #fffbf2; color: #d4860a;
  font-size: 13px; font-weight: 700; cursor: pointer;
  transition: all .18s; letter-spacing: .02em; font-family: inherit;
}
.btn-add-pod:hover {
  background: #fff3d6; border-color: #d4860a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245,160,30,.18);
}
.btn-add-pod:active { transform: translateY(0); }
.btn-add-pod .plus {
  width: 22px; height: 22px; background: ${ORANGE}; color: #fff;
  border-radius: 6px; display: flex; align-items: center;
  justify-content: center; font-size: 15px; font-weight: 900; flex-shrink: 0;
}
.pod-counter {
  display: none; text-align: right; font-size: 11px;
  color: #bbb; margin-top: 6px; font-weight: 500;
}
.pod-counter span { color: ${ORANGE}; font-weight: 700; }
`;

  /* ════════════════════════════════════════════════════════
     HTML HELPERS
  ════════════════════════════════════════════════════════ */
  const esc = s => String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  // Campo testo / email / tel / number / date
  const F = (id, lbl, type = "text", ph = "") =>
    `<div class="ef">
      <label for="${id}">${esc(lbl)}</label>
      <div class="ef-w">
        <input id="${id}" type="${type}" placeholder="${ph}" autocomplete="off">
        <span class="ei" id="${id}_i"></span>
      </div>
    </div>`;

  // Campo ereditato da Anagrafica
  const FI = (id, lbl, type = "text", ph = "") =>
    `<div class="ef">
      <label for="${id}">${esc(lbl)}</label>
      <div class="ef-w">
        <input id="${id}" type="${type}" placeholder="${ph}" autocomplete="off" class="inh">
        <span class="ei" id="${id}_i"></span>
      </div>
      <div class="inh-note">↑ da Anagrafica — modificabile</div>
    </div>`;

  // Select
  const SEL = (id, lbl, opts) =>
    `<div class="ef">
      <label for="${id}">${esc(lbl)}</label>
      <div class="ef-w ef-sw">
        <select id="${id}">
          <option value="">— Seleziona —</option>
          ${opts.map(o => `<option>${esc(o)}</option>`).join("")}
        </select>
        <span class="ef-arr"></span>
        <span class="ei" id="${id}_i"></span>
      </div>
    </div>`;

  // Radio orizzontale
  const R = (nm, vals) =>
    `<div class="rg">
      ${vals.map(([v, l]) => `<label><input type="radio" name="${nm}" value="${v}"> ${esc(l)}</label>`).join("")}
    </div>`;

  // Radio verticale
  const RC = (nm, vals) =>
    `<div class="rg rg-col">
      ${vals.map(([v, l]) => `<label><input type="radio" name="${nm}" value="${v}"> ${esc(l)}</label>`).join("")}
    </div>`;

  /* ════════════════════════════════════════════════════════
     HTML STEPS
  ════════════════════════════════════════════════════════ */
  const STEP_HTML = {

    offerta: `
      <div class="stitle"><span class="sn">1</span>Nome Offerta</div>
      <div class="og">
        <div class="oc">
          <div class="oc-title">Consumer</div>
          ${["Fastweb Energia Light","Fastweb Energia Full","Fastweb Energia Maxi","Fastweb Energia Flex","Fastweb Energia Fix"]
            .map(o => `<label class="oi" style="opacity:.75">
              <input type="radio" name="em_con" value="${o}" disabled style="accent-color:${ORANGE};width:15px;height:15px">
              <span>${o}</span></label>`).join("")}
        </div>
        <div class="oc">
          <div class="oc-title">Business</div>
          ${["Fastweb Energia Business Flex","Fastweb Energia Business Fix"]
            .map(o => `<label class="oi">
              <input type="radio" name="em_biz" value="${o}">
              <span>${o}</span></label>`).join("")}
        </div>
      </div>`,

    anagrafica: `
      <div class="stitle"><span class="sn">2</span>Dati Anagrafici e di Residenza</div>
      <div class="gr g1">${F("a_rag","Nome e Cognome / Ragione Sociale (se Impresa)","text","Es. Mario Rossi / Azienda Srl")}</div>
      <div class="gr" style="grid-template-columns:2fr 70px 95px">
        ${F("a_ind","Indirizzo di Residenza / Sede Legale","text","Es. Via Roma")}
        ${F("a_num","N°","text","Es. 1")}
        ${F("a_cap","CAP","text","Es. 00100")}
      </div>
      <div class="gr" style="grid-template-columns:1fr 68px">
        ${F("a_com","Comune","text","Es. Roma")}
        ${F("a_prv","Prov.","text","Es. RM")}
      </div>
      <div class="gr g3">
        ${F("a_cf","Codice Fiscale","text","Es. RSSMRA80A01H501A")}
        ${F("a_piv","P.IVA (se Impresa)","text","Es. IT12345678901")}
        ${F("a_ate","ATECO (se Impresa)","text","Es. 35.14.00")}
      </div>
      <div class="gr" style="grid-template-columns:1.6fr 1fr">
        ${F("a_leg","Legale Rappresentante (se Impresa)","text","Es. Mario Rossi")}
        ${F("a_cfl","C.F. Legale Rappresentante","text","Es. RSSMRA80A01H501A")}
      </div>
      <div class="ehr"></div>
      <div class="gr g2">
        ${F("a_tel","Cellulare di Riferimento","tel","Es. +39 3xx xxx xxxx")}
        ${F("a_mai","E-mail","email","Es. nome@azienda.it")}
      </div>
      <div class="gr g1">${F("a_pec","PEC","email","Es. nome@pec.it")}</div>`,

    documento: `
      <div class="stitle"><span class="sn">3</span>Documento di Identità</div>
      <div class="gr g2">
        ${SEL("a_tdc","Tipo di Documento",["Carta d'Identità","Passaporto","Patente di Guida","Permesso di Soggiorno"])}
        ${F("a_ndc","Numero Documento","text","Es. AX1234567")}
      </div>
      <div class="gr g2">
        ${F("a_drl","Data di Rilascio","date","")}
        ${F("a_dsc","Data di Scadenza","date","")}
      </div>
      <div class="gr g2">
        ${F("a_rda","Rilasciato da","text","Es. Comune di Roma")}
        ${F("a_naz","Nazione di Rilascio","text","Italia")}
      </div>`,

    tecnica: `
      <div class="stitle"><span class="sn">4</span>Dati Tecnici di Fornitura</div>
      <div class="ef" style="margin-bottom:16px">
        <label>Tipo di Fornitura</label>
        ${R("t_for",[["singola","Singola"],["multisito","Multisito (compilare l'Allegato Multisito)"]])}
      </div>
      <div class="gr" style="grid-template-columns:2fr 1fr 1fr">
        ${F("t_pod","Codice POD","text","IT001E00000000")}
        ${F("t_kwh","Consumo (kWh/anno)","number","Es. 10000")}
        ${F("t_kw","Pot. Imp. (kW)","number","Es. 6")}
      </div>
      <div class="gr" style="grid-template-columns:2fr 70px 95px">
        ${F("t_ifn","Indirizzo di Fornitura (se diverso da Residenza)","text","Via...")}
        ${F("t_nfn","N°","text","1")}
        ${F("t_cfn","CAP","text","00000")}
      </div>
      <div class="gr" style="grid-template-columns:1fr 68px">
        ${F("t_cfm","Comune","text","Roma")}
        ${F("t_cfp","Prov.","text","RM")}
      </div>
      <div class="ef" style="margin-bottom:11px">
        <label>Tipologia Impianto</label>
        ${R("t_imp",[["monofase","Monofase (230 V)"],["trifase","Trifase (400V)"]])}
      </div>
      <div class="ef" style="margin-bottom:0">
        <label>Tipologia di Titolarità dell'Immobile</label>
        ${RC("t_tit",[
          ["proprieta","Proprietà / Usufrutto / Abitazione per decesso del convivente di fatto"],
          ["locazione","Locazione / Comodato (Atto già registrato o in corso di registrazione)"],
          ["altro","Altro documento che non necessita di registrazione"]
        ])}
      </div>
      <div class="ms-section" id="ms-section">
        <hr class="ms-divider">
        <div class="ms-label">POD Aggiuntivi</div>
        <div class="pod-list" id="ms-pod-list"></div>
        <button class="btn-add-pod" id="ms-add-btn">
          <span class="plus">+</span> Aggiungi POD
        </button>
        <div class="pod-counter" id="pod-counter">
          Totale POD: <span id="pod-count">0</span> aggiuntivi (+ 1 principale)
        </div>
      </div>`,

    pagamento: `
      <div class="stitle"><span class="sn">5</span>Dati di Pagamento</div>
      <div class="inh-banner">↑ I campi evidenziati sono ereditati da Anagrafica — puoi modificarli liberamente.</div>
      <div class="gr g2">
        ${FI("p_int","Nome Cognome Intestatario / Rapp. Legale","text","Nome e Cognome")}
        ${FI("p_rsp","Ragione Sociale","text","Es. Azienda Srl")}
      </div>
      <div class="gr g1">${F("p_iban","IBAN","text","IT60 X054 2811 1010 0000 0123 456")}</div>
      <div class="gr g2">
        ${FI("p_cfi","C.F. Intestatario","text","Codice Fiscale")}
        ${FI("p_pvp","P.IVA (se impresa)","text","IT12345678901")}
      </div>
      <div class="gr g2">
        <div class="ef">
          <label>Tipo Cliente</label>
          ${R("p_tip",[["b2b","B2B"],["b2c","B2C"]])}
        </div>
        ${F("p_sdi","Codice SDI","text","Es. 0000000")}
      </div>`,
  };

  /* ════════════════════════════════════════════════════════
     BUILD MODALE  (Shadow DOM)
  ════════════════════════════════════════════════════════ */
  function build() {
    if (document.getElementById("__emHost")) return;

    // Host element — un div normale nel body
    const host = document.createElement("div");
    host.id = "__emHost";
    document.body.appendChild(host);

    // Crea Shadow DOM
    shadow = host.attachShadow({ mode: "open" });

    // Inietta CSS
    const styleEl = document.createElement("style");
    styleEl.textContent = CSS;
    shadow.appendChild(styleEl);

    // Struttura HTML
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div class="ov" id="ov">
        <div class="box" id="box">

          <div class="hdr" id="hdr">
            <button class="btn-x" id="btn-x">✕</button>
            <h2>Compila Modulistica</h2>
            <p>Richiesta di Preventivo – Fastweb Energia Elettrica</p>
          </div>

          <div class="prog" id="prog">
            <div class="dots" id="dots"></div>
            <div class="plbl">
              <span class="name" id="step-name"></span>
              <span class="num"  id="step-num"></span>
            </div>
          </div>

          <div class="cnt" id="cnt">
            ${STEPS.map(s => `<div class="step" id="step-${s.id}">${STEP_HTML[s.id]}</div>`).join("")}
          </div>

          <div class="act" id="act"></div>

        </div>
      </div>`;
    shadow.appendChild(wrapper);

    // Dots
    const dotsEl = shadow.getElementById("dots");
    STEPS.forEach((_, i) => {
      const d = document.createElement("div");
      d.className = "dot"; d.id = `dot-${i}`;
      dotsEl.appendChild(d);
    });

    // Chiudi overlay al click fuori
    shadow.getElementById("ov").addEventListener("click", e => {
      if (e.target === shadow.getElementById("ov")) closeModal();
    });
    shadow.getElementById("btn-x").addEventListener("click", closeModal);

    // Toggle multisito
    shadow.addEventListener("change", e => {
      if (e.target.name === "t_for") {
        const sec = shadow.getElementById("ms-section");
        if (sec) sec.classList.toggle("visible", e.target.value === "multisito");
      }
    });

    // Bottone Aggiungi POD
    shadow.addEventListener("click", e => {
      if (e.target.closest("#ms-add-btn")) addPod();
    });

    // Validazione live su tutti i campi
    shadow.addEventListener("input",  e => { if (e.target.matches("input:not([type=radio]),select")) vld(e.target); });
    shadow.addEventListener("change", e => { if (e.target.matches("input:not([type=radio]),select")) vld(e.target); });

    // Validazione iniziale (✕ su tutti i campi vuoti)
    shadow.querySelectorAll("input:not([type=radio]),select").forEach(el => vld(el));

    // Sync pagamento da anagrafica
    ["a_rag","a_leg","a_cf","a_cfl","a_piv"].forEach(id => {
      const el = shadow.getElementById(id);
      if (el) el.addEventListener("input", syncPag);
    });

    // Default radio
    [["t_for","singola"],["p_tip","b2b"]].forEach(([nm, val]) => {
      const el = shadow.querySelector(`input[name="${nm}"][value="${val}"]`);
      if (el) el.checked = true;
    });
  }

  /* ════════════════════════════════════════════════════════
     VALIDAZIONE
  ════════════════════════════════════════════════════════ */
  function vld(el) {
    const ic = shadow.getElementById(el.id + "_i");
    if (!ic) return;
    const ok = el.value.trim() !== "";
    ic.className = ok ? "ei ok" : "ei err";
    ic.textContent = ok ? "✓" : "✕";
  }

  /* ════════════════════════════════════════════════════════
     SYNC PAGAMENTO ← ANAGRAFICA
  ════════════════════════════════════════════════════════ */
  function syncPag() {
    const g = id => shadow.getElementById(id)?.value.trim() || "";
    const map = {
      p_int: g("a_leg") || g("a_rag"),
      p_rsp: g("a_rag"),
      p_cfi: g("a_cfl") || g("a_cf"),
      p_pvp: g("a_piv"),
    };
    Object.entries(map).forEach(([id, val]) => {
      const el = shadow.getElementById(id);
      if (el && !el.dataset.edited) { el.value = val; if (val) vld(el); }
    });
  }

  function attachEditFlags() {
    ["p_int","p_rsp","p_cfi","p_pvp"].forEach(id => {
      const el = shadow.getElementById(id);
      if (el) el.addEventListener("input", () => { el.dataset.edited = "1"; }, { once: false });
    });
  }

  /* ════════════════════════════════════════════════════════
     NAVIGAZIONE
  ════════════════════════════════════════════════════════ */
  function renderStep(idx) {
    cur = idx;
    STEPS.forEach((s, i) => {
      shadow.getElementById(`step-${s.id}`)?.classList.toggle("active", i === idx);
      const d = shadow.getElementById(`dot-${i}`);
      if (d) d.className = "dot" + (i < idx ? " done" : i === idx ? " cur" : "");
    });
    shadow.getElementById("step-name").textContent = STEPS[idx].lbl;
    shadow.getElementById("step-num").textContent  = `${idx + 1} / ${STEPS.length}`;

    if (idx === 4) { syncPag(); attachEditFlags(); }

    // Render bottoni azione
    const act   = shadow.getElementById("act");
    act.innerHTML = "";
    const first = idx === 0;
    const last  = idx === STEPS.length - 1;

    const mk = (cls, txt) => {
      const b = document.createElement("button");
      b.className = cls; b.textContent = txt; b.type = "button";
      return b;
    };

    const cl = mk("btn-clear", "🗑 Svuota");
    cl.addEventListener("click", () => clearStep(idx));
    act.appendChild(cl);

    if (first) {
      const c = mk("btn-cancel", "Annulla");
      c.addEventListener("click", closeModal);
      act.appendChild(c);
    } else {
      const b = mk("btn-back", "← Indietro");
      b.addEventListener("click", () => renderStep(cur - 1));
      act.appendChild(b);
    }

    if (!last) {
      const n = mk("btn-next", "Avanti →");
      n.addEventListener("click", () => renderStep(cur + 1));
      act.appendChild(n);
    } else {
      const g = mk("btn-gen", "📄 Genera PDF Modulistica");
      g.addEventListener("click", generatePDF);
      act.appendChild(g);
    }

    shadow.getElementById("box").scrollTop = 0;
  }

  /* ════════════════════════════════════════════════════════
     SVUOTA STEP
  ════════════════════════════════════════════════════════ */
  function clearStep(idx) {
    const stepEl = shadow.getElementById("step-" + STEPS[idx].id);
    if (!stepEl) return;
    stepEl.querySelectorAll("input:not([type=radio]),select").forEach(el => {
      el.value = ""; delete el.dataset.edited; vld(el);
    });
    stepEl.querySelectorAll("input[type=radio]").forEach(el => { el.checked = false; });
    if (idx === 3) {
      const r = stepEl.querySelector('input[name="t_for"][value="singola"]');
      if (r) { r.checked = true; shadow.getElementById("ms-section")?.classList.remove("visible"); }
    }
    if (idx === 4) {
      const r = stepEl.querySelector('input[name="p_tip"][value="b2b"]');
      if (r) r.checked = true;
    }
  }

  /* ════════════════════════════════════════════════════════
     OPEN / CLOSE / PREFILL
  ════════════════════════════════════════════════════════ */
  function openModal()  { shadow.getElementById("ov").classList.add("active"); }
  function closeModal() { shadow.getElementById("ov").classList.remove("active"); }

  function prefill(data) {
    const set = (id, val) => {
      const el = shadow.getElementById(id);
      if (el && val) { el.value = val; vld(el); }
    };
    const offMap = { FIX: "Fastweb Energia Business Fix", FLEX: "Fastweb Energia Business Flex" };
    const ov = offMap[data.offerta] || data.offerta || "";
    if (ov) {
      const rb = shadow.querySelector(`input[name="em_biz"][value="${ov}"]`);
      if (rb) rb.checked = true;
    }
    set("a_rag", data.ragioneSociale);
    set("a_piv", data.piva);
    set("t_pod", data.codicePOD);
    set("t_ifn", data.indirizzoPOD);
  }

  /* ════════════════════════════════════════════════════════
     COLLECT
  ════════════════════════════════════════════════════════ */
  function collect() {
    const v = id => shadow.getElementById(id)?.value.trim() || "";
    const r = nm => shadow.querySelector(`input[name="${nm}"]:checked`)?.value || "";
    return {
      offerta: r("em_biz"),
      consumerOffers: Array.from(shadow.querySelectorAll('input[name="em_con"]:checked')).map(el => el.value),
      rag: v("a_rag"), ind: v("a_ind"), num: v("a_num"), cap: v("a_cap"),
      com: v("a_com"), prv: v("a_prv"), cf:  v("a_cf"),  piv: v("a_piv"), ate: v("a_ate"),
      leg: v("a_leg"), cfl: v("a_cfl"), tel: v("a_tel"), mai: v("a_mai"), pec: v("a_pec"),
      tdc: v("a_tdc"), ndc: v("a_ndc"), drl: v("a_drl"), dsc: v("a_dsc"),
      rda: v("a_rda"), naz: v("a_naz"),
      pod: v("t_pod"), kwh: v("t_kwh"), kw:  v("t_kw"),
      ifn: v("t_ifn"), nfn: v("t_nfn"), cfn: v("t_cfn"), cfm: v("t_cfm"), cfp: v("t_cfp"),
      imp: r("t_imp"), forn: r("t_for"), tit: r("t_tit"),
      extraPods: (() => {
        const pods = [];
        shadow.querySelectorAll("#ms-pod-list .pod-card").forEach(card => {
          const g   = f => card.querySelector(`[data-field="${f}"]`)?.value?.trim() || "";
          const idx = card.dataset.idx;
          pods.push({
            pod: g("pod"), kwh: g("kwh"), kw: g("kw"),
            ifn: g("ifn"), nfn: g("nfn"), cfn: g("cfn"), cfm: g("cfm"), cfp: g("cfp"),
            imp: card.querySelector(`input[name="ms_imp_${idx}"]:checked`)?.value || "",
            tit: card.querySelector(`input[name="ms_tit_${idx}"]:checked`)?.value || "",
          });
        });
        return pods;
      })(),
      int: v("p_int"), rsp: v("p_rsp"), iban: v("p_iban"),
      cfi: v("p_cfi"), pvp: v("p_pvp"), tip: r("p_tip"), sdi: v("p_sdi"),
    };
  }

  /* ════════════════════════════════════════════════════════
     MULTISITO — POD Manager
  ════════════════════════════════════════════════════════ */
  function addPod() {
    podCount++;
    const list = shadow.getElementById("ms-pod-list");
    if (!list) return;

    const idx = podCount;
    const nm  = `pod_${idx}`;

    const card = document.createElement("div");
    card.className  = "pod-card";
    card.id         = nm;
    card.dataset.idx = idx;

    card.innerHTML = `
      <div class="pod-card-hdr" data-pod-toggle="${nm}">
        <div class="pod-badge">
          <span class="pod-num">${idx}</span>
          POD
          <span class="pod-preview" id="${nm}_preview"></span>
        </div>
        <div class="pod-actions">
          <button class="pod-toggle" id="${nm}_chevron" title="Comprimi">&#9662;</button>
          <button class="pod-remove" data-pod-remove="${nm}">✕ Rimuovi</button>
        </div>
      </div>
      <div class="pod-body" id="${nm}_body">
        <div class="gr" style="grid-template-columns:2fr 1fr 1fr">
          <div class="pf"><label>Codice POD</label>
            <div class="pf-w"><input type="text" placeholder="Es. IT001E00000000" data-field="pod" data-pod-id="${nm}"><span class="pi"></span></div></div>
          <div class="pf"><label>Consumo (kWh/anno)</label>
            <div class="pf-w"><input type="number" placeholder="Es. 10000" data-field="kwh"><span class="pi"></span></div></div>
          <div class="pf"><label>Pot. Imp. (kW)</label>
            <div class="pf-w"><input type="number" placeholder="Es. 6" data-field="kw"><span class="pi"></span></div></div>
        </div>
        <div class="gr" style="grid-template-columns:2fr 70px 95px">
          <div class="pf"><label>Indirizzo Fornitura</label>
            <div class="pf-w"><input type="text" placeholder="Es. Via Roma" data-field="ifn"><span class="pi"></span></div></div>
          <div class="pf"><label>N°</label>
            <div class="pf-w"><input type="text" placeholder="Es. 1" data-field="nfn"><span class="pi"></span></div></div>
          <div class="pf"><label>CAP</label>
            <div class="pf-w"><input type="text" placeholder="Es. 00100" maxlength="5" data-field="cfn"><span class="pi"></span></div></div>
        </div>
        <div class="gr" style="grid-template-columns:1fr 68px">
          <div class="pf"><label>Comune</label>
            <div class="pf-w"><input type="text" placeholder="Es. Roma" data-field="cfm"><span class="pi"></span></div></div>
          <div class="pf"><label>Prov.</label>
            <div class="pf-w"><input type="text" placeholder="Es. RM" maxlength="3" data-field="cfp"><span class="pi"></span></div></div>
        </div>
        <div>
          <div class="pod-radio-label">Tipologia Impianto</div>
          <div class="pod-radio-row">
            <label class="pod-radio-item">
              <input type="radio" name="ms_imp_${idx}" value="monofase"> Monofase (230 V)
            </label>
            <label class="pod-radio-item">
              <input type="radio" name="ms_imp_${idx}" value="trifase"> Trifase (400V)
            </label>
          </div>
        </div>
        <div>
          <div class="pod-radio-label">Tipologia Titolarità Immobile</div>
          <div class="pod-radio-col">
            <label class="pod-radio-item">
              <input type="radio" name="ms_tit_${idx}" value="proprieta">
              Proprietà / Usufrutto / Abitazione per decesso del convivente di fatto
            </label>
            <label class="pod-radio-item">
              <input type="radio" name="ms_tit_${idx}" value="locazione">
              Locazione / Comodato (Atto già registrato o in corso di registrazione)
            </label>
            <label class="pod-radio-item">
              <input type="radio" name="ms_tit_${idx}" value="altro">
              Altro documento che non necessita di registrazione
            </label>
          </div>
        </div>
      </div>`;

    // Validazione live sui campi del pod — icona ✓/✕ come nei campi normali
    card.querySelectorAll(".pf input").forEach(inp => {
      inp.addEventListener("input", () => {
        const ok = inp.value.trim() !== "";
        const ic = inp.parentElement.querySelector(".pi");
        if (ic) { ic.className = ok ? "pi ok" : "pi err"; ic.textContent = ok ? "✓" : "✕"; }
        // Aggiorna preview codice POD nell'header
        if (inp.dataset.podId) {
          const prev = shadow.getElementById(inp.dataset.podId + "_preview");
          if (prev) prev.textContent = ok ? " — " + inp.value.trim() : "";
        }
      });
      // Stato iniziale: ✕ su campo vuoto
      const ic = inp.parentElement.querySelector(".pi");
      if (ic) { ic.className = "pi err"; ic.textContent = "✕"; }
    });

    list.appendChild(card);
    updateCounter();

    // Animazione ingresso
    card.style.cssText = "opacity:0;transform:translateY(-6px)";
    requestAnimationFrame(() => {
      card.style.cssText = "transition:opacity .22s ease,transform .22s ease;opacity:1;transform:translateY(0)";
    });
    setTimeout(() => card.querySelector(".pf input")?.focus(), 250);
  }

  // Delegazione eventi pod (toggle / remove)
  function handlePodEvents(e) {
    const toggleTarget = e.target.closest("[data-pod-toggle]");
    const removeTarget = e.target.closest("[data-pod-remove]");

    if (toggleTarget) {
      const id   = toggleTarget.dataset.podToggle;
      const body = shadow.getElementById(id + "_body");
      const btn  = shadow.getElementById(id + "_chevron");
      if (body) body.classList.toggle("collapsed");
      if (btn)  btn.classList.toggle("collapsed");
    }

    if (removeTarget) {
      const id   = removeTarget.dataset.podRemove;
      const card = shadow.getElementById(id);
      if (!card) return;
      card.style.cssText = "transition:opacity .18s,transform .18s;opacity:0;transform:translateY(-6px)";
      setTimeout(() => { card.remove(); renumberPods(); updateCounter(); }, 200);
    }
  }

  function renumberPods() {
    shadow.querySelectorAll("#ms-pod-list .pod-card").forEach((c, i) => {
      const n = c.querySelector(".pod-num");
      if (n) n.textContent = i + 2;
      c.dataset.idx = i + 2;
    });
    podCount = shadow.querySelectorAll("#ms-pod-list .pod-card").length + 1;
  }

  function updateCounter() {
    const n   = shadow.querySelectorAll("#ms-pod-list .pod-card").length;
    const cnt = shadow.getElementById("pod-counter");
    const el  = shadow.getElementById("pod-count");
    if (el)  el.textContent = n;
    if (cnt) cnt.style.display = n > 0 ? "block" : "none";
  }

  /* ════════════════════════════════════════════════════════
     GENERA PDF  — scrive direttamente sui PDF originali
     I PDF blank devono essere nella stessa cartella GitHub:
       - Modulo_energia_preventivo.pdf  (Richiesta Preventivo)
       - Modulo_energia_multisito.pdf   (Allegato Multisito)
  ════════════════════════════════════════════════════════ */

  // Percorso base: stessa cartella dello script
  function _baseUrl() {
    const scripts = document.querySelectorAll("script[src]");
    for (const s of scripts) {
      if (s.src && s.src.includes("engine-mod")) {
        return s.src.substring(0, s.src.lastIndexOf("/") + 1);
      }
    }
    return "./";
  }

  async function _loadPdfLib() {
    if (window.PDFLib) return window.PDFLib;
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";
      s.onload = () => resolve(window.PDFLib);
      s.onerror = () => reject(new Error("pdf-lib non caricata"));
      document.head.appendChild(s);
    });
  }

  async function _fetchPdf(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`PDF non trovato: ${url}`);
    return await res.arrayBuffer();
  }

  // Disegna testo su canvas pdf-lib con wrapping automatico
  function _drawText(page, text, x, y, opts = {}) {
    if (!text) return;
    const { font, size = 8, color, maxWidth } = opts;
    const PDFLib = window.PDFLib;
    const rgb = color || PDFLib.rgb(0, 0, 0);
    page.drawText(String(text), { x, y, size, font, color: rgb, maxWidth });
  }

  // Disegna una X (checkmark) in posizione
  function _drawCheck(page, x, y, checked, opts = {}) {
    if (!checked) return;
    const PDFLib = window.PDFLib;
    const { font, size = 7 } = opts;
    page.drawText("✓", { x, y, size, font, color: PDFLib.rgb(0, 0, 0) });
  }

  // Disegna caratteri in celle separate (stile codice fiscale)
  function _drawCells(page, value, x, y, cellWidth, count, font, size = 7) {
    const chars = String(value || "").replace(/\s/g, "").toUpperCase().split("");
    for (let i = 0; i < count; i++) {
      const cx = x + i * cellWidth;
      if (chars[i]) {
        _drawText(page, chars[i], cx + cellWidth * 0.2, y, { font, size });
      }
    }
  }

  // Formatta data da YYYY-MM-DD a DD/MM/YYYY
  function _fmtDate(s) {
    if (!s) return "";
    const p = s.split("-");
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : s;
  }

  async function _fillPreventivo(pdfBytes, d, _fontUnused) {
    const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const font   = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages  = pdfDoc.getPages();
    const page   = pages[0];
    const { height } = page.getSize(); // 841.89

    // top = distanza da cima pagina (pdfplumber coords)
    // pdf_y = height - top
    // Testo inserito: label_top + 1 per stare subito sotto la label
    const SZ = 9; // font size base
    const T  = (txt, x, top, sz = SZ) => txt && _drawText(page, txt, x, height - top, { font, size: sz });
    const CK = (ok, x, top)           => ok  && page.drawText("X", { x, y: height - top, size: SZ, font, color: rgb(0,0,0) });
    const CL = (val, x, top, cw, n)   => _drawCells(page, val, x, height - top, cw, n, font, SZ - 1);

    // ── NOME OFFERTA ──
    // Checkbox a sx di ogni offerta (piccolo quadratino)
    // Posizioni rilevate: Consumer col1 x≈36, col2 x≈163, Business x≈294
    // y: Light=173.7, Full=184.7, Maxi=195.7, Flex=173.1, Fix=184.1, BizFlex=173.8, BizFix=184.8
    const offerteMap = {
      "Fastweb Energia Light":         [36,  174],
      "Fastweb Energia Full":          [36,  185],
      "Fastweb Energia Maxi":          [36,  196],
      "Fastweb Energia Flex":          [163, 174],
      "Fastweb Energia Fix":           [163, 185],
      "Fastweb Energia Business Flex": [294, 174],
      "Fastweb Energia Business Fix":  [294, 185],
    };
    Object.entries(offerteMap).forEach(([name, [x, top]]) => {
      const sel = d.offerta === name || (d.consumerOffers && d.consumerOffers.includes(name));
      CK(sel, x, top);
    });

    // ── DATI ANAGRAFICI ──
    // NOTA: T() con top=label_y+1 → appare 1.4pt sotto la label (riga pari: label_y=xxx.3)
    //       T() con top=label_y   → appare 0.6pt SOPRA la label (riga dispari) → serve +1 extra
    // Regola: passare top = label_y + 2 per testo testo; CL (celle) = label_y + 1
    T(d.rag,  195, 232, SZ);    // label y=230.3
    T(d.ind,  195, 252, SZ);    // label y=250.3
    T(d.num,  452, 252, SZ);
    CL(d.cap, 492, 252, 7.5, 5);
    T(d.com,  195, 281, SZ);    // label y=279.3 (era 280 → era 0.6pt sopra)
    CL(d.prv, 516, 281, 9, 2);
    CL(d.cf,   87, 300, 7.5, 16); // label y=299.3 — celle OK con +1
    CL(d.piv, 310, 300, 7.5, 11);
    CL(d.ate, 490, 300, 7.5, 8);
    T(d.leg,  195, 321, SZ);    // label y=319.3 (era 320 → era 0.6pt sopra)
    CL(d.cfl,  87, 340, 7.5, 16); // label y=339.3 — celle OK

    // Documento — label y=359.3
    T(d.tdc,   87, 361, SZ);    // era 360 → 0.6pt sopra
    T(d.ndc,  360, 361, SZ);
    // Data rilascio — label y=379.3 — celle OK con +1
    const drl = _fmtDate(d.drl);
    if (drl) {
      const [dd, mm, yyyy] = drl.split("/");
      CL(dd,    87, 380, 8.5, 2);
      CL(mm,   112, 380, 8.5, 2);
      CL(yyyy, 137, 380, 8.5, 4);
    }
    const dsc = _fmtDate(d.dsc);
    if (dsc) {
      const [dd, mm, yyyy] = dsc.split("/");
      CL(dd,   213, 380, 8.5, 2);
      CL(mm,   238, 380, 8.5, 2);
      CL(yyyy, 263, 380, 8.5, 4);
    }
    // Rilasciato da — label y=399.3
    T(d.rda,   87, 401, SZ);    // era 400 → 0.6pt sopra
    T(d.naz || "ITALIA", 350, 401, SZ);
    // Cellulare — label y=419.2 — celle OK
    CL((d.tel||"").replace(/[\s+]/g,""), 148, 420, 7.5, 13);
    // Email — label y=439.3
    if (d.mai) {
      const [lp, dom] = d.mai.split("@");
      T(lp,   87, 441, SZ);     // era 440 → 0.6pt sopra
      if (dom) T(dom, 305, 441, SZ);
    }
    // PEC — label y=455.3
    if (d.pec) {
      const [lp, dom] = d.pec.split("@");
      T(lp,   87, 457, SZ);     // era 456 → 0.6pt sopra
      if (dom) T(dom, 305, 457, SZ);
    }

    // ── DATI TECNICI ──
    // label POD y=491.8 → celle a 492
    const isMulti = d.forn === "multisito";
    if (!isMulti) {
      CL(d.pod,  87, 492, 7.5, 14);
      CL(d.kwh, 300, 492, 7.5, 8);
      CL(d.kw,  415, 492, 7.5, 6);
      // Indirizzo fornitura — label y=511.8 → testo a 512
      T(d.ifn,  140, 512, SZ);
      T(d.nfn,  447, 512, SZ);
      CL(d.cfn, 492, 513, 7.5, 5);
      // Comune — label y=540.8 → testo a 541
      T(d.cfm,   87, 541, SZ);
      CL(d.cfp, 516, 541, 9, 2);
    }
    // Tipologia impianto — label "Monofase" y=560.7, checkbox a x≈100 / x≈175
    CK(!isMulti && d.imp === "monofase", 100, 561);
    CK(!isMulti && d.imp === "trifase",  175, 561);
    // Tipo fornitura — "Singola" y=560.8 x=325, "Multisito" x=360
    CK(d.forn === "singola",   317, 561);
    CK(d.forn === "multisito", 353, 561);
    // Titolarità — label y=576.8, Proprietà x≈150; Locazione y=589.4 x≈38; Altro x≈265
    CK(!isMulti && d.tit === "proprieta", 150, 577);
    CK(!isMulti && d.tit === "locazione",  38, 590);
    CK(!isMulti && d.tit === "altro",     265, 590);

    // ── DATI PAGAMENTO ──
    // label y=626.5 → testo a 627
    T(d.int,  195, 627, SZ);
    T(d.rsp,  390, 627, SZ);
    // CF intestatario — label y=646.5 → celle a 647
    CL(d.cfi,   87, 647, 7.5, 16);
    // IBAN — label y=641.7 x=245 → celle da 260, stessa riga y=647
    const ibanClean = (d.iban||"").replace(/\s/g,"").toUpperCase();
    _drawCells(page, ibanClean, 260, height - 647, 8.2, 27, font, SZ - 1);
    // PIVA pag — label y=666.5 → celle a 667
    CL(d.pvp,   87, 667, 7.5, 11);
    // B2C/B2B checkbox — y=666.5, B2C x=228, B2B x=258
    CK(d.tip === "b2c", 228, 667);
    CK(d.tip === "b2b", 258, 667);
    // SDI — celle da x=328
    CL(d.sdi, 328, 667, 7.5, 7);

    // ── DATE FIRMA ──
    const todayStr = new Date().toLocaleDateString("it-IT", { day:"2-digit", month:"2-digit", year:"numeric" });
    T(todayStr, 87, 714, SZ); // prima firma
    T(todayStr, 87, 778, SZ); // seconda firma

    return await pdfDoc.save();
  }

  async function _fillMultisito(pdfBytes, d, allPods, _fontUnused) {
    const { PDFDocument, StandardFonts, rgb } = window.PDFLib;
    const chunks = [];
    for (let i = 0; i < allPods.length; i += 4) chunks.push(allPods.slice(i, i + 4));
    const mergedDoc = await PDFDocument.create();
    const SZ = 9;

    for (const chunk of chunks) {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const font   = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages  = pdfDoc.getPages();
      const page   = pages[0];
      const { height } = page.getSize();

      const T  = (txt, x, top, sz = SZ) => txt && _drawText(page, txt, x, height - top, { font, size: sz });
      const CK = (ok, x, top)           => ok  && page.drawText("X", { x, y: height - top, size: SZ, font, color: rgb(0,0,0) });
      const CL = (val, x, top, cw, n)   => _drawCells(page, val, x, height - top, cw, n, font, SZ - 1);

      // ── DATI ANAGRAFICI MULTISITO ──
      // label y=87.9 → T() top=89 (label_y + 1 per righe "pari" .9)
      // label y=107.9 → T() top=109 (label_y + 1, pari .9 → OK)
      // label y=136.9 → T() top=138 (label_y + 1)
      // label y=196.9 → T() top=198 (pari .9 → OK)
      // label y=212.9 → T() top=214 (pari .9 → OK)
      T(d.rag,  195,  90, SZ);   // label=87.9
      T(d.ind,  195, 110, SZ);   // label=107.9
      T(d.num,  452, 110, SZ);
      CL(d.cap, 492, 109, 7.5, 5);
      T(d.com,  195, 139, SZ);   // label=136.9
      CL(d.prv, 516, 137, 9, 2);
      CL(d.cf,   87, 158, 7.5, 16);
      CL(d.piv, 310, 158, 7.5, 11);
      const tel2 = (d.tel||"").replace(/[\s+]/g,"");
      CL(tel2,  148, 178, 7.5, 13);
      if (d.mai) {
        const [lp, dom] = d.mai.split("@");
        T(lp,  87, 199, SZ); if (dom) T(dom, 305, 199, SZ);  // label=196.9
      }
      if (d.pec) {
        const [lp, dom] = d.pec.split("@");
        T(lp,  87, 215, SZ); if (dom) T(dom, 305, 215, SZ);  // label=212.9
      }

      // ── BLOCCHI POD ──
      // Posizioni esatte dai label del PDF multisito:
      // Blocco 1: POD=254.1, IFN=274.1, COM=294.1, POT=314.1, TIT=330.4, LOC=343.6
      // Blocco 2: POD=369.0, IFN=389.0, COM=409.0, POT=429.0, TIT=445.3, LOC=458.4
      // Blocco 3: POD=483.8, IFN=503.8, COM=523.8, POT=543.8, TIT=560.1, LOC=573.2
      // Blocco 4: POD=598.7, IFN=618.7, COM=638.7, POT=658.7, TIT=674.9, LOC=688.1
      const POD_ROWS = [
        { pod:255, ifn:275, nfn_x:447, cfn_x:492, com:295, prv_x:516, pot:315, imp:315, kwh_x:301, tit:331, loc:345, alt:345 },
        { pod:370, ifn:390, nfn_x:447, cfn_x:492, com:410, prv_x:516, pot:430, imp:430, kwh_x:301, tit:446, loc:459, alt:459 },
        { pod:485, ifn:505, nfn_x:447, cfn_x:492, com:525, prv_x:516, pot:545, imp:545, kwh_x:301, tit:561, loc:574, alt:574 },
        { pod:600, ifn:620, nfn_x:447, cfn_x:492, com:640, prv_x:516, pot:660, imp:660, kwh_x:301, tit:676, loc:689, alt:689 },
      ];

      chunk.forEach((p, i) => {
        const r = POD_ROWS[i];
        CL(p.pod,  87,      r.pod, 7.5, 14);
        T(p.ifn,   87,      r.ifn + 1, SZ);  // T() needs +1 vs CL
        T(p.nfn,   r.nfn_x, r.ifn + 1, SZ);
        CL(p.cfn,  r.cfn_x, r.ifn, 7.5, 5);
        T(p.cfm,   87,      r.com + 1, SZ);
        CL(p.cfp,  r.prv_x, r.com, 9, 2);
        CL(p.kw,   87,      r.pot, 7.5, 6);
        // Impianto checkbox: "Monofase" x≈245, "Trifase" x≈320 (da label y=314.7 x=250/324)
        CK(p.imp === "monofase", 243, r.imp);
        CK(p.imp === "trifase",  322, r.imp);
        CL(p.kwh,  r.kwh_x, r.pot, 7.5, 8);
        // Titolarità: "Proprietà" x≈150, "Locazione" x≈38, "Altro" x≈265
        CK(p.tit === "proprieta", 150, r.tit);
        CK(p.tit === "locazione",  38, r.loc);
        CK(p.tit === "altro",     265, r.alt);
      });

      // Data firma multisito
      const todayStr = new Date().toLocaleDateString("it-IT", { day:"2-digit", month:"2-digit", year:"numeric" });
      T(todayStr, 87, 751, SZ);

      const copiedPages = await mergedDoc.copyPages(pdfDoc, [0]);
      mergedDoc.addPage(copiedPages[0]);
    }

    return await mergedDoc.save();
  }


  function generatePDF() {
    let d   = collect();
    const btn = shadow.querySelector(".btn-gen");
    if (btn) { btn.textContent = "⏳ Generazione PDF..."; btn.disabled = true; }

    // ── DATI DI TEST (rimuovere nella versione definitiva) ──
    const TEST_MODE = true; // ← impostare false per disattivare
    if (TEST_MODE) {
      d = {
        offerta:       "Fastweb Energia Business Fix",
        consumerOffers:[],
        rag:  "Rossi Mario Srl",
        ind:  "Via Roma",    num: "10",   cap: "00185",
        com:  "Roma",        prv: "RM",
        cf:   "RSSMRA80A01H501A",
        piv:  "12345678901",
        ate:  "35140000",
        leg:  "Mario Rossi",
        cfl:  "RSSMRA80A01H501A",
        tdc:  "Carta d'Identità",
        ndc:  "AX1234567",
        drl:  "2020-03-15",
        dsc:  "2030-03-15",
        rda:  "Comune di Roma",
        naz:  "ITALIA",
        tel:  "3331234567",
        mai:  "mario.rossi@azienda.it",
        pec:  "mario.rossi@pec.it",
        pod:  "IT001E00012345678",
        kwh:  "12000",
        kw:   "6",
        ifn:  "Via Roma",    nfn: "10",   cfn: "00185",
        cfm:  "Roma",        cfp: "RM",
        imp:  "monofase",
        forn: "multisito",
        tit:  "proprieta",
        int:  "Mario Rossi",
        rsp:  "Rossi Mario Srl",
        iban: "IT60X0542811101000000123456",
        cfi:  "RSSMRA80A01H501A",
        pvp:  "12345678901",
        tip:  "b2b",
        sdi:  "0000000",
        extraPods: [
          { pod:"IT001E00098765432", kwh:"8000",  kw:"3",
            ifn:"Via Nazionale", nfn:"5", cfn:"00184", cfm:"Roma", cfp:"RM",
            imp:"trifase", tit:"locazione" },
          { pod:"IT001E00011112222", kwh:"15000", kw:"10",
            ifn:"Corso Vittorio", nfn:"22", cfn:"00186", cfm:"Roma", cfp:"RM",
            imp:"monofase", tit:"proprieta" },
          { pod:"IT001E00033334444", kwh:"6000",  kw:"4.5",
            ifn:"Piazza Venezia", nfn:"1", cfn:"00187", cfm:"Roma", cfp:"RM",
            imp:"monofase", tit:"altro" },
        ],
      };
    }
    // ── FINE DATI DI TEST ──

    const isMulti = d.forn === "multisito";
    const allPods = [
      { pod: d.pod, kwh: d.kwh, kw: d.kw, ifn: d.ifn, nfn: d.nfn, cfn: d.cfn, cfm: d.cfm, cfp: d.cfp, imp: d.imp, tit: d.tit },
      ...(d.extraPods || [])
    ];

    const base = _baseUrl();
    const preventivoUrl = base + "Modulo_energia_preventivo.pdf";
    const multisitoUrl  = base + "Modulo_energia_multisito.pdf";

    (async () => {
      await _loadPdfLib();

      // ── Carica PDF blank ──
      const prevBytes = await _fetchPdf(preventivoUrl);
      const prevFilled = await _fillPreventivo(prevBytes, d, null);

      let finalBytes;
      if (!isMulti) {
        finalBytes = prevFilled;
      } else {
        const multiBytes = await _fetchPdf(multisitoUrl);
        const multiFilled = await _fillMultisito(multiBytes, d, allPods, null);

        // Unisci i due PDF
        const { PDFDocument: PD2 } = window.PDFLib;
        const merged  = await PD2.create();
        const doc1    = await PD2.load(prevFilled);
        const doc2    = await PD2.load(multiFilled);
        const pages1  = await merged.copyPages(doc1, doc1.getPageIndices());
        const pages2  = await merged.copyPages(doc2, doc2.getPageIndices());
        pages1.forEach(p => merged.addPage(p));
        pages2.forEach(p => merged.addPage(p));
        finalBytes = await merged.save();
      }

      // ── Download ──
      const blob = new Blob([finalBytes], { type: "application/pdf" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "Modulo_FW_Energia.pdf";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 1000);

      if (btn) { btn.textContent = "📄 Genera PDF Modulistica"; btn.disabled = false; }
      closeModal();
    })().catch(err => {
      console.error("PDF error:", err);
      if (btn) { btn.textContent = "📄 Genera PDF Modulistica"; btn.disabled = false; }
      alert("Errore generazione PDF: " + err.message + "\n\nAssicurati che i file PDF blank siano nella stessa cartella dello script su GitHub.");
    });

    /* ── NOTA: il vecchio codice html/canvas/jsPDF è stato rimosso.
       La logica del form (collect, validazione, multisito, POD) rimane invariata.
       I PDF blank da cui leggere sono:
         - Modulo_energia_preventivo.pdf
         - Modulo_energia_multisito.pdf
       (stessa cartella di engine-mod.js su GitHub)
    ── */

  

  }

  /* ════════════════════════════════════════════════════════
     ENTRY POINT
  ════════════════════════════════════════════════════════ */
  G.openModulistica = function (data) {
    // Reset guard per permettere rebuild se necessario
    if (!document.getElementById("__emHost")) {
      build();
      // Attacca delegazione eventi POD dopo build
      shadow.addEventListener("click", handlePodEvents);
    }
    renderStep(0);
    prefill(data || {});
    openModal();
  };

})(window);
