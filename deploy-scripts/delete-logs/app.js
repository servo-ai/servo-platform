var express = require("express");
var couchbase = require("couchbase");
var app = express();
       
var bucket = (new couchbase.Cluster( "couchbase://ec2-52-36-147-50.us-west-2.compute.amazonaws.com"))
                    .openBucket("FSM","bestbots");

var ViewQuery = couchbase.ViewQuery;
var query = ViewQuery.from('dev_log', 'logview');

//query.range("user::", "user::" + "\u02ad", false);
query.limit(1000).full_set(true).stale(ViewQuery.Update.BEFORE);
var d = 0;
function del1000() {
    console.log('query ',d++)
    bucket.query(query, function(error, results) {
    if(error) {
        return console.log(error);
    }
    console.log("Found " + results.length + " documents to delete");
    for(i in results) {
        function del(i) {
            bucket.remove(results[i].id, function(error, result) {
                console.log("Deleting " + i + " " + results[i].key,error);
                if (i>=999) {
                    del1000();
                }
            });
        }
        del(i);
        
    }
});
}

del1000();


var server = app.listen(3001, function () {
    console.log("Listening on port %s...", server.address().port);
});