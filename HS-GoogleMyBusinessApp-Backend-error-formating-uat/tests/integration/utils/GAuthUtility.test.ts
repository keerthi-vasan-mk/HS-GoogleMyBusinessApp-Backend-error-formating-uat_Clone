import { GAuthUtility } from '../../../src/utils/GAuthUtility';
import { GAccessToken } from '../../../src/entity/GAccessToken';
import { GRefreshToken } from '../../../src/entity/GRefreshToken';
import { createConnection } from 'typeorm';

describe('Google Auth Utility', () => {
  let connection;

  beforeAll(async () => {
    connection = await createConnection();
  });

  afterAll(async() => {
    connection.close();
  });

  it('saves new access token', async () => {
    const token = 'testToken';
    const uid = 'testing' + +new Date();
    const pid = 'testing';

    await GAuthUtility.saveAccessToken(token, uid, pid);
    const result = await GAccessToken.findOne({ uid: uid });
    expect(result.uid).toEqual(uid);
  });

  it('saves refresh access token', async () => {
    const token = 'testToken';
    const uid = 'testing' + +new Date();
    const pid = 'testing';

    await GAuthUtility.saveRefreshToken(token, uid, pid);
    const result = await GRefreshToken.findOne({ uid: uid });
    expect(result.uid).toEqual(uid);
  });
});