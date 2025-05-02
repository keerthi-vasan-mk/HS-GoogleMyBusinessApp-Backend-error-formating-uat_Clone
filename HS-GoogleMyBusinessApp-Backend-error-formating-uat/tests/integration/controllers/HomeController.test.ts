import * as request from 'supertest';
import { App } from '../../../src/App';

describe('Application is running', () => {
  it('should return 200', async () => {
    const app = new App(5000).app;

    const response = await request(app).get('/api/healthcheck');
    expect(response.status).toEqual(200);
    expect(response.body).toMatchObject({
      success: true
    });
  });
});
