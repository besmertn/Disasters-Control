let createError = require('http-errors'),
    express = require('express'),
    bodyParser = require("body-parser"),
    path = require('path'),
    cookieParser = require('cookie-parser'),
    config = require('./config'),
    logger = require('morgan');

let entryRouter =         require('./routes/entry'),
    registrationRouter =  require('./routes/registration'),
    authorisationRouter = require('./routes/authorisation'),
    indexRouter =         require('./routes/index'),
    accountRouter =       require('./routes/account'),
    moderationRouter =    require('./routes/moderation');

let app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev', {
  skip: function (req, res) { return req.originalUrl.indexOf(".") != -1; }
}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/js", express.static(__dirname + '/public/js'));
app.use("/css", express.static(__dirname + '/public/css'));
app.use("/img", express.static(__dirname + '/public/img'));
app.use("/fonts", express.static(__dirname + '/public/fonts'));

app.all("*", entryRouter);
app.use('/', indexRouter);
app.use('/registration', registrationRouter);
app.use('/authorisation', authorisationRouter);
app.use('/account', accountRouter);
app.use('/moderation', moderationRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
