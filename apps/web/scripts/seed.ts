// Crea un usuario admin inicial. Uso:
//   MONGODB_URI=... node --experimental-strip-types apps/web/scripts/seed.ts correo@ej.com miPassword
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB || 'xoctickets';
const correo = (process.argv[2] || 'admin@xoc-tickets.com').toLowerCase();
const password = process.argv[3] || 'cambiame123';

const client = new MongoClient(uri);
await client.connect();
const staff = client.db(dbName).collection('staff');
await staff.createIndex({ correo: 1 }, { unique: true });
await staff.updateOne(
  { correo },
  { $set: {
      correo,
      nombre: 'Administrador',
      role: 'admin',
      passwordHash: await bcrypt.hash(password, 10),
      eventIds: [],
      createdAt: new Date()
    } },
  { upsert: true }
);
console.log(`Admin listo: ${correo} (password: ${password})`);
await client.close();
