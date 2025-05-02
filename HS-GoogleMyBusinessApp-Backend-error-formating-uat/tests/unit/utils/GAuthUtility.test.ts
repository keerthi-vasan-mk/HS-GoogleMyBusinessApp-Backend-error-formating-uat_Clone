import { GAuthUtility } from '../../../src/utils/GAuthUtility';
import { OAuth2Client } from 'google-auth-library';
jest.mock('google-auth-library');

const mocked = new OAuth2Client() as jest.Mocked<OAuth2Client>;
mocked.getToken.mockImplementation(() => {
  return Promise.resolve({
    tokens: {
      refresh_token: 'test',
      expiry_date: 12345,
      access_token: 'test',
      token_type: 'test',
      id_token: 'test'
    }
  });
});

const mockTicket = {
  getPayload: jest.fn(() => ({
    sub: '12345',
    name: 'test'
  }))
};
mocked.verifyIdToken.mockImplementation(() => {
  return Promise.resolve(mockTicket);
});

describe('GAuthUtility', () => {

  beforeAll(() => {
    process.env.GOOGLE_CLIENT_ID = 'testing';
    process.env.GOOGLE_CLIENT_SECRET = 'testing';
    process.env.GOOGLE_REDIRECT_URI = 'testing';
  });

  afterAll(() => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_REDIRECT_URI;
  });

  describe('`getAuthenticatedTokens` method', () => {

    it('Returns correct tokens and calls `getToken`', async () => {
      const expectedResult = {
        refresh_token: 'test',
        expiry_date: 12345,
        access_token: 'test',
        token_type: 'test',
        id_token: 'test'
      };

      const tokens = await GAuthUtility.getAuthenticatedTokens('12345');

      expect(tokens).toStrictEqual(expectedResult);
      expect(mocked.getToken).toHaveBeenCalled();
    });
  });

  describe('`getUserDetails` method', () => {

    it('Returns user ID and name and calls `verifyIdToken`', async () => {
      const expectedDetails = {
        userId: '12345',
        userName: 'test'
      };

      const userDetails = await GAuthUtility.getUserDetails('12345');

      expect(userDetails).toStrictEqual(expectedDetails);
      expect(mocked.verifyIdToken).toHaveBeenCalled();
    });
  });
});