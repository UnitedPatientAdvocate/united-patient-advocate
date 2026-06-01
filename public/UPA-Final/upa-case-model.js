(function(){
  'use strict';

  function clean(value, fallback){
    var text = String(value == null ? '' : value).replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
    return text || (fallback || '');
  }

  function first(source, keys, fallback){
    for(var i = 0; i < keys.length; i++){
      var value = source && source[keys[i]];
      if(value !== undefined && value !== null && clean(value)) return clean(value);
    }
    return fallback || '';
  }

  function moneyValue(source){
    var raw = first(source, [
      'patientBalance',
      'patient_balance',
      'balance',
      'bill_amount',
      'bill_amount_other',
      'totalBilled',
      'total_billed',
      'amount',
      'extracted_bill_amount'
    ], '');
    if(!raw) return { raw:'', display:'Amount to review', known:false, number:0 };
    var parsed = Number(String(raw).replace(/[^0-9.-]/g, ''));
    var known = Number.isFinite(parsed) && parsed > 0;
    return {
      raw: raw,
      display: known ? parsed.toLocaleString('en-US', { style:'currency', currency:'USD' }) : raw,
      known: known,
      number: known ? parsed : 0
    };
  }

  function isDenial(source){
    var haystack = [
      first(source, ['bill_type', 'billType', 'documentType'], ''),
      first(source, ['concerns', 'specificConcerns', 'description', 'denialReason', 'denial_reason'], ''),
      first(source, ['payment_status', 'paymentStatus', 'status'], '')
    ].join(' ').toLowerCase();
    return /denial|denied|appeal|underpaid|eob|claim/.test(haystack);
  }

  function addFinding(list, item){
    list.push({
      id: item.id,
      severity: item.severity || 'MEDIUM',
      title: item.title,
      summary: item.summary,
      evidence: item.evidence || '',
      recommendedAction: item.recommendedAction || '',
      bucket: "SEE_WHATS_WRONG",
      letterId: item.letterId || '',
      source: item.source || 'canonical-case-model'
    });
  }

  function buildFindings(input, ctx){
    var findings = [];
    if(ctx.denial){
      addFinding(findings, {
        id:'denial-review',
        severity:'CRITICAL',
        title:'Denial or underpayment needs review',
        summary:'The case indicates a denied, underpaid, or appeal-related claim. The next step is to compare the denial notice, EOB, policy reason, and appeal deadline before accepting the balance.',
        evidence: ctx.coverage || ctx.concerns || 'Denial or claim issue provided',
        recommendedAction:'Request the EOB, denial reason, claim notes, and written appeal instructions.',
        letterId:'appeal-letter'
      });
    }
    if(ctx.amount.known){
      addFinding(findings, {
        id:'balance-reconciliation',
        severity: ctx.amount.number >= 1000 ? 'HIGH' : 'MEDIUM',
        title:'Patient balance should be reconciled before accepting the bill',
        summary:'The listed balance should be checked against itemized charges, insurance activity, contractual adjustments, and remaining patient responsibility.',
        evidence: ctx.amount.display,
        recommendedAction:'Request a full itemized statement and written explanation of how the patient balance was calculated.',
        letterId:'itemized-request'
      });
    }
    if(ctx.concerns){
      addFinding(findings, {
        id:'intake-concern',
        severity:'HIGH',
        title:'User-reported billing concern requires written response',
        summary:'The intake includes a specific concern that should be answered in writing with supporting billing records, codes, adjustments, or payer documentation.',
        evidence: ctx.concerns,
        recommendedAction:'Ask billing to identify the exact records and account lines that answer the concern.',
        letterId:'billing-review'
      });
    }
    if(!findings.length || findings.length < 3){
      addFinding(findings, {
        id:'documentation-review',
        severity:'MEDIUM',
        title:'Documentation should be requested before accepting the bill',
        summary:'A full itemized statement, EOB, and supporting account notes are needed to confirm whether the balance is accurate.',
        evidence: ctx.provider,
        recommendedAction:'Send the itemized statement request and keep proof of delivery.',
        letterId:'itemized-request'
      });
    }
    return findings.slice(0, 4);
  }

  function buildLetters(ctx, findings){
    var letters = [
      {
        id:'itemized-request',
        order:1,
        title:'Request for Fully Itemized Statement',
        type:'Itemized Bill Request Letter',
        sendTo:ctx.provider + ' Patient Financial Services',
        subject:'Request for itemized statement and account documentation',
        purpose:'Request the line-by-line bill, codes, units, adjustments, payer activity, and records needed before deciding what to pay.',
        findingIds: findings.filter(function(f){ return f.letterId === 'itemized-request'; }).map(function(f){ return f.id; })
      },
      {
        id:'billing-review',
        order:2,
        title:'Billing Review Request',
        type:'Dispute Letter Template',
        sendTo:ctx.provider + ' Billing Department',
        subject:'Written billing review request for account ' + ctx.account,
        purpose:'Ask the provider to review the specific billing concern and respond in writing with supporting documentation.',
        findingIds: findings.filter(function(f){ return f.letterId === 'billing-review'; }).map(function(f){ return f.id; })
      },
      {
        id:'insurance-review',
        order:3,
        title:'Insurance and EOB Review Request',
        type:'Insurance Review Letter',
        sendTo:ctx.coverage || 'Insurance or billing department',
        subject:'Request for EOB, payer adjustment, and coverage review',
        purpose:'Request EOB details, denial or remark codes, network/rate review, and payer responsibility clarification.',
        findingIds: findings.filter(function(f){ return f.letterId === 'insurance-review'; }).map(function(f){ return f.id; })
      }
    ];
    if(ctx.denial){
      letters.push({
        id:'appeal-letter',
        order:4,
        title:'Formal Appeal Letter',
        type:'Appeal Letter Kit',
        sendTo:(ctx.coverage || 'Insurance') + ' Appeals Department',
        subject:'Formal appeal request for denied or underpaid claim',
        purpose:'Open the appeal path and request the denial basis, records reviewed, appeal deadline, and external review procedure.',
        findingIds: findings.filter(function(f){ return f.letterId === 'appeal-letter'; }).map(function(f){ return f.id; })
      });
    }
    return letters;
  }

  function buildActionPlan(ctx, letters){
    return [
      {
        id:'send-itemized-request',
        order:1,
        title:'Send the itemized statement request',
        description:'Send Letter 1 to request the complete line-by-line bill, codes, adjustments, EOB activity, and account notes.',
        timing:'Today',
        status:'do-now',
        letterId:'itemized-request',
        bucket:'TAKE_ACTION'
      },
      {
        id:'review-records',
        order:2,
        title:'Compare the response against the bill and EOB',
        description:'When the documents arrive, compare charges, payer adjustments, denial codes, network status, and patient responsibility.',
        timing:'7-30 days',
        status:'next',
        letterId:'',
        bucket:'STAY_ON_TRACK'
      },
      {
        id:'send-review-letters',
        order:3,
        title:'Send the case-specific review letters',
        description:'Use the prepared billing review, insurance review, or appeal letter that matches the strongest finding.',
        timing:'After records arrive',
        status:'next',
        letterId: ctx.denial ? 'appeal-letter' : 'billing-review',
        bucket:'TAKE_ACTION'
      },
      {
        id:'follow-up',
        order:4,
        title:'Follow up if no written response arrives',
        description:'Follow up with billing, the patient advocate office, or the insurer and keep a call log with names, dates, and reference numbers.',
        timing:'30 days',
        status:'pending',
        letterId:'',
        bucket:'STAY_ON_TRACK'
      }
    ];
  }

  function addDays(date, days){
    var d = new Date(date.getTime());
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function buildTimeline(ctx){
    var start = new Date();
    return [
      {
        id:'case-opened',
        label:'Today',
        date:addDays(start, 0),
        title:'Case organized',
        description:'The billing details were organized into findings, letters, action steps, and a follow-up timeline.',
        status:'done',
        bucket:'WORKSPACE'
      },
      {
        id:'send-first-letter',
        label:'Today',
        date:addDays(start, 0),
        title:'Send first written request',
        description:'Send the itemized statement request and save proof of delivery.',
        status:'do-now',
        bucket:'TAKE_ACTION'
      },
      {
        id:'document-review-window',
        label:'+30 days',
        date:addDays(start, 30),
        title:'Review response or follow up',
        description:'If records arrive, compare them against the findings. If not, follow up in writing and by phone.',
        status:'next',
        bucket:'STAY_ON_TRACK'
      },
      {
        id:'escalation-window',
        label:'+60 days',
        date:addDays(start, 60),
        title:'Escalate if unresolved',
        description:'Use the provider contact guide, call log, and escalation path if no written answer arrives.',
        status:'pending',
        bucket:'STAY_ON_TRACK'
      }
    ];
  }

  function buildCaseScore(ctx, findings, letters){
    var score = 28;
    if(ctx.provider !== 'Your provider') score += 10;
    if(ctx.amount.known) score += 14;
    if(ctx.dateOfService !== 'On file') score += 8;
    if(ctx.coverage !== 'Insurance on file') score += 8;
    if(ctx.concerns) score += 12;
    if(ctx.uploaded) score += 18;
    if(ctx.denial) score += 8;
    score = Math.max(0, Math.min(94, score));
    return {
      value: score,
      label: score >= 70 ? 'Strong start' : (score >= 45 ? 'Open case' : 'Needs more detail'),
      level: score >= 70 ? 'strong' : (score >= 45 ? 'moderate' : 'limited'),
      source:'canonical-case-model',
      inputs:{
        hasProvider:ctx.provider !== 'Your provider',
        hasAmount:ctx.amount.known,
        hasDateOfService:ctx.dateOfService !== 'On file',
        hasCoverage:ctx.coverage !== 'Insurance on file',
        hasConcerns:!!ctx.concerns,
        uploaded:!!ctx.uploaded,
        denial:!!ctx.denial,
        findingCount:findings.length,
        letterCount:letters.length
      }
    };
  }

  function context(input){
    input = input && typeof input === 'object' ? input : {};
    var amount = moneyValue(input);
    return {
      raw:input,
      patient:first(input, ['patient_name', 'patientName', 'name'], 'Your Name'),
      provider:first(input, ['provider', 'providerName', 'extracted_provider'], 'Your provider'),
      account:first(input, ['account_number', 'accountNumber', 'account', 'billing_reference', 'billingReference', 'extracted_account_number'], 'account number'),
      dateOfService:first(input, ['date_of_service', 'dateOfService', 'dos', 'extracted_date_of_service'], 'On file'),
      coverage:first(input, ['insurance', 'coverage', 'payer', 'extracted_insurance'], 'Insurance on file'),
      concerns:first(input, ['concerns', 'specificConcerns', 'description', 'concern_other', 'denialReason', 'denial_reason'], ''),
      amount:amount,
      uploaded:!!(input.uploaded || input._scan || input.fileName || input.filename || input.extractedText || input.rawText),
      denial:isDenial(input)
    };
  }

  function buildCaseModel(intakeOrScan){
    var ctx = context(intakeOrScan);
    var findings = buildFindings(intakeOrScan, ctx);
    var letters = buildLetters(ctx, findings);
    var actionPlan = buildActionPlan(ctx, letters);
    var timeline = buildTimeline(ctx);
    var caseScore = buildCaseScore(ctx, findings, letters);
    return {
      version:1,
      generatedAt:new Date().toISOString(),
      source:'canonical-case-model',
      context:{
        patient:ctx.patient,
        provider:ctx.provider,
        account:ctx.account,
        dateOfService:ctx.dateOfService,
        coverage:ctx.coverage,
        amount:ctx.amount.display,
        denial:ctx.denial,
        uploaded:ctx.uploaded
      },
      findings:findings,
      actionPlan:actionPlan,
      timeline:timeline,
      caseScore:caseScore,
      letters:letters
    };
  }

  window.UPACaseModel = Object.assign({}, window.UPACaseModel || {}, {
    buildCaseModel:buildCaseModel
  });
})();
