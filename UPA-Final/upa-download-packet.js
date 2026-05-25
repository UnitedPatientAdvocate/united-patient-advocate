(function(){
  'use strict';

  var STORE_KEY = 'upa.intake.v1';

  function readJSON(value){
    try { return value ? JSON.parse(value) : {}; } catch(e) { return {}; }
  }

  function readStorageJSON(key){
    try {
      return readJSON(sessionStorage.getItem(key) || localStorage.getItem(key) || '');
    } catch(e) {
      return {};
    }
  }

  function clean(value){
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function normalizeAppIntake(form, session){
    if(!form || typeof form !== 'object') return {};
    var visitLabels = {
      outpatient:'Emergency Room / Outpatient',
      inpatient:'Hospital inpatient',
      surgery:'Surgery or Procedure',
      office:"Doctor's Office"
    };
    var insuranceLabels = {
      medicare:'Medicare',
      medicaid:'Medicaid',
      private:'Private / Employer Insurance',
      marketplace:'Marketplace / ACA Plan',
      other:'Other Insurance'
    };
    var statusLabels = {
      unpaid:'Not Paid Yet',
      payment_plan:'On Payment Plan',
      collections:'Sent to Collections',
      partially_paid:'Partial Payment'
    };
    var concerns = clean(form.specificConcerns);
    var services = clean(form.servicesReceived);
    var visitReason = clean(form.visitReason);
    return {
      submitted_at: clean(session && session.savedAt) || new Date().toISOString(),
      name: clean(session && session.patientName),
      provider: clean(form.providerName || (session && session.provider)),
      bill_amount: clean(form.totalBilled || (session && session.totalAmount)),
      bill_amount_raw: form.totalBilled ? 'other' : '',
      bill_amount_other: clean(form.totalBilled || (session && session.totalAmount)),
      bill_type: visitLabels[form.stayDuration] || visitReason || 'medical bill',
      bill_type_other: '',
      insurance: form.hasInsurance === false ? 'No Insurance (Self-Pay)' : (insuranceLabels[form.insuranceType] || clean(session && session.insurance) || 'Coverage not provided'),
      payment_status: statusLabels[form.billStatus] || clean(form.billStatus) || 'Payment status not provided',
      concerns: concerns || services || visitReason,
      concerns_raw: concerns || services || visitReason,
      concern_other: concerns,
      description: [visitReason, services, concerns].filter(Boolean).join(' | '),
      uploaded_bill: clean(form.uploadedBill || form.fileName || (session && session.uploadedBill)) || 'Not uploaded'
    };
  }

  function readIntake(){
    if(window.__UPA_PACKET_INTAKE__) return window.__UPA_PACKET_INTAKE__;
    try {
      if(window.UPAState && window.UPAState.restoreSession) window.UPAState.restoreSession({stage:'packet-download-load'});
      if(window.UPAState && window.UPAState.getIntake){
        var restored = window.UPAState.getIntake();
        if(restored && Object.keys(restored).length) return restored;
      }
      var intake = readStorageJSON(STORE_KEY);
      if(intake && Object.keys(intake).length) return intake;
      var checkout = readStorageJSON('upa.checkout.session.v2');
      if(checkout && checkout.intake) return (checkout.intake.provider || checkout.intake.name || checkout.intake.bill_amount) ? checkout.intake : normalizeAppIntake(checkout.intake, checkout);
      var paid = readStorageJSON('upa.paid.results.v2');
      if(paid && paid.session && paid.session.intake) return (paid.session.intake.provider || paid.session.intake.name || paid.session.intake.bill_amount) ? paid.session.intake : normalizeAppIntake(paid.session.intake, paid.session);
      return {};
    } catch(e) {
      return {};
    }
  }

  function packetUrl(){
    if(typeof window.upaFinalPath === 'function') return window.upaFinalPath('05_upa-packet.html');
    return '05_upa-packet.html';
  }

  function absoluteUrl(url){
    return new URL(url, window.location.href).href;
  }

  function filePart(value, fallback){
    var text = String(value || fallback || 'patient').toLowerCase();
    text = text.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return text || fallback || 'patient';
  }

  function packetFilename(intake){
    var patient = filePart(intake.patient_name || intake.name || intake.first_name || 'patient', 'patient');
    var stamp = new Date().toISOString().slice(0,10);
    return 'upa-packet-' + patient + '-' + stamp + '.html';
  }

  function letterNumberFromId(docId){
    var match = String(docId || '').match(/(\d+)/);
    var n = match ? parseInt(match[1], 10) : 1;
    return Math.max(1, Math.min(8, n || 1));
  }

  function letterFilename(intake, letterNo, title){
    var patient = filePart(intake.patient_name || intake.name || intake.first_name || 'patient', 'patient');
    var stamp = new Date().toISOString().slice(0,10);
    var label = filePart(title || ('letter-' + letterNo), 'letter-' + letterNo);
    return 'upa-' + label + '-' + patient + '-' + stamp + '.html';
  }

  function addBase(html, sourceUrl){
    if(/<base\s/i.test(html)) return html;
    var base = sourceUrl.replace(/[^\/]*$/, '');
    return html.replace(/<head([^>]*)>/i, '<head$1><base href="' + base + '">');
  }

  function addIntake(html, intake){
    var json = JSON.stringify(intake || {}).replace(/</g, '\\u003c');
    var script = '<script>window.__UPA_PACKET_INTAKE__=' + json + ';try{sessionStorage.setItem("' + STORE_KEY + '",JSON.stringify(window.__UPA_PACKET_INTAKE__));localStorage.setItem("' + STORE_KEY + '",JSON.stringify(window.__UPA_PACKET_INTAKE__));}catch(e){}<\/script>';
    if(html.indexOf('window.__UPA_PACKET_INTAKE__') > -1) return html;
    return html.replace(/<\/head>/i, script + '</head>');
  }

  function stripDownloadScript(html){
    return html.replace(/<script\b[^>]*src=["'][^"']*upa-download-packet\.js[^"']*["'][^>]*>\s*<\/script>/ig, '');
  }

  function inlinePersonalization(html, scriptText){
    if(!scriptText) return html;
    var safe = scriptText.replace(/<\/script/gi, '<\\/script');
    return html.replace(/<script\b[^>]*src=["'][^"']*upa-case-personalization\.js[^"']*["'][^>]*>\s*<\/script>/i, '<script>' + safe + '<\/script>');
  }

  async function loadText(url){
    if(typeof fetch === 'function') {
      var res = await fetch(url, { cache: 'no-store' });
      if(!res.ok) throw new Error('Unable to load ' + url);
      return res.text();
    }
    return new Promise(function(resolve, reject){
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function(){
          if(xhr.readyState !== 4) return;
          if(xhr.status >= 200 && xhr.status < 300) resolve(xhr.responseText);
          else reject(new Error('Unable to load ' + url));
        };
        xhr.send();
      } catch(e) {
        reject(e);
      }
    });
  }

  function currentPacketSnapshot(){
    var html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    html = html.replace(/<button class="btn-d"[^>]*>[\s\S]*?<\/button>/i, '');
    return html;
  }

  function downloadFile(html, filename){
    var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1500);
  }

  function notify(title, sub){
    if(typeof window.showToast === 'function') {
      window.showToast(title, sub);
      return;
    }
    var live = document.getElementById('upa-download-status');
    if(!live) {
      live = document.createElement('div');
      live.id = 'upa-download-status';
      live.setAttribute('aria-live', 'polite');
      live.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:99999;background:#1C2B48;color:white;border-radius:8px;padding:10px 14px;font:700 12px system-ui,sans-serif;box-shadow:0 10px 32px rgba(0,0,0,.24)';
      document.body.appendChild(live);
    }
    live.textContent = title;
    clearTimeout(live._t);
    live._t = setTimeout(function(){ live.remove(); }, 2600);
  }

  function sanitizeLetterElement(element){
    var clone = element.cloneNode(true);
    Array.prototype.slice.call(clone.querySelectorAll('.nf-sh,.mini-shield,img[alt*="United Patient Advocate"],img[alt*="UPA"]')).forEach(function(node){
      node.remove();
    });
    var ownerDoc = clone.ownerDocument || document;
    var filter = (ownerDoc.defaultView && ownerDoc.defaultView.NodeFilter) || window.NodeFilter;
    if(ownerDoc.createTreeWalker && filter){
      var walker = ownerDoc.createTreeWalker(clone, filter.SHOW_TEXT, null);
      var textNodes = [];
      var node;
      while((node = walker.nextNode())) textNodes.push(node);
      textNodes.forEach(function(textNode){
        textNode.nodeValue = textNode.nodeValue
          .replace(/United Patient Advocate/g, '')
          .replace(/UPA REVIEW/g, 'account number')
          .replace(/\bUPA-\d{8}-[A-Z0-9]+\b/g, 'account number')
          .replace(/Help us improve UPA, share ideas and features you'd like to see added:/g, '')
          .replace(/Help us improve UPA, share ideas and features you’d like to see added:/g, '')
          .replace(/\bsupport@unitedpatientadvocate\.com\b/g, '')
          .replace(/\bWe are formally requesting\b/g, 'I am formally requesting')
          .replace(/\bWe are disputing\b/g, 'I am disputing');
      });
    }
    return clone.outerHTML;
  }

  async function buildDownloadHtml(){
    var intake = readIntake();
    var onPacketPage = /05_upa-packet\.html(?:$|[?#])/i.test(window.location.pathname);
    var sourceUrl = absoluteUrl(packetUrl());
    var html = onPacketPage ? currentPacketSnapshot() : await loadText(sourceUrl);
    var personalization = '';
    try {
      personalization = await loadText(new URL('upa-case-personalization.js', sourceUrl).href);
    } catch(e) {}
    html = addBase(html, sourceUrl);
    html = addIntake(html, intake);
    html = inlinePersonalization(html, personalization);
    html = stripDownloadScript(html);
    return { html: html, filename: packetFilename(intake) };
  }

  function buildCardLetterHtml(docId, intake, letterNo){
    var card = document.getElementById(docId);
    if(!card) throw new Error('Letter card not found');
    var titleNode = card.querySelector('.dpc-title');
    var title = titleNode ? clean(titleNode.textContent) : 'Letter ' + letterNo;
    var paper = card.querySelector('.dpc-paper');
    var prepared = card.querySelector('.dpc-prepared');
    var styles = Array.prototype.slice.call(document.querySelectorAll('style')).map(function(style){ return style.textContent; }).join('\n');
    var base = window.location.href.replace(/[^\/]*$/, '');
    var letterBody = sanitizeLetterElement(paper || card);
    var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><base href="' + base + '"><title>' + escapeHTML(title) + '</title><style>' + styles + '\nbody{padding:28px 24px;background:#E9EEF5;font-family:"Plus Jakarta Sans",system-ui,sans-serif}.single-letter-wrap{max-width:840px;margin:0 auto}.single-letter-card{background:white;border:1px solid rgba(28,43,72,.12);border-radius:14px;padding:28px 32px 32px;box-shadow:0 16px 48px rgba(17,28,46,.14)}.single-letter-title{font:800 26px Georgia,serif;color:#1C2B48;margin:0 0 4px;letter-spacing:-0.01em}.single-letter-sub{font:700 12px system-ui,sans-serif;color:#6E8898;margin-bottom:22px;letter-spacing:0.06em;text-transform:uppercase}.single-letter-actions{display:flex;justify-content:flex-end;margin-bottom:14px}.single-letter-actions button{font:700 13px system-ui,sans-serif;border:1px solid rgba(28,43,72,.16);background:#fff;color:#1C2B48;border-radius:7px;padding:9px 14px;cursor:pointer}.single-letter-actions button:hover{background:#1C2B48;color:#fff}\n/* === Letter — readable sizes (override tiny card preview) === */\n.dpc-paper{height:auto!important;min-height:auto!important;max-width:none!important;width:auto!important;margin:0 auto!important;border-radius:10px!important;border:1px solid rgba(17,28,46,.08)!important;box-shadow:none!important;overflow:visible!important;position:relative!important;font-family:"Plus Jakarta Sans",system-ui,sans-serif!important;color:#1C2B48!important;background:#FFFEFB!important}\n.dpc-paper::before{height:5px!important}\n.mini-lh{padding:24px 36px 18px!important;align-items:flex-start!important;background:linear-gradient(180deg,#FEFDFB,#FAFAF7)!important}\n.mini-lh-left{gap:12px!important;align-items:center!important}\n.mini-shield{width:46px!important;height:46px!important;flex-shrink:0!important}\n.mini-org{font-size:15.5px!important;font-weight:700!important;line-height:1.25!important;color:#1C2B48!important;letter-spacing:-0.005em!important}\n.mini-org-sub{font-size:9.5px!important;letter-spacing:0.18em!important;margin-top:3px!important;color:#6E8898!important;text-transform:uppercase!important;font-weight:600!important}\n.mini-date{font-size:12.5px!important;text-align:right!important;color:#42546B!important;font-weight:600!important}\n.mini-ref{font-family:"DM Mono",ui-monospace,monospace!important;font-size:11px!important;margin-top:3px!important;color:#7A8AA0!important}\n.mini-body{padding:28px 36px 44px!important;position:relative!important}\n.mini-to{font-size:14px!important;line-height:1.65!important;margin-bottom:18px!important;color:#2E4060!important;white-space:pre-line!important}\n.mini-re{font-family:"DM Mono",ui-monospace,monospace!important;font-size:13.5px!important;padding:11px 14px!important;margin-bottom:22px!important;border-left-width:4px!important;line-height:1.55!important;background:rgba(17,28,46,.045)!important;font-weight:700!important;color:#1C2B48!important}\n.mini-salut{font-size:15px!important;margin-bottom:14px!important;font-weight:600!important;color:#1C2B48!important}\n.mini-text{font-size:14.5px!important;line-height:1.78!important;margin-bottom:16px!important;color:#324560!important}\n.mini-highlight{display:block!important;font-size:14.5px!important;line-height:1.78!important;padding:12px 14px!important;margin-bottom:18px!important;background:#FFF6BF!important;border-radius:5px!important;border-left:4px solid #E6C84A!important;color:#1C2B48!important;font-weight:500!important}\n.mini-text-2{font-size:13.5px!important;line-height:1.72!important;margin-bottom:28px!important;color:#42546B!important}\n.mini-sig{padding-top:22px!important;border-top:1px dashed rgba(17,28,46,0.16)!important;justify-content:flex-start!important;display:block!important}\n.mini-sig-close{font-size:13.5px!important;margin-bottom:8px!important;color:#42546B!important}\n.mini-sig-name{font-family:Georgia,serif!important;font-size:28px!important;font-style:italic!important;color:#1C2B48!important;line-height:1.1!important}\n.mini-sig-sub{font-size:10.5px!important;margin-top:6px!important;letter-spacing:0.14em!important;text-transform:uppercase!important;color:#6E8898!important;font-weight:600!important;display:block!important}\n.mini-stamp{position:absolute!important;right:32px!important;bottom:32px!important;width:96px!important;height:96px!important;display:block!important;opacity:0.92!important}\n.mini-stamp svg{width:100%!important;height:100%!important}\n@media print{body{padding:0;background:white}.single-letter-actions{display:none}.single-letter-card{box-shadow:none;border:none;padding:0}.single-letter-title,.single-letter-sub{display:none}.dpc-paper{transform:none!important;border:none!important;border-radius:0!important}}<\/style></head><body><div class="single-letter-actions"><button onclick="window.print()">Print / Save PDF</button></div><div class="single-letter-wrap"><div class="single-letter-card"><h1 class="single-letter-title">' + escapeHTML(title) + '</h1><div class="single-letter-sub">' + escapeHTML(prepared ? prepared.textContent : 'Prepared letter') + '</div>' + letterBody + '</div></div></body></html>';
    return { html: html, filename: letterFilename(intake, letterNo, title), title: title, letterNo: letterNo };
  }

  async function buildLetterHtml(docId){
    var letterNo = letterNumberFromId(docId);
    var intake = readIntake();
    try {
      var sourceUrl = absoluteUrl(packetUrl());
      var packet = await loadText(sourceUrl);
      var personalization = '';
      try {
        personalization = await loadText(new URL('upa-case-personalization.js', sourceUrl).href);
      } catch(e) {}
      var parser = new DOMParser();
      var doc = parser.parseFromString(packet, 'text/html');
      var pages = Array.prototype.slice.call(doc.querySelectorAll('.page'));
      var labels = Array.prototype.slice.call(doc.querySelectorAll('.pg-lbl'));
      var pageIndex = 7 + letterNo;
      var page = pages[pageIndex];
      var label = labels[pageIndex];
      if(!page) throw new Error('Letter page not found');
      var titleNode = page.querySelector('.ltb-title') || page.querySelector('.lb-re-txt') || label;
      var title = titleNode ? clean(titleNode.textContent) : 'Letter ' + letterNo;
      var styles = Array.prototype.slice.call(doc.querySelectorAll('style')).map(function(style){ return style.textContent; }).join('\n');
      var base = sourceUrl.replace(/[^\/]*$/, '');
      var intakeScript = '<script>window.__UPA_PACKET_INTAKE__=' + JSON.stringify(intake || {}).replace(/</g, '\\u003c') + ';try{sessionStorage.setItem("' + STORE_KEY + '",JSON.stringify(window.__UPA_PACKET_INTAKE__));localStorage.setItem("' + STORE_KEY + '",JSON.stringify(window.__UPA_PACKET_INTAKE__));}catch(e){}<\/script>';
      var personalizationScript = personalization ? '<script>' + personalization.replace(/<\/script/gi, '<\\/script') + '<\/script>' : '';
      var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><base href="' + base + '"><title>' + escapeHTML(title) + '</title><style>' + styles + '\nbody{padding:20px;background:#E9EEF5}.single-letter-wrap{max-width:900px;margin:0 auto}.single-letter-actions{display:flex;justify-content:flex-end;gap:8px;margin:0 auto 12px;max-width:820px}.single-letter-actions button{font:700 12px system-ui,sans-serif;border:1px solid rgba(28,43,72,.16);background:#fff;color:#1C2B48;border-radius:6px;padding:8px 12px;cursor:pointer}@media print{body{padding:0;background:white}.single-letter-actions{display:none}.pg-lbl{display:block}}<\/style>' + intakeScript + '</head><body><div class="single-letter-actions"><button onclick="window.print()">Print / Save PDF</button></div><div class="single-letter-wrap">' + (label ? sanitizeLetterElement(label) : '') + sanitizeLetterElement(page) + '</div>' + personalizationScript + '</body></html>';
      return { html: html, filename: letterFilename(intake, letterNo, title), title: title, letterNo: letterNo };
    } catch(e) {
      if(window.console && console.warn) console.warn('UPA full letter extraction fell back to card preview', e);
      return buildCardLetterHtml(docId, intake, letterNo);
    }
  }

  window.upaDownloadPacket = async function(evt){
    if(evt && evt.preventDefault) evt.preventDefault();
    try {
      var packet = await buildDownloadHtml();
      downloadFile(packet.html, packet.filename);
      notify('Packet downloaded', 'The prepared packet file has been saved to your downloads.');
    } catch(e) {
      notify('Opening packet', 'Use Print / Save PDF from the packet page if the file download is blocked.');
      window.open(packetUrl(), '_blank');
    }
    return false;
  };

  function printWindowHtml(html){
    var w = window.open('', '_blank', 'width=900,height=1000');
    if(!w) throw new Error('Print window blocked');
    var printScript = '<script>window.addEventListener("load",function(){setTimeout(function(){window.focus();window.print();},350);});<\/script>';
    w.document.open();
    w.document.write(html.replace(/<\/body>/i, printScript + '</body>'));
    w.document.close();
    return w;
  }

  window.upaPrintFullPackage = async function(evt){
    if(evt && evt.preventDefault) evt.preventDefault();
    try {
      var packet = await buildDownloadHtml();
      printWindowHtml(packet.html);
      notify('Print packet opened', 'Use your browser print dialog to print or save the tailored packet.');
    } catch(e) {
      notify('Opening packet', 'Use Print / Save PDF from the packet page if the print window is blocked.');
      window.open(packetUrl(), '_blank');
    }
    return false;
  };

  window.upaDownloadLetter = async function(evt, docId){
    if(evt && evt.preventDefault) evt.preventDefault();
    try {
      var letter = await buildLetterHtml(docId);
      downloadFile(letter.html, letter.filename);
      notify('Letter downloaded', 'Only this prepared letter was saved to your downloads.');
    } catch(e) {
      if(window.console && console.error) console.error('UPA letter download failed', e);
      notify('Letter unavailable', 'Open the packet page and use Print / Save PDF for this letter.');
    }
    return false;
  };

  window.upaPreviewLetter = async function(evt, docId){
    if(evt && evt.preventDefault) evt.preventDefault();
    try {
      var letter = await buildLetterHtml(docId);
      var modal = document.getElementById('upa-letter-preview-modal');
      if(!modal) {
        modal = document.createElement('div');
        modal.id = 'upa-letter-preview-modal';
        modal.innerHTML = '<div class="ulp-backdrop" data-close="1"></div><div class="ulp-panel" role="dialog" aria-modal="true" aria-labelledby="ulp-title"><div class="ulp-head"><div><div class="ulp-label">Letter Preview</div><div id="ulp-title" class="ulp-title"></div></div><div class="ulp-actions"><button type="button" id="ulp-download">Download Letter</button><button type="button" data-close="1">Close</button></div></div><iframe class="ulp-frame" title="Letter preview"></iframe></div>';
        document.body.appendChild(modal);
        modal.addEventListener('click', function(e){
          if(e.target && e.target.getAttribute('data-close')) modal.classList.remove('open');
        });
      }
      var style = document.getElementById('upa-letter-preview-style');
      if(!style) {
        style = document.createElement('style');
        style.id = 'upa-letter-preview-style';
        style.textContent = '#upa-letter-preview-modal{position:fixed;inset:0;z-index:100000;display:none}#upa-letter-preview-modal.open{display:block}.ulp-backdrop{position:absolute;inset:0;background:rgba(8,16,29,.72);backdrop-filter:blur(5px)}.ulp-panel{position:absolute;inset:28px;display:flex;flex-direction:column;background:#F5F7FA;border:1px solid rgba(255,255,255,.18);border-radius:12px;box-shadow:0 24px 80px rgba(0,0,0,.38);overflow:hidden}.ulp-head{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 16px;background:#111C2E;color:white;border-bottom:1px solid rgba(255,255,255,.10)}.ulp-label{font:800 9px system-ui,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:rgba(235,244,255,.48);margin-bottom:2px}.ulp-title{font:800 15px system-ui,sans-serif;color:#fff}.ulp-actions{display:flex;gap:8px}.ulp-actions button{font:800 12px system-ui,sans-serif;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:white;border-radius:6px;padding:8px 11px;cursor:pointer}.ulp-actions #ulp-download{background:#1EB87A;border-color:rgba(30,184,122,.45)}.ulp-frame{flex:1;width:100%;border:0;background:#E9EEF5}@media(max-width:720px){.ulp-panel{inset:10px}.ulp-head{align-items:flex-start;flex-direction:column}.ulp-actions{width:100%}.ulp-actions button{flex:1}}';
        document.head.appendChild(style);
      }
      modal.querySelector('#ulp-title').textContent = letter.title;
      modal.querySelector('.ulp-frame').srcdoc = letter.html;
      modal.querySelector('#ulp-download').onclick = function(e){ return window.upaDownloadLetter(e, docId); };
      modal.classList.add('open');
      notify('Letter preview opened', 'Review this letter, then download or print it when ready.');
    } catch(e) {
      if(window.console && console.error) console.error('UPA letter preview failed', e);
      notify('Preview unavailable', 'Open the Documents tab or packet page to review this letter.');
    }
    return false;
  };

  window.upaPrintPacketPDF = function(evt){
    return window.upaPrintFullPackage(evt);
  };

  function escapeHTML(value){
    return String(value == null ? '' : value).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }
})();
