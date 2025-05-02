import { GRefreshToken } from '../../../src/entity/GRefreshToken';
import { createConnection } from 'typeorm';

describe('GAccessToken Entity', () => {
  let connection;

  beforeAll(async () => {
    connection = await createConnection();
  });

  afterAll(() => {
    connection.close();
  });

  it('creates entity', async() => {
    const token = new GRefreshToken();
    expect(token).toBeDefined();
  });

  it('saves and finds entity', async() => {
    const token = new GRefreshToken();
    const uid = 'tesing' + +new Date();

    token.uid = uid;
    token.pid = 'testing';
    token.refresh_token = 'testing';
    token.revoked = false;
    await token.save();

    const result = await GRefreshToken.findOne({ uid: uid });
    expect(result.uid).toEqual(uid);
  });
});