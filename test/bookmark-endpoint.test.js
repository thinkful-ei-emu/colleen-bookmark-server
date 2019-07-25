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
    context('Given an XSS attack', () => {
      const maliciousBookmark = {
        id: 911,
        title: 'Naughty <script>alert("xss")</script>',
        url:'www.badboy.com',
        description: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
        rating: 1
      };
      beforeEach('insert malicious bookmark', ()=> {
        return db
        .into('bookmarks_list')
        .insert([maliciousBookmark]);
      });
      it('removes XSS attack content', ()=>{
        return supertest(app)
        .get(`/bookmark/${maliciousBookmark.id}`)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(200)
        .expect(res=>{
          // eslint-disable-next-line no-useless-escape
          expect(res.body.title).to.equal('Naughty &lt;script&gt;alert(\"xss\")&lt;/script&gt;');
          // eslint-disable-next-line quotes
          expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`);
        });
      });
    });
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
          .expect(404, { error: { message: 'Bookmark does not exist' } });
      });
    });
  });

  describe('/POST bookmark', () => {
    it('creates a bookmark, responding with 201 and the new bookmark', () => {
      const newBookmark = {
        title: 'new bookmark added',
        url: 'www.thing.org',
        rating: 2
      };

      return supertest(app)
        .post('/bookmark')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.headers.location).to.eql(
            `/bookmark/${res.body.bookmark.id}`
          );
          expect(res.body.bookmark).to.have.property('id');
          expect(res.body.bookmark.title).to.eql(newBookmark.title);
          expect(res.body.bookmark.url).to.eql(newBookmark.url);
          expect(res.body.bookmark.rating).to.eql(newBookmark.rating);
        })
        .then(postRes => {
          supertest(app)
            .get(`/bookmark/${postRes.body.bookmark.id}`)
            .expect(postRes.body.bookmark);
        });
    });
    const requiredFields = ['title', 'url', 'rating'];
    requiredFields.forEach(field => {
      const newBookmark = {
        title: 'Test bookmark',
        url: 'www.pop.com',
        rating: '3'
      };
      it(`responds with 400 and an error message when ${field} is missing`, () => {
        delete newBookmark[field];
        return supertest(app)
          .post('/bookmark')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send(newBookmark)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` }
          });
      });
    });
  });
  describe('/DELETE bookmark/:id', ()=>{
    context('Given there are bookmarks in the db',()=>{
      const testItems = makeBookmarksList();
      beforeEach('insert bookmarks', ()=>{
        return db
        .into('bookmarks_list')
        .insert(testItems);
      });
      it('responds with a 204 and removes the bookmark', ()=>{
        const idToRemove = 2;
        const expectedItems = testItems.filter(item => item.id !== idToRemove);
        return supertest(app)
        .delete(`/bookmark/${idToRemove}`)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(204)
        .then(res=>{
          supertest(app)
          .get('/bookmark')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(expectedItems);
        });
      });
    });
    context('Given no bookmarks in db', ()=>{
      it('responds with 404', ()=>{
        const nonexistentId=12345;
        return supertest(app)
        .delete(`/bookmark/${nonexistentId}`)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(404, {error: {message: "Bookmark doesn't exist"}});
      });
    });
  });
});
