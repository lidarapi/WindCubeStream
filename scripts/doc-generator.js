
///////////////////////////////////////////////////////
//			JSON BEAUTIFIER
///////////////////////////////////////////////////////

if (!library)
	var library = {};

library.json = {
	replacer: function(match, pIndent, pKey, pVal, pEnd) {
		var key = '<span class=json-key>"';
		var val = '<span class=json-value>';
		var str = '<span class=json-string>';
		var r = pIndent || '';
		if (pKey)
			r = r + key + pKey.replace(/[": ]/g, '') + '"</span>: ';
		if (pVal)
			r = r + (pVal[0] == '"' ? str : val) + pVal + '</span>';
		return r + (pEnd || '');
	},
	prettyPrint: function(obj) {
		var jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/mg;
		return JSON.stringify(obj, null, 3)
		.replace(/&/g, '&amp;').replace(/\\"/g, '&quot;')
		.replace(/</g, '&lt;').replace(/>/g, '&gt;')
		.replace(jsonLine, library.json.replacer);
	}
};

///////////////////////////////////////////////////////
//	URL COPY
///////////////////////////////////////////////////////

function copyUrl(clickedAnchor) {
	var url = new URL(window.location.href);
	url.hash = clickedAnchor;
	let textArea = document.createElement("textarea");
	textArea.value = url.href;
	textArea.style.position = "fixed";
	textArea.style.left = "-999999px";
	textArea.style.top = "-999999px";
	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();
	document.execCommand('copy');
	textArea.remove();
	$.toast({text:"URL copied to clipboard",loader: false, allowToastClose: false});
}

///////////////////////////////////////////////////////
//	GET INTRODUCTION/DEFINITIONS AND DISPLAY IT
///////////////////////////////////////////////////////

const docGenerator = (version, introductionFile, definitionsFile, firstTime) => {

	$("#version").text(version); // definition version
	$(window).unbind('scroll');
	
	// Get Introduction first
	$.get( "./" + introductionFile, function( data ) {	
		var converter = new showdown.Converter({headerLevelStart:2, tables:true}); // init markdown reader
		var html = converter.makeHtml(data); // convert markdown to html
		var parsedHtml = $($.parseHTML(html)); // parse html
		parsedHtml.find("code").contents().unwrap(); // Extract code from code tags
		parsedHtml.find("code").remove(); // Remove code tags
		$("#intro_md").html(parsedHtml); // insert html in page
		$("#intro_md").find("pre").addClass("json"); // add json class to <pre> for json beautifying

		// Get definitions
		$.get( "./" + definitionsFile, function( data ) {
			var parseRequestsOrResponses = true; // true = parse requests, false = parse responses
			var responsesHeaderIndex = NaN;
			var csvParsed = Papa.parse(data).data;
			
			// Reset view to default
			$("#requests_csv").html("");
			$("#responses_csv").html("");
			$("#requests_items_csv").html("");
			$("#responses_items_csv").html("");
			
			for(var i=1;i<csvParsed.length;i++) {
				var currentLine = csvParsed[i];
				
				if(currentLine[0].length == 0) { // Skip empty lines
					continue;
				}
				
				if(currentLine[0] == "DELIMITER") {
					parseRequestsOrResponses = false; // after delimiter we parse responses.
					i+=1; // Skip responses headers line
					continue;
				}
				
				if(parseRequestsOrResponses) // If we parse REQUESTS
				{		
					const generateRequestPayloadParameters = () => {
						var concatenedParameters = "";
						currentLine[3].split("\n").forEach(currentItem => {
							var items = currentItem.split(";");
							concatenedParameters += "<tr><td>"+items[0]+"</td><td>"+items[1]+"</td><td>"+items[2]+"</td><td>"+items[3];
							if(items.length >= 5 && items[4].length > 0) {
								concatenedParameters += " (allowed values: ";
								items[4].split(",").forEach(it => { 
									concatenedParameters += "<span>"+it+"</span> ";
								});
								concatenedParameters += ")";
							}
						});
						concatenedParameters += "</td></tr>";
						
						
						return concatenedParameters;
					};
					
					const generateRequestExamples = () => {
						var concatenedExamples = "";
						currentLine[4].split(";").forEach(item => {
							concatenedExamples += "<pre class=\"json\">"+item+"</pre>";
						});
						return concatenedExamples;
					};
					
					const generateErrorsExamples = () => {
						var concatenedExamples = "";
						currentLine[7].split(";").forEach(item => {
							concatenedExamples += "<pre class=\"json\">"+item+"</pre>";
						});
						return concatenedExamples;
					};
					
					const generateRecurringResponses = () => {
						var concatenedRecurringResponses = "";
						currentLine[6].split(",").forEach(item => {
							concatenedRecurringResponses += "<a class=\"message-link\" href=\"#res_"+item+"\">"+item+"</a> ";
						});
						return concatenedRecurringResponses;
					}
					
					$("#requests_items_csv").html($("#requests_items_csv").html()
					+ "<li><a href=\"#req_"+currentLine[1]+"\">"+currentLine[0]+"</a></li>"); // event & name
					
					$("#requests_csv").html($("#requests_csv").html() 
					+ "<h3 id=\"req_"+currentLine[1]+"\">"+currentLine[0]+" <a class=\"anchor\" onclick=\"copyUrl('#req_"+currentLine[1]+"')\">#</a></h3>" // event & name
					+ currentLine[2] // description
					+ "<h4>Request payload parameters</h4>"
					+ "<table><tr><th width='20%'>Name</th><th width='10%'>Type</th><th width='10%'>Optional</th><th>Description</th></tr>"
					+ generateRequestPayloadParameters()
					+ "</table>"
					+ "<h4>Request examples</h4>"
					+ generateRequestExamples()
					+ "<h4>Success responses</h4>"
					+ "Immediate response: " + (currentLine[5].length>0? "<a class=\"message-link\" href=\"#res_"+currentLine[5]+"\">"+currentLine[5]+"</a>" : "None") + "<br><br>"
					+ "Recurring responses: " + (currentLine[6].length>0? generateRecurringResponses() : "None")
					+ "<h4>Error responses examples</h4>"
					+ "Errors are returned as <a class=\"message-link\" href=\"#res_error\">error</a> messages"
					+ generateErrorsExamples()
					);
				} else { // We parse RESPONSES
					const generateResponsePayloadParameters = () => {
						var concatenedParameters = "";
						currentLine[3].split("\n").forEach(currentItem => {
							var items = currentItem.split(";");
							concatenedParameters += "<tr><td>"+items[0]+"</td><td>"+items[1]+"</td><td>"+items[2]+"</td><td>"+items[3];
							if(items.length >= 5 && items[4].length > 0) {
								concatenedParameters += " (possible values: ";
								items[4].split(",").forEach(it => { 
									concatenedParameters += "<span>"+it+"</span> ";
								});
								concatenedParameters += ")";
							}
						});
						concatenedParameters += "</td></tr>";
						
						
						return concatenedParameters;
					};
					
					const generateResponseExamples = () => {
						var concatenedExamples = "";
						currentLine[4].split(";").forEach(item => {
							concatenedExamples += "<pre class=\"json\">"+item+"</pre>";
						});
						return concatenedExamples;
					};
					
					$("#responses_items_csv").html($("#responses_items_csv").html()
					+ "<li><a href=\"#res_"+currentLine[1]+"\">"+currentLine[0]+"</a></li>"); // event & name
					
					$("#responses_csv").html($("#responses_csv").html() 
					+ "<h3 id=\"res_"+currentLine[1]+"\">"+currentLine[0]+" <a class=\"anchor\" onclick=\"copyUrl('#res_"+currentLine[1]+"')\">#</a></h3>" // event & name
					+ (currentLine[5] != "" ? "<b>Permission: " + currentLine[5] + "</b><br>" : "")
					+ currentLine[2] // description
					+ "<h4>Response payload parameters</h4>"
					+ "<table><tr><th width='20%'>Name</th><th width='10%'>Type</th><th width='10%'>Optional</th><th>Description</th></tr>"
					+ generateResponsePayloadParameters()
					+ "</table>"
					+ "<h4>Response examples</h4>"
					+ generateResponseExamples()
					);
				}
			}
			
			$('pre[class="json"]').each(function( index ) {
				try {
					$(this).html(library.json.prettyPrint(JSON.parse($(this).text())));
				} catch(err) {
					$(this).html("<i>"+$(this).html() + "</i>\n<font color='red'>" + err + "</font>");
				}	
			});
								
			// ANCHOR TESTS
			{
				// Cache selectors
				var topMenu = $("#sidebar");
				var topMenuHeight = 5;
				// All list items
				var menuItems = topMenu.find("a");
				// Anchors corresponding to menu items
				var scrollItems = menuItems.map(function(){
					var item = $($(this).attr("href"));
					if (item.length) { return item; }
				});

				// Bind to scroll
				$(window).bind('scroll', function() {
					// Get container scroll position
					var fromTop = $(this).scrollTop()+topMenuHeight;
					
					// Get id of current scroll item
					var cur = scrollItems.map(function(){
						if ($(this).offset().top < fromTop)
							return this;
					});
					// Get the id of the current element
					cur = cur[cur.length-1];
					var id = cur && cur.length ? cur[0].id : "";
					// Set/remove active class
					menuItems.parent().find("a").removeClass("active").end();
					menuItems.filter("[href='#"+id+"']").addClass("active");
				});
			}
			
			if(location.hash && firstTime)
				$(document).scrollTop( $(location.hash).offset().top ); // go to anchor when loading page
		});
	});
}

var versionsList = [];

$.get( "./versions.json", function( data ) {
	try {
		var versions = JSON.parse(data);
		if(Array.isArray(versions) && versions.length > 0 && versions[0].hasOwnProperty('version') && versions[0].hasOwnProperty('introductionFile') && versions[0].hasOwnProperty('definitionsFile')) {
			versionsList = versions;
			var defaultIndex = 0;
			const urlparameters = new URLSearchParams(window.location.search);
			if(urlparameters.has("v")) {
				for(var i=0; i<versions.length;i++) {
					if(urlparameters.get('v') == versions[i]["version"]) {
						defaultIndex = i;
						break;
					}
				}
			}
			docGenerator(versions[defaultIndex]["version"], versions[defaultIndex]["introductionFile"], versions[defaultIndex]["definitionsFile"], true);
			for(var i=0; i<versions.length; i++) {
				$('#version-selector').append(new Option("Version "+versions[i].version, i));
			};
			$('#version-selector option[value='+defaultIndex+']').prop('selected', true);
			var url = new URL(window.location.href);
			url.searchParams.set('v', versions[defaultIndex]["version"]);
			window.history.replaceState({}, document.title, url.href);
		} else
			throw "JSON must be an array of objects containing 'version', 'introductionFile' and 'definitionsFile' properties";
	} catch (err) {
		alert("Error while reading versions.json file: " + err);
	}
}, "text");

$("#version-selector").change(function() {
	var index = $( this ).val();
	docGenerator(versionsList[index]["version"], versionsList[index]["introductionFile"], versionsList[index]["definitionsFile"], false);
	var url = new URL(window.location.href);
	url.searchParams.set('v', versionsList[index]["version"]);
	window.history.replaceState({}, document.title, url.href);
});