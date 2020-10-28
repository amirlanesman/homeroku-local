import Mongo from 'mongodb'
import url from 'url';
import qs from 'qs';

const MongoClient = Mongo.MongoClient

/**
 * @param {string} mongoUrl
 * @param {string} username
 * @param {string} password
 * @param {string} dbName
 */
export async function createUser(mongoUrl, username, password, dbName) {
  const mongoClient = await MongoClient.connect(mongoUrl, { useNewUrlParser: true });
  try {
    const db = mongoClient.db(dbName);
    // @ts-ignore
    await db.addUser(username, password, { roles: ['readWrite'] });
    return createUserMongoUrl(mongoUrl, username, password, dbName);
  } finally {
    await mongoClient.close();
  }
}

/**
 * @param {string} mongoUrl
 * @param {any} username
 * @param {any} password
 * @param {string} dbName
 */
function createUserMongoUrl(mongoUrl, username, password, dbName) {
  const m = url.parse(mongoUrl);
  // m.auth = `${username}:${password}`;
  // m.pathname = dbName;
  const q = qs.parse(m.query);
  q.authSource = dbName;
  // m.query = qs.stringify(q);
  return url.format({protocol: m.protocol, pathname: dbName, auth: `${username}:${password}`, host: m.host, search: '?' + qs.stringify(q), slashes: m.slashes});
}