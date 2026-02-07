import { MongoClient } from 'mongodb';

/*
 * Requires the MongoDB Node.js Driver
 * https://mongodb.github.io/node-mongodb-native
 */

const filter = {
  'componentName': 'Test Component'
};

const client = await MongoClient.connect(
  'mongodb://cluster0-shard-00-01.b0eqn.mongodb.net,cluster0-shard-00-00.b0eqn.mongodb.net,cluster0-shard-00-02.b0eqn.mongodb.net/?tls=true&authMechanism=MONGODB-X509&authSource=%24external&serverMonitoringMode=poll&maxIdleTimeMS=30000&minPoolSize=0&maxPoolSize=5&maxConnecting=6&replicaSet=atlas-xfevmn-shard-0&appName=Data+Explorer--61cb1a571d0bcb5483122207'
);
const coll = client.db('login-app-db').collection('adminEntryForm');
const result = coll.deleteMany(filter);
await client.close();