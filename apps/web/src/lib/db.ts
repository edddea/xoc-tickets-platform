import { MongoClient, Db } from 'mongodb';

// Cliente singleton de MongoDB (reutilizado entre invocaciones serverless).
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'xoctickets';

if (!uri) throw new Error('Falta MONGODB_URI en las variables de entorno');

let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  // En dev reutilizamos la conexión a través del global para evitar
  // abrir una por cada hot-reload.
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri).connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = new MongoClient(uri).connect();
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}

// Helpers de colecciones
export async function col(name: string) {
  return (await getDb()).collection(name);
}
