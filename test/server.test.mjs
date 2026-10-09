import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { createApp } from '../server.mjs';
import { Script } from 'node:vm';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const enquiry=()=>({name:'Demo Customer',email:'demo@example.com',phone:'+91 90000 00000',projectType:'Residential interiors',message:'This is an automated demo enquiry.',website:'',requestId:randomUUID()});
async function start(server){await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return `http://127.0.0.1:${server.address().port}`;}
async function stop(server){await new Promise(resolve=>server.close(resolve));}
async function post(url,body,headers={}){return fetch(url+'/api/contact',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});}

test('database persists, retries deduplicate, input is parameterized, and records are private',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'willys-test-'));
  const dbPath=path.join(dir,'enquiries.sqlite');
  let server=createApp({dbPath});
  let url=await start(server);
  try {
    const body=enquiry();body.name="O'Brien'); DROP TABLE enquiries; --";
    const first=await post(url,body);assert.equal(first.status,201);const saved=await first.json();assert.equal(saved.ok,true);
    const retry=await post(url,body);assert.equal(retry.status,200);assert.equal((await retry.json()).id,saved.id);
    assert.equal((await post(url,{...body,message:'Changed contents should conflict.'})).status,409);
    await stop(server);server=createApp({dbPath});url=await start(server);
    const afterRestart=await post(url,body);assert.equal((await afterRestart.json()).id,saved.id);
    const db=new DatabaseSync(dbPath,{readOnly:true});
    assert.equal(db.prepare('SELECT count(*) AS n FROM enquiries').get().n,1);
    assert.equal(db.prepare('SELECT name FROM enquiries').get().name,body.name);db.close();
    for(const route of ['/data/enquiries.sqlite','/.git/config','/server.mjs','/api/enquiries','/%2e%2e%2fserver.mjs']) assert.equal((await fetch(url+route)).status,404,route);
    assert.equal((await fetch(url+'/api/contact')).status,405);
  } finally {await stop(server);await rm(dir,{recursive:true,force:true});}
});

test('validation, malformed input, body limits, origin restriction and rate limit',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'willys-test-'));
  const server=createApp({dbPath:path.join(dir,'enquiries.sqlite'),rateLimit:7});const url=await start(server);
  try {
    assert.equal((await post(url,{...enquiry(),email:'invalid'})).status,422);
    assert.equal((await post(url,{...enquiry(),phone:'abc'})).status,422);
    assert.equal((await post(url,{...enquiry(),message:'x'})).status,422);
    assert.equal((await post(url,{...enquiry(),website:'spam'})).status,400);
    assert.equal((await fetch(url+'/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'})).status,400);
    assert.equal((await post(url,{...enquiry(),message:'x'.repeat(17000)})).status,413);
    assert.equal((await post(url,enquiry(),{'Sec-Fetch-Site':'cross-site'})).status,403);
    assert.equal((await fetch(url+'/api/contact',{method:'POST',body:'hello'})).status,415);
    assert.equal((await post(url,enquiry())).status,201);
    const limited=await post(url,enquiry());assert.equal(limited.status,429);assert.ok(limited.headers.get('retry-after'));
  } finally {await stop(server);await rm(dir,{recursive:true,force:true});}
});

test('real static routing, compatibility redirect, missing pages and video ranges',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'willys-test-'));
  const server=createApp({dbPath:path.join(dir,'enquiries.sqlite')});const url=await start(server);
  try {
    assert.equal((await fetch(url+'/api/health')).status,200);
    const home=await fetch(url+'/');assert.equal(home.status,200);assert.match(home.headers.get('content-type'),/text\/html/);
    const redirect=await fetch(url+'/pages/portfolio.html',{redirect:'manual'});assert.equal(redirect.status,308);assert.equal(redirect.headers.get('location'),'/pages/Portfolio.html');
    const portfolio=await fetch(url+'/pages/Portfolio.html');assert.equal(portfolio.status,200);assert.match(await portfolio.text(),/Portfolio/);
    assert.equal((await fetch(url+'/missing-page.html')).status,404);
    const video=await fetch(url+'/hero_imgs/Project-1.mp4',{headers:{Range:'bytes=0-99'}});assert.equal(video.status,206);assert.equal((await video.arrayBuffer()).byteLength,100);
    assert.equal((await fetch(url+'/hero_imgs/Project-1.mp4',{headers:{Range:'bytes=999999999-'}})).status,416);
  } finally {await stop(server);await rm(dir,{recursive:true,force:true});}
});

test('release pages contain no merge markers, broken local src/href links or invalid inline JavaScript',async()=>{
  const pub=path.join(root,'public');
  const files=['index.html',...(await readdir(path.join(pub,'pages'))).filter(n=>n.endsWith('.html')).map(n=>'pages/'+n)];
  const exactPaths=new Set();
  async function walk(dir,prefix='') {for(const entry of await readdir(dir,{withFileTypes:true})){const n=prefix+entry.name;if(entry.isDirectory())await walk(path.join(dir,entry.name),n+'/');else exactPaths.add(n);}}
  await walk(pub);
  for(const file of files){
    const text=await readFile(path.join(pub,file),'utf8');
    assert.doesNotMatch(text,/^\s*(<<<<<<< |>>>>>>> |=======$)/m,file);
    const clean=text.replace(/<!--[\s\S]*?-->/g,'');
    for(const match of clean.matchAll(/\b(?:src|href)\s*=\s*(["'])(.*?)\1/g)){
      const ref=match[2].replaceAll('&#038;','&').replaceAll('&amp;','&');
      if(/^(https?:|\/\/|#|mailto:|tel:|data:|javascript:)/.test(ref))continue;
      const target=decodeURIComponent(new URL(ref,'https://local/'+file).pathname).slice(1);
      assert.ok(target==='' || exactPaths.has(target),`${file}: missing ${target}`);
    }
    for(const match of clean.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
      const type=/type=['"]([^'"]+)/.exec(match[1])?.[1];
      if(type && !['text/javascript','application/javascript'].includes(type))continue;
      assert.doesNotThrow(()=>new Script(match[2]),file+' inline script');
    }
  }
  for(const name of await readdir(path.join(pub,'JS'))) if(name.endsWith('.js')) {
    const script=await readFile(path.join(pub,'JS',name),'utf8');
    assert.doesNotMatch(script,/^\s*(<<<<<<< |>>>>>>> |=======$)/m,name);
    assert.doesNotThrow(()=>new Script(script),name);
  }
});
