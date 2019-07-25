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

  afterEach('clean up', () =>
    db('bookmarks_list').truncate());

  describe('GET /api/bookmark', () => {
    context('Given there are articles in db', () => {
      const testList = makeBookmarksList();
      beforeEach('insert bookmarks', () => {
        return db.insert(testList).into('bookmarks_list');
      });
      afterEach('clean up table', () => db('bookmarks_list').truncate());

      it('responds 200 with bookmarks', () => {
        return supertest(app)
          .get('/api/bookmark')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testList);
      });
    });
    context('Given there are no articles in db', () => {
      it('responds 200 with empty array', () => {
        return supertest(app)
          .get('/api/bookmark')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .then(res => {
            expect(res.body).to.eql([]);
          });
      });
    });
  });

  describe('/GET /api/bookmark/:id', () => {
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
        .get(`/api/bookmark/${maliciousBookmark.id}`)
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
          .get(`/api/bookmark/${testID}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedItem);
      });
    });
    context('Given there are no articles in db', () => {
      it('it responds 404', () => {
        return supertest(app)
          .get('/api/bookmark/1')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: "Bookmark doesn't exist" } });
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
        .post('/api/bookmark')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.headers.location).to.eql(
            `/api/bookmark/${res.body.bookmark.id}`
          );
          expect(res.body.bookmark).to.have.property('id');
          expect(res.body.bookmark.title).to.eql(newBookmark.title);
          expect(res.body.bookmark.url).to.eql(newBookmark.url);
          expect(res.body.bookmark.rating).to.eql(newBookmark.rating);
        })
        .then(postRes => {
          return supertest(app)
            .get(`/api/bookmark/${postRes.body.bookmark.id}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(res=>{
              expect(res.body).to.have.all.keys('id', 'title', 'description', 'rating', 'url')
            });
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
          .post('/api/bookmark')
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
        .delete(`/api/bookmark/${idToRemove}`)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(204)
        .then(()=>{
          return supertest(app)
          .get('/api/bookmark')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(expectedItems);
        });
      });
    });
    context('Given no bookmarks in db', ()=>{
      it('responds with 404', ()=>{
        const nonexistentId=12345;
        return supertest(app)
        .delete(`/api/bookmark/${nonexistentId}`)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(404, {error: {message: "Bookmark doesn't exist"}});
      });
    });
  });
  describe('/PATCH bookmark:id',()=>{
    context('given bookmark exists',()=>{
      const testList = makeBookmarksList();
      beforeEach('insert bookmarks', ()=>{
        return db
          .into('bookmarks_list')
          .insert(testList);
      });
      it('updates bookmark with given new information', ()=>{
        const idToUpdate = 2;
        const testUpdateInfo = {
          title: 'a different title',
          rating: 2
        };
        const expectedItem = {
          ...testList[idToUpdate -1],
          ...testUpdateInfo
        }
        return supertest(app)
        .patch(`/api/bookmark/${idToUpdate}`)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .send(testUpdateInfo)
        .expect(204)
        .then(res=>{
          return supertest(app)
          .get(`/api/bookmark/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(expectedItem)
        })
      })
      it('returns 400 error when no fields supplied', ()=>{
        const idToUpdate = 2
        return supertest(app)
        .patch(`/api/bookmark/${idToUpdate}`)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .send({ irrelevantField: 'foo'})
        .expect(400, {
          error: {message: 'Request body must contain title, url, rating or description'}

        })
      })
      it('responds with 204 when updating only a subset of fields', ()=>{
        const idToUpdate =2
        const updateBookmark = {
          title: 'updated bookmark title'
        }
        const expectedBookmark = {
          ...testList[idToUpdate - 1],
          ...updateBookmark
        }
        return supertest(app)
        .patch(`/api/bookmark/${idToUpdate}`)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .send( {
          ...updateBookmark,
          fieldToIgnore: 'should not be included in GET'
        })
        .expect(204)
        .then(res=>
          supertest(app)
          .get(`/api/bookmark/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(expectedBookmark))
      })
    })
    
  })
});
