import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import type {IncomingMessage,ServerResponse} from 'node:http';
import type {Plugin} from 'vite';

const COOKIE='hritamm_studio';
const SESSION_SECONDS=8*60*60;
const hosts=new Set(['localhost','127.0.0.1','::1']);
const addresses=new Set(['127.0.0.1','::1','::ffff:127.0.0.1']);
const hash=(value:string)=>createHash('sha256').update(value).digest();
const sessions=new Map<string,number>();
let failures=0,blockedUntil=0;
let loginRequests=0,loginWindowEnds=0;

// Local preview only. This middleware is never part of the published Worker.
// It supplies identity only after a password login from the same laptop.
export function localStudio({enabled}:{enabled:boolean}):Plugin{
  return {name:'private-local-studio',configureServer(server){
    if(!enabled)return;
    let password='';
    try{password=readFileSync(resolve(server.config.root,'.sites-runtime/local-studio-password'),'utf8').trim()}catch{}
    const secure=Boolean(server.config.server.https);
    server.middlewares.use(async(req,res,next)=>{
      for(const key of Object.keys(req.headers))if(key.startsWith('oai-authenticated-user-'))removeHeader(req,key);
      let url:URL;
      try{url=new URL(req.url??'/',`${secure?'https':'http'}://${req.headers.host}`)}catch{next();return}
      const endpoint=url.pathname==='/api/admin/local-session';
      const loopback=hosts.has(url.hostname.replace(/^\[|\]$/g,''))&&addresses.has(req.socket.remoteAddress??'');
      if(!loopback){if(endpoint)reply(res,403);else next();return}
      for(const [key,expires] of sessions)if(expires<Date.now())sessions.delete(key);
      const cookies=(req.headers.cookie??'').split(';').map(s=>s.trim()).filter(s=>s.startsWith(COOKIE+'='));
      const token=cookies.length===1?cookies[0].slice(COOKIE.length+1):'';
      if(!endpoint){
        if(token&&sessions.has(token)){
          setHeader(req,'oai-authenticated-user-id','local-studio-owner');
          setHeader(req,'oai-authenticated-user-email','sarkarhritammofficial@gmail.com');
          setHeader(req,'oai-authenticated-user-full-name','Hritamm%20Sarkar');
          setHeader(req,'oai-authenticated-user-full-name-encoding','percent-encoded-utf-8');
        }
        next();return;
      }
      if(req.method!=='POST'){res.setHeader('Allow','POST');reply(res,405);return}
      if(req.headers.origin!==url.origin||req.headers['sec-fetch-site']==='cross-site'){reply(res,403);return}
      const cookie=(value:string,maxAge:number)=>`${COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Strict${secure?'; Secure':''}`;
      const redirect=(path:string)=>{res.statusCode=303;res.setHeader('Location',path);res.setHeader('Cache-Control','private, no-store');res.end()};
      if(url.searchParams.get('logout')==='1'){
        sessions.delete(token);res.setHeader('Set-Cookie',cookie('',0));redirect('/admin');return;
      }
      if(!password||password.length<20){reply(res,503);return}
      const now=Date.now();
      if(loginWindowEnds<=now){loginRequests=0;loginWindowEnds=now+60_000}
      loginRequests++;
      const retryAt=Math.max(blockedUntil,loginRequests>10?loginWindowEnds:0);
      if(retryAt>now){res.setHeader('Retry-After',String(Math.max(1,Math.ceil((retryAt-now)/1000))));reply(res,429,'Too many sign-in attempts. Wait a minute, then return to the studio and try again.');return}
      if(req.headers['content-type']?.split(';',1)[0].trim().toLowerCase()!=='application/x-www-form-urlencoded'){reply(res,415);return}
      const length=req.headers['content-length'];
      if(length!==undefined&&(!/^\d+$/.test(length)||!Number.isSafeInteger(Number(length)))){reply(res,400);return}
      if(length!==undefined&&Number(length)>4096){reply(res,413);return}
      try{
        const parts:Buffer[]=[];let size=0;
        for await(const chunk of req){const bytes=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);size+=bytes.length;if(size>4096){reply(res,413);return}parts.push(bytes)}
        const fields=new URLSearchParams(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(parts)));
        if(Array.from(fields.keys()).length!==1||fields.getAll('password').length!==1){reply(res,400);return}
        const candidate=fields.get('password')??'';
        if(candidate.length===0||candidate.length>512){reply(res,400);return}
        if(!timingSafeEqual(hash(candidate),hash(password))){
          failures++;if(failures>=5){blockedUntil=Date.now()+60_000;failures=0}
          redirect('/admin?error=password');return;
        }
        failures=0;blockedUntil=0;
        if(token)sessions.delete(token);
        if(sessions.size>=16)sessions.delete(sessions.keys().next().value!);
        const session=randomBytes(32).toString('base64url');sessions.set(session,Date.now()+SESSION_SECONDS*1000);
        res.setHeader('Set-Cookie',cookie(session,SESSION_SECONDS));redirect('/admin');
      }catch{reply(res,400)}
    });
  }};
}

function removeHeader(req:IncomingMessage,name:string){
  delete req.headers[name];
  for(let i=req.rawHeaders.length-2;i>=0;i-=2)if(req.rawHeaders[i]?.toLowerCase()===name)req.rawHeaders.splice(i,2);
}
function setHeader(req:IncomingMessage,name:string,value:string){removeHeader(req,name);req.headers[name]=value;req.rawHeaders.push(name,value)}
function reply(res:ServerResponse,status:number,message=''){res.statusCode=status;res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Type','text/plain; charset=utf-8');res.end(message)}
