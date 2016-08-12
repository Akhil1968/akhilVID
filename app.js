var express = require('express');
var handlebars = require('express-handlebars');
var bodyparser = require('body-parser');
var session = require('express-session'); 
var net = require('net');
var fs = require('fs');
var util = require('util');

var app = express();
app.use(express.static(__dirname + "/public"));

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:false}));

app.use(session({secret: "secret",  resave : true,  saveUninitialized : false}));

var routes = require('./routes/routes.js');

app.set('view engine', 'handlebars');
app.engine('handlebars', handlebars({defaultLayout:'layout'}));

var videoHandler = function(req, res){
  var interestValue = req.query.interest;
  var myfile;
  console.log("received interestValue  as " + interestValue);

  if (interestValue === 'meanintro'){
    myfile = __dirname + '/videos/MeanStack.mp4';
  }else if (interestValue === 'x'){
    myfile = __dirname + '/videos/x.mp4';
  }else if (interestValue === 'y'){
    myfile = __dirname + '/videos/y.mp4';
  }

  var total = fs.statSync(myfile).size;

  if (req.headers['range']) {
    var range = req.headers.range;
    var parts = range.replace(/bytes=/, "").split("-");
    var partialstart = parts[0];
    var partialend = parts[1];

    var start = parseInt(partialstart, 10);
    var end = partialend ? parseInt(partialend, 10) : total-1;
    var chunksize = (end - start) + 1;
    console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);

    var file = fs.createReadStream(myfile, {start: start, end: end});
    res.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'video/mp4' });
    file.pipe(res);
  } else {
    console.log('ALL: ' + total);
    res.writeHead(200, { 'Content-Length': total, 'Content-Type': 'video/mp4' });
    fs.createReadStream(myfile).pipe(res);
  }

}//videoHandler


app.get('/', routes.loginHandler);
app.get('/logout', routes.logoutHandler);
app.get('/toLanding', routes.landingHandler);
app.get('/toVideo', videoHandler);

app.use("*", function(req, res) {
     res.status(404);
     res.render('404.handlebars', {});
});

app.use(function(error, req, res, next) {
     console.log('Error : 500::' + error);
     res.status(500);
     res.render('500.handlebars', {err:error});  // good for knowledge but don't do it
});


var port = process.env.PORT || 3000;

console.log("Checking the availability of port %d", port);
var netServer = net.createServer();
netServer.once('error', function(err) {
  if (err.code === 'EADDRINUSE') {
    console.log("port %d is currently in use", port);
  }
});


netServer.listen(port, function(){
	console.log('Net server is able to listen on port: ' + port);
	netServer.close();
	console.log('Closing Net server on port: ' + port);

	app.listen(port, function(){
		console.log('port %d is available. Hence starting the HTTP server on it.', port);
	});
});
