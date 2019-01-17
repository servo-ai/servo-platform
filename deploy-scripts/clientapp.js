var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


var app = express();
var routes = require('./routes/index');
// view engine setup
//
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

   var basicAuth = require('basic-auth-connect');
   app.use(basicAuth('servoai', 'bestbots'));
    
//app.use('/', routes);
app.use(function (req, res, next) {
 	if (path.extname(req.path).length > 0) {
	// normal static file request
	  next();
     }
      else {
	              // should force return `index.html` for angular.js
	            req.url = '/index.html';
	               next();
		                                                                                    }
	                             });
app.use(express.static(path.join(__dirname, 'dev')));
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.listen(8081, function () {
    console.log('server app listening on port 8081!');
});

module.exports = app;
