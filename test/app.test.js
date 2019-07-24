
const app = require('../src/app');

describe('App', ()=>{
  it('should return 200 "hello world!"', ()=>{
    return supertest(app)
      .get('/')
      .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
      .expect(200, 'hello, world!');
    
  });
});