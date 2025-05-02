import * as request from 'supertest';
import { App } from '../../../src/App';

describe('Hootsuite user can log in', () => {
  let app;

  beforeAll(() => {
    app = new App(5000).app;
  });

  it('return new JWT', async () => {
    const url = '/api/auth/login';
    const data = {
      uid: 'kitarmst',
      pid: '3d42d3',
      ts: 12345,
      token: '5fb6b6b4863edc4547c9f9955d766402d394011b8dec2bed085ce7813715a2b76b4370588adad61c062330fa76903356f8f24dcfd34a40c4c5351979bccbcd1a'
    };

    const response = await request(app).post(url).send(data);

    expect(response.status).toEqual(200);
    expect(response.body.token).toBeDefined();
  });

  it('fail with invalid login token', async () => {
    const url = '/api/auth/login?' +
                'uid=kitarmst&' +
                'pid=3d42d3' +
                '&ts=12345' +
                '&token=notValid';
    const response = await request(app).get(url);

    expect(response.status).toEqual(401);
  });

  it('fail with invalid Hootsuite username', async () => {
    const url = '/api/auth/login?' +
                'uid=notValid&' +
                'pid=3d42d3' +
                '&ts=12345' +
                '&token=5fb6b6b4863edc4547c9f9955d766402d394011b8dec2bed085ce7813715a2b76b4370588adad61c062330fa76903356f8f24dcfd34a40c4c5351979bccbcd1a';
    const response = await request(app).get(url);

    expect(response.status).toEqual(401);
  });
});
