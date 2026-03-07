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
    {id:"firma",      lbl:"Firma"},
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

    <!-- ── 5: FIRMA ── -->
    <div class="em-step" id="ems-firma">
      <div class="em-stitle"><span class="em-sn">6</span>Luogo e Data di Firma</div>
      <p style="font-size:12px;color:#7a8099;margin:-4px 0 14px;line-height:1.5">
        La firma sarà apposta manualmente sul documento cartaceo.
      </p>
      <div class="gr gr2">
        ${F("f_ld1","Firma 1 — Luogo e Data","text","Es. Roma, 07/03/2026")}
        ${F("f_ld2","Firma 2 — Luogo e Data (B2B)","text","Es. Roma, 07/03/2026")}
      </div>
    </div>

  </div><!-- /cnt -->
  <div id="__emAct"></div>
</div>`;
    document.body.appendChild(ov);

    // chiudi overlay
    ov.addEventListener("click", e => { if(e.target===ov) closeModal(); });
    document.getElementById("__emX").addEventListener("click", closeModal);

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
      int:v("p_int"), rsp:v("p_rsp"), iban:v("p_iban"),
      cfi:v("p_cfi"), pvp:v("p_pvp"), tip:r("p_tip"), sdi:v("p_sdi"),
      ld1:v("f_ld1"), ld2:v("f_ld2"),
    };
  }

  /* ════════════════════════════════════════════════════
     GENERA PDF  — identico a Modulo_energia_monosito.pdf
  ════════════════════════════════════════════════════ */
  function generatePDF() {
    const d = collect();
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
      <div class="fline">${d.ld1 ? `<span class="fv">${e(d.ld1)}</span>` : `${dots(14)}<span style="color:#aaa">/</span>${dots(6)}<span style="color:#aaa">/</span>${dots(8)}`}</div>
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
      <div class="fline">${d.ld2 ? `<span class="fv">${e(d.ld2)}</span>` : `${dots(14)}<span style="color:#aaa">/</span>${dots(6)}<span style="color:#aaa">/</span>${dots(8)}`}</div>
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

    function doDownload() {
      // Crea iframe nascosto con l'HTML
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:none;";
      document.body.appendChild(iframe);
      iframe.contentDocument.open();
      iframe.contentDocument.write(html);
      iframe.contentDocument.close();

      // Aspetta rendering completo poi misura altezza reale del body
      const iBody = iframe.contentDocument.body;
      // Forza altezza iframe uguale al body per evitare pagina bianca
      iframe.style.height = iBody.scrollHeight + 'px';
      setTimeout(() => {
        const iDoc = iframe.contentDocument.documentElement;
        window.html2canvas(iDoc, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          width: 794,
          height: iBody.scrollHeight,
          windowWidth: 794,
          windowHeight: iBody.scrollHeight,
          logging: false,
        }).then(canvas => {
          const imgData = canvas.toDataURL("image/jpeg", 0.95);
          const { jsPDF } = window.jspdf;
          const pdfW_mm = 210, pdfH_mm = 297;
          // Calcola quanti mm di altezza occupa il canvas (proporzionale alla larghezza A4)
          const canvasH = canvas.height;
          const canvasW = canvas.width;
          const imgH_mm = pdfW_mm * (canvasH / canvasW);
          // Crea PDF con altezza esatta del contenuto — nessuna pagina bianca
          const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: imgH_mm <= pdfH_mm ? "a4" : [pdfW_mm, imgH_mm]
          });
          // Ritaglia il canvas alla sola parte visibile (evita spazio bianco)
          const trimH = Math.min(canvasH, Math.round(canvasW * (pdfH_mm / pdfW_mm)));
          const trimCanvas = document.createElement("canvas");
          trimCanvas.width  = canvasW;
          trimCanvas.height = trimH;
          trimCanvas.getContext("2d").drawImage(canvas, 0, 0, canvasW, trimH, 0, 0, canvasW, trimH);
          const trimData = trimCanvas.toDataURL("image/jpeg", 0.95);
          const trimH_mm = pdfW_mm * (trimH / canvasW);
          pdf.addImage(trimData, "JPEG", 0, 0, pdfW_mm, trimH_mm);
          pdf.save("Modulo_FW_Energia.pdf");
          document.body.removeChild(iframe);
          closeModal();
        }).catch(() => {
          document.body.removeChild(iframe);
          if (btn) { btn.textContent = "📄 Genera PDF Modulistica"; btn.disabled = false; }
          alert("Errore generazione PDF. Riprova.");
        });
      }, 600); // attendi rendering completo
    }

    // Carica librerie se non già presenti
    function loadScript(src, cb) {
      if (document.querySelector(`script[src="${src}"]`)) { cb(); return; }
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
  G.openModulistica = function(data) {
    build(); renderStep(0); prefill(data||{}); openModal();
  };

})(window);
