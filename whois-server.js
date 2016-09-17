//Lets require/import the HTTP module
var http = require('http');
var whois = require('whois');
var url = require('url');
var parser = require('parse-whois');

//Lets define a port we want to listen to
const PORT=9119; 

//We need a function which handles requests and send response
function handleRequest(request, response){
	
	
	var url_parts = url.parse(request.url, true);
	var query = url_parts.query;
	console.log("Sending response");
    	whois.lookup(query.domain, function(err, data) {
      		response.setHeader('content-type','application/json');
		//console.log(data);
		console.log("JSON: ");
		//console.log(parser.parseWhoIsData(data));
		try {
		var dataJSON = parser.parseWhoIsData(data);
		} catch(err){
		console.log(err);
		}
		var responseJSON ={};
		
		try {
		responseJSON.registrantOrganization = dataJSON.find(x=>x.attribute === 'Registrant Organization').value;
		responseJSON.registrantName = dataJSON.find(x=>x.attribute === 'Registrant Name').value;
		responseJSON.adminOrganization = dataJSON.find(x=>x.attribute === 'Admin Organization').value;
                responseJSON.adminName = dataJSON.find(x=>x.attribute === 'Admin Name').value;
		
		} catch (err) {
  			console.log(err);
		}
		console.log(JSON.stringify(responseJSON));
		

		//console.log(dataJSON[2]);
		response.write(JSON.stringify(responseJSON));
		response.end();
	});
}

//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function(){
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", PORT);
});
