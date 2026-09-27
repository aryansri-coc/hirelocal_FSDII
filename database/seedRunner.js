import { db } from './db.js';

console.log('--- Resetting & Reseeding HireLocal Database ---');
db.resetToSeed();
console.log('Database successfully re-seeded with demo records!');
process.exit(0);
