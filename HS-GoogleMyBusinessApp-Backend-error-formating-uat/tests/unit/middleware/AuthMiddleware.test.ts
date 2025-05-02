import * as jwt from 'jsonwebtoken';
import { AuthMiddleware } from '../../../src/middleware/AuthMiddleware';

describe('Authentication Middleware', () => {
  let response,
      request,
      next,
      middleware;

  beforeAll(() => {
    middleware = new AuthMiddleware();
    request = {
      headers: []
    };
    response = {
      sendStatus: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    delete process.env.SECRET;
});

  it('handle invalid authorization headers', async () => {
    const spy = jest.spyOn(response, 'sendStatus');

    middleware.use(request, response, next);
    expect(spy).toBeCalledWith(401);
  });

  it('handle invalid token', async() => {
    const spy = jest.spyOn(response, 'sendStatus');

    request.headers['authorization'] = 'Bearer someInvalidToken';
    middleware.use(request, response, next);
    expect(spy).toBeCalledWith(401);
  });

  it('authenticates valid users', async() => {
    process.env.SECRET = 'testing';
    const pid = 'testingpid';
    const uid = 'testinguid';
    const token = jwt.sign({
        pid,
        uid
      },
      process.env.SECRET,
      { expiresIn: '24h' }
    );
    const spy = jest.spyOn(jwt, 'verify');

    request.headers['authorization'] = `Bearer ${token}`;
    middleware.use(request, response, next);
    expect(spy).toBeCalledWith(token, process.env.SECRET);
  });
});
