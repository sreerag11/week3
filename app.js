var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const hbs = require('hbs');
const mongoose = require('mongoose');
const session = require('express-session')
const date = require('date-and-time');
const authMiddlewere = require('./app/middlewares/auth');
require('dotenv').config();
const { DB_URL, SEC_KEY, LOGOUT_TIME } = process.env;

//Set up default mongoose connection
var mongoDB = DB_URL;
mongoose.connect( mongoDB, {
  useNewUrlParser: true, 
  useUnifiedTopology: true
} );
//Get the default connection
const db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var indexRouter = require('./app/routes/index');
var usersRouter = require('./app/routes/users');
var loginRouter = require('./app/routes/login');

var app = express();

// Session settings
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: SEC_KEY,
  resave: true,
  saveUninitialized: true,
  cookie: { 
    secure: false,
    maxAge: parseInt(LOGOUT_TIME)
  }
}))

// view engine setup
hbs.registerHelper('getIndex', (value, options) => {
  return parseInt(value) + 1;
});
hbs.registerHelper('dateFormat', (value, options) => {
  return date.format(value, "MMM DD, YYYY");
});
hbs.registerHelper('for_loop', function(n, block) {
  var accum = '';
  for(var i = 0; i < n; ++i)
      accum += block.fn(i);
  return accum;
});
hbs.registerHelper('for_loop_plus_one', (n, block) => {
  var accum = '';
  for(var i = 1; i < n+1; ++i)
      accum += block.fn(i);
  return accum;
});
hbs.registerHelper('ifCond', (v1, v2, options) => {
  if(v1 === v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/app/views/partials');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/login', loginRouter);
app.use('/users', authMiddlewere.auth, usersRouter);
app.use('/', authMiddlewere.auth, indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
