const { MongoClient, ObjectID } = require('mongodb');
const { mongo } = require('./index');

jest.mock('mongodb');

describe('Mongo service', () => {
  mongo.wait_ms_for_retry = 1;
  let closeEvent;
  const mockClient = {
    db: () => ({
      on: (event, cb) => {
        if (event === 'close') closeEvent = cb;
      },
      collection: (name) => `success-${name}`,
    }),
    close: jest.fn(),
  };
  // @ts-ignore
  MongoClient.connect.mockRejectedValueOnce('AuthenticationFailed').mockResolvedValue(mockClient);
  it('connect fail first !', async () => {
    // this tes only call connect.
    // if connect leave exception it's bad.
    const consoleSpy = jest.spyOn(global.console, 'error').mockImplementation(() => { });
    const consoleSpyInfo = jest.spyOn(global.console, 'info').mockImplementation(() => { });
    await mongo.connect('tries', 'any_or_throw_error');
    consoleSpy.mockRestore();
    consoleSpyInfo.mockRestore();
  });
  it('Lost connection', async () => {
    const consoleSpy = jest.spyOn(global.console, 'error').mockImplementation(() => {});
    const consoleSpyInfo = jest.spyOn(global.console, 'info').mockImplementation(() => { });
    await mongo.connect('tries', 'any_or_throw_error');
    mongo.collection('collection_name');
    // now lost the connection
    await closeEvent();
    // now test get collection
    mongo.collection('collection_name');
    consoleSpyInfo.mockRestore();
    consoleSpy.mockRestore();
  });
  it('should get collection', async () => {
    const collection = await mongo.collection('test');
    expect(collection).toBe('success-test');
  });

  it('should throw when db is not instanciate', async () => {
    delete mongo.client;
    expect(() => mongo.collection('test')).toThrowError('DB not instanciate: call mongo.connect(url) before');
  });
  it('should getID', async () => {
    mongo.getID();
    expect(ObjectID).toHaveBeenCalledTimes(1);
    // @ts-ignore
    ObjectID.mockReset();
  });
  it('should getID', async () => {
    mongo.getID('123456');
    expect(ObjectID).toHaveBeenCalledTimes(1);
    expect(ObjectID).toHaveBeenCalledWith('123456');
    // @ts-ignore
    ObjectID.mockReset();
  });
  it('should close', async () => {
    await mongo.connect('tries', 'any_or_throw_error');
    expect(mongo.gracefull_close).toBe(false);
    await mongo.close();
    expect(mongo.client.close).toHaveBeenCalledTimes(1);
    expect(mongo.gracefull_close).toBe(true);
  });
});
