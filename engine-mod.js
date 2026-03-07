/**
 * engine-mod.js — Motore Modulistica Fastweb Energia
 * Versione: 1.0 | Compatibile con manuale-v59+
 *
 * Espone:  window.openModulistica(data)
 *   @param data  {ragioneSociale, piva, indirizzoPOD, codicePOD, offerta, tipoContatore}
 *
 * Flusso:
 *   1. Riceve i dati già inseriti nel configuratore (nessuna reinserzione richiesta)
 *   2. Apre un modal overlay con il form del Preventivo Fastweb Energia
 *   3. I campi ricevuti vengono pre-popolati e resi di sola lettura (con unlock facoltativo)
 *   4. Al click su "Genera PDF" apre una finestra di stampa HTML→PDF identica al modulo originale
 *
 * File PDF vuoto richiesto:  NON necessario — il PDF viene generato via window.print()
 * dalla finestra di anteprima HTML, senza dipendenze esterne.
 */

(function (global) {
  "use strict";

  /* ─────────────────────────────────────────────
   * 0. GUARD — evita inizializzazioni multiple
   * ─────────────────────────────────────────────*/
  if (global.__engineModReady) return;
  global.__engineModReady = true;

  /* ─────────────────────────────────────────────
   * 1. STILI MODAL
   * ─────────────────────────────────────────────*/
  const STYLE_ID = "__engineModStyle";
  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
      #__engineModOverlay {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(10,15,30,.55);
        backdrop-filter: blur(7px);
        -webkit-backdrop-filter: blur(7px);
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: 'DM Sans', system-ui, sans-serif;
      }
      #__engineModOverlay.active { display: flex; }

      #__engineModBox {
        width: min(700px, calc(100vw - 24px));
        max-height: 92vh;
        overflow-y: auto;
        background: #fff;
        border-radius: 20px;
        box-shadow: 0 28px 90px rgba(0,0,0,.28);
        padding: 28px 28px 24px;
        position: relative;
        color: #0f1117;
      }
      #__engineModBox::-webkit-scrollbar { width: 5px; }
      #__engineModBox::-webkit-scrollbar-thumb { background: rgba(0,0,0,.15); border-radius: 4px; }

      #__engineModBox h2 {
        margin: 0 0 4px;
        font-size: 19px;
        font-weight: 800;
        letter-spacing: -.3px;
      }
      #__engineModBox .em-sub {
        font-size: 12.5px;
        color: #7a8099;
        margin: 0 0 20px;
      }
      #__engineModBox .em-close {
        position: absolute;
        top: 16px; right: 18px;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #7a8099;
        line-height: 1;
        padding: 4px 6px;
        border-radius: 8px;
        transition: background .12s;
      }
      #__engineModBox .em-close:hover { background: #f0f2f6; color: #0f1117; }

      /* Sezione header */
      .em-section {
        background: #0f1117;
        color: #fff;
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: .1em;
        text-transform: uppercase;
        padding: 6px 12px;
        border-radius: 6px;
        margin: 18px 0 12px;
      }
      .em-section:first-of-type { margin-top: 0; }

      /* Badge "pre-compilato" */
      .em-prefill-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 10px;
        font-weight: 600;
        background: #edf7f1;
        color: #1a7a3c;
        border: 1px solid rgba(26,122,60,.25);
        border-radius: 999px;
        padding: 2px 8px;
        margin-left: 6px;
        vertical-align: middle;
      }

      /* Grid righe */
      .em-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px; }
      .em-row.em-row1 { grid-template-columns: 1fr; }
      .em-row.em-row3 { grid-template-columns: 1fr 1fr 1fr; }
      @media (max-width: 520px) {
        .em-row, .em-row3 { grid-template-columns: 1fr; }
      }

      /* Campi */
      .em-field { display: flex; flex-direction: column; gap: 5px; }
      .em-field label {
        font-size: 10.5px;
        font-weight: 600;
        color: #7a8099;
        text-transform: uppercase;
        letter-spacing: .06em;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0;
        margin: 0;
      }
      .em-field input, .em-field select {
        height: 42px;
        padding: 0 12px;
        border-radius: 9px;
        border: 1.5px solid rgba(15,17,23,.13);
        background: #fff;
        color: #0f1117;
        font-family: inherit;
        font-size: 14px;
        font-weight: 500;
        outline: none;
        transition: border-color .14s, box-shadow .14s;
        box-shadow: 0 1px 3px rgba(15,17,23,.05);
        width: 100%;
        box-sizing: border-box;
      }
      .em-field input:focus, .em-field select:focus {
        border-color: #FFC800;
        box-shadow: 0 0 0 3px rgba(180,140,0,.16);
      }
      .em-field input.em-locked {
        background: #f7f8fc;
        color: #5a6070;
        border-color: rgba(15,17,23,.08);
        cursor: not-allowed;
        box-shadow: none;
        opacity: .8;
      }
      .em-field input[type="date"] { font-size: 13px; }

      /* Select arrow */
      .em-select-wrap { position: relative; }
      .em-select-wrap::after {
        content: '';
        position: absolute; right: 12px; top: 50%;
        transform: translateY(-50%);
        width: 0; height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 6px solid #7a8099;
        pointer-events: none;
      }
      .em-field select { appearance: none; -webkit-appearance: none; padding-right: 32px; cursor: pointer; }

      /* Radio group */
      .em-radio-group { display: flex; flex-wrap: wrap; gap: 8px 18px; padding: 4px 0; }
      .em-radio-group label {
        display: flex; align-items: center; gap: 7px;
        font-size: 13px; font-weight: 500;
        color: #0f1117; text-transform: none; letter-spacing: 0;
        cursor: pointer;
      }
      .em-radio-group input[type="radio"] { accent-color: #FFC800; width: 16px; height: 16px; }

      /* Divider */
      .em-hr { height: 1px; background: rgba(15,17,23,.08); margin: 6px 0 14px; }

      /* Nota unlock */
      .em-unlock-note {
        font-size: 11px;
        color: #7a8099;
        margin-top: 3px;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .em-unlock-note a {
        color: #997800;
        cursor: pointer;
        text-decoration: underline;
        font-weight: 600;
        border: none;
        background: none;
        padding: 0;
        font-size: inherit;
      }

      /* Actions */
      .em-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-top: 22px;
      }
      .em-btn-primary {
        padding: 13px;
        border-radius: 12px;
        border: none;
        background: linear-gradient(180deg, rgba(0,150,0,.92), rgba(0,120,0,.85));
        color: #fff;
        font-family: inherit;
        font-weight: 800;
        font-size: 14px;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(0,0,0,.14);
        transition: filter .15s, transform .06s;
      }
      .em-btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
      .em-btn-secondary {
        padding: 13px;
        border-radius: 12px;
        border: 1.5px solid rgba(15,17,23,.14);
        background: rgba(15,17,23,.04);
        color: #0f1117;
        font-family: inherit;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        transition: background .12s;
      }
      .em-btn-secondary:hover { background: rgba(15,17,23,.08); }
    `;
    document.head.appendChild(s);
  }

  /* ─────────────────────────────────────────────
   * 2. COSTRUZIONE MODAL DOM
   * ─────────────────────────────────────────────*/
  function buildModal() {
    if (document.getElementById("__engineModOverlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "__engineModOverlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Compila Modulistica Preventivo Fastweb Energia");

    overlay.innerHTML = `
      <div id="__engineModBox">
        <button class="em-close" id="__emClose" title="Chiudi">✕</button>
        <h2>Compila Modulistica</h2>
        <p class="em-sub">Preventivo Fastweb Energia — i campi evidenziati sono già stati pre-compilati dai dati inseriti nel configuratore.</p>

        <!-- ═══════════ NOME OFFERTA ═══════════ -->
        <div class="em-section">Nome Offerta</div>
        <div class="em-row">
          <div class="em-field">
            <label>Offerta Selezionata <span class="em-prefill-badge">✓ Pre-compilato</span></label>
            <input id="em_offerta" class="em-locked" readonly />
          </div>
          <div class="em-field">
            <label>Tipo Contatore <span class="em-prefill-badge">✓ Pre-compilato</span></label>
            <input id="em_contatore" class="em-locked" readonly />
          </div>
        </div>
        <div class="em-unlock-note">
          <span>🔒 Modifica questi valori nel configuratore oppure</span>
          <a id="__emUnlockOfferta">sblocca per modifica manuale</a>
        </div>

        <!-- ═══════════ DATI ANAGRAFICI ═══════════ -->
        <div class="em-section">Dati Anagrafici e di Residenza</div>

        <div class="em-row em-row1">
          <div class="em-field">
            <label>Ragione Sociale <span class="em-prefill-badge">✓ Pre-compilato</span></label>
            <input id="em_ragione" class="em-locked" readonly placeholder="Ragione sociale azienda" />
          </div>
        </div>
        <div class="em-unlock-note" style="margin-bottom:10px">
          <span>🔒 Compilato dal campo "Ragione sociale" del configuratore PDF —</span>
          <a id="__emUnlockAnagrafica">sblocca per modifica</a>
        </div>

        <div class="em-row">
          <div class="em-field">
            <label>P.IVA <span class="em-prefill-badge">✓ Pre-compilato</span></label>
            <input id="em_piva" class="em-locked" readonly placeholder="Es. IT12345678901" />
          </div>
          <div class="em-field">
            <label>Codice Fiscale</label>
            <input id="em_cf" placeholder="Codice Fiscale" maxlength="16" />
          </div>
        </div>

        <div class="em-row">
          <div class="em-field">
            <label>Codice ATECO</label>
            <input id="em_ateco" placeholder="Es. 35.14.00" />
          </div>
          <div class="em-field">
            <label>Nome Legale Rappresentante</label>
            <input id="em_legale" placeholder="Nome e Cognome" />
          </div>
        </div>

        <div class="em-row em-row3">
          <div class="em-field">
            <label>Indirizzo Sede Legale</label>
            <input id="em_indirizzo" placeholder="Via/Piazza..." />
          </div>
          <div class="em-field">
            <label>CAP</label>
            <input id="em_cap" placeholder="00000" maxlength="5" />
          </div>
          <div class="em-field">
            <label>Comune</label>
            <input id="em_comune" placeholder="Comune" />
          </div>
        </div>

        <div class="em-row">
          <div class="em-field">
            <label>Provincia</label>
            <input id="em_provincia" placeholder="Es. RM" maxlength="2" />
          </div>
          <div class="em-field">
            <label>Telefono / Cellulare</label>
            <input id="em_tel" type="tel" placeholder="+39 3xx xxx xxxx" />
          </div>
        </div>

        <div class="em-row">
          <div class="em-field">
            <label>E-mail</label>
            <input id="em_email" type="email" placeholder="nome@azienda.it" />
          </div>
          <div class="em-field">
            <label>PEC</label>
            <input id="em_pec" type="email" placeholder="nome@pec.it" />
          </div>
        </div>

        <div class="em-row">
          <div class="em-field">
            <label>Tipo Documento</label>
            <div class="em-select-wrap">
              <select id="em_tipoDoc">
                <option value="">— Seleziona —</option>
                <option>Carta d'Identità</option>
                <option>Passaporto</option>
                <option>Patente di Guida</option>
                <option>Permesso di Soggiorno</option>
              </select>
            </div>
          </div>
          <div class="em-field">
            <label>Numero Documento</label>
            <input id="em_numDoc" placeholder="Es. AX1234567" />
          </div>
        </div>

        <div class="em-row">
          <div class="em-field">
            <label>Data Rilascio</label>
            <input id="em_dataRil" type="date" />
          </div>
          <div class="em-field">
            <label>Data Scadenza</label>
            <input id="em_dataScad" type="date" />
          </div>
        </div>

        <div class="em-row">
          <div class="em-field">
            <label>Rilasciato da</label>
            <input id="em_rilDa" placeholder="Es. Comune di Roma" />
          </div>
          <div class="em-field">
            <label>Nazione di Rilascio</label>
            <input id="em_nazione" placeholder="Es. Italia" />
          </div>
        </div>

        <!-- ═══════════ DATI TECNICI ═══════════ -->
        <div class="em-section">Dati Tecnici di Fornitura</div>

        <div class="em-row em-row1">
          <div class="em-field">
            <label>Codice POD <span class="em-prefill-badge">✓ Pre-compilato</span></label>
            <input id="em_pod" class="em-locked" readonly placeholder="IT001E00000000" />
          </div>
        </div>
        <div class="em-row em-row1" style="margin-bottom:10px">
          <div class="em-field">
            <label>Indirizzo Fornitura POD <span class="em-prefill-badge">✓ Pre-compilato</span></label>
            <input id="em_indForn" class="em-locked" readonly placeholder="Indirizzo fornitura" />
          </div>
        </div>
        <div class="em-unlock-note" style="margin-bottom:12px">
          <span>🔒 Compilato dai campi "Id POD" e "Indirizzo POD" del configuratore —</span>
          <a id="__emUnlockTecnico">sblocca per modifica</a>
        </div>

        <div class="em-row">
          <div class="em-field">
            <label>Consumo Annuo (kWh/anno)</label>
            <input id="em_consumo" type="number" min="0" placeholder="Es. 10000" />
          </div>
          <div class="em-field">
            <label>Potenza Impegnata (kW)</label>
            <input id="em_potenza" type="number" min="0" step="0.1" placeholder="Es. 6" />
          </div>
        </div>

        <div class="em-field" style="margin-bottom:10px">
          <label>Tipologia Impianto</label>
          <div class="em-radio-group" id="em_rg_impianto">
            <label><input type="radio" name="em_impianto" value="monofase" /> Monofase (230 V)</label>
            <label><input type="radio" name="em_impianto" value="trifase"  /> Trifase (400 V)</label>
          </div>
        </div>

        <div class="em-field" style="margin-bottom:10px">
          <label>Tipo di Fornitura</label>
          <div class="em-radio-group" id="em_rg_fornitura">
            <label><input type="radio" name="em_fornitura" value="singola"   /> Singola</label>
            <label><input type="radio" name="em_fornitura" value="multisito" /> Multisito</label>
          </div>
        </div>

        <div class="em-field" style="margin-bottom:14px">
          <label>Titolarità Immobile</label>
          <div class="em-radio-group" id="em_rg_titolarita">
            <label><input type="radio" name="em_titolarita" value="proprieta" /> Proprietà / Usufrutto</label>
            <label><input type="radio" name="em_titolarita" value="locazione"  /> Locazione / Comodato</label>
            <label><input type="radio" name="em_titolarita" value="altro"      /> Altro</label>
          </div>
        </div>

        <!-- ═══════════ DATI DI PAGAMENTO ═══════════ -->
        <div class="em-section">Dati di Pagamento</div>
        <p style="font-size:12px;color:#7a8099;margin:-8px 0 12px">
          I seguenti dati potrebbero differire dall'intestatario aziendale — compilali solo se necessario.
        </p>

        <div class="em-row">
          <div class="em-field">
            <label>Intestatario / Rapp. Legale</label>
            <input id="em_intestatario" placeholder="Nome e Cognome" />
          </div>
          <div class="em-field">
            <label>Ragione Sociale (pagamento)</label>
            <input id="em_ragPag" placeholder="Se diversa dall'azienda" />
          </div>
        </div>

        <div class="em-row em-row1">
          <div class="em-field">
            <label>IBAN</label>
            <input id="em_iban" placeholder="IT60 X054 2811 1010 0000 0123 456" maxlength="34" style="font-family:'DM Mono',monospace;letter-spacing:.04em" />
          </div>
        </div>

        <div class="em-row">
          <div class="em-field">
            <label>C.F. Intestatario</label>
            <input id="em_cfInt" placeholder="Codice Fiscale intestatario" maxlength="16" />
          </div>
          <div class="em-field">
            <label>Tipo Cliente</label>
            <div class="em-radio-group">
              <label><input type="radio" name="em_tipo_cliente" value="b2b" /> B2B</label>
              <label><input type="radio" name="em_tipo_cliente" value="b2c" /> B2C</label>
            </div>
          </div>
        </div>

        <div class="em-row">
          <div class="em-field">
            <label>P.IVA (pagamento)</label>
            <input id="em_pivaPag" placeholder="Se diversa" />
          </div>
          <div class="em-field">
            <label>Codice SDI</label>
            <input id="em_sdi" placeholder="Es. 0000000" maxlength="7" />
          </div>
        </div>

        <!-- ═══════════ FIRMA ═══════════ -->
        <div class="em-section">Luogo e Data di Firma</div>
        <div class="em-row">
          <div class="em-field">
            <label>Firma 1 — Luogo e Data</label>
            <input id="em_luogoData1" placeholder="Es. Roma, 07/03/2026" />
          </div>
          <div class="em-field">
            <label>Firma 2 — Luogo e Data (B2B)</label>
            <input id="em_luogoData2" placeholder="Es. Roma, 07/03/2026" />
          </div>
        </div>

        <!-- ═══════════ AZIONI ═══════════ -->
        <div class="em-hr" style="margin-top:18px"></div>
        <div class="em-actions">
          <button class="em-btn-primary" id="__emGenerate">📄 Genera PDF Modulistica</button>
          <button class="em-btn-secondary" id="__emClose2">Annulla</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // — Close handlers
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
    document.getElementById("__emClose").addEventListener("click", closeModal);
    document.getElementById("__emClose2").addEventListener("click", closeModal);

    // — Unlock handlers
    document.getElementById("__emUnlockOfferta").addEventListener("click", function () {
      unlockField("em_offerta");
      unlockField("em_contatore");
      this.closest(".em-unlock-note").style.display = "none";
    });
    document.getElementById("__emUnlockAnagrafica").addEventListener("click", function () {
      unlockField("em_ragione");
      unlockField("em_piva");
      this.closest(".em-unlock-note").style.display = "none";
    });
    document.getElementById("__emUnlockTecnico").addEventListener("click", function () {
      unlockField("em_pod");
      unlockField("em_indForn");
      this.closest(".em-unlock-note").style.display = "none";
    });

    // — Generate PDF handler
    document.getElementById("__emGenerate").addEventListener("click", generatePreventivoPDF);
  }

  function unlockField(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.readOnly = false;
    el.classList.remove("em-locked");
    el.focus();
  }

  /* ─────────────────────────────────────────────
   * 3. OPEN / CLOSE
   * ─────────────────────────────────────────────*/
  function openModal() {
    const overlay = document.getElementById("__engineModOverlay");
    if (overlay) {
      overlay.classList.add("active");
      // Scroll to top
      const box = document.getElementById("__engineModBox");
      if (box) box.scrollTop = 0;
    }
  }

  function closeModal() {
    const overlay = document.getElementById("__engineModOverlay");
    if (overlay) overlay.classList.remove("active");
  }

  /* ─────────────────────────────────────────────
   * 4. PRE-POPOLAMENTO CAMPI
   * ─────────────────────────────────────────────*/
  function prefill(data) {
    function set(id, val) {
      const el = document.getElementById(id);
      if (el && val) el.value = val;
    }

    // Dati dall'offerta
    const offertaLabel = data.offerta === "FIX"
      ? "Fastweb Energia Business Fix"
      : data.offerta === "FLEX"
      ? "Fastweb Energia Business Flex"
      : (data.offerta || "");

    const contatoreLabel = data.tipoContatore === "MULTI"
      ? "Multiorario (MULTI)"
      : data.tipoContatore === "MONO"
      ? "Monorario (MONO)"
      : (data.tipoContatore || "");

    set("em_offerta",   offertaLabel);
    set("em_contatore", contatoreLabel);
    set("em_ragione",   data.ragioneSociale);
    set("em_piva",      data.piva);
    set("em_pod",       data.codicePOD);
    set("em_indForn",   data.indirizzoPOD);

    // Radio offerta (pre-seleziona tipo fornitura singola di default)
    const r = document.querySelector('input[name="em_fornitura"][value="singola"]');
    if (r) r.checked = true;

    // B2B di default per offerta Business
    const rb2b = document.querySelector('input[name="em_tipo_cliente"][value="b2b"]');
    if (rb2b) rb2b.checked = true;
  }

  /* ─────────────────────────────────────────────
   * 5. RACCOLTA DATI FORM
   * ─────────────────────────────────────────────*/
  function collectFormData() {
    function v(id) {
      const el = document.getElementById(id);
      return el ? el.value.trim() : "";
    }
    function radio(name) {
      const el = document.querySelector(`input[name="${name}"]:checked`);
      return el ? el.value : "";
    }

    return {
      offerta:        v("em_offerta"),
      contatore:      v("em_contatore"),
      ragioneSociale: v("em_ragione"),
      piva:           v("em_piva"),
      cf:             v("em_cf"),
      ateco:          v("em_ateco"),
      legale:         v("em_legale"),
      indirizzo:      v("em_indirizzo"),
      cap:            v("em_cap"),
      comune:         v("em_comune"),
      provincia:      v("em_provincia"),
      tel:            v("em_tel"),
      email:          v("em_email"),
      pec:            v("em_pec"),
      tipoDoc:        v("em_tipoDoc"),
      numDoc:         v("em_numDoc"),
      dataRil:        v("em_dataRil"),
      dataScad:       v("em_dataScad"),
      rilDa:          v("em_rilDa"),
      nazione:        v("em_nazione"),
      pod:            v("em_pod"),
      indForn:        v("em_indForn"),
      consumo:        v("em_consumo"),
      potenza:        v("em_potenza"),
      impianto:       radio("em_impianto"),
      fornitura:      radio("em_fornitura"),
      titolarita:     radio("em_titolarita"),
      intestatario:   v("em_intestatario"),
      ragPag:         v("em_ragPag"),
      iban:           v("em_iban"),
      cfInt:          v("em_cfInt"),
      tipoCliente:    radio("em_tipo_cliente"),
      pivaPag:        v("em_pivaPag"),
      sdi:            v("em_sdi"),
      luogoData1:     v("em_luogoData1"),
      luogoData2:     v("em_luogoData2"),
    };
  }

  /* ─────────────────────────────────────────────
   * 6. GENERAZIONE PDF (window.print)
   * ─────────────────────────────────────────────*/
  function generatePreventivoPDF() {
    const d = collectFormData();

    const chk = (cond) => cond
      ? '<span style="font-size:12pt">☑</span>'
      : '<span style="font-size:12pt;color:#ccc">☐</span>';

    const val = (v, fallback) => v
      ? `<span style="color:#0f1117;font-weight:500">${escHtml(v)}</span>`
      : `<span style="color:#c8ccd8">${fallback || "________________________"}</span>`;

    function escHtml(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    const impiantoLabel = d.impianto === "monofase"
      ? "Monofase (230 V)"
      : d.impianto === "trifase"
      ? "Trifase (400 V)"
      : "";

    const fornituraLabel = d.fornitura === "singola"
      ? "Singola"
      : d.fornitura === "multisito"
      ? "Multisito"
      : "";

    const titolaritaLabel = d.titolarita === "proprieta"
      ? "Proprietà / Usufrutto / Abitazione per decesso del convivente di fatto"
      : d.titolarita === "locazione"
      ? "Locazione / Comodato (Atto già registrato o in corso di registrazione)"
      : d.titolarita === "altro"
      ? "Altro documento che non necessita di registrazione"
      : "";

    const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>Preventivo Fastweb Energia – ${escHtml(d.ragioneSociale || "")}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'DM Sans',sans-serif;font-size:9pt;color:#111;background:#fff;padding:13mm 14mm;}
  .hdr{text-align:center;border-bottom:2.5px solid #111;padding-bottom:8px;margin-bottom:10px;}
  .hdr-top{font-size:6.5pt;color:#666;line-height:1.5;}
  .hdr-title{font-size:15pt;font-weight:800;margin:7px 0 2px;letter-spacing:.04em;}
  .hdr-sub{font-size:9.5pt;color:#444;font-weight:600;}
  .hdr-intro{font-size:7.5pt;color:#666;margin-top:5px;line-height:1.5;}
  .sec{background:#111;color:#fff;font-size:7.5pt;font-weight:700;letter-spacing:.12em;
       text-transform:uppercase;padding:4px 9px;margin:10px 0 7px;border-radius:4px;}
  .row{display:flex;gap:10px;margin-bottom:7px;align-items:flex-end;flex-wrap:wrap;}
  .fld{flex:1;min-width:80px;}
  .fld-lbl{font-size:6.5pt;color:#777;font-weight:700;letter-spacing:.07em;text-transform:uppercase;margin-bottom:2px;}
  .fld-val{border-bottom:1px solid #444;min-height:15px;padding:1px 2px;font-size:8.5pt;}
  .fld-mono .fld-val{font-family:'DM Mono',monospace;font-size:8pt;}
  .offer-box{border:1px solid #ddd;padding:7px 10px;margin-bottom:8px;border-radius:4px;}
  .offer-cols{display:flex;gap:20px;}
  .offer-col-title{font-size:7.5pt;font-weight:700;text-decoration:underline;margin-bottom:4px;}
  .offer-item{font-size:8pt;margin-bottom:3px;}
  .chk-row{display:flex;flex-wrap:wrap;gap:5px 14px;margin-bottom:7px;align-items:center;}
  .chk-item{display:flex;align-items:center;gap:4px;font-size:8pt;}
  .firma-box{border:1px solid #bbb;padding:8px 10px;margin-top:10px;border-radius:4px;}
  .firma-row{display:flex;gap:28px;margin-top:7px;align-items:flex-end;}
  .firma-line{border-bottom:1px solid #444;flex:1;min-height:18px;}
  .print-btn{position:fixed;bottom:18px;right:18px;background:#1a3a6b;color:#fff;
             border:none;padding:11px 22px;border-radius:8px;font-size:12pt;
             font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.2);}
  .print-btn:hover{background:#2255aa;}
  @media print{.print-btn{display:none!important;} body{padding:8mm 10mm;}}
</style>
</head>
<body>

<div class="hdr">
  <div class="hdr-top">
    Fastweb S.p.A. — Sede legale e amministrativa Piazza Adriano Olivetti, 1, 20139 Milano — Tel. [+39] 02.45451<br>
    Capitale Sociale euro 41.344.209,40 i.v. — C.F., P.IVA e Iscrizione Reg. Imprese MI 12878470157<br>
    N. Iscr. Reg. AEE: IT08020000003838 — N. Iscr. Reg. Pile e Acc.: IT09100P00001900 — Contributo Ambientale CONAI assolto<br>
    Società soggetta all'attività di direzione e coordinamento di Swisscom AG — Settembre 2024
  </div>
  <div class="hdr-title">RICHIESTA DI PREVENTIVO</div>
  <div class="hdr-sub">Fastweb Energia – Energia Elettrica</div>
  <div class="hdr-intro">
    Il cliente, di seguito indicato, richiede a Fastweb S.p.A. Società a socio unico e soggetta all'attività di
    direzione e coordinamento di Swisscom AG, con sede legale e amministrativa in Piazza Adriano Olivetti, 1,
    20139 Milano, la fornitura di energia elettrica.
  </div>
</div>

<!-- NOME OFFERTA -->
<div class="sec">Nome Offerta</div>
<div class="offer-box">
  <div class="offer-cols">
    <div>
      <div class="offer-col-title">Consumer:</div>
      <div class="offer-item">${chk(false)} Fastweb Energia Light</div>
      <div class="offer-item">${chk(false)} Fastweb Energia Full</div>
      <div class="offer-item">${chk(false)} Fastweb Energia Maxi</div>
      <div class="offer-item">${chk(false)} Fastweb Energia Flex</div>
      <div class="offer-item">${chk(false)} Fastweb Energia Fix</div>
    </div>
    <div>
      <div class="offer-col-title">Business:</div>
      <div class="offer-item">${chk(d.offerta === "Fastweb Energia Business Flex" || d.offerta === "FLEX")} Fastweb Energia Business Flex</div>
      <div class="offer-item">${chk(d.offerta === "Fastweb Energia Business Fix" || d.offerta === "FIX")} Fastweb Energia Business Fix</div>
    </div>
  </div>
</div>

<!-- DATI ANAGRAFICI -->
<div class="sec">Dati Anagrafici e di Residenza</div>
<div class="row"><div class="fld" style="flex:3">
  <div class="fld-lbl">Ragione Sociale</div>
  <div class="fld-val">${val(d.ragioneSociale)}</div>
</div></div>
<div class="row">
  <div class="fld" style="flex:3"><div class="fld-lbl">Indirizzo Sede Legale</div><div class="fld-val">${val(d.indirizzo)}</div></div>
  <div class="fld" style="flex:.6"><div class="fld-lbl">CAP</div><div class="fld-val">${val(d.cap, "_____")}</div></div>
</div>
<div class="row">
  <div class="fld" style="flex:3"><div class="fld-lbl">Comune</div><div class="fld-val">${val(d.comune)}</div></div>
  <div class="fld" style="flex:.5"><div class="fld-lbl">Prov.</div><div class="fld-val">${val(d.provincia, "__")}</div></div>
</div>
<div class="row">
  <div class="fld fld-mono"><div class="fld-lbl">Codice Fiscale</div><div class="fld-val">${val(d.cf, "________________")}</div></div>
  <div class="fld fld-mono"><div class="fld-lbl">P.IVA</div><div class="fld-val">${val(d.piva, "___________")}</div></div>
  <div class="fld"><div class="fld-lbl">ATECO</div><div class="fld-val">${val(d.ateco, "________")}</div></div>
</div>
<div class="row">
  <div class="fld"><div class="fld-lbl">Legale Rappresentante</div><div class="fld-val">${val(d.legale)}</div></div>
</div>
<div class="row">
  <div class="fld"><div class="fld-lbl">Tipo Documento</div><div class="fld-val">${val(d.tipoDoc)}</div></div>
  <div class="fld fld-mono"><div class="fld-lbl">Numero Documento</div><div class="fld-val">${val(d.numDoc)}</div></div>
</div>
<div class="row">
  <div class="fld"><div class="fld-lbl">Data Rilascio</div><div class="fld-val">${val(d.dataRil, "__/__/____")}</div></div>
  <div class="fld"><div class="fld-lbl">Data Scadenza</div><div class="fld-val">${val(d.dataScad, "__/__/____")}</div></div>
  <div class="fld"><div class="fld-lbl">Rilasciato da</div><div class="fld-val">${val(d.rilDa)}</div></div>
  <div class="fld"><div class="fld-lbl">Nazione di Rilascio</div><div class="fld-val">${val(d.nazione)}</div></div>
</div>
<div class="row">
  <div class="fld fld-mono"><div class="fld-lbl">Telefono / Cellulare</div><div class="fld-val">${val(d.tel)}</div></div>
</div>
<div class="row">
  <div class="fld"><div class="fld-lbl">E-mail</div><div class="fld-val">${val(d.email)}</div></div>
  <div class="fld"><div class="fld-lbl">PEC</div><div class="fld-val">${val(d.pec)}</div></div>
</div>

<!-- DATI TECNICI -->
<div class="sec">Dati Tecnici di Fornitura</div>
<div class="row">
  <div class="fld fld-mono" style="flex:2"><div class="fld-lbl">Codice POD</div><div class="fld-val">${val(d.pod, "IT___E_______________")}</div></div>
  <div class="fld"><div class="fld-lbl">Consumo (kWh/anno)</div><div class="fld-val">${val(d.consumo)}</div></div>
  <div class="fld" style="flex:.7"><div class="fld-lbl">Pot. Imp. (kW)</div><div class="fld-val">${val(d.potenza)}</div></div>
  <div class="fld" style="flex:.5"><div class="fld-lbl">Tensione</div><div class="fld-val">BT</div></div>
</div>
<div class="row">
  <div class="fld" style="flex:3"><div class="fld-lbl">Indirizzo di Fornitura POD</div><div class="fld-val">${val(d.indForn)}</div></div>
</div>
<div class="chk-row" style="margin-top:4px">
  <span style="font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#777">Tipologia impianto:</span>
  <span class="chk-item">${chk(d.impianto==="monofase")} Monofase (230 V)</span>
  <span class="chk-item">${chk(d.impianto==="trifase")} Trifase (400 V)</span>
  <span style="font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#777;margin-left:12px">Tipo Fornitura:</span>
  <span class="chk-item">${chk(d.fornitura==="singola")} Singola</span>
  <span class="chk-item">${chk(d.fornitura==="multisito")} Multisito</span>
</div>
<div style="margin-top:5px;font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#777;margin-bottom:4px">Titolarità immobile:</div>
<div class="chk-row">
  <span class="chk-item">${chk(d.titolarita==="proprieta")} Proprietà / Usufrutto / Abitazione per decesso del convivente di fatto</span>
  <span class="chk-item">${chk(d.titolarita==="locazione")} Locazione / Comodato (Atto già registrato o in corso di registrazione)</span>
  <span class="chk-item">${chk(d.titolarita==="altro")} Altro documento che non necessita di registrazione</span>
</div>

<!-- DATI PAGAMENTO -->
<div class="sec">Dati di Pagamento</div>
<div class="row">
  <div class="fld"><div class="fld-lbl">Intestatario / Rapp. Legale</div><div class="fld-val">${val(d.intestatario)}</div></div>
  <div class="fld"><div class="fld-lbl">Ragione Sociale</div><div class="fld-val">${val(d.ragPag)}</div></div>
</div>
<div class="row">
  <div class="fld fld-mono" style="flex:2"><div class="fld-lbl">IBAN</div><div class="fld-val">${val(d.iban, "IT__ ____ ____ ____ ____ ____ ___")}</div></div>
  <div class="fld fld-mono"><div class="fld-lbl">C.F. Intestatario</div><div class="fld-val">${val(d.cfInt, "________________")}</div></div>
</div>
<div class="row">
  <div class="fld fld-mono"><div class="fld-lbl">P.IVA</div><div class="fld-val">${val(d.pivaPag)}</div></div>
  <div class="fld" style="flex:.6"><div class="fld-lbl">Tipo</div><div class="fld-val">${d.tipoCliente ? (d.tipoCliente==="b2b" ? "☑ B2B  ☐ B2C" : "☐ B2B  ☑ B2C") : "☐ B2B  ☐ B2C"}</div></div>
  <div class="fld"><div class="fld-lbl">Codice SDI</div><div class="fld-val">${val(d.sdi)}</div></div>
</div>

<!-- FIRMA -->
<div class="firma-box">
  <div style="font-size:7.5pt;line-height:1.5;color:#555">
    Il Cliente dichiara di aver letto e compreso tutte le clausole contrattuali e di accettare le condizioni
    relative all'offerta sopra indicata, nonché di aver ricevuto l'informativa privacy.
  </div>
  <div class="firma-row">
    <div style="flex:1.5"><div style="font-size:7pt;color:#777;margin-bottom:2px">Luogo e data</div>
      <div class="firma-line">${val(d.luogoData1, "________________________, __ / __ / ____")}</div></div>
    <div style="flex:1"><div style="font-size:7pt;color:#777;margin-bottom:2px">Firma</div>
      <div class="firma-line"></div></div>
  </div>
  <div style="margin-top:10px;font-size:7.5pt;line-height:1.5;color:#555">
    Il Cliente dichiara altresì di aver ricevuto la proposta contrattuale nell'ambito di un appuntamento per la
    proposizione dei servizi Fastweb all'azienda.
  </div>
  <div class="firma-row">
    <div style="flex:1.5"><div style="font-size:7pt;color:#777;margin-bottom:2px">Luogo e data</div>
      <div class="firma-line">${val(d.luogoData2, "________________________, __ / __ / ____")}</div></div>
    <div style="flex:1"><div style="font-size:7pt;color:#777;margin-bottom:2px">Firma</div>
      <div class="firma-line"></div></div>
  </div>
</div>

<button class="print-btn" onclick="window.print()">🖨️ Stampa / Salva PDF</button>
</body>
</html>`;

    const w = window.open("", "_blank");
    if (!w) {
      alert("Popup bloccato dal browser.\nConsenti i popup per questa pagina e riprova.");
      return;
    }
    w.document.write(html);
    w.document.close();
    closeModal();
  }

  /* ─────────────────────────────────────────────
   * 7. ENTRY POINT PUBBLICO
   * ─────────────────────────────────────────────*/
  global.openModulistica = function (data) {
    buildModal();
    prefill(data || {});
    openModal();
  };

})(window);
