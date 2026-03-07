/**
 * engine-mod.js — Motore Modulistica Fastweb Energia v2.0
 * - Navigazione step-by-step (Avanti / Indietro per ogni sezione)
 * - Validazione campo in tempo reale: ✓ verde se compilato, ✕ rosso se svuotato
 * - PDF generato identico all'originale (Arial, layout, bordi, font 7pt)
 * - Nessun campo "pre-compilato" visibile — tutto è editabile normalmente
 * - Espone: window.openModulistica(data)
 */
(function (G) {
  "use strict";
  if (G.__engineModReady) return;
  G.__engineModReady = true;

  /* ─── STILI ──────────────────────────────────────────────────── */
  if (!document.getElementById("__emCSS")) {
    const s = document.createElement("style");
    s.id = "__emCSS";
    s.textContent = `
#__emOv{display:none;position:fixed;inset:0;background:rgba(10,15,30,.62);
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  align-items:center;justify-content:center;z-index:10000;
  font-family:'DM Sans',system-ui,sans-serif;}
#__emOv.active{display:flex;}

#__emBox{width:min(660px,calc(100vw - 18px));max-height:91vh;overflow-y:auto;
  background:#fff;border-radius:22px;position:relative;color:#0f1117;
  box-shadow:0 32px 100px rgba(0,0,0,.32);}
#__emBox::-webkit-scrollbar{width:4px;}
#__emBox::-webkit-scrollbar-thumb{background:rgba(0,0,0,.12);border-radius:3px;}

/* header fisso */
#__emHdr{padding:20px 24px 0;position:sticky;top:0;background:#fff;
  border-radius:22px 22px 0 0;z-index:4;}
#__emHdr h2{margin:0 32px 2px 0;font-size:17px;font-weight:800;letter-spacing:-.3px;}
#__emHdr p{font-size:11.5px;color:#7a8099;margin:0 0 12px;}
#__emCloseBtn{position:absolute;top:14px;right:16px;background:none;border:none;
  font-size:19px;cursor:pointer;color:#7a8099;padding:4px 6px;border-radius:8px;
  line-height:1;transition:background .12s;}
#__emCloseBtn:hover{background:#f0f2f6;color:#0f1117;}

/* progress */
#__emProg{padding:0 24px 12px;}
.em-dots{display:flex;gap:4px;margin-bottom:5px;}
.em-dot{flex:1;height:4px;border-radius:2px;background:#e8eaf0;transition:background .28s;}
.em-dot.em-done{background:#1a7a3c;}
.em-dot.em-cur{background:#FFC800;}
.em-plbl{display:flex;justify-content:space-between;font-size:10.5px;}
.em-plbl-name{font-weight:700;color:#0f1117;}
.em-plbl-count{color:#7a8099;}

/* content */
#__emCnt{padding:2px 24px 0;}
.em-step{display:none;}
.em-step.em-active{display:block;}
.em-stitle{font-size:13px;font-weight:700;padding-bottom:8px;
  border-bottom:2.5px solid #FFC800;margin-bottom:14px;
  display:flex;align-items:center;gap:8px;}
.em-snum{background:#FFC800;color:#0f1117;font-size:11px;font-weight:800;
  width:21px;height:21px;border-radius:50%;
  display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;}

/* griglia */
.emr{display:grid;gap:11px;margin-bottom:11px;}
.emr2{grid-template-columns:1fr 1fr;}
.emr3{grid-template-columns:1fr 1fr 1fr;}
.emr1{grid-template-columns:1fr;}
@media(max-width:500px){.emr2,.emr3{grid-template-columns:1fr;}}

/* campo */
.emf{display:flex;flex-direction:column;gap:4px;}
.emf label{font-size:10px;font-weight:700;color:#7a8099;
  text-transform:uppercase;letter-spacing:.07em;margin:0;}
.emf-wrap{position:relative;}
.emf input,.emf select{height:40px;padding:0 32px 0 11px;border-radius:9px;
  border:1.5px solid rgba(15,17,23,.14);background:#fff;color:#0f1117;
  font-family:inherit;font-size:13.5px;font-weight:500;outline:none;
  transition:border-color .14s,box-shadow .14s;
  box-shadow:0 1px 2px rgba(15,17,23,.05);width:100%;box-sizing:border-box;}
.emf input:focus,.emf select:focus{border-color:#FFC800;
  box-shadow:0 0 0 3px rgba(180,140,0,.16);}
.emf input[type=date]{font-size:12px;}
.emf select{appearance:none;-webkit-appearance:none;cursor:pointer;padding-right:28px;}
.emf-arrow{position:absolute;right:10px;top:50%;transform:translateY(-50%);
  width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;
  border-top:5px solid #7a8099;pointer-events:none;}
/* icona stato */
.em-icon{position:absolute;right:9px;top:50%;transform:translateY(-50%);
  font-size:13px;font-weight:900;pointer-events:none;
  opacity:0;transition:opacity .18s;line-height:1;}
.em-icon.ok{color:#1a7a3c;opacity:1;}
.em-icon.err{color:#c42b2b;opacity:1;}
/* select: sposta freccia a sinistra dell'icona */
.emf-sw .em-icon{right:28px;}

/* radio */
.em-rg{display:flex;flex-wrap:wrap;gap:6px 16px;padding:5px 0;}
.em-rg label{font-size:13px;font-weight:500;color:#0f1117;
  cursor:pointer;display:flex;align-items:center;gap:6px;
  text-transform:none;letter-spacing:0;}
.em-rg input[type=radio]{accent-color:#FFC800;width:15px;height:15px;}
.em-rg-col{flex-direction:column;gap:6px;}

/* offerta */
.em-og{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;}
.em-oc{border:1.5px solid #e8eaf0;border-radius:10px;padding:11px 13px;
  transition:border-color .15s,background .15s;}
.em-oc:has(input:checked){border-color:#FFC800;background:rgba(255,200,0,.06);}
.em-oct{font-size:9.5px;font-weight:800;text-transform:uppercase;
  letter-spacing:.1em;color:#7a8099;margin-bottom:7px;}
.em-oi{display:flex;align-items:center;gap:7px;margin-bottom:5px;cursor:pointer;}
.em-oi input[type=radio]{accent-color:#FFC800;width:15px;height:15px;flex-shrink:0;}
.em-oi span{font-size:12.5px;font-weight:500;}

/* divider */
.emhr{height:1px;background:rgba(15,17,23,.07);margin:6px 0 12px;}

/* actions */
#__emAct{padding:14px 24px 20px;display:flex;gap:10px;
  border-top:1px solid rgba(15,17,23,.07);margin-top:10px;flex-shrink:0;}
.em-next{flex:1;padding:11px;border-radius:11px;border:none;
  background:linear-gradient(135deg,#FFC800,#e6b400);color:#0f1117;
  font-family:inherit;font-weight:800;font-size:14px;cursor:pointer;
  box-shadow:0 4px 14px rgba(255,200,0,.38);transition:filter .14s,transform .06s;}
.em-next:hover{filter:brightness(1.06);transform:translateY(-1px);}
.em-back{padding:11px 16px;border-radius:11px;
  border:1.5px solid rgba(15,17,23,.13);background:rgba(15,17,23,.03);
  color:#0f1117;font-family:inherit;font-weight:700;font-size:14px;
  cursor:pointer;transition:background .12s;white-space:nowrap;}
.em-back:hover{background:rgba(15,17,23,.07);}
.em-gen{flex:2;padding:11px;border-radius:11px;border:none;
  background:linear-gradient(135deg,#1a4a8a,#2255bb);color:#fff;
  font-family:inherit;font-weight:800;font-size:14px;cursor:pointer;
  box-shadow:0 4px 14px rgba(26,74,138,.32);transition:filter .14s,transform .06s;}
.em-gen:hover{filter:brightness(1.1);transform:translateY(-1px);}
.em-cancel{padding:11px 14px;border-radius:11px;
  border:1.5px solid rgba(15,17,23,.12);background:transparent;
  color:#7a8099;font-family:inherit;font-weight:600;font-size:13px;
  cursor:pointer;white-space:nowrap;}
.em-cancel:hover{background:rgba(15,17,23,.05);}
    `;
    document.head.appendChild(s);
  }

  /* ─── STEPS ─────────────────────────────────────────────────── */
  const STEPS = [
    {id:"offerta",   lbl:"Offerta"},
    {id:"anagrafica",lbl:"Anagrafica"},
    {id:"documento", lbl:"Documento"},
    {id:"tecnica",   lbl:"Tecnica"},
    {id:"pagamento", lbl:"Pagamento"},
    {id:"firma",     lbl:"Firma"},
  ];
  let cur = 0;

  /* ─── HELPER HTML ────────────────────────────────────────────── */
  function F(id, lbl, type="text", ph="", extra="") {
    const isSelect = type === "select";
    return `<div class="emf">
      <label for="${id}">${lbl}</label>
      <div class="emf-wrap${isSelect?" emf-sw":""}">
        <input id="${id}" type="${type}" placeholder="${ph}" autocomplete="off" ${extra}/>
        <span class="em-icon" id="${id}_ic"></span>
      </div></div>`;
  }
  function SEL(id, lbl, opts) {
    return `<div class="emf">
      <label for="${id}">${lbl}</label>
      <div class="emf-wrap emf-sw">
        <select id="${id}">
          <option value="">— Seleziona —</option>
          ${opts.map(o=>`<option>${o}</option>`).join("")}
        </select>
        <span class="emf-arrow"></span>
        <span class="em-icon" id="${id}_ic"></span>
      </div></div>`;
  }
  function R(name, vals) { // radio row
    return `<div class="em-rg">${vals.map(([v,l])=>
      `<label><input type="radio" name="${name}" value="${v}"> ${l}</label>`
    ).join("")}</div>`;
  }
  function Rcol(name, vals) {
    return `<div class="em-rg em-rg-col">${vals.map(([v,l])=>
      `<label><input type="radio" name="${name}" value="${v}"> ${l}</label>`
    ).join("")}</div>`;
  }

  /* ─── BUILD DOM ─────────────────────────────────────────────── */
  function buildModal() {
    if (document.getElementById("__emOv")) return;
    const ov = document.createElement("div");
    ov.id = "__emOv";
    ov.innerHTML = `
<div id="__emBox">
  <div id="__emHdr">
    <button id="__emCloseBtn">✕</button>
    <h2>Compila Modulistica</h2>
    <p>Preventivo di Fornitura – Fastweb Energia Elettrica</p>
  </div>
  <div id="__emProg">
    <div class="em-dots" id="__emDots"></div>
    <div class="em-plbl"><span class="em-plbl-name" id="__emLblName"></span><span class="em-plbl-count" id="__emLblCount"></span></div>
  </div>
  <div id="__emCnt">

    <!-- 0: OFFERTA -->
    <div class="em-step" id="ems-offerta">
      <div class="em-stitle"><span class="em-snum">1</span>Nome Offerta</div>
      <div class="em-og">
        <div class="em-oc">
          <div class="em-oct">Consumer</div>
          ${["Fastweb Energia Light","Fastweb Energia Full","Fastweb Energia Maxi","Fastweb Energia Flex","Fastweb Energia Fix"].map(o=>`
          <label class="em-oi"><input type="radio" name="em_off" value="${o}"><span>${o}</span></label>`).join("")}
        </div>
        <div class="em-oc">
          <div class="em-oct">Business</div>
          ${["Fastweb Energia Business Flex","Fastweb Energia Business Fix"].map(o=>`
          <label class="em-oi"><input type="radio" name="em_off" value="${o}"><span>${o}</span></label>`).join("")}
        </div>
      </div>
    </div>

    <!-- 1: ANAGRAFICA -->
    <div class="em-step" id="ems-anagrafica">
      <div class="em-stitle"><span class="em-snum">2</span>Dati Anagrafici e di Residenza</div>
      <div class="emr emr1">${F("em_rag","Nome e Cognome / Ragione Sociale (se Impresa)","text","Es. Azienda Srl")}</div>
      <div class="emr" style="grid-template-columns:2fr 70px 90px">
        ${F("em_ind","Indirizzo di Residenza / Sede Legale (se Impresa)","text","Via/Piazza...")}
        ${F("em_num","N°","text","1")}
        ${F("em_cap","CAP","text","00000")}
      </div>
      <div class="emr" style="grid-template-columns:1fr 65px">
        ${F("em_com","Comune","text","Roma")}
        ${F("em_prv","Prov.","text","RM")}
      </div>
      <div class="emr emr3">
        ${F("em_cf","Codice Fiscale","text","RSSMRA80A01H501A")}
        ${F("em_piv","P.IVA (se Impresa)","text","IT12345678901")}
        ${F("em_ate","ATECO (se Impresa)","text","35.14.00")}
      </div>
      <div class="emr emr2">
        ${F("em_leg","Nome Cognome Legale Rappresentante (se Impresa)","text","Nome e Cognome")}
        ${F("em_cfl","C.F. Legale Rappresentante (se Impresa)","text","Codice Fiscale")}
      </div>
      <div class="emhr"></div>
      <div class="emr emr2">
        ${F("em_tel","Numero di Cellulare di Riferimento","tel","+39 3xx xxx xxxx")}
        ${F("em_mai","E-mail","email","nome@azienda.it")}
      </div>
      <div class="emr emr1">${F("em_pec","PEC","email","nome@pec.it")}</div>
    </div>

    <!-- 2: DOCUMENTO -->
    <div class="em-step" id="ems-documento">
      <div class="em-stitle"><span class="em-snum">3</span>Documento di Identità</div>
      <div class="emr emr2">
        ${SEL("em_tdc","Tipo di Documento",["Carta d'Identità","Passaporto","Patente di Guida","Permesso di Soggiorno"])}
        ${F("em_ndc","Numero Documento","text","Es. AX1234567")}
      </div>
      <div class="emr emr2">
        ${F("em_drl","Data di Rilascio","date","")}
        ${F("em_dsc","Data di Scadenza","date","")}
      </div>
      <div class="emr emr2">
        ${F("em_rda","Rilasciato da","text","Es. Comune di Roma")}
        ${F("em_naz","Nazione di Rilascio","text","Italia")}
      </div>
    </div>

    <!-- 3: TECNICA -->
    <div class="em-step" id="ems-tecnica">
      <div class="em-stitle"><span class="em-snum">4</span>Dati Tecnici di Fornitura</div>
      <div class="emr" style="grid-template-columns:2fr 1fr 1fr">
        ${F("em_pod","Codice POD","text","IT001E00000000")}
        ${F("em_kwh","Consumo (kWh/anno)","number","Es. 10000")}
        ${F("em_kw","Pot. Imp. (kW)","number","Es. 6")}
      </div>
      <div class="emr" style="grid-template-columns:2fr 70px 90px">
        ${F("em_ifn","Indirizzo di Fornitura (se diverso da Residenza)","text","Via...")}
        ${F("em_nfn","N°","text","1")}
        ${F("em_cfn","CAP","text","00000")}
      </div>
      <div class="emr" style="grid-template-columns:1fr 65px">
        ${F("em_cfm","Comune","text","Roma")}
        ${F("em_cfp","Prov.","text","RM")}
      </div>
      <div class="emf" style="margin-bottom:11px">
        <label>Tipologia Impianto</label>
        ${R("em_imp",[["monofase","Monofase (230 V)"],["trifase","Trifase (400 V)"]])}
      </div>
      <div class="emf" style="margin-bottom:11px">
        <label>Tipo di Fornitura</label>
        ${R("em_for",[["singola","Singola"],["multisito","Multisito (compilare l'Allegato Multisito)"]])}
      </div>
      <div class="emf" style="margin-bottom:0">
        <label>Tipologia di Titolarità dell'Immobile</label>
        ${Rcol("em_tit",[
          ["proprieta","Proprietà / Usufrutto / Abitazione per decesso del convivente di fatto"],
          ["locazione","Locazione / Comodato (Atto già registrato o in corso di registrazione)"],
          ["altro","Altro documento che non necessita di registrazione"]
        ])}
      </div>
    </div>

    <!-- 4: PAGAMENTO -->
    <div class="em-step" id="ems-pagamento">
      <div class="em-stitle"><span class="em-snum">5</span>Dati di Pagamento</div>
      <div class="emr emr2">
        ${F("em_int","Nome Cognome Intestatario / Rapp. Legale","text","Nome e Cognome")}
        ${F("em_rsp","Ragione Sociale","text","Es. Azienda Srl")}
      </div>
      <div class="emr emr1">${F("em_iban","IBAN","text","IT60 X054 2811 1010 0000 0123 456")}</div>
      <div class="emr emr2">
        ${F("em_cfi","C.F. Intestatario","text","Codice Fiscale")}
        ${F("em_pvp","P.IVA (se impresa)","text","IT12345678901")}
      </div>
      <div class="emr emr2">
        <div class="emf">
          <label>Tipo Cliente</label>
          ${R("em_tip",[["b2b","B2B"],["b2c","B2C"]])}
        </div>
        ${F("em_sdi","Codice SDI","text","Es. 0000000")}
      </div>
    </div>

    <!-- 5: FIRMA -->
    <div class="em-step" id="ems-firma">
      <div class="em-stitle"><span class="em-snum">6</span>Luogo e Data di Firma</div>
      <p style="font-size:12px;color:#7a8099;margin:-4px 0 14px;line-height:1.5">
        Inserisci luogo e data per le sezioni di firma. La firma manuale sarà apposta sul documento cartaceo.
      </p>
      <div class="emr emr2">
        ${F("em_ld1","Firma 1 — Luogo e Data","text","Es. Roma, 07/03/2026")}
        ${F("em_ld2","Firma 2 — Luogo e Data (B2B / appuntamento)","text","Es. Roma, 07/03/2026")}
      </div>
    </div>

  </div>
  <div id="__emAct"></div>
</div>`;
    document.body.appendChild(ov);

    ov.addEventListener("click", e => { if (e.target === ov) closeModal(); });
    document.getElementById("__emCloseBtn").addEventListener("click", closeModal);

    // Validazione su tutti gli input / select
    ov.querySelectorAll("input:not([type=radio]),select").forEach(el => {
      el.addEventListener("input",  () => validateField(el));
      el.addEventListener("change", () => validateField(el));
      el.addEventListener("blur",   () => { if(el.value.trim()) validateField(el); });
    });

    // Dots
    const dotsEl = document.getElementById("__emDots");
    STEPS.forEach((_,i) => {
      const d = document.createElement("div");
      d.className = "em-dot";
      d.id = "__emD"+i;
      dotsEl.appendChild(d);
    });

    // Default radio selections
    const r1 = document.querySelector('input[name="em_for"][value="singola"]');
    if (r1) r1.checked = true;
    const r2 = document.querySelector('input[name="em_tip"][value="b2b"]');
    if (r2) r2.checked = true;

    renderStep(0);
  }

  /* ─── VALIDAZIONE ────────────────────────────────────────────── */
  function validateField(el) {
    const ic = document.getElementById(el.id + "_ic");
    if (!ic) return;
    const v = el.value.trim();
    ic.className = v ? "em-icon ok" : "em-icon err";
    ic.textContent = v ? "✓" : "✕";
  }

  /* ─── NAVIGAZIONE ────────────────────────────────────────────── */
  function renderStep(idx) {
    cur = idx;
    STEPS.forEach((s,i) => {
      const el = document.getElementById("ems-"+s.id);
      if (el) el.classList.toggle("em-active", i===idx);
      const dot = document.getElementById("__emD"+i);
      if (dot) { dot.className="em-dot"+(i<idx?" em-done":i===idx?" em-cur":""); }
    });
    document.getElementById("__emLblName").textContent  = STEPS[idx].lbl;
    document.getElementById("__emLblCount").textContent = `${idx+1} / ${STEPS.length}`;

    const act = document.getElementById("__emAct");
    act.innerHTML = "";

    const isFirst = idx===0, isLast = idx===STEPS.length-1;

    if (isFirst) {
      const c = btn("em-cancel","Annulla"); c.addEventListener("click",closeModal); act.appendChild(c);
    } else {
      const b = btn("em-back","← Indietro"); b.addEventListener("click",()=>renderStep(cur-1)); act.appendChild(b);
    }
    if (!isLast) {
      const n = btn("em-next","Avanti →"); n.addEventListener("click",()=>renderStep(cur+1)); act.appendChild(n);
    } else {
      const g = btn("em-gen","📄 Genera PDF Modulistica"); g.addEventListener("click",generatePDF); act.appendChild(g);
    }

    document.getElementById("__emBox").scrollTop = 0;
  }

  function btn(cls, txt) {
    const b = document.createElement("button");
    b.className = cls; b.textContent = txt; b.type = "button";
    return b;
  }

  /* ─── OPEN / CLOSE ───────────────────────────────────────────── */
  function openModal()  { document.getElementById("__emOv").classList.add("active"); }
  function closeModal() { document.getElementById("__emOv").classList.remove("active"); }

  /* ─── PREFILL ────────────────────────────────────────────────── */
  function prefill(data) {
    const set = (id,val) => {
      const el = document.getElementById(id);
      if (el && val) { el.value = val; validateField(el); }
    };
    const offMap = { FIX:"Fastweb Energia Business Fix", FLEX:"Fastweb Energia Business Flex" };
    const offVal = offMap[data.offerta] || data.offerta || "";
    if (offVal) {
      const r = document.querySelector(`input[name="em_off"][value="${offVal}"]`);
      if (r) r.checked = true;
    }
    set("em_rag",  data.ragioneSociale);
    set("em_piv",  data.piva);
    set("em_pod",  data.codicePOD);
    set("em_ifn",  data.indirizzoPOD);
  }

  /* ─── COLLECT ────────────────────────────────────────────────── */
  function collect() {
    const v = id => { const e=document.getElementById(id); return e?e.value.trim():""; };
    const r = nm => { const e=document.querySelector(`input[name="${nm}"]:checked`); return e?e.value:""; };
    return {
      offerta:r("em_off"), ragione:v("em_rag"), indirizzo:v("em_ind"), numero:v("em_num"),
      cap:v("em_cap"), comune:v("em_com"), prov:v("em_prv"), cf:v("em_cf"),
      piva:v("em_piv"), ateco:v("em_ate"), legale:v("em_leg"), cflegale:v("em_cfl"),
      tel:v("em_tel"), email:v("em_mai"), pec:v("em_pec"),
      tipoDoc:v("em_tdc"), numDoc:v("em_ndc"),
      dataRil:v("em_drl"), dataScad:v("em_dsc"), rilDa:v("em_rda"), nazione:v("em_naz"),
      pod:v("em_pod"), kwh:v("em_kwh"), kw:v("em_kw"),
      indForn:v("em_ifn"), numForn:v("em_nfn"), capForn:v("em_cfn"),
      comuneForn:v("em_cfm"), provForn:v("em_cfp"),
      impianto:r("em_imp"), fornitura:r("em_for"), titolarita:r("em_tit"),
      intestatario:v("em_int"), ragPag:v("em_rsp"), iban:v("em_iban"),
      cfInt:v("em_cfi"), pivaPag:v("em_pvp"), tipoCliente:r("em_tip"), sdi:v("em_sdi"),
      ld1:v("em_ld1"), ld2:v("em_ld2"),
    };
  }

  /* ─── GENERA PDF ─────────────────────────────────────────────── */
  function generatePDF() {
    const d = collect();
    const esc = s => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const V = (v,mono) => v
      ? `<span${mono?' style="font-family:\'Courier New\',monospace"':''}>${esc(v)}</span>`
      : "";
    const fmtD = s => { if(!s)return""; const p=s.split("-"); return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:s; };

    // Checkbox identica all'originale: quadratino 7x7pt con bordo
    const CHK = ok => ok
      ? `<span style="display:inline-block;width:7.5pt;height:7.5pt;
           border:0.5pt solid #000;background:#000;position:relative;
           vertical-align:middle;margin-right:2pt;">
           <span style="position:absolute;inset:0;display:flex;align-items:center;
           justify-content:center;color:#fff;font-size:6pt;line-height:1;font-weight:900">✓</span>
         </span>`
      : `<span style="display:inline-block;width:7.5pt;height:7.5pt;
           border:0.5pt solid #555;vertical-align:middle;margin-right:2pt;"></span>`;

    // Header sezione: rettangolo bianco con bordo 0.75pt nero
    const SEC = title =>
      `<tr><td colspan="4" style="padding:0;padding-top:8pt">
         <div style="border:0.7pt solid #000;padding:3pt 6pt;
              font-size:6.5pt;font-weight:700;letter-spacing:.09em;
              text-transform:uppercase;background:#fff">
           ${esc(title)}
         </div>
       </td></tr>`;

    // Campo con label+valore e riga di sottostante
    const FL = (lbl,val,mono,w) =>
      `<td${w?` style="width:${w}"`:''}  style="padding:2.5pt 3pt 0${w?";width:"+w:""}">
         <div style="font-size:5.5pt;color:#444;margin-bottom:1pt">${esc(lbl)}</div>
         <div style="border-bottom:0.5pt solid #666;min-height:10pt;
              padding-bottom:1pt;font-size:7pt">${V(val,mono)||"&nbsp;"}</div>
       </td>`;

    // Riga firma
    const FIRMA = (luogoData) =>
      `<table style="width:100%;border-collapse:collapse;margin-top:5pt">
         <tr>
           <td style="width:44%;border-bottom:0.5pt solid #000;padding-bottom:2pt">
             <span style="font-size:5.5pt;color:#444">Luogo e data &nbsp;&nbsp;/&nbsp;&nbsp;/</span>
             ${luogoData?`<br><span style="font-size:7pt">${esc(luogoData)}</span>`:""}
           </td>
           <td style="width:10%"></td>
           <td style="width:44%;border-bottom:0.5pt solid #000;padding-bottom:2pt">
             <span style="font-size:5.5pt;color:#444">Firma</span>
           </td>
         </tr>
       </table>`;

    const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>Preventivo di Fornitura Fastweb Energia</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:Arial,Helvetica,sans-serif;font-size:7pt;color:#000;
       background:#fff;padding:13mm 14mm 10mm;-webkit-print-color-adjust:exact;}
  table{width:100%;border-collapse:collapse;}
  .pbtn{position:fixed;bottom:14px;right:14px;background:#1a3a6b;color:#fff;
        border:none;padding:10px 20px;border-radius:8px;font-family:Arial,sans-serif;
        font-size:12px;font-weight:700;cursor:pointer;
        box-shadow:0 4px 14px rgba(0,0,0,.22);}
  .pbtn:hover{background:#2255aa;}
  @media print{.pbtn{display:none!important;}body{padding:8mm 10mm;}}
</style>
</head>
<body>

<!-- intestazione -->
<div style="display:flex;align-items:flex-start;gap:8pt;
     border-bottom:0.5pt solid #000;padding-bottom:6pt;margin-bottom:8pt;">
  <div style="writing-mode:vertical-rl;transform:rotate(180deg);font-size:5pt;
       color:#555;white-space:nowrap;border-right:0.5pt solid #ccc;
       padding-right:3pt;margin-right:3pt;line-height:1.4">
    Settembre 2024
  </div>
  <div>
    <div style="font-size:5.5pt;color:#444;line-height:1.6">
      Fastweb S.p.A. - Sede legale e amministrativa Piazza Adriano Olivetti, 1, 20139 Milano
      &nbsp;Tel. [+39] 02.45451 &nbsp;Capitale Sociale euro 41.344.209,40 i.v. -<br>
      Codice Fiscale, Partita IVA e Iscrizione nel Registro Imprese di Milano 12878470157
      &nbsp;Fastweb S.p.A. N. Iscr. Reg. AEE: IT08020000003838 - N. Iscr. Reg. Pile e Acc.: IT09100P00001900 -<br>
      Contributo Ambientale CONAI assolto - Società soggetta all'attività di direzione e coordinamento di Swisscom AG
    </div>
  </div>
</div>

<!-- titolo -->
<div style="text-align:center;margin-bottom:8pt">
  <div style="font-size:12pt;font-weight:700;letter-spacing:.03em">RICHIESTA DI PREVENTIVO</div>
  <div style="font-size:8pt;margin-top:2pt">Fastweb Energia - Energia Elettrica</div>
</div>

<!-- intro -->
<div style="font-size:7pt;line-height:1.5;margin-bottom:7pt">
  Il cliente, di seguito indicato, richiede a Fastweb S.p.A. Società a socio unico e soggetta
  all'attività di direzione e coordinamento di Swisscom AG, con sede legale e
  di energia elettrica.
</div>

<!-- offerta -->
<div style="margin-bottom:6pt">
  <div style="font-size:7pt;font-weight:700;margin-bottom:4pt">NOME OFFERTA:</div>
  <table>
    <tr>
      <td style="vertical-align:top;width:50%;padding-right:12pt">
        <div style="font-size:6pt;font-weight:700;margin-bottom:3pt">Consumer:</div>
        ${["Fastweb Energia Light","Fastweb Energia Full","Fastweb Energia Maxi","Fastweb Energia Flex","Fastweb Energia Fix"].map(o=>
          `<div style="margin-bottom:2pt">${CHK(d.offerta===o)} <span style="font-size:6.5pt">${o}</span></div>`
        ).join("")}
      </td>
      <td style="vertical-align:top">
        <div style="font-size:6pt;font-weight:700;margin-bottom:3pt">Business:</div>
        ${["Fastweb Energia Business Flex","Fastweb Energia Business Fix"].map(o=>
          `<div style="margin-bottom:2pt">${CHK(d.offerta===o)} <span style="font-size:6.5pt">${o}</span></div>`
        ).join("")}
      </td>
    </tr>
  </table>
</div>

<!-- dati anagrafici -->
<table>
  ${SEC("DATI ANAGRAFICI E DI RESIDENZA")}
  <tr>${FL("Nome e Cognome (Ragione Sociale se Impresa)",d.ragione,false)}</tr>
  <tr>
    ${FL("Indirizzo di Residenza (Sede Legale se Impresa)",d.indirizzo,false,"65%")}
    ${FL("N°",d.numero,false,"8%")}
    ${FL("CAP",d.cap,false)}
  </tr>
  <tr>
    <td colspan="3" style="padding:2.5pt 3pt 0">
      <div style="font-size:5.5pt;color:#444;margin-bottom:1pt">Comune</div>
      <div style="border-bottom:0.5pt solid #666;min-height:10pt;padding-bottom:1pt;font-size:7pt">${V(d.comune)||"&nbsp;"}</div>
    </td>
    ${FL("Prov.",d.prov,false,"8%")}
  </tr>
  <tr>
    ${FL("Codice Fiscale",d.cf,true,"33%")}
    ${FL("P.IVA (se Impresa)",d.piva,true,"33%")}
    ${FL("ATECO (se Impresa)",d.ateco)}
  </tr>
  <tr>${FL("Nome e Cognome del Legale Rappresentante (se Impresa)",d.legale)}</tr>
  <tr>${FL("C.F. del legale rappresentante (se Impresa)",d.cflegale,true)}</tr>
  <tr>
    ${FL("Tipo di Documento",d.tipoDoc,false,"50%")}
    ${FL("Numero Documento",d.numDoc,true)}
  </tr>
  <tr>
    ${FL("Data di rilascio",fmtD(d.dataRil),false,"20%")}
    ${FL("Data di scadenza",fmtD(d.dataScad),false,"20%")}
    ${FL("Rilasciato da",d.rilDa,false,"35%")}
    ${FL("Nazione di Rilascio",d.nazione)}
  </tr>
  <tr>${FL("Numero di cellulare di riferimento",d.tel,true)}</tr>
  <tr>
    <td style="padding:2.5pt 3pt 0;width:50%">
      <div style="font-size:5.5pt;color:#444;margin-bottom:1pt">E-mail</div>
      <div style="border-bottom:0.5pt solid #666;min-height:10pt;padding-bottom:1pt;font-size:7pt">
        ${d.email?`${esc(d.email.split("@")[0])} <span style="color:#555">@</span> ${esc(d.email.split("@")[1]||"")}`:
                  `<span style="color:#aaa">@</span>`}
      </div>
    </td>
    <td style="padding:2.5pt 2pt 0">
      <div style="font-size:5.5pt;color:#444;margin-bottom:1pt">PEC</div>
      <div style="border-bottom:0.5pt solid #666;min-height:10pt;padding-bottom:1pt;font-size:7pt">
        ${d.pec?`${esc(d.pec.split("@")[0])} <span style="color:#555">@</span> ${esc(d.pec.split("@")[1]||"")}`:
                `<span style="color:#aaa">@</span>`}
      </div>
    </td>
  </tr>
</table>

<!-- dati tecnici -->
<table style="margin-top:2pt">
  ${SEC("DATI TECNICI DI FORNITURA")}
  <tr>
    ${FL("Codice POD",d.pod,true,"35%")}
    ${FL("Consumo (kWh/anno)",d.kwh,false,"25%")}
    ${FL("Pot. Imp. (kW)",d.kw,false,"18%")}
    ${FL("Tensione","BT",false)}
  </tr>
  <tr>
    ${FL("Indirizzo di Fornitura (se diverso da Residenza)",d.indForn,false,"65%")}
    ${FL("N°",d.numForn,false,"8%")}
    ${FL("CAP",d.capForn)}
  </tr>
  <tr>
    <td colspan="3" style="padding:2.5pt 3pt 0">
      <div style="font-size:5.5pt;color:#444;margin-bottom:1pt">Comune</div>
      <div style="border-bottom:0.5pt solid #666;min-height:10pt;padding-bottom:1pt;font-size:7pt">${V(d.comuneForn)||"&nbsp;"}</div>
    </td>
    ${FL("Prov.",d.provForn,false,"8%")}
  </tr>
  <tr>
    <td colspan="4" style="padding:4pt 3pt 0;font-size:7pt">
      <span style="font-size:5.5pt;color:#444">Tipologia impianto:</span>&nbsp;
      ${CHK(d.impianto==="monofase")} <span style="margin-right:12pt">Monofase (230 V)</span>
      ${CHK(d.impianto==="trifase")} <span style="margin-right:20pt">Trifase (400V)</span>
      <span style="font-size:5.5pt;color:#444">Tipo di Fornitura:</span>&nbsp;
      ${CHK(d.fornitura==="singola")} <span style="margin-right:10pt">Singola</span>
      ${CHK(d.fornitura==="multisito")} Multisito (Compilare l'ALLEGATO MULTISITO)
    </td>
  </tr>
  <tr>
    <td colspan="4" style="padding:4pt 3pt 0;font-size:7pt">
      <div style="font-size:5.5pt;color:#444;margin-bottom:2pt">Tipologia di titolarità dell'immobile:</div>
      ${CHK(d.titolarita==="proprieta")} Proprietà/ Usufrutto/ Abitazione per decesso del convivente di fatto<br>
      <span style="margin-top:2pt;display:inline-block">
        ${CHK(d.titolarita==="locazione")} Locazione/ Comodato (Atto già registrato o in corso di registrazione)
        &nbsp;&nbsp;${CHK(d.titolarita==="altro")} Altro documento che non necessita di registrazione
      </span>
    </td>
  </tr>
</table>

<!-- dati pagamento -->
<table style="margin-top:2pt">
  ${SEC("DATI DI PAGAMENTO")}
  <tr>
    ${FL("Nome e Cognome intestatario/Rapp. Legale",d.intestatario,false,"50%")}
    ${FL("Ragione Sociale",d.ragPag)}
  </tr>
  <tr>
    ${FL("C.F. Intestatario",d.cfInt,true,"30%")}
    ${FL("IBAN",d.iban,true)}
  </tr>
  <tr>
    ${FL("P.IVA (se impresa)",d.pivaPag,true,"30%")}
    <td style="padding:2.5pt 3pt 0">
      <div style="font-size:5.5pt;color:#444;margin-bottom:1pt">Tipo</div>
      <div style="font-size:7pt;padding-top:3pt">
        ${CHK(d.tipoCliente==="b2c")} <span style="margin-right:10pt">B2C</span>
        ${CHK(d.tipoCliente==="b2b")} <span style="margin-right:18pt">B2B</span>
        <span style="font-size:5.5pt;color:#444">Codice SDI</span>
        <span style="display:inline-block;border-bottom:0.5pt solid #666;
               min-width:50pt;font-family:'Courier New',monospace">${V(d.sdi)||"&nbsp;"}</span>
      </div>
    </td>
  </tr>
</table>

<!-- firme -->
<div style="margin-top:8pt;border:0.5pt solid #aaa;padding:6pt 7pt">
  <div style="font-size:6.5pt;line-height:1.5;margin-bottom:6pt">
    [... le informazioni precontrattuali necessarie a perfezionare la conclusione del contratto
    relativo all'offerta sopra indicata.]
  </div>
  ${FIRMA(d.ld1)}
  <div style="font-size:6.5pt;line-height:1.5;margin-top:10pt;margin-bottom:6pt">
    [... le informazioni precontrattuali necessarie a perfezionare la conclusione del contratto
    la cui proposta è avvenuta nell'ambito di un appuntamento per la proposizione dei servizi
    Fastweb all'azienda <span style="border-bottom:0.5pt solid #000;display:inline-block;min-width:50pt">&nbsp;</span>.]
  </div>
  ${FIRMA(d.ld2)}
</div>

<button class="pbtn" onclick="window.print()">🖨️ Stampa / Salva PDF</button>
</body></html>`;

    const w = window.open("","_blank");
    if (!w) { alert("Popup bloccato dal browser.\nConsenti i popup e riprova."); return; }
    w.document.write(html);
    w.document.close();
    closeModal();
  }

  /* ─── ENTRY POINT ────────────────────────────────────────────── */
  G.openModulistica = function(data) {
    buildModal();
    renderStep(0);
    prefill(data || {});
    openModal();
  };

})(window);
