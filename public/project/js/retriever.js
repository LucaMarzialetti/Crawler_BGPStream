define(["jquery"],function($){
	
	return {
		init: function() {
			$.ajaxPrefilter( function (options) {
				if (options.crossDomain && jQuery.support.cors) {
					var protocol = (window.location.protocol === 'http:' ? 'http:' : 'https:');
					options.url = protocol + '//cors-anywhere.herokuapp.com/' + options.url;
					//options.url = "http://cors.corsproxy.io/url=" + options.url;
				}
			});
			console.log("*RETRIEVER LOADED*");
		},
		get_url: function(url,callback){
			console.log("Retrieving "+url);			
			$.ajax({
				url: url,
				dataType: "text",
				timeout:60000,
				success: function(response) {
					console.log("Get "+url+" success!");
					callback(response);
				},
				error: function(jqXHR, textStatus, errorThrown){
					console.log("Get "+url+" error! ("+jqXHR.status+")");
					callback(undefined);
				}
			});
		}
	}	
});