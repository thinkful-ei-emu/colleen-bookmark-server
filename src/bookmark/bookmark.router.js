/* eslint-disable strict */
const express = require("express");
//const uuid = require('uuid');
const logger = require("../logger");
//const { bookmarks } = require("../store");
//const { PORT } = require('../config');
const path = require('path');
const bookmarkRouter = express.Router();
const bodyParser = express.json();
const BookmarkService = require("../bookmark-service");
const xss = require("xss");

bookmarkRouter
  .route("/bookmark")
  .get((req, res) => {
    BookmarkService.getBookmarks(req.app.get("db")).then(bookmarks => {
      res.json(bookmarks);
    });
  })
  .post(bodyParser, (req, res) => {
    const { title, url, description='', rating } = req.body;
    const newBookmark = { title, url, description, rating };
    const requiredInfo = { title, url, rating };
    console.log('description:', description);
    for (const [key, value] of Object.entries(requiredInfo)) {
      if (value == null) {
        return res
          .status(400)
          .json({ error: { message: `Missing '${key}' in request body` } });
      }
    }

    BookmarkService.addBookmark(req.app.get("db"), newBookmark).then(
      bookmark => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl + `/${bookmark.id}`))
          .json({ bookmark });
      }
    );

    logger.info(`Bookmark with id ${newBookmark.id} created`);
  });

bookmarkRouter
  .route("/bookmark/:id")
  .all((req, res, next) => {
    BookmarkService.getById(req.app.get("db"), req.params.id)
      .then(bookmark => {
        if (!bookmark) {
          logger.error(`Bookmark with id ${req.params.id} not found`);
          return res.status(404).json({
            error: { message: "Bookmark doesn't exist" }
          });
        }
        res.bookmark = bookmark;
        next();
      })
      .catch(next);
  })
  .get((req, res) => {
    res.json({
      id: res.bookmark.id,
      rating: res.bookmark.rating,
      title: xss(res.bookmark.title),
      description: xss(res.bookmark.description),
      url: xss(res.bookmark.url)
    });
    
  })
  .delete((req, res) => {
    BookmarkService.deleteBookmark(req.app.get("db"), req.params.id).then(
      () => {
        res.status(204).end();
      }
    );
    logger.info(`Bookmark ${req.params.id} deleted`);
  })
  .patch(bodyParser, (req, res)=>{
    const { title, url, rating, description } = req.body;
    const bookmarkToUpdate = { title, url, rating, description };
    const numOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length;
    if(numOfValues === 0){
      return res.status(400).json({
        error: {message: 'Request body must contain title, url, rating or description'}
      });
    }
    BookmarkService.updateBookmark(req.app.get('db'), req.params.id, bookmarkToUpdate)
      .then(()=>{
        res.status(204).end();
      });
  });

module.exports = bookmarkRouter;
