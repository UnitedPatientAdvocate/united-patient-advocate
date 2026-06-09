(function(){
  'use strict';

  var SCAN_KEY = 'upa.billscan.v1';
  var PDF_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  function clean(value){
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function readJSON(key){
    try{
      var raw = sessionStorage.getItem(key) || localStorage.getItem(key) || '';
      return raw ? JSON.parse(raw) : null;
    }catch(e){
      return null;
    }
  }

  function writeJSON(key, value){
    var raw;
    try{ raw = JSON.stringify(value || {}); }catch(e){ return false; }
    try{ sessionStorage.setItem(key, raw); }catch(e){}
    try{ localStorage.setItem(key, raw); }catch(e){}
    return true;
  }

  function titleCaseOrg(value){
    value = clean(value).replace(/[|]/g, ' ').replace(/\s{2,}/g, ' ');
    if(!value) return '';
    if(value === value.toUpperCase()){
      value = value.toLowerCase().replace(/\b([a-z])/g, function(m){ return m.toUpperCase(); });
      value = value.replace(/\bLlc\b/g, 'LLC').replace(/\bInc\b/g, 'Inc.').replace(/\bEr\b/g, 'ER');
    }
    return value.replace(/[,:;-]+$/,'').trim();
  }

  function moneyText(value){
    var n = Number(String(value || '').replace(/[$,\s]/g, ''));
    if(!isFinite(n)) return '';
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function parseDateToISO(value){
    var raw = clean(value).replace(/,$/,'');
    if(!raw) return '';
    var m = raw.match(/\b(0?[1-9]|1[0-2])[\/.-](0?[1-9]|[12]\d|3[01])[\/.-]((?:19|20)?\d{2})\b/);
    if(m){
      var year = m[3].length === 2 ? Number('20' + m[3]) : Number(m[3]);
      var d = new Date(year, Number(m[1]) - 1, Number(m[2]));
      if(!isNaN(d.getTime())) return d.toISOString().slice(0,10);
    }
    m = raw.match(/\b((?:19|20)\d{2})[\/.-](0?[1-9]|1[0-2])[\/.-](0?[1-9]|[12]\d|3[01])\b/);
    if(m){
      var d2 = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      if(!isNaN(d2.getTime())) return d2.toISOString().slice(0,10);
    }
    m = raw.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+([0-3]?\d),?\s+((?:19|20)\d{2})\b/i);
    if(m){
      var d3 = new Date(m[1] + ' ' + m[2] + ', ' + m[3]);
      if(!isNaN(d3.getTime())) return d3.toISOString().slice(0,10);
    }
    return '';
  }

  function firstMoney(text){
    var m = String(text || '').match(/\$?\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{2})?)/);
    return m ? moneyText(m[1]) : '';
  }

  function moneyNumber(value){
    var n = Number(String(value || '').replace(/[$,\s]/g, ''));
    return isFinite(n) ? n : null;
  }

  function linesFromText(text){
    return String(text || '')
      .replace(/\r/g, '\n')
      .split(/\n+/)
      .map(function(line){ return clean(line); })
      .filter(Boolean);
  }

  function rejectProviderLine(line){
    return /patient|account|statement|invoice|claim|amount|balance|date|service|insurance|payer|subscriber|member|phone|fax|address|city|state|zip|page\s+\d/i.test(line) ||
      /^\$/.test(line) ||
      line.length < 3 ||
      line.length > 90;
  }

  function extractProvider(lines, joined){
    var label = joined.match(/\b(?:provider|facility|hospital|billing provider|service provider|medical group|pay to)\s*(?:name)?\s*[:#-]\s*([A-Z0-9][A-Za-z0-9&'.,\- ]{2,80})/i);
    if(label && !rejectProviderLine(label[1])){
      return { value:titleCaseOrg(label[1]), confidence:0.82, source:'provider label' };
    }
    var keywords = /hospital|medical center|health system|healthcare|clinic|physicians|medical group|radiology|imaging|laboratory|lab|ambulance|anesthesia|urgent care|surgery center|billing services/i;
    for(var i = 0; i < Math.min(lines.length, 45); i++){
      var line = lines[i];
      if(keywords.test(line) && !rejectProviderLine(line)){
        return { value:titleCaseOrg(line), confidence:i < 12 ? 0.76 : 0.62, source:'top-of-bill organization line' };
      }
    }
    return null;
  }

  function labeledMoney(lines, labels){
    for(var i = 0; i < labels.length; i++){
      for(var j = 0; j < lines.length; j++){
        var match = lines[j].match(labels[i].pattern);
        if(!match) continue;
        var afterLabel = lines[j].slice((match.index || 0) + match[0].length);
        var amount = firstMoney(afterLabel) || firstMoney(lines[j]);
        if(amount){
          return { value:amount, confidence:0.9, source:labels[i].source };
        }
      }
    }
    return null;
  }

  function extractAmounts(lines, joined){
    var totalBilled = labeledMoney(lines, [
      { pattern:/\btotal\s+billed\s+charges?\b/i, source:'total billed charges' },
      { pattern:/\btotal\s+charges?\b/i, source:'total charges' },
      { pattern:/\btotal\s+amount\s+billed\b/i, source:'total amount billed' },
      { pattern:/\btotal\s+due\b/i, source:'total due' },
      { pattern:/\bamount\s+due\b/i, source:'amount due' },
      { pattern:/^\s*total\b/i, source:'total' }
    ]);
    var amountOwed = labeledMoney(lines, [
      { pattern:/\bpatient\s+responsibility\b/i, source:'patient responsibility' },
      { pattern:/\bpatient\s+balance\b/i, source:'patient balance' },
      { pattern:/\bamount\s+you\s+owe\b/i, source:'amount you owe' },
      { pattern:/\bbalance\s+due\b/i, source:'balance due' }
    ]);

    if(!totalBilled){
      var all = joined.match(/\$\s*(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{2})?/g) || [];
      var largest = all.map(moneyNumber).filter(function(value){ return value !== null && value > 0; }).sort(function(a,b){ return b-a; })[0];
      if(largest != null) totalBilled = { value:moneyText(largest), confidence:0.42, source:'largest currency value on bill' };
    }

    return { totalBilled:totalBilled, amountOwed:amountOwed };
  }

  function extractServiceDate(joined){
    var dateRx = '((?:0?[1-9]|1[0-2])[\\/. -](?:0?[1-9]|[12]\\d|3[01])[\\/. -](?:(?:19|20)?\\d{2})|(?:19|20)\\d{2}[\\/. -](?:0?[1-9]|1[0-2])[\\/. -](?:0?[1-9]|[12]\\d|3[01])|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\.?\\s+[0-3]?\\d,?\\s+(?:19|20)\\d{2})';
    var strong = new RegExp('(?:date of service|service date|service from|service period|dos|visit date)\\s*[:#-]?\\s*' + dateRx, 'i');
    var m = joined.match(strong);
    if(m){
      var iso = parseDateToISO(m[1]);
      if(iso) return { value:iso, confidence:0.84, source:'date of service label' };
    }
    var weak = new RegExp('(?:statement date|bill date)\\s*[:#-]?\\s*' + dateRx, 'i');
    m = joined.match(weak);
    if(m){
      var iso2 = parseDateToISO(m[1]);
      if(iso2) return { value:iso2, confidence:0.36, source:'statement date, needs confirmation' };
    }
    return null;
  }

  function extractAccount(joined){
    var m = joined.match(/\b(?:account|acct|claim|invoice|statement|reference|guarantor)\s*(?:number|no\.?|#|id)?\s*[:#-]?\s*([A-Z0-9][A-Z0-9-]{3,30})\b/i);
    if(m && !/date|amount|total/i.test(m[1])){
      return { value:m[1], confidence:0.74, source:'account or claim label' };
    }
    return null;
  }

  function extractInsurance(joined){
    var known = joined.match(/\b(Aetna|Anthem|Blue Cross(?: Blue Shield)?|BCBS|Cigna|Humana|Kaiser|Medicare Advantage|Medicare|Medicaid|UnitedHealthcare|United Healthcare|UHC|TRICARE|VA Benefits|Oscar|Molina|Ambetter)\b/i);
    if(known) return { value:titleCaseOrg(known[1]), confidence:0.76, source:'payer name' };
    var m = joined.match(/\b(?:insurance|payer|health plan|primary plan|plan name)\s*[:#-]\s*([A-Z0-9][A-Za-z0-9&'.,\- ]{2,60})/i);
    if(m) return { value:titleCaseOrg(m[1]), confidence:0.64, source:'insurance label' };
    return null;
  }

  function buildFindings(fields){
    var findings = [];
    if(fields.amount){
      findings.push({
        type:'Amount verification',
        title:'Billed amount found in the uploaded document',
        summary:'The scan found ' + fields.amount.value + ' on the bill. This amount should be reconciled against the itemized statement, EOB, adjustments, and remaining patient responsibility.',
        confidence:fields.amount.confidence,
        source:fields.amount.source
      });
    }
    if(fields.provider){
      findings.push({
        type:'Provider match',
        title:'Provider identity detected',
        summary:'The scan identified ' + fields.provider.value + ' as the likely billing provider. Confirm this matches the statement before sending documents.',
        confidence:fields.provider.confidence,
        source:fields.provider.source
      });
    }
    if(fields.serviceDate || fields.account || fields.insurance){
      findings.push({
        type:'Case identifiers',
        title:'Case identifiers found for document matching',
        summary:'The scan found ' + [
          fields.serviceDate ? 'service date ' + fields.serviceDate.value : '',
          fields.account ? 'account/reference ' + fields.account.value : '',
          fields.insurance ? 'coverage/payer ' + fields.insurance.value : ''
        ].filter(Boolean).join(', ') + '. These values help tie the review packet to the uploaded bill.',
        confidence:0.62,
        source:'document identifiers'
      });
    }
    if(!findings.length){
      findings.push({
        type:'Confirmation needed',
        title:'The uploaded document needs manual confirmation',
        summary:'The file was received, but the scan could not confidently read provider, amount, or service date. The review will ask the user to confirm these values before relying on them.',
        confidence:0.2,
        source:'fallback'
      });
    }
    return findings.slice(0,3);
  }

  function analyzeText(text, fileMeta){
    var lines = linesFromText(text);
    var joined = clean(lines.join(' '));
    var fields = {};
    var provider = extractProvider(lines, joined);
    var amounts = extractAmounts(lines, joined);
    var amount = amounts.totalBilled;
    var amountOwed = amounts.amountOwed;
    var serviceDate = extractServiceDate(joined);
    var account = extractAccount(joined);
    var insurance = extractInsurance(joined);
    if(provider) fields.provider = provider;
    if(amount) fields.amount = amount;
    if(amountOwed) fields.amountOwed = amountOwed;
    if(serviceDate) fields.serviceDate = serviceDate;
    if(account) fields.account = account;
    if(insurance) fields.insurance = insurance;
    var confidence = Object.keys(fields).reduce(function(sum, key){ return sum + (fields[key].confidence || 0); }, 0) / Math.max(1, Object.keys(fields).length);
    return {
      ok:!!text,
      status:text ? 'extracted' : 'needs-confirmation',
      extractedAt:new Date().toISOString(),
      file:fileMeta || null,
      pageTextLength:text.length,
      fields:fields,
      totalBilled:amount ? moneyNumber(amount.value) : null,
      amountOwed:amountOwed ? moneyNumber(amountOwed.value) : null,
      findings:buildFindings(fields),
      confidence:Math.round(confidence * 100) / 100,
      textSample:joined.slice(0, 4000),
      warnings:text ? [] : ['No readable PDF text was extracted.']
    };
  }

  async function extractPdfText(file){
    if(!window.pdfjsLib) throw new Error('PDF.js unavailable');
    if(window.pdfjsLib.GlobalWorkerOptions && !window.pdfjsLib.GlobalWorkerOptions.workerSrc){
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER;
    }
    var buffer = await file.arrayBuffer();
    var pdf = await window.pdfjsLib.getDocument({ data:buffer }).promise;
    var chunks = [];
    var maxPages = Math.min(pdf.numPages || 1, 6);
    for(var pageNo = 1; pageNo <= maxPages; pageNo++){
      var page = await pdf.getPage(pageNo);
      var content = await page.getTextContent();
      var pageLines = [];
      var currentLine = [];
      content.items.forEach(function(item){
        if(item.str) currentLine.push(item.str);
        if(item.hasEOL){
          if(currentLine.length) pageLines.push(currentLine.join(' '));
          currentLine = [];
        }
      });
      if(currentLine.length) pageLines.push(currentLine.join(' '));
      chunks.push(pageLines.join('\n'));
    }
    return chunks.join('\n');
  }

  async function extractFromFile(file){
    var fileMeta = file ? {
      name:file.name || 'uploaded bill',
      size:file.size || 0,
      type:file.type || '',
      lastModified:file.lastModified || null
    } : null;
    var result;
    try{
      if(!file) throw new Error('No file selected');
      if(!/pdf/i.test(file.type || file.name || '')){
        result = analyzeText('', fileMeta);
        result.status = 'unsupported-file';
        result.warnings = ['Image upload accepted, but Sprint 1 only extracts text from PDFs.'];
      }else{
        result = analyzeText(await extractPdfText(file), fileMeta);
      }
    }catch(e){
      result = analyzeText('', fileMeta);
      result.status = 'needs-confirmation';
      result.warnings = [clean(e && e.message) || 'Unable to extract bill text.'];
    }
    writeJSON(SCAN_KEY, result);
    return result;
  }

  function toIntakePatch(result){
    result = result || readJSON(SCAN_KEY) || {};
    var fields = result.fields || {};
    var patch = {
      scan_status:result.status || '',
      scan_confidence:result.confidence || '',
      scan_text_length:result.pageTextLength || 0,
      scan_findings_json:JSON.stringify(result.findings || []),
      scan_file_name:result.file && result.file.name ? result.file.name : ''
    };
    if(fields.provider){ patch.extracted_provider = fields.provider.value; patch.extracted_provider_confidence = fields.provider.confidence; }
    if(fields.amount){ patch.extracted_bill_amount = fields.amount.value; patch.extracted_bill_amount_confidence = fields.amount.confidence; }
    if(fields.amount){
      patch.totalBilled = moneyNumber(fields.amount.value);
      patch.dossierFlags = { billTotal:patch.totalBilled };
    }
    if(fields.amountOwed){ patch.amountOwed = moneyNumber(fields.amountOwed.value); }
    if(fields.serviceDate){ patch.extracted_date_of_service = fields.serviceDate.value; patch.extracted_date_confidence = fields.serviceDate.confidence; }
    if(fields.account){ patch.extracted_account_number = fields.account.value; patch.extracted_account_confidence = fields.account.confidence; }
    if(fields.insurance){ patch.extracted_insurance = fields.insurance.value; patch.extracted_insurance_confidence = fields.insurance.confidence; }
    return patch;
  }

  window.UPABillScan = {
    key:SCAN_KEY,
    readResult:function(){ return readJSON(SCAN_KEY); },
    writeResult:function(result){ return writeJSON(SCAN_KEY, result); },
    analyzeText:analyzeText,
    extractFromFile:extractFromFile,
    toIntakePatch:toIntakePatch
  };
})();
