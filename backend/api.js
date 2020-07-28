const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

require('dotenv').config();

const api = express();
const indexRouter = require('./routes/index')

api.use(cors());
api.use(logger('dev'));
api.use(express.json());
api.use(express.urlencoded({ extended: false }));
api.use(cookieParser());
api.use(express.static(path.join(__dirname, 'public')));

api.use('/', indexRouter);

// catch 404 and forward to error handler
api.use(function (req, res, next) {
  next(createError(404));
});

// error handler
api.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.error({ error: 'true' });
});

module.exports = api;
