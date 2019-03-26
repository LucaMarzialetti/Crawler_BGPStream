define(["retriever", "jquery", "momentjs", "asn_prefixes_resolver", "datatables"], function(retriever, $, moment, asn_prefixes_resolver,datatables){
	var output_div = "div#output";
	var controls_div = "div#controls";
	var result_div = "div#result";
	var storage_name = "stored_collection";
	var skiplist_name = "skip_list";
	var ripestat_link ="https://stat.ripe.net/widget/interdomain-landscape#";
	var bgpstream_link = "https://bgpstream.com";
	var ipv4_regex = /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\/[0-9]{1,2}/g;
	var asn_regex =  /(?:ASN *)([0-9]+)(?: .*)/g;
	var storage, skiplist, updates;
	var iterateFlag;
	var keys;
	var keys_size;
	var key_pos;
	var init = function() {
		console.log("*POPULATOR LOADED*");
		iterateFlag = false;
		//bind events on click
		updates = {};
		storage = {};
		skiplist =[];
		$(controls_div).append($("<button>Clear Local Cache</button>").on("click", function(){try {localStorage.clear();}catch(e){console.log("localStorage access failed!");} loadCache(); alert("Cache cleared!")}));
		$(controls_div).append($("<button>Load Cache</button>").on("click", function(){$(result_div).remove(); loadCache(); populateWithCache();}));
		$(controls_div).append($("<button>Empty Table</button>").on("click", function(){$(result_div).remove(); makeDomTable();}));
		$(controls_div).append($("<button>Fetch from BGPStream.com</button>").on("click", function(){update();}));
		$(controls_div).append($("<button>Update from BGPStream.com</button>").on("click", function(){crawl_init(); }));
		makeDomTable();
	};
	var loadCache = function(){
		//skip list stored
		try {
			if(localStorage[skiplist_name] === undefined)
				localStorage[skiplist_name]=JSON.stringify([]);
			skiplist = JSON.parse(localStorage[skiplist_name]);

			//collection with target stored
			if(localStorage[storage_name] === undefined) {
				localStorage[storage_name]=JSON.stringify({});
			}
			storage = JSON.parse(localStorage[storage_name]);
		}
		catch(e){
			console.log("localStorage access failed!");
		}
	};
	var update = function() {
		$(output_div).html("Retrieving "+bgpstream_link+" page...");
		retriever.get_url(bgpstream_link, update_callback);
	};
	var update_callback = function(response){
		if(response!==undefined) {
			var htmlWrapper = document.implementation.createHTMLDocument('wrap');
			var table_node = $(response, htmlWrapper).find('table#all_events')[0];
			if(table_node !== undefined) {
				var tbody_node = $(table_node).find("tbody")[0];
				if(tbody_node !== undefined) {
					var tr_nodes = $(tbody_node).find("tr");
					if (tr_nodes !== undefined) {
						updates = {};
						$.each(tr_nodes,function(i,e) {
							var type=$(e).find("td.event_type")[0].innerHTML.trim();
							var starttime=$(e).find("td.starttime")[0].innerHTML.trim();
							var endtime=$(e).find("td.endtime")[0].innerHTML.trim();
							if(endtime===undefined || endtime==="") {
								endtime = moment(starttime);
							}
							endtime = moment(endtime).add(1,'days').format("YYYY-MM-DD HH:mm:ss");
							starttime = moment(starttime).add(-1,'days').format("YYYY-MM-DD HH:mm:ss");
							var link=$(e).find("a").attr("href");
							var id=link.split("/")[2];
							var link=bgpstream_link+link;
							var obj={
								type: type, 
								starttime: starttime,
								endtime: endtime,
								bgpstreamlink: link
							};
							if(storage[id]!==undefined || skiplist.includes(id))
								console.log(id+" skipped, already cached");
							else
								updates[id]=obj;
						});
						keys = Object.keys(updates);
						keys_size = keys.length;
						key_pos = 0;
						$(output_div).html("Fetched "+keys_size+" new events (cached "+Object.keys(storage).length+", skiped "+skiplist.length+")");
					}
				}
			}
		}
		else {
			console.log("Error in update_callback: response empty");
			$(output_div).html("Fetching failed");
		}
	};
	var crawl_init = function(){
		if(key_pos===undefined){
			$(output_div).html("Nothing fetched, use fetch button.");
		}
		else{
			iterateFlag=!iterateFlag;
			if(iterateFlag) {
				this.keys=keys;
				this.keys_size=keys_size;
				this.key_pos = key_pos;
				$(output_div).html("Crawling obtained links...processing: ");
				$(output_div).append("<span id='crawl_counter'>0/"+this.keys_size+"</span>");
				this.crawl_counter = $("span#crawl_counter");
				this.retries = 0;
				this.max_retries = 2;
				console.log("Starting crawling");
				crawl();
			}
			else {
				$(output_div).html("Crawling stopped");
			}
		}
	};
	var crawl = function() {
		//this.keys_size=20; //TEMPORARY LIMITATION
		if(this.key_pos<this.keys_size && iterateFlag){
			var k = this.keys[this.key_pos];
			var o = updates[k];
			$(this.crawl_counter).html((this.key_pos+1)+"/"+this.keys_size);
			if(storage[k]!==undefined||skiplist.includes[k]){
				console.log(k+" skipped, already cached");
				this.key_pos++;
				crawl();
			}
			else {
				console.log("Crawling --> "+o['bgpstreamlink']);
				retriever.get_url(o['bgpstreamlink'], crawl_callback);
			}
		}
		else{
			console.log("Crawling over!")
			console.log(storage);
		}
	};
	var crawl_callback = function(response){
		var sleep_time_base = 0;
		var found = false;
		var ip,id,asn;
		if(response!==undefined) {
			var htmlWrapper = document.implementation.createHTMLDocument('wrap');
			// get table
			var table_node = $(response, htmlWrapper).find('table.table')[0];
			// get asn
			asn = $(response, htmlWrapper).find("h3").text();
			if(asn.match(asn_regex)){
				var match = asn_regex.exec(asn);
				asn=match[1];
			}
			else 
				asn=undefined;
			// find ip in tr
			if(table_node !== undefined) {
				ip = undefined;
				id = this.keys[this.key_pos];
				var trs = $(table_node).find("tr");
				if(trs !== undefined) {
					trs.each(function(i,e) {
						var node=$(e).find("td").text();
						if(node.match(ipv4_regex)) {
							found=true;
							ip=node.split(":")[1].trim().split(/[\s\t ]/)[0];
						}
					});
				}
			}
		}
		

		function addFound(ip,id){
			console.log("IP ! "+ip+" in "+id);
			updates[id]["target"]=ip;
			storage[id]=updates[id];
			try {
				localStorage[storage_name]=JSON.stringify(storage);
			}
			catch(e){
				console.log("localStorage access failed!");
			}
			var prepared = prepareObjectToTable(id,storage[id]);
			addToTable(prepared,table);
			this.key_pos++;
			this.retries=0;
			setTimeout(function(){return crawl()}, sleep_time_base);
		}

		function skip(id){
			skiplist.push(id);
			try {
				localStorage[skiplist_name]=JSON.stringify(skiplist);
			}
			catch(e){
				console.log("localStorage access failed!");
			}
			this.key_pos++;
			this.retries=0;
			setTimeout(function(){return crawl()}, sleep_time_base);
		}

		function checkRetries(){
			if(this.retries<this.max_retries){
				this.retries++;
				sleep_time_base+=500*this.retries;
				setTimeout(function(){return crawl()}, sleep_time_base);
				console.log("Response empty; RETRY "+(this.retries)+"/"+this.max_retries);	
			}
			else{
				console.log("Response empty; SKIPPED and "+id+" added to SKIPLIST");	
				skip(id);
			}
		}

		// IF FOUND
		if(found){
			addFound(ip,id);
		}
		else {
			//RETRY
			if(asn!==undefined) {
				console.log("No prefix IP found in "+id+" (type "+updates[id]["type"]+") trying asn resolution for "+asn);
				function callback(ip){
					if(ip!==undefined)
						addFound(ip,id);
					else
						checkRetries();
				};
				asn_prefixes_resolver.resolve_asn(asn, callback);
			}
			else {
				checkRetries();
			}
		}
	};
	var makeDomTable = function (){
		$(output_div).html("");
		if($(result_div).length==0){
			result = $("<div id='result' style='width:100%'/>");
			table = $("<table/>").attr("class","row-border").attr("style","width:100%");
			$(result).append($(table));
			$("body").append($(result));
			addToTableHeader();
		}
	};
	var addToTable = function(object, t){
		var type = object['type'];
		var classType;
		switch(type){
			case "BGP Leak": 
				classType="leak";
			break;
			case "Possible Hijack":
				classType="hijack";
			break;
			case "Outage":
				classType="outage";
			break;
			default:
				classType="";
		}
		t=$(t).DataTable();
		t.row.add({
			"DT_RowClass": classType,
			"0": object['id'],
			"1": object['type'],
			"2": object['target'],
			"3": object['starttime'],
			"4": object['endtime'],
			"5": object['bgpstreamlink'],
			"6": object['ripestat_url'],
		}).draw( false );
	};

	var addToTableHeader = function(){
		var headers = [{ sTitle: 'Event ID' }, { sTitle: 'Type' }, { sTitle: 'Target' }, { sTitle: 'Start-time' }, { sTitle: 'End-time' }, { sTitle: 'BGPStream url' }, { sTitle: 'RIPEstat url' }];
		$(table).DataTable({"columns":headers}).draw( false );
	};

	var prepareObjectToTable = function(k,object){
		var copy = Object.assign({}, object);
		var ripestat_url = ripe_url(object);
		var bgpstream_link = "<a target='_blank' rel='noopener noreferrer' href='"+copy['bgpstreamlink']+"'>BGPStream link</a>";
		copy["ripestat_url"]="<a target='_blank' rel='noopener noreferrer' href='"+ripestat_url+"'>RIPEStat link</a>";
		copy["bgpstreamlink"]=bgpstream_link;
		copy["id"]=k;
		return copy;
	};
	var ripe_url = function(object) {
		var link = ripestat_link;
		link+="w.resource="+object["target"]+"&";
		link+="w.starttime="+moment(object["starttime"]).format("X")+"&";
		link+="w.endtime="+moment(object["endtime"]).format("X");
		return link;
	};
	var populateWithCache = function(){
		makeDomTable();
		var key_pos=0;
		var keys = Object.keys(storage);
		var keys_size = keys.length;
		if(keys_size>0){
			$(output_div).html("Restored cached collection (cached "+keys_size+", skipped "+skiplist.length+")");
			for(var i=0; i<keys_size; i++){
				var k = keys[i];
				var o = storage[k];
				var prepared = prepareObjectToTable(k,o);	
				addToTable(prepared,table);
			}
		}
		else 
			$(output_div).html("Cache is empty");
	};
	
	return {
		init: init,
		update: update,
		crawl: crawl,
		loadCache: loadCache,
		populateWithCache: populateWithCache,
		makeDomTable:makeDomTable
	};
});