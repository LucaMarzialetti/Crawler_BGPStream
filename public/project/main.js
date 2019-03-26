requirejs.config({

  paths: {
      'populator': "js/populator",
      'retriever': "js/retriever",
      'asn_prefixes_resolver': "js/asn_prefixes_resolver",
      'jquery': 'http://code.jquery.com/jquery-3.3.1.min',
      'momentjs': 'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment-with-locales.min',
      'datatables':'https://cdn.datatables.net/1.10.19/js/jquery.dataTables.min',
  }
});

requirejs([

  // Load our app module and pass it to our definition function
  'app',
], function(App){
  // The "app" dependency is passed in as "App"
  App.initialize();
});
