import { HsUtility } from '../../../src/utils/HsUtility';
import { LoginRequest } from '../../../src/interfaces/requests';
import { Stream } from '../../../src/entity/Stream';
jest.mock('../../../src/entity/Stream');

describe('HS Utility', () => {
  let uid,
      ts;

  beforeAll(() => {
    process.env.SHARED_SECRET = 'testing';

    uid = 'kitarmst';
    ts = '12345';
  });

  afterAll(() => {
    delete process.env.SHARED_SECRET;
  });

  describe('`checkLoginToken` method', () => {

    it('Check bad login token', () => {
      const token = 'badLoginToken';
      const request = { uid, ts, token } as LoginRequest;

      const result = HsUtility.checkLoginToken(request);
      expect(result).toBeFalsy();
    });

    it('Check valid login token', () => {
      // Set to a valid token. Must change if the `uid` or `ts` variables change.
      const token = '5fb6b6b4863edc4547c9f9955d766402d394011b8dec2bed085ce7813715a2b76b4370588adad61c062330fa76903356f8f24dcfd34a40c4c5351979bccbcd1a';
      const request = { uid, ts, token } as LoginRequest;

      const result = HsUtility.checkLoginToken(request);
      expect(result).toBeTruthy();
    });
  });

  describe('`getOrCreateStream` method', () => {

      it('Should create and return stream', async () => {
        const pid = '12345';
        const streamReference = { uid, pid };

        const stream = await HsUtility.getOrCreateStream(streamReference);
        expect(stream).toBeInstanceOf(Stream);
      });
  });
});