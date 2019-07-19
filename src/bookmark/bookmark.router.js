/* eslint-disable strict */
const express = require('express');
const uuid = require('uuid');
const logger = require('../logger');
const { bookmarks } = require('../store');
const { PORT } = require('../config');

const bookmarkRouter = express.Router();
const bodyParser = express.json();

bookmarkRouter 
  .route('/bookmark')
  .get((req, res)=>{
    res.json(bookmarks);
  })
  .post(bodyParser, (req, res)=>{
  
    const { title, url, description, rating } = req.body;

    if(!title){
      logger.error('Title is required');
      return res.status(400).send('Invalid data');
    }
    if(!url){
      logger.error('Url is required');
      return res.status(400).send('Invalid data');
    }
    if(!description){
      logger.error('Description is required');
      return res.status(400).send('Invalid data');
    }
    if(!rating){
      logger.error('Rating is required');
      return res.status(400).send('Invalid data');
    }

    const id = uuid();
    const bookmark = {
      id,
      title,
      url,
      description,
      rating
    };
    //if passes conditionals, add to bookmarks store
    bookmarks.push(bookmark);

    //logger message to show success
    logger.info(`Bookmark with id ${id} created`);

    res
      .status(201)
      .location(`http://localhost:${PORT}/${id}`)
      .json({bookmark});
  });

bookmarkRouter
  .route('/bookmark/:id')
  .get((req, res)=>{
    const { id } = req.params;
    const bookmark = bookmarks.find(b => b.id === id);

    if(!bookmark){
      logger.error(`Bookmark with id ${id} not found`);
      res.status(400).send('Bookmark not found');
    }
    res.json(bookmark);
  })
  .delete((req, res)=>{
    const { id } = req.params;
    const bookmarkIndex = bookmarks.findIndex(b => b.id === id );

    if(bookmarkIndex === -1){
      logger.error(`Bookmark with id ${id} not found`);
      res.status(400).send('Bookmark not found');
    }

    bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark ${id} deleted`);
    res
      .status(201)
      .end();
      
  });


module.exports = bookmarkRouter;