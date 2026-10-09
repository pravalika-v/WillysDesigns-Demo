import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { createDatabase } from '../database.mjs';
import { createApp } from '../server.mjs';

function transport() {
 const db=new DatabaseSync(':memory:');
 const calls=[];
 return {calls,close:()=>db.close(),fetch:async(url,options)=>{
  assert.equal(url,'https://demo.turso.io/v2/pipeline');
  assert.equal(options.headers.Authorization,'Bearer test-token');
  assert.equal(options.redirect,'error');assert.ok(options.signal);
  const payload=JSON.parse(options.body);assert.equal(payload.requests.at(-1).type,'close');
  const {sql,args}=payload.requests[0].stmt;calls.push(sql);
  const statement=db.prepare(sql);const values=args.map(a=>a.type==='null'?null:a.value);
  const cols=statement.columns().map(c=>({name:c.name}));
  let rows=[],affected=0;
  if(cols.length)rows=statement.all(...values).map(row=>cols.map(c=>row[c.name]===null?{type:'null'}:{type:typeof row[c.name]==='number'?'integer':'text',value:String(row[c.name])}));
  else affected=Number(statement.run(...values).changes);
  return Response.json({results:[{type:'ok',response:{type:'execute',result:{cols,rows,affected_row_count:affected}}},{type:'ok',response:{type:'close'}}]});
 }};
}
const data=()=>({name:"Demo O'Brien",email:'demo@example.com',phone:'9000000000',projectType:'',message:'A sample remote database test.',requestId:randomUUID(),website:''});

test('Turso HTTP protocol: initialization, bound values, concurrent retry and read tools',async()=>{
 const remote=transport();const db=createDatabase({provider:'turso',url:'libsql://demo.turso.io',token:'test-token',fetchImpl:remote.fetch});
 try {
  await db.health();const body=data();
  const result=await Promise.all([db.save(body,randomUUID()),db.save(body,randomUUID())]);
  assert.equal(result.filter(r=>r.created).length,1);assert.equal(result[0].record.id,result[1].record.id);
  const rows=await db.list();assert.equal(rows.length,1);assert.equal(rows[0].name,body.name);
  assert.ok(remote.calls.some(s=>s.includes('ON CONFLICT')));
 }finally{db.close();remote.close();}
});

test('invalid Turso configuration fails closed; remote errors do not leak tokens',async()=>{
 assert.throws(()=>createDatabase({provider:'other'}),/DB_PROVIDER/);
 assert.throws(()=>createDatabase({provider:'turso',url:'https://demo.turso.io',token:''}),/requires/);
 assert.throws(()=>createDatabase({provider:'turso',url:'http://demo.turso.io',token:'test-token'}),/HTTPS/);
 for(const fetchImpl of [async()=>new Response('secret-token',{status:401}),async()=>Response.json({results:[{type:'error',error:{message:'secret-token'}}]}),async()=>{throw new Error('network error');}]) {
  const db=createDatabase({provider:'turso',url:'https://demo.turso.io',token:'secret-token',fetchImpl});
  await assert.rejects(db.ready);db.close();
 }
});

test('contact endpoint awaits remote commits and preserves retry IDs across server instances',async()=>{
 const remote=transport();const options={databaseOptions:{provider:'turso',url:'https://demo.turso.io',token:'test-token',fetchImpl:remote.fetch}};
 let server=createApp(options);await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const send=body=>fetch(`http://127.0.0.1:${server.address().port}/api/contact`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 try {
  const body=data();const response=await send(body);assert.equal(response.status,201);const saved=await response.json();
  await new Promise(r=>server.close(r));server=createApp(options);await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const retry=await send(body);assert.equal(retry.status,200);assert.equal((await retry.json()).id,saved.id);
  assert.equal((await send({...body,message:'A different test message.'})).status,409);
 }finally{await new Promise(r=>server.close(r));remote.close();}
});

test('failed remote writes never return a successful contact receipt',async()=>{
 const remote=transport();
 const server=createApp({databaseOptions:{provider:'turso',url:'https://demo.turso.io',token:'test-token',fetchImpl:(url,options)=>JSON.parse(options.body).requests[0].stmt.sql.startsWith('INSERT')?Promise.resolve(new Response('do not expose',{status:503})):remote.fetch(url,options)}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const response=await fetch(`http://127.0.0.1:${server.address().port}/api/contact`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data())});assert.equal(response.status,500);const result=await response.json();assert.equal(result.ok,false);assert.equal(result.id,undefined);assert.doesNotMatch(JSON.stringify(result),/test-token|do not expose/);}
 finally{await new Promise(r=>server.close(r));remote.close();}
});
