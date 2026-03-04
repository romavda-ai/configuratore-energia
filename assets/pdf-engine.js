/* pdf-engine.js v54.2
   Estratto da index-v53.9: contiene SOLO logica di generazione PDF.
   Dipende da: assets/jspdf.umd.min.js (già presente) o fallback CDN incluso.
*/
(function(){
  "use strict";
  function ensureJsPdfLoaded(){
    // Prefer already loaded globals
    if((window.jspdf && window.jspdf.jsPDF) || window.jsPDF) return Promise.resolve(true);

    // Avoid double-loading
    if(window.__JSPDF_LOADING_PROMISE) return window.__JSPDF_LOADING_PROMISE;

    const urls = [
      "/configuratore-energia/assets/jspdf.umd.min.js",   // produzione (tuo path)
      "assets/jspdf.umd.min.js",                         // relativo (GitHub Pages / test)
      "./assets/jspdf.umd.min.js",                       // relativo esplicito
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" // fallback definitivo
    ];

    const loadOnce = (url)=> new Promise((resolve,reject)=>{
      const s = document.createElement("script");
      s.src = url;
      s.async = true;
      s.onload = ()=>resolve(true);
      s.onerror = ()=>reject(new Error("Failed to load "+url));
      document.head.appendChild(s);
    });

    window.__JSPDF_LOADING_PROMISE = (async ()=>{
      let lastErr = null;
      for(const u of urls){
        try{
          await loadOnce(u);
          if((window.jspdf && window.jspdf.jsPDF) || window.jsPDF) return true;
          lastErr = new Error("jsPDF loaded but globals not found ("+u+")");
        }catch(e){
          lastErr = e;
        }
      }
      throw lastErr || new Error("Failed to load jsPDF");
    })();

    return window.__JSPDF_LOADING_PROMISE;
  }
  async function generatePdfOfferta(){
  // Stable, self-contained PDF generator (no external helpers, no FS/contactLines issues)
  // 1) Ensure jsPDF
  try{
    await ensureJsPdfLoaded();
  }catch(e){
    alert("Impossibile generare il PDF: libreria PDF non caricata. Verifica che /configuratore-energia/assets/jspdf.umd.min.js sia raggiungibile e riprova.");
    console.error(e);
    return;
  }

  const jsPDFCtor = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : (window.jsPDF || null);
  if(!jsPDFCtor){
    alert("Impossibile generare il PDF: libreria PDF non caricata. Verifica che /configuratore-energia/assets/jspdf.umd.min.js sia raggiungibile e riprova.");
    return;
  }

  // 2) Read PDF config (texts + style) from backhand
  const cfgPack = (typeof window.getConfigForPdf === "function") ? window.getConfigForPdf() : (window.CONFIG || {});
  const pdfT = (cfgPack && cfgPack.pdfTxt) ? cfgPack.pdfTxt : (window.PDF_TEXT_DEFAULT || {});
  const fontScale = (cfgPack && cfgPack.pdfFontScale) ? Number(cfgPack.pdfFontScale) : 1;
  const boldAll = !!(cfgPack && cfgPack.pdfBoldAll);

  const fs = (v)=> Math.max(6, v * (isFinite(fontScale)?fontScale:1));

  // 3) Small utilities
  const $ = (id)=> document.getElementById(id);
  const txt = (id)=> (($(id)?.value ?? $(id)?.textContent ?? "") + "").trim();
  const normNum = (v)=>{
    if(v==null) return 0;
    let s = (v+"").trim().replace(/\s+/g,"");
    // If it has both '.' and ',' we assume IT format: '.' thousands, ',' decimals
    if(s.includes(".") && s.includes(",")){
      s = s.replace(/\./g,"").replace(",",".");
    } else if(s.includes(",")){
      // Only comma -> decimal separator
      s = s.replace(",",".");
    } else {
      // Only dot or none -> dot is decimal, remove commas if any (thousands)
      s = s.replace(/,/g,"");
    }
    s = s.replace(/[^\d.\-]/g,"");
    const n = parseFloat(s);
    return isFinite(n) ? n : 0;
  };
  const fmtEuro = (n)=>{
    const v = isFinite(n) ? n : 0;
    return v.toLocaleString("it-IT",{minimumFractionDigits:2, maximumFractionDigits:2}) + " €";
  };
  const fmtDec = (n, d=5)=>{
    const v = isFinite(n) ? n : 0;
    return v.toLocaleString("it-IT",{minimumFractionDigits:d, maximumFractionDigits:d});
  };

  const fmtKwh = (n)=>{
    const v = isFinite(n) ? n : 0;
    return v.toFixed(5);
  };
  const safe = (s)=> (s??"").toString();

  // Wrap text helper for jsPDF
  const wrap = (doc, text, maxWidth)=>{
    return doc.splitTextToSize(String(text||""), maxWidth);
  };

  // 4) Gather business fields from PDF form
  // NOTE: IDs are those used in the PDF modal (pdf_company, pdf_piva, pdf_address, pdf_pod, pdf_agent_first/last)
  const ragSoc = txt("pdf_company") || txt("pdf_ragione") || txt("ragioneSociale") || "";
  const piva   = txt("pdf_piva")    || txt("piva") || "";
  const indPod = txt("pdf_address") || txt("pdf_indirizzo") || txt("indirizzoPod") || txt("indirizzo") || "";
  const idPod  = txt("pdf_pod")     || txt("pod") || "";

  const agNome = txt("pdf_agent_first") || txt("pdf_ag_nome") || txt("ag_nome") || "";
  const agCogn = txt("pdf_agent_last")  || txt("pdf_ag_cognome") || txt("ag_cognome") || "";

  const fullAgent = (agNome + " " + agCogn).trim();

  // 5) Gather simulation parameters (from configuratore)
  const offerta = (txt("selectOfferta") || txt("offertaEconomica") || "").toUpperCase();
  const clienteVodafone = (txt("cltVodafone") || txt("clienteVodafone") || txt("selectClienteVodafone") || "").toUpperCase();
  const tipologia = (txt("fasce") || txt("tipologiaFasce") || txt("selectTipologiaFasce") || "").toUpperCase();

  const mese1 = txt("mese1") || txt("selectMese1") || "";
  const anno1 = txt("anno1") || txt("selectAnno1") || "";
  const mese2 = txt("mese2") || txt("selectMese2") || "";
  const anno2 = txt("anno2") || txt("selectAnno2") || "";

  const mensilita = (txt("mensilita") || txt("mensilitaFattura") || txt("selectMensilita") || "1").trim();

  const periodo = (mensilita==="2" && mese2 && anno2) ? `${mese1}/${anno1} - ${mese2}/${anno2}` : `${mese1}/${anno1}`;

  // 6) Read computed outputs directly from UI fields (already calculated)
// IMPORTANT: we prefer reading the *visible* values already shown in the configuratore,
// so PDF always matches what the user sees.
const parseFromSpan = (id)=> normNum(($(id)?.textContent||""));

const isBim = (String(mensilita).trim() === "2");

// Totali (mese o bimestre)
let att = 0, fw = 0;
if(isBim){
  att = parseFromSpan("ttlAttBimVal") || normNum(txt("out_att_bim"));
  fw  = parseFromSpan("ttlFwBimVal")  || normNum(txt("out_fw_bim"));
} else {
  // 1 mensilità: spesa attuale = quota consumo + quota fissa (se presente)
  let attInput = normNum(txt("spesaAtt1"));
  const attFissa = normNum(txt("spesaAtt1Fissa"));
  if(String(mensilita).trim()==="1") attInput = attInput + attFissa;
  att = parseFromSpan("ttlAttVal") || attInput || normNum(txt("out_att_1")) || normNum(txt("out_att_bim"));
  fw  = parseFromSpan("ttlFwVal")  || normNum(txt("out_fw1")) || normNum(txt("out_fw_1")) || normNum(txt("out_fw_bim"));
}
const delta = (isFinite(att) && isFinite(fw)) ? (fw - att) : 0;
// Month details (kWh + costs)
  const isMulti = (tipologia || "").includes("MULTI");
  const kwh1 = isMulti ? (normNum(txt("kwh1_f1")) + normNum(txt("kwh1_f2")) + normNum(txt("kwh1_f3"))) : normNum(txt("kwh1_tot"));
  const kwh2 = isMulti ? (normNum(txt("kwh2_f1")) + normNum(txt("kwh2_f2")) + normNum(txt("kwh2_f3"))) : normNum(txt("kwh2_tot"));
  const spesaAtt1 = normNum(txt("spesaAtt1") || txt("spesaAttuale1") || txt("spesaAtt1Input"));
  const spesaAtt2 = normNum(txt("spesaAtt2") || txt("spesaAttuale2") || txt("spesaAtt2Input"));

  // Estimated Fastweb per month if present
  const spesaFw1 = normNum(txt("out_fw1") || txt("spesaFw1") || txt("spesaFastweb1") || txt("out_fw_m1"));
  const spesaFw2 = normNum(txt("out_fw2") || txt("spesaFw2") || txt("spesaFastweb2") || txt("out_fw_m2"));

  // Costo medio €/kWh (da configuratore: "Costo energia")
  const costkwh1 = normNum(txt("d_ckw1")) || ((kwh1>0 && spesaFw1>0) ? (spesaFw1/kwh1) : 0);
  const costkwh2 = normNum(txt("d_ckw2")) || ((kwh2>0 && spesaFw2>0) ? (spesaFw2/kwh2) : 0);

  // 7) Build PDF
  const doc = new jsPDFCtor({unit:"mm", format:"a4"});
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14;
  const colGap = 6;
  const colW = (W - 2*M - colGap) / 2;

  const setFont = (bold=false)=>{
    const weight = (boldAll || bold) ? "bold" : "normal";
    doc.setFont("helvetica", weight);
  };

  // Header
  let y = 16;
  setFont(true); doc.setFontSize(fs(18));
  doc.setTextColor(17,17,17);
  doc.text(safe(pdfT.title || "OFFERTA ENERGIA – FASTWEB"), M, y);
  y += 7;
  setFont(false); doc.setFontSize(fs(11));
  doc.setTextColor(85,85,85);
  doc.text(safe(pdfT.subtitle || "Documento di sintesi (simulazione)"), M, y);
  y += 8;

  // Two cards
  const cardH = 40;
  const cardY = y;
  doc.setDrawColor(230,230,234); doc.setLineWidth(0.4);
  doc.setFillColor(251,251,252);
  doc.roundedRect(M, cardY, colW, cardH, 3, 3, "FD");
  doc.roundedRect(M+colW+colGap, cardY, colW, cardH, 3, 3, "FD");

  // Left card: Dati cliente
  let xL = M + 6;
  let yL = cardY + 8;
  setFont(true); doc.setFontSize(fs(11)); doc.setTextColor(34,34,34);
  const sec1 = safe(pdfT.secCliente || "Dati cliente");
  doc.text(sec1, xL, yL);
  doc.setDrawColor(180,180,185); doc.setLineWidth(0.3);
  doc.line(xL, yL+1.2, xL + doc.getTextWidth(sec1), yL+1.2);
  yL += 6;

  const drawKV = (x, y0, k, v)=>{
    k = (k||"").trim();
    if(k && !k.endsWith(":")) k = k + ":";
    // Più aria + testi leggermente più piccoli (titoli sezione invariati)
    setFont(true);  doc.setFontSize(fs(9));  doc.setTextColor(17,17,17);
    doc.text(k, x, y0);
    const kw = doc.getTextWidth(k + " ");
    setFont(false); doc.setFontSize(fs(9));  doc.setTextColor(17,17,17);
    const lines = wrap(doc, v, colW-12-kw);
    doc.text(lines, x+kw, y0);
    const lh = 5.0;
    return y0 + (lines.length>0 ? (lines.length*lh) : lh);
  };

  yL = drawKV(xL, yL, safe(pdfT.lblRagione || "Ragione sociale:"), ragSoc || "-");
  yL = drawKV(xL, yL, safe(pdfT.lblPiva || "P. IVA:"), piva || "-");
  yL = drawKV(xL, yL, safe(pdfT.lblIdPod || "Id POD:"), idPod || "-");
  yL = drawKV(xL, yL, safe(pdfT.lblIndPod || "Indirizzo POD:"), indPod || "-");

  // Right card: Parametri simulazione
  let xR = M + colW + colGap + 6;
  let yR = cardY + 8;
  setFont(true); doc.setFontSize(fs(11)); doc.setTextColor(34,34,34);
  const sec2 = safe(pdfT.secParam || "Parametri simulazione");
  doc.text(sec2, xR, yR);
  doc.setDrawColor(180,180,185); doc.setLineWidth(0.3);
  doc.line(xR, yR+1.2, xR + doc.getTextWidth(sec2), yR+1.2);
  yR += 6;

  const offTxt = offerta || "-";
  const cltTxt = clienteVodafone || "-";
  const tipoTxt = tipologia || "-";
  const perTxt = periodo || "-";

  yR = drawKV(xR, yR, safe(pdfT.lblOfferta || "Offerta economica:"), offTxt);
  yR = drawKV(xR, yR, safe(pdfT.lblClienteVod || pdfT.lblClienteVodafone || "Cliente Vodafone:"), cltTxt);
  yR = drawKV(xR, yR, safe(pdfT.lblPeriodo || "Periodo:"), perTxt);
  yR = drawKV(xR, yR, safe(pdfT.lblTipo || pdfT.lblTipologiaFasce || "Tipo contatore:"), tipoTxt);

  y = cardY + cardH + 10;

  // Intro
  const intro = safe(pdfT.intro || "Facendo seguito alle intercorse intese, riportiamo di seguito le condizioni a lei riservate. In caso di accettazione dell'offerta, provvederemo a sottoporre alla sua firma il modulo che riporterà le condizioni concordate.");
  setFont(false); doc.setFontSize(fs(10)); doc.setTextColor(17,17,17);
  const introLines = wrap(doc, intro, W-2*M);
  doc.text(introLines, M, y);
  y += introLines.length * 4.5 + 6;

  // Summary heading (FUORI dal riquadro) + sottolineato
  setFont(true); doc.setFontSize(fs(12)); doc.setTextColor(17,17,17);
  const secR = safe(pdfT.secRiep || "Riepilogo economico");
  doc.text(secR, M, y);
  doc.setDrawColor(17,17,17); doc.setLineWidth(0.4);
  doc.line(M, y+1.2, M + doc.getTextWidth(secR), y+1.2);
  y += 6;

  // 4 cards in linea
  const cardsH = 30;
  const gap4 = 3.5;
  const cardW = (W - 2*M - 3*gap4) / 4;
  const periodoTxt = (String(mensilita).trim()==="2") ? "bimestre" : "mensile";

  const attBim = (typeof window.attBimVal==="number") ? window.attBimVal : att; // fallback
  const fwBim  = (typeof window.fwBimVal==="number") ? window.fwBimVal : fw;  // fallback

  const xC1 = M;
  const xC2 = xC1 + cardW + gap4;
  const xC3 = xC2 + cardW + gap4;
  const xC4 = xC3 + cardW + gap4;

  // Importi (totali 1 mese / bimestre)
  const att1Tot = att; // alias: totale spesa attuale 1 mese
  const fw1Tot  = fw;  // alias: totale stimato Fastweb 1 mese
  const attTot = (String(mensilita).trim()==="2") ? attBim : att1Tot;
  const fwTot  = (String(mensilita).trim()==="2") ? fwBim  : fw1Tot;

  // Colori logica risparmio/aumento
  const signedDelta = (attTot - fwTot);
  const isSave = (signedDelta >= 0);
  const colDelta = isSave ? [26,127,55] : [200,0,0];
  const deltaTot = Math.abs(signedDelta);

  // Annuale: se mensile *12, se bimestrale *6
  const annual = deltaTot * ((String(mensilita).trim()==="2") ? 6 : 12);

  // Draw card helper
  const drawCard = (x, title, titleRgb, value, sub, subRgb, boldTitle=true)=>{
    doc.setFillColor(255,255,255);
    doc.setDrawColor(230,230,234);
    doc.roundedRect(x, y, cardW, cardsH, 3, 3, "FD");

    setFont(!!boldTitle); doc.setFontSize(fs(8.6));
    doc.setTextColor(titleRgb[0],titleRgb[1],titleRgb[2]);
    doc.text(safe(title), x+3.2, y+7.5);

    setFont(true); doc.setFontSize(fs(14));
    doc.setTextColor(titleRgb[0],titleRgb[1],titleRgb[2]);
    doc.text(euro(value), x+3.2, y+18.0);

    setFont(false); doc.setFontSize(fs(8.2));
    doc.setTextColor(subRgb[0],subRgb[1],subRgb[2]);
    doc.text(safe(sub), x+3.2, y+25.2);
  };

  // 1) Totale spesa attuale (nero)
  drawCard(xC1, (pdfT.sumAtt || "Totale spesa attuale"), [0,0,0], attTot, periodoTxt, [0,0,0], true);

  // 2) Totale stimato Fastweb (giallo)
  drawCard(xC2, (pdfT.sumFw || "Totale stimato Fastweb"), [245,196,0], fwTot, periodoTxt, [245,196,0], true);

  // 3) Risparmio / Aumento (verde/rosso)
  drawCard(xC3, (isSave ? (pdfT.sumSave||"Risparmio") : (pdfT.sumInc||"Aumento")), colDelta, deltaTot, periodoTxt, colDelta, true);

  // 4) Risparmio Annuo (stessa logica colore) — sotto testo "annuale"
  drawCard(xC4, (pdfT.sumAnnual||"Risparmio Annuo"), colDelta, annual, "annuale", colDelta, true);

  y += cardsH + 8;

// Detail table
  setFont(true); doc.setFontSize(fs(12)); doc.setTextColor(17,17,17);
  const secD = safe(pdfT.secDett || "Dettaglio simulazione");
  doc.text(secD, M, y);
  doc.setDrawColor(17,17,17); doc.setLineWidth(0.4);
  doc.line(M, y+1.2, M + doc.getTextWidth(secD), y+1.2);
  y += 6;

  const tableX = M;
  const tableW = W - 2*M;
  const rowH = 7.5;
  const cols = [
    {h: safe(pdfT.thPeriodo || "Periodo"), w: 0.22},
    {h: safe(pdfT.thKwh || "kWh Tot."), w: 0.14},
    {h: safe(pdfT.thAtt || "Spesa attuale"), w: 0.20},
    {h: safe(pdfT.thFw || "Spesa Fastweb"), w: 0.20},
    {h: safe(pdfT.thCost || "Costo medio €/kWh"), w: 0.24},
  ];

  // Header row background
  doc.setFillColor(239,239,242);
  doc.rect(tableX, y, tableW, rowH, "F");
  doc.setDrawColor(230,230,234); doc.setLineWidth(0.3);
  doc.rect(tableX, y, tableW, rowH);
  let cx = tableX + 2.2;
  setFont(true); doc.setFontSize(fs(9)); doc.setTextColor(51,51,51);
  cols.forEach(c=>{
    doc.text(c.h, cx, y+5.2);
    cx += tableW*c.w;
  });

  const rows = [];
  rows.push({
    periodo: `${mese1}/${anno1}`,
    kwh: kwh1 ? kwh1.toLocaleString("it-IT") : "-",
    att: spesaAtt1 ? fmtEuro(spesaAtt1) : "-",
    fw: spesaFw1 ? fmtEuro(spesaFw1) : "-",
    cost: (costkwh1>0) ? fmtKwh(costkwh1) : "-"
  });
  if(mensilita==="2"){
    rows.push({
      periodo: `${mese2}/${anno2}`,
      kwh: kwh2 ? kwh2.toLocaleString("it-IT") : "-",
      att: spesaAtt2 ? fmtEuro(spesaAtt2) : "-",
      fw: spesaFw2 ? fmtEuro(spesaFw2) : "-",
      cost: (costkwh2>0) ? fmtKwh(costkwh2) : "-"
    });
  }

  let ty = y + rowH;
  rows.forEach(r=>{
    doc.setFillColor(251,251,252);
    doc.rect(tableX, ty, tableW, rowH, "F");
    doc.setDrawColor(230,230,234); doc.rect(tableX, ty, tableW, rowH);
    let cx2 = tableX + 2.2;
    setFont(false); doc.setFontSize(fs(9)); doc.setTextColor(17,17,17);
    const vals=[r.periodo, r.kwh, r.att, r.fw, r.cost];
    vals.forEach((v,i)=>{
      doc.text(String(v), cx2, ty+5.2);
      cx2 += tableW*cols[i].w;
    });
    ty += rowH;
  });

  y = ty + 10;

  // CTE link + agent refs
  const cteLine = safe(pdfT.cteIntro || "Per maggiori informazioni sulle condizioni tecnico-economiche proposte:");
  setFont(false); doc.setFontSize(fs(10)); doc.setTextColor(17,17,17);
  const cteLines = wrap(doc, cteLine, W-2*M);
  doc.text(cteLines, M, y);
  y += cteLines.length*4.5 + 2;

  setFont(true); doc.setFontSize(fs(10)); doc.setTextColor(11,87,208);
  const cteFixUrl  = safe(pdfT.cteFixUrl  || "https://www.fastweb.it/downloads/PDF/business/energia/cte_fastweb_energia_fix.pdf?rel=20241001");
  const cteFlexUrl = safe(pdfT.cteFlexUrl || "https://www.fastweb.it/downloads/PDF/business/energia/cte_fastweb_energia_flex.pdf?rel=20241001");
  const isFlex = (offerta || "").toUpperCase().includes("FLEX");
  const cteUrl = isFlex ? cteFlexUrl : cteFixUrl;
  const cteCtaText = safe(pdfT.cteCta || "Clicca qui per consultare la CTE");
  // clickable link
  if(typeof doc.textWithLink === "function"){
    doc.textWithLink(cteCtaText, M, y, {url: cteUrl});
  } else {
    doc.text(cteCtaText, M, y);
  }
  // underline for readability
  const cteWidth = doc.getTextWidth(cteCtaText);
  doc.setDrawColor(11,87,208); doc.setLineWidth(0.3);
  doc.line(M, y+0.8, M+cteWidth, y+0.8);
  y += 10;

  // Agent box (più piccolo, allineato a destra)
  const abW = 78;
  const abH = 18;
  const abX = W - M - abW;
  doc.setDrawColor(230,230,234);
  doc.setFillColor(251,251,252);
    // Riferimenti commerciali (FUORI dai riquadri) — più spazio sopra, blocco a destra
  y += 8;
  const clean = (str)=> (str||"").toLowerCase()
    .replace(/[’']/g,"")
    .replace(/\s+/g,"")
    .replace(/[^a-z0-9.]/g,"");
  const mail = (agNome && agCogn) ? `${clean(agNome)}.${clean(agCogn)}@wincomitalia.com` : "";

  const refLine1 = fullAgent ? fullAgent : "-";
  const refLine2 = mail ? mail : "-";

  const refX = W - M - 68; // blocco a destra
  setFont(true);  doc.setFontSize(fs(9));  doc.setTextColor(17,17,17);
  doc.text(safe(pdfT.agentTitle || "Riferimenti commerciali"), refX, y);

  y += 6.0;
  setFont(false); doc.setFontSize(fs(9)); doc.setTextColor(17,17,17);
  doc.text(refLine1, refX, y);

  y += 4.8;
  // mail blu e sottolineata
  doc.setTextColor(0,102,204);
  doc.text(refLine2, refX, y);
  const mw = doc.getTextWidth(refLine2);
  doc.setDrawColor(0,102,204); doc.setLineWidth(0.4);
  doc.line(refX, y+0.7, refX+mw, y+0.7);

  y += 5.2;
  setFont(true);  doc.setFontSize(fs(9)); doc.setTextColor(17,17,17);
  doc.text("Wincom Srl", refX, y);

  y += 4.6;
  setFont(false); doc.setFontSize(fs(8.6)); doc.setTextColor(85,85,85);
  doc.text("Vodafone Excellent Partner", refX, y);

// Footer (light)
  setFont(false); doc.setFontSize(fs(8)); doc.setTextColor(120,120,120);
  doc.text(safe(pdfT.footer || "Wincom Srl • Sede legale: Roma (RM) • wincomitalia.it"), M, H-10);

  // Save
  const filename = (safe(pdfT.filenamePrefix || "Offerta_WINCOM") + ".pdf").replace(/\s+/g,"_");
  doc.save(filename);
  try{ if(typeof closePdfModal==='function') closePdfModal(); }catch(e){}

}
  window.PDFEngine = {
    ensureJsPdfLoaded,
    generatePdfOfferta
  };
})();
