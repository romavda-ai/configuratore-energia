/**
 * engine-mod.js  v4.0
 * ─ navigazione step-by-step (Avanti / Indietro)
 * ─ ✓ verde / ✕ rosso in tempo reale su ogni campo
 * ─ Pagamento eredita da Anagrafica (modificabile)
 * ─ PDF identico a Modulo_energia_monosito.pdf
 *   • header sezioni arancione #F5A01E testo bianco bold
 *   • logo FASTWEB con W gialla
 *   • celle per CF / PIVA / POD / CAP
 *   • IBAN con celle grandi
 *   • firma con X grande
 *   • footer Fastweb fisso in fondo
 *   • "Settembre 2024" verticale a sinistra
 */
(function (G) {
  "use strict";
  if (G.__engineModReady) return;
  G.__engineModReady = true;

  /* ════════════════════════════════════════════════════
     CSS MODALE
  ════════════════════════════════════════════════════ */
  const CSS = `
#__emOv{display:none;position:fixed;inset:0;background:rgba(8,12,26,.65);
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  align-items:center;justify-content:center;z-index:10000;
  font-family:'DM Sans',system-ui,sans-serif;}
#__emOv.active{display:flex;}

#__emBox{width:min(700px,calc(100vw - 18px));max-height:91vh;overflow-y:auto;
  background:#fff;border-radius:22px;color:#0f1117;
  box-shadow:0 32px 100px rgba(0,0,0,.35);}
#__emBox::-webkit-scrollbar{width:4px;}
#__emBox::-webkit-scrollbar-thumb{background:rgba(0,0,0,.12);border-radius:3px;}

/* header sticky */
#__emHdr{padding:22px 26px 0;position:sticky;top:0;background:#fff;
  border-radius:22px 22px 0 0;z-index:5;}
#__emHdr h2{margin:0 36px 2px 0;font-size:17px;font-weight:800;letter-spacing:-.3px;}
#__emHdr p{font-size:11.5px;color:#7a8099;margin:0 0 12px;}
#__emX{position:absolute;top:14px;right:16px;background:none;border:none;
  font-size:19px;cursor:pointer;color:#7a8099;padding:4px 7px;border-radius:8px;line-height:1;}
#__emX:hover{background:#f0f2f6;color:#0f1117;}

/* progress */
#__emProg{padding:0 26px 12px;}
.em-dots{display:flex;gap:4px;margin-bottom:5px;}
.em-dot{flex:1;height:4px;border-radius:2px;background:#e8eaf0;transition:background .28s;}
.em-dot.done{background:#1a7a3c;}.em-dot.cur{background:#F5A01E;}
.em-plbl{display:flex;justify-content:space-between;font-size:10.5px;}
.em-plbl span:first-child{font-weight:700;color:#0f1117;}
.em-plbl span:last-child{color:#7a8099;}

/* steps */
#__emCnt{padding:4px 26px 0;}
.em-step{display:none;}.em-step.active{display:block;}
.em-stitle{font-size:13px;font-weight:700;padding-bottom:8px;
  border-bottom:2.5px solid #F5A01E;margin-bottom:14px;
  display:flex;align-items:center;gap:8px;}
.em-sn{background:#F5A01E;color:#fff;font-size:11px;font-weight:800;
  width:22px;height:22px;border-radius:50%;
  display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;}

/* griglia */
.gr{display:grid;gap:11px;margin-bottom:11px;}
.gr2{grid-template-columns:1fr 1fr;}
.gr3{grid-template-columns:1fr 1fr 1fr;}
.gr1{grid-template-columns:1fr;}
@media(max-width:520px){.gr2,.gr3{grid-template-columns:1fr;}}

/* campo */
.ef{display:flex;flex-direction:column;gap:4px;}
.ef label{font-size:10px;font-weight:700;color:#7a8099;
  text-transform:uppercase;letter-spacing:.07em;margin:0;}
.ef-w{position:relative;}
.ef input,.ef select{height:40px;padding:0 30px 0 11px;border-radius:9px;
  border:1.5px solid rgba(15,17,23,.14);background:#fff;color:#0f1117;
  font-family:inherit;font-size:13.5px;font-weight:500;outline:none;
  transition:border-color .14s,box-shadow .14s;
  box-shadow:0 1px 2px rgba(15,17,23,.05);width:100%;box-sizing:border-box;}
.ef input:focus,.ef select:focus{border-color:#F5A01E;
  box-shadow:0 0 0 3px rgba(245,160,30,.18);}
.ef input.inh{background:#fffbf0;border-color:rgba(245,160,30,.45);}
.ef input[type=date]{font-size:12px;}
.ef select{appearance:none;-webkit-appearance:none;padding-right:28px;cursor:pointer;}
.ef-arr{position:absolute;right:10px;top:50%;transform:translateY(-50%);
  pointer-events:none;width:0;height:0;
  border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid #7a8099;}
/* icona */
.ei{position:absolute;right:9px;top:50%;transform:translateY(-50%);
  font-size:13px;font-weight:900;pointer-events:none;opacity:0;transition:opacity .18s;line-height:1;}
.ei.ok{color:#1a7a3c;opacity:1;}.ei.err{color:#c42b2b;opacity:1;}
.ef-sw .ei{right:26px;}
/* nota eredità */
.inh-note{font-size:10px;color:#a07010;margin-top:1px;}

/* radio */
.rg{display:flex;flex-wrap:wrap;gap:6px 16px;padding:5px 0;}
.rg label{font-size:13px;font-weight:500;color:#0f1117;cursor:pointer;
  display:flex;align-items:center;gap:6px;text-transform:none;letter-spacing:0;}
.rg input[type=radio]{accent-color:#F5A01E;width:15px;height:15px;}
.rgc{flex-direction:column;gap:6px;}

/* offerta card */
.og{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;}
.oc{border:1.5px solid #e8eaf0;border-radius:10px;padding:11px 13px;
  transition:border-color .15s,background .15s;}
.oc:has(input:checked){border-color:#F5A01E;background:rgba(245,160,30,.06);}
.oct{font-size:9.5px;font-weight:800;text-transform:uppercase;
  letter-spacing:.1em;color:#7a8099;margin-bottom:7px;}
.oi{display:flex;align-items:center;gap:7px;margin-bottom:5px;cursor:pointer;}
.oi input{accent-color:#F5A01E;width:15px;height:15px;flex-shrink:0;}
.oi span{font-size:12.5px;font-weight:500;}

/* hr */
.ehr{height:1px;background:rgba(15,17,23,.07);margin:4px 0 11px;}

/* avviso eredità */
.inh-banner{font-size:11.5px;color:#a07010;background:#fffbf0;
  border:1px solid rgba(245,160,30,.35);border-radius:8px;
  padding:8px 12px;margin:-4px 0 12px;line-height:1.5;}

/* actions */
#__emAct{padding:14px 26px 20px;display:flex;gap:10px;
  border-top:1px solid rgba(15,17,23,.07);margin-top:10px;}
.btn-next{flex:1;padding:12px;border-radius:11px;border:none;
  background:linear-gradient(135deg,#F5A01E,#e08a00);color:#fff;
  font-family:inherit;font-weight:800;font-size:14px;cursor:pointer;
  box-shadow:0 4px 14px rgba(245,160,30,.38);transition:filter .14s,transform .06s;}
.btn-next:hover{filter:brightness(1.08);transform:translateY(-1px);}
.btn-back{padding:12px 16px;border-radius:11px;
  border:1.5px solid rgba(15,17,23,.13);background:rgba(15,17,23,.03);
  color:#0f1117;font-family:inherit;font-weight:700;font-size:14px;
  cursor:pointer;white-space:nowrap;}
.btn-back:hover{background:rgba(15,17,23,.07);}
.btn-gen{flex:2;padding:12px;border-radius:11px;border:none;
  background:linear-gradient(135deg,#1a4a8a,#2255bb);color:#fff;
  font-family:inherit;font-weight:800;font-size:14px;cursor:pointer;
  box-shadow:0 4px 14px rgba(26,74,138,.32);transition:filter .14s,transform .06s;}
.btn-gen:hover{filter:brightness(1.1);transform:translateY(-1px);}
.btn-cancel{padding:12px 14px;border-radius:11px;
  border:1.5px solid rgba(15,17,23,.12);background:transparent;
  color:#7a8099;font-family:inherit;font-weight:600;font-size:13px;cursor:pointer;}
.btn-cancel:hover{background:rgba(15,17,23,.05);}
.btn-clear{padding:12px 14px;border-radius:11px;
  border:1.5px solid rgba(192,42,42,.3);background:rgba(192,42,42,.05);
  color:#c02a2a;font-family:inherit;font-weight:600;font-size:13px;cursor:pointer;white-space:nowrap;}
.btn-clear:hover{background:rgba(192,42,42,.12);}`;

  if (!document.getElementById("__emCSS")) {
    const s = document.createElement("style");
    s.id = "__emCSS"; s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ════════════════════════════════════════════════════
     COSTANTI / STEPS
  ════════════════════════════════════════════════════ */
  const STEPS = [
    {id:"offerta",    lbl:"Offerta"},
    {id:"anagrafica", lbl:"Anagrafica"},
    {id:"documento",  lbl:"Documento"},
    {id:"tecnica",    lbl:"Tecnica"},
    {id:"pagamento",  lbl:"Pagamento"},
  ];
  let cur = 0;

  /* ════════════════════════════════════════════════════
     HTML HELPERS
  ════════════════════════════════════════════════════ */
  const esc = s => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  const F = (id, lbl, type="text", ph="") =>
    `<div class="ef"><label for="${id}">${esc(lbl)}</label>
     <div class="ef-w"><input id="${id}" type="${type}" placeholder="${ph}" autocomplete="off">
     <span class="ei" id="${id}_i"></span></div></div>`;

  const FI = (id, lbl, type="text", ph="") =>
    `<div class="ef"><label for="${id}">${esc(lbl)}</label>
     <div class="ef-w"><input id="${id}" type="${type}" placeholder="${ph}" autocomplete="off" class="inh">
     <span class="ei" id="${id}_i"></span></div>
     <div class="inh-note">↑ da Anagrafica — modificabile</div></div>`;

  const SEL = (id, lbl, opts) =>
    `<div class="ef"><label for="${id}">${esc(lbl)}</label>
     <div class="ef-w ef-sw">
       <select id="${id}"><option value="">— Seleziona —</option>
         ${opts.map(o=>`<option>${esc(o)}</option>`).join("")}</select>
       <span class="ef-arr"></span>
       <span class="ei" id="${id}_i"></span>
     </div></div>`;

  const R = (nm, vals) =>
    `<div class="rg">${vals.map(([v,l])=>
      `<label><input type="radio" name="${nm}" value="${v}"> ${esc(l)}</label>`).join("")}</div>`;

  const RC = (nm, vals) =>
    `<div class="rg rgc">${vals.map(([v,l])=>
      `<label><input type="radio" name="${nm}" value="${v}"> ${esc(l)}</label>`).join("")}</div>`;

  /* ════════════════════════════════════════════════════
     BUILD MODALE
  ════════════════════════════════════════════════════ */
  function build() {
    if (document.getElementById("__emOv")) return;
    const ov = document.createElement("div");
    ov.id = "__emOv";
    ov.innerHTML = `
<div id="__emBox">
  <div id="__emHdr">
    <button id="__emX" type="button">✕</button>
    <h2>Compila Modulistica</h2>
    <p>Richiesta di Preventivo – Fastweb Energia Elettrica</p>
  </div>
  <div id="__emProg">
    <div class="em-dots" id="__emDots"></div>
    <div class="em-plbl"><span id="__emLN"></span><span id="__emLC"></span></div>
  </div>
  <div id="__emCnt">

    <!-- ── 0: OFFERTA ── -->
    <div class="em-step" id="ems-offerta">
      <div class="em-stitle"><span class="em-sn">1</span>Nome Offerta</div>
      <div class="og">
        <div class="oc">
          <div class="oct">Consumer</div>
          ${["Fastweb Energia Light","Fastweb Energia Full","Fastweb Energia Maxi","Fastweb Energia Flex","Fastweb Energia Fix"]
            .map(o=>`<label class="oi" style="cursor:default;opacity:.85"><input type="radio" name="em_con_frozen" value="${o}" disabled style="accent-color:#F5A01E;width:15px;height:15px;cursor:default"><span>${o}</span></label>`).join("")}
        </div>
        <div class="oc">
          <div class="oct">Business</div>
          ${["Fastweb Energia Business Flex","Fastweb Energia Business Fix"]
            .map(o=>`<label class="oi"><input type="radio" name="em_biz" value="${o}"><span>${o}</span></label>`).join("")}
        </div>
      </div>
    </div>

    <!-- ── 1: ANAGRAFICA ── -->
    <div class="em-step" id="ems-anagrafica">
      <div class="em-stitle"><span class="em-sn">2</span>Dati Anagrafici e di Residenza</div>
      <div class="gr gr1">${F("a_rag","Nome e Cognome / Ragione Sociale (se Impresa)","text","Es. Mario Rossi / Azienda Srl")}</div>
      <div class="gr" style="grid-template-columns:2fr 70px 95px">
        ${F("a_ind","Indirizzo di Residenza / Sede Legale","text","Via/Piazza...")}
        ${F("a_num","N°","text","1")}
        ${F("a_cap","CAP","text","00000")}
      </div>
      <div class="gr" style="grid-template-columns:1fr 68px">
        ${F("a_com","Comune","text","Roma")}
        ${F("a_prv","Prov.","text","RM")}
      </div>
      <div class="gr gr3">
        ${F("a_cf","Codice Fiscale","text","RSSMRA80A01H501A")}
        ${F("a_piv","P.IVA (se Impresa)","text","IT12345678901")}
        ${F("a_ate","ATECO (se Impresa)","text","35.14.00")}
      </div>
      <div class="gr" style="grid-template-columns:1.6fr 1fr">
        ${F("a_leg","Nome Cognome Legale Rappresentante (se Impresa)","text","Nome e Cognome")}
        ${F("a_cfl","C.F. Legale Rappresentante","text","Codice Fiscale")}
      </div>
      <div class="ehr"></div>
      <div class="gr gr2">
        ${F("a_tel","Numero di Cellulare di Riferimento","tel","+39 3xx xxx xxxx")}
        ${F("a_mai","E-mail","email","nome@azienda.it")}
      </div>
      <div class="gr gr1">${F("a_pec","PEC","email","nome@pec.it")}</div>
    </div>

    <!-- ── 2: DOCUMENTO ── -->
    <div class="em-step" id="ems-documento">
      <div class="em-stitle"><span class="em-sn">3</span>Documento di Identità</div>
      <div class="gr gr2">
        ${SEL("a_tdc","Tipo di Documento",["Carta d'Identità","Passaporto","Patente di Guida","Permesso di Soggiorno"])}
        ${F("a_ndc","Numero Documento","text","Es. AX1234567")}
      </div>
      <div class="gr gr2">
        ${F("a_drl","Data di Rilascio","date","")}
        ${F("a_dsc","Data di Scadenza","date","")}
      </div>
      <div class="gr gr2">
        ${F("a_rda","Rilasciato da","text","Es. Comune di Roma")}
        ${F("a_naz","Nazione di Rilascio","text","Italia")}
      </div>
    </div>

    <!-- ── 3: TECNICA ── -->
    <div class="em-step" id="ems-tecnica">
      <div class="em-stitle"><span class="em-sn">4</span>Dati Tecnici di Fornitura</div>
      <div class="ef" style="margin-bottom:11px">
        <label>Tipo di Fornitura</label>
        ${R("t_for",[["singola","Singola"],["multisito","Multisito (compilare l'Allegato Multisito)"]])}
      </div>
      <!-- Badge "1 POD" — appare solo quando multisito è selezionato -->
      <div id="pod-main-badge">
        <span class="pod-num">1</span>
        <span style="font-size:12px;font-weight:700;color:#444;letter-spacing:.03em">POD</span>
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
      <!-- ══ SEZIONE POD AGGIUNTIVI (solo multisito) ══ -->
      <div id="multisito-section">
        <hr class="ms-divider">
        <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#999;margin-bottom:10px">POD Aggiuntivi</div>
        <div class="pod-list" id="ms-pod-list"></div>
        <button class="btn-add-pod" onclick="addPod()">
          <span class="plus-icon">+</span> Aggiungi POD
        </button>
        <div class="pod-counter" id="pod-counter" style="display:none">
          Totale POD: <span id="pod-count">0</span> aggiuntivi (+ 1 principale)
        </div>
      </div>
    </div>

    <!-- ── 4: PAGAMENTO ── -->
    <div class="em-step" id="ems-pagamento">
      <div class="em-stitle"><span class="em-sn">5</span>Dati di Pagamento</div>
      <div class="inh-banner">↑ I campi evidenziati sono ereditati da Anagrafica — puoi modificarli liberamente.</div>
      <div class="gr gr2">
        ${FI("p_int","Nome Cognome Intestatario / Rapp. Legale","text","Nome e Cognome")}
        ${FI("p_rsp","Ragione Sociale","text","Es. Azienda Srl")}
      </div>
      <div class="gr gr1">${F("p_iban","IBAN","text","IT60 X054 2811 1010 0000 0123 456")}</div>
      <div class="gr gr2">
        ${FI("p_cfi","C.F. Intestatario","text","Codice Fiscale")}
        ${FI("p_pvp","P.IVA (se impresa)","text","IT12345678901")}
      </div>
      <div class="gr gr2">
        <div class="ef">
          <label>Tipo Cliente</label>
          ${R("p_tip",[["b2b","B2B"],["b2c","B2C"]])}
        </div>
        ${F("p_sdi","Codice SDI","text","Es. 0000000")}
      </div>
    </div>



  </div><!-- /cnt -->
  <div id="__emAct"></div>
</div>`;
    document.body.appendChild(ov);

    // chiudi overlay
    ov.addEventListener("click", e => { if(e.target===ov) closeModal(); });
    document.getElementById("__emX").addEventListener("click", closeModal);
    // Toggle sezione multisito
    ov.addEventListener("change", e => {
      if (e.target.name === "t_for") {
        const on = e.target.value === "multisito";
        const sec   = document.getElementById("multisito-section");
        const badge = document.getElementById("pod-main-badge");
        if (sec)   sec.classList.toggle("visible", on);
        if (badge) badge.classList.toggle("ms-on", on);
      }
    });

    // validazione live — X rossa di default, verde appena compilato
    ov.querySelectorAll("input:not([type=radio]),select").forEach(el => {
      vld(el); // stato iniziale: X rossa
      el.addEventListener("input",  () => vld(el));
      el.addEventListener("change", () => vld(el));
    });

    // sync pagamento quando cambiano i sorgenti anagrafica
    ["a_rag","a_leg","a_cf","a_cfl","a_piv"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("input", syncPag);
    });

    // dots
    const dotsEl = document.getElementById("__emDots");
    STEPS.forEach((_,i) => {
      const d = document.createElement("div");
      d.className = "em-dot"; d.id = `__D${i}`;
      dotsEl.appendChild(d);
    });

    // default radio
    [["t_for","singola"],["p_tip","b2b"]].forEach(([nm,val]) => {
      const el = document.querySelector(`input[name="${nm}"][value="${val}"]`);
      if (el) el.checked = true;
    });

    renderStep(0);
  }

  /* ════════════════════════════════════════════════════
     VALIDAZIONE
  ════════════════════════════════════════════════════ */
  function vld(el) {
    const ic = document.getElementById(el.id + "_i");
    if (!ic) return;
    const ok = el.value.trim() !== "";
    ic.className = ok ? "ei ok" : "ei err";
    ic.textContent = ok ? "✓" : "✕";
  }

  /* ════════════════════════════════════════════════════
     SYNC PAGAMENTO ← ANAGRAFICA
  ════════════════════════════════════════════════════ */
  function syncPag() {
    const g = id => document.getElementById(id)?.value.trim() || "";
    const targets = {
      p_int: g("a_leg") || g("a_rag"),
      p_rsp: g("a_rag"),
      p_cfi: g("a_cfl") || g("a_cf"),
      p_pvp: g("a_piv"),
    };
    Object.entries(targets).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el && !el.dataset.edited) { el.value = val; if(val) vld(el); }
    });
  }

  // Flag "modificato manualmente" sui campi pagamento
  function attachEditFlag() {
    ["p_int","p_rsp","p_cfi","p_pvp"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("input", () => { el.dataset.edited = "1"; });
    });
  }

  /* ════════════════════════════════════════════════════
     SVUOTA STEP CORRENTE
  ════════════════════════════════════════════════════ */
  function clearStep(idx) {
    const stepEl = document.getElementById("ems-" + STEPS[idx].id);
    if (!stepEl) return;
    // svuota input e select
    stepEl.querySelectorAll("input:not([type=radio]),select").forEach(el => {
      el.value = "";
      delete el.dataset.edited;
      vld(el);
    });
    // deseleziona radio
    stepEl.querySelectorAll("input[type=radio]").forEach(el => { el.checked = false; });
    // riapplica default radio per questo step
    if (idx === 3) { // tecnica
      const r = stepEl.querySelector('input[name="t_for"][value="singola"]');
      if (r) r.checked = true;
    }
    if (idx === 4) { // pagamento
      const r = stepEl.querySelector('input[name="p_tip"][value="b2b"]');
      if (r) r.checked = true;
    }
  }

  /* ════════════════════════════════════════════════════
     NAVIGAZIONE
  ════════════════════════════════════════════════════ */
  function renderStep(idx) {
    cur = idx;
    STEPS.forEach((s,i) => {
      document.getElementById("ems-"+s.id)?.classList.toggle("active", i===idx);
      const d = document.getElementById(`__D${i}`);
      if (d) d.className = "em-dot" + (i<idx?" done":i===idx?" cur":"");
    });
    document.getElementById("__emLN").textContent = STEPS[idx].lbl;
    document.getElementById("__emLC").textContent = `${idx+1} / ${STEPS.length}`;

    if (idx === 4) { syncPag(); attachEditFlag(); }

    const act = document.getElementById("__emAct");
    act.innerHTML = "";
    const first = idx===0, last = idx===STEPS.length-1;

    // tasto SVUOTA — sempre primo a sinistra
    const cl = mkBtn("btn-clear","🗑 Svuota"); cl.onclick = () => clearStep(idx); act.appendChild(cl);
    if (first) {
      const c = mkBtn("btn-cancel","Annulla"); c.onclick = closeModal; act.appendChild(c);
    } else {
      const b = mkBtn("btn-back","← Indietro"); b.onclick = ()=>renderStep(cur-1); act.appendChild(b);
    }
    if (!last) {
      const n = mkBtn("btn-next","Avanti →"); n.onclick = ()=>renderStep(cur+1); act.appendChild(n);
    } else {
      const g = mkBtn("btn-gen","📄 Genera PDF Modulistica"); g.onclick = generatePDF; act.appendChild(g);
    }
    document.getElementById("__emBox").scrollTop = 0;
  }

  function mkBtn(cls, txt) {
    const b = document.createElement("button");
    b.className=cls; b.textContent=txt; b.type="button"; return b;
  }

  /* ════════════════════════════════════════════════════
     OPEN / CLOSE / PREFILL
  ════════════════════════════════════════════════════ */
  function openModal()  { document.getElementById("__emOv").classList.add("active"); }
  function closeModal() { document.getElementById("__emOv").classList.remove("active"); }

  function prefill(data) {
    const set = (id,val) => { const el=document.getElementById(id); if(el&&val){el.value=val;vld(el);} };
    const offMap = {FIX:"Fastweb Energia Business Fix",FLEX:"Fastweb Energia Business Flex"};
    const ov = offMap[data.offerta]||data.offerta||"";
    if (ov) {
      // prova prima Business radio
      const rb = document.querySelector(`input[name="em_biz"][value="${ov}"]`);
      if (rb) { rb.checked=true; }
      else {
        // prova Consumer checkbox
        const rc = document.querySelector(`input[name="em_con"][value="${ov}"]`);
        if (rc) rc.checked=true;
      }
    }
    set("a_rag", data.ragioneSociale);
    set("a_piv", data.piva);
    set("t_pod", data.codicePOD);
    set("t_ifn", data.indirizzoPOD);
  }

  /* ════════════════════════════════════════════════════
     COLLECT
  ════════════════════════════════════════════════════ */
  function collect() {
    const v = id => document.getElementById(id)?.value.trim()||"";
    const r = nm => document.querySelector(`input[name="${nm}"]:checked`)?.value||"";
    return {
      offerta:r("em_biz"),
      consumerOffers: Array.from(document.querySelectorAll('input[name="em_con"]:checked')).map(el=>el.value),
      rag:v("a_rag"), ind:v("a_ind"), num:v("a_num"), cap:v("a_cap"),
      com:v("a_com"), prv:v("a_prv"), cf:v("a_cf"), piv:v("a_piv"), ate:v("a_ate"),
      leg:v("a_leg"), cfl:v("a_cfl"), tel:v("a_tel"), mai:v("a_mai"), pec:v("a_pec"),
      tdc:v("a_tdc"), ndc:v("a_ndc"), drl:v("a_drl"), dsc:v("a_dsc"), rda:v("a_rda"), naz:v("a_naz"),
      pod:v("t_pod"), kwh:v("t_kwh"), kw:v("t_kw"),
      ifn:v("t_ifn"), nfn:v("t_nfn"), cfn:v("t_cfn"), cfm:v("t_cfm"), cfp:v("t_cfp"),
      imp:r("t_imp"), forn:r("t_for"), tit:r("t_tit"),
      extraPods: (() => {
        const pods = [];
        document.querySelectorAll('#ms-pod-list .pod-card').forEach(card => {
          const g = f => card.querySelector('[data-field="'+f+'"]')?.value?.trim()||'';
          const idx = card.dataset.idx;
          pods.push({
            pod:g('pod'), kwh:g('kwh'), kw:g('kw'),
            ifn:g('ifn'), nfn:g('nfn'), cfn:g('cfn'), cfm:g('cfm'), cfp:g('cfp'),
            imp: card.querySelector('input[name="ms_imp_'+idx+'"]:checked')?.value||'',
            tit: card.querySelector('input[name="ms_tit_'+idx+'"]:checked')?.value||''
          });
        });
        return pods;
      })(),
      int:v("p_int"), rsp:v("p_rsp"), iban:v("p_iban"),
      cfi:v("p_cfi"), pvp:v("p_pvp"), tip:r("p_tip"), sdi:v("p_sdi"),
    };
  }

  /* ════════════════════════════════════════════════════
     GENERA PDF  — identico a Modulo_energia_monosito.pdf
  ════════════════════════════════════════════════════ */
  function generatePDF() {
    const d = collect();
    const todayStr = new Date().toLocaleDateString("it-IT",{day:"2-digit",month:"2-digit",year:"numeric"});
    const e  = s => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const fd = s => { if(!s)return""; const p=s.split("-"); return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:s; };

    /* ── puntini tratteggiati come sull'originale ── */
    const dots = n => `<span class="dt">${Array(n+1).join(".")}</span>`;

    /* ── valore o puntini ── */
    const V = (val, n=40) => val ? `<span class="fv">${e(val)}</span>` : dots(n);

    /* ── celle quadrate (CF, PIVA, POD, CAP…) ── */
    const CELLS = (val, n) => {
      const ch = (val||"").replace(/\s/g,"").split("");
      return `<span class="cells">${Array.from({length:n},(_,i)=>
        `<span class="cell">${e(ch[i]||"")}</span>`).join("")}</span>`;
    };

    /* ── IBAN: celle grandi con separatori ── */
    const IBAN = val => {
      const ch = (val||"").replace(/\s/g,"").toUpperCase().split("");
      return `<span class="iban">${Array.from({length:27},(_,i)=>
        `<span class="ic">${e(ch[i]||"")}</span>`).join("")}</span>`;
    };

    /* ── checkbox come sull'originale ── */
    const CHK = ok => ok
      ? `<span class="chk chk1">&#x2713;</span>`
      : `<span class="chk chk0"></span>`;

    /* ── header sezione arancione ── */
    const SEC = t => `<div class="sec">${e(t)}</div>`;

    /* ── riga di campo con label e tratteggio ── */
    const FR = (lbl,val,wlbl,mono,n) =>
      `<div class="fr" ${wlbl?`style="flex:${wlbl}"`:""}><div class="fl">${e(lbl)}</div>
       <div class="fline">${mono?CELLS(val,n||16):V(val,n||40)}</div></div>`;

    const LOGO = ``;

    const html = `<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8">
<title>Richiesta di Preventivo – Fastweb Energia</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{font-family:Arial,Helvetica,sans-serif;font-size:8pt;color:#000;
  background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
body{padding:3mm 11mm 20mm;}

/* header */
.top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:3pt;}
.top-left h1{font-size:15pt;font-weight:700;line-height:1.1;margin-bottom:2pt;}
.top-left .sub{font-size:9pt;margin-bottom:2pt;}



/* intro */
.intro{font-size:7.5pt;line-height:1.5;margin-bottom:4pt;}

/* NOME OFFERTA box */
.offerta-box{border:0.5pt solid #bbb;padding:4pt 6pt;margin-bottom:0;}
.off-title{font-size:9pt;font-weight:700;margin-bottom:3pt;}
.off-grid{display:flex;gap:14pt;}
.off-col-title{font-size:7.5pt;font-weight:700;margin-bottom:2.5pt;}
.off-item{display:flex;align-items:center;gap:3pt;margin-bottom:2.5pt;font-size:7.5pt;}

/* sezione header arancione */
.sec{background:#F5A01E;color:#fff;font-size:8.5pt;font-weight:700;
  text-transform:uppercase;letter-spacing:.06em;
  padding:3pt 6pt;margin-top:4pt;margin-bottom:3pt;}

/* righe campi */
.frows{display:flex;flex-wrap:wrap;gap:0 4pt;margin-bottom:3pt;align-items:flex-end;}
.fr{flex:1;min-width:0;}
.fl{font-size:6.5pt;color:#444;margin-bottom:1pt;white-space:nowrap;}
.fline{border-bottom:0.5pt solid #777;min-height:11pt;font-size:8.5pt;
  padding-bottom:1pt;white-space:nowrap;overflow:hidden;}
.dt{color:#bbb;letter-spacing:.5pt;}
.fv{font-weight:400;}

/* celle quadrate */
.cells{display:inline-flex;gap:0;}
.cell{display:inline-block;width:7.5pt;height:9.5pt;border:0.4pt solid #888;
  text-align:center;font-size:6.5pt;line-height:9.5pt;
  font-family:'Courier New',monospace;font-weight:500;}

/* IBAN celle */
.iban{display:inline-flex;gap:1.5pt;flex-wrap:nowrap;}
.ic{display:inline-block;width:8.5pt;height:10.5pt;border:0.5pt solid #555;
  text-align:center;font-size:7pt;line-height:10.5pt;
  font-family:'Courier New',monospace;font-weight:600;}

/* checkbox */
.chk{display:inline-block;width:7.5pt;height:7.5pt;border:0.5pt solid #555;
  vertical-align:middle;margin-right:2pt;
  text-align:center;font-size:6.5pt;line-height:7.5pt;font-weight:900;}
.chk1{background:#000;color:#fff;border-color:#000;}
.chk0{background:#fff;}

/* riga inline radio/check */
.irow{font-size:7.5pt;margin-bottom:2.5pt;display:flex;flex-wrap:wrap;
  align-items:center;gap:2pt 9pt;}
.isep{color:#bbb;margin:0 2pt;}

/* firma */
.firma-wrap{margin-top:5pt;}
.firma-txt{font-size:7pt;line-height:1.5;margin-bottom:3pt;}
.firma-fields{display:flex;gap:10pt;align-items:flex-end;margin-top:3pt;}
.firma-ld{flex:1.3;}
.firma-ld .fl{font-size:7pt;color:#444;}
.firma-ld .fline{border-bottom:0.5pt solid #000;}
.firma-right{flex:1;display:flex;align-items:flex-end;gap:4pt;}
.firma-right .firma-label{font-size:7pt;color:#444;white-space:nowrap;}
.firma-right .fline{flex:1;border-bottom:0.5pt solid #000;}
.firma-x{font-size:22pt;font-weight:900;line-height:1;
  display:inline-block;vertical-align:middle;margin-left:6pt;}


/* ─── Multisito ─── */
#pod-main-badge{display:none;align-items:center;gap:8px;margin-bottom:10px;}
#pod-main-badge.ms-on{display:flex;}
#multisito-section{display:none;margin-top:16px;animation:fadeSlide .25s ease;}
#multisito-section.visible{display:block;}
@keyframes fadeSlide{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
.pod-list{display:flex;flex-direction:column;gap:10px;margin-bottom:12px;}
.pod-card{border:1.5px solid #e8e8e8;border-radius:12px;overflow:hidden;transition:box-shadow .18s;}
.pod-card:focus-within{box-shadow:0 0 0 3px rgba(245,160,30,.18);border-color:#F5A01E;}
.pod-card-header{display:flex;align-items:center;justify-content:space-between;
  padding:9px 14px;background:#fafafa;border-bottom:1px solid #f0f0f0;cursor:pointer;user-select:none;}
.pod-card-header:hover{background:#f5f5f5;}
.pod-badge{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:#444;letter-spacing:.03em;}
.pod-num{background:#F5A01E;color:#fff;border-radius:6px;width:22px;height:22px;
  display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;}
.pod-preview{font-size:11px;color:#aaa;font-weight:400;margin-left:4px;}
.pod-card-actions{display:flex;align-items:center;gap:6px;}
.btn-collapse{background:none;border:none;cursor:pointer;color:#aaa;font-size:16px;
  padding:2px 4px;line-height:1;transition:color .15s,transform .2s;}
.btn-collapse:hover{color:#555;}
.btn-collapse.collapsed{transform:rotate(-90deg);}
.btn-remove{background:none;border:1px solid #f0c0c0;border-radius:7px;cursor:pointer;
  color:#e05555;font-size:12px;padding:3px 8px;font-weight:600;transition:all .15s;line-height:1.4;}
.btn-remove:hover{background:#fff0f0;border-color:#e05555;}
.pod-card-body{padding:14px;display:grid;gap:10px;}
.pod-card-body.collapsed{display:none;}
.btn-add-pod{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;
  padding:11px;border:2px dashed #F5A01E;border-radius:12px;background:#fffbf2;
  color:#d4860a;font-size:13px;font-weight:700;cursor:pointer;transition:all .18s;letter-spacing:.02em;}
.btn-add-pod:hover{background:#fff3d6;border-color:#d4860a;transform:translateY(-1px);
  box-shadow:0 4px 12px rgba(245,160,30,.18);}
.btn-add-pod:active{transform:translateY(0);}
.btn-add-pod .plus-icon{width:22px;height:22px;background:#F5A01E;color:#fff;border-radius:6px;
  display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;flex-shrink:0;}
.pod-counter{text-align:right;font-size:11px;color:#bbb;margin-top:6px;font-weight:500;}
.pod-counter span{color:#F5A01E;font-weight:700;}
.ms-divider{border:none;border-top:1.5px solid #f0f0f0;margin:20px 0 12px;}
/* data verticale */
.side-date{position:fixed;bottom:30mm;left:2mm;
  writing-mode:vertical-rl;transform:rotate(180deg);
  font-size:5pt;color:#999;letter-spacing:.3pt;}

/* footer fisso */
.footer{position:fixed;bottom:4mm;left:11mm;right:11mm;
  font-size:5.5pt;color:#555;text-align:center;
  border-top:0.3pt solid #ccc;padding-top:2pt;line-height:1.6;}

@media print{
  body{padding:2mm 10mm 18mm;}
}
</style></head><body>

<div class="side-date">Settembre 2024</div>

<!-- ══ TOP ══ -->
<div class="top">
  <div class="top-left">
    <h1>RICHIESTA DI PREVENTIVO</h1>
    <div class="sub">Fastweb Energia - Energia Elettrica</div>
  </div>
  <div>${LOGO}</div>
</div>

<!-- ══ INTRO ══ -->
<p class="intro">
  Il cliente, di seguito indicato, richiede a Fastweb S.p.A. Società a socio unico e soggetta all'attività di
  direzione e coordinamento di Swisscom AG, con sede legale e amministrativa in Piazza Adriano Olivetti 1,
  20139 Milano, codice fiscale e partita IVA 12878470150 (di seguito anche solo "Fastweb") il seguente preventivo
  per la fornitura di energia elettrica.
</p>

<!-- ══ NOME OFFERTA ══ -->
<div class="offerta-box">
  <div class="off-title">NOME OFFERTA:</div>
  <div class="off-grid">
    <div>
      <div class="off-col-title">Consumer:</div>
      <div class="off-item">${CHK(d.offerta==="Fastweb Energia Light")} Fastweb Energia Light</div>
      <div class="off-item">${CHK(d.offerta==="Fastweb Energia Full")} Fastweb Energia Full</div>
      <div class="off-item">${CHK(d.offerta==="Fastweb Energia Maxi")} Fastweb Energia Maxi</div>
    </div>
    <div>
      <div class="off-col-title">&nbsp;</div>
      <div class="off-item">${CHK(d.consumerOffers&&d.consumerOffers.includes("Fastweb Energia Flex"))} Fastweb Energia Flex</div>
      <div class="off-item">${CHK(d.consumerOffers&&d.consumerOffers.includes("Fastweb Energia Fix"))} Fastweb Energia Fix</div>
    </div>
    <div>
      <div class="off-col-title">Business:</div>
      <div class="off-item">${CHK(d.offerta==="Fastweb Energia Business Flex")} Fastweb Energia Business Flex</div>
      <div class="off-item">${CHK(d.offerta==="Fastweb Energia Business Fix")} Fastweb Energia Business Fix</div>
    </div>
  </div>
</div>

<!-- ══ DATI ANAGRAFICI ══ -->
${SEC("DATI ANAGRAFICI E DI RESIDENZA")}

<div class="frows">
  <div class="fr"><div class="fl">Nome e Cognome (Ragione Sociale se Impresa)</div>
    <div class="fline">${V(d.rag,70)}</div></div>
</div>

<div class="frows">
  <div class="fr" style="flex:3.5"><div class="fl">Indirizzo di Residenza (Sede Legale se Impresa)</div>
    <div class="fline">${V(d.ind,45)}</div></div>
  <div class="fr" style="flex:.45"><div class="fl">N°</div>
    <div class="fline">${CELLS(d.num,4)}</div></div>
  <div class="fr" style="flex:.75"><div class="fl">CAP</div>
    <div class="fline">${CELLS(d.cap,5)}</div></div>
</div>
<div style="font-size:5pt;color:#555;margin-bottom:1pt;margin-top:-0.5pt">(Sede Legale se Impresa)</div>

<div class="frows">
  <div class="fr" style="flex:4"><div class="fl">Comune</div>
    <div class="fline">${V(d.com,50)}</div></div>
  <div class="fr" style="flex:.5"><div class="fl">Prov.</div>
    <div class="fline">${CELLS(d.prv,2)}</div></div>
</div>

<div class="frows">
  <div class="fr" style="flex:1.3"><div class="fl">Codice Fiscale</div>
    <div class="fline">${CELLS(d.cf,16)}</div></div>
  <div class="fr" style="flex:1.2"><div class="fl">P.IVA (se Impresa)</div>
    <div class="fline">${CELLS(d.piv,11)}</div></div>
  <div class="fr" style="flex:1"><div class="fl">ATECO (se Impresa)</div>
    <div class="fline">${CELLS(d.ate,8)}</div></div>
</div>

<div class="frows">
  <div class="fr" style="flex:1.6"><div class="fl">Nome e Cognome del Legale Rappresentante (se Impresa)</div>
    <div class="fline">${V(d.leg,35)}</div></div>
  <div class="fr" style="flex:1"><div class="fl">C.F. del legale rappresentante (se Impresa)</div>
    <div class="fline">${CELLS(d.cfl,16)}</div></div>
</div>

<div class="frows">
  <div class="fr"><div class="fl">Tipo di Documento</div>
    <div class="fline">${V(d.tdc,28)}</div></div>
  <div class="fr"><div class="fl">Numero Documento</div>
    <div class="fline">${V(d.ndc,28)}</div></div>
</div>

<div class="frows">
  <div class="fr" style="flex:none;margin-right:10pt">
    <div class="fl">Data di rilascio</div>
    <div class="fline">${d.drl ? `<span class="fv">${e(fd(d.drl))}</span>` : `${CELLS("",2)}<span style="font-size:6pt;color:#aaa">/</span>${CELLS("",2)}<span style="font-size:6pt;color:#aaa">/</span>${CELLS("",4)}`}</div>
  </div>
  <div class="fr" style="flex:none">
    <div class="fl">Data di scadenza</div>
    <div class="fline">${d.dsc ? `<span class="fv">${e(fd(d.dsc))}</span>` : `${CELLS("",2)}<span style="font-size:6pt;color:#aaa">/</span>${CELLS("",2)}<span style="font-size:6pt;color:#aaa">/</span>${CELLS("",4)}`}</div>
  </div>
</div>

<div class="frows">
  <div class="fr" style="flex:1.5"><div class="fl">Rilasciato da</div>
    <div class="fline">${V(d.rda,30)}</div></div>
  <div class="fr"><div class="fl">Nazione di Rilascio</div>
    <div class="fline">${d.naz ? V(d.naz) : `<strong>ITALIA</strong>`}</div></div>
</div>

<div class="frows">
  <div class="fr"><div class="fl">Numero di cellulare di riferimento</div>
    <div class="fline">${CELLS(d.tel.replace(/[\s+]/g,""),13)}</div></div>
</div>

<div class="frows">
  <div class="fr"><div class="fl">E-mail</div>
    <div class="fline">${d.mai
      ? V(d.mai)
      : `${dots(30)}<span style="color:#888">@</span>${dots(20)}`
    }</div></div>
</div>
<div class="frows">
  <div class="fr"><div class="fl">PEC</div>
    <div class="fline">${d.pec
      ? V(d.pec)
      : `${dots(30)}<span style="color:#888">@</span>${dots(20)}`
    }</div></div>
</div>

<!-- ══ DATI TECNICI ══ -->
${SEC("DATI TECNICI DI FORNITURA")}

<div class="frows">
  <div class="fr" style="flex:1.6"><div class="fl">Codice POD</div>
    <div class="fline">${CELLS(d.pod,14)}</div></div>
  <div class="fr" style="flex:1.2"><div class="fl">Consumo (kWh/anno)</div>
    <div class="fline">${CELLS(d.kwh,8)}</div></div>
  <div class="fr" style="flex:1"><div class="fl">Pot. Imp. (kW)</div>
    <div class="fline">${CELLS(d.kw,6)}</div></div>
  <div class="fr" style="flex:.5"><div class="fl">Tensione</div>
    <div class="fline"><strong>BT</strong></div></div>
</div>

<div class="frows">
  <div class="fr" style="flex:3.5"><div class="fl">Indirizzo di Fornitura</div>
    <div class="fline">${V(d.ifn,40)}</div></div>
  <div class="fr" style="flex:.45"><div class="fl">N°</div>
    <div class="fline">${CELLS(d.nfn,4)}</div></div>
  <div class="fr" style="flex:.75"><div class="fl">CAP</div>
    <div class="fline">${CELLS(d.cfn,5)}</div></div>
</div>
<div style="font-size:5pt;color:#555;margin-bottom:1pt;margin-top:-0.5pt">(se diverso da Residenza)</div>

<div class="frows">
  <div class="fr" style="flex:4"><div class="fl">Comune</div>
    <div class="fline">${V(d.cfm,50)}</div></div>
  <div class="fr" style="flex:.5"><div class="fl">Prov.</div>
    <div class="fline">${CELLS(d.cfp,2)}</div></div>
</div>

<div class="irow">
  <span>Tipologia impianto:</span>
  ${CHK(d.imp==="monofase")} <span>Monofase (230 V)</span>
  ${CHK(d.imp==="trifase")} <span>Trifase (400V)</span>
  <span class="isep">|</span>
  <span>Tipo di Fornitura:</span>
  ${CHK(d.forn==="singola")} <span>Singola</span>
  ${CHK(d.forn==="multisito")} <span>Multisito (Compilare l'ALLEGATO MULTISITO)</span>
</div>

<div class="irow" style="margin-bottom:1pt">
  <span>Tipologia di titolarità dell'immobile:</span>
  ${CHK(d.tit==="proprieta")} <span>Proprietà/ Usufrutto/ Abitazione per decesso del convivente di fatto</span>
</div>
<div class="irow">
  ${CHK(d.tit==="locazione")} <span>Locazione/ Comodato (Atto già registrato o in corso di registrazione)</span>
  ${CHK(d.tit==="altro")} <span>Altro documento che non necessita di registrazione</span>
</div>

<!-- ══ DATI PAGAMENTO ══ -->
${SEC("DATI DI PAGAMENTO")}

<div class="frows">
  <div class="fr" style="flex:1.5"><div class="fl">Nome e Cognome intestatario/Rapp. Legale</div>
    <div class="fline">${V(d.int,30)}</div></div>
  <div class="fr"><div class="fl">Ragione Sociale</div>
    <div class="fline">${V(d.rsp,30)}</div></div>
</div>

<div class="frows" style="align-items:flex-end">
  <div class="fr" style="flex:.9"><div class="fl">C.F. Intestatario</div>
    <div class="fline">${CELLS(d.cfi,16)}</div></div>
  <div class="fr" style="flex:1.3">
    <div class="fl">IBAN</div>
    <div class="fline">${IBAN(d.iban)}</div>
  </div>
</div>

<div class="frows" style="align-items:center">
  <div class="fr" style="flex:1"><div class="fl">P.IVA (se impresa)</div>
    <div class="fline">${CELLS(d.pvp,11)}</div></div>
  <div class="fr" style="flex:1.4;padding-top:8pt">
    <span>Tipo</span>&nbsp;
    ${CHK(d.tip==="b2c")} <span style="margin-right:6pt">B2C</span>
    ${CHK(d.tip==="b2b")} <span style="margin-right:10pt">B2B</span>
    <span style="font-size:5.5pt;color:#444">Codice SDI</span>&nbsp;${CELLS(d.sdi,7)}
  </div>
</div>

<!-- ══ FIRMA 1 ══ -->
<div class="firma-wrap">
  <p class="firma-txt">
    Dichiaro di volere essere contattato telefonicamente da parte di operatore per conto di Fastweb, in esecuzione delle misure
    precontrattuali, al fine di svolgere le attività amministrative necessarie a perfezionare la conclusione del contratto relativo
    all'offerta sopra indicata.
  </p>
  <div class="firma-fields">
    <div class="firma-ld">
      <div class="fl">Luogo e data</div>
      <div class="fline">${dots(14)}<span style="color:#aaa">/</span>${dots(6)}<span style="color:#aaa">/</span>${dots(8)}</div>
    </div>
    <div class="firma-right">
      <div class="firma-label">Firma</div>
      <div class="fline" style="border-bottom:0.5pt solid #000;flex:1;min-height:12pt">&nbsp;</div>
    </div>
  </div>
</div>

<!-- ══ FIRMA 2 ══ -->
<div class="firma-wrap" style="margin-top:5pt">
  <p class="firma-txt">
    Dichiaro di volere essere contattato telefonicamente da parte di operatore per conto di Fastweb, in esecuzione delle misure
    precontrattuali, al fine di svolgere le attività amministrative necessarie a perfezionare la conclusione del contratto la cui
    proposta è avvenuta nell'ambito di un appuntamento per la proposizione dei servizi
  </p>
  <div style="font-size:6pt;margin-bottom:3pt">
    Fastweb all'azienda&nbsp;<span style="border-bottom:0.4pt solid #000;display:inline-block;min-width:100pt;font-size:7pt">&nbsp;${d.rag?e(d.rag):""}</span>.
  </div>
  <div class="firma-fields">
    <div class="firma-ld">
      <div class="fl">Luogo e data</div>
      <div class="fline"><span class="fv">${todayStr}</span></div>
    </div>
    <div class="firma-right">
      <div class="firma-label">Firma &nbsp;&nbsp;&nbsp;&nbsp; <span class="firma-x">&#x2715;</span></div>
      <div style="border-bottom:0.5pt solid #000;flex:1;min-height:20pt;width:100%">&nbsp;</div>
    </div>
  </div>
</div>

<!-- ══ FOOTER ══ -->
<div class="footer">
  Fastweb S.p.A. - Sede legale e amministrativa Piazza Adriano Olivetti, 1, 20139 Milano Tel. [+39] 02.45451 Capitale Sociale euro 41.344.209,40 i.v. -<br>
  Codice Fiscale, Partita IVA e Iscrizione nel Registro Imprese di Milano 12878470157 Fastweb S.p.A. N. Iscr. Reg. AEE: IT08020000003838 - N. Iscr. Reg. Pile e Acc.: IT09100P00001900 -<br>
  Contributo Ambientale CONAI assolto - Società soggetta all'attività di direzione e coordinamento di Swisscom AG
</div>

</body></html>`;

    // Genera PDF reale via iframe nascosto + jsPDF + html2canvas
    const btn = document.querySelector(".btn-gen");
    if (btn) { btn.textContent = "⏳ Generazione PDF..."; btn.disabled = true; }

    /* ══ Render HTML → PDF page ══ */
    function renderPage(htmlStr, pdfInst, addPage) {
      return new Promise((resolve, reject) => {
        const iframe = document.createElement("iframe");
        iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:none;";
        document.body.appendChild(iframe);
        iframe.contentDocument.open();
        iframe.contentDocument.write(htmlStr);
        iframe.contentDocument.close();
        const iBody = iframe.contentDocument.body;
        iframe.style.height = iBody.scrollHeight + "px";
        setTimeout(() => {
          window.html2canvas(iframe.contentDocument.documentElement, {
            scale:2, useCORS:true, allowTaint:true,
            width:794, height:iBody.scrollHeight,
            windowWidth:794, windowHeight:iBody.scrollHeight, logging:false
          }).then(canvas => {
            const pW=210, pH=297;
            const trimH = Math.min(canvas.height, Math.round(canvas.width*(pH/pW)));
            const tc = document.createElement("canvas");
            tc.width=canvas.width; tc.height=trimH;
            tc.getContext("2d").drawImage(canvas,0,0,canvas.width,trimH,0,0,canvas.width,trimH);
            if (addPage) pdfInst.addPage();
            pdfInst.addImage(tc.toDataURL("image/jpeg",0.95),"JPEG",0,0,pW,pW*(trimH/canvas.width));
            document.body.removeChild(iframe);
            resolve();
          }).catch(err => { document.body.removeChild(iframe); reject(err); });
        }, 700);
      });
    }

    /* ══ Allegato multisito HTML ══ */
    function buildMultisitoPage(pods) {
      const e2 = s => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
      const TX = (v,n) => v ? '<span style="font-weight:400">'+e2(v)+'</span>' : '<span style="color:#bbb">'+'.'.repeat(n||40)+'</span>';
      const CE = (v,n) => {
        const ch=(v||"").replace(/\s/g,"").split("");
        let r=""; for(let k=0;k<n;k++) r+='<span style="display:inline-block;width:7pt;height:9pt;border:0.4pt solid #888;text-align:center;font-size:6pt;line-height:9pt;font-family:Courier New,monospace">'+(ch[k]||"")+"</span>";
        return '<span style="display:inline-flex;gap:0">'+r+"</span>";
      };
      const MK = ok => ok
        ? '<span style="display:inline-block;width:8pt;height:8pt;border:0.5pt solid #555;background:#000;text-align:center;line-height:8pt;font-size:5.5pt;color:#fff">&#x2713;</span>'
        : '<span style="display:inline-block;width:8pt;height:8pt;border:0.5pt solid #555;background:#fff;border:0.5pt solid #555"></span>';

      const podBlocks = pods.map((p,i) => {
        const ro = 'display:flex;gap:4pt;margin-bottom:2pt;align-items:flex-end;';
        const lb = 'font-size:5.5pt;color:#666;margin-bottom:1pt;';
        const bb = 'border-bottom:0.5pt solid #777;';
        return '<div style="border:0.5pt solid #e8c060;border-radius:2pt;padding:4pt 6pt;margin-bottom:5pt;">'
          +'<div style="display:flex;align-items:center;gap:5pt;margin-bottom:3pt;">'
            +'<span style="background:#F5A01E;color:#fff;border-radius:4pt;width:14pt;height:14pt;display:inline-flex;align-items:center;justify-content:center;font-size:8pt;font-weight:800">'+(i+1)+'</span>'
            +'<span style="font-size:7pt;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.05em">POD</span>'
          +'</div>'
          +'<div style="'+ro+'">'
            +'<div style="flex:2"><div style="'+lb+'">Codice POD</div><div style="'+bb+'">'+CE(p.pod,14)+'</div></div>'
            +'<div style="flex:0 0 30pt"><div style="'+lb+'">Tensione</div><div style="font-size:8pt;font-weight:700;padding-bottom:1pt">BT</div></div>'
          +'</div>'
          +'<div style="'+ro+'">'
            +'<div style="flex:2.5"><div style="'+lb+'">Indirizzo di Fornitura</div><div style="'+bb+'font-size:7pt">'+TX(p.ifn,30)+'</div></div>'
            +'<div style="flex:1"><div style="'+lb+'">N\u00b0</div><div style="'+bb+'font-size:7pt">'+TX(p.nfn,4)+'</div></div>'
            +'<div style="flex:1"><div style="'+lb+'">CAP</div><div style="'+bb+'">'+CE(p.cfn,5)+'</div></div>'
            +'<div style="flex:2"><div style="'+lb+'">Comune</div><div style="'+bb+'font-size:7pt">'+TX(p.cfm,20)+'</div></div>'
            +'<div style="flex:0 0 22pt"><div style="'+lb+'">Prov.</div><div style="'+bb+'">'+CE(p.cfp,2)+'</div></div>'
          +'</div>'
          +'<div style="'+ro+'">'
            +'<div style="flex:1"><div style="'+lb+'">Pot. Impegnata (kW)</div><div style="'+bb+'">'+CE(p.kw,6)+'</div></div>'
            +'<div style="flex:0 0 auto;font-size:7pt;padding-bottom:1pt">Tipologia impianto: '+MK(p.imp==="monofase")+' Monofase (230V) &nbsp;'+MK(p.imp==="trifase")+' Trifase (400V)</div>'
            +'<div style="flex:1"><div style="'+lb+'">Consumo (kWh/anno)</div><div style="'+bb+'">'+CE(p.kwh,8)+'</div></div>'
          +'</div>'
          +'<div style="font-size:6.5pt;margin-bottom:1.5pt">Tipologia di titolarit\u00e0 dell\u2019immobile: '+MK(p.tit==="proprieta")+' Propriet\u00e0/ Usufrutto/ Abitazione per decesso del convivente di fatto</div>'
          +'<div style="font-size:6.5pt">'+MK(p.tit==="locazione")+' Locazione/ Comodato (Atto gi\u00e0 registrato o in corso di registrazione) &nbsp;&nbsp;'+MK(p.tit==="altro")+' Altro documento che non necessita di registrazione</div>'
          +'</div>';
      }).join("");

      const tel2 = (d.tel||"").replace(/[\s+]/g,"");
      const rowS = 'display:flex;gap:4pt;margin-bottom:2pt;align-items:flex-end;';
      const lblS = 'font-size:5.5pt;color:#666;margin-bottom:1pt;';
      const botS = 'border-bottom:0.5pt solid #777;';

      return '<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8">'
        +'<title>Allegato Multisito</title><style>'
        +'*{margin:0;padding:0;box-sizing:border-box;}'
        +'html,body{font-family:Arial,Helvetica,sans-serif;font-size:8pt;color:#000;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}'
        +'body{padding:4mm 11mm 20mm;}'
        +'.sec{background:#F5A01E;color:#fff;font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:2.5pt 6pt;margin-bottom:4pt;}'
        +'.footer{position:fixed;bottom:4mm;left:11mm;right:11mm;font-size:5pt;color:#555;text-align:center;border-top:0.3pt solid #ccc;padding-top:2pt;line-height:1.6;}'
        +'.sidedate{position:fixed;bottom:30mm;left:2mm;writing-mode:vertical-rl;transform:rotate(180deg);font-size:5pt;color:#999;letter-spacing:.3pt;}'
        +'</style></head><body>'
        +'<div style="margin-bottom:5pt;">'
          +'<div style="font-size:15pt;font-weight:700;line-height:1.1;">ALLEGATO MULTISITO</div>'
          +'<div style="font-size:8.5pt;color:#444;">Contratto Fastweb Energia \u2022 Energia Elettrica</div>'
        +'</div>'
        +'<div class="sec">DATI ANAGRAFICI E DI RESIDENZA</div>'
        +'<div style="'+rowS+'"><div style="flex:1;"><div style="'+lblS+'">Nome e Cognome (Ragione Sociale se Impresa)</div><div style="'+botS+'font-size:8pt;">'+TX(d.rag,60)+'</div></div></div>'
        +'<div style="'+rowS+'">'
          +'<div style="flex:2.5;"><div style="'+lblS+'">Indirizzo di Residenza (Sede Legale se Impresa)</div><div style="'+botS+'font-size:8pt;">'+TX(d.ind,40)+'</div></div>'
          +'<div style="flex:0 0 auto;"><div style="'+lblS+'">N\u00b0</div><div style="'+botS+'">'+CE(d.num,4)+'</div></div>'
          +'<div style="flex:0 0 auto;"><div style="'+lblS+'">CAP</div><div style="'+botS+'">'+CE(d.cap,5)+'</div></div>'
        +'</div>'
        +'<div style="'+rowS+'">'
          +'<div style="flex:2;"><div style="'+lblS+'">Comune</div><div style="'+botS+'font-size:8pt;">'+TX(d.com,30)+'</div></div>'
          +'<div style="flex:0 0 22pt;"><div style="'+lblS+'">Prov.</div><div style="'+botS+'">'+CE(d.prv,2)+'</div></div>'
        +'</div>'
        +'<div style="'+rowS+'">'
          +'<div style="flex:1;"><div style="'+lblS+'">Codice Fiscale</div><div style="'+botS+'">'+CE(d.cf,16)+'</div></div>'
          +'<div style="flex:1;"><div style="'+lblS+'">P.IVA (se Impresa)</div><div style="'+botS+'">'+CE(d.piv,11)+'</div></div>'
        +'</div>'
        +'<div style="'+rowS+'"><div style="flex:1;"><div style="'+lblS+'">Numero di cellulare</div><div style="'+botS+'">'+CE(tel2,13)+'</div></div></div>'
        +'<div style="'+rowS+'"><div style="flex:1;"><div style="'+lblS+'">E-mail</div><div style="'+botS+'font-size:7.5pt;">'+TX(d.mai,50)+'</div></div></div>'
        +'<div style="'+rowS+'margin-bottom:5pt;"><div style="flex:1;"><div style="'+lblS+'">PEC</div><div style="'+botS+'font-size:7.5pt;">'+TX(d.pec,50)+'</div></div></div>'
        +'<div class="sec">DATI TECNICI DI FORNITURA</div>'
        +'<div style="margin-top:4pt;">'+podBlocks+'</div>'
        +'<div style="margin-top:5pt;border-top:0.5pt solid #ddd;padding-top:4pt;">'
          +'<div style="font-size:7pt;margin-bottom:3pt;"><strong>Il cliente conferma di aver scelto l\u2019offerta</strong> '
          +'<span style="border-bottom:0.5pt solid #000;display:inline-block;min-width:130pt;">&nbsp;</span></div>'
          +'<div style="display:flex;gap:20pt;align-items:flex-end;">'
            +'<div style="flex:0 0 auto;"><div style="font-size:5.5pt;color:#666;margin-bottom:1pt;">Data</div>'
            +'<div style="border-bottom:0.5pt solid #777;font-size:7.5pt;min-width:50pt;padding-bottom:1pt;">'+todayStr+'</div></div>'
            +'<div style="flex:1;font-size:7.5pt;font-weight:700;">TIMBRO E FIRMA DEL CLIENTE '
            +'<span style="font-size:20pt;font-weight:900;vertical-align:middle;">&#x2715;</span>'
            +'<span style="border-bottom:0.5pt solid #000;display:inline-block;min-width:110pt;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>'
            +' &nbsp;&nbsp;Accettato in {data}</div>'
          +'</div>'
        +'</div>'
        +'<div class="sidedate">Settembre 2024</div>'
        +'<div class="footer">Fastweb S.p.A. - Sede legale e amministrativa Piazza Adriano Olivetti, 1, 20139 Milano Tel. [+39] 02.45451 Capitale Sociale euro 41.344.209,40 i.v. -<br>'
        +'Codice Fiscale, Partita IVA e Iscrizione nel Registro Imprese di Milano 12878470157 Fastweb S.p.A. N. Iscr. Reg. AEE: IT08020000003838 - N. Iscr. Reg. Pile e Acc.: IT09100P00001900 -<br>'
        +'Contributo Ambientale CONAI assolto - Societ\u00e0 soggetta all\u2019attivit\u00e0 di direzione e coordinamento di Swisscom AG</div>'
        +'</body></html>';
    }

    /* ══ Download PDF ══ */
    function doDownload() {
      const isMulti = d.forn === "multisito";
      const allPods = [
        {pod:d.pod,kwh:d.kwh,kw:d.kw,ifn:d.ifn,nfn:d.nfn,cfn:d.cfn,cfm:d.cfm,cfp:d.cfp,imp:d.imp,tit:d.tit},
        ...(d.extraPods||[])
      ];
      const {jsPDF} = window.jspdf;
      const pdf = new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});

      renderPage(html, pdf, false).then(() => {
        if (!isMulti) {
          pdf.save("Modulo_FW_Energia.pdf"); closeModal(); return;
        }
        // Allegato multisito: 4 POD per pagina
        const chunks = [];
        for (let i=0; i<allPods.length; i+=4) chunks.push(allPods.slice(i,i+4));
        return chunks.reduce((chain, chunk) =>
          chain.then(() => renderPage(buildMultisitoPage(chunk), pdf, true))
        , Promise.resolve()).then(() => { pdf.save("Modulo_FW_Energia.pdf"); closeModal(); });
      }).catch(err => {
        console.error("PDF error:", err);
        if (btn) { btn.textContent = "📄 Genera PDF Modulistica"; btn.disabled = false; }
        alert("Errore generazione PDF. Riprova.");
      });
    }

    // Carica librerie se non già presenti
    function loadScript(src, cb) {
      if (document.querySelector('script[src="'+src+'"]')) { cb(); return; }
      const s = document.createElement("script");
      s.src = src; s.onload = cb;
      s.onerror = () => alert("Errore caricamento librerie PDF. Verifica la connessione.");
      document.head.appendChild(s);
    }

    if (window.html2canvas && window.jspdf) {
      doDownload();
    } else {
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js", () => {
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", () => {
          doDownload();
        });
      });
    }
  }

  /* ════════════════════════════════════════════════════
     ENTRY POINT
  ════════════════════════════════════════════════════ */
  /* ═══════════════════════════════════════════════════════
     MULTISITO — POD manager  (dalla preview approvata)
  ═══════════════════════════════════════════════════════ */
  let podCount = 1; // POD 1 = principale

  function addPod() {
    podCount++;
    const list = document.getElementById('ms-pod-list');
    if (!list) return;
    const id = 'pod_' + podCount;
    const idx = podCount;

    const card = document.createElement('div');
    card.className = 'pod-card';
    card.id = id;
    card.dataset.idx = idx;

    // Build innerHTML con string concatenation (niente template literals annidati)
    card.innerHTML =
      '<div class="pod-card-header" onclick="togglePod(\'' + id + '\')">'
        + '<div class="pod-badge">'
          + '<span class="pod-num">' + idx + '</span>'
          + 'POD'
          + '<span class="pod-preview" id="' + id + '_preview"></span>'
        + '</div>'
        + '<div class="pod-card-actions">'
          + '<button class="btn-collapse" id="' + id + '_chevron" title="Comprimi">&#9662;</button>'
          + '<button class="btn-remove" onclick="removePod(event,\'' + id + '\')">&#x2715; Rimuovi</button>'
        + '</div>'
      + '</div>'
      + '<div class="pod-card-body" id="' + id + '_body">'
        + '<div class="gr" style="grid-template-columns:2fr 1fr 1fr">'
          + '<div class="ef"><label>Codice POD</label>'
            + '<input class="ef-inp" type="text" placeholder="IT001E00000000"'
            + ' data-field="pod" oninput="validatePod(this);updatePreview(\'' + id + '\',this.value)"></div>'
          + '<div class="ef"><label>Consumo (kWh/anno)</label>'
            + '<input class="ef-inp" type="number" placeholder="Es. 10000" data-field="kwh" oninput="validatePod(this)"></div>'
          + '<div class="ef"><label>Pot. Imp. (kW)</label>'
            + '<input class="ef-inp" type="number" placeholder="Es. 6" data-field="kw" oninput="validatePod(this)"></div>'
        + '</div>'
        + '<div class="gr" style="grid-template-columns:2fr 70px 95px">'
          + '<div class="ef"><label>Indirizzo Fornitura</label>'
            + '<input class="ef-inp" type="text" placeholder="Via..." data-field="ifn" oninput="validatePod(this)"></div>'
          + '<div class="ef"><label>N°</label>'
            + '<input class="ef-inp" type="text" placeholder="1" data-field="nfn" oninput="validatePod(this)"></div>'
          + '<div class="ef"><label>CAP</label>'
            + '<input class="ef-inp" type="text" placeholder="00000" maxlength="5" data-field="cfn" oninput="validatePod(this)"></div>'
        + '</div>'
        + '<div class="gr" style="grid-template-columns:1fr 68px">'
          + '<div class="ef"><label>Comune</label>'
            + '<input class="ef-inp" type="text" placeholder="Roma" data-field="cfm" oninput="validatePod(this)"></div>'
          + '<div class="ef"><label>Prov.</label>'
            + '<input class="ef-inp" type="text" placeholder="RM" maxlength="3" data-field="cfp" oninput="validatePod(this)"></div>'
        + '</div>'
        + '<div class="ef" style="margin-bottom:0"><label>Tipologia Impianto</label>'
          + '<div style="display:flex;gap:18px;margin-top:4px">'
            + '<label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">'
              + '<input type="radio" name="ms_imp_' + idx + '" value="monofase"> Monofase (230 V)</label>'
            + '<label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">'
              + '<input type="radio" name="ms_imp_' + idx + '" value="trifase"> Trifase (400V)</label>'
          + '</div></div>'
        + '<div class="ef" style="margin-bottom:0"><label>Tipologia Titolarità</label>'
          + '<div style="display:flex;flex-direction:column;gap:5px;margin-top:4px">'
            + '<label style="display:flex;align-items:flex-start;gap:6px;font-size:12px;cursor:pointer">'
              + '<input type="radio" name="ms_tit_' + idx + '" value="proprieta" style="margin-top:2px">'
              + ' Proprietà / Usufrutto / Abitazione per decesso del convivente di fatto</label>'
            + '<label style="display:flex;align-items:flex-start;gap:6px;font-size:12px;cursor:pointer">'
              + '<input type="radio" name="ms_tit_' + idx + '" value="locazione" style="margin-top:2px">'
              + ' Locazione / Comodato (Atto già registrato o in corso di registrazione)</label>'
            + '<label style="display:flex;align-items:flex-start;gap:6px;font-size:12px;cursor:pointer">'
              + '<input type="radio" name="ms_tit_' + idx + '" value="altro" style="margin-top:2px">'
              + ' Altro documento che non necessita di registrazione</label>'
          + '</div></div>'
      + '</div>';

    list.appendChild(card);
    updateCounter();

    // Animazione ingresso
    card.style.opacity = '0';
    card.style.transform = 'translateY(-6px)';
    requestAnimationFrame(() => {
      card.style.transition = 'opacity .22s ease, transform .22s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    });
    setTimeout(() => { const fi = card.querySelector('input'); if(fi) fi.focus(); }, 250);
  }

  function removePod(e, id) {
    e.stopPropagation();
    const card = document.getElementById(id);
    if (!card) return;
    card.style.transition = 'opacity .18s, transform .18s';
    card.style.opacity = '0';
    card.style.transform = 'translateY(-6px)';
    setTimeout(() => { card.remove(); renumberPods(); updateCounter(); }, 200);
  }

  function togglePod(id) {
    const body = document.getElementById(id + '_body');
    const btn  = document.getElementById(id + '_chevron');
    if (body) body.classList.toggle('collapsed');
    if (btn)  btn.classList.toggle('collapsed');
  }

  function updatePreview(id, val) {
    const el = document.getElementById(id + '_preview');
    if (el) el.textContent = val ? '— ' + val : '';
  }

  function renumberPods() {
    const cards = document.querySelectorAll('#ms-pod-list .pod-card');
    podCount = cards.length + 1;
    cards.forEach((c, i) => {
      const n = c.querySelector('.pod-num'); if(n) n.textContent = i + 2;
      c.dataset.idx = i + 2;
    });
  }

  function updateCounter() {
    const n   = document.querySelectorAll('#ms-pod-list .pod-card').length;
    const cnt = document.getElementById('pod-counter');
    const el  = document.getElementById('pod-count');
    if (el)  el.textContent = n;
    if (cnt) cnt.style.display = n > 0 ? 'block' : 'none';
  }

  function validatePod(input) {
    const v = input.value.trim();
    input.classList.toggle('valid',   v.length > 0);
    input.classList.toggle('invalid', v.length === 0);
  }


  // Esponi funzioni multisito su window (necessario per onclick nell'HTML del modal)
  G.addPod        = addPod;
  G.removePod     = removePod;
  G.togglePod     = togglePod;
  G.updatePreview = updatePreview;
  G.validatePod   = validatePod;

  G.openModulistica = function(data) {
    build(); renderStep(0); prefill(data||{}); openModal();
  };

})(window);
