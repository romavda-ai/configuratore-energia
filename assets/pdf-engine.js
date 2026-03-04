/* pdf-engine.js (v55) - Motore PDF (layout + render)
   Dipendenze: jsPDF UMD già caricato (assets/jspdf.umd.min.js)
   API: window.PDFEngine.generate(data)
*/
(function(){
  const safe = (s)=> String(s ?? "").trim();
  const toTitleCase = (s)=> safe(s).split(/\s+/).map(w=> w ? (w[0].toUpperCase()+w.slice(1).toLowerCase()) : "").join(" ");
  const fmtEUR = (n)=> (Number.isFinite(n)? n:0).toLocaleString("it-IT",{minimumFractionDigits:2, maximumFractionDigits:2}) + " €";

  function pickFont(doc, bold){
    try{ doc.setFont("helvetica", bold ? "bold" : "normal"); }catch(e){}
  }

  async function generate(data){
    const jsPDFCtor = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : (window.jsPDF || null);
    if(!jsPDFCtor) throw new Error("jsPDF non disponibile: verifica assets/jspdf.umd.min.js");

    const mensilita = safe(data.mensilita || "1");
    const periodoTxt = (mensilita==="2") ? "bimestre" : "mensile";

    const attTot = (mensilita==="2") ? (data.totals?.attBim ?? 0) : (data.spesaAtt1?.totale ?? data.totals?.att1 ?? 0);
    const fwTot  = (mensilita==="2") ? (data.totals?.fwBim ?? 0)  : (data.totals?.fw1 ?? 0);

    const signedDelta = attTot - fwTot;
    const isSave = signedDelta >= 0;
    const deltaAbs = Math.abs(signedDelta);
    const annMult = (mensilita==="2") ? 6 : 12;
    const annVal = deltaAbs * annMult;

    // Fee (quota fissa fastweb): 5 se SI, 20 se NO, moltiplicata per mesi
    const vodSI = safe(data.clienteVodafone).toUpperCase() === "SI";
    const feeMonth = vodSI ? 5 : 20;
    const feeTot = (mensilita==="2") ? (feeMonth*2) : feeMonth;

    // Attuale: quota consumi/fissa per tabella
    const attCons = (mensilita==="2") ? (data.spesaBim?.quotaConsumi ?? 0) : (data.spesaAtt1?.consumo ?? 0);
    const attFix  = (mensilita==="2") ? (data.spesaBim?.quotaFissa   ?? 0) : (data.spesaAtt1?.fissa   ?? 0);

    const fwFix  = feeTot;
    const fwCons = Math.max(0, fwTot - fwFix);

    // Colors
    const colBlack = [17,17,17];
    const colGray  = [90,90,90];
    const colYel   = [250, 199, 26];
    const colGreen = [20, 150, 60];
    const colRed   = [210, 50, 50];
    const colDelta = isSave ? colGreen : colRed;

    const doc = new jsPDFCtor({ unit:"mm", format:"a4" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 16;
    let y = 18;

    // Header
    pickFont(doc,true); doc.setFontSize(16); doc.setTextColor(...colBlack);
    doc.text("OFFERTA ENERGIA – FASTWEB", M, y);
    y += 6;
    pickFont(doc,true); doc.setFontSize(11); doc.setTextColor(...colGray);
    doc.text("Documento di sintesi", M, y);
    y += 10;

    // Panels
    const panelGap = 4;
    const panelW = (W - 2*M - panelGap)/2;
    const panelH = 36;
    const pY = y;

    doc.setDrawColor(220,220,220);
    doc.setFillColor(247,247,247);
    doc.roundedRect(M, pY, panelW, panelH, 3,3, "FD");
    doc.roundedRect(M+panelW+panelGap, pY, panelW, panelH, 3,3, "FD");

    pickFont(doc,true); doc.setFontSize(11); doc.setTextColor(...colBlack);
    doc.text("Dati cliente", M+4, pY+7);
    doc.text("Parametri simulazione", M+panelW+panelGap+4, pY+7);

    const cl = data.cliente || {};
    const pr = {
      offerta: safe(data.offerta),
      vodafone: safe(data.clienteVodafone),
      periodo: safe(data.mese1) + (data.anno? ("/"+safe(data.anno)) : ""),
      tipo: safe(data.tipologia)
    };

    pickFont(doc,true); doc.setFontSize(8.8); doc.setTextColor(...colBlack);
    const rlab = (xR, yy, lab)=> doc.text(lab, xR, yy, {align:"right"});
    pickFont(doc,false);

    const lXr = M + 36, lXv = lXr + 2;
    const rXr = M + panelW + panelGap + 44, rXv = rXr + 2;

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

    let yy = pY + 14, gapY = 5.2;
    for(let i=0;i<4;i++){
      pickFont(doc,true); rlab(lXr, yy, linesL[i][0]);
      pickFont(doc,false); doc.text(linesL[i][1] || "-", lXv, yy);
      yy += gapY;
    }
    yy = pY + 14;
    for(let i=0;i<4;i++){
      pickFont(doc,true); rlab(rXr, yy, linesR[i][0]);
      pickFont(doc,false); doc.text(linesR[i][1] || "-", rXv, yy);
      yy += gapY;
    }

    y = pY + panelH + 8;

    // Intro
    pickFont(doc,false); doc.setFontSize(9); doc.setTextColor(...colGray);
    doc.text("Facendo seguito alle intercorse intese, riportiamo di seguito le condizioni a lei riservate.", M, y);
    y += 4.5;
    doc.text("In caso di accettazione dell'offerta, provvederemo a sottoporre alla sua firma il modulo con le condizioni concordate.", M, y);
    y += 10;

    // Riepilogo title (underlined)
    pickFont(doc,true); doc.setFontSize(12); doc.setTextColor(...colBlack);
    const sec = "Riepilogo economico";
    doc.text(sec, M, y);
    doc.setLineWidth(0.4);
    doc.line(M, y+1.2, M + doc.getTextWidth(sec), y+1.2);
    y += 6;

    // 4 cards
    const cardsH = 26, gap4 = 3.2;
    const cardW = (W - 2*M - 3*gap4) / 4;
    const xC1=M, xC2=xC1+cardW+gap4, xC3=xC2+cardW+gap4, xC4=xC3+cardW+gap4;

    const drawCard = (x, title, col, value, sub)=>{
      doc.setDrawColor(220,220,220);
      doc.setFillColor(255,255,255);
      doc.roundedRect(x, y, cardW, cardsH, 3,3, "FD");
      pickFont(doc,true); doc.setFontSize(9.5); doc.setTextColor(...col);
      doc.text(title, x+3, y+6);
      pickFont(doc,true); doc.setFontSize(13.5); doc.setTextColor(...col);
      doc.text(value, x+3, y+14);
      pickFont(doc,false); doc.setFontSize(9); doc.setTextColor(...col);
      doc.text(sub, x+3, y+21.5);
    };

    drawCard(xC1, "Totale spesa attuale", colBlack, fmtEUR(attTot), periodoTxt);
    drawCard(xC2, "Totale stimato Fastweb", colYel, fmtEUR(fwTot), periodoTxt);
    drawCard(xC3, isSave ? "Risparmio" : "Aumento", colDelta, fmtEUR(deltaAbs), periodoTxt);
    drawCard(xC4, isSave ? "Risparmio Annuo" : "Aumento Annuo", colDelta, fmtEUR(annVal), "annuale");

    y += cardsH + 10;

    // Dettaglio (underlined)
    pickFont(doc,true); doc.setFontSize(12); doc.setTextColor(...colBlack);
    const det = "Dettaglio simulazione";
    doc.text(det, M, y);
    doc.setLineWidth(0.4);
    doc.line(M, y+1.2, M + doc.getTextWidth(det), y+1.2);
    y += 6;

    // Table header (6 cols)
    doc.setDrawColor(220,220,220);
    doc.setFillColor(247,247,247);
    doc.rect(M, y, W-2*M, 8, "FD");
    pickFont(doc,true); doc.setFontSize(8.7); doc.setTextColor(...colGray);

    const xP=M+2, xK=M+34, xAC=M+52, xAF=M+78, xFC=M+104, xFF=M+140;
    doc.text("Periodo", xP, y+5.5);
    doc.text("kWh Tot.", xK, y+5.5);
    doc.text("Spesa Consumi", xAC, y+5.5);
    doc.text("Spesa Fissa", xAF, y+5.5);
    doc.text("Quota Consumi Fastweb", xFC, y+5.5);
    doc.text("Quota Fissa Fastweb", xFF, y+5.5);
    y += 8;

    // Row
    doc.setFillColor(255,255,255);
    doc.rect(M, y, W-2*M, 8, "FD");
    pickFont(doc,false); doc.setFontSize(8.9); doc.setTextColor(...colBlack);

    const period1 = (mensilita==="2")
      ? (safe(data.mese1) + (data.anno? ("/"+safe(data.anno)) : "") + " - " + periodoTxt)
      : (safe(data.mese1) + (data.anno? ("/"+safe(data.anno)) : ""));

    const kwh1 = (safe(data.tipologia).toUpperCase().includes("MULTI"))
      ? ((data.kwh1?.f1||0) + (data.kwh1?.f2||0) + (data.kwh1?.f3||0))
      : (data.kwh1?.f1 || 0);

    doc.text(period1 || "-", xP, y+5.5);
    doc.text(String(Math.round(kwh1||0)), xK, y+5.5);
    doc.text(fmtEUR(attCons), xAC, y+5.5);
    doc.text(fmtEUR(attFix),  xAF, y+5.5);
    doc.text(fmtEUR(fwCons),  xFC, y+5.5);
    doc.text(fmtEUR(fwFix),   xFF, y+5.5);

    y += 18;

    // Riferimenti commerciali (riquadro grigio chiaro a destra)
    const a = data.agent || {};
    const refBoxW = 74, refBoxH = 24;
    const refX = W - M - refBoxW, refY = y+4;
    doc.setFillColor(245,245,245);
    doc.setDrawColor(220,220,220);
    doc.roundedRect(refX, refY, refBoxW, refBoxH, 3,3, "FD");

    const agentNameTC = toTitleCase(a.name || "Stefano Santarelli");
    const agentEmail  = safe(a.email || "stefano.santarelli@wincomitalia.com");
    const agentCompany= safe(a.company || "Wincom Srl");
    const agentPartner= safe(a.partner || "Vodafone Excellent Partner");

    let ty = refY + 7, tx = refX + 4;
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

  window.PDFEngine = { generate };
})();
