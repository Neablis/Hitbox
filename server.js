 var express = require("express");
 var app = express();
 
 /* serves all the static files */
 app.get(/^(.+)$/, function(req, res){
     console.log('static file request : ' + req.params);
     res.sendFile( __dirname + req.params[0]);
 });
 
 var port = process.env.PORT || 5000;
 app.listen(port, function() {
   console.log("Listening on " + port);
 });
