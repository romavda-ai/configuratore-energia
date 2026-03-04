/* pdf-engine.js (v54) - motore PDF isolato
   Richiede: assets/jspdf.umd.min.js (locale) oppure fallback CDN.
   Espone: window.PDFEngine.generate(data)
*/
(function(){
  const loadScript = (src)=> new Promise((resolve,reject)=>{
    const s=document.createElement("script");
    s.src=src; s.async=true;
    s.onload=()=>resolve(true);
    s.onerror=()=>reject(new Error("load fail: "+src));
    document.head.appendChild(s);
  });

  async function ensureJsPdfLoaded(){
    if(window.jspdf && (window.jspdf.jsPDF || window.jspdf.default || window.jsPDF)) return true;

    const candidates = [
      "assets/jspdf.umd.min.js",
      "./assets/jspdf.umd.min.js",
      "/configuratore-energia/assets/jspdf.umd.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
    ];

    for(const src of candidates){
      try{
        await loadScript(src);
        if(window.jspdf && (window.jspdf.jsPDF || window.jspdf.default || window.jsPDF)) return true;
      }catch(e){}
    }
    return false;
  }

  const safe = (s)=> String(s ?? "").trim();

  const toTitleCase = (s)=> safe(s).split(/\s+/).map(w=> w ? (w[0].toUpperCase()+w.slice(1).toLowerCase()) : "").join(" ");

  const fmtEUR = (n)=>{
    const v = (isFinite(n)? n : 0);
    return v.toLocaleString("it-IT",{minimumFractionDigits:2, maximumFractionDigits:2}) + " €";
  };

  function pickFont(doc, bold){
    try{
      doc.setFont("helvetica", bold ? "bold" : "normal");
    }catch(e){
      // ignore
    }
  }

  async function generate(data){
    const ok = await ensureJsPdfLoaded();
    if(!ok) throw new Error("jsPDF non caricata");

    const jsPDFCtor = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : (window.jsPDF || null);
    if(!jsPDFCtor) throw new Error("jsPDF ctor non trovato");

    // --- data normalization ---
    const mensilita = safe(data.mensilita || "1");
    const periodoTxt = (mensilita==="2") ? "bimestre" : "mensile";

    // Totali: priorità ai risultati calcolati (out), altrimenti ai campi input
    const att1 = (data.spesaAtt1?.totale ?? 0) || (data.spesaAtt1?.fallback ?? 0);
    const fw1  = (data.out?.fw1 ?? 0);

    const attBim = (data.spesaBim?.totale ?? 0);
    const fwBim  = (data.out?.fwBim ?? 0);

    const attTot = (mensilita==="2") ? attBim : att1;
    const fwTot  = (mensilita==="2") ? fwBim  : fw1;

    const signedDelta = (attTot - fwTot);
    const isSave = (signedDelta >= 0);
    const deltaAbs = Math.abs(signedDelta);

    const annMult = (mensilita==="2") ? 6 : 12;
    const annVal = deltaAbs * annMult;

    // --- PDF layout ---
    const doc = new jsPDFCtor({ unit:"mm", format:"a4" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 16;

    const colBlack = [17,17,17];
    const colGray  = [90,90,90];
    const colYel   = [250, 199, 26];
    const colGreen = [20, 150, 60];
    const colRed   = [210, 50, 50];
    const colDelta = isSave ? colGreen : colRed;

    let y = 18;

    // Header
    pickFont(doc, true); doc.setFontSize(16); doc.setTextColor(...colBlack);
    doc.text("OFFERTA ENERGIA – FASTWEB", M, y);
    y += 6;
    pickFont(doc, true); doc.setFontSize(11); doc.setTextColor(...colGray);
    doc.text("Documento di sintesi", M, y);
    y += 10;

    // Panels: Dati cliente / Parametri simulazione
    const panelGap = 4;
    const panelW = (W - 2*M - panelGap)/2;
    const panelH = 36;
    const pY = y;
    doc.setDrawColor(220,220,220);
    doc.setFillColor(247,247,247);

    // left panel
    doc.roundedRect(M, pY, panelW, panelH, 3,3, "FD");
    // right panel
    doc.roundedRect(M+panelW+panelGap, pY, panelW, panelH, 3,3, "FD");

    pickFont(doc,true); doc.setFontSize(11); doc.setTextColor(...colBlack);
    doc.text("Dati cliente", M+4, pY+7);
    doc.text("Parametri simulazione", M+panelW+panelGap+4, pY+7);

    pickFont(doc,true); doc.setFontSize(8.8);
    const rlab = (xR, yy, lab)=>{ doc.text(lab, xR, yy, {align:"right"}); };
    pickFont(doc,false);

    const cl = data.cliente || {};
    const pr = {
      offerta: safe(data.offerta),
      vodafone: safe(data.clienteVodafone),
      periodo: safe(data.mese1) + (data.anno? ("/"+safe(data.anno)) : ""),
      tipo: safe(data.tipologia)
    };

    const lXr = M + 36;
    const lXv = lXr + 2;
    const rXr = M + panelW + panelGap + 44;
    const rXv = rXr + 2;

    const linesL = [
      ["Ragione sociale:", safe(cl.ragSoc)],
      ["P. IVA:", safe(cl.piva)],
      ["Id POD:", safe(cl.pod)],
      ["Indirizzo POD:", safe(cl.indirizzo)]
    ];
    const linesR = [
      ["Offerta economica:", pr.offerta],
      ["Cliente Vodafone:", pr.vodafone],
      ["Periodo:", pr.periodo],
      ["Tipo contatore:", pr.tipo],
    ];

    let yy = pY + 14;
    const gapY = 5.2;

    for(let i=0;i<4;i++){
      pickFont(doc,true); doc.setTextColor(...colBlack);
      rlab(lXr, yy, linesL[i][0]);
      pickFont(doc,false);
      doc.text(linesL[i][1] || "-", lXv, yy);
      yy += gapY;
    }

    yy = pY + 14;
    for(let i=0;i<4;i++){
      pickFont(doc,true); doc.setTextColor(...colBlack);
      rlab(rXr, yy, linesR[i][0]);
      pickFont(doc,false);
      doc.text(linesR[i][1] || "-", rXv, yy);
      yy += gapY;
    }

    y = pY + panelH + 8;

    // Intro
    pickFont(doc,false); doc.setFontSize(9); doc.setTextColor(...colGray);
    doc.text("Facendo seguito alle intercorse intese, riportiamo di seguito le condizioni a lei riservate.", M, y);
    y += 4.5;
    doc.text("In caso di accettazione dell'offerta, provvederemo a sottoporre alla sua firma il modulo con le condizioni concordate.", M, y);
    y += 10;

    // Riepilogo economico (fuori dal riquadro, sottolineato)
    pickFont(doc,true); doc.setFontSize(12); doc.setTextColor(...colBlack);
    const sec = "Riepilogo economico";
    doc.text(sec, M, y);
    doc.setLineWidth(0.4);
    doc.line(M, y+1.2, M + doc.getTextWidth(sec), y+1.2);
    y += 6;

    // 4 cards in linea
    const cardsH = 26;
    const gap4 = 3.2;
    const cardW = (W - 2*M - 3*gap4) / 4;
    const xC1 = M;
    const xC2 = xC1 + cardW + gap4;
    const xC3 = xC2 + cardW + gap4;
    const xC4 = xC3 + cardW + gap4;

    const drawCard = (x, title, titleCol, value, sub, subCol)=>{
      doc.setDrawColor(220,220,220);
      doc.setFillColor(255,255,255);
      doc.roundedRect(x, y, cardW, cardsH, 3,3, "FD");
      pickFont(doc,true); doc.setFontSize(9.5); doc.setTextColor(...titleCol);
      doc.text(title, x+3, y+6);
      pickFont(doc,true); doc.setFontSize(13.5); doc.setTextColor(...titleCol);
      doc.text(value, x+3, y+14);
      pickFont(doc,false); doc.setFontSize(9); doc.setTextColor(...subCol);
      doc.text(sub, x+3, y+21.5);
    };

    drawCard(xC1, "Totale spesa attuale", colBlack, fmtEUR(attTot), periodoTxt, colBlack);
    drawCard(xC2, "Totale stimato Fastweb", colYel, fmtEUR(fwTot), periodoTxt, colYel);
    drawCard(xC3, isSave ? "Risparmio" : "Aumento", colDelta, fmtEUR(deltaAbs), periodoTxt, colDelta);
    drawCard(xC4, isSave ? "Risparmio Annuo" : "Aumento Annuo", colDelta, fmtEUR(annVal), "annuale", colDelta);

    y += cardsH + 10;

    // Dettaglio simulazione (sottolineato)
    pickFont(doc,true); doc.setFontSize(12); doc.setTextColor(...colBlack);
    const det = "Dettaglio simulazione";
    doc.text(det, M, y);
    doc.setLineWidth(0.4);
    doc.line(M, y+1.2, M + doc.getTextWidth(det), y+1.2);
    y += 6;

    // Dettaglio simulazione (sottolineato)
    pickFont(doc,true); doc.setFontSize(12); doc.setTextColor(...colBlack);
    const det = "Dettaglio simulazione";
    doc.text(det, M, y);
    doc.setLineWidth(0.4);
    doc.line(M, y+1.2, M + doc.getTextWidth(det), y+1.2);
    y += 6;

    // Tabella dettaglio (quote)
    const vodSI = safe(data.clienteVodafone).toUpperCase()==="SI";
    const feeMonth = vodSI ? 5 : 20; // €/mese
    const feeTot = (mensilita==="2") ? (feeMonth*2) : feeMonth;

    // Valori attuali (quota consumo / fissa)
    const attCons = (mensilita==="2") ? (data.spesaBim?.quotaConsumi ?? 0) : (data.spesaAtt1?.consumo ?? 0);
    const attFix  = (mensilita==="2") ? (data.spesaBim?.quotaFissa   ?? 0) : (data.spesaAtt1?.fissa   ?? 0);

    // Valori Fastweb (quota fissa = fee; quota consumi = totale - fee)
    const fwFix  = feeTot;
    const fwCons = Math.max(0, fwTot - fwFix);

    // Header row
    doc.setDrawColor(220,220,220);
    doc.setFillColor(247,247,247);
    doc.rect(M, y, W-2*M, 8, "FD");
    pickFont(doc,true); doc.setFontSize(8.7); doc.setTextColor(...colGray);

    // Colonne (6)
    const xP  = M+2;     // Periodo
    const xK  = M+34;    // kWh
    const xAC = M+52;    // Spesa Consumi
    const xAF = M+78;    // Spesa Fissa
    const xFC = M+104;   // Quota Consumi FW
    const xFF = M+134;   // Quota Fissa FW

    doc.text("Periodo", xP, y+5.5);
    doc.text("kWh Tot.", xK, y+5.5);
    doc.text("Spesa Consumi", xAC, y+5.5);
    doc.text("Spesa Fissa", xAF, y+5.5);
    doc.text("Quota Consumi Fastweb", xFC, y+5.5);
    doc.text("Quota Fissa Fastweb", xFF, y+5.5);

    y += 8;

    // Riga unica: mensile o bimestrale (totali coerenti con selezione)
    doc.setFillColor(255,255,255);
    doc.rect(M, y, W-2*M, 8, "FD");
    pickFont(doc,false); doc.setFontSize(8.9); doc.setTextColor(...colBlack);

    const period1 = (mensilita==="2")
      ? (safe(data.mese1) + (data.anno? ("/"+safe(data.anno)) : "") + " - " + periodoTxt)
      : (safe(data.mese1) + (data.anno? ("/"+safe(data.anno)) : ""));

    const kwh1 = (safe(data.tipologia).toUpperCase().includes("MULTI"))
      ? (data.kwh1?.f1 + data.kwh1?.f2 + data.kwh1?.f3)
      : (data.kwh1?.f1 || 0);

    doc.text(period1 || "-", xP, y+5.5);
    doc.text(String(Math.round(kwh1||0)), xK, y+5.5);
    doc.text(fmtEUR(attCons), xAC, y+5.5);
    doc.text(fmtEUR(attFix),  xAF, y+5.5);
    doc.text(fmtEUR(fwCons),  xFC, y+5.5);
    doc.text(fmtEUR(fwFix),   xFF, y+5.5);

    y += 18;

    // Riferimenti commerciali in riquadro grigio chiaro a destra
    const a = data.agent || {};
    const refBoxW = 74;
    const refBoxH = 24;
    const refX = W - M - refBoxW;
    const refY = y;
    doc.setFillColor(245,245,245);
    doc.setDrawColor(220,220,220);
    doc.roundedRect(refX, refY, refBoxW, refBoxH, 3,3, "FD");

    const agentNameTC = toTitleCase(a.name || "Stefano Santarelli");
    const agentEmail  = safe(a.email || "stefano.santarelli@wincomitalia.com");
    const agentCompany= safe(a.company || "Wincom Srl");
    const agentPartner= safe(a.partner || "Vodafone Excellent Partner");

    let ty = refY + 7;
    const tx = refX + 4;
    pickFont(doc,true); doc.setFontSize(10); doc.setTextColor(...colBlack);
    doc.text(agentNameTC, tx, ty);
    ty += 5.5;
    pickFont(doc,false); doc.setFontSize(9.5); doc.setTextColor(0,102,204);
    doc.text(agentEmail, tx, ty);
    const eW = doc.getTextWidth(agentEmail);
    doc.setLineWidth(0.35); doc.setDrawColor(0,102,204);
    doc.line(tx, ty+0.8, tx+eW, ty+0.8);
    ty += 5.0;
    pickFont(doc,true); doc.setFontSize(9.5); doc.setTextColor(...colBlack);
    doc.text(agentCompany, tx, ty);
    ty += 4.8;
    pickFont(doc,false); doc.setFontSize(9); doc.setTextColor(...colGray);
    doc.text(agentPartner, tx, ty);

    // Footer
    pickFont(doc,false); doc.setFontSize(8.5); doc.setTextColor(...colGray);
    doc.text("Wincom Srl • Sede legale: Roma (RM) • wincomitalia.it", M, H-12);

    doc.save("Offerta_WINCOM.pdf");
    return true;
  }

  window.PDFEngine = { generate, ensureJsPdfLoaded };
})();
