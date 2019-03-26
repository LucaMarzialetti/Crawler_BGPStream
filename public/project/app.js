// Filename: app.js
define([
  'retriever',
  'populator',
  'jquery',
  'momentjs',
  'asn_prefixes_resolver',
  'datatables',
], function(ret,pop,$,moment,asn_prefixes_resolver,datatables){
  var initialize = function(){
  	ret.init();
  	pop.init();
    //window.populator = pop;
  }

  return {
    initialize: initialize
  };
});
