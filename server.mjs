import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat, realpath } from 'node:fs/promises';

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDatabase } from './database.mjs';
import { randomUUID } from 'node:crypto';

const root = path.dirname(fileURLToPath(import.meta.url));
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.avif':'image/avif', '.webp':'image/webp', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.woff':'font/woff', '.woff2':'font/woff2', '.ttf':'font/ttf', '.eot':'application/vnd.ms-fontobject', '.mp4':'video/mp4' };
const projectTypes = new Set(['', 'Residential interiors', 'Modular kitchen', 'Furniture and decor', 'Commercial interiors', 'Renovation', '2D / 3D layouts']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createApp({ dbPath = process.env.DB_PATH || path.join(root, 'data/enquiries.sqlite'), databaseOptions = {}, publicDir = path.join(root, 'public'), rateLimit = 10, rateWindow = 600_000 } = {}) {
  const db = createDatabase({dbPath,...databaseOptions});
  const buckets = new Map();
  const realPublic = realpath(publicDir);
  function json(res, code, body) {
    res.writeHead(code, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' });
    res.end(JSON.stringify(body));
  }
  function allowed(key) {
    const now = Date.now();
    for (const [ip,b] of buckets) if (b.until <= now) buckets.delete(ip);
    if (!buckets.has(key)) {
      if (buckets.size >= 10_000) return false;
      buckets.set(key, {count:0, until:now + rateWindow});
    }
    return ++buckets.get(key).count <= rateLimit;
  }
  const server = http.createServer(async (req,res) => {
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
    res.setHeader('X-Robots-Tag','noindex, nofollow');
    res.setHeader('Content-Security-Policy', "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/api/health' && req.method === 'GET') {
        await db.health();
        return json(res,200,{ok:true});
      }
      if (url.pathname === '/api/contact') {
        if (req.method !== 'POST') { res.setHeader('Allow','POST'); return json(res,405,{ok:false,error:'Method not allowed.'}); }
        const expectedOrigin = process.env.PUBLIC_ORIGIN;
        if (req.headers['sec-fetch-site'] === 'cross-site' || (expectedOrigin && req.headers.origin && req.headers.origin !== expectedOrigin)) {
          return json(res,403,{ok:false,error:'Please submit using this website.'});
        }
        if (!(req.headers['content-type'] || '').match(/^application\/json(?:;|$)/i)) return json(res,415,{ok:false,error:'JSON is required.'});
        // Default is safe behind an unknown proxy: one shared bucket, never trust arbitrary forwarded headers.
        // Set TRUST_PROXY_HOPS only when the deployment's trusted proxy chain is known.
        const hops = Number(process.env.TRUST_PROXY_HOPS || 0);
        const forwarded = String(req.headers['x-forwarded-for'] || '').split(',').map(s=>s.trim()).filter(Boolean);
        const ip = hops > 0 && forwarded.length >= hops ? forwarded.at(-hops) : req.socket.remoteAddress;
        if (!allowed(ip)) { res.setHeader('Retry-After',String(Math.ceil(rateWindow/1000))); return json(res,429,{ok:false,error:'Too many attempts. Please try again later.'}); }
        if (Number(req.headers['content-length']) > 16384) return json(res,413,{ok:false,error:'Message is too large.'});
        let size=0; const chunks=[];
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 16384) { json(res,413,{ok:false,error:'Message is too large.'}); return; }
          chunks.push(chunk);
        }
        let body;
        try { body=JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return json(res,400,{ok:false,error:'Invalid JSON.'}); }
        if (!body || Array.isArray(body) || typeof body !== 'object') return json(res,400,{ok:false,error:'Invalid enquiry.'});
        if (body.website) return json(res,400,{ok:false,error:'Unable to accept this enquiry.'});
        const limits={name:100,email:254,phone:30,projectType:80,message:2000,requestId:36};
        const data={};
        for(const [key,max] of Object.entries(limits)) {
          if (typeof body[key] !== 'string' || body[key].length > max) return json(res,422,{ok:false,error:`Please check ${key}.`});
          data[key]=body[key].trim();
        }
        if (data.name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || !/^[+\d().\s-]+$/.test(data.phone) || data.phone.replace(/\D/g,'').length < 7 || data.phone.replace(/\D/g,'').length > 15 || data.message.length < 10 || !projectTypes.has(data.projectType) || !uuid.test(data.requestId)) {
          return json(res,422,{ok:false,error:'Enter your name, a valid email and phone number, and a message of at least 10 characters.'});
        }
        const {record,created}=await db.save(data,randomUUID());
        if(record.name!==data.name || record.email!==data.email || record.phone!==data.phone || record.project_type!==data.projectType || record.message!==data.message) return json(res,409,{ok:false,error:'This request reference is already in use. Refresh the page to send a new enquiry.'});
        return json(res,created?201:200,{ok:true,id:record.id});
      }
      if (url.pathname.startsWith('/api/')) return json(res,404,{ok:false,error:'Not found.'});
      if (!['GET','HEAD'].includes(req.method)) { res.setHeader('Allow','GET, HEAD'); return json(res,405,{ok:false,error:'Method not allowed.'}); }
      let pathname;
      try { pathname=decodeURIComponent(url.pathname); } catch { return json(res,400,{ok:false,error:'Invalid path.'}); }
      if(pathname === '/pages/portfolio.html') { res.writeHead(308,{Location:'/pages/Portfolio.html'+url.search}); return res.end(); }
      if(pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').some(p=>p.startsWith('.'))) return json(res,404,{ok:false,error:'Not found.'});
      const base=await realPublic;
      let file;
      try { file=await realpath(path.join(base,pathname === '/' ? 'index.html' : pathname)); } catch { return json(res,404,{ok:false,error:'Page not found.'}); }
      if(!file.startsWith(base+path.sep)) return json(res,404,{ok:false,error:'Not found.'});
      const info=await stat(file);
      if(!info.isFile()) return json(res,404,{ok:false,error:'Not found.'});
      const ext=path.extname(file).toLowerCase();
      if(!types[ext]) return json(res,404,{ok:false,error:'Not found.'});
      res.setHeader('Content-Type',types[ext]);
      res.setHeader('Cache-Control',['.html','.js','.css'].includes(ext) ? 'no-cache' : 'public, max-age=86400');
      res.setHeader('Accept-Ranges','bytes');
      let start=0,end=info.size-1;
      if(req.headers.range && req.method==='GET') {
        const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        if(!match || (!match[1]&&!match[2])) {res.writeHead(416,{'Content-Range':`bytes */${info.size}`});return res.end();}
        if(!match[1]) start=Math.max(0,info.size-Number(match[2]));
        else {start=Number(match[1]); if(match[2]) end=Math.min(end,Number(match[2]));}
        if(start>end || start>=info.size || !Number.isSafeInteger(start)) {res.writeHead(416,{'Content-Range':`bytes */${info.size}`});return res.end();}
        res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${info.size}`);
      }
      res.setHeader('Content-Length',Math.max(0,end-start+1));
      if(req.method==='HEAD' || info.size===0) return res.end();
      const stream=createReadStream(file,{start,end});
      stream.on('error',()=>res.destroy()); res.on('close',()=>stream.destroy()); stream.pipe(res);
    } catch(error) {
      console.error('Request failed:',error.code || error.name);
      if(!res.headersSent) json(res,500,{ok:false,error:'Unable to save your enquiry. Please try again later.'});
      else res.destroy();
    }
  });
  server.requestTimeout=20_000;
  server.headersTimeout=15_000;
  server.on('close',()=>db.close());
  server.ready=db.ready;
  return server;
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const server=createApp();
  await server.ready;
  server.listen(Number(process.env.PORT || 3000),'0.0.0.0',()=>console.log(`WillysDesigns listening on port ${server.address().port}`));
  for(const signal of ['SIGTERM','SIGINT']) process.on(signal,()=>server.close(()=>process.exit(0)));
}
