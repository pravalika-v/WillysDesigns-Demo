import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
export const schema=`CREATE TABLE IF NOT EXISTS enquiries (
 id TEXT PRIMARY KEY, request_id TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL,
 name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL,
 project_type TEXT NOT NULL, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new')`;

export function createDatabase({provider=process.env.DB_PROVIDER || 'sqlite',dbPath=process.env.DB_PATH || path.join(root,'data/enquiries.sqlite'),url=process.env.TURSO_DATABASE_URL,token=process.env.TURSO_AUTH_TOKEN,fetchImpl=fetch,initialize=true}={}) {
 let execute,close=()=>{};
 if(provider==='sqlite') {
  if(initialize) mkdirSync(path.dirname(dbPath),{recursive:true});
  const db=new DatabaseSync(dbPath,{timeout:5000,readOnly:!initialize});
  if(initialize) db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
  execute=async(sql,args=[])=>{const stmt=db.prepare(sql);if(stmt.columns().length)return {rows:stmt.all(...args),affected:0};return {rows:[],affected:Number(stmt.run(...args).changes)};};
  close=()=>db.close();
 } else if(provider==='turso') {
  if(!url || !token) throw new Error('Turso requires TURSO_DATABASE_URL and TURSO_AUTH_TOKEN. No local fallback is used.');
  let endpoint;try{endpoint=new URL(url.replace(/^libsql:/,'https:'));}catch{throw new Error('Invalid TURSO_DATABASE_URL.');}
  if(endpoint.protocol!=='https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || !['','/','/v2/pipeline'].includes(endpoint.pathname))throw new Error('TURSO_DATABASE_URL must be an HTTPS or libsql database URL.');
  endpoint.pathname='/v2/pipeline';
  // Official Turso SQL-over-HTTP protocol; no native dependency or SDK needed.
  execute=async(sql,args=[])=>{
   const response=await fetchImpl(endpoint.href,{method:'POST',redirect:'error',signal:AbortSignal.timeout(10000),headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({requests:[{type:'execute',stmt:{sql,args:args.map(value=>value===null?{type:'null'}:{type:'text',value:String(value)}),want_rows:true}},{type:'close'}]})});
   if(!response.ok)throw Object.assign(new Error('Turso request failed.'),{code:'DATABASE_UNAVAILABLE'});
   const payload=await response.json();const result=payload.results?.[0];
   if(result?.type!=='ok' || result.response?.type!=='execute' || !result.response.result || payload.results.some(item=>item.type==='error'))throw Object.assign(new Error('Turso query failed.'),{code:'DATABASE_QUERY_FAILED'});
   const data=result.response.result;
   return {affected:Number(data.affected_row_count || 0),rows:data.rows.map(row=>Object.fromEntries(data.cols.map((col,index)=>[col.name,row[index].type==='null'?null:row[index].value])))};
  };
 } else throw new Error('DB_PROVIDER must be sqlite or turso.');
 const ready=initialize?execute(schema):Promise.resolve();ready.catch(()=>{});
 return {provider,ready,close,
  async health(){await ready;await execute('SELECT 1');},
  async save(data,id){
   await ready;
   // Unique request_id handles concurrent retries across multiple instances.
   const inserted=await execute(`INSERT INTO enquiries (id,request_id,created_at,name,email,phone,project_type,message) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(request_id) DO NOTHING`,[id,data.requestId,new Date().toISOString(),data.name,data.email,data.phone,data.projectType,data.message]);
   const result=await execute('SELECT * FROM enquiries WHERE request_id = ?',[data.requestId]);
   if(!result.rows[0])throw new Error('Saved enquiry could not be confirmed.');
   return {record:result.rows[0],created:inserted.affected===1};
  },
  async list(){await ready;return (await execute('SELECT id,created_at,name,email,phone,project_type,message,status FROM enquiries ORDER BY created_at DESC LIMIT 100')).rows;}
 };
}
