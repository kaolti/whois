var http = require('http');
var https = require('https');
var whois = require('whois');
var url = require('url');
var parser = require('parse-whois');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

// Import config file with SSL certificates
var config = require('./config');

const PORT = 9118;
var dbGlobal = {};

MongoClient.connect(config.url, function(err, db) {
    if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
    } else {
        console.log('Connection established to DB');
        dbGlobal = db;
    }
});


function checkUpvotes(domainName, callback){
  var collection = dbGlobal.collection('domains');
  console.log("Checking number of upvotes for domain:" + domainName);

  try {
  collection.findOne({domain:domainName}, function(err, item){

    if(err || !item){

      console.log("Entry doesn't exist, return 0");
      callback(0);

    } else {
      console.log("Entry exists");
      console.log(item.upvotes);
      callback(item.upvotes);
    }
  });

} catch (err){
  callback(0);
}



}

function insertDomain(domainName, response) {

    var collection = dbGlobal.collection('domains');
    console.log("Inserting domain:" + domainName + " into DB");
    var document = {
        domain: domainName,
        upvotes: 1
    };

    collection.findOne({domain:domainName}, function(err, item){

      if(err || !item){

        console.log("Entry doesn't exist, will try to insert "+document);
        collection.insert(document, function(err, result) {
            if (err) {
                console.log("Error inserting into DB");
                return (err);
            } else {
                console.log(result);
                return (result);
            }

        });


      } else {
        console.log("Entry exists, will increase upvotes");
        console.log(item);
        collection.update(item, { $inc: {"upvotes": 1 } })
      }
    });




}




function handleRequest(request, response) {

    var url_parts = url.parse(request.url, true);
    var query = url_parts.query;



    console.log(query);
    console.log("Sending response");

    try {
        //console.log("Trying to insert: " + query.domain);

        if (query.domain) {

            if(query.upvote == "true"){
              console.log("upvote click");
              insertDomain(query.domain, function(data){
                console.log("done");
                response("upvoted");
              });
            }

            var responseJSON = {};

            checkUpvotes(query.domain, function(data){
              console.log("checkupvotes returns: "+data)
              console.log(data);
              responseJSON.upvotes = data;
            });




            whois.lookup(query.domain, function(err, data) {
                response.setHeader('content-type', 'application/json');
                //console.log(data);
                console.log("JSON: ");
                //console.log(parser.parseWhoIsData(data));
                try {
                    var dataJSON = parser.parseWhoIsData(data);
                } catch (err) {
                    console.log(err);
                }


                try {
                    responseJSON.registrantOrganization = dataJSON.find(x => x.attribute === 'Registrant Organization').value;
                    responseJSON.registrantName = dataJSON.find(x => x.attribute === 'Registrant Name').value;
                    responseJSON.adminOrganization = dataJSON.find(x => x.attribute === 'Admin Organization').value;
                    responseJSON.adminName = dataJSON.find(x => x.attribute === 'Admin Name').value;

                } catch (err) {
                    console.log(err);
                }
                console.log(JSON.stringify(responseJSON));


                //console.log(dataJSON[2]);



                responseJSON.upvotes =
                response.write(JSON.stringify(responseJSON));
                response.end();
            });

        }

    } catch (err) {

    }
}

//Create a server
var server = https.createServer(config.options, handleRequest);

server.listen(PORT, function() {
    console.log("Server listening on: https://localhost:%s", PORT);
});
