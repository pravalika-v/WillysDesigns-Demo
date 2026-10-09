import { createDatabase } from '../database.mjs';
const db=createDatabase({initialize:false});
try { console.log(JSON.stringify(await db.list(),null,2)); }
finally { db.close(); }
