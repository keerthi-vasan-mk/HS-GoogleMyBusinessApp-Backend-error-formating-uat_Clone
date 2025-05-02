import { GAccessToken } from '../../../src/entity/GAccessToken';
import { createConnection } from 'typeorm';

describe('GAccessToken Entity', () => {
  let connection;

  beforeAll(async () => {
    connection = await createConnection();
    console.log(connection);
  });

  afterAll(() => {
    connection.close();
  });

  it('creates entity', async() => {
    const token = new GAccessToken();
    expect(token).toBeDefined();
  });

  it('saves and finds entity', async() => {
    const token = new GAccessToken();
    const id = new Date().getTime();

    token.id = id;
    token.access_token = 'testing';
    await token.save();

    const result = await GAccessToken.findOne({ id: id });
    console.log(result);
    expect(result.id).toEqual(id);
  });
});