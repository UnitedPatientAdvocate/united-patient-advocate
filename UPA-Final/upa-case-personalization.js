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
    // Common test strings and meaningless multi-word phrases
    if(/^(test|testing|hello|hi there|foo\s|bar\s|lorem\s|ipsum|asdf|qwerty|click|skip|just\s+test|this\s+is\s+a\s+test|not\s+applicable|whatever|blah|stuff|things|anything|something)\b/i.test(t)) return '';
    // Pure numbers or symbol-only input
    if(/^[\d\s.,!@#$%^&*()\-_+=]+$/.test(t)) return '';
    return professionalBillingNote(t, maxLen || 140);
  }

  // Validates structured noun fields (provider name, insurance, bill type, payment status).
  // Returns the input if it looks like genuine content; returns fallback if it appears to be
  // garbage, a test string, profanity, or a non-meaningful placeholder.
  function safeProperNoun(text, fallback){
    var t = clean(text);
    if(!t) return fallback || '';
    // Must be at least 2 characters and contain at least one letter
    if(t.length < 2 || !/[a-zA-Z]/.test(t)) return fallback || '';
    // Pure numeric / price input that slipped into a name field
    if(/^[\d\s,.$%-]+$/.test(t)) return fallback || '';
    // Known test / placeholder strings (prefix match so "testing 123" also catches)
    if(/^(test|testing|asdf|qwerty|foo|bar|baz|lorem\s+ipsum|hello|hi|sample|example|placeholder|dummy|fake|garbage|junk|random|xxx|zzz|aaa|bbb|abc|123|999|null|undefined|n\/a|na|none|other)\b/i.test(t)) return fallback || '';
    // Single character repeated 3+ times (e.g. "aaaa", "hhhhh", "zzz zzz")
    if(/^(.)\1{2,}(\s+\1+)*$/.test(t)) return fallback || '';
    // Basic profanity / hostile text gate : don't let these into formal outputs
    if(/\b(fuck|shit|ass|bitch|cunt|crap|piss|bastard|damn\s+it|wtf|lmao)\b/i.test(t)) return fallback || '';
    // URL patterns pasted into a name field
    if(/https?:\/\/|www\.[a-z]/i.test(t)) return fallback || '';
    // All-caps keyboard mash longer than 8 chars that isn't a real acronym pattern
    if(/^[A-Z]{9,}$/.test(t)) return fallback || '';
    // FIX 1: random gibberish keyboard mash ("Odjdjt", "Jdjdd")
    if(looksLikeGibberish(t)) return fallback || '';
    return t;
  }

  function looksLikeSentence(text){
    var t = clean(text);
    if(!t) return false;
    var words = t.split(/\s+/).filter(Boolean);
    return /[.!?]/.test(t) ||
      words.length >= 7 ||
      /\b(i|me|my|mine|we|they|them|because|called|said|told|denied|covered|received|got|from my|through my)\b/i.test(t);
  }

  function safeCoverageText(data){
    var rawOther = clean(data.insurance_other || '');
    var raw = clean(data.insurance || '');
    var extracted = clean(data.extracted_insurance || '');
    if(rawOther && looksLikeSentence(rawOther)) return 'Coverage: see your EOB';
    var primary = rawOther || raw;
    var safe = safeProperNoun(primary, '');
    if(safe) return safe;
    safe = safeProperNoun(extracted, '');
    return safe || 'Your coverage';
  }

  function safePaymentStatusText(data){
    var rawKey = clean(data.payment_status_raw || '').toLowerCase();
    var raw = clean(data.payment_status || '');
    var rawOther = clean(data.payment_status_other || '');
    var text = (rawKey === 'other' ? rawOther : (rawOther || raw)).toLowerCase();
    if(rawKey === 'other'){
      safeUserText(rawOther, 80);
      return 'Review timing depends on your situation';
    }
    if(/collections|collector|collection agency/.test(text)) return 'Act promptly and keep written records';
    if(/insurance.*denied|denied|underpaid|appeal/.test(text)) return 'Check appeal and EOB deadlines';
    if(/payment plan|partial/.test(text)) return 'Review before sending more payments';
    if(/paid in full|already paid|\bpaid\b/.test(text) && !/not paid/.test(text)) return 'Refund review can still be requested';
    if(/unpaid|not paid|before paying/.test(text)) return 'Review before paying';
    return 'Review timing depends on your situation';
  }

  // ──────────────────────────────────────────────────────────────────────
  // FIX 1 (gibberish detection): When a user types random characters with
  // no recognizable English/billing intent ("Odjdjt", "Jdjdd", "Aaaaa"),
  // we must NEVER echo that text anywhere : not in the finding card title,
  // not in the description, not in the letter body, not in the intake
  // summary. Instead, the input is silently normalized to a generic
  // professional concern category.
  //
  // Heuristic: a "word" (3+ alpha chars) is gibberish if it has no vowels
  // at all, OR has 3+ identical characters in a row, OR has 4+ consecutive
  // consonants. If ≥60% of 3+ letter words match these patterns, the whole
  // input is treated as gibberish.
  //
  // Informal-but-meaningful inputs ("they charged me twice") pass through
  // normally because they contain real English words with normal vowel
  // patterns.
  function looksLikeGibberish(text){
    var t = clean(text).toLowerCase().trim();
    if(!t) return true;
    // Whole input is one character repeated ("aaaaa", "zzz zzz")
    if(/^(.)\1+$/.test(t.replace(/\s+/g,''))) return true;
    var words = t.split(/[^a-z]+/).filter(function(w){ return w.length >= 3; });
    if(!words.length){
      // No 3+ letter words at all → treat as gibberish unless input is dense
      return t.replace(/[^a-z]/g,'').length < 6;
    }
    var bad = 0;
    words.forEach(function(w){
      if(!/[aeiouy]/.test(w)){ bad++; return; }                  // no vowels
      if(/(.)\1{2,}/.test(w)){ bad++; return; }                  // 3+ same char in a row
      if(/[bcdfghjklmnpqrstvwxz]{4,}/.test(w)){ bad++; return; } // 4+ consonants in a row
    });
    return (bad / words.length) >= 0.6;
  }

  // ──────────────────────────────────────────────────────────────────────
  // CRITICAL: User-facing outputs (finding cards, letter bodies, dashboard
  // headers) MUST NEVER display raw user input verbatim. Raw text like
  // "I don't know what im doing" or "It is horrible and every thing is
  // soo confusing" reads as unprofessional and shatters the perceived
  // legitimacy of the deliverable.
  //
  // professionalizeUserConcern() runs every piece of free-form user text
  // through billingConcernPhrases() to extract the billing INTENT, then
  // restates it in clean professional language. The user's original words
  // are never returned.
  //
  // Returns '' when no billing intent can be extracted (vague/garbage
  // input) : callers should suppress the corresponding UI element entirely
  // when this returns empty, rather than fall back to raw text.
  // ──────────────────────────────────────────────────────────────────────
  function professionalizeUserConcern(text){
    var t = clean(text);
    if(!t || t.length < 8) return '';
    if(!/\s/.test(t)) return '';
    if(/^(idk|n\/a|na|nothing|none|no|yes|ok|okay|same|see above|other|not sure|unsure|unknown)$/i.test(t.trim())) return '';
    if(/^(test|testing|hello|hi there|foo\s|bar\s|lorem\s|ipsum|asdf|qwerty|click|skip|just\s+test|this\s+is\s+a\s+test|not\s+applicable|whatever|blah|stuff|things|anything|something)\b/i.test(t)) return '';
    if(/^[\d\s.,!@#$%^&*()\-_+=]+$/.test(t)) return '';
    if(looksLikeGibberish(t)) return ''; // FIX 1: random letters → suppress

    // Extract recognized billing intent : categorize what the user typed.
    // Never return the user's literal words.
    var phrases = billingConcernPhrases(t);
    if(phrases.length === 0) return ''; // No recognizable intent → suppress entirely

    var picked = phrases.slice(0, 2);
    if(picked.length === 1){
      return 'The intake indicates ' + picked[0] + ', which should be addressed in writing with supporting documentation.';
    }
    return 'The intake indicates ' + picked[0] + ' and ' + picked[1] + ', both of which should be addressed in writing with supporting documentation.';
  }

  // Returns a short professional concern LABEL (not a full sentence) suitable
  // for finding card titles. Either a categorized billing phrase or a generic
  // professional fallback : never the user's raw words.
  function professionalConcernTitle(text){
    var t = clean(text);
    // FIX 1: gibberish input → use the generic fallback, never echo the text
    if(!t || looksLikeGibberish(t)) return 'General billing review';
    var phrases = billingConcernPhrases(t);
    if(phrases.length){
      var p = phrases[0];
      return p.charAt(0).toUpperCase() + p.slice(1);
    }
    return 'General billing review';
  }

  // Legacy alias kept so any unrefactored call sites still get safe output
  // (now returns professionalized text, never raw). Maintained only to
  // prevent regressions if a call site is missed in a future refactor.
  function describeUserInput(text /*, maxLen*/){
    return professionalizeUserConcern(text);
  }

  function billingConcernPhrases(text){
    var t = clean(text).toLowerCase();
    var phrases = [];
    function add(match, phrase){
      if(match.test(t) && phrases.indexOf(phrase) === -1) phrases.push(phrase);
    }
    add(/duplicate|double|twice|again|repeat|same charge|charged.*two/i, 'possible duplicate or repeated charge');
    add(/insurance|eob|claim|denial|denied|covered|coverage|payer|benefit/i, 'insurance, EOB, or coverage review');
    add(/surprise|network|out.of.network|in.network|no surprises|balance bill/i, 'network status or surprise billing concern');
    add(/expensive|high|overcharg|too much|price|cost|amount|balance|rate|estimate/i, 'charge amount or patient responsibility concern');
    add(/code|coding|cpt|hcpcs|modifier|upcod|level|units|unbundle/i, 'coding, modifier, unit, or service-description concern');
    add(/paid|payment|refund|credit|collection|collections|agency|plan|late fee/i, 'payment posting, refund, collection, or account-status concern');
    add(/itemized|details|statement|line item|receipt|breakdown|explanation|records/i, 'missing itemized documentation or unclear line-item detail');
    add(/wrong|incorrect|date|provider|doctor|service|procedure|visit|test|lab|er|emergency|ambulance|anesthesia|surgery/i, 'service date, provider, or service-description accuracy concern');
    return phrases;
  }

  function professionalBillingNote(text, maxLen){
    var phrases = billingConcernPhrases(text);
    var note = phrases.length
      ? 'The patient is requesting written review of ' + phrases.slice(0, 3).join(', ') + ', with supporting itemized documentation and payer/provider explanation.'
      : 'The patient requested help understanding the bill and identifying possible billing issues.';
    return titleFromText(note, maxLen || 160);
  }

  function professionalConcernLabel(text){
    var t = clean(text);
    if(!t) return '';
    if(looksLikeGibberish(t)) return ''; // FIX 1: gibberish → filtered out of concern list
    var known = {
      'duplicate charge':'Possible duplicate charge',
      "i was billed for services i didn't receive":'Services may not match the bill',
      'billed out-of-network during in-network visit':'Network status or surprise billing concern',
      'unexpected lab or test charges':'Unexpected lab or test charge concern',
      'i think the wrong billing code was used':'Coding, modifier, or service-description concern',
      'my insurance claim was denied':'Insurance denial or EOB review',
      "i just don't understand what i'm being charged for":'Missing itemized documentation or unclear line-item detail',
      "i received a surprise bill i wasn't expecting":'Network status or surprise billing concern',
      'i never received an itemized bill':'Missing itemized documentation or unclear line-item detail',
      'other concern':'Additional billing documentation concern',
      'general billing review':'General billing review'
    };
    var key = t.toLowerCase();
    if(known[key]) return known[key];
    // Return a SHORT LABEL only : never a full "The patient is requesting..." sentence.
    // Returning professionalBillingNote() here produces a complete sentence for each
    // concern. When N concerns are selected those N sentences are joined with commas,
    // creating cascading repetition across the intake summary, finding card, and letter.
    var phrases = billingConcernPhrases(t);
    if(phrases.length){
      var p = phrases[0];
      return p.charAt(0).toUpperCase() + p.slice(1);
    }
    return ''; // Unrecognised text : silently filtered by seenConcerns dedup
  }

  function readStorageJSON(key){
    if(key === 'upa.ai.dossier.v1' && window.__UPA_ACCESS_CASE__) return window.__UPA_ACCESS_CASE__;
    if(key === STORE_KEY && window.__UPA_ACCESS_INTAKE__) return window.__UPA_ACCESS_INTAKE__;
    if(key === 'upa.scan.v1' && window.__UPA_ACCESS_CASE__ && window.__UPA_ACCESS_CASE__.scanData) return window.__UPA_ACCESS_CASE__.scanData;
    try{
      var raw = sessionStorage.getItem(key) || localStorage.getItem(key) || '';
      return raw ? (window.UPAParseStoredJSON ? window.UPAParseStoredJSON(raw,null) : JSON.parse(raw)) : null;
    }catch(e){
      return null;
    }
  }

  function readSimpleFunnelKeys(){
    var source = {};
    var map = {
      patientName:'patient_name',
      providerName:'provider',
      dateOfService:'date_of_service',
      insuranceName:'insurance',
      totalBilled:'bill_amount',
      referenceNumber:'account_number',
      billRange:'bill_amount_raw',
      visitReason:'bill_type'
    };
    Object.keys(map).forEach(function(key){
      var value = '';
      try { value = sessionStorage.getItem(key) || ''; } catch(e) {}
      if(!value){ try { value = localStorage.getItem(key) || ''; } catch(e) {} }
      if(value) source[map[key]] = value;
    });
    if(source.patient_name) source.name = source.patient_name;
    if(source.bill_amount && !source.bill_amount_other) source.bill_amount_other = source.bill_amount;
    return source;
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
      insurance: form.hasInsurance === false ? 'No Insurance (Self-Pay)' : (insuranceLabels[form.insuranceType] || clean(session && session.insurance) || 'Your coverage'),
      payment_status: statusLabels[form.billStatus] || clean(form.billStatus) || 'Account on file',
      concerns: concerns || services || visitReason,
      concerns_raw: concerns || services || visitReason,
      concern_other: concerns,
      description: [visitReason, services, concerns].filter(Boolean).join(' | '),
      uploaded_bill: clean(form.uploadedBill || form.fileName || (session && session.uploadedBill)) || 'Not uploaded'
    };
  }

  // FIX 1: Read case data from URL query params as a last-resort fallback.
  // Used when a paying customer arrives at the dashboard with empty localStorage
  // (cross-browser, cross-device, Safari ITP cleared storage, etc.). The success
  // page already restores from a base64 token via UPAState.restoreFromUrl(); this
  // adds a SECOND path that accepts plain readable params so we can also build
  // recovery URLs that survive raw-text sharing (e.g. ?p=Memorial%20Hospital&a=2400).
  // Keys are intentionally short to keep URLs under Gumroad's redirect limits.
  function readIntakeFromUrl(){
    try{
      var u = new URLSearchParams(window.location.search);

      // Mode A: compact base64url recovery param (?r=<base64>) : PRIMARY
      // Written by saveIntakeSession() on the landing page. This is THE
      // cross-context recovery path because it survives Gumroad's redirect,
      // email-link reopening in a fresh browser tab, and direct sharing.
      // Decodes the full case payload : every field the dashboard needs.
      var r = u.get('r');
      if(r){
        try{
          var b64 = r.replace(/-/g,'+').replace(/_/g,'/');
          while(b64.length % 4) b64 += '=';
          var decoded = decodeURIComponent(escape(atob(b64)));
          var parsed = JSON.parse(decoded);
          // Full field map : must mirror exactly the encoder in
          // saveIntakeSession() on the landing page. Adding a field here
          // without updating the encoder (or vice versa) leaves data
          // unrecoverable, so they're commented to keep them in sync.
          var fieldMap = {
            p:    'provider',         // hospital / clinic / provider name
            a:    'bill_amount',      // total or amount-range
            d:    'date_of_service',  // DOS
            i:    'insurance',        // coverage name
            s:    'payment_status',   // unpaid / payment plan / collections
            n:    'patient_name',     // patient full name
            c:    'concerns',         // concern checklist values
            desc: 'description',      // free-text concern description
            bt:   'bill_type',        // ER / inpatient / outpatient
            co:   'concern_other',    // free-text "other" concern
            em:   'email',            // contact email
            ph:   'phone',            // contact phone
            acct: 'account_number',   // account / claim / billing reference
            cid:  '_upa_case_id',     // stable case identifier
            ts:   'submitted_at'      // intake submission timestamp
          };
          var fromB64 = {};
          Object.keys(fieldMap).forEach(function(k){
            if(parsed[k]) fromB64[fieldMap[k]] = parsed[k];
          });
          if(Object.keys(fromB64).length){
            return fromB64;
          }
        }catch(e){ console.warn('[UPA HYDRATION] ?r= base64 decode failed:', e); }
      }

      // Mode B: plain readable params (?p=Memorial&a=2400&…) used for support
      // staff rebuilding a customer's case manually via a recovery URL.
      var map = { p:'provider', a:'bill_amount', d:'date_of_service',
                  i:'insurance', s:'payment_status', n:'patient_name',
                  c:'concerns',  desc:'description', acct:'account' };
      var out = {};
      Object.keys(map).forEach(function(k){
        var v = u.get(k);
        if(v) out[map[k]] = decodeURIComponent(v);
      });
      return Object.keys(out).length ? out : null;
    }catch(e){ return null; }
  }

  function readIntake(){
    try{
      // ═══════════════════════════════════════════════════════════════════
      // P0 FIX: URL params come FIRST. Email-link recovery is the dominant
      // failure mode : iOS Mail/Gmail/etc open every link in a fresh
      // Safari/Chrome tab where the user's intake localStorage doesn't
      // exist. The recovery `?r=<base64>` param riding in the URL is the
      // ONLY reliable cross-context data channel. It MUST win over the
      // empty localStorage of a fresh browser tab.
      //
      // Priority order:
      //   1. __UPA_ACCESS_INTAKE__   : freshly fetched access= server case
      //   2. __UPA_PACKET_INTAKE__   : downloaded HTML packets (offline)
      //   3. readIntakeFromUrl()     : URL params (cross-context recovery)
      //   4. UPAState.getIntake()    : localStorage (same-browser return)
      //   5. STORE_KEY direct read   : UPAState script load failure
      // ═══════════════════════════════════════════════════════════════════
      if(window.__UPA_ACCESS_INTAKE__ && typeof window.__UPA_ACCESS_INTAKE__ === 'object'){
        return window.__UPA_ACCESS_INTAKE__;
      }
      if(window.__UPA_ACCESS_CASE__ && window.__UPA_ACCESS_CASE__.intake && typeof window.__UPA_ACCESS_CASE__.intake === 'object'){
        return window.__UPA_ACCESS_CASE__.intake;
      }
      if(window.__UPA_PACKET_INTAKE__) return window.__UPA_PACKET_INTAKE__;

      // PRIORITY 1: URL params. Single most important hydration channel.
      // Always wins. Write through to localStorage so subsequent reads and
      // the audit log see the hydrated state.
      var urlIntake = readIntakeFromUrl();
      if(urlIntake && Object.keys(urlIntake).length){
        try{
          if(window.UPAState && window.UPAState.persistIntake){
            window.UPAState.persistIntake(urlIntake, {stage:'url-param-recovery', source:'dashboard-url'});
          } else {
            var json = JSON.stringify(urlIntake);
            try { localStorage.setItem('upa.intake.v1', json); } catch(e){}
            try { localStorage.setItem('upa.active.case.v1', json); } catch(e){}
            try { sessionStorage.setItem('upa.intake.v1', json); } catch(e){}
          }
        }catch(e){ console.warn('[UPA HYDRATION] URL→storage write failed:', e); }
        return urlIntake;
      }

      // PRIORITY 2: UPAState (localStorage) : same-browser return path
      if(window.UPAState){
        if(window.UPAState.restoreSession) window.UPAState.restoreSession({stage:'personalization-load'});
        if(window.UPAState.getIntake){
          var fromState = window.UPAState.getIntake() || {};
          if(fromState && Object.keys(fromState).length){
            return fromState;
          }
        }
      }

      // PRIORITY 3: Direct localStorage read : UPAState script load failure
      var intake = readStorageJSON(STORE_KEY);
      if(intake && Object.keys(intake).length){
        return intake;
      }



      var simpleIntake = readSimpleFunnelKeys();
      if(simpleIntake && Object.keys(simpleIntake).length){
        return simpleIntake;
      }
try{ console.warn('[UPA HYDRATION] All paths exhausted : URL had no ?r= param AND localStorage was empty'); }catch(e){}
      return {};
    }catch(e){
      return {};
    }
  }

  function formatMoney(n){
    if(!isFinite(n)) return 'Pending itemized bill';
    return '$' + Number(n).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0});
  }

  function formatMoneyFull(n){
    if(!isFinite(n)) return 'Pending itemized bill';
    return '$' + Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  }

  function parseNumber(text){
    var match = String(text || '').match(/\d[\d,]*(?:\.\d+)?/);
    return match ? parseFloat(match[0].replace(/,/g,'')) : null;
  }

  function confidenceValue(value){
    var n = parseFloat(value);
    return isFinite(n) ? n : 0;
  }

  function amountInfo(data){
    var rawKey = clean(data.bill_amount_raw || '');
    var rawText = clean(data.bill_amount_other || data.bill_amount || data.totalBilled || data.total_billed || data.amountOwed || data.balance || '');
    rawText = rawText.replace(/^Other:\s*/i, '');
    var extractedAmount = clean(data.extracted_bill_amount);
    var extractedAmountNumber = parseNumber(extractedAmount);
    var extractedAmountConfidence = confidenceValue(data.extracted_bill_amount_confidence);
    if(extractedAmountNumber != null && extractedAmountConfidence >= 0.5){
      var extractedInfo = {display:formatMoney(extractedAmountNumber), exact:extractedAmountNumber, low:extractedAmountNumber < 1000, extracted:true};
      extractedInfo.reviewText = extractedInfo.display;
      extractedInfo.calcValue = extractedAmountNumber;
      return extractedInfo;
    }
    var buckets = {
      under500:{display:'Under $500', low:true, range:true},
      '500-1k':{display:'$500 - $1,000', low:true, range:true},
      '1k-5k':{display:'$1,000 - $5,000', range:true},
      '5k-10k':{display:'$5,000 - $10,000', range:true},
      '10k-25k':{display:'$10,000 - $25,000', range:true},
      '25k-50k':{display:'$25,000 - $50,000', range:true},
      '50k-100k':{display:'$50,000 - $100,000', range:true},
      over100k:{display:'Over $100,000', range:true},
      unknown:{display:'Pending itemized bill', unknown:true}
    };
    var info = buckets[rawKey] ? Object.assign({},buckets[rawKey]) : null;
    if(!info){
      var exact = parseNumber(rawText);
      var hasRange = /-|to|under|over|not sure|unknown|approx|around|between/i.test(rawText);
      if(exact != null && !hasRange){
        info = {display:formatMoney(exact), exact:exact, low:exact < 1000};
      }else if(rawText && !/^not uploaded$/i.test(rawText) && /\d/.test(rawText)){
        // Only use rawText as the display amount if it contains at least one digit;
        // otherwise prose like "I don't know" or "a lot" falls through to unknown.
        info = {display:rawText, range:true, low:/under|500|1,000/i.test(rawText)};
      }else{
        info = {display:'Pending itemized bill', unknown:true};
      }
    }
    info.reviewText = info.unknown ? 'Pending itemized bill' : info.display;
    info.calcValue = info.exact || null;
    return info;
  }

  function numberOrNull(value){
    if(typeof value === 'number' && isFinite(value)) return value;
    var parsed = parseNumber(value);
    return parsed == null || !isFinite(parsed) ? null : parsed;
  }

  function readDossierState(){
    var injectedKey = ['__UPA', String.fromCharCode(65,73), 'DOSSIER__'].join('_');
    var storageKey = ['upa', String.fromCharCode(97,105), 'dossier', 'v1'].join('.');
    if(window.__UPA_PACKET_DOSSIER__ && typeof window.__UPA_PACKET_DOSSIER__ === 'object') return window.__UPA_PACKET_DOSSIER__;
    if(window[injectedKey] && typeof window[injectedKey] === 'object') return window[injectedKey];
    var dossier = readStorageJSON(storageKey);
    if(dossier && Object.keys(dossier).length) return dossier;
    dossier = readStorageJSON('upa.paid.results.v2');
    return dossier && Object.keys(dossier).length ? dossier : {};
  }

  function normalizeDossierFinding(item){
    if(typeof item === 'string') return {headline:'', detail:item, lineItem:''};
    item = item && typeof item === 'object' ? item : {};
    return {
      headline:item.headline || item.title || '',
      detail:item.detail || item.oneLineExplanation || item.body || item.teaser || '',
      lineItem:item.lineItem || item.lineItemReference || item.code || ''
    };
  }

  function currentDossierFindings(){
    var dossier = readDossierState();
    var paid = dossier.paidDossier && typeof dossier.paidDossier === 'object' ? dossier.paidDossier : {};
    var phase = dossier.phase3CaseGeneration && typeof dossier.phase3CaseGeneration === 'object'
      ? dossier.phase3CaseGeneration
      : (paid.phase3CaseGeneration && typeof paid.phase3CaseGeneration === 'object' ? paid.phase3CaseGeneration : {});
    var structuredLists = [dossier.findings, paid.findings, phase.structuredFindings].filter(Array.isArray);
    var summaryLists = [
      dossier.summary && dossier.summary.errorsFound,
      paid.summary && paid.summary.errorsFound
    ].filter(Array.isArray);
    function codes(item){
      var text = [item.headline,item.detail,item.lineItem].filter(Boolean).join(' ');
      return (text.match(/\b(?:[A-Z]?\d{5}[A-Z]?|\d{4}[A-Z])\b/gi) || []).map(function(code){ return code.toUpperCase(); });
    }
    function line(item){
      return String(item.lineItem || '').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    }
    function same(left,right){
      var leftLine = line(left);
      var rightLine = line(right);
      if(leftLine && rightLine && (leftLine === rightLine || leftLine.indexOf(rightLine) !== -1 || rightLine.indexOf(leftLine) !== -1)) return true;
      var leftCodes = codes(left);
      var rightCodes = codes(right);
      if(leftCodes.some(function(code){ return rightCodes.indexOf(code) !== -1; })) return true;
      if(leftLine || rightLine || leftCodes.length || rightCodes.length) return false;
      var leftHeadline = String(left.headline || '').toLowerCase().trim();
      var rightHeadline = String(right.headline || '').toLowerCase().trim();
      if(leftHeadline && rightHeadline && leftHeadline === rightHeadline) return true;
      return !!left.detail && !!right.detail && left.detail.toLowerCase().trim() === right.detail.toLowerCase().trim();
    }
    var merged = [];
    structuredLists.concat(summaryLists).forEach(function(list){
      list.map(normalizeDossierFinding).filter(function(item){ return item.headline || item.detail; }).forEach(function(item){
        if(!merged.some(function(existing){ return same(existing,item); })) merged.push(item);
      });
    });
    return merged;
  }

  function currentDossierIssueCount(){
    return currentDossierFindings().length;
  }

  function currentDossierLetterCount(){
    var dossier = readDossierState();
    var paid = dossier.paidDossier && typeof dossier.paidDossier === 'object' ? dossier.paidDossier : {};
    var phase = dossier.phase3CaseGeneration && typeof dossier.phase3CaseGeneration === 'object'
      ? dossier.phase3CaseGeneration
      : (paid.phase3CaseGeneration && typeof paid.phase3CaseGeneration === 'object' ? paid.phase3CaseGeneration : {});
    var lists = [phase.customLetters, dossier.customLetters, paid.customLetters, dossier.letters, paid.letters];
    for(var i=0;i<lists.length;i++){
      if(Array.isArray(lists[i])){
        var count = lists[i].filter(function(letter){
          return typeof letter === 'string' ? clean(letter) : letter && clean(letter.body || letter.scriptText || letter.text || letter.content);
        }).length;
        if(count) return count;
      }
    }
    var standalone = [
      dossier.disputeLetter, dossier.appealLetter, dossier.itemizedBillRequestLetter,
      paid.disputeLetter, paid.appealLetter, paid.itemizedBillRequestLetter
    ].filter(function(letter){ return clean(letter); });
    return standalone.length;
  }

  function firstArray(){
    for(var i=0;i<arguments.length;i++){
      if(Array.isArray(arguments[i]) && arguments[i].length) return arguments[i];
    }
    return [];
  }

  function normalizeBenchmarkLines(dossier){
    dossier = dossier || {};
    var paid = dossier.paidDossier || {};
    var summary = dossier.summary || {};
    var rows = firstArray(dossier.lineItems, dossier.codeAnalysis, paid.lineItems, paid.codeAnalysis, summary.lineItems, summary.codeAnalysis);
    return rows.map(function(row){
      row = row || {};
      var code = clean(row.code || row.hcpcs || row.cptCode || row.procedureCode).toUpperCase();
      var billed = numberOrNull(row.billedAmount != null ? row.billedAmount : (row.amount != null ? row.amount : row.charge));
      var rate = numberOrNull(row.benchmarkRate);
      var available = row.benchmarkAvailable === true && rate != null;
      var pct = numberOrNull(row.percentAboveBenchmark);
      if(pct == null && available && billed != null && rate > 0) pct = ((billed - rate) / rate) * 100;
      return {
        code: code,
        shortDescription: clean(row.shortDescription || row.benchmarkDescription || row.description || 'Line item'),
        billedAmount: billed,
        benchmarkRate: available ? rate : null,
        benchmarkAvailable: available,
        percentAboveBenchmark: available && pct != null ? Math.round(pct * 10) / 10 : null,
        source: available ? clean(row.source || 'CMS CLFS 2026') : '',
        reason: available ? '' : clean(row.reason || row.benchmarkUnavailableReason || 'benchmark unavailable : not a lab code')
      };
    }).filter(function(row){ return row.code || row.shortDescription || row.billedAmount != null; });
  }

  function clfsViewModel(dossier){
    var lines = normalizeBenchmarkLines(dossier);
    var matched = lines.filter(function(row){ return row.benchmarkAvailable; });
    var billedMatched = matched.reduce(function(sum,row){ return sum + (row.billedAmount || 0); }, 0);
    var benchmarkTotal = matched.reduce(function(sum,row){ return sum + (row.benchmarkRate || 0); }, 0);
    var overchargeTotal = matched.reduce(function(sum,row){ return sum + ((row.billedAmount || 0) - (row.benchmarkRate || 0)); }, 0);
    return {
      lines: lines,
      matched: matched,
      matchedCount: matched.length,
      totalCount: lines.length,
      billedMatched: billedMatched,
      benchmarkTotal: benchmarkTotal,
      overchargeTotal: overchargeTotal,
      coverageText: matched.length + ' of ' + lines.length + ' line items matched a verified Medicare lab benchmark'
    };
  }

  function clampPct(value){
    value = Number(value);
    if(!isFinite(value)) return 0;
    return Math.max(0, Math.min(100, value));
  }

  function lineBarHtml(line){
    if(!line.benchmarkAvailable){
      return '<div class="bench-item"><div class="bench-head"><span class="bench-name">' + h(line.code || 'Line item') + '</span><span class="bench-delta over">' + h(line.reason) + '</span></div><div style="font-size:.625rem;color:var(--ink-4);line-height:1.5">' + h(line.shortDescription) + '</div></div>';
    }
    var max = Math.max(line.billedAmount || 0, line.benchmarkRate || 0, 1);
    var billedW = clampPct(((line.billedAmount || 0) / max) * 100);
    var rateW = clampPct(((line.benchmarkRate || 0) / max) * 100);
    var delta = line.percentAboveBenchmark == null ? 'Verified CLFS match' : line.percentAboveBenchmark + '% above benchmark';
    return '<div class="bench-item"><div class="bench-head"><span class="bench-name">' + h(line.code || 'Line item') + ' - ' + h(line.shortDescription) + '</span><span class="bench-delta over">' + h(delta) + '</span></div>'
      + '<div class="bench-bar-row"><span class="bench-bar-lbl">Billed</span><div class="bench-bar-track"><div class="bench-bar-fill bbf-billed" style="width:' + billedW.toFixed(1) + '%"></div></div><span class="bench-bar-val">' + h(formatMoneyFull(line.billedAmount)) + '</span></div>'
      + '<div class="bench-bar-row"><span class="bench-bar-lbl">CMS CLFS</span><div class="bench-bar-track"><div class="bench-bar-fill bbf-medicare" style="width:' + rateW.toFixed(1) + '%"></div></div><span class="bench-bar-val">' + h(formatMoneyFull(line.benchmarkRate)) + '</span></div>'
      + '<div style="font-size:.5625rem;color:var(--ink-4);margin-top:4px">' + h(line.source) + '</div></div>';
  }

  function setBenchmarkFill(row, name, code, label, amount, pct){
    if(!row) return;
    var fill = one('.fv-fill', row);
    var val = one('.fvra-val', row);
    var fillLabel = one('.fv-fill-label', row);
    setText('.fvrl-name', name, row);
    setText('.fvrl-code', code, row);
    if(fill) fill.style.width = clampPct(pct).toFixed(1) + '%';
    if(fillLabel) fillLabel.textContent = label;
    if(val) val.textContent = amount;
  }

  function renderClfsBenchmarks(){
    var vm = clfsViewModel(readDossierState());
    var standbyMessage = 'Lab benchmark comparison applies only to itemized lab line items with CMS codes and dollar amounts. Your bill does not show itemized lab lines yet, so this one comparison is on standby. The rest of your review below is complete and ready to use.';
    var packet = one('[data-upa-clfs="packet"]');
    if(packet){
      packet.classList.toggle('clfs-standby', !vm.totalCount);
      var coverage = one('[data-upa-clfs-coverage]', packet);
      var center = one('[data-upa-clfs-center]', packet);
      var note = one('[data-upa-clfs-match-note]', packet);
      var over = one('[data-upa-clfs-overcharge]', packet);
      var linesWrap = one('[data-upa-clfs-lines]', packet);
      var grid = one('[data-upa-clfs-grid]', packet);
      if(!vm.totalCount){
        if(coverage) coverage.textContent = standbyMessage;
        if(center) center.textContent = 'On standby';
        if(note) note.textContent = 'Lab comparison on standby';
        if(over) over.textContent = 'On standby';
        var emptyPacket = '<div style="grid-column:1/-1;padding:18px;background:white;border:1px solid var(--bdr);border-radius:9px;border-left:5px solid var(--teal)"><div style="font-size:.875rem;font-weight:800;color:var(--navy);margin-bottom:4px">Lab comparison on standby</div><div style="font-size:.7rem;color:var(--ink4);line-height:1.6">' + h(standbyMessage) + '</div></div>';
        if(grid) grid.innerHTML = emptyPacket;
        else if(linesWrap) linesWrap.innerHTML = emptyPacket;
      }else{
        if(coverage) coverage.textContent = vm.coverageText + '.';
        if(center) center.textContent = vm.matchedCount + '/' + vm.totalCount;
        if(note) note.textContent = vm.coverageText;
        if(over) over.textContent = formatMoneyFull(vm.overchargeTotal);
        var packetLines = vm.lines.map(function(line){
          if(!line.benchmarkAvailable){
            return '<div style="display:flex;align-items:center;gap:14px;padding:16px 18px;background:white;border:1px solid var(--bdr);border-radius:9px;border-left:5px solid var(--amber)"><div style="flex:1"><div style="font-size:.875rem;font-weight:700;color:var(--navy);margin-bottom:2px">' + h(line.code || 'Line item') + '</div><div style="font-size:.625rem;color:var(--ink4)">' + h(line.reason) + '</div></div><div style="font-size:.7rem;font-weight:800;color:var(--amber)">Unavailable</div></div>';
          }
          return '<div style="padding:16px 18px;background:white;border:1px solid var(--bdr);border-radius:9px;border-left:5px solid var(--teal)"><div style="display:flex;gap:12px;justify-content:space-between;align-items:flex-start"><div><div style="font-size:.875rem;font-weight:800;color:var(--navy);margin-bottom:2px">' + h(line.code) + ' - ' + h(line.shortDescription) + '</div><div style="font-size:.625rem;color:var(--ink4)">' + h(line.source) + '</div></div><div style="text-align:right"><div style="font-size:.7rem;font-weight:800;color:var(--crimson)">' + h(line.percentAboveBenchmark) + '% above</div><div style="font-size:.625rem;color:var(--ink4)">Billed ' + h(formatMoneyFull(line.billedAmount)) + ' / CLFS ' + h(formatMoneyFull(line.benchmarkRate)) + '</div></div></div></div>';
        }).join('');
        if(grid) grid.innerHTML = '<div style="grid-column:1/-1;display:flex;flex-direction:column;gap:12px">' + packetLines + '</div>';
        else if(linesWrap) linesWrap.innerHTML = packetLines;
      }
    }

    var dashboardCard = one('[data-upa-clfs-dashboard-card]');
    if(dashboardCard) dashboardCard.classList.toggle('clfs-standby', !vm.totalCount);
    var financialCard = one('[data-upa-clfs-financial-card]');
    if(financialCard) financialCard.classList.toggle('clfs-standby', !vm.totalCount);
    var secondarySection = one('[data-upa-clfs-secondary-section]');
    if(secondarySection){
      var secondaryBars = one('[data-upa-clfs-static-bars]', secondarySection);
      var secondaryStandby = one('[data-upa-clfs-secondary-standby]', secondarySection);
      if(secondaryBars) secondaryBars.style.display = vm.totalCount ? 'flex' : 'none';
      if(secondaryStandby) secondaryStandby.style.display = vm.totalCount ? 'none' : 'block';
    }

    var dashboardLines = all('[data-upa-clfs-dashboard-line]');
    if(dashboardLines.length){
      var parent = dashboardLines[0].parentNode;
      dashboardLines.forEach(function(node){ node.parentNode.removeChild(node); });
      var html = vm.totalCount ? vm.lines.map(lineBarHtml).join('') : '<div class="bench-item"><div class="bench-head"><span class="bench-name">Lab comparison on standby</span><span class="bench-delta">Review complete</span></div><div style="font-size:.625rem;color:var(--ink-4);line-height:1.5">' + h(standbyMessage) + '</div></div>';
      parent.insertAdjacentHTML('beforeend', html);
    }

    var track = one('[data-upa-clfs-track]');
    var legend = one('[data-upa-clfs-legend]');
    if(track){
      if(!vm.totalCount){
        track.innerHTML = '<div class="bb-seg bbs-confirmed" style="flex:1 1 100%"><span class="bbs-label">Lab comparison on standby</span></div>';
      }else{
        var matchedBilled = vm.matched.reduce(function(sum,row){ return sum + (row.billedAmount || 0); }, 0);
        var unavailableBilled = vm.lines.filter(function(row){ return !row.benchmarkAvailable; }).reduce(function(sum,row){ return sum + (row.billedAmount || 0); }, 0);
        var totalBilled = Math.max(matchedBilled + unavailableBilled, 1);
        var matchedPct = clampPct((matchedBilled / totalBilled) * 100);
        var unavailablePct = clampPct((unavailableBilled / totalBilled) * 100);
        track.innerHTML = '<div class="bb-seg bbs-confirmed" style="flex:0 0 ' + matchedPct.toFixed(1) + '%"><span class="bbs-label">Verified CLFS</span></div><div class="bb-seg bbs-questioned" style="flex:0 0 ' + unavailablePct.toFixed(1) + '%"><span class="bbs-label">Unavailable</span></div>';
      }
    }
    if(legend){
      legend.innerHTML = vm.totalCount
        ? '<div class="legend-i"><div class="legend-dot ld-conf"></div><span class="legend-text">' + h(vm.coverageText) + '</span></div><div class="legend-i"><div class="legend-dot ld-dup"></div><span class="legend-text">Verified CLFS difference - ' + h(formatMoneyFull(vm.overchargeTotal)) + '</span></div>'
        : '<div class="legend-i"><div class="legend-dot ld-conf"></div><span class="legend-text">Lab comparison on standby. The rest of your review is ready.</span></div>';
    }

    setBenchmarkFill(one('[data-upa-clfs-waterfall-total]'), 'Matched Billed Total', 'Verified CLFS lines only', 'Matched billed total', formatMoneyFull(vm.billedMatched), vm.billedMatched ? 100 : 0);
    setBenchmarkFill(one('[data-upa-clfs-waterfall-benchmark]'), 'CMS CLFS Benchmark', 'Verified lab rates', 'CMS CLFS benchmark total', formatMoneyFull(vm.benchmarkTotal), vm.billedMatched ? (vm.benchmarkTotal / Math.max(vm.billedMatched, vm.benchmarkTotal, 1)) * 100 : 0);
    setBenchmarkFill(one('[data-upa-clfs-waterfall-overcharge]'), 'Verified Difference', 'Matched CLFS lines only', 'Matched-line difference', formatMoneyFull(vm.overchargeTotal), vm.billedMatched ? (vm.overchargeTotal / Math.max(vm.billedMatched, 1)) * 100 : 0);
    setText('[data-upa-clfs-match-count]', vm.totalCount ? (vm.matchedCount + ' of ' + vm.totalCount) : 'On standby');
    setText('[data-upa-clfs-coverage-short]', vm.totalCount ? vm.coverageText : 'No itemized lab lines yet');
    window.__UPA_CLFS_VIEW_MODEL__ = vm;
  }

  window.UPARenderCLFSBenchmarks = renderClfsBenchmarks;
  window.UPABuildCLFSViewModel = clfsViewModel;

  function readPhase3Dossier(dossier){
    if(dossier && typeof dossier === 'object') return dossier;
    return readDossierState();
  }

  function phase3FromDossier(dossier){
    dossier = readPhase3Dossier(dossier);
    var paid = dossier && dossier.paidDossier || {};
    var phase = dossier && dossier.phase3CaseGeneration || paid.phase3CaseGeneration || {};
    return phase && typeof phase === 'object' ? phase : {};
  }

  function phase3Text(value){
    return cleanCustomerCopy(clean(value)
      .replace(/\bis illegal\b/gi,'may need review')
      .replace(/\bclearly illegal\b/gi,'may need review')
      .replace(/\byou are owed\b/gi,'you may request review of')
      .replace(/\bmust pay\b/gi,'may need to confirm')
      .replace(/\bguaranteed\b/gi,'possible'));
  }

  function phase3Array(value){
    if(!Array.isArray(value)) return [];
    return value.map(phase3Text).filter(Boolean);
  }

  function phase3Rows(phase){
    return Array.isArray(phase.lineItemRiskScoring) ? phase.lineItemRiskScoring.filter(function(row){
      return row && (clean(row.code) || clean(row.reviewReason) || clean(row.patientQuestion));
    }) : [];
  }

  function phase3Letters(phase){
    return Array.isArray(phase.customLetters) ? phase.customLetters.filter(function(letter){
      return letter && clean(letter.body);
    }) : [];
  }

  function phase3TitleFromType(letter, idx){
    return phase3Text(letter.title || letter.letterType || ('Case letter ' + (idx + 1))).replace(/_/g,' ');
  }

  function phase3RiskWidth(risk){
    risk = phase3Text(risk).toUpperCase();
    if(risk === 'HIGH') return 88;
    if(risk === 'MODERATE' || risk === 'MEDIUM') return 64;
    return 38;
  }

  function phase3Money(value){
    var n = numberOrNull(value);
    return n == null ? 'To confirm' : formatMoneyFull(n);
  }

  function phase3LetterParts(letter){
    var lines = String(letter.body || '').replace(/\r/g,'').split(/\n+/).map(phase3Text).filter(Boolean);
    var salutation = lines.find(function(line){ return /^(dear|to whom|to\s)/i.test(line); }) || 'To Whom It May Concern,';
    var usable = lines.filter(function(line){
      return !/^(dear|to whom|to\s)/i.test(line) && !/^sincerely\b/i.test(line) && !/^patient$/i.test(line);
    });
    return {
      salutation: salutation,
      lead: usable[0] || 'I am requesting a written review and explanation for the billing items identified in my packet.',
      highlight: usable[1] || 'Please provide a written explanation and correction if your review confirms a duplicate, unsupported, or incorrectly billed entry.',
      support: usable.slice(2).join(' ') || 'This request is for review and documentation only and does not make a legal, medical, insurance, or financial conclusion.'
    };
  }

  function renderPhase3Letters(phase, c){
    var letters = phase3Letters(phase);
    if(!letters.length) return;
    var cards = all('.doc-preview-card');
    var bodies = all('.lbody');

    letters.slice(0,3).forEach(function(letter, idx){
      var title = phase3TitleFromType(letter, idx);
      var sourceType = phase3Text(letter.sourceType || 'patient intake and reviewed case data');
      var parts = phase3LetterParts(letter);
      var card = cards[idx];
      if(card){
        setText('.dpc-title', title, card);
        setText('.dpc-type', sourceType, card);
        setText('.mini-re', 'RE: ' + title, card);
        setText('.mini-salut', parts.salutation, card);
        setText('.mini-text', parts.lead, card);
        setText('.mini-highlight', parts.highlight, card);
        setText('.mini-text-2', parts.support, card);
        setText('.dpc-prepared', c && c.patientName ? 'Prepared for ' + c.patientName + ' - ' + c.accountRef : 'Prepared from Phase 3 case review');
      }
      var body = bodies[idx];
      if(body){
        setText('.lb-re-txt', title + (c && c.accountRef ? ' - Account: ' + c.accountRef : ''), body);
        setText('.lb-salut', parts.salutation, body);
        setHTML('.lb-para', h(parts.lead), body);
        setText('.lb-hl', parts.highlight, body);
        setText('.lb-sm', parts.support, body);
      }
    });
  }

  function renderPhase3RiskCards(phase){
    var rows = phase3Rows(phase);
    if(!rows.length) return;
    var cards = all('.finding-card');
    rows.slice(0,3).forEach(function(row, idx){
      var card = cards[idx];
      if(!card) return;
      var code = phase3Text(row.code || 'Line item');
      var risk = phase3Text(row.riskLevel || 'Review').toUpperCase();
      var sourceType = phase3Text(row.sourceType || 'reviewed case data');
      var reason = phase3Text(row.reviewReason || row.patientQuestion || 'This item may be worth checking in writing.');
      var question = phase3Text(row.patientQuestion || 'Request a written explanation before relying on the balance.');
      setText('.fi-title', code + (row.shortDescription ? ' - ' + phase3Text(row.shortDescription) : ''), card);
      setHTML('.fi-desc', h(reason) + ' <strong>' + h(question) + '</strong>', card);
      setText('.fi-code', sourceType, card);
      setText('.fi-sev', risk, card);
      setText('.fi-type', sourceType, card);
      setText('.fi-res', 'Review-first', card);
      setText('.fi-amount', phase3Money(row.billedAmount), card);
      setText('.fi-amount-lbl', row.benchmarkAvailable ? 'CLFS compared' : 'Benchmark unavailable');
      var vals = all('.ev-item-val', card);
      if(vals[0]) vals[0].textContent = code;
      if(vals[1]) vals[1].textContent = row.benchmarkAvailable ? phase3Money(row.benchmarkRate) : 'Unavailable';
      if(vals[2]) vals[2].textContent = risk;
      if(vals[3]) vals[3].textContent = row.percentAboveBenchmark != null ? row.percentAboveBenchmark + '% above' : 'Needs docs';
      var fill = one('.ev-str-fill', card);
      if(fill) fill.style.width = phase3RiskWidth(risk) + '%';
      setText('.ev-str-pct', risk, card);
    });
  }

  function phase3ListHtml(title, items){
    items = phase3Array(items).slice(0,4);
    if(!items.length) return '';
    return '<div class="upa-p3-group"><div class="upa-p3-title">' + h(title) + '</div>' +
      items.map(function(item){ return '<div class="upa-p3-item">' + h(item) + '</div>'; }).join('') + '</div>';
  }

  function renderDashboardPhase3(phase){
    var summary = phase3Text(phase.patientFindingSummary);
    var rows = phase3Rows(phase);
    var dashboardPanel = one('#upa-phase3-dashboard-panel');
    var findingsTab = one('#tab-findings');
    if(findingsTab && !dashboardPanel){
      dashboardPanel = document.createElement('div');
      dashboardPanel.id = 'upa-phase3-dashboard-panel';
      dashboardPanel.className = 'upa-phase3-panel';
      var anchor = one('.findings-grid', findingsTab) || findingsTab.firstChild;
      findingsTab.insertBefore(dashboardPanel, anchor);
    }
    if(dashboardPanel){
      dashboardPanel.innerHTML =
        '<div class="upa-p3-eyebrow">Phase 3 case generation</div>' +
        '<div class="upa-p3-heading">Patient-facing review summary</div>' +
        (summary ? '<div class="upa-p3-summary">' + h(summary) + '</div>' : '') +
        (rows.length ? '<div class="upa-p3-risk-grid">' + rows.slice(0,4).map(function(row){
          return '<div class="upa-p3-risk"><span>' + h(phase3Text(row.riskLevel || 'Review')) + '</span><strong>' + h(phase3Text(row.code || 'Line item')) + '</strong><em>' + h(phase3Text(row.reviewReason || row.patientQuestion || 'May need written review.')) + '</em></div>';
        }).join('') + '</div>' : '') +
        phase3ListHtml('Provider guidance', phase.providerSpecificGuidance) +
        phase3ListHtml('Escalation path', phase.stateSpecificEscalationPaths) +
        phase3ListHtml('Plan language', phase.planTypeSpecificLanguage);
    }

    var actionGrid = one('#tab-actionplan .action-grid');
    if(actionGrid && !one('#upa-phase3-action-panel')){
      var actionPanel = document.createElement('div');
      actionPanel.id = 'upa-phase3-action-panel';
      actionPanel.className = 'upa-phase3-panel compact';
      actionGrid.parentNode.insertBefore(actionPanel, actionGrid.nextSibling);
    }
    var action = one('#upa-phase3-action-panel');
    if(action){
      action.innerHTML = phase3ListHtml('Provider-specific next steps', phase.providerSpecificGuidance) +
        phase3ListHtml('State and plan follow-up language', [phase3Array(phase.stateSpecificEscalationPaths)[0], phase3Array(phase.planTypeSpecificLanguage)[0]]);
    }
  }

  function renderPacketPhase3(phase){
    var findingsBox = one('.packet-findings-box');
    var rows = phase3Rows(phase);
    if(findingsBox && rows.length){
      setText('.pf-count', rows.length + (rows.length === 1 ? ' risk score' : ' risk scores'), findingsBox);
      var list = one('.pf-list', findingsBox);
      if(list){
        list.innerHTML = rows.slice(0,4).map(function(row){
          return '<div style="display:flex;align-items:flex-start;gap:10px">' +
            '<div style="font-size:.55rem;font-weight:800;color:var(--teal);min-width:56px;text-transform:uppercase">' + h(phase3Text(row.riskLevel || 'Review')) + '</div>' +
            '<div><div style="font-size:.625rem;font-weight:700;color:var(--navy)">' + h(phase3Text(row.code || 'Line item')) + '</div>' +
            '<div style="font-size:.5rem;color:var(--ink3);line-height:1.5">' + h(phase3Text(row.reviewReason || row.patientQuestion || 'May need written review.')) + '</div></div></div>';
        }).join('');
      }
      findingsBox.style.display = '';
    }

    var firstPage = all('.page')[0];
    if(firstPage && !one('#upa-phase3-packet-panel', firstPage)){
      var panel = document.createElement('div');
      panel.id = 'upa-phase3-packet-panel';
      panel.className = 'upa-phase3-panel packet';
      var anchor = one('.packet-findings-box', firstPage) || one('.upa-intake-context', firstPage) || one('.nh', firstPage);
      if(anchor && anchor.parentNode) anchor.parentNode.insertBefore(panel, anchor.nextSibling);
    }
    var packetPanel = one('#upa-phase3-packet-panel');
    if(packetPanel){
      packetPanel.innerHTML =
        '<div class="upa-p3-eyebrow">Generated case review</div>' +
        '<div class="upa-p3-heading">What this packet is built around</div>' +
        (phase.patientFindingSummary ? '<div class="upa-p3-summary">' + h(phase3Text(phase.patientFindingSummary)) + '</div>' : '') +
        phase3ListHtml('Provider guidance', phase.providerSpecificGuidance) +
        phase3ListHtml('Escalation path', phase.stateSpecificEscalationPaths) +
        phase3ListHtml('Plan language', phase.planTypeSpecificLanguage) +
        (phase.reviewSafetyNotice ? '<div class="upa-p3-notice">' + h(phase3Text(phase.reviewSafetyNotice)) + '</div>' : '');
    }
  }

  function triggerGuidanceData(dossier){
    dossier = readPhase3Dossier(dossier);
    var paid = dossier && dossier.paidDossier || {};
    var triggers = firstArray(dossier && dossier.triggers, paid.triggers);
    var charity = triggers.find(function(trigger){ return trigger && trigger.type === 'charity_care_eligible'; });
    var surprise = triggers.filter(function(trigger){
      return trigger && (trigger.type === 'surprise_billing_emergency' || trigger.type === 'surprise_billing_ancillary');
    });
    var stateNotes = [];
    surprise.forEach(function(trigger){
      var note = phase3Text(trigger.stateNote);
      if(note && stateNotes.indexOf(note) === -1) stateNotes.push(note);
    });
    var pack = dossier && dossier.charityCarePack || paid.charityCarePack || {};
    return {
      charity: charity,
      charitySteps: Array.isArray(pack.applicationSteps) ? pack.applicationSteps.map(phase3Text).filter(Boolean).slice(0,5) : [],
      surprise: surprise,
      stateNotes: stateNotes
    };
  }

  function triggerGuidanceHtml(data, packet){
    var groups = [];
    if(data.charity){
      var charityItems = data.charitySteps.length ? data.charitySteps : [
        'Call the hospital billing office and ask for the current financial assistance application.',
        'Request the eligibility criteria and required documents in writing.',
        'Keep a copy of the completed application and follow up in writing.'
      ];
      groups.push('<section class="upa-trigger-group"><div class="upa-trigger-title">Charity Care Guidance</div><div class="upa-trigger-copy">Your bill mentions financial assistance. You can ask the hospital for its current policy, eligibility criteria, and application.</div><ul>' + charityItems.map(function(item){ return '<li>' + h(item) + '</li>'; }).join('') + '</ul></section>');
    }
    if(data.stateNotes.length){
      groups.push('<section class="upa-trigger-group"><div class="upa-trigger-title">State-Aware Guidance</div>' + data.stateNotes.map(function(note){ return '<div class="upa-trigger-copy">' + h(note) + '</div>'; }).join('') + '</section>');
    }
    if(data.surprise.length){
      groups.push('<section class="upa-trigger-group"><div class="upa-trigger-title">Surprise-Billing Guidance</div><div class="upa-trigger-copy">Emergency or ancillary charges in this case may qualify for an out-of-network billing review. Ask the provider and insurer to explain the network status, consent records, and patient-responsibility calculation in writing.</div></section>');
    }
    if(!groups.length) return '';
    return '<div class="upa-trigger-eyebrow">Guidance matched to this case</div><div class="upa-trigger-heading">Additional review paths</div><div class="upa-trigger-grid' + (packet ? ' packet' : '') + '">' + groups.join('') + '</div>';
  }

  function renderTriggerGuidance(dossier){
    ensureStyles();
    var data = triggerGuidanceData(dossier);
    var html = triggerGuidanceHtml(data, false);
    var findingsTab = one('#tab-findings');
    var dashboardPanel = one('#upa-trigger-dashboard-panel');
    if(findingsTab && html){
      if(!dashboardPanel){
        dashboardPanel = document.createElement('div');
        dashboardPanel.id = 'upa-trigger-dashboard-panel';
        dashboardPanel.className = 'upa-trigger-panel';
        var dashboardAnchor = one('#upa-phase3-dashboard-panel', findingsTab) || one('.findings-grid', findingsTab) || findingsTab.firstChild;
        if(dashboardAnchor && dashboardAnchor.parentNode) dashboardAnchor.parentNode.insertBefore(dashboardPanel, dashboardAnchor.nextSibling);
      }
      dashboardPanel.innerHTML = html;
    }else if(dashboardPanel){
      dashboardPanel.remove();
    }

    var firstPage = all('.page')[0];
    var packetPanel = one('#upa-trigger-packet-panel');
    var packetHtml = triggerGuidanceHtml(data, true);
    if(firstPage && packetHtml){
      if(!packetPanel){
        packetPanel = document.createElement('div');
        packetPanel.id = 'upa-trigger-packet-panel';
        packetPanel.className = 'upa-trigger-panel packet';
        var packetAnchor = one('#upa-phase3-packet-panel', firstPage) || one('.packet-findings-box', firstPage) || one('.upa-intake-context', firstPage) || one('.nh', firstPage);
        if(packetAnchor && packetAnchor.parentNode) packetAnchor.parentNode.insertBefore(packetPanel, packetAnchor.nextSibling);
      }
      packetPanel.innerHTML = packetHtml;
    }else if(packetPanel){
      packetPanel.remove();
    }
  }

  function renderPhase3CaseGeneration(dossier, c){
    renderTriggerGuidance(dossier);
    var phase = phase3FromDossier(dossier);
    if(!phase || !Object.keys(phase).length) return;
    ensureStyles();
    renderPhase3RiskCards(phase);
    renderPhase3Letters(phase, c || window.UPACase || {});
    renderDashboardPhase3(phase);
    renderPacketPhase3(phase);
    window.__UPA_PHASE3_CASE_GENERATION__ = phase;
  }

  window.UPARenderPhase3CaseGeneration = renderPhase3CaseGeneration;
  window.UPARenderTriggerGuidance = renderTriggerGuidance;

  function formatDate(value, fallback){
    var raw = clean(value);
    if(!raw) return fallback || 'On file';
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
    var provider = safeProperNoun(clean(data.provider), '') || safeProperNoun(clean(data.extracted_provider), '');
    var billType = clean(data.bill_type_other || data.bill_type, 'medical bill');
    var coverage = safeProperNoun(clean(data.insurance_other || data.insurance), '') || safeProperNoun(clean(data.extracted_insurance), '');
    var payment = clean(data.payment_status_other || data.payment_status);
    var description = clean(data.description);
    var uploadedBill = clean(data.uploaded_bill);
    var extractedParts = [];
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

    var scanProvider = safeProperNoun(data.extracted_provider, '');
    if(scanProvider) extractedParts.push('provider: ' + scanProvider);
    if(clean(data.extracted_bill_amount)) extractedParts.push('amount: ' + clean(data.extracted_bill_amount));
    if(clean(data.extracted_date_of_service)) extractedParts.push('service date: ' + formatDate(data.extracted_date_of_service, clean(data.extracted_date_of_service)));
    if(clean(data.extracted_account_number)) extractedParts.push('account/reference: ' + clean(data.extracted_account_number));
    if(extractedParts.length){
      list.push({
        key:'bill-scan-specificity',
        type:'Bill review',
        title:'Uploaded bill values were detected for case matching',
        short:'bill-scan value match',
        desc:'The scan detected ' + extractedParts.join(', ') + '. These values are being used as case anchors and should be confirmed against the statement and EOB before relying on them in a dispute.',
        action:'Confirm the extracted provider, amount, date, and account details against the original bill, then use them in written requests.'
      });
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
        type:'Additional intake concern',
        title:'Additional intake details need a written answer',
        short:'intake-detail review',
        // Never echo the user's raw typed text. Always run it through
        // professionalizeUserConcern() which produces a clean professional
        // restatement, or returns '' (in which case we use a neutral fallback).
        desc:(function(){
          var pro = professionalizeUserConcern(description);
          return pro
            ? pro + ' The provider should address this specific concern in writing, not with a generic balance explanation.'
            : 'A specific concern was noted at intake and should be addressed in writing, with the relevant records, codes, and adjustments identified.';
        })(),
        action:'Ask billing to identify the exact records or line items that answer the concern raised at intake.'
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
    var other = safeUserText(data.concern_other || '', 120);
    var hay = (raw.concat(labels).join(' ') + ' ' + clean(data.description) + ' ' + clean(data.payment_status_raw) + ' ' + clean(data.payment_status) + ' ' + clean(data.bill_type)).toLowerCase();
    var found = [];
    var seen = {};

    function add(issue){
      if(!issue || seen[issue.key]) return;
      seen[issue.key] = true;
      found.push(issue);
    }

    if(other){
      // Never publish raw user-typed text in finding card titles or descriptions.
      // Always categorize via professionalConcernTitle() / professionalizeUserConcern()
      // which produce clean professional billing-concern language or generic
      // professional fallbacks. The user's literal words never appear.
      var proTitle = professionalConcernTitle(other);
      var proDesc  = professionalizeUserConcern(other);
      add({
        key:'custom',
        type:'Additional billing concern',
        title: proTitle,
        short: titleFromText(proTitle, 46),
        desc: proDesc
          ? proDesc + ' The relevant records, codes, and adjustments should be identified.'
          : 'A specific concern was noted at intake. The provider should address it in writing, with the relevant records, codes, and adjustments identified.',
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
      copy.amountText = amount.exact ? amount.display : 'Pending itemized bill';
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
    if(safeUserText(clean(data.concern_other), 80) && primaryKey !== 'custom'){
      // Only add the custom letter if the concern_other text produces meaningful
      // billing content (not garbage, test strings, or single-word throwaway input).
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
    var cust = c.userDetail || safeUserText((c.raw && (c.raw.concern_other || c.raw.description)) || c.description || '', 140) || 'additional billing documentation concern';
    var map = {
      network:{
        title:'Network Rate Review',type:'Network / Surprise Billing Review',
        color:'cobalt',stamp:['NETWORK','REVIEW'],
        re:'RE: Network Rate Review, Acct: '+ref+', DOS: '+date,
        sal:'Dear Billing Department,',
        p1:'I am requesting a written review of the out-of-network rate applied to '+bill+' services at '+prov+' on '+date+'. The current charge of '+amt+' may reflect out-of-network billing during an in-network facility encounter. Federal surprise-billing protections may apply depending on the facts and documentation. My coverage is '+cov+'.',
        hl:'Please review whether federal surprise-billing protections may apply and whether the patient responsibility was calculated using the appropriate network rate.',
        p2:'Please provide in writing: (1) network status and contract type for every billing provider, (2) the rate basis and allowable amount under my plan, (3) any notice or consent documentation related to surprise billing protections, (4) the EOB from '+cov+' showing the network determination, (5) available review options, and (6) a corrected patient responsibility if the rate adjustment changes the balance. Please consider pausing collection activity while this review is pending.'
      },
      insurance:{
        title:'Formal Appeal : Insurance Denial / Underpayment',type:'Insurance Appeals & Denial Review',
        color:'cobalt',stamp:['APPEAL','FILED'],
        re:'RE: Formal Written Appeal : Denial or Underpayment : Acct: '+ref+' : '+cov,
        sal:'Dear '+cov+' Appeals Department,',
        p1:'I am submitting a formal written appeal of the denial or underpayment applied to my claim for '+bill+' services at '+prov+' on '+date+'. The patient balance of '+amt+' reflects a determination I believe should be reconsidered under my plan terms and benefits. Account reference: '+ref+'.',
        hl:'I formally request: (1) the complete Explanation of Benefits with all denial and remark codes, (2) the specific plan provision or clinical criteria cited in the denial, (3) the name and credentials of any medical reviewer, (4) all records considered in the review, (5) the complete internal appeals process including deadlines, and (6) the external independent review procedure.',
        p2:'Please issue a written determination within the timeframe provided by my plan or review process. If upheld, provide the available external review procedure and the state insurance department contact. Please consider pausing collection and credit-reporting activity on the reviewed balance while the appeal is pending. Maintain a written record of this appeal in your system and provide me with an appeal reference number.'
      },
      collections:{
        title:'Collection Account Validation Request',type:'Collection Account Review Request',
        color:'crimson',stamp:['ACCOUNT','REVIEW'],
        re:'RE: Collection Account Validation Request, Acct: '+ref,
        sal:'To Whom It May Concern,',
        p1:'I am requesting written validation and review of the balance attributed to account '+ref+' at '+prov+' for '+bill+' services on '+date+', listed as '+amt+'. I would like complete written verification before I decide how to respond to the collection notice.',
        hl:'Please provide in writing: (1) the name and address of the original creditor, (2) a complete line-by-line itemized statement of all charges, (3) documentation showing who currently manages the account, (4) the account and payment history, and (5) confirmation the claim was submitted to and processed by '+cov+'.',
        p2:'Please consider pausing collection communications, actions, and credit reporting on this account until complete written validation is provided. Please respond in writing with a reference number and the current status of this review.'
      },
      payment:{
        title:'Refund & Overpayment Review Request',type:'Payment Correction & Refund Request',
        color:'green',stamp:['REFUND','REVIEW'],
        re:'RE: Request for Payment Review & Corrected Statement : Acct: '+ref+' : DOS: '+date,
        sal:'Dear Patient Financial Services,',
        p1:'I am requesting a formal review of payments made toward account '+ref+' for '+bill+' at '+prov+' on '+date+'. Payment status is "'+pay+'" with remaining balance '+amt+' and coverage '+cov+'. Billing review areas identified in my case may support a review of whether a refund or credit is appropriate.',
        hl:'Please provide a complete written accounting of: (1) all payments received against account '+ref+' to date, (2) all payer adjustments, contractual write-offs, and insurance payments applied, (3) the current patient responsibility after all adjustments, and (4) whether any overpayment exists and the procedure to request a refund or credit.',
        p2:'If the review identifies a corrected balance lower than the amount paid, provide a written corrected statement and refund instructions. If no adjustment is warranted, provide the specific records and EOB that support the current balance in writing. Please also provide any available appeal or external review options and consider pausing credit reporting on the reviewed portion while this request is pending.'
      },
      coding:{
        title:'CPT / HCPCS Coding & Documentation Review',type:'Billing Code Audit & Documentation Request',
        color:'cobalt',stamp:['CODING','AUDIT'],
        re:'RE: Formal CPT/HCPCS Coding & Documentation Review : Acct: '+ref+' : DOS: '+date,
        sal:'Dear Medical Records and Billing Department,',
        p1:'I am requesting a formal written review of the CPT, HCPCS, and revenue codes billed on account '+ref+' for '+bill+' at '+prov+' on '+date+'. Current balance is '+amt+' with coverage '+cov+'. My billing analysis identifies a possible coding or service-level concern. An improperly coded or upcoded bill produces an incorrect patient responsibility and may require a corrected claim to '+cov+'.',
        hl:'For each billing line under review, please provide: (1) the CPT/HCPCS or revenue code and full description, (2) the E/M visit level and documentation basis (history, examination, medical decision-making), (3) any modifiers applied and their clinical justification, (4) the medical record supporting code selection, (5) whether any unbundled codes should be reported as a single combined code, and (6) whether a corrected claim has been or should be submitted.',
        p2:'If documentation does not support the billed code level, service description, or units, please issue a corrected claim to '+cov+' and a revised patient statement. The corrected patient responsibility must reflect the adjustment. Respond in writing within 30 days with supporting documentation or a corrected billing statement and a reference number for this review request.'
      },
      service:{
        title:'Unrecognized Service Charges : Formal Challenge',type:'Unperformed Service Dispute',
        color:'crimson',stamp:['CHALLENGE','FILED'],
        re:'RE: Formal Challenge of Unrecognized Service Charges : Acct: '+ref+' : DOS: '+date,
        sal:'Dear Billing Department,',
        p1:'I am formally challenging charges on account '+ref+' for '+bill+' at '+prov+' on '+date+'. Balance is '+amt+' with coverage '+cov+' and payment status "'+pay+'". My intake identifies services that do not correspond to services I recall receiving, consenting to, or that were ordered by the requesting party listed in my medical record. Billing for unperformed or unauthorized services requires written correction.',
        hl:'For each challenged charge I request: (1) the clinical order or referral authorizing the service, (2) the name, credentials, and documentation of the party listed as having performed the service, (3) the date, time, and location of service delivery, (4) signed patient consent for each service where applicable, and (5) written confirmation that the service was ordered, performed, and is fully supported in the medical record.',
        p2:'If any charge is not supported by complete clinical documentation of the ordered and performed service, please remove it from the statement and issue a corrected billing statement with the reduced patient responsibility. Do not refer challenged charges to collections while this formal review is pending. Respond within 30 days with supporting documentation or a corrected billing statement.'
      },
      custom:{
        title:'Custom Concern Addendum : Formal Written Review',type:'Patient-Described Billing Concern',
        color:'green',stamp:['CUSTOM','REVIEW'],
        re:'RE: Custom Billing Concern Addendum : Acct: '+ref+' : DOS: '+date,
        sal:'Dear Billing Department,',
        p1:'This letter is a formal written addendum to the billing review initiated for account '+ref+' at '+prov+' on '+date+'. It addresses additional billing context from my intake: '+h(cust)+' Current balance is '+amt+' with coverage '+cov+'.',
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
      + '<span class="mini-sig-sub">' + h(c.lastName || c.patientName) + ' / ' + h(c.coverage) + '</span>'
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
    if(footer) footer.textContent = c.letterCount + ' letters prepared for your case : each uses your patient name, provider, and intake details.';
  }

  function buildCase(){
    var data = readIntake();

    // ── Hydration audit trail (BUG 1 fix) ──────────────────────────────
    // Logs exactly which storage keys produced data and which produced
    // empty/missing values. If a paying customer reports "Provider not
    // provided" appearing on the dashboard, this trail makes the
    // diagnosis a single console copy/paste.
    try {
      var auditKeys = [
        'upa.active.case.v1',
        'upa.intake.v1',
        'upa.case.snapshot.v1',
        'upa.paid.results.v2',
        'upa.dashboard.state.v1',
        'upa.review.session.v1',
        'upa.checkout.session.v2',
        'upa.scan.v1'
      ];
      var auditReport = { _arrivedFromUrlToken: false, _urlHasToken: /[?&](?:case|r)=/.test(window.location.search) };
      auditKeys.forEach(function(k){
        var ls = null, ss = null;
        try { ls = localStorage.getItem(k); } catch(e){}
        try { ss = sessionStorage.getItem(k); } catch(e){}
        auditReport[k] = {
          inLocal: !!ls, localLen: ls ? ls.length : 0,
          inSession: !!ss, sessionLen: ss ? ss.length : 0
        };
      });
      auditReport._readIntakeYielded = {
        provider:    !!clean(data.provider || data.extracted_provider),
        bill_amount: !!clean(data.bill_amount || data.totalBilled || data.extracted_bill_amount),
        date:        !!clean(data.date_of_service || data.dos || data.extracted_date_of_service),
        insurance:   !!clean(data.insurance || data.extracted_insurance),
        concerns:    !!clean(data.concerns || data.specificConcerns || data.description),
        name:        !!clean(data.patient_name || data.patientName || data.full_name || data.name)
      };
      if (auditReport._urlHasToken && !auditReport._readIntakeYielded.provider) {
        console.warn('[UPA HYDRATION AUDIT] URL contains ?case= token but readIntake() found no provider : token may have failed to restore. Check upa-state-persistence.js restoreFromUrl().');
      }
      if (!auditReport['upa.active.case.v1'].inLocal && !auditReport['upa.intake.v1'].inLocal && !auditReport['upa.review.session.v1'].inLocal) {
        console.warn('[UPA HYDRATION AUDIT] ALL primary storage keys empty in localStorage. This is a cross-context/cross-device load OR storage was cleared. Dashboard will render with graceful fallbacks ("Your provider", "Pending itemized bill", etc.) rather than "not provided" placeholders.');
      }
    } catch(e){ /* audit must never break case build */ }

    var amount = amountInfo(data);
    var name = buyerTypedName(data);
    var nameBits = name.split(/\s+/).filter(Boolean);
    var first = nameBits[0] || '';
    var last = nameBits.length > 1 ? nameBits[nameBits.length - 1] : '';
    var nameParts = name ? name.split(/\s+/).filter(Boolean) : [];
    var lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : (nameParts[0] || '');
    var prepDate = formatDate(data.submitted_at || new Date().toISOString(), 'Today');
    var opened = data.submitted_at ? new Date(data.submitted_at) : new Date();
    if(isNaN(opened.getTime())) opened = new Date();
    var provider = safeProperNoun(clean(data.provider), '') || safeProperNoun(clean(data.extracted_provider), '') || 'Your provider';
    var rawDos = data.date_of_service || data.dos || data.extracted_date_of_service;
    var dos = formatDate(rawDos, 'On file');
    var billType = safeProperNoun(clean(data.bill_type_other || data.bill_type, 'medical bill'), 'medical bill');
    var coverage = safeCoverageText(data);
    var paymentStatus = safePaymentStatusText(data);
    var description = clean(data.description);
    var email = clean(data.email);
    var phone = clean(data.phone);
    var concernLabels = splitList(data.concerns).map(professionalConcernLabel);
    var safeConcernOther = safeUserText(data.concern_other, 120);
    if(safeConcernOther) concernLabels.push(professionalConcernLabel(safeConcernOther));
    var seenConcerns = {};
    concernLabels = concernLabels.filter(function(item){
      var key = item.toLowerCase();
      if(!item || seenConcerns[key]) return false;
      seenConcerns[key] = true;
      return true;
    });
    var concernSummary = concernLabels.length ? concernLabels.join(', ') : 'General billing review';
    // ── userDetail: professional restatement of the intake description ─────
    // CRITICAL: This value flows into the letter body ("Additional billing
    // context: …"), the dashboard case-header deck, and finding card decks.
    // It MUST NEVER contain the user's raw typed words. Frustrated, informal,
    // or broken text ("I don't know what im doing", "It is horrible and every
    // thing is soo confusing idont know how to do this") in a formal letter
    // destroys the perceived legitimacy of the deliverable.
    //
    // Strategy: run the description through professionalizeUserConcern() which
    // categorizes the billing intent and emits a clean professional sentence.
    // If no intent can be categorized, return '' so the "Additional billing
    // context" line is suppressed entirely (rather than echoing vague text).
    //
    // Additional dedup: even when we have a clean professional restatement,
    // suppress it if the underlying billing phrases are already fully covered
    // by the user's selected concern labels : otherwise we'd say the same
    // thing twice in the letter.
    var userDetail = '';
    (function(){
      var pro = professionalizeUserConcern(description);
      if(!pro) return; // No recognizable billing intent → suppress entirely

      var descPhrases = billingConcernPhrases(description);
      if(descPhrases.length === 0) return; // (paranoia : pro would already be '')

      var concernText = concernLabels.join(' ').toLowerCase();

      // Surface only if the description introduces at least one billing phrase
      // not already covered by the user's selected concern labels. This prevents
      // the letter from restating the same topic twice.
      var hasNewPhrases = descPhrases.some(function(ph){
        return concernText.indexOf(ph.toLowerCase()) === -1;
      });
      if(hasNewPhrases){
        userDetail = name ? pro.replace(/^The patient\b/, name).replace(/^the patient\b/, name) : pro;
        return;
      }
      // Fully covered by concern labels → suppress.
    })();
    var uploadedBill = clean(data.uploaded_bill || data.scan_file_name);
    var uploaded = !!(uploadedBill && !/^not uploaded/i.test(uploadedBill));
    var issues = buildIssues(data, amount, uploaded);
    var dossierFindings = currentDossierFindings();
    var generatedLetterCount = currentDossierLetterCount();
    var detailScore = 28;
    if(provider && provider !== 'Your provider') detailScore += 10;
    if(dos !== 'On file') detailScore += 8;
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
      notes.push('The stated amount is on the lower end for billing disputes. That does not mean it should go unchecked : confirming the charges now is the fastest path to resolution.');
    }
    var primary = issues[0];
    var status = paymentCopy(paymentStatus);
    var letterPlan = buildLetterPlan(data, issues);
    var ref = clean(data.account_number || data.accountNumber || data.account || data.billing_reference || data.billingReference || data.extracted_account_number, 'in your case folder');
    var basis = [
      'itemized statement request',
      'EOB and payer-responsibility comparison',
      uploaded ? 'uploaded bill review' : 'bill upload still needed',
      'CPT/HCPCS/revenue-code review when line items are available'
    ];
    if(issues.some(function(i){return i.key === 'network';})) basis.push('network and surprise-billing screening when the facts support it');
    var sanitizedRaw = Object.assign({}, data, {
      bill_amount: amount.display,
      bill_amount_other: amount.display,
      insurance: coverage,
      insurance_other: coverage,
      payment_status: paymentStatus,
      payment_status_other: '',
      concerns: concernSummary,
      concerns_raw: '',
      concern_other: safeConcernOther
    });
    return {
      raw:sanitizedRaw,
      patientName:name,
      lastName:lastName,
      firstName:first || name.split(/\s+/)[0] || 'You',
      provider:provider,
      email:email,
      phone:phone,
      contactLine:[email, phone].filter(Boolean).join(' | ') || 'Contact details can be added before sending',
      dateOfService:dos,
      dateShort:shortDate(rawDos),
      prepDate:prepDate,
      openedShort:shortDate(data.submitted_at),
      deadline30:shortDate(addDays(opened,30).toISOString()),
      deadline60:shortDate(addDays(opened,60).toISOString()),
      accountRef:ref,
      billType:billType,
      coverage:coverage,
      paymentStatus:paymentStatus,
      patientLabel:lastName ? lastName + ' · ' + coverage : coverage,
      amount:amount,
      issues:issues,
      primary:primary,
      primaryInline:lowerFirst(primary.short || primary.title),
      uploaded:uploaded,
      uploadedBill:uploaded ? uploadedBill : 'Not uploaded',
      description:description,
      concernSummary:concernSummary,
      userDetail:userDetail,
      detailScore:detailScore,
      notes:notes,
      noteText:notes.join(' '),
      statusCopy:status,
      reviewBasis:'Review basis: ' + basis.join('; ') + '.',
      issueCount:dossierFindings.length,
      dossierFindings:dossierFindings,
      generatedLetterCount:generatedLetterCount,
      letterCount:letterPlan.count,
      letterCountLabel:String(letterPlan.count),
      letterSetLabel:String(letterPlan.count) + ' prepared letters for this case',
      letterPlanSummary:letterPlan.dashboardSummary,
      letterPlan:letterPlan
    };
  }

  function validBuyerTypedName(value){
    value = safeProperNoun(clean(value), '');
    if(!value) return '';
    if(/^(patient|account holder|your name|click to add your name|name not provided)$/i.test(value)) return '';
    return value;
  }

  function scopedBuyerNameKey(source){
    if(!source || typeof source !== 'object') return '';
    var ref = clean(source.accountRef || source.account_number || source.accountNumber || source.account || source.billing_reference || source.billingReference || source.extracted_account_number || source.referenceNumber || '');
    var provider = clean(source.provider || source.providerName || source.extracted_provider || '');
    var dos = clean(source.dateOfService || source.date_of_service || source.dos || source.extracted_date_of_service || source.serviceDate || '');
    if(!ref && !provider && !dos) return '';
    return editablePatientNameKey({accountRef:ref, provider:provider, dateOfService:dos});
  }

  function buyerTypedName(source){
    var values = [];
    var hasAccessCase = !!(window.__UPA_ACCESS_CASE__ && typeof window.__UPA_ACCESS_CASE__ === 'object');
    if(source && typeof source === 'object'){
      values.push(source.buyerName);
      if(source.intake && typeof source.intake === 'object') values.push(source.intake.buyerName);
    }
    if(hasAccessCase){
      values.push(window.__UPA_ACCESS_CASE__.buyerName);
      if(window.__UPA_ACCESS_CASE__.intake && typeof window.__UPA_ACCESS_CASE__.intake === 'object'){
        values.push(window.__UPA_ACCESS_CASE__.intake.buyerName);
      }
    }
    var nameKey = scopedBuyerNameKey(source);
    if(nameKey && !hasAccessCase){
      try{ values.push(sessionStorage.getItem(nameKey)); }catch(e){}
      try{ values.push(localStorage.getItem(nameKey)); }catch(e){}
    }
    if(!hasAccessCase && window.__UPA_BUYER_NAME__ !== undefined) values.push(window.__UPA_BUYER_NAME__);
    for(var i = 0; i < values.length; i += 1){
      var value = validBuyerTypedName(values[i]);
      if(value) return value;
    }
    return '';
  }

  function knownAccountRef(value){
    value = clean(value);
    if(!value) return '';
    var lower = value.toLowerCase();
    if(/^(in your case folder|on file|account on file|account number)$/.test(lower)) return '';
    if(lower.indexOf('account') === 0 && lower.indexOf('confirm') > -1) return '';
    return value;
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
    var confirmedText = c.amount.exact ? 'Confirms once your itemized bill is added' : 'Pending itemized bill';
    return [
      ['Patient: First Name Last Name', c.patientName],
      ['Your Name', c.patientName],
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
      ['3 Prepared', c.letterCount + ' prepared'],
      ['3 drafted', c.letterCount + ' drafted'],
      ['Three letters', c.letterCount + ' letters'],
      ['three letters', c.letterCount + ' letters'],
      ['Review Areas', c.issueCount + ' review areas'],
      ['2 Found', c.issueCount + ' found'],
      ['$17,589.00', 'Pending itemized bill'],
      ['$5,863.00', 'Pending itemized bill'],
      ['$11,726.00', 'Pending itemized bill'],
      ['$651.44', 'Pending itemized bill'],
      ['To confirm8.58', 'Pending itemized bill'],
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

  function cleanCustomerCopy(value){
    return String(value == null ? '' : value)
      .replace(/Federal\s+No\s+Surprises\s+Act\s+protections/gi, 'Federal surprise-billing protections')
      .replace(/No\s+Surprises\s+Act(?:,\s*Public\s+Law\s*\d+(?:-\d+)?(?:\s*\(\d{4}\))?|\s*\(\d{4}\))?/gi, 'federal surprise-billing protections')
      .replace(/Public\s+Law\s*\d+(?:-\d+)?(?:\s*\(\d{4}\))?/gi, 'federal billing protections')
      .replace(/CMS\s+Claims\s+Processing\s+Manual,\s*(?:Chapter|Ch\.)\s*1,?\s*(?:\u00c2?\u00a7)\s*80\.7/gi, 'published billing guidance')
      .replace(/CMS\s*(?:Chapter|Ch\.)\s*1\s*(?:\u00c2?\u00a7)\s*80\.7/gi, 'published billing guidance')
      .replace(/(?:CMS\s*)?(?:\u00c2?\u00a7)\s*80\.7/gi, 'published billing guidance')
      .replace(/Ch\.?\s*1\s*(?:\u00c2?\u00a7)\s*80\.7/gi, 'published billing guidance')
      .replace(/Fair\s+Debt\s+Collection\s+Practices\s+Act/gi, 'consumer collection protections')
      .replace(/Consult\s+a\s+licensed\s+attorney\s+for\s+legal\s+guidance\s+specific\s+to\s+your\s+situation\.?/gi, 'For situation-specific questions, consider contacting a qualified consumer support resource.')
      .replace(/Nothing in this packet constitutes legal counsel or a guarantee of outcome\.?/gi, 'This packet supports your own review and communication.')
      .replace(/We do not provide professional legal, medical, insurance, or financial services\./gi, 'This service provides educational billing review support.')
      .replace(/Not professional legal, medical, insurance, or financial services\./gi, 'Educational billing review support only.')
      .replace(/Not a legal service\.?/gi, 'Educational billing review support only.')
      .replace(/\blegal representation\b/gi, 'outside representation')
      .replace(/\blegal protections\b/gi, 'billing protections')
      .replace(/\blegal conclusion\b/gi, 'professional conclusion')
      .replace(/\blegal, medical, insurance, or financial conclusion\b/gi, 'professional conclusion')
      .replace(/Itemized\s+eob\s+bill/gi, 'Itemized EOB bill')
      .replace(/\u2014|&mdash;|&#8212;|&#x2014;/gi, ' | ')
      .replace(/\s+[-:]\s+/g, ' | ')
      .replace(/\s*(?:\u00c2?\u00a7)\s*/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function cleanCustomerTextNodes(root){
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
      var raw = textNode.nodeValue || '';
      var leading = /^\s/.test(raw);
      var trailing = /\s$/.test(raw);
      var cleaned = cleanCustomerCopy(raw);
      textNode.nodeValue = cleaned ? (leading ? ' ' : '') + cleaned + (trailing ? ' ' : '') : '';
    });
  }
  window.UPACleanCustomerCopy = cleanCustomerCopy;
  window.UPACleanCustomerTextNodes = cleanCustomerTextNodes;

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
      '.upa-case-note.print{margin:14px 36px;background:#F6F8FA;color:#4A6480;border-color:rgba(28,43,72,.10)}' +
      '.upa-intake-context{margin:12px 0;padding:12px 14px;border:1px solid rgba(28,43,72,.10);border-radius:8px;background:#F9FBFD;color:#4A6480;font-size:.72rem;line-height:1.62}' +
      '.upa-intake-context strong{color:#1C2B48}.upa-intake-context.dark{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.10);color:rgba(235,244,255,.64)}.upa-intake-context.dark strong{color:rgba(235,244,255,.94)}' +
      '.upa-phase3-panel{margin:14px;padding:16px;border:1px solid rgba(30,107,90,.18);border-radius:10px;background:#fff;box-shadow:0 8px 24px rgba(17,28,46,.06);color:#1C2B48}' +
      '.upa-phase3-panel.packet{margin:0 36px 18px;background:#F9FBFD;box-shadow:none}' +
      '.upa-phase3-panel.compact{margin-top:12px}' +
      '.upa-p3-eyebrow{font-size:.48rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#1E6B5A;margin-bottom:5px}' +
      '.upa-p3-heading{font-family:Georgia,serif;font-size:1.05rem;font-weight:800;color:#1C2B48;margin-bottom:8px}' +
      '.upa-p3-summary{font-size:.78rem;line-height:1.65;color:#3A5068;margin-bottom:12px}' +
      '.upa-p3-risk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;margin:10px 0 12px}' +
      '.upa-p3-risk{border:1px solid rgba(28,43,72,.08);border-left:4px solid #1E6B5A;border-radius:8px;padding:9px 10px;background:#FAFCFD}' +
      '.upa-p3-risk span{display:block;font-size:.48rem;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#1E6B5A;margin-bottom:3px}' +
      '.upa-p3-risk strong{display:block;font-size:.72rem;color:#1C2B48;margin-bottom:4px}' +
      '.upa-p3-risk em{display:block;font-style:normal;font-size:.66rem;line-height:1.5;color:#52677C}' +
      '.upa-p3-group{margin-top:10px}' +
      '.upa-p3-title{font-size:.58rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#6E8898;margin-bottom:5px}' +
      '.upa-p3-item{font-size:.72rem;line-height:1.55;color:#42546B;padding:6px 0;border-top:1px solid rgba(28,43,72,.06)}' +
      '.upa-p3-notice{font-size:.62rem;line-height:1.55;color:#7A8AA0;margin-top:10px;border-top:1px solid rgba(28,43,72,.08);padding-top:8px}' +
      '.upa-trigger-panel{margin:14px;padding:18px;border:1px solid rgba(29,158,117,.20);border-radius:12px;background:#fff;box-shadow:0 8px 24px rgba(17,28,46,.06);color:#1C2B48}' +
      '.upa-trigger-panel.packet{margin:0 36px 18px;background:#F9FBFD;box-shadow:none}' +
      '.upa-trigger-eyebrow{font-size:.48rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#1D9E75;margin-bottom:5px}' +
      '.upa-trigger-heading{font-family:Georgia,serif;font-size:1.05rem;font-weight:800;color:#1C2B48;margin-bottom:10px}' +
      '.upa-trigger-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px}' +
      '.upa-trigger-grid.packet{grid-template-columns:1fr}' +
      '.upa-trigger-group{padding:12px;border:1px solid rgba(28,43,72,.09);border-left:4px solid #1D9E75;border-radius:8px;background:#FAFCFB}' +
      '.upa-trigger-title{font-size:.72rem;font-weight:800;color:#1C2B48;margin-bottom:5px}' +
      '.upa-trigger-copy,.upa-trigger-group li{font-size:.66rem;line-height:1.55;color:#52677C}' +
      '.upa-trigger-group ul{margin:7px 0 0;padding-left:17px}' +
      '.upa-editable-patient-name{display:inline-block;min-width:7em;max-width:100%;border-radius:4px;cursor:text;outline:none;white-space:nowrap}' +
      '.upa-editable-patient-name:hover{background:rgba(29,158,117,.07);box-shadow:0 0 0 2px rgba(29,158,117,.10)}' +
      '.upa-editable-patient-name:focus{background:#fff;box-shadow:0 0 0 2px rgba(29,158,117,.30)}' +
      '.upa-editable-patient-name:empty:before{content:attr(data-placeholder);color:#6B7688;font-family:var(--sans,Arial,sans-serif);font-style:normal;font-weight:500;opacity:.82}' +
      '@media print{.upa-editable-patient-name{box-shadow:none!important;background:transparent!important}.upa-editable-patient-name:empty:before{content:""!important}}';
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

  function contextHTML(c){
    var parts = [
      '<strong>Intake used:</strong> ' + h(c.patientName),
      h(providerLabel(c)),
      h(c.billType),
      h(c.amount.reviewText),
      h(coverageLabel(c)),
      h(paymentLabel(c))
    ];
    if(hasKnown(c.dateOfService, 'On file')) parts.push('DOS ' + h(c.dateOfService));
    if(c.uploaded) parts.push('Uploaded bill: ' + h(c.uploadedBill));
    if(c.contactLine !== 'Contact details can be added before sending') parts.push('Contact: ' + h(c.contactLine));
    parts.push('Concerns: ' + h(c.concernSummary));
    if(c.userDetail) parts.push('Billing note: ' + h(c.userDetail));
    return parts.join(' | ');
  }

  function insertContextAfter(selector, c, className){
    var anchor = typeof selector === 'string' ? one(selector) : selector;
    if(!anchor || anchor.parentNode.querySelector('.upa-intake-context')) return;
    var wrap = document.createElement('div');
    wrap.className = 'upa-intake-context' + (className ? ' ' + className : '');
    wrap.innerHTML = contextHTML(c);
    anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
  }

  // Guidance hint: shown when intake is thin : not defensive, trust-building.
  // Explains WHY more detail = better results without implying the product is broken.
  function insertGuidanceHint(c){
    if(!one('.kpi-strip')) return;
    if(one('#upa-guidance-hint')) return; // one per page
    var meetsThreshold = c.detailScore >= 50 || c.uploaded;
    if(meetsThreshold) return; // enough detail : no hint needed
    var hint = document.createElement('div');
    hint.id = 'upa-guidance-hint';
    hint.className = 'upa-case-note';
    hint.style.cssText = 'margin:12px 0 4px;padding:11px 14px;border-radius:8px;border:1px solid rgba(240,165,0,.22);background:rgba(240,165,0,.05);color:#4A5060;font-size:.6875rem;line-height:1.65;display:flex;align-items:flex-start;gap:10px';
    hint.innerHTML = '<span style="font-size:1rem;flex-shrink:0;margin-top:1px">💡</span><span><strong style="color:#1C2B48">Your review is ready.</strong> The more detail you can add : a bill photo, EOB, exact charges, dates, or provider notes : the more specific your letters and findings become. Right now everything is tailored to what you shared. Adding your itemized bill unlocks the full line-item analysis.</span>';
    var kpi = one('.kpi-strip');
    if(kpi && kpi.parentNode) kpi.parentNode.insertBefore(hint, kpi.nextSibling);
  }

  function hasKnown(value, placeholder){
    value = clean(value);
    return !!value && value !== placeholder;
  }

  function providerLabel(c){
    return hasKnown(c.provider, 'Your provider') ? c.provider : 'the provider listed on your bill';
  }

  function serviceDateLabel(c){
    return hasKnown(c.dateOfService, 'On file') ? c.dateOfService : 'the date shown on your statement';
  }

  function coverageLabel(c){
    return hasKnown(c.coverage, 'Your coverage') ? c.coverage : 'the insurance you listed at intake';
  }

  function paymentLabel(c){
    return hasKnown(c.paymentStatus, 'Account on file') ? c.paymentStatus : 'where your account stands right now';
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
    if(hasKnown(c.dateOfService, 'On file')) parts.push(c.dateOfService);
    if(hasKnown(c.provider, 'Your provider')) parts.push(c.provider);
    if(issue.key === 'network' || issue.key === 'denied' || issue.key === 'payer-responsibility'){
      if(hasKnown(c.coverage, 'Your coverage')) parts.push(c.coverage);
    }
    if(c.uploaded) parts.push('your uploaded bill in this case');
    return parts.join(' · ') || 'Open case : your itemized bill will fill in the details';
  }

  function issueDesc(c, issue){
    var ctx = [];
    if(hasKnown(c.provider, 'Your provider')) ctx.push('Provider: ' + c.provider);
    if(hasKnown(c.dateOfService, 'On file')) ctx.push('DOS: ' + c.dateOfService);
    if(hasKnown(c.coverage, 'Your coverage')) ctx.push('Coverage: ' + c.coverage);
    ctx.push('Amount: ' + c.amount.reviewText);
    if(hasKnown(c.paymentStatus, 'Account on file')) ctx.push('Status: ' + c.paymentStatus);
    if(c.uploaded) ctx.push('Your uploaded bill in this case');
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
    setText('.fi-amount-lbl', c.amount.exact ? 'Amount you shared at intake' : 'Confirms with your itemized bill', card);
    setText('.fi-res', idx === 0 ? 'Press on this first' : (idx === 1 ? 'Next up' : 'Also worth a look'), card);
    var meta = all('.fc-meta-item', card);
    if(meta[0]) setIconText(meta[0], serviceDateLabel(c));
    if(meta[1]) setIconText(meta[1], c.uploaded ? 'Using your uploaded bill: ' + c.uploadedBill : 'Add your itemized bill to unlock specifics');
    if(meta[2]) setIconText(meta[2], 'Letter ' + (idx + 1) + ' drafted for you');
    var ev = all('.ev-item-val', card);
    if(ev[0]) ev[0].textContent = issue.type;
    if(ev[1]) ev[1].textContent = c.uploaded ? 'Uploaded bill' : 'Need itemized bill';
    if(ev[2]) ev[2].textContent = issue.amountText;
    if(ev[3]) ev[3].textContent = issue.confidence;
  }

  function applyPreview(c){
    if(!one('.results-hero')) return;
    insertNoteAfter('.results-hero', c, 'dark');
    insertContextAfter('.results-hero', c, 'dark');
    setText('.nav-badge', 'Review Complete - ' + c.patientName);
    setHTML('.rh-title', 'Your review areas are prepared.<br><span>' + h(c.amount.reviewText) + ' needs review.</span>');
    var rhParts = [c.primaryInline];
    if(hasKnown(c.coverage, 'Your coverage')) rhParts.push(c.coverage);
    if(hasKnown(c.paymentStatus, 'Account on file')) rhParts.push('payment status "' + c.paymentStatus + '"');
    setText('.rh-sub', 'Your ' + c.billType + ' from ' + providerLabel(c) + ' was organized around the intake details you provided: ' + rhParts.join(', ') + '. ' + c.reviewBasis);
    setText('.pm-val.green', c.amount.reviewText);
    setAllText('.pm-label', ['Bill amount provided','Review areas from intake','Case letters being prepared']);
    setText('.pm-val.crim', String(c.issueCount));
    setText('.pm-val.gold', c.letterCountLabel);
    setAllText('.pm-badge', ['Needs confirmation','Case-specific','Ready to send']);
    all('.finding-card').slice(0,3).forEach(function(card, idx){ applyIssueCard(card, c.issues[idx], c, idx); });

    setText('.dt-topbar-name', 'United Patient Advocate - Active Case: ' + c.provider);
    setText('.dt-pill', 'Account: ' + c.accountRef);
    setText('.dt-h1', 'Here\'s what we\'re looking at for ' + providerLabel(c) + '.');
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
    setHTML('.lt-body-vis', 'Dear Billing Department,<br><br>I am requesting a detailed, itemized review of the billing statement for services on <strong>' + h(c.dateOfService) + '</strong> at ' + h(c.provider) + '. My intake identifies <span class="lt-highlight">' + h(c.concernSummary) + '</span>.' + (c.userDetail ? ' Additional billing context: ' + h(c.userDetail) : '') + ' Please provide the itemized statement, codes, units, adjustments, and any records needed to confirm the patient responsibility.');
    setHTML('.lt-unlock-txt', '<strong>Your full letter set is being prepared:</strong> ' + h(c.letterSetLabel) + ', with more added when the bill complexity requires it.<br>Each letter uses the patient, provider, amount, coverage, and issue details from this intake.');

    setText('.ub-title', c.statusCopy.title);
    setText('.ub-sub', c.statusCopy.sub);
    setText('.cta-title', 'Everything needed to question this bill is organized for ' + c.patientName + '.');
    var ctaParts = [];
    if(hasKnown(c.provider, 'Your provider')) ctaParts.push(c.provider);
    if(hasKnown(c.dateOfService, 'On file')) ctaParts.push(c.dateOfService);
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

  function issueAt(c, idx){
    return c.issues[idx] || c.issues[0] || c.primary || {title:'Billing documentation review', short:'billing review', type:'Billing review', amountText:'To confirm', action:'Request written documentation before accepting the balance.'};
  }

  function hydrateFinancials(c){
    if(!one('#tab-financials')) return;
    var amountNote = c.amount.exact ? 'Amount entered at intake' : 'Amount from intake or awaiting exact bill';
    setText('.fc-sub', providerLabel(c) + ' - ' + c.amount.reviewText + ' - ' + coverageLabel(c) + ' - ' + serviceDateLabel(c));
    setText('.fc-badge-g', c.uploaded ? 'Detailed review - uploaded bill on file' : 'Preliminary review - itemized bill needed');
    var fvRows = all('.fv-row');
    var fvData = [
      ['Total Billed', 'All charges from intake', c.amount.display, 'Total', c.amount.display + ' - 100%'],
      ['Review Baseline', coverageLabel(c), c.amount.exact ? 'Reconcile with EOB' : 'Awaiting EOB', 'Baseline', 'Compare to EOB'],
      [issueAt(c,0).type, issueAt(c,0).short, issueAt(c,0).amountText, 'Review', issueAt(c,0).amountText],
      [issueAt(c,1).type, issueAt(c,1).short, issueAt(c,1).amountText, 'Review', issueAt(c,1).amountText],
      [issueAt(c,2).type, issueAt(c,2).short, issueAt(c,2).amountText, 'Review', issueAt(c,2).amountText]
    ];
    fvRows.forEach(function(row, idx){
      var d = fvData[idx] || fvData[fvData.length - 1];
      setText('.fvrl-name', d[0], row);
      setText('.fvrl-code', d[1], row);
      setText('.fvra-val', d[2], row);
      setText('.fvra-lbl', d[3], row);
      setText('.fv-fill-label', d[4], row);
    });
    var fvs = all('.fvs-item');
    if(fvs[0]){ setText('.fvs-val', c.amount.display, fvs[0]); setText('.fvs-sub', amountNote, fvs[0]); }
    if(fvs[1]){ setText('.fvs-val', c.uploaded ? 'Uploaded bill' : 'Needs itemized bill', fvs[1]); setText('.fvs-sub', c.uploaded ? c.uploadedBill : 'Request first', fvs[1]); }
    if(fvs[2]){ setText('.fvs-val', c.amount.reviewText, fvs[2]); setText('.fvs-sub', c.issueCount + ' review areas', fvs[2]); }
    if(fvs[3]){
      setText('.fvs-label', 'Packet Status', fvs[3]);
      setText('.fvs-val', c.generatedLetterCount ? c.generatedLetterCount + ' letters' : 'From your review', fvs[3]);
      setText('.fvs-sub', c.generatedLetterCount ? 'Generated from this case review' : 'Letters appear when generated from your review', fvs[3]);
    }

    all('.intel-card').slice(0,2).forEach(function(card, idx){
      var issue = issueAt(c, idx);
      setText('.ic-lbl', issue.type, card);
      var labels = all('.ic-row-lbl', card);
      var values = all('.ic-row-val', card);
      if(labels[0]) labels[0].textContent = 'Review area';
      if(values[0]) values[0].textContent = issue.short;
      if(labels[1]) labels[1].textContent = 'Case basis';
      if(values[1]) values[1].textContent = c.uploaded ? 'Uploaded bill' : 'Itemized bill needed';
      if(labels[2]) labels[2].textContent = 'Amount status';
      if(values[2]) values[2].textContent = issue.amountText;
      if(labels[3]) labels[3].textContent = 'Provider / payer';
      if(values[3]) values[3].textContent = idx === 0 ? providerLabel(c) : coverageLabel(c);
      if(labels[4]) labels[4].textContent = 'Review posture';
      if(values[4]) values[4].textContent = issue.action ? 'Needs written response' : 'Needs review';
    });

    var finRows = all('.fin-table tbody tr');
    var finBody = one('.fin-table tbody');
    var finVm = clfsViewModel(readDossierState());
    if(finRows.length && !finVm.totalCount){
      finRows.forEach(function(row, idx){
        row.style.display = idx === 0 ? '' : 'none';
        if(idx !== 0) return;
        var cells = row.children || [];
        if(cells[0]) cells[0].innerHTML = '<span class="ft-code">On standby</span>';
        if(cells[1]) cells[1].innerHTML = '<div class="ft-strong">Itemized procedure codes not added yet</div><div class="ft-sub">Your itemized procedure codes and Medicare comparisons appear here once you add your itemized bill.</div>';
        if(cells[2]) cells[2].textContent = '';
        if(cells[3]) cells[3].innerHTML = '';
        if(cells[4]) cells[4].innerHTML = '<span class="ft-badge ftb-review">On standby</span>';
        if(cells[5]) cells[5].textContent = '';
      });
    }else if(finRows.length){
      while(finBody && finRows.length < finVm.lines.length){
        var clone = finRows[0].cloneNode(true);
        finBody.appendChild(clone);
        finRows.push(clone);
      }
      finRows.forEach(function(row, idx){
        var line = finVm.lines[idx];
        if(!line){
          row.style.display = 'none';
          return;
        }
        row.style.display = '';
        setText('.ft-code', line.code || 'Line item', row);
        setText('.ft-strong', line.shortDescription || 'Line item', row);
        setText('.ft-sub', line.benchmarkAvailable ? (line.source || 'CMS CLFS 2026') : (line.reason || 'Benchmark unavailable'), row);
        var cells = row.children || [];
        if(cells[2]) cells[2].textContent = line.benchmarkAvailable ? formatMoneyFull(line.benchmarkRate) : 'Unavailable';
        var amt = row.querySelector('.ft-amount');
        if(amt) amt.textContent = line.billedAmount != null ? formatMoneyFull(line.billedAmount) : 'Amount not detected';
        var badge = row.querySelector('.ft-badge');
        if(badge) badge.textContent = line.benchmarkAvailable ? 'CMS match' : 'Review';
        if(cells[5]) cells[5].textContent = line.benchmarkAvailable && line.percentAboveBenchmark != null ? (line.percentAboveBenchmark + '% above') : (line.reason || 'Review');
      });
    }
    setText('.ftr-label', 'Amount Needs Review');
    setText('.ftr-ctx', c.issueCount
      ? c.issueCount + ' review area' + (c.issueCount === 1 ? '' : 's') + (c.generatedLetterCount ? ' - ' + c.generatedLetterCount + ' generated document' + (c.generatedLetterCount === 1 ? '' : 's') : '')
      : 'Findings and documents appear from your review');
    setText('.ftr-amt', c.amount.reviewText);
  }

  function hydrateDocuments(c){
    if(!one('#tab-documents')) return;
    setAllText('.sbp-num', function(el, idx){
      if(idx === 0) return String(c.issueCount);
      if(idx === 1) return String(Math.max(3, c.issueCount));
      if(idx === 2) return String(Math.max(4, c.letterCount));
      return el.textContent;
    });
    setAllText('.tab-pip', function(el, idx){
      if(idx === 0) return c.amount.reviewText;
      if(idx === 1) return c.issueCount ? c.issueCount + ' areas' : 'Pending';
      if(idx === 2) return c.generatedLetterCount ? c.generatedLetterCount + ' ready' : 'From review';
      return el.textContent;
    });
    setAllText('.mtn-item-pip', function(el, idx){
      if(idx === 0) return c.amount.reviewText;
      if(idx === 1) return c.issueCount ? c.issueCount + ' areas' : 'Pending';
      if(idx === 2) return c.generatedLetterCount ? c.generatedLetterCount + ' letters' : 'From review';
      return el.textContent;
    });
    var dsb = all('.dsb-node');
    if(dsb[0]){ setText('.dsb-name', 'Request itemized bill', dsb[0]); setText('.dsb-sub', 'Letter drafted for ' + providerLabel(c), dsb[0]); }
    if(dsb[1]){ setText('.dsb-name', 'Review ' + issueAt(c,0).short, dsb[1]); setText('.dsb-sub', 'Primary review area', dsb[1]); }
    if(dsb[2]){ setText('.dsb-name', 'Clarify EOB / coverage', dsb[2]); setText('.dsb-sub', 'Next supporting request', dsb[2]); }
    setText('.dph-title', 'Your Letter Packet');
    setText('.dph-sub', c.generatedLetterCount
      ? c.generatedLetterCount + ' letters generated from ' + providerLabel(c) + ', ' + c.amount.reviewText + ', ' + coverageLabel(c) + ', and this case review.'
      : 'Case-specific letters appear when they are generated from your review.');
    setText('.dph-badge', c.generatedLetterCount ? c.generatedLetterCount + ' drafts ready' : 'From your review');
    all('.doc-preview-card').slice(0,3).forEach(function(card, idx){
      var issue = issueAt(c, idx);
      var titles = [
        'Request for fully itemized statement',
        'Billing review request - ' + issueAt(c,0).short,
        'Insurance, EOB, and rate clarification request'
      ];
      var types = [
        'Line-by-line itemization request for ' + providerLabel(c),
        issueAt(c,0).type + ' for this case',
        coverageLabel(c) + ' responsibility review'
      ];
      setText('.dpc-title', titles[idx], card);
      setText('.dpc-type', types[idx], card);
      setText('.dpc-prepared', c.patientName ? 'Prepared for ' + c.patientName + ' - ' + c.accountRef : 'Prepared for your case - ' + c.accountRef);
      setText('.dpc-step', 'Step ' + (idx + 1), card);
      setText('.dpc-ready', idx < c.letterCount ? 'READY' : 'OPTIONAL', card);
      setText('.mini-org', c.patientName, card);
      setText('.mini-org-sub', c.patientLabel, card);
      setText('.mini-sig-name', c.patientName, card);
      setText('.mini-sig-sub', (c.lastName || c.patientName) + ' / ' + c.coverage, card);
      // Fix mini-re RE: line : replace placeholder name and account with real values
      var reEl = card.querySelector('.mini-re');
      if(reEl){
        reEl.innerHTML = reEl.innerHTML
          .replace(/Patient: First Name Last Name/g, c.patientName)
          .replace(/First Name Last Name/g, c.patientName)
          .replace(/Account: account number/g, 'Account: ' + (c.accountRef || ''))
          .replace(/account number/g, c.accountRef || '');
      }
    });
    setText('.doc-footer-note', c.letterCount + ' letters prepared for this case. Each uses ' + c.patientName + ', provider, amount, coverage, and intake details.');
  }

  function hydrateTimeline(c){
    if(!one('#tab-timeline')) return;
    var rows = all('.tl-item');
    var timeline = [
      [c.openedShort, 'Today', 'Initial review complete', 'The restored intake for ' + providerLabel(c) + ' was organized around ' + c.issueCount + ' review areas and ' + c.letterCount + ' prepared letters.', 'Done'],
      [c.openedShort, 'Today', 'Send your itemized statement request', 'Send Letter 1 to ' + providerLabel(c) + '. Keep a copy and ask for a written response tied to account ' + c.accountRef + '.', 'When ready'],
      [c.deadline30, '+30 days', 'Follow up if you have not heard back', 'Follow up in writing around the 30-day mark. Ask for status, a reference number, and the expected response date.', 'Soft deadline'],
      [c.deadline30, '+30 days', 'Send review letters when documentation arrives', 'Use the prepared review letters for ' + issueAt(c,0).short + ' and EOB, coverage, or rate clarification once the itemized bill is available.', 'Next step'],
      [c.deadline60, '+60 days', 'Escalate if no written response arrives', 'If there is still no written answer, use the escalation guide with copies of your letters, account details, and proof of delivery.', 'Escalate if needed']
    ];
    rows.forEach(function(row, idx){
      var d = timeline[idx] || timeline[timeline.length - 1];
      setText('.tl-date-main', d[0], row);
      setText('.tl-date-sub', d[1], row);
      setText('.tl-ev-title', d[2], row);
      setText('.tl-ev-desc', d[3], row);
      setText('.tl-ev-tag', d[4], row);
    });
  }

  function syncMobileDashboardCase(c){
    if(!one('#mobile-tab-nav') && !one('#nav-case-text') && !one('#sb-provider') && !one('#db-meta-provider')) return;
    var providerKnown = hasKnown(c.provider, 'Your provider');
    var providerText = providerKnown ? c.provider : 'Provider details needed';
    var caseName = providerKnown ? 'Your case - ' + c.provider : 'Your case - provider details needed';
    var coverageText = hasKnown(c.coverage, 'Your coverage') ? c.coverage : 'Insurance you listed at intake';
    setText('#nav-case-text', providerKnown ? 'Your case \u00b7 ' + c.provider : 'Your case \u00b7 awaiting provider details');
    setText('#nav-case-ref', 'Account: ' + c.accountRef + ' | Opened ' + c.prepDate);
    if(!window.__upaNameEditing) setText('#sb-patient-name', c.patientName);
    setText('#sb-provider', providerText);
    setText('#sb-sub', c.billType + ' - ' + c.dateShort);
    setText('#sb-bill-amount', c.amount.display);
    setText('#sb-review-amount', c.amount.reviewText);
    setText('#sb-coverage', coverageText);
    setText('#db-case-name', caseName);
    setText('#db-case-ref', c.accountRef);
    setText('#db-meta-provider', providerText);
    setText('#db-meta-dos', c.dateOfService);
    setText('#db-meta-coverage', coverageText);
    setText('#db-meta-amount', c.amount.display);
    setText('#kpi-flagged-amount', c.amount.reviewText);
    setText('#kpi-review-areas', c.issueCount ? c.issueCount + (c.issueCount === 1 ? ' area' : ' areas') : 'Pending your bill');
    setText('#kpi-letters', c.generatedLetterCount ? c.generatedLetterCount + ' prepared' : 'From your review');
    setText('#tab-pip-financial', c.amount.reviewText);
    setText('#tab-pip-findings', c.issueCount ? c.issueCount + ' areas' : 'Pending');
    setAllText('.mtn-item-pip', function(el, idx){
      if(idx === 0) return c.amount.reviewText;
      if(idx === 1) return c.issueCount ? c.issueCount + ' areas' : 'Pending';
      if(idx === 2) return c.generatedLetterCount ? c.generatedLetterCount + ' letters' : 'From review';
      return el.textContent;
    });
    syncDashboardCaseSummary(c);
  }

  function findingSummaryTitle(finding){
    finding = finding || {};
    return clean(finding.headline) || titleFromText(finding.detail, 54) || 'From your review';
  }

  function syncDashboardCaseSummary(c){
    var findings = Array.isArray(c.dossierFindings) ? c.dossierFindings : currentDossierFindings();
    var findingCount = findings.length;
    var letterCount = c.generatedLetterCount || currentDossierLetterCount();
    var findingCountText = findingCount ? String(findingCount) : 'Pending your bill';
    var letterCountText = letterCount ? letterCount + ' drafted' : 'From your review';
    var clearest = findingCount ? findingSummaryTitle(findings[0]) : 'From your review';

    setText('#kpi-review-areas', findingCount ? findingCount + (findingCount === 1 ? ' area' : ' areas') : 'Pending your bill');
    setText('#kpi-letters', letterCount ? letterCount + ' prepared' : 'From your review');
    setText('#kpi-areas-ctx', findingCount
      ? findings.slice(0,3).map(findingSummaryTitle).join(', ')
      : 'Findings appear after your bill is reviewed');
    setText('#rpc-bill-reviewed', c.amount && !c.amount.unknown ? c.amount.display : 'Pending your bill');
    setText('#rpc-question-count', findingCountText);
    setText('#rpc-letter-count', letterCountText);
    setText('#rps-review-amount', findingCount ? findingCount + (findingCount === 1 ? ' review area' : ' review areas') : 'From your review');
    setText('#rps-clearest-area', clearest);

    var flags = all('.rp-flag');
    if(!findingCount){
      if(flags[0]){
        flags[0].style.display = '';
        setText('.rp-flag-title', 'Findings appear after your bill is reviewed', flags[0]);
        setText('.rp-flag-sub', 'No specific billing issue is shown until it is supported by this case.', flags[0]);
      }
      flags.slice(1).forEach(function(flag){ flag.style.display = 'none'; });
      return;
    }
    flags.forEach(function(flag, idx){
      var finding = findings[idx];
      flag.style.display = finding ? '' : 'none';
      if(!finding) return;
      setText('.rp-flag-title', findingSummaryTitle(finding), flag);
      setText('.rp-flag-sub', clean(finding.detail) || clean(finding.lineItem) || 'From your review', flag);
    });
  }

  function applyDashboard(c){
    if(!one('.case-header') && !one('#mobile-tab-nav') && !one('.sidebar')) return;
    insertNoteAfter('.kpi-strip', c, '');
    insertContextAfter('.kpi-strip', c, '');
    insertGuidanceHint(c);
    setText('.ncp-text', hasKnown(c.provider, 'Your provider') ? 'Your case · ' + c.provider : 'Your case · awaiting provider details');
    setText('.nav-ref', 'Account: ' + c.accountRef + ' | Opened ' + c.prepDate);
    setText('#sb-patient-name', c.patientName);
    setText('#db-case-name', hasKnown(c.provider, 'Your provider') ? 'Your case - ' + c.provider : 'Your case - provider details needed');
    setText('.sb-hospital', c.provider);
    setText('.sb-sub', c.billType + ' - ' + c.dateShort);
    setAllText('.sb-kpi-val', [c.amount.display, c.amount.reviewText]);
    setAllText('.sb-kpi-sub', [hasKnown(c.coverage, 'Your coverage') ? c.coverage : 'Insurance you listed at intake', c.uploaded ? 'Your itemized bill is in this case' : 'Add your itemized bill to unlock the full review']);
    setText('.sb-readiness-text', 'Your review tools are ready to use');

    setText('.ch-ref', c.accountRef);

    /* ── Scan-aware copy variants ── */
    var isScan = !!(c.raw && c.raw._scan);
    if(isScan){
      var scanProv = hasKnown(c.provider, 'Your provider') ? c.provider : 'your bill';
      setText('.ch-headline', 'Here\'s what stood out in your ' + scanProv + ' bill.');
      setText('.ch-subline', 'These review areas are based on values read from your uploaded document. Confirm anything that looks off before sending requests.');
      var denialPrefix = (c.raw && c.raw._denial) ? '<strong style="color:var(--crimson)">Claim denial language may be present.</strong> ' : '';
      var confNote = (c.raw && c.raw._confidence === 'high') ? ' Provider, amount, and service date were all read from the PDF.' : '';
      setHTML('.ch-deck', denialPrefix + 'Your uploaded <u>' + h(c.billType) + '</u> was scanned and <strong>' + h(c.concernSummary) + '</strong> was prepared as a review area.' + confNote + (c.userDetail ? '<br>Additional context: ' + h(c.userDetail) : '') + '<br>' + h(c.reviewBasis));
    } else {
      setText('.ch-headline', 'Here\'s what we\'re looking at for ' + providerLabel(c) + '.');
      setText('.ch-subline', 'Your review is tailored to the case details provided.');
      var deckCov = hasKnown(c.coverage, 'Your coverage') ? ', coverage listed as ' + h(c.coverage) : '';
      var deckPay = hasKnown(c.paymentStatus, 'Account on file') ? ', and payment status "' + h(c.paymentStatus) + '"' : '';
      setHTML('.ch-deck', 'This dashboard organizes the <u>' + h(c.billType) + '</u> around the concerns you selected: <strong>' + h(c.concernSummary) + '</strong>' + deckCov + deckPay + '.' + (c.userDetail ? '<br>Additional billing context: ' + h(c.userDetail) : '') + '<br>' + h(c.reviewBasis));
    }
    var pills = all('.ch-pill.dark-pill');
    if(pills[0]) setIconText(pills[0], c.patientName ? 'Prepared for ' + c.patientName : 'Prepared for your case');
    if(pills[1]) setIconText(pills[1], 'Prepared: ' + c.prepDate);
    // FIX 2: replace billing jargon with plain English the patient can act on.
    setText('.ch-pill.amber-pill', c.uploaded ? 'Review ready · Your bill is in this case' : 'Action needed · Request your itemized bill');
    setAllText('.ch-meta-val', [c.provider, c.dateOfService, c.coverage, c.amount.display]);

    setAllText('.kpi-val', [c.amount.reviewText, c.issueCount ? c.issueCount + (c.issueCount === 1 ? ' area' : ' areas') : 'Pending your bill', c.generatedLetterCount ? c.generatedLetterCount + ' prepared' : 'From your review']);
    setAllText('.kpi-label', ['Amount needing confirmation','Review areas requiring action','Case letters prepared']);
    setAllText('.kpi-ctx', [
      c.amount.exact ? 'Exact amount entered by the user' : 'Based on the amount range or missing amount provided',
      c.issues.map(function(i){return i.short;}).join(', '),
      c.generatedLetterCount ? c.generatedLetterCount + ' case-specific letter' + (c.generatedLetterCount === 1 ? '' : 's') + ' generated from this review.' : 'Letters appear when generated from your review.'
    ]);

    var cardTexts = all('.card-text');
    if(cardTexts[0]){
      var ctCov = hasKnown(c.coverage, 'Your coverage') ? ', coverage listed as <strong>' + h(c.coverage) + '</strong>' : '';
      var ctPay = hasKnown(c.paymentStatus, 'Account on file') ? ', and payment status <strong>' + h(c.paymentStatus) + '</strong>' : '';
      cardTexts[0].innerHTML = 'Your case centers on <strong>' + h(c.concernSummary) + '</strong> for a ' + h(c.billType) + ' from ' + h(providerLabel(c)) + '. The current amount is <strong>' + h(c.amount.reviewText) + '</strong>' + ctCov + ctPay + '.' + (c.userDetail ? ' Additional billing context: <strong>' + h(c.userDetail) + '</strong>.' : '') + ' This review does not mark charges as errors until the itemized bill, EOB, and provider records support that conclusion.';
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
    setAllText('.bench-bar-val', ['Pending itemized bill','Benchmark unlocks once you upload your itemized bill with codes','Pending itemized bill','Benchmark unlocks once you upload your itemized bill with codes']);
    setText('.nb-title', c.uploaded ? 'Use your uploaded bill to press for line-item answers' : 'Ask the provider for a fully itemized statement before you pay');
    setText('.nb-desc', c.uploaded ? 'We’ll work from your uploaded bill alongside the drafted letters to push for written explanations, EOB reconciliation, and corrections wherever the records support it.' : 'Your intake didn’t include a complete itemized bill yet. Letter 1 is drafted to ask the provider for the codes, units, charges, adjustments, and records we need to make the rest of the review specific.');

    all('#tab-findings .finding-card').slice(0,3).forEach(function(card, idx){ applyIssueCard(card, c.issues[idx], c, idx); });
    var actionTitles = ['Ask for a fully itemized statement', 'Press on the ' + c.issues[0].short + ' question', 'Clarify coverage, EOB, or rates', 'Follow up : and escalate if no written reply'];
    var actionDescs = [
      'Send Letter 1 to ' + providerLabel(c) + ' asking for the full line-by-line statement, codes, units, adjustments, and payer responsibility for the concerns you entered: ' + c.concernSummary + '. About five minutes of your time.',
      'Once your itemized statement arrives, use Letter 2 to ask billing to answer this question directly: ' + c.issues[0].title + '.',
      'Use Letter 3 to sort out coverage, EOB, network status, payer adjustments, and any rate question tied to ' + c.coverage + '. ' + (c.contactLine === 'Contact details can be added before sending' ? c.contactLine + '.' : 'Your contact on file for the packet is ' + c.contactLine + '.'),
      'If there is no written reply within 30 days, follow up with billing, then escalate with copies of your letters and proof of delivery.'
    ];
    var providerHint = c.provider === 'Your provider' ? 'the provider' : c.provider;
    var coverageHint = c.coverage === 'Your coverage' ? 'insurance or payer' : c.coverage;
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
    setText('.rpc-sub', c.amount.exact ? 'From the amount you shared at intake' : 'Confirms with your itemized bill');
    setAllText('.rpc-row-val', [c.amount.unknown ? 'Pending your bill' : c.amount.display, c.issueCount ? String(c.issueCount) : 'Pending your bill', c.generatedLetterCount ? c.generatedLetterCount + ' drafted' : 'From your review']);
    var rpsPayment = c.paymentStatus || 'Review timing depends on your situation';
    setAllText('.rps-row-val', [c.issueCount ? c.issueCount + (c.issueCount === 1 ? ' review area' : ' review areas') : 'From your review', c.dossierFindings.length ? findingSummaryTitle(c.dossierFindings[0]) : 'From your review', rpsPayment, c.uploaded ? 'Working from your uploaded bill' : 'Ask for an itemized statement first']);
    setText('.rp-readiness-text', 'Your review tools are ready to use');
    all('.rp-flag').slice(0,3).forEach(function(flag, idx){
      setText('.rp-flag-title', c.issues[idx].title, flag);
      setText('.rp-flag-sub', c.issues[idx].action, flag);
    });
    setText('.rp-next-title', c.statusCopy.title);
    setText('.rp-next-desc', c.statusCopy.sub);
    setText('.btn-rp-cta', c.uploaded ? 'Use My Review Packet' : 'Request Itemized Bill');

    hydrateFinancials(c);
    hydrateDocuments(c);
    hydrateTimeline(c);
    injectExtraLetterCards(c);
    renderPhase3CaseGeneration(null, c);
    syncQuickCalc(c);
    syncMobileDashboardCase(c);
    window.setTimeout(function(){
      setText('.rp-readiness-text', 'Your review tools are ready to use');
      syncQuickCalc(c);
      syncMobileDashboardCase(c);
    },1400);
  }

  function applyLetterBodies(c){
    var bodies = all('.lbody');
    var headers = all('.lhd');
    var packetBuyerName = buyerTypedName(c);
    var packetAccountRef = knownAccountRef(c.accountRef);
    var accountLabel = packetAccountRef ? 'Account: ' + packetAccountRef : '';
    var accountPhrase = packetAccountRef ? ', account reference ' + h(packetAccountRef) : '';
    headers.forEach(function(header){
      setText('.lhd-name', packetBuyerName, header);
      setText('.lhd-sub', c.patientLabel, header);
      // Only render contact lines that actually have content. A formal letter
      // showing "email not provided / phone not provided" reads as broken.
      var addrEmail = clean(c.raw.email, '');
      var addrPhone = clean(c.raw.phone, '');
      var addrLines = [];
      if (addrEmail) addrLines.push(h(addrEmail));
      if (addrPhone) addrLines.push(h(addrPhone));
      var addressField = one('.lhd-addr', header);
      if(addressField){
        addressField.classList.toggle('upa-edit-hint-only', !addrLines.length);
        addressField.innerHTML = addrLines.length ? addrLines.join('<br>') : '<em style="opacity:.4;font-style:italic;font-size:.9em">Add your contact info before sending</em>';
      }
      setText('.lhd-date', c.prepDate, header);
      setText('.lhd-acct', accountLabel, header);
    });
    setAllText('.lbs-name', packetBuyerName);
    var sigName = packetBuyerName;
    setAllText('.lbs-sub', [sigName ? sigName + ' / ' + c.coverage : c.coverage, packetAccountRef].filter(Boolean).join(' - '));
    setAllText('.ltb-title', [
      'Request for fully itemized statement - send this first',
      'Billing review request - ' + c.issues[0].short,
      'Insurance, EOB, and rate clarification request'
    ]);
    if(bodies[0]){
      setHTML('.lb-to-addr', h(c.provider) + ' - Billing & Accounts<br>Billing address : see statement', bodies[0]);
      setText('.lb-re-txt', 'Request for Fully Itemized Statement' + (packetAccountRef ? ' - ' + packetAccountRef : '') + ' - Date of Service: ' + c.dateOfService, bodies[0]);
      setHTML('.lb-para', 'I am writing to request a complete, fully itemized statement for medical services rendered on <strong>' + h(c.dateOfService) + '</strong>' + accountPhrase + ', at ' + h(c.provider) + '. My current intake lists total charges as <strong>' + h(c.amount.display) + '</strong>, coverage as <strong>' + h(c.coverage) + '</strong>, payment timing as <strong>' + h(c.paymentStatus) + '</strong>, and concerns including <strong>' + h(c.concernSummary) + '</strong>.' + (c.userDetail ? ' Additional billing context: ' + h(c.userDetail) : '') + ' I am reviewing this statement before accepting the patient responsibility.', bodies[0]);
      setText('.lb-hl', 'Please provide every line item, CPT/HCPCS code, revenue code, units, dates of service, provider adjustments, insurer payments or denials, and the patient-responsibility amount for each individual item.', bodies[0]);
      setText('.lb-sm', 'This request is made so I can reconcile the statement against my EOB, coverage, and records. Please pause collection activity on any disputed portion while this written review is pending and provide a reference number for this request.', bodies[0]);
    }
    if(bodies[1]){
      var issue = c.issues[0];
      setHTML('.lb-to-addr', h(c.provider) + ' - Billing Review Department<br>Billing address : see statement', bodies[1]);
      setText('.lb-re-txt', 'Billing Review Request - ' + issue.title + ' - DOS: ' + c.dateOfService + ' - Amount Under Review: ' + issue.amountText, bodies[1]);
      setHTML('.lb-para', 'I am requesting a formal written review of my statement' + accountPhrase + '. Based on my intake and the documents available to me, my concerns include: <strong>' + h(c.concernSummary) + '</strong>. The primary review point is <strong>' + h(issue.title) + '</strong>.' + (c.userDetail ? ' Additional billing context: ' + h(c.userDetail) : '') + ' This review relates to services at ' + h(c.provider) + ' on ' + h(c.dateOfService) + ' with current amount listed as ' + h(c.amount.display) + '.', bodies[1]);
      setText('.lb-hl', 'I am requesting a written explanation and correction if your review confirms a duplicate entry.', bodies[1]);
      var cite = one('.lb-cite', bodies[1]);
      if(cite) cite.remove();
      setText('.lb-sm', 'Please respond in writing within 30 days with the records, code details, EOB reconciliation, or corrected billing statement that supports your determination. Please pause collection activity on the reviewed amount while this request is pending.', bodies[1]);
    }
    if(bodies[2]){
      var issue3 = c.issues[2];
      setHTML('.lb-to-addr', 'Billing Department - ' + h(c.provider) + '<br>Insurance / payer review contact if available', bodies[2]);
      setText('.lb-re-txt', 'Insurance / EOB / Rate Clarification - ' + issue3.title + (packetAccountRef ? ' - Account: ' + packetAccountRef : ''), bodies[2]);
      setHTML('.lb-para', 'I am writing to request written clarification of the insurance, EOB, network, and rate handling for my <strong>' + h(c.dateOfService) + ' ' + h(c.billType) + '</strong> at ' + h(c.provider) + '. My coverage is listed as <strong>' + h(c.coverage) + '</strong>, payment timing is <strong>' + h(c.paymentStatus) + '</strong>, and my intake concerns include <strong>' + h(c.concernSummary) + '</strong>. The patient balance requires confirmation before I accept responsibility.', bodies[2]);
      setText('.lb-hl', issue3.action + ' Please identify any payer denial codes, allowed amounts, adjustments, network status, consent documentation if relevant, and appeal or corrected-claim options.', bodies[2]);
      setText('.lb-sm', 'Please respond in writing with the EOB basis, payer responsibility, provider adjustment history, and the current patient-responsibility calculation. If the balance changes, please issue a corrected statement and refund or payment-plan adjustment instructions if applicable.', bodies[2]);
    }
    setAllText('.lfoot .lf-m', [
      ['Core letter 1', packetAccountRef, 'DOS: ' + c.dateOfService, 'Prepared ' + c.prepDate].filter(Boolean).join(' - '),
      ['Core letter 2', packetAccountRef, c.issues[0].short, 'Prepared ' + c.prepDate].filter(Boolean).join(' - '),
      ['Core letter 3', packetAccountRef, 'EOB/rate clarification', 'Prepared ' + c.prepDate].filter(Boolean).join(' - ')
    ]);
  }

  function editablePatientNameKey(c){
    var scope = [
      c && c.accountRef || '',
      c && c.provider || '',
      c && c.dateOfService || ''
    ].filter(Boolean).join('|').replace(/[^a-z0-9_-]+/gi,'_').slice(0,180);
    return 'upa.patient-name.v1.' + (scope || 'current-case');
  }

  function accessCaseId(){
    var value = clean(window.UPAFullDashboardCaseId || '');
    if(!value){
      try{
        var params = new URLSearchParams(window.location.search || '');
        value = clean(params.get('access') || params.get('caseId') || '');
      }catch(e){}
    }
    return /^[A-Za-z0-9_-]{32}$/.test(value) ? value : '';
  }

  function applyBuyerName(target,value){
    if(!target || typeof target !== 'object') return;
    target.buyerName = value;
    target.patientName = value;
    target.patient_name = value;
    target.name = value;
    if(target.intake && typeof target.intake === 'object'){
      target.intake.buyerName = value;
      target.intake.patientName = value;
      target.intake.patient_name = value;
      target.intake.name = value;
    }
  }

  function persistBuyerNameToServer(value){
    var caseId = accessCaseId();
    if(!caseId || typeof fetch !== 'function') return;
    all('[data-upa-editable-name="1"]').forEach(function(field){ field.setAttribute('data-upa-name-save-state','saving'); });
    fetch('/api/update-case',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({caseId:caseId,patientName:value})
    })
    .then(function(response){
      return response.json().catch(function(){return {};}).then(function(result){
        if(!response.ok || result.ok !== true || !result.case) throw new Error(result.error || 'Name could not be saved');
        return result.case;
      });
    })
    .then(function(serverCase){
      if(window.__UPA_BUYER_NAME__ !== value) return;
      window.__UPA_ACCESS_CASE__ = serverCase;
      window.__UPA_ACCESS_INTAKE__ = serverCase.intake && typeof serverCase.intake === 'object' ? serverCase.intake : {};
      applyBuyerName(window.UPACase,value);
      all('[data-upa-editable-name="1"]').forEach(function(field){ field.setAttribute('data-upa-name-save-state','saved'); });
    })
    .catch(function(error){
      all('[data-upa-editable-name="1"]').forEach(function(field){ field.setAttribute('data-upa-name-save-state','error'); });
      if(typeof window.showToast === 'function') window.showToast('Name not saved','Please click the name and try again.');
      if(window.console && console.warn) console.warn('[UPA] buyer name server save failed',error);
    });
  }

  function persistEditablePatientName(name, c){
    var value = clean(name);
    var nameKey = editablePatientNameKey(c);
    var serverCaseId = accessCaseId();
    window.__UPA_BUYER_NAME__ = value;
    if(c){
      c.patientName = value;
      c.firstName = value ? value.split(/\s+/)[0] : 'You';
      c.lastName = value && value.split(/\s+/).length > 1 ? value.split(/\s+/).slice(-1)[0] : '';
    }
    if(window.UPACase){
      window.UPACase.patientName = value;
      window.UPACase.firstName = value ? value.split(/\s+/)[0] : 'You';
      window.UPACase.lastName = value && value.split(/\s+/).length > 1 ? value.split(/\s+/).slice(-1)[0] : '';
    }
    applyBuyerName(window.__UPA_ACCESS_CASE__,value);
    if(window.__UPA_ACCESS_CASE__ && window.__UPA_ACCESS_CASE__.intake) window.__UPA_ACCESS_INTAKE__ = window.__UPA_ACCESS_CASE__.intake;
    if(window.__UPA_PACKET_INTAKE__ && typeof window.__UPA_PACKET_INTAKE__ === 'object'){
      window.__UPA_PACKET_INTAKE__.patientName = value;
      window.__UPA_PACKET_INTAKE__.patient_name = value;
      window.__UPA_PACKET_INTAKE__.name = value;
    }
    if(serverCaseId){
      persistBuyerNameToServer(value);
      return;
    }
    var intake = readIntake() || readStorageJSON('upa.intake.v1') || {};
    intake.patientName = value;
    intake.patient_name = value;
    intake.name = value;
    if(window.UPAState && window.UPAState.persistIntake){
      try{
        window.UPAState.persistIntake(intake,{stage:'patient-name-edit',source:'editable-patient-name'});
        if(window.UPAState.persistCase && c) window.UPAState.persistCase(c,{stage:'patient-name-edit',source:'editable-patient-name'});
      }catch(e){}
    }else{
      var intakeJson = JSON.stringify(intake);
      try{ localStorage.setItem('upa.intake.v1',intakeJson); }catch(e){}
      try{ sessionStorage.setItem('upa.intake.v1',intakeJson); }catch(e){}
      var active = readStorageJSON('upa.active.case.v1') || {};
      if(active.intake && typeof active.intake === 'object'){
        active.intake.patientName = value;
        active.intake.patient_name = value;
        active.intake.name = value;
        if(active.session && active.session.intake){
          active.session.intake.patientName = value;
          active.session.intake.patient_name = value;
          active.session.intake.name = value;
        }
      }else{
        active.patientName = value;
        active.patient_name = value;
        active.name = value;
      }
      var activeJson = JSON.stringify(active);
      try{ localStorage.setItem('upa.active.case.v1',activeJson); }catch(e){}
      try{ sessionStorage.setItem('upa.active.case.v1',activeJson); }catch(e){}
    }
    var dossier = readStorageJSON('upa.ai.dossier.v1');
    if(dossier && typeof dossier === 'object'){
      dossier.patientName = value;
      if(dossier.intake && typeof dossier.intake === 'object'){
        dossier.intake.patientName = value;
        dossier.intake.patient_name = value;
        dossier.intake.name = value;
      }
      var dossierJson = JSON.stringify(dossier);
      try{ localStorage.setItem('upa.ai.dossier.v1',dossierJson); }catch(e){}
      try{ sessionStorage.setItem('upa.ai.dossier.v1',dossierJson); }catch(e){}
    }
    try{ localStorage.setItem('patientName',value); }catch(e){}
    try{ sessionStorage.setItem('patientName',value); }catch(e){}
    try{ localStorage.setItem('upa.buyer.name.v1',value); }catch(e){}
    try{ sessionStorage.setItem('upa.buyer.name.v1',value); }catch(e){}
    try{ localStorage.setItem(nameKey,value); }catch(e){}
    try{ sessionStorage.setItem(nameKey,value); }catch(e){}
  }

  function wireEditablePatientNames(c){
    var selector = '#sb-patient-name,.sb-patient-name,.lhd-name,.lbs-name,.doc-preview-card .mini-org,.doc-preview-card .mini-sig-name';
    var syncing = false;

    function currentName(){
      var stored = null;
      var serverName = validBuyerTypedName(window.__UPA_ACCESS_CASE__ && (
        window.__UPA_ACCESS_CASE__.buyerName ||
        window.__UPA_ACCESS_CASE__.intake && window.__UPA_ACCESS_CASE__.intake.buyerName
      ));
      if(window.__UPA_ACCESS_CASE__ && typeof window.__UPA_ACCESS_CASE__ === 'object') return serverName;
      var nameKey = editablePatientNameKey(c);
      if(stored === null){ try{ stored = sessionStorage.getItem(nameKey); }catch(e){} }
      if(stored === null){ try{ stored = localStorage.getItem(nameKey); }catch(e){} }
      if(stored === null && window.__UPA_BUYER_NAME__ !== undefined) stored = window.__UPA_BUYER_NAME__;
      if(stored !== null) return validBuyerTypedName(stored);
      if(one('.toolbar') && all('.page').length >= 4) return '';
      return clean(c && c.patientName || window.UPACase && window.UPACase.patientName || '');
    }

    function syncFields(value, source){
      if(syncing) return;
      syncing = true;
      all(selector).forEach(function(field){
        if(field !== source && field.textContent !== value) field.textContent = value;
      });
      syncing = false;
    }

    function wire(field){
      if(!field || field.getAttribute('data-upa-patient-name-handler-wired') === '1') return;
      field.setAttribute('data-upa-editable-name','1');
      field.setAttribute('data-upa-patient-name-handler-wired','1');
      field.setAttribute('contenteditable','true');
      field.setAttribute('role','textbox');
      field.setAttribute('aria-label','Patient name');
      field.setAttribute('aria-multiline','false');
      field.setAttribute('spellcheck','false');
      field.setAttribute('data-placeholder', field.classList.contains('mini-org') || field.classList.contains('mini-sig-name') ? 'Your name' : 'Click to add your name');
      field.classList.add('upa-editable-patient-name');
      if(!clean(field.textContent) && currentName()) field.textContent = currentName();
      field.addEventListener('focus',function(){
        window.__upaNameEditing = true;
      });
      field.addEventListener('keydown',function(event){
        if(event.key === 'Enter'){
          event.preventDefault();
          field.blur();
        }
      });
      field.addEventListener('input',function(){
        var value = String(field.textContent || '').replace(/[\r\n]+/g,' ');
        if(c) c.patientName = value;
        if(window.UPACase) window.UPACase.patientName = value;
        syncFields(value,field);
      });
      field.addEventListener('blur',function(){
        var value = clean(field.textContent);
        field.textContent = value;
        syncFields(value,field);
        persistEditablePatientName(value,c);
        window.__upaNameEditing = false;
      });
    }

    function refresh(){
      all(selector).forEach(wire);
      if(!window.__upaNameEditing) syncFields(currentName(),null);
    }

    refresh();
    if(!window.__upaEditablePatientNameObserver && document.body){
      var queued = false;
      window.__upaEditablePatientNameObserver = new MutationObserver(function(){
        if(queued) return;
        queued = true;
        window.setTimeout(function(){ queued = false; refresh(); },20);
      });
      window.__upaEditablePatientNameObserver.observe(document.body,{childList:true,subtree:true});
    }
  }

  function applyPacket(c){
    if(!one('.toolbar') || all('.page').length < 4) return;
    // Set ALL name fields globally first : catches elements outside .lhd wrappers
    // (e.g. the "Prepared For" block on page 1) that applyLetterBodies misses.
    var displayName = buyerTypedName(c);
    var packetAccountRef = knownAccountRef(c.accountRef);
    setAllText('.lhd-name', displayName);
    setAllText('.lbs-name', displayName);
    setText('.tb-sub', [packetAccountRef, displayName].filter(Boolean).join(' - ') + ([packetAccountRef, displayName].filter(Boolean).length ? ' packet' : 'packet'));
    var firstPageHeader = one('.page .nh');
    if(c.noteText && firstPageHeader && !one('.page .upa-case-note')){
      var note = document.createElement('div');
      note.className = 'upa-case-note print';
      note.innerHTML = '<strong>Case specificity note:</strong> ' + h(c.noteText);
      firstPageHeader.parentNode.insertBefore(note, firstPageHeader.nextSibling);
    }
    if(firstPageHeader && !one('.page .upa-intake-context')){
      var ctx = document.createElement('div');
      ctx.className = 'upa-intake-context';
      ctx.innerHTML = contextHTML(c);
      firstPageHeader.parentNode.insertBefore(ctx, firstPageHeader.nextSibling);
    }
    applyLetterBodies(c);
    var pages = all('.page');
    if(pages[0]){
      var firstInfo = all('div', pages[0]).filter(function(el){return /Patient|Provider|Date of Service/.test(el.textContent);});
      firstInfo.slice(0,3);
    }
    setText('.packet-flagged-count', c.issueCount + (c.issueCount === 1 ? ' review area' : ' review areas'));
    setText('.packet-review-metric', c.issueCount + (c.issueCount === 1 ? ' area' : ' areas'));

    // Front-page findings summary box : shows up to 3 identified issues with title + short label
    var findingsBox = one('.packet-findings-box');
    if(findingsBox && c.issues && c.issues.length){
      var pfCount = one('.pf-count', findingsBox);
      if(pfCount) pfCount.textContent = c.issues.length + (c.issues.length === 1 ? ' issue found' : ' issues found');
      var pfList = one('.pf-list', findingsBox);
      if(pfList){
        pfList.innerHTML = c.issues.slice(0,3).map(function(issue){
          return '<div style="display:flex;align-items:flex-start;gap:10px">' +
            '<div style="width:16px;height:16px;border-radius:50%;background:rgba(30,107,90,.1);border:1px solid rgba(30,107,90,.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">' +
            '<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#1E6B5A" stroke-width="3"><path d="M9 11l3 3L22 4"/></svg>' +
            '</div>' +
            '<div><div style="font-size:.625rem;font-weight:700;color:var(--navy)">' + h(issue.title) + '</div>' +
            (issue.short ? '<div style="font-size:.5rem;color:var(--ink3);line-height:1.5;text-transform:capitalize">' + h(issue.short) + '</div>' : '') +
            '</div></div>';
        }).join('');
      }
      findingsBox.style.display = '';
    }

    all('.nf-r').forEach(function(el){
      if(/Account|Page/.test(el.textContent)){
        var pageText = el.textContent.replace(/\s*·\s*Account.+$/,'').replace(/\s+-\s*Account.+$/,'').trim();
        el.textContent = packetAccountRef ? pageText + ' · Account ' + packetAccountRef : pageText;
      }
    });
    renderPhase3CaseGeneration(null, c);
  }

  function applyGuideHook(c){
    if(window.__upaGuidePersonalized) return;
    if(typeof window.showGuide !== 'function') return;
    function ensureGuideContext(root, name){
      if(!root || root.querySelector('.upa-intake-context')) return;
      if(['callscripts','writtenrequests','nextsteps','starthere','checklist'].indexOf(name) === -1) return;
      var note = document.createElement('div');
      note.className = 'upa-intake-context';
      note.innerHTML = contextHTML(c);
      root.insertBefore(note, root.firstChild);
    }
    var original = window.showGuide;
    window.showGuide = function(name){
      var result = original.apply(this, arguments);
      window.setTimeout(function(){
        var root = document.getElementById('gd-body');
        if(root){
          replaceTextNodes(root, guideReplacements(c, name));
          ensureGuideContext(root, name);
          var texts = all('.gd-card-text', root);
          if(texts[0] && name === 'starthere') texts[0].innerHTML = 'Start with the <strong>Documents tab</strong>. Letter 1 is tailored to ' + h(c.provider) + ', ' + h(c.dateOfService) + ', ' + h(c.amount.display) + ', ' + h(c.coverage) + ', and the concerns you entered: "' + h(c.concernSummary) + '".' + (c.userDetail ? ' Your intake note is also included: ' + h(c.userDetail) + '.' : '');
          if(name === 'checklist'){
            var checks = all('.gdc-text', root);
            if(checks[0]) checks[0].innerHTML = '<strong>Bill review prepared.</strong> Your review organized ' + h(c.amount.display) + ' around ' + h(c.issueCount) + ' review areas from this intake: ' + h(c.concernSummary) + '.';
            if(checks[1]) checks[1].innerHTML = '<strong>Send the itemized statement request.</strong> Download Letter 1' + (c.patientName ? ', sign it as ' + h(c.patientName) : '') + ', and send it to ' + h(c.provider) + ' Patient Financial Services.';
          }
          cleanCustomerTextNodes(root);
        }
      },20);
      return result;
    };
    window.__upaGuidePersonalized = true;
  }

  function applyCommon(c){
    ensureStyles();
    window.UPACase = c;
    try{
      if(window.UPAState && window.UPAState.persistCase) window.UPAState.persistCase(c,{stage:'case-personalized',source:'upa-case-personalization'});
    }catch(e){}
    replaceTextNodes(document.body, commonReplacements(c));
    if(document.title && /UPA|United Patient Advocate/.test(document.title)){
      document.title = document.title.replace('Your Review Is Ready','Review Ready - ' + c.patientName).replace('Bill Review','Bill Review - ' + c.patientName);
    }
  }

  // H2 FIX: guard against double-run. The IIFE calls run() immediately (readyState is
  // 'interactive' since scripts are at end of body), then window.load+50ms fires a second
  // call. If the second call reads different storage data (e.g. from restoreSession()
  // side-effects of the first run), it overwrites DOM with subtly different values and
  // triggers a second persistCase() write. One run per page load is sufficient.
  var __upaPersonalizationRunDone = false;

  function run(){
    if(__upaPersonalizationRunDone) return;
    if(window.UPAFullDashboardHydrating === true) return;
    __upaPersonalizationRunDone = true;

    // FIX 2A: Detect truly-empty intake (no localStorage, no sessionStorage,
    // no URL params, no packet injection) and show the session-expired
    // overlay on the dashboard rather than rendering placeholder fallbacks.
    // Only triggers on the dashboard page (overlay element won't exist on
    // the landing or preview pages, so the toggle is a no-op there).
    var probe = readIntake();
    var hasAnyIntake = probe && (
      clean(probe.provider) || clean(probe.extracted_provider) ||
      clean(probe.bill_amount) || clean(probe.totalBilled) || clean(probe.extracted_bill_amount) ||
      clean(probe.patient_name) || clean(probe.patientName) || clean(probe.full_name) || clean(probe.name) ||
      clean(probe.concerns) || clean(probe.specificConcerns) || clean(probe.description) ||
      clean(probe.date_of_service) || clean(probe.dos) ||
      clean(probe.insurance)
    );
    var overlay = document.getElementById('session-expired-overlay');
    if(overlay){
      if(!hasAnyIntake && !window.UPAFullDashboardCaseId){
        overlay.classList.add('show');
        console.warn('[UPA] No access case, recovery data, or browser case was available.');
      }else{
        overlay.classList.remove('show');
      }
    }

    var c = buildCase();
    applyCommon(c);
    applyPreview(c);
    applyDashboard(c);
    applyPacket(c);
    wireEditablePatientNames(c);
    renderClfsBenchmarks();
    applyGuideHook(c);
    cleanCustomerTextNodes(document.body);
    if(window.__UPA_MOBILE_DEBUG__) window.__UPA_MOBILE_DEBUG__.render('after-personalization');
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', run);
  }else{
    run();
  }
  // Keep the load+50ms listener as a safety net for cases where DOMContentLoaded
  // fires before UPAState is available (e.g. a script loads async). The __upaPersonalizationRunDone
  // guard above ensures it's a no-op if the first run already completed.
  window.addEventListener('load', function(){ window.setTimeout(run, 50); });
  window.addEventListener('upa:access-case-ready', run);
})();
