var express = require('express');
var path = require('path');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var cors = require('cors');
var https = require('https');
var fs = require('fs');

// config 
var config = require("./config");

// add this path to requires
require('app-module-path').addPath(__dirname);

var FSMManager = require('./FSM/fsm-manager');

var app = express();
app.use(cors());

// set the routes and model
var api = require('./routes/api');
var apidb = require('./routes/apidb');
var apiprocess = require('./routes/apiprocess');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.json({
  limit: '5mb'
}));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());

app.use(morgan('combined'));

var baseUrl = config.baseUrl;
app.get('/', function (req, res) {
  res.send('all ok');
});


app.use(baseUrl + '/api', api);
app.use(baseUrl + '/apidb', apidb);
app.use(baseUrl + '/apiprocess', apiprocess);

module.exports = app;

// TODO: move after startAll 
var httpServoServer = app.listen((config.port || 3000), function () {
  console.log('server app listening on port ' + (config.port || 3000));
});
app.httpServoServer = httpServoServer;

var dblogger = require('utils/dblogger');
FSMManager.startAll(app).then((count) => {
  dblogger.log('started all processes for ' + count + ' fsms');

}).catch((ex) => {
  dblogger.error('could not start all trees, exiting:', ex)
});

if (config.openSSL) {
  var certDir = 'certificates/' + config.serverBaseDomain;
  var options = {
    ca: fs.readFileSync(certDir + '/chain.pem'),
    key: fs.readFileSync(certDir + '/privkey.pem'),
    cert: fs.readFileSync(certDir + '/cert.pem')
  };
  var secured = https.createServer(options, app);
  try {
    app.httpServoServer =


      secured.listen(443);
    console.log('server listens on 443');
    // now that we have an httpServer we can start the debug
    require('routes/apidebug').start(app);

  } catch (e) {
    console.error(e);
  }
} else {
  // now that we have an httpServer we can start the debug
  require('routes/apidebug').start(app);

}
app.use(baseUrl, function (req, res, next) {
  console.log(req.path + "," + req.url + "," + req.baseUrl);
  next();
})
app.use(baseUrl + "/cognility", function (req, res) {

  console.log('req.url', req.url, req.path, req.originalUrl);
  req.url = "/web-chat/index.html";
  req.path = "/web-chat/index.html";
  req.baseUrl = "/web-chat/index.html"
  req.originalUrl = "/web-chat/index.html";
  console.log('req.url', req.url);
  // app.handle(req, res); 
  return res.sendFile(path.resolve("public/web-chat/index.html"));
});
app.use(baseUrl, express.static(path.join(__dirname, 'public')));


// app.use(baseUrl+"/cognility/.*",express.static(path.join(__dirname, 'public/web-chat')))