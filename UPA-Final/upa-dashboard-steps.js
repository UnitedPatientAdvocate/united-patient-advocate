(function(root, factory){
  var api = factory();
  if(typeof module === 'object' && module.exports) module.exports = api;
  if(root) root.UPADashboardSteps = api;
})(typeof window !== 'undefined' ? window : globalThis, function(){
  'use strict';

  var DOSSIER_KEY = 'upa.ai.dossier.v1';

  function asArray(value){
    return Array.isArray(value) ? value : [];
  }

  function readDossier(){
    var stores = [];
    if(typeof localStorage !== 'undefined') stores.push(localStorage);
    if(typeof sessionStorage !== 'undefined') stores.push(sessionStorage);

    for(var i = 0; i < stores.length; i += 1){
      try{
        var raw = stores[i].getItem(DOSSIER_KEY);
        if(raw) return JSON.parse(raw);
      }catch(e){}
    }
    return {};
  }

  function buildDashboardSteps(dossier){
    var source = dossier && typeof dossier === 'object' ? dossier : {};
    var triggers = asArray(source.triggers);
    var scripts = asArray(source.scripts);
    var savedSteps = asArray(source.dashboardSteps);
    var steps = [];

    function hasTrigger(types){
      return triggers.some(function(trigger){
        return trigger && types.indexOf(trigger.type) !== -1;
      });
    }

    function hasScript(id){
      return scripts.some(function(script){
        return script && script.id === id;
      });
    }

    function addStep(id, title, sourceTool, locked){
      if(steps.some(function(step){ return step.id === id; })) return;
      steps.push({
        order: steps.length + 1,
        id: id,
        title: title,
        sourceTool: sourceTool,
        locked: locked,
        status: 'todo'
      });
    }

    if(hasScript('script-itemized-bill-request')){
      addStep('itemized-bill-request', 'Request an itemized bill', 'itemized_bill', false);
    }

    if(hasTrigger(['charity_care_eligible'])){
      addStep('charity-care', 'Apply for hospital financial assistance', 'charity_care', true);
    }

    if(hasTrigger(['surprise_billing_emergency', 'surprise_billing_ancillary'])){
      addStep('in-network-repricing', 'Request an in-network pricing review', 'in_network_repricing', true);
    }

    if(hasTrigger(['gfe_dispute_400'])){
      addStep('gfe-dispute', 'Request a good faith estimate review', 'gfe_dispute', true);
    }

    if(hasTrigger(['collections_validation'])){
      addStep('collections-defense', 'Request debt validation information', 'collections_defense', true);
    }

    if(hasTrigger(['surprise_billing_emergency', 'surprise_billing_ancillary'])){
      addStep('dispute-letter', 'Prepare your dispute letter', 'dispute_letter', true);
    }

    return steps.map(function(step, index){
      var saved = savedSteps.find(function(item){ return item && item.id === step.id; });
      return Object.assign({}, step, {
        order: index + 1,
        status: saved && saved.status === 'done' ? 'done' : 'todo'
      });
    });
  }

  function readDashboardSteps(){
    return buildDashboardSteps(readDossier());
  }

  return {
    DOSSIER_KEY: DOSSIER_KEY,
    buildDashboardSteps: buildDashboardSteps,
    readDashboardSteps: readDashboardSteps
  };
});
