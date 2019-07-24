/* eslint-disable strict */
//js file to keep track of .env values
//and set defaults as necessary

module.exports = {
  PORT: process.env.PORT ||8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_URL: process.env.DB_URL 
};