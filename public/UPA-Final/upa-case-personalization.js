(function(){
  'use strict';

  var STORE_KEY = 'upa.intake.v1';

  function clean(value, fallback){
    var text = String(value == null ? '' : value).replace(/\s+/g,' ').trim();
    if(/^other:\s*/i.test(text)) text = text.replace(/^other:\s*/i,'').trim();
    return text || fallback || '';
  }

  function h(value){
    return String(value == null ? '' : value).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }

  function lowerFirst(value){
    value = clean(value);
    return value ? value.charAt(0).toLowerCase() + value.slice(1) : value;
  }

  function titleFromText(value, maxLen){
    value = clean(value);
    if(!value) return '';
    value = value.replace(/[.?!].*$/,'').trim();
    if(value.length > maxLen) value = value.slice(0,maxLen - 1).trim() + '...';
    return value;
  }

  // Returns sanitized user-typed text, or '' if it looks meaningless/too short.
  function safeUserText(text, maxLen){
    var t = clean(text);
    if(!t || t.length < 8) return '';
    if(!/\s/.test(t)) return '';  // single token, probably garbage
    if(/^(idk|n\/a|na|nothing|none|no|yes|ok|okay|same|see above|other|not sure|unsure|unknown)$/i.test(t.trim())) return '';
    return titleFromText(t, maxLen || 140);
  }

  function readStorageJSON(key){
    try{
      var raw = sessionStorage.getItem(key) || localStorage.getItem(key) || '';
      return raw ? JSON.parse(raw) : null;
    }catch(e){
      return null;
    }
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
    try{
      if(window.__UPA_PACKET_INTAKE__) return window.__UPA_PACKET_INTAKE__;
      var intake = readStorageJSON(STORE_KEY);
      if(intake && Object.keys(intake).length) return intake;
      var checkout = readStorageJSON('upa.checkout.session.v2');
      if(checkout && checkout.intake) return normalizeAppIntake(checkout.intake, checkout);
      var paid = readStorageJSON('upa.paid.results.v2');
      if(paid && paid.session && paid.session.intake) return normalizeAppIntake(paid.session.intake, paid.session);
      return {};
    }catch(e){
      return {};
    }
  }

  function formatMoney(n){
    if(!isFinite(n)) return 'Pending';
    return '$' + Number(n).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0});
  }

  function formatMoneyFull(n){
    if(!isFinite(n)) return 'Pending';
    return '$' + Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  }

  function parseNumber(text){
    var match = String(text || '').match(/\d[\d,]*(?:\.\d+)?/);
    return match ? parseFloat(match[0].replace(/,/g,'')) : null;
  }

  function amountInfo(data){
    var rawKey = clean(data.bill_amount_raw || '');
    var rawText = clean(data.bill_amount_other || data.bill_amount || data.balance || '');
    var buckets = {
      under500:{display:'Under $500', low:true, range:true},
      '500-1k':{display:'$500 - $1,000', low:true, range:true},
      '1k-5k':{display:'$1,000 - $5,000', range:true},
      '5k-10k':{display:'$5,000 - $10,000', range:true},
      '10k-25k':{display:'$10,000 - $25,000', range:true},
      '25k-50k':{display:'$25,000 - $50,000', range:true},
      '50k-100k':{display:'$50,000 - $100,000', range:true},
      over100k:{display:'Over $100,000', range:true},
      unknown:{display:'Amount not provided', unknown:true}
    };
    var info = buckets[rawKey] ? Object.assign({},buckets[rawKey]) : null;
    if(!info){
      var exact = parseNumber(rawText);
      var hasRange = /-|to|under|over|not sure|unknown|approx|around|between/i.test(rawText);
      if(exact != null && !hasRange){
        info = {display:formatMoney(exact), exact:exact, low:exact < 1000};
      }else if(rawText && !/^not uploaded$/i.test(rawText)){
        info = {display:rawText, range:true, low:/under|500|1,000/i.test(rawText)};
      }else{
        info = {display:'Amount not provided', unknown:true};
      }
    }
    info.reviewText = info.unknown ? 'Amount needs confirmation' : info.display;
    info.calcValue = info.exact || null;
    return info;
  }

  function formatDate(value, fallback){
    var raw = clean(value);
    if(!raw) return fallback || 'Date not provided';
    var parts = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    var d = parts ? new Date(Number(parts[1]),Number(parts[2])-1,Number(parts[3])) : new Date(raw);
    if(isNaN(d.getTime())) return raw;
    return d.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  }

  function shortDate(value, fallback){
    var raw = clean(value);
    var d = raw ? new Date(raw) : new Date();
    if(isNaN(d.getTime())) d = new Date();
    return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
  }

  function addDays(date, days){
    var d = new Date(date.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }

  function refDate(value){
    var d = value ? new Date(value) : new Date();
    if(isNaN(d.getTime())) d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth()+1).padStart(2,'0');
    var day = String(d.getDate()).padStart(2,'0');
    return '' + y + m + day;
  }

  function splitList(value){
    return clean(value).split(',').map(function(x){return clean(x);}).filter(Boolean);
  }

  function issueDefs(){
    return [
      {
        key:'no-itemized',
        triggers:['no-itemized','itemized','never received an itemized','do not understand','confusing'],
        type:'Documentation',
        title:'Itemized bill needed before charges can be confirmed',
        short:'itemized bill request',
        desc:'The intake indicates missing or unclear billing detail. The fastest next step is a complete itemized statement with codes, units, dates, charges, and payer adjustments.',
        action:'Request a complete itemized statement and compare it against the EOB before paying or disputing individual lines.'
      },
      {
        key:'duplicate',
        triggers:['billing issue','charged twice','duplicate','twice','repeated charge','same charge'],
        type:'Line-item review',
        title:'Possible duplicate or repeated charge',
        short:'possible duplicate charge',
        desc:'The intake says at least one service may have been charged more than once. This needs confirmation against line numbers, units, service dates, and CPT/HCPCS descriptions.',
        action:'Use the itemized statement to mark any repeated lines and request written confirmation that each line represents a separate service.'
      },
      {
        key:'inflated',
        triggers:['too-high','inflated','too high','expensive','overcharged','higher than expected'],
        type:'Price review',
        title:'Charges seem higher than expected',
        short:'higher-than-expected charges',
        desc:'The intake flags the bill as higher than expected. This should be reviewed against the itemized statement, payer allowed amount, EOB, and any financial assistance or negotiated-rate options.',
        action:'Ask billing for an itemized statement, payer adjustments, financial assistance screening, and written explanation for unusually high line items.'
      },
      {
        key:'not-received',
        triggers:['not-received','didn\'t receive','did not receive','not receive','services i did not'],
        type:'Service verification',
        title:'Billed for services not recognized or not received',
        short:'unrecognized service charge',
        desc:'The intake says one or more services may not match what was received. The provider should identify the clinical record, order, or documentation supporting each disputed charge.',
        action:'Request the itemized statement and ask the provider to identify the documentation supporting each unrecognized service.'
      },
      {
        key:'network',
        triggers:['out-of-network','surprise-bill','surprise bill','lab-charges','unexpected lab','out of network','in-network'],
        type:'Network and rate review',
        title:'Possible surprise bill or out-of-network rate issue',
        short:'network or surprise-billing review',
        desc:'The intake includes surprise billing, lab, test, or network concerns. This should be compared against plan status, EOB processing, consent notices, and in-network facility facts.',
        action:'Request the EOB, network status, consent documentation if any, and a written rate review from the provider or insurer.'
      },
      {
        key:'coding',
        triggers:['coding','wrong billing code','wrong code','upcode','level'],
        type:'Coding review',
        title:'Possible coding or service-level mismatch',
        short:'coding or service-level concern',
        desc:'The intake questions whether the correct billing code was used. The code level should be checked against the itemized statement and supporting visit documentation.',
        action:'Ask billing to identify the CPT/HCPCS/revenue code, units, documentation basis, and whether a corrected claim is needed.'
      },
      {
        key:'denied',
        triggers:['denied','insurance-dispute','underpaid','claim was denied','claim denied'],
        type:'Insurance reconciliation',
        title:'Insurance denial or underpayment needs reconciliation',
        short:'insurance denial review',
        desc:'The intake indicates an insurer denial or underpayment. The bill should be reconciled against the EOB, denial reason codes, appeal deadline, and provider claim submission history.',
        action:'Request the EOB, denial codes, claim notes, and written appeal or corrected-claim instructions before accepting the patient balance.'
      },
      {
        key:'collections',
        triggers:['collections','collection'],
        type:'Collections protection',
        title:'Collections status requires a written dispute trail',
        short:'collections dispute trail',
        desc:'The intake indicates the bill may be in collections. Written documentation, dispute dates, and proof of delivery matter more once a collection agency is involved.',
        action:'Send written dispute documentation, request validation where applicable, and keep copies of every communication.'
      }
    ];
  }

  function fallbackIssueCandidates(data, amount, uploaded){
    var provider = clean(data.provider);
    var billType = clean(data.bill_type_other || data.bill_type, 'medical bill');
    var coverage = clean(data.insurance_other || data.insurance);
    var payment = clean(data.payment_status_other || data.payment_status);
    var description = clean(data.description);
    var uploadedBill = clean(data.uploaded_bill);
    var list = [];

    if(uploaded){
      list.push({
        key:'uploaded-review',
        type:'Uploaded bill review',
        title:'Uploaded statement needs line-by-line verification',
        short:'uploaded bill review',
        desc:'An uploaded billing statement is on file and will be referenced throughout this review. Findings should be checked against it, including line items, codes, units, adjustments, and patient responsibility.',
        action:'Use the uploaded bill as the working record and request written explanations for any unclear, repeated, unsupported, or payer-mismatched line items.'
      });
    }else{
      list.push(issueDefs()[0]);
    }

    if(coverage){
      list.push({
        key:'payer-responsibility',
        type:'Coverage and EOB review',
        title:'Coverage and patient responsibility need reconciliation',
        short:'coverage/EOB reconciliation',
        desc:'Coverage is listed as ' + coverage + '. The provider balance should be compared against the EOB, allowed amount, adjustments, denial codes if any, and final patient responsibility.',
        action:'Request the EOB basis, payer adjustments, denial or remark codes if any, and a corrected patient-responsibility calculation in writing.'
      });
    }

    list.push({
      key:amount.unknown ? 'amount-confirmation' : 'amount-match',
      type:'Amount verification',
      title:amount.unknown ? 'Bill amount still needs confirmation' : 'Entered amount should match the itemized statement',
      short:amount.unknown ? 'amount confirmation' : 'amount-to-statement match',
      desc:amount.unknown
        ? 'The intake did not include an exact bill amount. The first written request should confirm the full balance, itemized charges, adjustments, and remaining patient responsibility.'
        : 'The intake amount is ' + amount.display + '. That amount should be reconciled against the itemized total, insurance payments, provider adjustments, and remaining patient responsibility.',
      action:'Use the itemized statement and EOB to confirm whether the stated balance is accurate before accepting or paying it.'
    });

    if(payment){
      list.push({
        key:'payment-position',
        type:'Payment status review',
        title:'Payment position should be protected in writing',
        short:'payment-position review',
        desc:'Payment status is ' + payment + '. That affects whether the next step is dispute protection, refund review, payment-plan adjustment, collections validation, or payer appeal.',
        action:'Ask for written confirmation of the account status while the bill is under review and do not rely on phone-only explanations.'
      });
    }

    if(description.length > 12){
      list.push({
        key:'intake-detail',
        type:'User-described concern',
        title:'Additional intake details need a written answer',
        short:'intake-detail review',
        desc:(function(){ var sd = safeUserText(description, 140); return sd ? 'A specific concern was noted in the intake: "' + sd + '". The provider should address this point directly rather than offering a generic balance explanation.' : 'A specific concern was noted during intake. The provider should address it in writing rather than offering a generic balance explanation.'; })(),
        action:'Include the user-described detail in the request and ask billing to identify the exact records or line items that answer it.'
      });
    }

    if(provider || billType){
      list.push({
        key:'provider-record',
        type:'Provider record request',
        title:'Provider records should support the billed services',
        short:'provider-record review',
        desc:'The case involves ' + billType + (provider ? ' from ' + provider : '') + '. Billing should be able to point to records, orders, codes, dates, and units supporting the patient balance.',
        action:'Request the records or billing notes that support the disputed or unclear charges before accepting the balance.'
      });
    }

    return list;
  }

  function buildIssues(data, amount, uploaded){
    var raw = splitList(data.concerns_raw);
    var labels = splitList(data.concerns);
    var other = clean(data.concern_other || '');
    var hay = (raw.concat(labels).join(' ') + ' ' + clean(data.description) + ' ' + clean(data.payment_status_raw) + ' ' + clean(data.payment_status) + ' ' + clean(data.bill_type)).toLowerCase();
    var found = [];
    var seen = {};

    function add(issue){
      if(!issue || seen[issue.key]) return;
      seen[issue.key] = true;
      found.push(issue);
    }

    if(other){
      var safeOther = safeUserText(other, 140);
      add({
        key:'custom',
        type:'Custom concern',
        title: safeOther ? titleFromText(safeOther, 80) : 'Additional billing concern raised in intake',
        short: safeOther ? titleFromText(safeOther, 46) : 'Additional billing concern',
        desc: safeOther
          ? 'A specific concern was noted in the intake: "' + safeOther + '". The provider should address this point directly rather than giving a generic balance explanation.'
          : 'A specific concern was noted during intake. The provider should address it in writing.',
        action:'Include this concern in the written request and ask billing to identify the specific records, codes, and adjustments that explain it.'
      });
    }

    issueDefs().forEach(function(def){
      for(var i=0;i<def.triggers.length;i++){
        if(hay.indexOf(def.triggers[i]) > -1){ add(def); break; }
      }
    });

    if(!uploaded) add(issueDefs()[0]);
    if(/paid in full|paid|payment plan|partial/i.test(clean(data.payment_status))) add({
      key:'refund-review',
      type:'Payment review',
      title:'Payment or refund position should be protected',
      short:'payment/refund review',
      desc:'The payment status makes documentation important. The packet should preserve the right to review charges, request corrections, and seek a refund or adjustment if the balance changes.',
      action:'Ask for written correction, updated patient responsibility, and refund or payment-plan adjustment instructions if the review changes the balance.'
    });

    var fallback = fallbackIssueCandidates(data, amount, uploaded);
    for(var f=0; found.length < 3 && f<fallback.length; f++){
      add(fallback[f]);
    }

    return found.slice(0,3).map(function(issue, idx){
      var copy = Object.assign({},issue);
      copy.confidence = uploaded ? 'Use uploaded bill' : 'Needs documentation';
      copy.amountText = amount.exact ? amount.display : 'Pending';
      copy.letterName = idx === 0 ? 'Itemized statement request' : (idx === 1 ? 'Billing review request' : 'Insurance and rate review');
      return copy;
    });
  }

  function paymentCopy(status){
    var s = clean(status).toLowerCase();
    if(s.indexOf('collections') > -1){
      return {
        title:'This bill may already be in collections. Build the written trail now.',
        sub:'Use the packet to document the dispute, request validation where applicable, and keep proof of delivery for every letter.'
      };
    }
    if(s.indexOf('paid') > -1 && s.indexOf('not paid') === -1){
      return {
        title:'Already paid your bill? A review may still uncover overcharges.',
        sub:'Your packet helps you review billing records for potential errors, duplicate charges, or insurance issues and includes prepared dispute documents, scripts, and guidance based on your case.'
      };
    }
    if(s.indexOf('payment plan') > -1 || s.indexOf('partial') > -1){
      return {
        title:'You have already started paying. Protect the review before sending more.',
        sub:'Keep the payment status documented, request the itemized statement, and ask for written confirmation before making additional payments on disputed portions.'
      };
    }
    return {
      title:'Your bill is unpaid. That is usually your strongest position.',
      sub:'Before paying, request itemization and force the billing office to explain the charges, codes, payer adjustments, and patient responsibility in writing.'
    };
  }

  function buildLetterPlan(data, issues){
    var hay = (
      clean(data.concerns_raw) + ' ' +
      clean(data.concerns) + ' ' +
      clean(data.concern_other) + ' ' +
      clean(data.description) + ' ' +
      clean(data.payment_status_raw) + ' ' +
      clean(data.payment_status) + ' ' +
      clean(data.bill_type)
    ).toLowerCase();
    var primaryKey = issues[0] && issues[0].key;
    var extras = [];
    function has(pattern){ return pattern.test(hay); }
    function add(key, label){
      if(extras.some(function(item){return item.key === key;})) return;
      extras.push({key:key,label:label});
    }

    if(has(/out-of-network|out of network|surprise-bill|surprise bill|lab-charges|unexpected lab|ancillary/ ) && primaryKey !== 'network'){
      add('network','network/rate review');
    }
    if(has(/denied|insurance-dispute|underpaid|claim was denied|claim denied|appeal/ ) && primaryKey !== 'denied'){
      add('insurance','insurance denial or appeal');
    }
    if(has(/collections|collection agency|credit report|collector/)){
      add('collections','collections dispute trail');
    }
    if(has(/paid in full|partial payment|payment plan|already paid|refund/)){
      add('payment','refund or payment adjustment');
    }
    if(has(/coding|wrong billing code|wrong code|upcode|level [0-9]|complexity/ ) && primaryKey !== 'coding'){
      add('coding','coding/documentation review');
    }
    if(has(/not-received|didn't receive|did not receive|not receive|services i did not/ ) && primaryKey !== 'not-received'){
      add('service','service verification');
    }
    if(clean(data.concern_other) && primaryKey !== 'custom'){
      add('custom','custom concern addendum');
    }

    var count = Math.min(8, 3 + extras.length);
    return {
      count:count,
      extras:extras,
      dashboardSummary:extras.length
        ? 'Exact count for this intake: 3 core letters plus ' + extras.length + ' case-specific add-on' + (extras.length === 1 ? '' : 's') + '.'
        : 'Exact count for this intake: the 3-letter core set covers the current review areas.'
    };
  }

  /* ─── Extra letter helpers ─── */

  function makeExtraStampSVG(color, line1, line2){
    var cf = {
      green:  {f:'rgba(30,184,122,0.08)',s1:'rgba(21,138,92,0.60)',s2:'rgba(21,138,92,0.30)',t1:'rgba(21,138,92,0.80)',t2:'rgba(21,138,92,0.85)',t3:'rgba(21,138,92,0.70)',ring:'★ PREPARED FOR YOU ★'},
      crimson:{f:'rgba(224,59,59,0.07)', s1:'rgba(176,32,32,0.55)',s2:'rgba(176,32,32,0.25)',t1:'rgba(176,32,32,0.75)',t2:'rgba(176,32,32,0.85)',t3:'rgba(176,32,32,0.70)',ring:'★ FORMAL PATIENT DISPUTE ★'},
      cobalt: {f:'rgba(59,110,224,0.07)',s1:'rgba(32,64,160,0.55)',s2:'rgba(32,64,160,0.25)',t1:'rgba(32,64,160,0.75)',t2:'rgba(32,64,160,0.85)',t3:'rgba(32,64,160,0.75)',ring:'★ FORMAL WRITTEN REQUEST ★'}
    };
    var ck = cf[color] || cf.cobalt;
    var uid = 'spx' + (Math.random() * 1e7 | 0);
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'
      + '<circle cx="50" cy="50" r="46" fill="' + ck.f + '" stroke="' + ck.s1 + '" stroke-width="2.5"/>'
      + '<circle cx="50" cy="50" r="38" fill="none" stroke="' + ck.s2 + '" stroke-width="1"/>'
      + '<path id="' + uid + '" d="M 50 50 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0" fill="none"/>'
      + '<text font-family="Plus Jakarta Sans,sans-serif" font-size="9.5" font-weight="700" fill="' + ck.t1 + '" letter-spacing="2"><textPath href="#' + uid + '">' + ck.ring + '</textPath></text>'
      + '<text x="50" y="45" text-anchor="middle" font-family="Plus Jakarta Sans,sans-serif" font-size="7.5" font-weight="800" fill="' + ck.t2 + '" letter-spacing="0.5">' + h(line1) + '</text>'
      + '<text x="50" y="56" text-anchor="middle" font-family="Plus Jakarta Sans,sans-serif" font-size="7" font-weight="700" fill="' + ck.t3 + '" letter-spacing="0.5">' + h(line2) + '</text>'
      + '</svg>';
  }

  function extraLetterContent(key, c){
    var prov = providerLabel(c);
    var date = serviceDateLabel(c);
    var amt  = c.amount.display;
    var cov  = coverageLabel(c);
    var pay  = paymentLabel(c);
    var ref  = c.accountRef;
    var bill = billKindLabel(c);
    var cust = clean((c.raw && (c.raw.concern_other || c.raw.description)) || c.description || 'see intake details');
    var map = {
      network:{
        title:'No Surprises Act & Network Rate Review',type:'Network / Surprise Billing Dispute',
        color:'cobalt',stamp:['NETWORK','REVIEW'],
        re:'RE: No Surprises Act Review & Network Rate Dispute — Acct: '+ref+' — DOS: '+date,
        sal:'Dear Billing Department,',
        p1:'I am writing to formally dispute the out-of-network rate applied to '+bill+' services at '+prov+' on '+date+'. The current charge of '+amt+' may reflect out-of-network billing during an in-network facility encounter, which is regulated under the federal No Surprises Act (effective January 1, 2022). My coverage is '+cov+'.',
        hl:'Under the No Surprises Act, patients receiving services from out-of-network providers at in-network facilities are generally protected from out-of-network cost-sharing. Patient cost-sharing must be calculated at the in-network rate, and balance-billing beyond the in-network amount is prohibited by federal law.',
        p2:'Please provide in writing: (1) network status and contract type for every billing provider, (2) the rate basis and allowable amount under my plan, (3) any patient consent waiving surprise billing protections, (4) the EOB from '+cov+' showing the network determination, (5) whether No Surprises Act dispute resolution applies here, and (6) a corrected patient responsibility if the rate adjustment changes the balance. Pause all collection activity while this review is pending.'
      },
      insurance:{
        title:'Formal Appeal — Insurance Denial / Underpayment',type:'Insurance Appeals & Denial Review',
        color:'cobalt',stamp:['APPEAL','FILED'],
        re:'RE: Formal Written Appeal — Denial or Underpayment — Acct: '+ref+' — '+cov,
        sal:'Dear '+cov+' Appeals Department,',
        p1:'I am submitting a formal written appeal of the denial or underpayment applied to my claim for '+bill+' services at '+prov+' on '+date+'. The patient balance of '+amt+' reflects a determination I believe should be reconsidered under my plan terms and benefits. Account reference: '+ref+'.',
        hl:'I formally request: (1) the complete Explanation of Benefits with all denial and remark codes, (2) the specific plan provision or clinical criteria cited in the denial, (3) the name and credentials of any medical reviewer, (4) all records considered in the review, (5) the complete internal appeals process including deadlines, and (6) the external independent review procedure.',
        p2:'Please issue a written determination within the federally required timeframe. If upheld, provide the external review procedure and the state insurance commissioner contact. Do not refer the disputed balance to collections or credit reporting while the appeal is pending. Maintain a written record of this appeal in your system and provide me with an appeal reference number.'
      },
      collections:{
        title:'Debt Validation & Collections Dispute',type:'FDCPA Debt Validation Request',
        color:'crimson',stamp:['FDCPA','DISPUTE'],
        re:'RE: Formal Debt Validation Request — FDCPA § 809(b) — Acct: '+ref,
        sal:'To Whom It May Concern,',
        p1:'I am formally disputing and requesting validation of the debt attributed to account '+ref+' at '+prov+' for '+bill+' services on '+date+', listed as '+amt+'. This request is made under the Fair Debt Collection Practices Act (FDCPA), 15 U.S.C. § 1692g(b). I am exercising my right to dispute this debt and require complete written verification before any further collection action.',
        hl:'I formally request in writing: (1) the name and address of the original creditor, (2) a complete line-by-line itemized statement of all charges, (3) proof of legal authority to collect this debt, (4) the original signed agreement or assignment of benefits, (5) confirmation the claim was submitted to and processed by '+cov+', and (6) evidence the statute of limitations has not expired.',
        p2:'Please cease all collection communications, actions, and credit reporting on this account until complete written validation is provided. Continued collection without validation may violate the FDCPA and applicable state consumer protection laws. Respond within 30 days with a written reference number confirming that collection activity is paused while this review is pending.'
      },
      payment:{
        title:'Refund & Overpayment Review Request',type:'Payment Correction & Refund Request',
        color:'green',stamp:['REFUND','REVIEW'],
        re:'RE: Request for Payment Review & Corrected Statement — Acct: '+ref+' — DOS: '+date,
        sal:'Dear Patient Financial Services,',
        p1:'I am requesting a formal review of payments made toward account '+ref+' for '+bill+' at '+prov+' on '+date+'. Payment status is "'+pay+'" with remaining balance '+amt+' and coverage '+cov+'. Billing review areas identified in my case may indicate overcharges, coding adjustments, or insurance corrections that would reduce my patient responsibility and entitle me to a full or partial refund.',
        hl:'Please provide a complete written accounting of: (1) all payments received against account '+ref+' to date, (2) all payer adjustments, contractual write-offs, and insurance payments applied, (3) the current patient responsibility after all adjustments, and (4) whether any overpayment exists and the procedure to issue a refund or credit. If a refund is due, please issue it within 30 days.',
        p2:'If the review identifies a corrected balance lower than the amount paid, provide a written corrected statement and refund instructions. If no adjustment is warranted, provide the specific records and EOB that support the current balance in writing. I retain the right to appeal any determination and request external review. Do not report any disputed portion to credit agencies while this review is pending.'
      },
      coding:{
        title:'CPT / HCPCS Coding & Documentation Review',type:'Billing Code Audit & Documentation Request',
        color:'cobalt',stamp:['CODING','AUDIT'],
        re:'RE: Formal CPT/HCPCS Coding & Documentation Review — Acct: '+ref+' — DOS: '+date,
        sal:'Dear Medical Records and Billing Department,',
        p1:'I am requesting a formal written review of the CPT, HCPCS, and revenue codes billed on account '+ref+' for '+bill+' at '+prov+' on '+date+'. Current balance is '+amt+' with coverage '+cov+'. My billing analysis identifies a possible coding or service-level concern. An improperly coded or upcoded bill produces an incorrect patient responsibility and may require a corrected claim to '+cov+'.',
        hl:'For each billing line under review, please provide: (1) the CPT/HCPCS or revenue code and full description, (2) the E/M visit level and documentation basis (history, examination, medical decision-making), (3) any modifiers applied and their clinical justification, (4) the medical record supporting code selection, (5) whether any unbundled codes should be reported as a single combined code, and (6) whether a corrected claim has been or should be submitted.',
        p2:'If documentation does not support the billed code level, service description, or units, please issue a corrected claim to '+cov+' and a revised patient statement. The corrected patient responsibility must reflect the adjustment. Respond in writing within 30 days with supporting documentation or a corrected billing statement and a reference number for this review request.'
      },
      service:{
        title:'Unrecognized Service Charges — Formal Challenge',type:'Unperformed Service Dispute',
        color:'crimson',stamp:['CHALLENGE','FILED'],
        re:'RE: Formal Challenge of Unrecognized Service Charges — Acct: '+ref+' — DOS: '+date,
        sal:'Dear Billing Department,',
        p1:'I am formally challenging charges on account '+ref+' for '+bill+' at '+prov+' on '+date+'. Balance is '+amt+' with coverage '+cov+' and payment status "'+pay+'". My intake identifies services that do not correspond to services I recall receiving, consenting to, or that were ordered by my treating provider. Billing for unperformed or unauthorized services requires written correction.',
        hl:'For each challenged charge I request: (1) the clinical order or referral authorizing the service, (2) the treating clinician\'s name, credentials, and documentation, (3) the date, time, and location of service delivery, (4) signed patient consent for each service where applicable, and (5) written confirmation that the service was ordered, performed, and is fully supported in the medical record.',
        p2:'If any charge is not supported by complete clinical documentation of the ordered and performed service, please remove it from the statement and issue a corrected billing statement with the reduced patient responsibility. Do not refer challenged charges to collections while this formal review is pending. Respond within 30 days with supporting documentation or a corrected billing statement.'
      },
      custom:{
        title:'Custom Concern Addendum — Formal Written Review',type:'Patient-Described Billing Concern',
        color:'green',stamp:['CUSTOM','REVIEW'],
        re:'RE: Custom Billing Concern Addendum — Acct: '+ref+' — DOS: '+date,
        sal:'Dear Billing Department,',
        p1:'This letter is a formal written addendum to the billing review initiated for account '+ref+' at '+prov+' on '+date+'. It addresses a specific concern I described in my intake that has not been resolved through general billing communications. The concern is: "'+h(cust)+'". Current balance is '+amt+' with coverage '+cov+'.',
        hl:'I request that you identify the specific billing lines, CPT/HCPCS codes, clinical records, and payer documentation that directly address the concern described above. A general account balance statement or form letter does not constitute a response to this specific concern. I require a documented, specific written answer.',
        p2:'Please provide a written response identifying the records supporting the charges in question, how the billing was determined, any payer processing applied, and whether any adjustment is warranted. If an adjustment is made, issue a corrected statement with refund or credit instructions where applicable. Respond within 30 days with a reference number. Do not refer any portion to collections while this review is pending.'
      }
    };
    return map[key] || null;
  }

  function buildExtraLetterCardHTML(c, stepNum, def, docId){
    var dli = '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
    var pvi = '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    return '<div class="doc-preview-card" id="' + docId + '" data-extra="1">'
      + '<div class="dpc-top"><span class="dpc-step">Step ' + stepNum + '</span><span class="dpc-ready">READY</span></div>'
      + '<div class="dpc-title-area"><div class="dpc-title">' + h(def.title) + '</div><div class="dpc-type">' + h(def.type) + '</div></div>'
      + '<div class="dpc-paper pc-' + def.color + '">'
      + '<div class="mini-lh"><div class="mini-lh-left">'
      + '<div class="mini-shield"><img src="Transparent.png" style="width:100%;height:100%;object-fit:contain;display:block;" alt="United Patient Advocate"></div>'
      + '<div><div class="mini-org">' + h(c.patientName) + '</div><span class="mini-org-sub">' + h(c.patientLabel) + '</span></div>'
      + '</div><div><div class="mini-date">' + h(c.prepDate) + '</div><span class="mini-ref">Account: ' + h(c.accountRef) + '</span></div></div>'
      + '<div class="mini-body">'
      + '<div class="mini-to">' + h(providerLabel(c)) + '<br>Patient Financial Services<br>Provider billing address</div>'
      + '<div class="mini-re ' + def.color + '-re">' + h(def.re) + '</div>'
      + '<div class="mini-salut">' + h(def.sal) + '</div>'
      + '<div class="mini-text">' + h(def.p1) + '</div>'
      + '<span class="mini-highlight">' + h(def.hl) + '</span>'
      + '<div class="mini-text-2">' + h(def.p2) + '</div>'
      + '<div class="mini-sig"><div class="mini-sig-left">'
      + '<div class="mini-sig-close">Sincerely,</div>'
      + '<div class="mini-sig-name">' + h(c.patientName) + '</div>'
      + '<span class="mini-sig-sub">Patient / ' + h(c.coverage) + '</span>'
      + '</div></div></div>'
      + '<div class="mini-stamp">' + makeExtraStampSVG(def.color, def.stamp[0], def.stamp[1]) + '</div>'
      + '</div>'
      + '<div class="dpc-footer"><span class="dpc-prepared">Prepared: ' + h(c.prepDate) + '</span>'
      + '<div class="dpc-actions">'
      + '<button class="btn-dpc-icon" aria-label="Download this letter" title="Download this letter">' + dli + '</button>'
      + '<button class="btn-dpc-icon" aria-label="Preview this letter" title="Preview this letter">' + pvi + '</button>'
      + '</div></div>'
      + '</div>';
  }

  function injectExtraLetterCards(c){
    var row = one('.doc-cards-row');
    if(!row) return;
    var plan = c.letterPlan;
    if(!plan || !plan.extras || !plan.extras.length) return;
    // Remove stale injected cards from a previous personalisation run
    all('[data-extra="1"]', row).forEach(function(el){ if(el.parentNode) el.parentNode.removeChild(el); });
    plan.extras.forEach(function(extra, idx){
      var def = extraLetterContent(extra.key, c);
      if(!def) return;
      var stepNum = 4 + idx;
      var docId = 'doc-letter-' + stepNum;
      var tmp = document.createElement('div');
      tmp.innerHTML = buildExtraLetterCardHTML(c, stepNum, def, docId);
      var card = tmp.firstChild;
      row.appendChild(card);
      // Wire action buttons immediately so they don't need a second pass
      var btns = card.querySelectorAll('.btn-dpc-icon');
      if(btns[0]) (function(id){ btns[0].onclick = function(e){ return window.upaDownloadLetter ? window.upaDownloadLetter(e,id) : false; }; })(docId);
      if(btns[1]) (function(id){ btns[1].onclick = function(e){ return window.upaPreviewLetter ? window.upaPreviewLetter(e,id) : (typeof openRequestDocument==='function' ? openRequestDocument(e,id,'Request selected','This request is ready to review, print, or send.') : false); }; })(docId);
    });
    // Update footer note with exact letter count
    var footer = one('.doc-footer-note');
    if(footer) footer.textContent = c.letterCount + ' letters prepared for your case — each uses your patient name, provider, and intake details.';
  }

  function buildCase(){
    var data = readIntake();
    var amount = amountInfo(data);
    var first = clean(data.first_name);
    var last = clean(data.last_name);
    var joinedName = first && last ? first + ' ' + last : '';
    var name = clean(data.patient_name || data.patientName || data.full_name || data.fullName || data.name || joinedName, 'Patient');
    var prepDate = formatDate(data.submitted_at || new Date().toISOString(), 'Today');
    var opened = data.submitted_at ? new Date(data.submitted_at) : new Date();
    if(isNaN(opened.getTime())) opened = new Date();
    var provider = clean(data.provider, 'Provider not provided');
    var dos = formatDate(data.date_of_service || data.dos, 'Date not provided');
    var billType = clean(data.bill_type_other || data.bill_type, 'medical bill');
    var coverage = clean(data.insurance_other || data.insurance, 'Coverage not provided');
    var paymentStatus = clean(data.payment_status_other || data.payment_status, 'Payment status not provided');
    var description = clean(data.description);
    var uploadedBill = clean(data.uploaded_bill);
    var uploaded = !!(uploadedBill && !/^not uploaded/i.test(uploadedBill));
    var issues = buildIssues(data, amount, uploaded);
    var detailScore = 28;
    if(provider && provider !== 'Provider not provided') detailScore += 10;
    if(dos !== 'Date not provided') detailScore += 8;
    if(!amount.unknown) detailScore += amount.exact ? 14 : 8;
    if(clean(data.concerns)) detailScore += 12;
    if(description.length > 20) detailScore += 14;
    if(uploaded) detailScore += 20;
    detailScore = Math.min(94, detailScore);
    var notes = [];
    if(!uploaded || description.length < 20 || amount.unknown){
      notes.push('This review is based on the intake details provided so far. Adding an itemized bill, EOB, procedure codes, and exact charges will make the results more specific.');
    }
    if(amount.low){
      notes.push('The stated amount is on the lower end for billing disputes. That does not mean it should go unchecked — confirming the charges now is the fastest path to resolution.');
    }
    var primary = issues[0];
    var status = paymentCopy(paymentStatus);
    var letterPlan = buildLetterPlan(data, issues);
    var ref = clean(data.account_number || data.accountNumber || data.account || data.billing_reference || data.billingReference, 'on file');
    var basis = [
      'itemized statement request',
      'EOB and payer-responsibility comparison',
      uploaded ? 'uploaded bill review' : 'bill upload still needed',
      'CPT/HCPCS/revenue-code review when line items are available'
    ];
    if(issues.some(function(i){return i.key === 'network';})) basis.push('network and surprise-billing screening when the facts support it');
    return {
      raw:data,
      patientName:name,
      firstName:first || name.split(/\s+/)[0] || 'Patient',
      provider:provider,
      dateOfService:dos,
      dateShort:shortDate(data.date_of_service || data.dos),
      prepDate:prepDate,
      openedShort:shortDate(data.submitted_at),
      deadline30:shortDate(addDays(opened,30).toISOString()),
      deadline60:shortDate(addDays(opened,60).toISOString()),
      accountRef:ref,
      billType:billType,
      coverage:coverage,
      paymentStatus:paymentStatus,
      patientLabel:'Patient - ' + coverage,
      amount:amount,
      issues:issues,
      primary:primary,
      primaryInline:lowerFirst(primary.short || primary.title),
      uploaded:uploaded,
      uploadedBill:uploaded ? uploadedBill : 'Not uploaded',
      description:description,
      detailScore:detailScore,
      notes:notes,
      noteText:notes.join(' '),
      statusCopy:status,
      reviewBasis:'Review basis: ' + basis.join('; ') + '.',
      issueCount:issues.length,
      letterCount:letterPlan.count,
      letterCountLabel:String(letterPlan.count),
      letterSetLabel:String(letterPlan.count) + ' prepared letters for this case',
      letterPlanSummary:letterPlan.dashboardSummary,
      letterPlan:letterPlan
    };
  }

  function all(selector, root){
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function one(selector, root){
    return (root || document).querySelector(selector);
  }

  function setText(selector, value, root){
    var el = typeof selector === 'string' ? one(selector, root) : selector;
    if(el) el.textContent = value;
  }

  function setHTML(selector, value, root){
    var el = typeof selector === 'string' ? one(selector, root) : selector;
    if(el) el.innerHTML = value;
  }

  function setAllText(selector, values, root){
    all(selector, root).forEach(function(el, idx){
      var value = typeof values === 'function' ? values(el, idx) : (Array.isArray(values) ? values[idx] : values);
      if(value != null) el.textContent = value;
    });
  }

  function setIconText(el, text){
    if(!el) return;
    var svg = el.querySelector('svg');
    while(el.firstChild) el.removeChild(el.firstChild);
    if(svg) el.appendChild(svg);
    el.appendChild(document.createTextNode(' ' + text));
  }

  function commonReplacements(c){
    var confirmedText = c.amount.exact ? 'Pending itemized review' : 'Pending';
    return [
      ['First Name Last Name', c.patientName],
      ['Your Provider', c.provider],
      ['date of service', c.dateOfService],
      ['Date of Service', 'Date of Service'],
      ['Preparation date', c.prepDate],
      ['UPA REVIEW', c.accountRef],
      ['Account number', c.accountRef],
      ['account number', c.accountRef],
      ['Bill amount', c.amount.display],
      ['Bill Amount', c.amount.display],
      ['Amount to review', c.amount.reviewText],
      ['$20,267', confirmedText],
      ['$17,589.00', 'Pending'],
      ['$5,863.00', 'Pending'],
      ['$11,726.00', 'Pending'],
      ['$651.44', 'Pending'],
      ['To confirm8.58', 'Pending'],
      ['Medicare Beneficiary', c.coverage],
      ['Medicare Primary', c.coverage],
      ['Medicare primary', c.coverage.toLowerCase()],
      ['billing line item billed twice on the same date of service', c.primary.title],
      ['Emergency Visit Billed Twice, Same Date of Service', c.primary.title],
      ['Outside Service Provider lab charges billed at out-of-network rate during in-network facility visit', c.issues[2].title],
      ['Outside Service Provider', 'outside or ancillary provider'],
      ['Duplicate charge', c.primary.short],
      ['Duplicate Billing', c.primary.short],
      ['billing line item', c.primaryInline],
      ['Billing line item', c.primary.short],
      ['billing reference', c.accountRef],
      ['January 2026', c.dateShort],
      ['Jan 2026', c.dateShort],
      ['May 16', c.openedShort],
      ['June 16', c.deadline30],
      ['July 16', c.deadline60]
    ];
  }

  function replaceTextNodes(root, replacements){
    if(!root || !document.createTreeWalker) return;
    var skip = {SCRIPT:1,STYLE:1,NOSCRIPT:1,TEXTAREA:1,INPUT:1,OPTION:1};
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode:function(node){
        return node.parentNode && !skip[node.parentNode.nodeName] ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [];
    var node;
    while((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(function(textNode){
      var value = textNode.nodeValue;
      replacements.forEach(function(pair){
        if(pair[0] && value.indexOf(pair[0]) > -1) value = value.split(pair[0]).join(pair[1]);
      });
      textNode.nodeValue = value;
    });
  }

  function guideReplacements(c, name){
    var replacements = commonReplacements(c);
    if(name !== 'callscripts') return replacements;
    return replacements.filter(function(pair){
      return ['UPA REVIEW','Account number','account number','billing reference'].indexOf(pair[0]) === -1;
    });
  }

  function ensureStyles(){
    if(document.getElementById('upa-case-personalization-style')) return;
    var style = document.createElement('style');
    style.id = 'upa-case-personalization-style';
    style.textContent =
      '.upa-case-note{margin:14px 0;padding:12px 14px;border-radius:8px;border:1px solid rgba(30,107,90,.22);background:rgba(30,107,90,.07);color:#2E4060;font-size:.75rem;line-height:1.65}' +
      '.upa-case-note strong{color:#1C2B48}' +
      '.upa-case-note.dark{border-color:rgba(30,184,122,.22);background:rgba(30,184,122,.08);color:rgba(235,244,255,.68)}' +
      '.upa-case-note.dark strong{color:rgba(235,244,255,.95)}' +
      '.upa-case-note.print{margin:14px 36px;background:#F6F8FA;color:#4A6480;border-color:rgba(28,43,72,.10)}';
    document.head.appendChild(style);
  }

  function noteHTML(c){
    if(!c.noteText) return '';
    return '<div class="upa-case-note"><strong>Case specificity note:</strong> ' + h(c.noteText) + '</div>';
  }

  function insertNoteAfter(selector, c, className){
    if(!c.noteText) return;
    var anchor = typeof selector === 'string' ? one(selector) : selector;
    if(!anchor || anchor.parentNode.querySelector('.upa-case-note')) return;
    var wrap = document.createElement('div');
    wrap.className = 'upa-case-note' + (className ? ' ' + className : '');
    wrap.innerHTML = '<strong>Case specificity note:</strong> ' + h(c.noteText);
    anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
  }

  function hasKnown(value, placeholder){
    value = clean(value);
    return !!value && value !== placeholder;
  }

  function providerLabel(c){
    return hasKnown(c.provider, 'Provider not provided') ? c.provider : 'your provider';
  }

  function serviceDateLabel(c){
    return hasKnown(c.dateOfService, 'Date not provided') ? c.dateOfService : 'the service date';
  }

  function coverageLabel(c){
    return hasKnown(c.coverage, 'Coverage not provided') ? c.coverage : 'your coverage';
  }

  function paymentLabel(c){
    return hasKnown(c.paymentStatus, 'Payment status not provided') ? c.paymentStatus : 'current account status';
  }

  function billKindLabel(c){
    var text = clean(c.billType, 'medical bill').toLowerCase();
    return /\bbill$/.test(text) ? text : text + ' bill';
  }

  function tailoredIssueTitle(c, issue){
    if(issue.key === 'no-itemized') return 'Itemized ' + billKindLabel(c) + ' needed before charges can be confirmed';
    if(issue.key === 'network') {
      return /no insurance|self-pay/i.test(c.coverage)
        ? 'Self-pay rate clarification needed for this ' + billKindLabel(c)
        : 'Possible surprise bill or network-rate issue for this ' + billKindLabel(c);
    }
    if(issue.key === 'custom') return issue.title || 'Custom billing concern needs a written answer';
    if(issue.key === 'uploaded-review') return 'Uploaded ' + billKindLabel(c) + ' needs line-by-line verification';
    if(issue.key === 'payer-responsibility') return coverageLabel(c) + ' responsibility needs reconciliation';
    return issue.title;
  }

  function issueCodeLine(c, issue){
    var parts = [];
    if(c.billType) parts.push(c.billType);
    if(hasKnown(c.dateOfService, 'Date not provided')) parts.push(c.dateOfService);
    if(hasKnown(c.provider, 'Provider not provided')) parts.push(c.provider);
    if(issue.key === 'network' || issue.key === 'denied' || issue.key === 'payer-responsibility'){
      if(hasKnown(c.coverage, 'Coverage not provided')) parts.push(c.coverage);
    }
    if(c.uploaded) parts.push('uploaded bill on file');
    return parts.join(' · ') || 'Billing review — details pending';
  }

  function issueDesc(c, issue){
    var ctx = [];
    if(hasKnown(c.provider, 'Provider not provided')) ctx.push('Provider: ' + c.provider);
    if(hasKnown(c.dateOfService, 'Date not provided')) ctx.push('DOS: ' + c.dateOfService);
    if(hasKnown(c.coverage, 'Coverage not provided')) ctx.push('Coverage: ' + c.coverage);
    ctx.push('Amount: ' + c.amount.reviewText);
    if(hasKnown(c.paymentStatus, 'Payment status not provided')) ctx.push('Status: ' + c.paymentStatus);
    if(c.uploaded) ctx.push('Uploaded bill on file');
    return issue.desc + (ctx.length ? ' (' + ctx.join(' · ') + ')' : '');
  }

  function applyIssueCard(card, issue, c, idx){
    if(!card || !issue) return;
    var title = tailoredIssueTitle(c, issue);
    setText('.fc-type', issue.type, card);
    setText('.fi-type', issue.type, card);
    setText('.fc-confidence', issue.confidence, card);
    setText('.fc-amount', issue.amountText, card);
    setText('.fc-title', title, card);
    setText('.fc-desc', issueDesc(c, issue), card);
    setText('.fi-title', title, card);
    setHTML('.fi-desc', h(issueDesc(c, issue)) + ' <strong>Use written documentation before accepting the balance.</strong>', card);
    setText('.fi-code', issueCodeLine(c, issue), card);
    setText('.fi-amount', issue.amountText, card);
    setText('.fi-amount-lbl', c.amount.exact ? 'Amount provided' : 'Amount to confirm', card);
    setText('.fi-res', idx === 0 ? 'Open first' : (idx === 1 ? 'Next step' : 'Also review'), card);
    var meta = all('.fc-meta-item', card);
    if(meta[0]) setIconText(meta[0], serviceDateLabel(c));
    if(meta[1]) setIconText(meta[1], c.uploaded ? 'Use uploaded bill: ' + c.uploadedBill : 'Itemized bill needed');
    if(meta[2]) setIconText(meta[2], 'Letter ' + (idx + 1) + ' prepared');
    var ev = all('.ev-item-val', card);
    if(ev[0]) ev[0].textContent = issue.type;
    if(ev[1]) ev[1].textContent = c.uploaded ? 'Uploaded bill' : 'Need itemized bill';
    if(ev[2]) ev[2].textContent = issue.amountText;
    if(ev[3]) ev[3].textContent = issue.confidence;
  }

  function applyPreview(c){
    if(!one('.results-hero')) return;
    insertNoteAfter('.results-hero', c, 'dark');
    setText('.nav-badge', 'Review Complete - ' + c.patientName);
    setHTML('.rh-title', 'Your review areas are prepared.<br><span>' + h(c.amount.reviewText) + ' needs review.</span>');
    var rhParts = [c.primaryInline];
    if(hasKnown(c.coverage, 'Coverage not provided')) rhParts.push(c.coverage);
    if(hasKnown(c.paymentStatus, 'Payment status not provided')) rhParts.push('payment status "' + c.paymentStatus + '"');
    setText('.rh-sub', 'Your ' + c.billType + ' from ' + providerLabel(c) + ' was organized around the intake details you provided: ' + rhParts.join(', ') + '. ' + c.reviewBasis);
    setText('.pm-val.green', c.amount.reviewText);
    setAllText('.pm-label', ['Bill amount provided','Review areas from intake','Case letters being prepared']);
    setText('.pm-val.crim', String(c.issueCount));
    setText('.pm-val.gold', c.letterCountLabel);
    setAllText('.pm-badge', ['Needs confirmation','Case-specific','Ready to send']);
    all('.finding-card').slice(0,3).forEach(function(card, idx){ applyIssueCard(card, c.issues[idx], c, idx); });

    setText('.dt-topbar-name', 'United Patient Advocate - Active Case: ' + c.provider);
    setText('.dt-pill', 'REF: ' + c.accountRef);
    setText('.dt-h1', 'We reviewed the intake for ' + providerLabel(c) + '.');
    setText('.dt-h1-sub', 'The next step is confirming the details before payment or appeal.');
    setAllText('.dt-kpi-val', [c.amount.reviewText, String(c.issueCount), 'Ready']);
    setAllText('.dt-kpi-lbl', ['Amount provided','Review areas','Packet status']);
    setAllText('.dt-ks-val', [c.amount.reviewText, String(c.issueCount) + ' areas', c.letterCountLabel + ' letters']);
    setAllText('.dt-ks-lbl', ['Needs confirmation','From your intake','Ready to send']);
    setText('.dt-lock-txt', 'Unlock to access your complete billing review workspace, packet, calculator, call scripts, and action plan for this case.');

    setText('.lt-doc-label', 'Letter preview - Request for itemized statement and case-specific review');
    setText('.lt-from-name', c.patientName);
    setText('.lt-from-sub', c.patientLabel);
    setHTML('.lt-to', h(c.provider) + ' - Billing Department<br>Account number/reference: ' + h(c.accountRef) + ' - Date of Service: ' + h(c.dateOfService));
    setText('.lt-re', 'RE: Formal Request - Itemized Bill Review - ' + c.primary.short);
    setHTML('.lt-body-vis', 'Dear Billing Department,<br><br>I am requesting a detailed, itemized review of the billing statement for services on <strong>' + h(c.dateOfService) + '</strong> at ' + h(c.provider) + '. My intake identifies a <span class="lt-highlight">' + h(c.primary.short) + '</span>. Please provide the itemized statement, codes, units, adjustments, and any records needed to confirm the patient responsibility.');
    setHTML('.lt-unlock-txt', '<strong>Your full letter set is being prepared:</strong> ' + h(c.letterSetLabel) + ', with more added when the bill complexity requires it.<br>Each letter uses the patient, provider, amount, coverage, and issue details from this intake.');

    setText('.ub-title', c.statusCopy.title);
    setText('.ub-sub', c.statusCopy.sub);
    setText('.cta-title', 'Everything needed to question this bill is organized for ' + c.patientName + '.');
    var ctaParts = [];
    if(hasKnown(c.provider, 'Provider not provided')) ctaParts.push(c.provider);
    if(hasKnown(c.dateOfService, 'Date not provided')) ctaParts.push(c.dateOfService);
    ctaParts.push(c.amount.reviewText);
    ctaParts.push('the concerns raised in your intake');
    setText('.cta-sub', 'Your dashboard, letters, packet, calculator, call scripts, and escalation steps are tailored to ' + ctaParts.join(', ') + '.');
  }

  function syncQuickCalc(c){
    var input = document.getElementById('qc-balance');
    if(!input) return;
    // Always run the calculator with real numbers. If we have a known case amount,
    // pre-fill it. Otherwise leave the input empty (placeholder shows "$0.00") and
    // let calcUpdate() render $0.00 across all result fields. The user can type
    // any amount and the calculator updates live.
    if(c.amount.calcValue){
      input.value = formatMoneyFull(c.amount.calcValue);
    }else{
      input.value = '';
      input.placeholder = '$0.00';
    }
    if(window.formatBalanceInput) window.formatBalanceInput(input);
    if(window.calcUpdate) window.calcUpdate();
  }

  function applyDashboard(c){
    if(!one('.case-header') || !one('.right-panel')) return;
    insertNoteAfter('.kpi-strip', c, '');
    setText('.ncp-text', hasKnown(c.provider, 'Provider not provided') ? 'Active Case: ' + c.provider : 'Active Case — Review Ready');
    setText('.nav-ref', 'REF: ' + c.accountRef + ' | Case Opened: ' + c.prepDate);
    setText('.sb-hospital', c.provider);
    setText('.sb-sub', c.billType + ' - ' + c.dateShort);
    setAllText('.sb-kpi-val', [c.amount.display, c.amount.reviewText]);
    setAllText('.sb-kpi-sub', [hasKnown(c.coverage, 'Coverage not provided') ? c.coverage : 'Coverage on file', c.uploaded ? 'Bill uploaded for review' : 'Itemized bill needed']);
    setText('.sb-score-num', c.detailScore >= 70 ? 'Review ready' : 'Preliminary');

    setText('.ch-ref', c.accountRef);
    setText('.ch-headline', 'We reviewed the intake for ' + providerLabel(c) + '.');
    setText('.ch-subline', 'Your review is tailored to the exact case details provided.');
    var deckCov = hasKnown(c.coverage, 'Coverage not provided') ? ', coverage listed as ' + h(c.coverage) : '';
    var deckPay = hasKnown(c.paymentStatus, 'Payment status not provided') ? ', and payment status "' + h(c.paymentStatus) + '"' : '';
    setHTML('.ch-deck', 'This dashboard organizes the <u>' + h(c.billType) + '</u> around ' + h(c.primaryInline) + deckCov + deckPay + '.<br>' + h(c.reviewBasis));
    var pills = all('.ch-pill.dark-pill');
    if(pills[0]) setIconText(pills[0], 'Prepared for ' + c.patientName);
    if(pills[1]) setIconText(pills[1], 'Prepared: ' + c.prepDate);
    setText('.ch-pill.amber-pill', c.uploaded ? 'REVIEW READY - BILL UPLOADED' : 'PRELIMINARY - ITEMIZED BILL NEEDED');
    setAllText('.ch-meta-val', [c.provider, c.dateOfService, c.coverage, c.accountRef]);

    setAllText('.kpi-val', [c.amount.reviewText, c.issueCount + ' areas', c.letterCount + ' prepared']);
    setAllText('.kpi-label', ['Amount needing confirmation','Review areas requiring action','Case letters prepared']);
    setAllText('.kpi-ctx', [
      c.amount.exact ? 'Exact amount entered by the user' : 'Based on the amount range or missing amount provided',
      c.issues.map(function(i){return i.short;}).join(', '),
      c.letterPlanSummary
    ]);

    var cardTexts = all('.card-text');
    if(cardTexts[0]){
      var ctCov = hasKnown(c.coverage, 'Coverage not provided') ? ', coverage listed as <strong>' + h(c.coverage) + '</strong>' : '';
      var ctPay = hasKnown(c.paymentStatus, 'Payment status not provided') ? ', and payment status <strong>' + h(c.paymentStatus) + '</strong>' : '';
      cardTexts[0].innerHTML = 'Your case centers on <strong>' + h(c.primary.short) + '</strong> for a ' + h(c.billType) + ' from ' + h(providerLabel(c)) + '. The current amount is <strong>' + h(c.amount.reviewText) + '</strong>' + ctCov + ctPay + '. This review does not mark charges as errors until the itemized bill, EOB, and provider records support that conclusion.';
    }
    setText('.bb-label', c.amount.display + ' total bill: what needs confirmation');
    setAllText('.legend-text', [
      'Confirmed charges - to verify from EOB',
      c.issues[0].short + ' - ' + c.issues[0].amountText,
      c.issues[1].short + ' - ' + c.issues[1].amountText,
      c.issues[2].short + ' - ' + c.issues[2].amountText
    ]);
    setAllText('.bench-name', c.issues.map(function(i){return i.title;}));
    setAllText('.bench-delta', ['Needs itemized detail','Needs EOB/code detail']);
    setAllText('.bench-bar-val', ['Pending','Benchmark when codes are available','Pending','Benchmark when codes are available']);
    setText('.nb-title', c.uploaded ? 'Review the uploaded bill and request missing line-item support' : 'Request a fully itemized statement before accepting the balance');
    setText('.nb-desc', c.uploaded ? 'Use the uploaded bill with the prepared letters to request written explanations, EOB reconciliation, and corrections where the records support it.' : 'The intake did not include a complete itemized bill. Letter 1 asks the provider for the codes, units, charges, adjustments, and records needed to make the review more specific.');

    all('#tab-findings .finding-card').slice(0,3).forEach(function(card, idx){ applyIssueCard(card, c.issues[idx], c, idx); });
    var actionTitles = ['Request fully itemized statement', 'Submit ' + c.issues[0].short + ' review', 'Send insurance/EOB or rate clarification', 'Follow up and escalate if no written response'];
    var actionDescs = [
      'Send the prepared letter to ' + providerLabel(c) + ' requesting the full line-by-line statement, codes, units, adjustments, and payer responsibility. Time needed: 5 minutes.',
      'Once the itemized statement is available, use Letter 2 to ask billing to answer the specific issue: ' + c.issues[0].title + '.',
      'Use Letter 3 to reconcile coverage, EOB, network status, payer adjustments, and any rate issue tied to ' + c.coverage + '.',
      'If there is no written response in 30 days, follow up with billing, then escalate with copies of the letters and proof of delivery.'
    ];
    var providerHint = c.provider === 'Provider not provided' ? 'the provider' : c.provider;
    var coverageHint = c.coverage === 'Coverage not provided' ? 'insurance or payer' : c.coverage;
    var actionHints = [
      'Open Letter 1 in Documents, then sign and send it to ' + providerHint + '.',
      'Open Letter 2 in Documents after the itemized statement is available.',
      'Open Letter 3 in Documents for ' + coverageHint + ' EOB, rate, or network clarification.',
      'Open the Escalation guide if ' + providerHint + ' has not responded in writing after 30 days.'
    ];
    all('.action-step').slice(0,4).forEach(function(step, idx){
      setText('.as-title', actionTitles[idx], step);
      setText('.as-desc', actionDescs[idx], step);
      setText('.as-next-hint', actionHints[idx], step);
      step.setAttribute('title', actionHints[idx]);
      step.setAttribute('aria-label', actionTitles[idx] + '. Next: ' + actionHints[idx]);
    });

    setText('.rpc-amount', c.amount.reviewText);
    setText('.rpc-sub', c.amount.exact ? 'Amount entered by user' : 'Amount needs confirmation');
    setAllText('.rpc-row-val', [c.amount.display, String(c.issueCount), c.letterCount + ' prepared']);
    var rpsPayment = hasKnown(c.paymentStatus, 'Payment status not provided') ? c.paymentStatus : 'Not specified';
    setAllText('.rps-row-val', [c.amount.reviewText, c.primary.short, rpsPayment, c.uploaded ? 'Review uploaded bill' : 'Request itemization']);
    setText('#rp-gauge-amount', c.detailScore >= 70 ? 'Review' : 'Prelim');
    setText('#rp-gauge-pct', c.detailScore + '%');
    setText('.rp-gauge-sub', c.uploaded ? 'Bill detail included' : 'More detail improves results');
    all('.rp-flag').slice(0,3).forEach(function(flag, idx){
      setText('.rp-flag-title', c.issues[idx].title, flag);
      setText('.rp-flag-sub', c.issues[idx].action, flag);
    });
    setText('.rp-next-title', c.statusCopy.title);
    setText('.rp-next-desc', c.statusCopy.sub);
    setText('.btn-rp-cta', c.uploaded ? 'Use My Review Packet' : 'Request Itemized Bill');

    injectExtraLetterCards(c);
    syncQuickCalc(c);
    window.setTimeout(function(){
      setText('#rp-gauge-amount', c.detailScore >= 70 ? 'Review' : 'Prelim');
      setText('#rp-gauge-pct', c.detailScore + '%');
      syncQuickCalc(c);
    },1400);
  }

  function applyLetterBodies(c){
    var bodies = all('.lbody');
    var headers = all('.lhd');
    headers.forEach(function(header){
      setText('.lhd-name', c.patientName, header);
      setText('.lhd-sub', c.patientLabel, header);
      setHTML('.lhd-addr', 'Contact: ' + h(clean(c.raw.email,'email not provided')) + '<br>' + h(clean(c.raw.phone,'phone not provided')));
      setText('.lhd-date', c.prepDate, header);
      setText('.lhd-acct', 'Account: ' + c.accountRef, header);
    });
    setAllText('.lbs-name', c.patientName);
    setAllText('.lbs-sub', 'Patient / ' + c.coverage + ' - ' + c.accountRef);
    setAllText('.ltb-title', [
      'Request for fully itemized statement - send this first',
      'Billing review request - ' + c.issues[0].short,
      'Insurance, EOB, and rate clarification request'
    ]);
    if(bodies[0]){
      setHTML('.lb-to-addr', h(c.provider) + ' - Billing & Accounts<br>Billing address — see statement', bodies[0]);
      setText('.lb-re-txt', 'Request for Fully Itemized Statement - ' + c.accountRef + ' - Date of Service: ' + c.dateOfService, bodies[0]);
      setHTML('.lb-para', 'I am writing to request a complete, fully itemized statement for medical services rendered on <strong>' + h(c.dateOfService) + '</strong>, account reference ' + h(c.accountRef) + ', at ' + h(c.provider) + '. My current intake lists total charges as <strong>' + h(c.amount.display) + '</strong>, coverage as <strong>' + h(c.coverage) + '</strong>, and payment status as <strong>' + h(c.paymentStatus) + '</strong>. I am reviewing this statement before accepting the patient responsibility.', bodies[0]);
      setText('.lb-hl', 'Please provide every line item, CPT/HCPCS code, revenue code, units, dates of service, provider adjustments, insurer payments or denials, and the patient-responsibility amount for each individual item.', bodies[0]);
      setText('.lb-sm', 'This request is made so I can reconcile the statement against my EOB, coverage, and records. Please pause collection activity on any disputed portion while this written review is pending and provide a reference number for this request.', bodies[0]);
    }
    if(bodies[1]){
      var issue = c.issues[0];
      setHTML('.lb-to-addr', h(c.provider) + ' - Billing Review Department<br>Billing address — see statement', bodies[1]);
      setText('.lb-re-txt', 'Billing Review Request - ' + issue.title + ' - DOS: ' + c.dateOfService + ' - Amount Under Review: ' + issue.amountText, bodies[1]);
      setHTML('.lb-para', 'I am requesting a formal written review of my statement, account reference ' + h(c.accountRef) + '. Based on my intake and the documents available to me, the concern is: <strong>' + h(issue.title) + '</strong>. This review relates to services at ' + h(c.provider) + ' on ' + h(c.dateOfService) + ' with current amount listed as ' + h(c.amount.display) + '.', bodies[1]);
      setText('.lb-hl', issue.action + ' If the review changes the patient responsibility, please issue a corrected statement and written explanation.', bodies[1]);
      setText('.lb-sm', 'Please respond in writing within 30 days with the records, code details, EOB reconciliation, or corrected billing statement that supports your determination. Please pause collection activity on the reviewed amount while this request is pending.', bodies[1]);
    }
    if(bodies[2]){
      var issue3 = c.issues[2];
      setHTML('.lb-to-addr', 'Billing Department - ' + h(c.provider) + '<br>Insurance / payer review contact if available', bodies[2]);
      setText('.lb-re-txt', 'Insurance / EOB / Rate Clarification - ' + issue3.title + ' - Account: ' + c.accountRef, bodies[2]);
      setHTML('.lb-para', 'I am writing to request written clarification of the insurance, EOB, network, and rate handling for my <strong>' + h(c.dateOfService) + ' ' + h(c.billType) + '</strong> at ' + h(c.provider) + '. My coverage is listed as <strong>' + h(c.coverage) + '</strong>, and the patient balance requires confirmation before I accept responsibility.', bodies[2]);
      setText('.lb-hl', issue3.action + ' Please identify any payer denial codes, allowed amounts, adjustments, network status, consent documentation if relevant, and appeal or corrected-claim options.', bodies[2]);
      setText('.lb-sm', 'Please respond in writing with the EOB basis, payer responsibility, provider adjustment history, and the current patient-responsibility calculation. If the balance changes, please issue a corrected statement and refund or payment-plan adjustment instructions if applicable.', bodies[2]);
    }
    setAllText('.lfoot .lf-m', [
      'Core letter 1 - ' + c.accountRef + ' - DOS: ' + c.dateOfService + ' - Prepared ' + c.prepDate,
      'Core letter 2 - ' + c.accountRef + ' - ' + c.issues[0].short + ' - Prepared ' + c.prepDate,
      'Core letter 3 - ' + c.accountRef + ' - EOB/rate clarification - Prepared ' + c.prepDate
    ]);
  }

  function applyPacket(c){
    if(!one('.toolbar') || all('.page').length < 4) return;
    setText('.tb-sub', '- ' + c.accountRef + ' - ' + c.patientName + ' - patient packet');
    var firstPageHeader = one('.page .nh');
    if(c.noteText && firstPageHeader && !one('.page .upa-case-note')){
      var note = document.createElement('div');
      note.className = 'upa-case-note print';
      note.innerHTML = '<strong>Case specificity note:</strong> ' + h(c.noteText);
      firstPageHeader.parentNode.insertBefore(note, firstPageHeader.nextSibling);
    }
    applyLetterBodies(c);
    var pages = all('.page');
    if(pages[0]){
      var firstInfo = all('div', pages[0]).filter(function(el){return /Patient|Provider|Date of Service/.test(el.textContent);});
      firstInfo.slice(0,3);
    }
    all('.nf-r').forEach(function(el){
      if(/Account|Page/.test(el.textContent)) el.textContent = el.textContent.replace(/Account.+$/,'Account ' + c.accountRef);
    });
  }

  function applyGuideHook(c){
    if(window.__upaGuidePersonalized) return;
    if(typeof window.showGuide !== 'function') return;
    var original = window.showGuide;
    window.showGuide = function(name){
      var result = original.apply(this, arguments);
      window.setTimeout(function(){
        var root = document.getElementById('gd-body');
        if(root){
          replaceTextNodes(root, guideReplacements(c, name));
          var texts = all('.gd-card-text', root);
          if(texts[0] && name === 'starthere') texts[0].innerHTML = 'Start with the <strong>Documents tab</strong>. Letter 1 is tailored to ' + h(c.provider) + ', ' + h(c.dateOfService) + ', ' + h(c.amount.display) + ', and the intake concern "' + h(c.primary.short) + '".';
          if(name === 'checklist'){
            var checks = all('.gdc-text', root);
            if(checks[0]) checks[0].innerHTML = '<strong>Bill review prepared.</strong> Your review organized ' + h(c.amount.display) + ' around ' + h(c.issueCount) + ' review areas from this intake.';
            if(checks[1]) checks[1].innerHTML = '<strong>Send the itemized statement request.</strong> Download Letter 1, sign it as ' + h(c.patientName) + ', and send it to ' + h(c.provider) + ' Patient Financial Services.';
          }
        }
      },20);
      return result;
    };
    window.__upaGuidePersonalized = true;
  }

  function applyCommon(c){
    ensureStyles();
    window.UPACase = c;
    replaceTextNodes(document.body, commonReplacements(c));
    if(document.title && /UPA|United Patient Advocate/.test(document.title)){
      document.title = document.title.replace('Your Review Is Ready','Review Ready - ' + c.patientName).replace('Bill Review','Bill Review - ' + c.patientName);
    }
  }

  function run(){
    var c = buildCase();
    applyCommon(c);
    applyPreview(c);
    applyDashboard(c);
    applyPacket(c);
    applyGuideHook(c);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', run);
  }else{
    run();
  }
  window.addEventListener('load', function(){ window.setTimeout(run, 50); });
})();
