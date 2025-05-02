import { App } from '../../src/App';
jest.mock('multer-s3', () => {
  return jest.fn().mockImplementation(() => {});
});

describe('App', () => {
  it('Creates the app', () => {
    const app = new App(3000);
    expect(app).toBeDefined();
  });
});
