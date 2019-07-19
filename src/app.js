/* eslint-disable strict */
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');

const bookmarkRouter = require('./bookmark/bookmark.router');
const logger = require('./logger.js');
const { NODE_ENV } = require('./config');
const app = express();
//if production, want morgan to change based on prod vs dev
const morganOption = (NODE_ENV === 'production' 
  ? 'common' 
  : 'tiny');
 
app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());
app.use(function authorizeUserToken(req, res, next){
  let apiToken = process.env.API_TOKEN;
  let authToken = req.get('Authorization');
  if(!authToken || authToken.split(' ')[1] !== apiToken){
    logger.error(`Unauthorized request to path: ${req.path} `);
    return res.status(401).json({error: 'Unauthorized request'});
  }
  next();
});

app.use(function errorHandler(error, req, res, next){
  let response;
  if (NODE_ENV === 'production') {
    response = { error : { message: 'server error'}};
  } else {
    console.error (error);
    response = { message: error.message, error };
  }
  logger.error('Server error');
  res.status(500).json(response);
});

app.use(bookmarkRouter);

module.exports = app;