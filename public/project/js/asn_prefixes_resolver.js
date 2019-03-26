define(["jquery","retriever"],function($,retriever){
	var base_url_pre = "https://api.bgpview.io/asn/";
	var base_url_post = "/prefixes";
	var ipv4_regex = /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\/[0-9]{1,2}/g;
	var callback;

	var resolve_asn = function(asn, cb){
		callback=cb;
		retriever.get_url(base_url_pre+asn+base_url_post, resolve_asn_callback);
	};
	var resolve_asn_callback = function(response){
		if(response!==undefined) {
			var res = JSON.parse(response);
			
			function make_list(res){
				var array = [];
				var data = res.data;
				if(data!==undefined){
					var prefixes = data.ipv4_prefixes;
						if(prefixes!==undefined){
							for(var i=0; i<prefixes.length; i++) {
								var parent = prefixes[i]["parent"];
								if(parent!==undefined)
									array.push(parent.prefix);
							}
						}
				}
				return array;
			}

			function occurrences(array) {
				//calcolo le occorrenze
				var counts = {};
				for (var i = 0; i < array.length; i++) {
				  var num = array[i];
				  counts[num] = counts[num] ? counts[num] + 1 : 1;
				}
				return counts;
			}

			function max_occurrence(counts){
				// max occorrenza
				var counters = Object.values(counts);
				var max_counters = Math.max.apply(null,counters);

				// chiave della massima occorrenza
				var max_key;
				var keys = Object.keys(counts);
				for(var k=0; k<keys.length; k++) {
					var chiave = keys[k];
					var v=counts[chiave];
					if(v==max_counters) 
						max_key=chiave;
				}
				return max_key;
			}

			var list = make_list(res);
			var occs = occurrences(list);
			var ip = max_occurrence(occs);
			callback(ip);
		}
		else {
			callback(undefined);
		}
	};
	return {
		resolve_asn: resolve_asn,
		resolve_asn_callback: resolve_asn_callback,
	};
});