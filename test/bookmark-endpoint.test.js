/* eslint-disable indent */

const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');

const { makeBookmarksList } = require('./bookmark.fixture');

describe('Bookmark Endpoints', function() {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db', db);
    return db;
  });

  before('clean the table', () => db('bookmarks_list').truncate());

  after('disconnect from db', () => db.destroy());

  afterEach('clean up', () => db('bookmarks_list').truncate());

  describe('GET /bookmark', () => {
    context('Given there are articles in db', () => {
      const testList = makeBookmarksList();
      beforeEach('insert bookmarks', () => {
        return db.insert(testList).into('bookmarks_list');
      });
      afterEach('clean up table', () => db('bookmarks_list').truncate());

      it('responds 200 with bookmarks', () => {
        return supertest(app)
          .get('/bookmark')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testList);
      });
    });
    context('Given there are no articles in db', () => {
      it('responds 200 with empty array', () => {
        return supertest(app)
          .get('/bookmark')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .then(res => {
            expect(res.body).to.eql([]);
          });
      });
    });
  });

  describe('/GET /bookmark/:id', () => {
    context('Given there are articles in db', () => {
      const testList = makeBookmarksList();
      beforeEach('insert bookmarks', () => {
        return db.insert(testList).into('bookmarks_list');
      });
      afterEach('clean up table', () => db('bookmarks_list').truncate());
      it('responds 200 with bookmark of specified ID', () => {
        const testID = 2;
        const expectedItem = testList[testID - 1];
        return supertest(app)
          .get(`/bookmark/${testID}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedItem);
      });
    });
    context('Given there are no articles in db', () => {
      it('it responds 404', () => {
        return supertest(app)
          .get('/bookmark/1')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {error: { message: 'Bookmark does not exist'}});
      });
    });
  });
});
