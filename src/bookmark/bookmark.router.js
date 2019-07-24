/* eslint-disable strict */
const express = require('express');
const uuid = require('uuid');
const logger = require('../logger');
const { bookmarks } = require('../store');
const { PORT } = require('../config');

const bookmarkRouter = express.Router();
const bodyParser = express.json();
const BookmarkService = require('../bookmark-service');

bookmarkRouter 
  .route('/bookmark')
  .get((req, res)=>{
    BookmarkService.getBookmarks(req.app.get('db'))
      .then(bookmarks=>{
        res.json(bookmarks);
      });
  })
  .post(bodyParser, (req, res)=>{
    const { title, url, description, rating } = req.body;
    const newArticle = { title, url, description, rating };
    BookmarkService.addBookmark(req.app.get('db'), newArticle)
      .then( bookmark => {
        res
          .status(201)
          .json({bookmark});
      });

    /* if(!title){
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


    //logger message to show success
    logger.info(`Bookmark with id ${newArticle.id} created`);

       */
  });

bookmarkRouter
  .route('/bookmark/:id')
  .get((req, res)=>{
    BookmarkService.getById(
      req.app.get('db'),
      req.params.id
    )
      .then(bookmark => {
        if(!bookmark){
          logger.error(`Bookmark with id ${req.params.id} not found`);
          return res.status(404).json({error: {message: 'Bookmark does not exist'}});
        }
        res.json({
          id: bookmark.id,
          rating: bookmark.rating,
          title: bookmark.title,
          description: bookmark.description,
          url: bookmark.url,
        });
      });

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