const request = require('supertest');
const app = require('../server');

describe('API Endpoints', () => {
  it('GET /health should return 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  it('POST /chat without message should return 400', async () => {
    const res = await request(app)
      .post('/chat')
      .send({ history: [] }); // Missing 'message'
      
    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /chat with standard greeting should intercept and return instantly', async () => {
    const res = await request(app)
      .post('/chat')
      .set('x-session-id', 'test-uuid-1')
      .send({ message: 'hi', history: [] });
      
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('reply');
    expect(res.body.reply).toContain('Hello! I am your AI Learning Companion');
  });
});
